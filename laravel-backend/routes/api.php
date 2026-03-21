<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\Api\ServicePackageController;
use App\Http\Controllers\Api\InteractionController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\AIOrchestrationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public authentication routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Heartbeat route (needs auth) - alias for backwards compatibility
Route::middleware('auth:sanctum')->post('/heartbeat', [DeviceController::class, 'heartbeat']);

// Public package listing (no auth required to view packages)
Route::get('/packages', [ServicePackageController::class, 'index']);
Route::get('/packages/{package}', [ServicePackageController::class, 'show']);

// Interaction routes (can accept both authenticated and unauthenticated requests)
Route::prefix('interactions')->group(function () {
    Route::post('/', [InteractionController::class, 'store']);
    Route::post('/sync', [InteractionController::class, 'sync']);
    Route::get('/', [InteractionController::class, 'index']);
    Route::get('/stats', [InteractionController::class, 'stats']);
    Route::get('/sessions', [InteractionController::class, 'sessions']);
    Route::post('/session/new', [InteractionController::class, 'createSession']);
    Route::get('/{interaction}', [InteractionController::class, 'show']);
    Route::delete('/{interaction}', [InteractionController::class, 'destroy']);
});

// Fetch Element Inspector screenshot from cache (public - cache key provides security via uniqueness + 5min TTL)
// This route is public because browser fetch() can't easily send Sanctum token
Route::get('/inspect-screenshot/{key}', function ($key) {
    // Validate key format to prevent cache probing
    if (!preg_match('/^inspect_screenshot_\d+_.+_\d+$/', $key)) {
        return response()->json(['error' => 'Invalid key format'], 400);
    }
    $screenshot = \Illuminate\Support\Facades\Cache::get($key);
    if (!$screenshot) {
        return response()->json(['error' => 'Screenshot not found or expired'], 404);
    }
    return response()->json(['screenshot' => $screenshot]);
});

// Protected routes (require Sanctum authentication)
Route::middleware('auth:sanctum')->group(function () {
    // User info
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Logout
    Route::post('/logout', [AuthController::class, 'logout']);

    // Device management
    Route::post('/devices', [DeviceController::class, 'store']);
    Route::post('/devices/register', [DeviceController::class, 'store']); // Alias for compatibility
    Route::get('/devices', [DeviceController::class, 'index']);
    Route::get('/devices/{id}', [DeviceController::class, 'show']);
    Route::post('/devices/{id}/status', [DeviceController::class, 'updateStatusById']); // APK status update with ID
    Route::post('/devices/status', [DeviceController::class, 'updateStatusByDeviceId']); // APK status update (no ID in route)
    Route::post('/devices/heartbeat', [DeviceController::class, 'heartbeat']); // APK heartbeat
    Route::delete('/devices/{id}', [DeviceController::class, 'destroy']);
    Route::post('/devices/logout-all', [DeviceController::class, 'logoutAll']);

    // Media library API (for modals/pickers)
    Route::get('/media', [\App\Http\Controllers\MediaController::class, 'apiList']);
    Route::get('/media/folders', [\App\Http\Controllers\MediaController::class, 'apiFolders']);


    // Element Inspector - request elements from device and receive results
    Route::post('/devices/inspect', [DeviceController::class, 'inspectElements']);
    Route::post('/devices/inspect-result', [DeviceController::class, 'inspectElementsResult']);


    // Realtime accessibility check - request status from device via socket
    Route::post('/devices/check-accessibility', [DeviceController::class, 'checkAccessibility']);
    Route::post('/devices/check-accessibility-result', [DeviceController::class, 'checkAccessibilityResult']);

    // Icon template matching - find icon on screen using template image
    Route::post('/devices/find-icon', [DeviceController::class, 'findIcon']);

    // Visual inspection (OCR) 
    Route::post('/devices/visual-inspect', [DeviceController::class, 'visualInspect']);

    // Installed apps list - request and receive from device
    Route::post('/devices/apps', [DeviceController::class, 'getInstalledApps']);
    Route::post('/devices/apps-result', [DeviceController::class, 'installedAppsResult']);

    // Real-time ping/pong verification (more accurate than Redis/DB check)
    Route::post('/devices/verify-online', [DeviceController::class, 'verifyOnline']);
    Route::post('/devices/pong', [DeviceController::class, 'pongResult']);

    // Device online status (quick Redis check)
    Route::get('/devices/online-status', [DeviceController::class, 'getOnlineStatus']);

    // WebRTC screen streaming (browser ↔ APK signaling relay)
    Route::post('/devices/{device}/stream/start', [\App\Http\Controllers\Api\WebRTCSignalController::class, 'startStream']);
    Route::post('/devices/{device}/stream/stop', [\App\Http\Controllers\Api\WebRTCSignalController::class, 'stopStream']);
    Route::post('/webrtc/signal', [\App\Http\Controllers\Api\WebRTCSignalController::class, 'signal']);
    Route::post('/devices/stream/mjpeg-info', [\App\Http\Controllers\Api\WebRTCSignalController::class, 'receiveMjpegInfo']);
    Route::post('/devices/stream/frame', [\App\Http\Controllers\Api\WebRTCSignalController::class, 'receiveFrame']);

    // Screen streaming via HTTP polling (simple, reliable alternative to WebSocket)
    Route::post('/devices/{device_id}/screen/start', function (Request $request, string $device_id) {
        $device = $request->user()->devices()->where('device_id', $device_id)->first();
        if (!$device) return response()->json(['error' => 'Device not found'], 404);

        // Tell APK to start streaming via socket event
        broadcast(new \App\Events\DispatchJobToDevice($device, [
            'viewer_user_id' => $request->user()->id,
        ], 'screen:start'));

        // Also set a Redis flag so APK heartbeat knows to stream
        \Illuminate\Support\Facades\Cache::put("screen:streaming:{$device->device_id}", true, now()->addMinutes(2));

        return response()->json(['success' => true]);
    });

    Route::post('/devices/{device_id}/screen/stop', function (Request $request, string $device_id) {
        $device = $request->user()->devices()->where('device_id', $device_id)->first();
        if (!$device) return response()->json(['error' => 'Device not found'], 404);

        broadcast(new \App\Events\DispatchJobToDevice($device, [], 'screen:stop'));
        \Illuminate\Support\Facades\Cache::forget("screen:streaming:{$device->device_id}");

        return response()->json(['success' => true]);
    });

    // APK posts screenshot frames here
    Route::post('/devices/screen/frame', function (Request $request) {
        $request->validate(['device_id' => 'required|string', 'frame' => 'required|string']);
        // Store in Redis with 5s TTL (auto-expires if APK stops sending)
        \Illuminate\Support\Facades\Redis::setex(
            'screen:frame:' . $request->input('device_id'),
            5,
            $request->input('frame')
        );
        return response()->json(['success' => true]);
    });

    // (GET frame endpoint moved outside auth group - see below)

    // Subscription management
    Route::prefix('subscriptions')->group(function () {
        Route::get('/current', [ServicePackageController::class, 'current']);
        Route::get('/', [ServicePackageController::class, 'history']);
        Route::post('/', [ServicePackageController::class, 'subscribe']);
        Route::delete('/{subscription}', [ServicePackageController::class, 'cancel']);
        Route::patch('/{subscription}/auto-renew', [ServicePackageController::class, 'updateAutoRenew']);
    });

    // Notification routes
    Route::prefix('notifications')->group(function () {
        // System notifications (database-backed)
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::get('/{id}', [NotificationController::class, 'show'])->where('id', '[0-9]+');
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead'])->where('id', '[0-9]+');
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/{id}', [NotificationController::class, 'destroy'])->where('id', '[0-9]+');
        Route::post('/send', [NotificationController::class, 'sendSystemNotification']);

        // Laravel database notifications (Filament)
        Route::get('/database', [NotificationController::class, 'getDatabaseNotifications']);
        Route::post('/database/{id}/read', [NotificationController::class, 'markDatabaseNotificationAsRead']);
        Route::post('/database/read-all', [NotificationController::class, 'markAllDatabaseNotificationsAsRead']);

        // Test endpoints
        Route::post('/test/user', [NotificationController::class, 'testUserNotification']);
        Route::post('/test/admin', [NotificationController::class, 'testAdminNotification']);
        Route::post('/test/filament', [NotificationController::class, 'testFilamentNotification']);
        Route::post('/test/filament-admin', [NotificationController::class, 'testFilamentAdminNotification']);
        Route::post('/test/announcement', [NotificationController::class, 'testAnnouncement']);

        // Recording events from Android app (rate limited: 60 req/min for session ops, 300/min for events)
        Route::post('/recording-events', [\App\Http\Controllers\Api\RecordingEventController::class, 'store']);

        // Recording session management for workflow automation
        Route::middleware('throttle:60,1')->group(function () {
            Route::post('/recording-sessions/start', [\App\Http\Controllers\Api\RecordingEventController::class, 'startSession']);
            Route::post('/recording-sessions/{sessionId}/stop', [\App\Http\Controllers\Api\RecordingEventController::class, 'stopSession']);
        });
        Route::post('/recording-actions', [\App\Http\Controllers\Api\RecordingEventController::class, 'storeAction'])
            ->middleware('throttle:300,1');

        // Note: heartbeat route removed - now using Soketi presence webhooks
    });

    // Recording API for real-time workflow sync (rate limited)
    Route::prefix('recording')->group(function () {
        Route::post('/start', [\App\Http\Controllers\Api\RecordingController::class, 'start'])
            ->middleware('throttle:30,1');
        Route::post('/event', [\App\Http\Controllers\Api\RecordingController::class, 'event'])
            ->middleware('throttle:300,1');
        Route::post('/stop', [\App\Http\Controllers\Api\RecordingController::class, 'stop'])
            ->middleware('throttle:30,1');
        Route::get('/sessions', [\App\Http\Controllers\Api\RecordingController::class, 'index']);
        Route::get('/sessions/{sessionId}', [\App\Http\Controllers\Api\RecordingController::class, 'show']);
        Route::post('/convert-to-nodes', [\App\Http\Controllers\Api\RecordingController::class, 'convertToNodes']);
    });

    // Batch job creation
    Route::post('/flows/{flow}/jobs/batch', [\App\Http\Controllers\WorkflowJobController::class, 'storeBatch']);

    // Workflow test-run progress reporting (APK sends real-time action status)
    Route::prefix('workflow')->group(function () {
        Route::post('/test-run/progress', [\App\Http\Controllers\FlowController::class, 'reportTestRunProgress']);

        // APK polls for pending test runs (fallback when socket event doesn't arrive)
        Route::get('/test-run/pending/{device_id}', function (Request $request, string $device_id) {
            $cacheKey = "test_run:pending:{$device_id}";
            $payload = \Illuminate\Support\Facades\Cache::get($cacheKey);
            if (!$payload) {
                return response()->json(['pending' => false]);
            }
            // Consume the test run (one-time delivery)
            \Illuminate\Support\Facades\Cache::forget($cacheKey);
            return response()->json(['pending' => true, 'payload' => $payload]);
        });
    });

    // Workflow listener management (for APK recording prerequisite check)
    Route::prefix('recording-listener')->group(function () {
        Route::post('/check', [\App\Http\Controllers\Api\RecordingEventController::class, 'checkListener']);
        Route::post('/register', [\App\Http\Controllers\Api\RecordingEventController::class, 'registerListener']);
        Route::post('/unregister', [\App\Http\Controllers\Api\RecordingEventController::class, 'unregisterListener']);
    });

    // Debug: Test broadcast to device (for diagnosing socket delivery issues)
    Route::post('/devices/{device_id}/test-broadcast', function (Request $request, string $device_id) {
        $user = $request->user();
        $device = $user->devices()->where('device_id', $device_id)->first();
        if (!$device) {
            return response()->json(['error' => 'Device not found'], 404);
        }
        $payload = [
            'test' => true,
            'message' => $request->input('message', 'ping from debug endpoint'),
            'timestamp' => now()->timestamp * 1000,
        ];
        $eventType = $request->input('event_type', 'workflow:test');
        try {
            broadcast(new \App\Events\DispatchJobToDevice($device, $payload, $eventType));
            return response()->json([
                'success' => true,
                'channel' => 'private-device.' . $device->device_id,
                'event' => $eventType,
                'payload' => $payload,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ], 500);
        }
    });

    // AI Orchestration API (for AI Agent node)
    Route::prefix('ai')->group(function () {
        Route::post('/execute', [AIOrchestrationController::class, 'execute']);
        Route::post('/test-prompt', [AIOrchestrationController::class, 'testPrompt']);
        Route::get('/models/{provider}', [AIOrchestrationController::class, 'getModels']);
        Route::post('/estimate-tokens', [AIOrchestrationController::class, 'estimateTokens']);
        Route::post('/generate-flow', [AIOrchestrationController::class, 'generateFlow']);
    });
});

// AI model listing (public - no auth required for browsing models)
Route::get('/ai/models/{provider}', [AIOrchestrationController::class, 'getModels']);

// Screen frame polling (legacy fallback)
Route::get('/devices/{device_id}/screen/frame', function (Request $request, string $device_id) {
    $frame = \Illuminate\Support\Facades\Redis::get('screen:frame:' . $device_id);
    if (!$frame) return response()->json(['frame' => null]);
    return response()->json(['frame' => $frame]);
});

// SSE (Server-Sent Events) stream — single persistent connection, pushes frames instantly
Route::get('/devices/{device_id}/screen/stream', function (Request $request, string $device_id) {
    return response()->stream(function () use ($device_id) {
        $lastHash = '';
        $idle = 0;

        // Send SSE headers
        echo "retry: 3000\n\n";
        ob_flush();
        flush();

        while (true) {
            $frame = \Illuminate\Support\Facades\Redis::get('screen:frame:' . $device_id);

            if ($frame) {
                // Simple hash to detect changes (first 100 chars is enough)
                $hash = md5(substr($frame, 0, 100));

                if ($hash !== $lastHash) {
                    $lastHash = $hash;
                    $idle = 0;
                    echo "event: frame\ndata: {$frame}\n\n";
                    ob_flush();
                    flush();
                }
            }

            // Keep-alive comment every 15s of idle
            $idle++;
            if ($idle > 50) { // 50 * 300ms = 15s
                echo ": keepalive\n\n";
                ob_flush();
                flush();
                $idle = 0;
            }

            // Check if connection is still alive
            if (connection_aborted()) {
                break;
            }

            usleep(300000); // 300ms — check Redis 3x/second
        }
    }, 200, [
        'Content-Type' => 'text/event-stream',
        'Cache-Control' => 'no-cache, no-store, must-revalidate',
        'Connection' => 'keep-alive',
        'X-Accel-Buffering' => 'no', // Disable nginx buffering
    ]);
});

// Pusher/Soketi auth endpoint for presence channels (requires auth)
Route::middleware('auth:sanctum')->post('/pusher/auth', [\App\Http\Controllers\Api\SocketAuthController::class, 'auth']);

// Pusher/Soketi webhook for presence events (no auth - verified by webhook secret)
Route::post('/pusher/webhook', [\App\Http\Controllers\Api\PresenceWebhookController::class, 'handle']);

// REMOVED: Legacy Pusher webhook - presence now handled by heartbeat + Redis TTL
// Route::post('/pusher/webhooks', [\App\Http\Controllers\PusherWebhookController::class, 'handle']);

// Job API endpoints for APK
Route::prefix('jobs')->group(function () {
    // APK reports job progress
    Route::middleware('auth:sanctum')->group(function () {
        // Get job action config (APK calls this when receiving job:new)
        Route::get('/{job}/config', [\App\Http\Controllers\Api\JobApiController::class, 'getConfig'])
            ->name('api.jobs.config');

        // Today's job statistics for APK dashboard
        Route::get('/stats/today', [\App\Http\Controllers\Api\JobApiController::class, 'getTodayStats']);

        // Polling endpoints for APK (fallback when WebSocket unavailable)
        Route::get('/pending', [\App\Http\Controllers\Api\JobApiController::class, 'getPendingJobs']);
        Route::post('/{job}/claim', [\App\Http\Controllers\Api\JobApiController::class, 'claimJob']);

        Route::post('/{job}/started', [\App\Http\Controllers\Api\JobApiController::class, 'reportStarted']);
        Route::post('/{job}/task-progress', [\App\Http\Controllers\Api\JobApiController::class, 'reportTaskProgress']);
        Route::post('/{job}/completed', [\App\Http\Controllers\Api\JobApiController::class, 'reportCompleted']);
        Route::post('/{job}/log', [\App\Http\Controllers\Api\JobApiController::class, 'addLog']);
    });
});
