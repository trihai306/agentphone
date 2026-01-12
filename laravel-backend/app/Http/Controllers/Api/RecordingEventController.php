<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecordingSession;
use App\Models\Device;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class RecordingEventController extends Controller
{
    /**
     * Store recording event from Android device
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'event' => 'required|string|in:recording:started,recording:stopped,recording:saved',
            'device_id' => 'required|string',
            'session_id' => 'required|string',
            'timestamp' => 'required|integer',
            'started_at' => 'sometimes|integer',
            'stopped_at' => 'sometimes|integer',
            'duration' => 'sometimes|integer',
            'event_count' => 'sometimes|integer',
            'target_app' => 'sometimes|string',
            'screenshot_enabled' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Find device by device_id (Android ID)
            $device = Device::where('device_id', $request->device_id)->first();

            if (!$device) {
                return response()->json([
                    'success' => false,
                    'message' => 'Device not found'
                ], 404);
            }

            $eventType = $request->event;
            $sessionId = $request->session_id;

            // Handle different event types
            if ($eventType === 'recording:started') {
                // Create new recording session
                $session = RecordingSession::create([
                    'device_id' => $device->id,
                    'user_id' => $device->user_id,
                    'session_id' => $sessionId,
                    'status' => 'started',
                    'started_at' => $request->started_at
                        ? now()->setTimestamp($request->started_at / 1000)
                        : now(),
                    'target_app' => $request->target_app ?? null,
                    'metadata' => [
                        'screenshot_enabled' => $request->screenshot_enabled ?? false,
                        'device_id' => $request->device_id,
                    ],
                ]);

                Log::info("Recording started: {$sessionId}", [
                    'device' => $device->name,
                    'user_id' => $device->user_id
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Recording session created',
                    'session' => $session
                ], 201);
            }

            if ($eventType === 'recording:stopped') {
                // Update existing recording session
                $session = RecordingSession::where('session_id', $sessionId)->first();

                if (!$session) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Recording session not found'
                    ], 404);
                }

                $session->update([
                    'status' => 'stopped',
                    'stopped_at' => $request->stopped_at
                        ? now()->setTimestamp($request->stopped_at / 1000)
                        : now(),
                    'duration' => $request->duration ?? null,
                    'event_count' => $request->event_count ?? null,
                ]);

                Log::info("Recording stopped: {$sessionId}", [
                    'duration' => $request->duration,
                    'event_count' => $request->event_count
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Recording session updated',
                    'session' => $session
                ]);
            }

            if ($eventType === 'recording:saved') {
                // Update session to saved status
                $session = RecordingSession::where('session_id', $sessionId)->first();

                if ($session) {
                    $session->update([
                        'status' => 'saved',
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Recording saved'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Unknown event type'
            ], 400);

        } catch (\Exception $e) {
            Log::error('Recording event error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store individual action event from recording and broadcast to Flow Editor
     * This enables real-time workflow node generation
     */
    public function storeAction(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'session_id' => 'required|string',
            'device_id' => 'required|string',
            'flow_id' => 'required|integer',
            'event_type' => 'required|string',
            'timestamp' => 'required|integer',
            'sequence_number' => 'required|integer',
            'package_name' => 'sometimes|string',
            'resource_id' => 'sometimes|string',
            'text' => 'sometimes|string',
            'bounds' => 'sometimes|string',
            'x' => 'sometimes|integer',
            'y' => 'sometimes|integer',
            'screenshot' => 'sometimes|string', // base64 encoded
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Find recording session
            $session = RecordingSession::where('session_id', $request->session_id)->first();
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Recording session not found'
                ], 404);
            }

            // Handle screenshot upload if provided
            $screenshotUrl = null;
            if ($request->screenshot) {
                $screenshotUrl = $this->saveScreenshot($request->screenshot, $request->session_id, $request->sequence_number);
            }

            // Prepare event data
            $eventData = [
                'event_type' => $request->event_type,
                'timestamp' => $request->timestamp,
                'sequence_number' => $request->sequence_number,
                'package_name' => $request->package_name ?? '',
                'resource_id' => $request->resource_id ?? '',
                'text' => $request->text ?? '',
                'bounds' => $request->bounds ?? '',
                'x' => $request->x,
                'y' => $request->y,
                'screenshot_url' => $screenshotUrl,
            ];

            // Store action in session's actions array
            $actions = $session->actions ?? [];
            $actions[] = $eventData;
            $session->update(['actions' => $actions]);

            // Broadcast to Flow Editor for real-time node generation
            broadcast(new \App\Events\RecordingEventReceived(
                $session->user_id,
                $request->flow_id,
                $request->session_id,
                $eventData
            ))->toOthers();

            Log::info("Recording action captured: {$request->event_type}", [
                'session_id' => $request->session_id,
                'sequence' => $request->sequence_number
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Action captured and broadcast',
                'action_count' => count($actions)
            ]);

        } catch (\Exception $e) {
            Log::error('Recording action error', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save base64 screenshot to storage
     */
    private function saveScreenshot(string $base64, string $sessionId, int $sequence): ?string
    {
        try {
            $imageData = base64_decode($base64);
            $filename = "recordings/{$sessionId}/screenshot_{$sequence}.png";
            \Storage::disk('public')->put($filename, $imageData);
            return \Storage::disk('public')->url($filename);
        } catch (\Exception $e) {
            Log::warning("Failed to save screenshot: {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Start recording session linked to a flow
     */
    public function startSession(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'device_id' => 'required|string',
            'flow_id' => 'required|integer|exists:flows,id',
            'target_app' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $device = Device::where('device_id', $request->device_id)->first();
            if (!$device) {
                return response()->json([
                    'success' => false,
                    'message' => 'Device not found'
                ], 404);
            }

            // Generate session ID
            $sessionId = 'rec_' . now()->timestamp . '_' . \Str::random(6);

            // Create session linked to flow
            $session = RecordingSession::create([
                'device_id' => $device->id,
                'user_id' => $device->user_id,
                'flow_id' => $request->flow_id,
                'session_id' => $sessionId,
                'status' => 'started',
                'started_at' => now(),
                'target_app' => $request->target_app,
                'actions' => [],
            ]);

            Log::info("Recording session started for flow", [
                'session_id' => $sessionId,
                'flow_id' => $request->flow_id,
                'device' => $device->name
            ]);

            return response()->json([
                'success' => true,
                'session' => [
                    'id' => $session->id,
                    'session_id' => $sessionId,
                    'status' => 'recording',
                ],
                'message' => 'Recording session started'
            ], 201);

        } catch (\Exception $e) {
            Log::error('Start session error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Stop recording session
     */
    public function stopSession(Request $request, string $sessionId)
    {
        try {
            $session = RecordingSession::where('session_id', $sessionId)->first();
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $session->update([
                'status' => 'stopped',
                'stopped_at' => now(),
                'event_count' => count($session->actions ?? []),
            ]);

            return response()->json([
                'success' => true,
                'session' => $session,
                'message' => 'Recording session stopped'
            ]);

        } catch (\Exception $e) {
            Log::error('Stop session error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }
}

