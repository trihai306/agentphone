<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecordingSession;
use App\Models\Device;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Intervention\Image\Laravel\Facades\Image;

class RecordingEventController extends Controller
{
    /**
     * Store recording event from Android device
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'event' => 'required|string|in:recording:started,recording:stopped,recording:saved,inspect:result,inspect:chunk,visual:result,apps:result',
            'device_id' => 'required|string',
            'timestamp' => 'required|integer',
            'session_id' => 'sometimes|string',
            'started_at' => 'sometimes|integer',
            'stopped_at' => 'sometimes|integer',
            'duration' => 'sometimes|integer',
            'event_count' => 'sometimes|integer',
            'target_app' => 'sometimes|string',
            'screenshot_enabled' => 'sometimes|boolean',
            // Fields for inspect:result event
            'success' => 'sometimes|boolean',
            'elements' => 'sometimes|array',
            'package_name' => 'sometimes|string',
            'screen_width' => 'sometimes|integer',
            'screen_height' => 'sometimes|integer',
            'screenshot' => 'sometimes|string',
            'element_count' => 'sometimes|integer',
            'error' => 'sometimes|string',
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

            // Handle inspect:result event separately (no session_id required)
            if ($eventType === 'inspect:result') {
                try {
                    // Save screenshot to cache with unique key (TTL: 5 minutes)
                    // This allows frontend to fetch large screenshot via HTTP API
                    $screenshotKey = null;
                    if ($request->screenshot) {
                        $screenshotKey = 'inspect_screenshot_' . $device->user_id . '_' . $request->device_id . '_' . time();
                        \Illuminate\Support\Facades\Cache::put($screenshotKey, $request->screenshot, now()->addMinutes(5));
                        Log::info("Saved screenshot to cache", ['key' => $screenshotKey, 'size_kb' => round(strlen($request->screenshot) / 1024, 2)]);
                    }

                    broadcast(new \App\Events\InspectElementsResult(
                        userId: $device->user_id,
                        deviceId: $request->device_id,
                        success: $request->success ?? false,
                        elements: $request->elements ?? [],
                        textElements: $request->text_elements ?? [],
                        packageName: $request->package_name,
                        screenshot: $request->screenshot,  // Still pass to event (it will be stripped in broadcastWith)
                        screenshotKey: $screenshotKey,    // Pass cache key for HTTP fetch
                        screenWidth: $request->screen_width,
                        screenHeight: $request->screen_height,
                        screenshotWidth: $request->screenshot_width,
                        screenshotHeight: $request->screenshot_height,
                        statusBarHeight: $request->status_bar_height,
                        navBarHeight: $request->nav_bar_height,
                        error: $request->error
                    ));

                    Log::info("Broadcast inspect:result to user channel", [
                        'user_id' => $device->user_id,
                        'device_id' => $request->device_id,
                        'element_count' => $request->element_count ?? 0,
                        'ocr_count' => count($request->text_elements ?? []),
                        'screenshot_key' => $screenshotKey
                    ]);

                    return response()->json([
                        'success' => true,
                        'message' => 'Inspection result broadcasted'
                    ]);
                } catch (\Exception $e) {
                    Log::error("Failed to broadcast inspect:result: " . $e->getMessage());
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to broadcast result'
                    ], 500);
                }
            }

            // Handle chunked element streaming (new approach)
            if ($eventType === 'inspect:chunk') {
                try {
                    broadcast(new \App\Events\InspectElementsChunk(
                        userId: $device->user_id,
                        deviceId: $request->device_id,
                        chunkIndex: $request->chunk_index ?? 1,
                        totalChunks: $request->total_chunks ?? 1,
                        elements: $request->elements ?? [],
                        textElements: $request->text_elements ?? [],
                        isComplete: $request->is_complete ?? false,
                        packageName: $request->package_name,
                        screenshot: $request->screenshot,
                        screenWidth: $request->screen_width,
                        screenHeight: $request->screen_height,
                        screenshotWidth: $request->screenshot_width,
                        screenshotHeight: $request->screenshot_height,
                        statusBarHeight: $request->status_bar_height,
                        navBarHeight: $request->nav_bar_height,
                        totalElementCount: $request->total_element_count,
                        totalOcrCount: $request->total_ocr_count,
                        error: $request->error
                    ));

                    Log::info("Broadcast inspect:chunk to user channel", [
                        'user_id' => $device->user_id,
                        'device_id' => $request->device_id,
                        'chunk' => ($request->chunk_index ?? 1) . '/' . ($request->total_chunks ?? 1),
                        'is_complete' => $request->is_complete ?? false
                    ]);

                    return response()->json([
                        'success' => true,
                        'message' => 'Chunk broadcasted'
                    ]);
                } catch (\Exception $e) {
                    Log::error("Failed to broadcast inspect:chunk: " . $e->getMessage());
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to broadcast chunk'
                    ], 500);
                }
            }

            // Handle visual:result event (OCR text detection results from APK)
            if ($eventType === 'visual:result') {
                try {
                    broadcast(new \App\Events\VisualInspectResult(
                        userId: $device->user_id,
                        deviceId: $request->device_id,
                        success: $request->success ?? false,
                        textElements: $request->text_elements ?? [],
                        totalElements: $request->total_elements ?? 0,
                        processingTimeMs: $request->processing_time_ms ?? 0,
                        screenshotWidth: $request->screenshot_width ?? 0,
                        screenshotHeight: $request->screenshot_height ?? 0,
                        statusBarHeight: $request->status_bar_height ?? 0,
                        screenshot: $request->screenshot,
                        error: $request->error
                    ));

                    Log::info("Broadcast visual:result to user channel", [
                        'user_id' => $device->user_id,
                        'device_id' => $request->device_id,
                        'text_elements_count' => $request->total_elements ?? 0,
                        'processing_time_ms' => $request->processing_time_ms ?? 0
                    ]);

                    return response()->json([
                        'success' => true,
                        'message' => 'Visual inspection result broadcasted'
                    ]);
                } catch (\Exception $e) {
                    Log::error("Failed to broadcast visual:result: " . $e->getMessage());
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to broadcast visual result'
                    ], 500);
                }
            }

            // Handle apps:result event (installed apps list from APK)
            if ($eventType === 'apps:result') {
                try {
                    broadcast(new \App\Events\InstalledAppsResult(
                        userId: $device->user_id,
                        deviceId: $request->device_id,
                        success: $request->success ?? true,
                        apps: $request->apps ?? [],
                        error: $request->error
                    ));

                    Log::info("Broadcast apps:result to user channel", [
                        'user_id' => $device->user_id,
                        'device_id' => $request->device_id,
                        'app_count' => count($request->apps ?? [])
                    ]);

                    return response()->json([
                        'success' => true,
                        'message' => 'Apps list broadcasted'
                    ]);
                } catch (\Exception $e) {
                    Log::error("Failed to broadcast apps:result: " . $e->getMessage());
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to broadcast apps list'
                    ], 500);
                }
            }

            // For recording events, session_id is required
            $sessionId = $request->session_id;
            if (!$sessionId) {
                return response()->json([
                    'success' => false,
                    'message' => 'session_id is required for recording events'
                ], 422);
            }

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

                // Broadcast recording.started to device channel for Flow Editor
                try {
                    broadcast(new \App\Events\RecordingStatusChanged(
                        $request->device_id,
                        'started',
                        [
                            'session_id' => $sessionId,
                            'session' => $session,
                            'started_at' => $session->started_at,
                            'target_app' => $session->target_app,
                        ]
                    ))->toOthers();
                    Log::info("Broadcast recording.started to device channel");
                } catch (\Exception $e) {
                    Log::warning("Failed to broadcast recording.started: " . $e->getMessage());
                }

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

                // Broadcast recording.stopped to device channel for Flow Editor
                try {
                    broadcast(new \App\Events\RecordingStatusChanged(
                        $request->device_id,
                        'stopped',
                        [
                            'session_id' => $sessionId,
                            'stopped_at' => $session->stopped_at,
                            'duration' => $request->duration,
                            'event_count' => $request->event_count,
                        ]
                    ))->toOthers();
                    Log::info("Broadcast recording.stopped to device channel");
                } catch (\Exception $e) {
                    Log::warning("Failed to broadcast recording.stopped: " . $e->getMessage());
                }

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
            'event_type' => 'required|string',
            'timestamp' => 'required|integer',
            'sequence_number' => 'required|integer',
            'package_name' => 'nullable|string',
            'class_name' => 'nullable|string',
            'resource_id' => 'nullable|string',
            'content_description' => 'nullable|string',
            'text' => 'nullable|string',
            'bounds' => 'nullable|string',
            'x' => 'nullable|integer',
            'y' => 'nullable|integer',
            'is_clickable' => 'nullable|boolean',
            'is_editable' => 'nullable|boolean',
            'is_scrollable' => 'nullable|boolean',
            'screenshot' => 'nullable|string', // base64 encoded
        ]);

        if ($validator->fails()) {
            Log::warning("Recording action validation failed", [
                'errors' => $validator->errors()->toArray(),
                'input' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Find recording session
            $session = RecordingSession::where('session_id', $request->session_id)->first();
            if (!$session) {
                // Session not found - create one on-the-fly
                $device = Device::where('device_id', $request->device_id)->first();
                if (!$device) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Device not found'
                    ], 404);
                }

                $session = RecordingSession::create([
                    'device_id' => $device->id,
                    'user_id' => $device->user_id,
                    'session_id' => $request->session_id,
                    'status' => 'recording',
                    'started_at' => now(),
                    'actions' => [],
                ]);
            }

            // Handle screenshot upload if provided
            // Also crop element icon if bounds are available
            $screenshotUrl = null;
            $iconUrl = null;
            if ($request->screenshot) {
                $result = $this->saveScreenshotWithIcon(
                    $request->screenshot,
                    $request->session_id,
                    $request->sequence_number,
                    $request->bounds
                );
                $screenshotUrl = $result['screenshot_url'];
                $iconUrl = $result['icon_url'];
            }

            // Prepare event data
            $eventData = [
                'event_type' => $request->event_type,
                'timestamp' => $request->timestamp,
                'sequence_number' => $request->sequence_number,
                'package_name' => $request->package_name ?? '',
                'class_name' => $request->class_name ?? '',
                'resource_id' => $request->resource_id ?? '',
                'content_description' => $request->content_description ?? '',
                'text' => $request->text ?? '',
                'bounds' => $request->bounds ?? '',
                'x' => $request->x,
                'y' => $request->y,
                'is_clickable' => $request->is_clickable ?? false,
                'is_editable' => $request->is_editable ?? false,
                'is_scrollable' => $request->is_scrollable ?? false,
                'screenshot_url' => $screenshotUrl,
                'icon_url' => $iconUrl, // Cropped element icon
            ];

            // Store action in session's actions array
            $actions = $session->actions ?? [];
            $actions[] = $eventData;
            $session->update(['actions' => $actions]);

            // Broadcast to Flow Editor via device channel for real-time node generation
            try {
                broadcast(new \App\Events\RecordingActionCaptured(
                    $request->device_id,
                    $request->session_id,
                    $eventData
                ))->toOthers();
                Log::info("Broadcast action to device channel: {$request->device_id}");
            } catch (\Exception $e) {
                Log::warning("Failed to broadcast action: " . $e->getMessage());
            }

            Log::info("Recording action captured: {$request->event_type}", [
                'session_id' => $request->session_id,
                'sequence' => $request->sequence_number,
                'device_id' => $request->device_id
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
     * Save base64 screenshot to storage AND crop element icon if bounds provided
     * Screenshots are sent as JPEG (scaled 25%, quality 60%) from APK
     * 
     * @param string $base64 Base64 encoded screenshot
     * @param string $sessionId Recording session ID
     * @param int $sequence Sequence number
     * @param mixed $bounds Element bounds (string "[left,top][right,bottom]" or array)
     * @return array ['screenshot_url' => string|null, 'icon_url' => string|null]
     */
    private function saveScreenshotWithIcon(string $base64, string $sessionId, int $sequence, $bounds = null): array
    {
        $result = ['screenshot_url' => null, 'icon_url' => null];

        try {
            $imageData = base64_decode($base64);

            // Save full screenshot
            $screenshotFilename = "recordings/{$sessionId}/screenshot_{$sequence}.jpg";
            \Storage::disk('public')->put($screenshotFilename, $imageData);
            $result['screenshot_url'] = \Storage::disk('public')->url($screenshotFilename);

            $sizeKb = round(strlen($imageData) / 1024, 1);
            Log::info("📸 Screenshot saved: {$screenshotFilename} ({$sizeKb}KB)");

            // Crop element icon if bounds are provided
            if ($bounds) {
                $iconUrl = $this->cropElementIcon($imageData, $sessionId, $sequence, $bounds);
                if ($iconUrl) {
                    $result['icon_url'] = $iconUrl;
                }
            }

            return $result;
        } catch (\Exception $e) {
            Log::warning("Failed to save screenshot: {$e->getMessage()}");
            return $result;
        }
    }

    /**
     * Crop element icon from screenshot based on bounds
     * Handles both string format "[left,top][right,bottom]" and array format
     * 
     * @param string $imageData Raw image data
     * @param string $sessionId Recording session ID
     * @param int $sequence Sequence number
     * @param mixed $bounds Element bounds
     * @return string|null URL of cropped icon or null on failure
     */
    private function cropElementIcon(string $imageData, string $sessionId, int $sequence, $bounds): ?string
    {
        try {
            // Parse bounds - can be string "[100,200][300,400]" or array {left, top, right, bottom}
            $parsedBounds = $this->parseBounds($bounds);
            if (!$parsedBounds) {
                Log::warning("Could not parse bounds for icon crop", ['bounds' => $bounds]);
                return null;
            }

            $left = $parsedBounds['left'];
            $top = $parsedBounds['top'];
            $originalWidth = $parsedBounds['right'] - $parsedBounds['left'];
            $originalHeight = $parsedBounds['bottom'] - $parsedBounds['top'];

            // Validate dimensions (minimum 16px, matching Element Inspection Protocol)
            if ($originalWidth < 16 || $originalHeight < 16) {
                Log::warning("Icon dimensions too small", ['width' => $originalWidth, 'height' => $originalHeight]);
                return null;
            }

            // ========================================
            // ADAPTIVE VERTICAL CROPPING (Element Inspection Protocol)
            // For tall elements (height > width * 1.5), crop only the top square portion
            // This isolates the visual icon in list items where text labels are below
            // ========================================
            $width = $originalWidth;
            $height = $originalHeight;

            if ($height > $width * 1.5) {
                // Tall element detected - crop top square to get icon only
                $height = min($width, (int) ($height / 2));
                Log::info("📐 Adaptive vertical crop: {$originalWidth}x{$originalHeight} -> {$width}x{$height}");
            }

            // Load image with Intervention Image
            $image = Image::read($imageData);

            // Ensure crop area is within image bounds (Coordinate Safety Coercion)
            $imgWidth = $image->width();
            $imgHeight = $image->height();

            // Debug logging for scale issues
            Log::info("🔍 Icon crop debug", [
                'original_bounds' => "{$left},{$top} -> {$originalWidth}x{$originalHeight}",
                'adaptive_bounds' => "{$width}x{$height}",
                'img_size' => "{$imgWidth}x{$imgHeight}",
            ]);

            // Safe coordinate coercion (matching Element Inspection Protocol)
            $safeLeft = max(0, min($left, $imgWidth - 1));
            $safeTop = max(0, min($top, $imgHeight - 1));
            $safeWidth = max(1, min($width, $imgWidth - $safeLeft));
            $safeHeight = max(1, min($height, $imgHeight - $safeTop));

            if ($safeWidth <= 10 || $safeHeight <= 10) {
                Log::warning("Invalid crop dimensions after safety coercion", [
                    'width' => $safeWidth,
                    'height' => $safeHeight
                ]);
                return null;
            }

            // Crop the icon area
            $croppedImage = $image->crop($safeWidth, $safeHeight, $safeLeft, $safeTop);

            // ========================================
            // RESIZE TO MAX 100px (Element Inspection Standard)
            // Maintain aspect ratio, cap at 100px largest dimension
            // Using Intervention Image v3 scaleDown() for aspect-ratio-preserving resize
            // ========================================
            $maxIconSize = 100;
            $cropWidth = $croppedImage->width();
            $cropHeight = $croppedImage->height();

            if ($cropWidth > $maxIconSize || $cropHeight > $maxIconSize) {
                // scaleDown maintains aspect ratio and only shrinks if needed
                $croppedImage->scaleDown($maxIconSize, $maxIconSize);
                Log::info("📏 Resized icon: {$cropWidth}x{$cropHeight} -> {$croppedImage->width()}x{$croppedImage->height()}");
            }

            // Encode as PNG for better icon quality (transparency support, 90% quality)
            $iconData = $croppedImage->toPng()->toString();

            // Save cropped icon
            $iconFilename = "recordings/{$sessionId}/icon_{$sequence}.png";
            \Storage::disk('public')->put($iconFilename, $iconData);

            $iconUrl = \Storage::disk('public')->url($iconFilename);
            $iconSizeKb = round(strlen($iconData) / 1024, 1);

            Log::info("🎯 Icon cropped: {$iconFilename} ({$iconSizeKb}KB, {$croppedImage->width()}x{$croppedImage->height()})");

            return $iconUrl;
        } catch (\Exception $e) {
            Log::warning("Failed to crop element icon: {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Parse bounds from various formats
     * Supports:
     * - String: "[100,200][300,400]" (Android format)
     * - Array: {left: 100, top: 200, right: 300, bottom: 400}
     * - Array: [100, 200, 300, 400]
     * 
     * @param mixed $bounds
     * @return array|null ['left', 'top', 'right', 'bottom'] or null
     */
    private function parseBounds($bounds): ?array
    {
        if (empty($bounds)) {
            return null;
        }

        // Handle string format: "[100,200][300,400]"
        if (is_string($bounds)) {
            // Parse Android accessibility bounds format
            if (preg_match('/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/', $bounds, $matches)) {
                return [
                    'left' => (int) $matches[1],
                    'top' => (int) $matches[2],
                    'right' => (int) $matches[3],
                    'bottom' => (int) $matches[4],
                ];
            }
            return null;
        }

        // Handle array format with named keys
        if (is_array($bounds) || is_object($bounds)) {
            $bounds = (array) $bounds;

            if (isset($bounds['left'], $bounds['top'], $bounds['right'], $bounds['bottom'])) {
                return [
                    'left' => (int) $bounds['left'],
                    'top' => (int) $bounds['top'],
                    'right' => (int) $bounds['right'],
                    'bottom' => (int) $bounds['bottom'],
                ];
            }

            // Handle numeric array [left, top, right, bottom]
            if (isset($bounds[0], $bounds[1], $bounds[2], $bounds[3])) {
                return [
                    'left' => (int) $bounds[0],
                    'top' => (int) $bounds[1],
                    'right' => (int) $bounds[2],
                    'bottom' => (int) $bounds[3],
                ];
            }
        }

        return null;
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

            // Get device to broadcast stop command
            $device = Device::find($session->device_id);
            if ($device) {
                try {
                    // Broadcast stop command to APK via device channel
                    broadcast(new \App\Events\RecordingStatusChanged(
                        $device->device_id, // Android device ID
                        'stop_requested',   // Signal APK to stop recording
                        [
                            'session_id' => $sessionId,
                            'stopped_at' => now()->toISOString(),
                            'event_count' => count($session->actions ?? []),
                            'source' => 'web', // Indicate stop was initiated from web
                        ]
                    ))->toOthers();
                    Log::info("Broadcast recording stop to device: {$device->device_id}");
                } catch (\Exception $e) {
                    Log::warning("Failed to broadcast stop: " . $e->getMessage());
                }
            }

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

    /**
     * Check if workflow editor is listening for this device
     * Called by APK before starting recording to ensure there's a listener
     */
    public function checkListener(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'device_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $deviceId = $request->device_id;
        $cacheKey = "workflow:listener:{$deviceId}";

        // Check if there's an active listener (set by Editor when subscribing)
        $isListening = \Cache::has($cacheKey);
        $listenerData = $isListening ? \Cache::get($cacheKey) : null;

        Log::info("Check workflow listener for device: {$deviceId}", [
            'is_listening' => $isListening,
            'listener' => $listenerData
        ]);

        return response()->json([
            'success' => true,
            'is_listening' => $isListening,
            'listener' => $listenerData,
            'message' => $isListening
                ? 'Workflow editor is listening'
                : 'No workflow editor listening. Please open Flow Editor and select this device.'
        ]);
    }

    /**
     * Register workflow editor as listener for device
     * Called by Editor.jsx when subscribing to device channel
     */
    public function registerListener(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'device_id' => 'required|string',
            'flow_id' => 'sometimes|integer',
            'user_id' => 'sometimes|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $deviceId = $request->device_id;
        $cacheKey = "workflow:listener:{$deviceId}";

        // Store listener info with 1 hour TTL (will be refreshed or removed when editor closes)
        $listenerData = [
            'device_id' => $deviceId,
            'flow_id' => $request->flow_id,
            'user_id' => $request->user_id ?? auth()->id(),
            'registered_at' => now()->toISOString(),
        ];

        \Cache::put($cacheKey, $listenerData, now()->addHour());

        Log::info("Workflow listener registered for device: {$deviceId}", $listenerData);

        // Broadcast to APK that Editor is now listening
        try {
            $device = Device::where('device_id', $deviceId)->first();
            if ($device) {
                broadcast(new \App\Events\RecordingStatusChanged(
                    $deviceId,
                    'editor_connected',
                    [
                        'flow_id' => $request->flow_id,
                        'user_id' => $request->user_id ?? auth()->id(),
                    ]
                ))->toOthers();
            }
        } catch (\Exception $e) {
            Log::warning("Failed to broadcast editor_connected: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Listener registered',
            'listener' => $listenerData
        ]);
    }

    /**
     * Unregister workflow editor listener for device
     * Called by Editor.jsx when unsubscribing from device channel
     */
    public function unregisterListener(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'device_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $deviceId = $request->device_id;
        $cacheKey = "workflow:listener:{$deviceId}";

        \Cache::forget($cacheKey);

        Log::info("Workflow listener unregistered for device: {$deviceId}");

        // Broadcast to APK that Editor has disconnected
        try {
            $device = Device::where('device_id', $deviceId)->first();
            if ($device) {
                broadcast(new \App\Events\RecordingStatusChanged(
                    $deviceId,
                    'editor_disconnected',
                    []
                ))->toOthers();
            }
        } catch (\Exception $e) {
            Log::warning("Failed to broadcast editor_disconnected: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Listener unregistered'
        ]);
    }
}

