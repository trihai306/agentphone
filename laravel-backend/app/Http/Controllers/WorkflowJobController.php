<?php

namespace App\Http\Controllers;

use App\Events\JobStatusChanged;
use App\Http\Requests\StoreWorkflowJobRequest;
use App\Models\DataCollection;
use App\Models\Device;
use App\Models\Flow;
use App\Models\JobLog;
use App\Models\JobTask;
use App\Models\JobWorkflowItem;
use App\Models\WorkflowJob;
use App\Services\JobDispatchService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class WorkflowJobController extends Controller
{
    /**
     * List all jobs for the user with device statistics
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        // Build query with filters
        $query = WorkflowJob::where('user_id', $userId)
            ->with([
                'flow:id,name',
                'device:id,name,model,status,socket_connected',
                'workflowItems:id,workflow_job_id,flow_id,sequence,status',
                'workflowItems.flow:id,name',
            ])
            ->withCount('tasks');

        // Filter by status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by device
        if ($request->filled('device_id')) {
            $query->where('device_id', $request->device_id);
        }

        // Search by name
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $jobs = $query->orderBy('created_at', 'desc')->paginate(20)->withQueryString();

        // Add formatted dates
        $jobs->getCollection()->transform(function ($job) {
            $job->created_at_human = $job->created_at->diffForHumans();
            $job->started_at_human = $job->started_at?->diffForHumans();
            $job->completed_at_human = $job->completed_at?->diffForHumans();
            $job->is_multi_workflow = $job->workflowItems->count() > 0;
            return $job;
        });

        // Overall stats
        $stats = [
            'total' => WorkflowJob::where('user_id', $userId)->count(),
            'pending' => WorkflowJob::where('user_id', $userId)->pending()->count(),
            'running' => WorkflowJob::where('user_id', $userId)->running()->count(),
            'completed' => WorkflowJob::where('user_id', $userId)->completed()->count(),
            'failed' => WorkflowJob::where('user_id', $userId)->failed()->count(),
        ];

        // Device stats
        $deviceStats = Device::where('user_id', $userId)
            ->withCount([
                'jobs as total_jobs',
                'jobs as running_jobs' => fn($q) => $q->where('status', 'running'),
                'jobs as completed_jobs' => fn($q) => $q->where('status', 'completed'),
                'jobs as failed_jobs' => fn($q) => $q->where('status', 'failed'),
            ])
            ->orderBy('name')
            ->get(['id', 'name', 'model', 'status', 'socket_connected']);

        // All devices for filter dropdown
        $devices = Device::where('user_id', $userId)
            ->orderBy('name')
            ->get(['id', 'name']);

        // Flows for create modal (include all statuses so user can run any workflow)
        $flows = Flow::where('user_id', $userId)
            ->orderBy('name')
            ->get(['id', 'name', 'description', 'status']);

        return Inertia::render('Jobs/Index', [
            'jobs' => $jobs,
            'stats' => $stats,
            'deviceStats' => $deviceStats,
            'devices' => $devices,
            'flows' => $flows,
            'filters' => [
                'status' => $request->status ?? 'all',
                'device_id' => $request->device_id,
                'search' => $request->search,
            ],
        ]);
    }

    /**
     * Show create job form
     */
    public function create(Request $request)
    {
        $flows = Flow::where('user_id', $request->user()->id)
            ->where('status', Flow::STATUS_ACTIVE)
            ->orderBy('name')
            ->get(['id', 'name', 'description']);

        $devices = Device::where('user_id', $request->user()->id)
            ->orderBy('name')
            ->get(['id', 'name', 'model', 'status', 'socket_connected', 'device_id']);

        $dataCollections = DataCollection::where('user_id', $request->user()->id)
            ->withCount('records')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Jobs/Create', [
            'flows' => $flows,
            'devices' => $devices,
            'dataCollections' => $dataCollections,
        ]);
    }

    /**
     * Store a new job (supports both single and multi-workflow)
     */
    public function store(StoreWorkflowJobRequest $request)
    {
        $validated = $request->validated();
        $user = $request->user();

        // Verify device ownership
        $device = Device::where('id', $validated['device_id'])
            ->where('user_id', $user->id)
            ->firstOrFail();

        // Determine workflow mode
        $isMultiWorkflow = !empty($validated['flow_ids']);
        $flowIds = $isMultiWorkflow
            ? $validated['flow_ids']
            : [$validated['flow_id']];

        // Verify all workflows ownership
        $flows = Flow::whereIn('id', $flowIds)
            ->where('user_id', $user->id)
            ->get();

        if ($flows->count() !== count($flowIds)) {
            abort(403, 'Một số workflow không tồn tại hoặc không có quyền');
        }

        // Verify data collection ownership if provided
        $dataCollection = null;
        $totalRecordsToProcess = 0;
        $recordIdsToProcess = null;

        if (!empty($validated['data_collection_id'])) {
            $dataCollection = DataCollection::where('id', $validated['data_collection_id'])
                ->where('user_id', $user->id)
                ->firstOrFail();

            $recordsQuery = $dataCollection->records()->active()->orderBy('id');

            if (!empty($validated['record_limit'])) {
                $recordsQuery = $recordsQuery->limit($validated['record_limit']);
            }

            $recordIdsToProcess = $recordsQuery->pluck('id')->toArray();
            $totalRecordsToProcess = count($recordIdsToProcess);
        }

        $job = DB::transaction(function () use ($validated, $user, $device, $flows, $flowIds, $isMultiWorkflow, $dataCollection, $recordIdsToProcess, $totalRecordsToProcess) {
            // Create job (flow_id is null for multi-workflow mode)
            $job = WorkflowJob::create([
                'user_id' => $user->id,
                'flow_id' => $isMultiWorkflow ? null : $flowIds[0],
                'device_id' => $device->id,
                'data_collection_id' => $dataCollection?->id,
                'data_record_ids' => $recordIdsToProcess,
                'execution_mode' => $validated['execution_mode'] ?? 'sequential',
                'total_records_to_process' => $totalRecordsToProcess,
                'name' => $validated['name'],
                'status' => WorkflowJob::STATUS_PENDING,
                'priority' => $validated['priority'] ?? 5,
                'scheduled_at' => $validated['scheduled_at'] ?? null,
                'config' => $validated['config'] ?? [],
                'current_workflow_index' => 0,
            ]);

            if ($isMultiWorkflow) {
                // Create workflow items for each flow in order
                foreach ($flowIds as $index => $flowId) {
                    $flow = $flows->firstWhere('id', $flowId);
                    $nodes = $flow->nodes()->orderBy('id')->get();

                    $workflowItem = JobWorkflowItem::create([
                        'workflow_job_id' => $job->id,
                        'flow_id' => $flowId,
                        'sequence' => $index,
                        'status' => JobWorkflowItem::STATUS_PENDING,
                        'total_tasks' => $nodes->count(),
                    ]);

                    // Create tasks for this workflow item
                    $sequence = 1;
                    foreach ($nodes as $node) {
                        JobTask::create([
                            'workflow_job_id' => $job->id,
                            'job_workflow_item_id' => $workflowItem->id,
                            'flow_node_id' => $node->id,
                            'node_id' => $node->node_id,
                            'node_type' => $node->type,
                            'node_label' => $node->label,
                            'sequence' => $sequence++,
                            'status' => JobTask::STATUS_PENDING,
                            'input_data' => $node->data,
                        ]);
                    }
                }

                $job->update(['total_tasks' => $job->tasks()->count()]);
            } else {
                // Single workflow mode (backward compatible)
                $flow = $flows->first();
                $nodes = $flow->nodes()->orderBy('id')->get();
                $sequence = 1;

                foreach ($nodes as $node) {
                    JobTask::create([
                        'workflow_job_id' => $job->id,
                        'flow_node_id' => $node->id,
                        'node_id' => $node->node_id,
                        'node_type' => $node->type,
                        'node_label' => $node->label,
                        'sequence' => $sequence++,
                        'status' => JobTask::STATUS_PENDING,
                        'input_data' => $node->data,
                    ]);
                }

                $job->update(['total_tasks' => $sequence - 1]);
            }

            return $job;
        });

        // Log creation
        $workflowCount = $isMultiWorkflow ? count($flowIds) : 1;
        JobLog::info($job, "Job created with {$job->total_tasks} tasks across {$workflowCount} workflow(s)");

        // Dispatch if no scheduled_at
        if (!$job->scheduled_at && $device->isOnline()) {
            $dispatchService = app(JobDispatchService::class);
            $dispatchService->dispatch($job);
        } elseif (!$device->isOnline()) {
            JobLog::warning($job, 'Device is offline, job queued for later');
        }

        return redirect()->route('jobs.show', $job)
            ->with('success', 'Job đã được tạo thành công!');
    }

    /**
     * Store batch jobs for multiple devices
     */
    public function storeBatch(Request $request, Flow $flow)
    {
        $this->authorize('view', $flow);

        $validated = $request->validate([
            'device_ids' => 'required|array|min:1',
            'device_ids.*' => 'integer|exists:devices,id',
            'data_collection_id' => 'nullable|exists:data_collections,id',
            'name' => 'required|string|max:255',
            'priority' => 'nullable|integer|min:1|max:10',
            'max_retries' => 'nullable|integer|min:0|max:5',
            'execution_mode' => 'nullable|in:sequential,parallel',
        ]);

        $user = $request->user();
        $jobs = [];
        $errors = [];

        // Verify data collection ownership
        $dataCollection = null;
        $recordIdsToProcess = null;
        $totalRecordsToProcess = 0;

        if (!empty($validated['data_collection_id'])) {
            $dataCollection = DataCollection::where('id', $validated['data_collection_id'])
                ->where('user_id', $user->id)
                ->first();

            if ($dataCollection) {
                $recordIdsToProcess = $dataCollection->records()->active()->pluck('id')->toArray();
                $totalRecordsToProcess = count($recordIdsToProcess);
            }
        }

        // Get nodes for task creation
        $nodes = $flow->nodes()->orderBy('id')->get();

        foreach ($validated['device_ids'] as $deviceId) {
            $device = Device::where('id', $deviceId)
                ->where('user_id', $user->id)
                ->first();

            if (!$device) {
                $errors[] = "Device ID {$deviceId} không tồn tại hoặc không có quyền";
                continue;
            }

            // Create job for this device
            $job = WorkflowJob::create([
                'user_id' => $user->id,
                'flow_id' => $flow->id,
                'device_id' => $device->id,
                'data_collection_id' => $dataCollection?->id,
                'data_record_ids' => $recordIdsToProcess,
                'execution_mode' => $validated['execution_mode'] ?? 'sequential',
                'total_records_to_process' => $totalRecordsToProcess,
                'name' => $validated['name'] . ' - ' . ($device->name ?: $device->device_id),
                'status' => WorkflowJob::STATUS_PENDING,
                'priority' => $validated['priority'] ?? 5,
                'max_retries' => $validated['max_retries'] ?? 3,
                'config' => [],
            ]);

            // Create tasks from flow nodes
            $sequence = 1;
            foreach ($nodes as $node) {
                JobTask::create([
                    'workflow_job_id' => $job->id,
                    'flow_node_id' => $node->id,
                    'node_id' => $node->node_id,
                    'node_type' => $node->type,
                    'node_label' => $node->label,
                    'sequence' => $sequence++,
                    'status' => JobTask::STATUS_PENDING,
                    'input_data' => $node->data,
                ]);
            }

            $job->update(['total_tasks' => $sequence - 1]);
            JobLog::info($job, "Batch job created with {$job->total_tasks} tasks");

            // Dispatch if device online
            if ($device->isOnline()) {
                $dispatchService = app(JobDispatchService::class);
                $dispatchService->dispatch($job);
            }

            $jobs[] = $job;
        }

        return response()->json([
            'success' => true,
            'message' => count($jobs) . ' job(s) đã được tạo',
            'jobs' => $jobs,
            'errors' => $errors,
        ]);
    }

    /**
     * Show job details
     */
    public function show(WorkflowJob $job)
    {
        $this->authorize('view', $job);

        $job->load([
            'flow:id,name,description',
            'device:id,name,model,status,socket_connected',
            'tasks' => fn($q) => $q->orderBy('sequence'),
            'logs' => fn($q) => $q->orderBy('created_at', 'desc')->limit(100),
        ]);

        // Add human readable dates
        $job->created_at_human = $job->created_at->diffForHumans();
        $job->started_at_human = $job->started_at?->diffForHumans();
        $job->completed_at_human = $job->completed_at?->diffForHumans();

        return Inertia::render('Jobs/Show', [
            'job' => $job,
        ]);
    }

    /**
     * Cancel a pending/running job
     */
    public function cancel(WorkflowJob $job)
    {
        $this->authorize('update', $job);

        if (!$job->canCancel()) {
            return back()->with('error', 'Không thể huỷ job này');
        }

        $job->markAsCancelled();
        JobLog::warning($job, 'Job cancelled by user');

        // Broadcast status change
        broadcast(new JobStatusChanged($job))->toOthers();

        return back()->with('success', 'Job đã được huỷ');
    }

    /**
     * Retry a failed job
     */
    public function retry(WorkflowJob $job)
    {
        $this->authorize('update', $job);

        if (!$job->canRetry()) {
            return back()->with('error', 'Không thể retry job này');
        }

        // Reset job status
        $job->update([
            'status' => WorkflowJob::STATUS_QUEUED,
            'retry_count' => $job->retry_count + 1,
            'error_message' => null,
            'started_at' => null,
            'completed_at' => null,
            'completed_tasks' => 0,
            'failed_tasks' => 0,
        ]);

        // Reset task statuses
        $job->tasks()->update([
            'status' => JobTask::STATUS_PENDING,
            'started_at' => null,
            'completed_at' => null,
            'error_message' => null,
            'output_data' => null,
            'duration_ms' => null,
        ]);

        JobLog::info($job, "Job retrying (attempt {$job->retry_count} of {$job->max_retries})");

        // Broadcast status change
        broadcast(new JobStatusChanged($job))->toOthers();

        // Dispatch to device
        $dispatchService = app(JobDispatchService::class);
        $dispatchService->dispatch($job);

        return back()->with('success', 'Job đang được retry');
    }

    /**
     * Get job logs (API)
     */
    public function logs(WorkflowJob $job)
    {
        $this->authorize('view', $job);

        $logs = $job->logs()
            ->with('task:id,node_label,sequence')
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($logs);
    }

    /**
     * Delete a job
     */
    public function destroy(WorkflowJob $job)
    {
        $this->authorize('delete', $job);

        if ($job->isRunning()) {
            return back()->with('error', 'Không thể xoá job đang chạy');
        }

        $job->delete();

        return redirect()->route('jobs.index')
            ->with('success', 'Job đã được xoá');
    }
}
