<?php

namespace App\Http\Controllers;

use App\Events\JobStatusChanged;
use App\Http\Requests\StoreWorkflowJobRequest;
use App\Models\DataCollection;
use App\Models\Device;
use App\Models\Flow;
use App\Models\JobLog;
use App\Models\JobTask;
use App\Models\WorkflowJob;
use App\Services\JobDispatchService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WorkflowJobController extends Controller
{
    /**
     * List all jobs for the user
     */
    public function index(Request $request)
    {
        $jobs = WorkflowJob::where('user_id', $request->user()->id)
            ->with(['flow:id,name', 'device:id,name,model,status'])
            ->withCount('tasks')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        // Add formatted dates
        $jobs->getCollection()->transform(function ($job) {
            $job->created_at_human = $job->created_at->diffForHumans();
            $job->started_at_human = $job->started_at?->diffForHumans();
            $job->completed_at_human = $job->completed_at?->diffForHumans();
            return $job;
        });

        $stats = [
            'total' => WorkflowJob::where('user_id', $request->user()->id)->count(),
            'running' => WorkflowJob::where('user_id', $request->user()->id)->running()->count(),
            'completed' => WorkflowJob::where('user_id', $request->user()->id)->completed()->count(),
            'failed' => WorkflowJob::where('user_id', $request->user()->id)->failed()->count(),
        ];

        return Inertia::render('Jobs/Index', [
            'jobs' => $jobs,
            'stats' => $stats,
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
            ->where('status', Device::STATUS_ACTIVE)
            ->orderBy('name')
            ->get(['id', 'name', 'model', 'status', 'socket_connected']);

        return Inertia::render('Jobs/Create', [
            'flows' => $flows,
            'devices' => $devices,
        ]);
    }

    /**
     * Store a new job
     */
    public function store(StoreWorkflowJobRequest $request)
    {
        $validated = $request->validated();

        // Verify ownership
        $flow = Flow::where('id', $validated['flow_id'])
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $device = Device::where('id', $validated['device_id'])
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        // Verify data collection ownership if provided
        $dataCollection = null;
        $totalRecordsToProcess = 0;
        $recordIdsToProcess = null;

        if (!empty($validated['data_collection_id'])) {
            $dataCollection = DataCollection::where('id', $validated['data_collection_id'])
                ->where('user_id', $request->user()->id)
                ->firstOrFail();

            // Get records to process (limited by record_limit)
            $recordsQuery = $dataCollection->records()->active()->orderBy('id');

            if (!empty($validated['record_limit'])) {
                $recordsQuery = $recordsQuery->limit($validated['record_limit']);
            }

            $recordIdsToProcess = $recordsQuery->pluck('id')->toArray();
            $totalRecordsToProcess = count($recordIdsToProcess);
        }

        // Create job
        $job = WorkflowJob::create([
            'user_id' => $request->user()->id,
            'flow_id' => $flow->id,
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
        ]);

        // Create tasks from flow nodes
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

        // Update total tasks count
        $job->update(['total_tasks' => $sequence - 1]);

        // Log creation
        JobLog::info($job, "Job created with {$job->total_tasks} tasks");

        // If no scheduled_at, dispatch immediately
        if (!$job->scheduled_at) {
            $dispatchService = app(JobDispatchService::class);

            if ($device->isOnline()) {
                $dispatchService->dispatch($job);
            } else {
                JobLog::warning($job, 'Device is offline, job queued for later');
            }
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
