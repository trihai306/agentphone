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
}
