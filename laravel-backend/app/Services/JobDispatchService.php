<?php

namespace App\Services;

use App\Events\DispatchJobToDevice;
use App\Models\DataRecord;
use App\Models\Device;
use App\Models\JobLog;
use App\Models\JobTask;
use App\Models\WorkflowJob;
use Illuminate\Support\Facades\Log;

/**
 * Service to dispatch workflow jobs to Android devices via Soketi
 */
class JobDispatchService
{
    /**
     * Dispatch a job to its target device
     */
    public function dispatch(WorkflowJob $job): bool
    {
        try {
            // Validate device is online
            $device = $job->device;
            if (!$device->isOnline()) {
                JobLog::warning($job, 'Device is offline, cannot dispatch job');
                return false;
            }

            // Mark job as queued
            $job->update(['status' => WorkflowJob::STATUS_QUEUED]);
            JobLog::info($job, 'Job dispatched to device');

            // Prepare job payload for APK
            $payload = $this->prepareJobPayload($job);

            // Broadcast to device channel
            broadcast(new DispatchJobToDevice($device, $payload))->toOthers();

            Log::info("Job {$job->id} dispatched to device {$device->device_id}");

            return true;
        } catch (\Exception $e) {
            Log::error("Failed to dispatch job {$job->id}: " . $e->getMessage());
            JobLog::error($job, "Dispatch failed: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Prepare job payload matching APK's expected format
     */
    protected function prepareJobPayload(WorkflowJob $job): array
    {
        return [
            'id' => (string) $job->id,
            'type' => 'workflow',
            'priority' => $this->mapPriority($job->priority),
            'action_config_url' => route('api.jobs.config', $job),
            'params' => $job->config ?? [],
            'timeout' => 60000, // 60 seconds default
            'retry' => $job->max_retries,
            'created_at' => $job->created_at->timestamp * 1000,
        ];
    }

    /**
     * Map numeric priority to APK's priority enum
     */
    protected function mapPriority(int $priority): string
    {
        if ($priority >= 9)
            return 'immediate';
        if ($priority >= 7)
            return 'high';
        if ($priority >= 4)
            return 'normal';
        return 'low';
    }

    /**
     * Cancel a running job on device
     */
    public function cancel(WorkflowJob $job): bool
    {
        try {
            $device = $job->device;

            // Broadcast cancel event
            broadcast(new DispatchJobToDevice($device, [
                'job_id' => (string) $job->id,
            ], 'job:cancel'))->toOthers();

            $job->markAsCancelled();
            JobLog::warning($job, 'Job cancelled');

            return true;
        } catch (\Exception $e) {
            Log::error("Failed to cancel job {$job->id}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Pause a running job on device
     */
    public function pause(WorkflowJob $job): bool
    {
        try {
            $device = $job->device;

            broadcast(new DispatchJobToDevice($device, [
                'job_id' => (string) $job->id,
            ], 'job:pause'))->toOthers();

            JobLog::info($job, 'Job paused');

            return true;
        } catch (\Exception $e) {
            Log::error("Failed to pause job {$job->id}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Resume a paused job on device
     */
    public function resume(WorkflowJob $job): bool
    {
        try {
            $device = $job->device;

            broadcast(new DispatchJobToDevice($device, [
                'job_id' => (string) $job->id,
            ], 'job:resume'))->toOthers();

            JobLog::info($job, 'Job resumed');

            return true;
        } catch (\Exception $e) {
            Log::error("Failed to resume job {$job->id}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Generate action config from flow nodes
     * If job has data collection, include current record data as variables
     *
     * @param WorkflowJob $job
     * @param int|null $recordId Specific record ID to use (for batch processing)
     */
    public function generateActionConfig(WorkflowJob $job, ?int $recordId = null): array
    {
        $tasks = $job->tasks()->orderBy('sequence')->get();

        $actions = $tasks->map(function (JobTask $task, $index) {
            return [
                'id' => $task->node_id,
                'type' => $this->mapNodeTypeToAction($task->node_type),
                'params' => $task->input_data ?? [],
                'wait_before' => $task->input_data['wait_before'] ?? 0,
                'wait_after' => $task->input_data['wait_after'] ?? 500,
                'retry_on_fail' => $task->input_data['retry'] ?? 0,
                'optional' => $task->input_data['optional'] ?? false,
                'condition' => null,
            ];
        })->toArray();

        // Build variables from job config
        $variables = $job->config['variables'] ?? [];

        // If job has data collection, get current record data
        $recordData = null;
        if ($job->data_collection_id) {
            $record = $this->getCurrentRecord($job, $recordId);
            if ($record) {
                // Merge record data into variables
                $recordData = $record->data ?? [];
                $variables = array_merge($variables, $recordData);
            }
        }

        return [
            'version' => '1.0',
            'job_id' => $job->id,
            'flow_id' => $job->flow_id,
            'flow_name' => $job->flow->name ?? 'Workflow',
            'actions' => $actions,
            'on_error' => 'stop',
            'variables' => $variables,
            // Data record info for tracking
            'record_id' => $recordId,
            'record_index' => $job->current_record_index,
            'total_records' => $job->total_records_to_process,
            'record_data' => $recordData,
            'created_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Get current record for job execution
     */
    protected function getCurrentRecord(WorkflowJob $job, ?int $recordId = null): ?DataRecord
    {
        if ($recordId) {
            return DataRecord::find($recordId);
        }

        // If job has specific record IDs to run
        if ($job->data_record_ids && count($job->data_record_ids) > 0) {
            $index = $job->current_record_index;
            if (isset($job->data_record_ids[$index])) {
                return DataRecord::find($job->data_record_ids[$index]);
            }
            return null;
        }

        // Otherwise get all records from collection
        $collection = $job->dataCollection;
        if (!$collection)
            return null;

        return $collection->records()
            ->active()
            ->skip($job->current_record_index)
            ->first();
    }

    /**
     * Map flow node type to APK action type
     */
    protected function mapNodeTypeToAction(string $nodeType): string
    {
        $mapping = [
            'tap' => 'tap',
            'click' => 'tap',
            'doubleTap' => 'double_tap',
            'longPress' => 'long_press',
            'swipe' => 'swipe',
            'scroll' => 'scroll',
            'input' => 'text_input',
            'textInput' => 'text_input',
            'pressKey' => 'press_key',
            'startApp' => 'start_app',
            'openApp' => 'start_app',
            'wait' => 'wait',
            'delay' => 'wait',
            'screenshot' => 'screenshot',
            'assert' => 'assert',
            'extract' => 'extract',
            'condition' => 'custom',
            'loop' => 'custom',
        ];

        return $mapping[$nodeType] ?? 'custom';
    }
}
