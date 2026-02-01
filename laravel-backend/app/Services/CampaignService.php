<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\DataCollection;
use App\Models\Device;
use App\Models\Flow;
use App\Models\User;
use App\Models\WorkflowJob;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CampaignService
{
    /**
     * Get paginated campaigns for user
     */
    public function getCampaignsForUser(User $user, int $perPage = 12): LengthAwarePaginator
    {
        return Campaign::where('user_id', $user->id)
            ->with([
                'dataCollection:id,name,icon,color,total_records',
                'workflows:id,name',
                'devices:id,name,status,socket_connected',
            ])
            ->withCount('jobs')
            ->orderBy('updated_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Get campaign statistics for user
     */
    public function getCampaignStats(User $user): array
    {
        return [
            'total' => Campaign::where('user_id', $user->id)->count(),
            'active' => Campaign::where('user_id', $user->id)->where('status', 'active')->count(),
            'draft' => Campaign::where('user_id', $user->id)->where('status', 'draft')->count(),
            'completed' => Campaign::where('user_id', $user->id)->where('status', 'completed')->count(),
        ];
    }

    /**
     * Get resources for campaign creation
     */
    public function getCreateResources(User $user): array
    {
        return [
            'dataCollections' => DataCollection::where('user_id', $user->id)
                ->withCount('records')
                ->orderBy('name')
                ->get(['id', 'name', 'icon', 'color', 'schema']),
            'workflows' => Flow::where('user_id', $user->id)
                ->orderBy('name')
                ->get(['id', 'name', 'description']),
            'devices' => Device::where('user_id', $user->id)
                ->orderBy('name')
                ->get(['id', 'name', 'model', 'status', 'socket_connected']),
        ];
    }

    /**
     * Create a new campaign
     */
    public function createCampaign(User $user, array $validated): Campaign
    {
        $campaign = Campaign::create([
            'user_id' => $user->id,
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
            'device_record_assignments' => $validated['device_record_assignments'] ?? null,
            'status' => Campaign::STATUS_DRAFT,
        ]);

        // Attach workflows
        $this->attachWorkflows($campaign, $validated);

        // Attach devices
        $this->attachDevices($campaign, $validated);

        // Sync record count
        $campaign->syncTotalRecords();

        return $campaign;
    }

    /**
     * Attach workflows to campaign
     */
    protected function attachWorkflows(Campaign $campaign, array $validated): void
    {
        if (isset($validated['workflow_configs'])) {
            foreach ($validated['workflow_configs'] as $config) {
                $campaign->workflows()->attach($config['flow_id'], [
                    'sequence' => $config['sequence'],
                    'repeat_count' => $config['repeat_count'],
                    'execution_mode' => $config['execution_mode'],
                    'delay_between_repeats' => $config['delay_between_repeats'] ?? null,
                    'variable_source_collection_id' => $config['variable_source_collection_id'] ?? null,
                    'iteration_strategy' => $config['iteration_strategy'] ?? 'sequential',
                ]);
            }
        } else {
            foreach ($validated['workflow_ids'] as $index => $workflowId) {
                $campaign->workflows()->attach($workflowId, [
                    'sequence' => $index,
                    'repeat_count' => 1,
                    'execution_mode' => 'once',
                    'delay_between_repeats' => null,
                ]);
            }
        }
    }

    /**
     * Attach devices to campaign
     */
    protected function attachDevices(Campaign $campaign, array $validated): void
    {
        $deviceCollectionAssignments = $validated['device_collection_assignments'] ?? [];

        foreach ($validated['device_ids'] as $deviceId) {
            $campaign->devices()->attach($deviceId, [
                'data_collection_id' => $deviceCollectionAssignments[$deviceId] ?? null,
            ]);
        }
    }

    /**
     * Run a campaign - generate workflow jobs
     */
    public function runCampaign(Campaign $campaign): array
    {
        // Get online devices
        $devices = $campaign->devices()
            ->where(function ($q) {
                $q->where('socket_connected', true)
                    ->orWhere('status', 'online');
            })
            ->get();

        if ($devices->isEmpty()) {
            return ['success' => false, 'error' => 'Không có thiết bị online để chạy campaign!'];
        }

        // Get workflows sorted by sequence
        $workflows = $campaign->workflows->sortBy('pivot.sequence');
        if ($workflows->isEmpty()) {
            return ['success' => false, 'error' => 'Campaign chưa có workflow nào!'];
        }

        // Get record IDs to process
        $recordIds = $this->getFilteredRecordIds($campaign);
        $totalRecords = count($recordIds);

        // Generate jobs
        if ($totalRecords === 0 && !$campaign->data_collection_id) {
            $this->generateJobsWithoutData($campaign, $devices, $workflows);
        } else {
            $this->generateJobsWithData($campaign, $devices, $workflows, $recordIds);
        }

        // Update campaign status
        $campaign->update([
            'status' => Campaign::STATUS_ACTIVE,
            'last_run_at' => now(),
            'total_records' => $totalRecords,
            'records_processed' => 0,
        ]);

        $jobCount = $campaign->jobs()->where('status', WorkflowJob::STATUS_PENDING)->count();

        return ['success' => true, 'job_count' => $jobCount];
    }

    /**
     * Generate jobs without data collection
     */
    protected function generateJobsWithoutData(Campaign $campaign, $devices, $workflows): void
    {
        foreach ($devices as $device) {
            foreach ($workflows as $workflow) {
                WorkflowJob::create([
                    'user_id' => $campaign->user_id,
                    'flow_id' => $workflow->id,
                    'device_id' => $device->id,
                    'campaign_id' => $campaign->id,
                    'workflow_chain' => [$workflow->id],
                    'current_workflow_index' => 0,
                    'name' => "{$campaign->name} - {$workflow->name}",
                    'status' => WorkflowJob::STATUS_PENDING,
                    'priority' => 5,
                    'max_retries' => 3,
                ]);
            }
        }
    }

    /**
     * Generate jobs with data collection
     */
    protected function generateJobsWithData(Campaign $campaign, $devices, $workflows, array $recordIds): void
    {
        $assignments = $campaign->device_record_assignments;

        if ($assignments && !empty($assignments)) {
            $this->generateJobsManualAssignment($campaign, $devices, $workflows, $recordIds, $assignments);
        } else {
            $this->generateJobsAutoAssignment($campaign, $devices, $workflows, $recordIds);
        }
    }

    /**
     * Manual device-record assignment
     */
    protected function generateJobsManualAssignment(Campaign $campaign, $devices, $workflows, array $recordIds, array $assignments): void
    {
        foreach ($assignments as $deviceId => $assignedRecordIds) {
            $device = $devices->firstWhere('id', (int) $deviceId);
            if (!$device)
                continue;

            $validRecordIds = array_intersect($assignedRecordIds, $recordIds);

            foreach ($validRecordIds as $recordId) {
                $this->createJobsForRecord($campaign, $device, $workflows, $recordId);
            }
        }
    }

    /**
     * Auto round-robin assignment
     */
    protected function generateJobsAutoAssignment(Campaign $campaign, $devices, $workflows, array $recordIds): void
    {
        $deviceCount = $devices->count();
        $recordsPerDevice = $campaign->records_per_device ?? (int) ceil(count($recordIds) / $deviceCount);

        $deviceIndex = 0;
        $recordsAssignedToDevice = 0;

        foreach ($recordIds as $recordId) {
            $device = $devices[$deviceIndex % $deviceCount];
            $this->createJobsForRecord($campaign, $device, $workflows, $recordId);

            $recordsAssignedToDevice++;

            if ($recordsAssignedToDevice >= $recordsPerDevice) {
                $deviceIndex++;
                $recordsAssignedToDevice = 0;

                if ($deviceIndex >= $deviceCount)
                    break;
            }
        }
    }

    /**
     * Create jobs for a single record
     */
    protected function createJobsForRecord(Campaign $campaign, $device, $workflows, int $recordId): void
    {
        foreach ($workflows as $workflow) {
            $config = $campaign->getWorkflowConfig($workflow->id);
            $repeatCount = $config['repeat_count'];
            $delay = $config['delay_between_repeats'] ?? 0;

            for ($i = 0; $i < $repeatCount; $i++) {
                $poolContext = $this->buildJobContext($campaign);
                $dataCollectionId = $device->pivot->data_collection_id ?? $campaign->data_collection_id;

                WorkflowJob::create([
                    'user_id' => $campaign->user_id,
                    'flow_id' => $workflow->id,
                    'device_id' => $device->id,
                    'campaign_id' => $campaign->id,
                    'data_collection_id' => $dataCollectionId,
                    'data_record_id' => $recordId,
                    'variable_source_collection_id' => $config['variable_source_collection_id'],
                    'iteration_index' => $i,
                    'workflow_chain' => [$workflow->id],
                    'current_workflow_index' => 0,
                    'chain_context' => $poolContext,
                    'name' => "{$campaign->name} - {$workflow->name} #{$recordId}"
                        . ($repeatCount > 1 ? " (Run " . ($i + 1) . ")" : ""),
                    'scheduled_at' => now()->addSeconds($i * $delay),
                    'status' => WorkflowJob::STATUS_PENDING,
                    'priority' => 5,
                    'max_retries' => 3,
                ]);
            }
        }
    }

    /**
     * Get filtered record IDs based on campaign's record_filter
     */
    public function getFilteredRecordIds(Campaign $campaign): array
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
            return $query->pluck('id')->toArray();
        }

        $type = $filter['type'] ?? 'all';
        $value = $filter['value'] ?? null;

        return match ($type) {
            'limit' => $query->take((int) $value)->pluck('id')->toArray(),
            'ids' => is_array($value) ? $value : [],
            default => $query->pluck('id')->toArray(),
        };
    }

    /**
     * Build initial context for a job based on data_config pools
     */
    public function buildJobContext(Campaign $campaign): ?array
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

            if (!$variable || !$collectionId)
                continue;

            $collection = DataCollection::find($collectionId);
            if (!$collection)
                continue;

            $query = $collection->records();
            if ($mode === 'random') {
                $query->inRandomOrder();
            }

            $records = $query->take($count)->get();

            if ($field) {
                $context[$variable] = $records->map(fn($r) => $r->data[$field] ?? null)->filter()->values()->toArray();
            } else {
                $context[$variable] = $records->map(fn($r) => $r->data)->toArray();
            }
        }

        return empty($context) ? null : $context;
    }
}
