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
            $device = $job->device;

            // CRITICAL: Final Redis check right before socket broadcast
            // This catches race conditions where device disconnects between
            // controller check and actual dispatch
            $presenceService = app(\App\Services\DevicePresenceService::class);
            if (!$presenceService->isOnline($device->user_id, $device->device_id)) {
                JobLog::warning($job, 'Device went offline before dispatch (Redis verification failed)');
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

        // Build context from VariableContextService (includes file_input resolved paths)
        $variableContextService = app(VariableContextService::class);
        $flowContext = $variableContextService->buildContext($job->flow);

        $actions = $tasks->map(function (JobTask $task, $index) {
            $inputData = $task->input_data ?? [];

            // Determine action type - special handling for condition nodes with element check
            $actionType = $this->mapNodeTypeToAction($task->node_type);

            // If this is a condition node with element conditionType, use element_check
            if ($task->node_type === 'condition' && ($inputData['conditionType'] ?? 'variable') === 'element') {
                $actionType = 'element_check';

                // Map elementOperator to checkType for APK
                $inputData['checkType'] = $inputData['elementOperator'] ?? 'exists';

                // For text checks, copy assertType as well
                if (in_array($inputData['checkType'], ['text_equals', 'text_contains'])) {
                    $inputData['assertType'] = $inputData['checkType'];
                }
            }

            // Special handling for back/home shortcut nodes - ensure keyCode is set
            if ($task->node_type === 'back' && empty($inputData['key']) && empty($inputData['keyCode'])) {
                $inputData['key'] = 'KEYCODE_BACK';
                $inputData['keyCode'] = 'KEYCODE_BACK';
            }
            if ($task->node_type === 'home' && empty($inputData['key']) && empty($inputData['keyCode'])) {
                $inputData['key'] = 'KEYCODE_HOME';
                $inputData['keyCode'] = 'KEYCODE_HOME';
            }

            return [
                'id' => $task->node_id,
                'type' => $actionType,
                'params' => $inputData,
                'wait_before' => $inputData['wait_before'] ?? 0,
                'wait_after' => $inputData['wait_after'] ?? 500,
                'retry_on_fail' => $inputData['retry'] ?? 0,
                'optional' => $inputData['optional'] ?? false,
                'condition' => null,
            ];
        })->toArray();

        // Build variables from job config
        $variables = $job->config['variables'] ?? [];

        // Merge flowContext (includes file paths from file_input nodes)
        $variables = array_merge($variables, $flowContext);

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

        // Interpolate variables in action params (replace {{field}} with values)
        $actions = array_map(function ($action) use ($variables) {
            $action['params'] = $this->interpolateActionParams($action['params'], $variables);
            return $action;
        }, $actions);

        Log::debug("Generated action config with interpolated variables", [
            'job_id' => $job->id,
            'variables_count' => count($variables),
            'actions_count' => count($actions),
        ]);

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
     * Interpolate {{variable}} placeholders in text with actual values
     * 
     * @param string $text Text containing {{variable}} placeholders
     * @param array $variables Key-value pairs of variables
     * @return string Text with placeholders replaced by values
     */
    protected function interpolateVariables(string $text, array $variables): string
    {
        return preg_replace_callback('/\{\{(\w+)\}\}/', function ($matches) use ($variables) {
            $key = $matches[1];
            return $variables[$key] ?? $matches[0]; // Keep original if not found
        }, $text);
    }

    /**
     * Recursively interpolate all string values in action params
     * 
     * @param array $params Action parameters
     * @param array $variables Variables to interpolate
     * @return array Params with all {{field}} replaced
     */
    protected function interpolateActionParams(array $params, array $variables): array
    {
        foreach ($params as $key => $value) {
            if (is_string($value)) {
                $params[$key] = $this->interpolateVariables($value, $variables);
            } elseif (is_array($value)) {
                $params[$key] = $this->interpolateActionParams($value, $variables);
            }
        }
        return $params;
    }

    /**
     * Map flow node type to APK action type
     */
    protected function mapNodeTypeToAction(string $nodeType): string
    {
        $mapping = [
            // Tap actions
            'tap' => 'tap',
            'click' => 'tap',
            'doubleTap' => 'double_tap',
            'double_tap' => 'double_tap',
            'longPress' => 'long_press',
            'long_press' => 'long_press',
            'long_tap' => 'long_press',

            // Swipe actions
            'swipe' => 'swipe',
            'swipe_left' => 'swipe',
            'swipe_right' => 'swipe',
            'swipe_up' => 'swipe',
            'swipe_down' => 'swipe',

            // Scroll actions
            'scroll' => 'scroll',
            'scroll_up' => 'scroll',
            'scroll_down' => 'scroll',
            'scroll_left' => 'scroll',
            'scroll_right' => 'scroll',

            // Input actions
            'input' => 'text_input',
            'textInput' => 'text_input',
            'text_input' => 'text_input',
            'pressKey' => 'press_key',
            'press_key' => 'press_key',
            'key_event' => 'press_key',
            'back' => 'press_key',      // Back button shortcut node
            'home' => 'press_key',      // Home button shortcut node

            // App actions
            'startApp' => 'start_app',
            'openApp' => 'start_app',
            'open_app' => 'start_app',
            'start_app' => 'start_app',

            // Wait actions
            'wait' => 'wait',
            'delay' => 'wait',

            // Screenshot
            'screenshot' => 'screenshot',

            // Assertion & Verification
            'assert' => 'assert',
            'element_check' => 'element_check',
            'wait_for_element' => 'wait_for_element',

            // Data extraction
            'extract' => 'extract',

            // Control flow (handled specially)
            'condition' => 'custom',
            'loop' => 'custom',

            // Smart action nodes (recorded)
            'recorded_action' => 'tap',
            'smart_action' => 'tap',

            // File input
            'file_input' => 'file_input',
            'upload_file' => 'file_input',
        ];

        return $mapping[$nodeType] ?? 'custom';
    }
}
