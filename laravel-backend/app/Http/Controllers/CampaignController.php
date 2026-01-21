<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Models\DataCollection;
use App\Models\Device;
use App\Models\Flow;
use App\Models\WorkflowJob;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CampaignController extends Controller
{
    /**
     * Display campaigns list
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $campaigns = Campaign::where('user_id', $userId)
            ->with([
                'dataCollection:id,name,icon,color,total_records',
                'workflows:id,name',
                'devices:id,name,status,socket_connected',
            ])
            ->withCount('jobs')
            ->orderBy('updated_at', 'desc')
            ->paginate(12)
            ->withQueryString();

        // Stats
        $stats = [
            'total' => Campaign::where('user_id', $userId)->count(),
            'active' => Campaign::where('user_id', $userId)->where('status', 'active')->count(),
            'draft' => Campaign::where('user_id', $userId)->where('status', 'draft')->count(),
            'completed' => Campaign::where('user_id', $userId)->where('status', 'completed')->count(),
        ];

        return Inertia::render('Campaigns/Index', [
            'campaigns' => $campaigns,
            'stats' => $stats,
        ]);
    }

    /**
     * Show create form data
     */
    public function create(Request $request)
    {
        $userId = $request->user()->id;

        return Inertia::render('Campaigns/Create', [
            'dataCollections' => DataCollection::where('user_id', $userId)
                ->withCount('records')
                ->orderBy('name')
                ->get(['id', 'name', 'icon', 'color', 'schema']),
            'workflows' => Flow::where('user_id', $userId)
                ->orderBy('name')
                ->get(['id', 'name', 'description']),
            'devices' => Device::where('user_id', $userId)
                ->orderBy('name')
                ->get(['id', 'name', 'model', 'status', 'socket_connected']),
        ]);
    }

    /**
     * Store new campaign
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:10',
            'color' => 'nullable|string|max:20',
            'data_collection_id' => 'nullable|exists:data_collections,id', // Optional - data linked in workflow's DataSource node
            'workflow_ids' => 'required|array|min:1',
            'workflow_ids.*' => 'exists:flows,id',
            'device_ids' => 'required|array|min:1',
            'device_ids.*' => 'exists:devices,id',
            'execution_mode' => 'nullable|in:sequential,parallel',
            'records_per_batch' => 'nullable|integer|min:1|max:100',
            'repeat_per_record' => 'nullable|integer|min:1|max:100',
            'record_filter' => 'nullable|array',
            'data_config' => 'nullable|array',
            'data_config.primary' => 'nullable|array',
            'data_config.primary.collection_id' => 'nullable|exists:data_collections,id',
            'data_config.pools' => 'nullable|array',
            'records_per_device' => 'nullable|integer|min:1',
        ]);

        $campaign = Campaign::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? '🌱',
            'color' => $validated['color'] ?? '#8b5cf6',
            'data_collection_id' => $validated['data_config']['primary']['collection_id']
                ?? $validated['data_collection_id'] ?? null,
            'execution_mode' => $validated['execution_mode'] ?? 'sequential',
            'records_per_batch' => $validated['records_per_batch'] ?? 10,
            'records_per_device' => $validated['records_per_device'] ?? null,
            'repeat_per_record' => $validated['repeat_per_record'] ?? 1,
            'record_filter' => $validated['record_filter'] ?? null,
            'data_config' => $validated['data_config'] ?? null,
            'status' => Campaign::STATUS_DRAFT,
        ]);

        // Attach workflows with sequence
        foreach ($validated['workflow_ids'] as $index => $workflowId) {
            $campaign->workflows()->attach($workflowId, ['sequence' => $index]);
        }

        // Attach devices
        $campaign->devices()->attach($validated['device_ids']);

        // Sync record count
        $campaign->syncTotalRecords();

        return redirect()->route('campaigns.show', $campaign)
            ->with('success', 'Campaign đã được tạo!');
    }

    /**
     * Show campaign detail
     */
    public function show(Campaign $campaign)
    {
        $this->authorize('view', $campaign);

        $campaign->load([
            'dataCollection.records' => fn($q) => $q->take(10),
            'workflows',
            'devices',
            'jobs' => fn($q) => $q->latest()->take(20),
        ]);

        return Inertia::render('Campaigns/Show', [
            'campaign' => $campaign,
        ]);
    }

    /**
     * Update campaign
     */
    public function update(Request $request, Campaign $campaign)
    {
        $this->authorize('update', $campaign);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:10',
            'color' => 'nullable|string|max:20',
            'execution_mode' => 'nullable|in:sequential,parallel',
            'records_per_batch' => 'nullable|integer|min:1|max:100',
            'repeat_per_record' => 'nullable|integer|min:1|max:100',
            'status' => 'nullable|in:draft,active,paused',
        ]);

        $campaign->update($validated);

        return back()->with('success', 'Campaign đã cập nhật!');
    }

    /**
     * Delete campaign
     */
    public function destroy(Campaign $campaign)
    {
        $this->authorize('delete', $campaign);

        $campaign->delete();

        return redirect()->route('campaigns.index')
            ->with('success', 'Campaign đã xóa!');
    }

    /**
     * Run campaign - create chain jobs for records
     * Each job = 1 record + workflow chain executed on 1 device
     */
    public function run(Request $request, Campaign $campaign)
    {
        $this->authorize('update', $campaign);

        // Get online devices assigned to campaign
        $devices = $campaign->devices()
            ->where(function ($q) {
                $q->where('socket_connected', true)
                    ->orWhere('status', 'online');
            })
            ->get();

        if ($devices->isEmpty()) {
            return back()->with('error', 'Không có thiết bị online để chạy campaign!');
        }

        // Get workflows sorted by sequence
        $workflows = $campaign->workflows->sortBy('pivot.sequence');
        if ($workflows->isEmpty()) {
            return back()->with('error', 'Campaign chưa có workflow nào!');
        }

        // Build workflow chain (array of workflow IDs)
        $workflowChain = $workflows->pluck('id')->toArray();

        // Get record IDs to process
        $recordIds = $this->getFilteredRecordIds($campaign);
        $totalRecords = count($recordIds);
        $deviceCount = $devices->count();

        // If no data collection, create 1 job per device with workflow chain
        if ($totalRecords === 0 && !$campaign->data_collection_id) {
            foreach ($devices as $device) {
                WorkflowJob::create([
                    'user_id' => $campaign->user_id,
                    'flow_id' => $workflows->first()->id, // Primary workflow for display
                    'device_id' => $device->id,
                    'campaign_id' => $campaign->id,
                    'workflow_chain' => $workflowChain,
                    'current_workflow_index' => 0,
                    'name' => "{$campaign->name}",
                    'status' => WorkflowJob::STATUS_PENDING,
                    'priority' => 5,
                    'max_retries' => 3,
                ]);
            }
        } else {
            // Calculate records per device
            $recordsPerDevice = $campaign->records_per_device
                ?? (int) ceil($totalRecords / $deviceCount);

            // Track how many records assigned to current device
            $deviceIndex = 0;
            $recordsAssignedToDevice = 0;
            $repeatCount = $campaign->repeat_per_record ?: 1;

            foreach ($recordIds as $recordId) {
                // Get current device
                $device = $devices[$deviceIndex % $deviceCount];

                // Create job(s) for this record
                for ($r = 0; $r < $repeatCount; $r++) {
                    // Build pool context (random comments, media, etc.)
                    $poolContext = $this->buildJobContext($campaign);

                    WorkflowJob::create([
                        'user_id' => $campaign->user_id,
                        'flow_id' => $workflows->first()->id, // Primary workflow
                        'device_id' => $device->id,
                        'campaign_id' => $campaign->id,
                        'data_collection_id' => $campaign->data_collection_id,
                        'data_record_id' => $recordId,      // 1 record per job
                        'workflow_chain' => $workflowChain, // Full chain
                        'current_workflow_index' => 0,
                        'chain_context' => $poolContext,    // Pool data for loops
                        'name' => "{$campaign->name} - Record #{$recordId}" . ($repeatCount > 1 ? " (Run " . ($r + 1) . ")" : ""),
                        'status' => WorkflowJob::STATUS_PENDING,
                        'priority' => 5,
                        'max_retries' => 3,
                    ]);
                }

                $recordsAssignedToDevice++;

                // Move to next device when limit reached
                if ($recordsAssignedToDevice >= $recordsPerDevice) {
                    $deviceIndex++;
                    $recordsAssignedToDevice = 0;

                    // Stop if no more devices available
                    if ($deviceIndex >= $deviceCount) {
                        break;
                    }
                }
            }
        }

        // Update campaign status
        $campaign->update([
            'status' => Campaign::STATUS_ACTIVE,
            'last_run_at' => now(),
            'total_records' => $totalRecords,
            'records_processed' => 0,
        ]);

        $jobCount = $campaign->jobs()->where('status', WorkflowJob::STATUS_PENDING)->count();

        return back()->with('success', "🚀 Campaign đã bắt đầu! Tạo {$jobCount} jobs.");
    }

    /**
     * Get filtered record IDs based on campaign's record_filter
     */
    protected function getFilteredRecordIds(Campaign $campaign): array
    {
        if (!$campaign->data_collection_id) {
            return [];
        }

        $collection = $campaign->dataCollection;
        if (!$collection) {
            return [];
        }

        $query = $collection->records();
        $filter = $campaign->record_filter;

        if (!$filter) {
            // Default: all records
            return $query->pluck('id')->toArray();
        }

        $type = $filter['type'] ?? 'all';
        $value = $filter['value'] ?? null;

        switch ($type) {
            case 'limit':
                // First N records
                return $query->take((int) $value)->pluck('id')->toArray();

            case 'ids':
                // Specific record IDs
                return is_array($value) ? $value : [];

            default:
                // All records
                return $query->pluck('id')->toArray();
        }
    }

    /**
     * Build initial context for a job based on data_config pools
     * This fetches pool data (e.g., random comments, media) for the job
     */
    protected function buildJobContext(Campaign $campaign): ?array
    {
        $dataConfig = $campaign->data_config;
        if (!$dataConfig || empty($dataConfig['pools'])) {
            return null;
        }

        $context = [];

        foreach ($dataConfig['pools'] as $pool) {
            $variable = $pool['variable'] ?? null;
            $collectionId = $pool['collection_id'] ?? null;
            $field = $pool['field'] ?? null;
            $count = $pool['count'] ?? 1;
            $mode = $pool['mode'] ?? 'random';

            if (!$variable || !$collectionId) {
                continue;
            }

            $collection = DataCollection::find($collectionId);
            if (!$collection) {
                continue;
            }

            $query = $collection->records();

            // Apply mode
            if ($mode === 'random') {
                $query->inRandomOrder();
            }

            $records = $query->take($count)->get();

            // Extract field values or full records
            if ($field) {
                $context[$variable] = $records->map(fn($r) => $r->data[$field] ?? null)->filter()->values()->toArray();
            } else {
                $context[$variable] = $records->map(fn($r) => $r->data)->toArray();
            }
        }

        return empty($context) ? null : $context;
    }

    /**
     * Pause campaign
     */
    public function pause(Campaign $campaign)
    {
        $this->authorize('update', $campaign);

        $campaign->update(['status' => Campaign::STATUS_PAUSED]);

        return back()->with('success', 'Campaign đã tạm dừng!');
    }
}
