<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobLog;
use App\Models\JobTask;
use App\Models\WorkflowJob;
use App\Services\JobDispatchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * API Controller for Job operations from APK
 */
class JobApiController extends Controller
{
    protected JobDispatchService $dispatchService;

    public function __construct(JobDispatchService $dispatchService)
    {
        $this->dispatchService = $dispatchService;
    }

    /**
     * Get job action configuration for APK to execute
     * Called by APK when it receives job:new event
     */
    public function getConfig(WorkflowJob $job): JsonResponse
    {
        // Verify the requesting device matches the job's target device
        // This is handled via device_id in the request or auth token

        $config = $this->dispatchService->generateActionConfig($job);

        return response()->json($config);
    }

    /**
     * Report job started (from APK)
     */
    public function reportStarted(Request $request, WorkflowJob $job): JsonResponse
    {
        $job->markAsStarted();
        JobLog::info($job, 'Job execution started on device');

        return response()->json(['success' => true, 'message' => 'Job started']);
    }

    /**
     * Report task progress (from APK)
     */
    public function reportTaskProgress(Request $request, WorkflowJob $job): JsonResponse
    {
        $validated = $request->validate([
            'task_id' => 'required|string',
            'status' => 'required|in:started,completed,failed,skipped',
            'output_data' => 'nullable|array',
            'error_message' => 'nullable|string',
            'duration_ms' => 'nullable|integer',
        ]);

        // Find task by node_id
        $task = $job->tasks()->where('node_id', $validated['task_id'])->first();

        if (!$task) {
            return response()->json(['error' => 'Task not found'], 404);
        }

        switch ($validated['status']) {
            case 'started':
                $task->markAsStarted();
                JobLog::info($job, "Task {$task->node_label} started", $task);
                break;

            case 'completed':
                $task->markAsCompleted($validated['output_data'] ?? []);
                JobLog::info($job, "Task {$task->node_label} completed", $task);
                break;

            case 'failed':
                $task->markAsFailed(
                    $validated['error_message'] ?? 'Unknown error',
                    $validated['output_data'] ?? []
                );
                JobLog::error($job, "Task {$task->node_label} failed: {$validated['error_message']}", $task);
                break;

            case 'skipped':
                $task->markAsSkipped($validated['error_message']);
                JobLog::info($job, "Task {$task->node_label} skipped", $task);
                break;
        }

        return response()->json([
            'success' => true,
            'job_progress' => $job->fresh()->progress,
            'completed_tasks' => $job->fresh()->completed_tasks,
            'total_tasks' => $job->total_tasks,
        ]);
    }

    /**
     * Report job completed (from APK)
     */
    public function reportCompleted(Request $request, WorkflowJob $job): JsonResponse
    {
        $validated = $request->validate([
            'success' => 'required|boolean',
            'result' => 'nullable|array',
            'error_message' => 'nullable|string',
            'execution_time' => 'nullable|integer',
        ]);

        if ($validated['success']) {
            $job->markAsCompleted($validated['result'] ?? []);
            JobLog::info($job, 'Job completed successfully', null, [
                'execution_time' => $validated['execution_time'] ?? 0,
            ]);
        } else {
            $job->markAsFailed($validated['error_message'] ?? 'Execution failed');
            JobLog::error($job, "Job failed: {$validated['error_message']}");
        }

        return response()->json([
            'success' => true,
            'job_id' => $job->id,
            'status' => $job->fresh()->status,
        ]);
    }

    /**
     * Send log message from APK
     */
    public function addLog(Request $request, WorkflowJob $job): JsonResponse
    {
        $validated = $request->validate([
            'level' => 'required|in:debug,info,warning,error',
            'message' => 'required|string',
            'task_id' => 'nullable|string',
            'context' => 'nullable|array',
        ]);

        $task = null;
        if (!empty($validated['task_id'])) {
            $task = $job->tasks()->where('node_id', $validated['task_id'])->first();
        }

        JobLog::create([
            'workflow_job_id' => $job->id,
            'job_task_id' => $task?->id,
            'level' => $validated['level'],
            'message' => $validated['message'],
            'context' => $validated['context'] ?? [],
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * Get today's job statistics for APK dashboard
     * Returns counts by status for the authenticated user's devices
     */
    public function getTodayStats(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        // Get user's device IDs
        $deviceIds = $user->devices()->pluck('id')->toArray();

        // Get today's jobs for user's devices
        $today = now()->startOfDay();

        $query = WorkflowJob::whereIn('device_id', $deviceIds)
            ->where('created_at', '>=', $today);

        $stats = [
            'pending' => (clone $query)->where('status', 'pending')->count(),
            'running' => (clone $query)->where('status', 'running')->count(),
            'completed' => (clone $query)->where('status', 'completed')->count(),
            'failed' => (clone $query)->where('status', 'failed')->count(),
        ];

        $stats['total'] = array_sum($stats);
        $stats['date'] = now()->toDateString();

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Get pending jobs for device (APK polling)
     * Device can call this to check for jobs if WebSocket is unavailable
     * 
     * @param Request $request Must include device_id parameter
     * @return JsonResponse List of pending/queued jobs for the device
     */
    public function getPendingJobs(Request $request): JsonResponse
    {
        $user = $request->user();
        $deviceId = $request->input('device_id');

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if (!$deviceId) {
            return response()->json(['error' => 'device_id required'], 400);
        }

        // Verify device belongs to user
        $device = $user->devices()->where('device_id', $deviceId)->first();
        if (!$device) {
            return response()->json(['error' => 'Device not found'], 404);
        }

        // Get pending/queued jobs for this device that are ready to execute
        $jobs = WorkflowJob::where('device_id', $device->id)
            ->whereIn('status', [WorkflowJob::STATUS_PENDING, WorkflowJob::STATUS_QUEUED])
            ->where(function ($q) {
                // No schedule OR schedule is due
                $q->whereNull('scheduled_at')
                    ->orWhere('scheduled_at', '<=', now());
            })
            ->orderBy('priority', 'desc')
            ->orderBy('created_at')
            ->limit(10)
            ->get(['id', 'name', 'priority', 'status', 'scheduled_at', 'created_at']);

        return response()->json([
            'success' => true,
            'device_id' => $deviceId,
            'jobs' => $jobs,
            'count' => $jobs->count(),
        ]);
    }

    /**
     * Claim a pending job for execution (APK calls this before starting)
     * This prevents the same job from being picked up by multiple devices
     * 
     * @param WorkflowJob $job The job to claim
     * @return JsonResponse Job config or error
     */
    public function claimJob(Request $request, WorkflowJob $job): JsonResponse
    {
        $user = $request->user();
        $deviceId = $request->input('device_id');

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Verify device matches
        $device = $user->devices()->where('device_id', $deviceId)->first();
        if (!$device || $job->device_id !== $device->id) {
            return response()->json(['error' => 'Job not assigned to this device'], 403);
        }

        // Check if job is still pending
        if (!in_array($job->status, [WorkflowJob::STATUS_PENDING, WorkflowJob::STATUS_QUEUED])) {
            return response()->json([
                'success' => false,
                'error' => 'Job is no longer available',
                'current_status' => $job->status,
            ], 409);
        }

        // Mark as queued (claimed)
        $job->update(['status' => WorkflowJob::STATUS_QUEUED]);
        JobLog::info($job, 'Job claimed by device via polling');

        // Return config for execution
        $config = $this->dispatchService->generateActionConfig($job);

        return response()->json([
            'success' => true,
            'job_id' => $job->id,
            'config' => $config,
        ]);
    }
}

