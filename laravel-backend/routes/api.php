<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\Api\ServicePackageController;
use App\Http\Controllers\Api\InteractionController;
use App\Http\Controllers\Api\NotificationController;
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

        // Recording events from Android app
        Route::post('/recording-events', [\App\Http\Controllers\Api\RecordingEventController::class, 'store']);

        // Recording session management for workflow automation
        Route::post('/recording-sessions/start', [\App\Http\Controllers\Api\RecordingEventController::class, 'startSession']);
        Route::post('/recording-sessions/{sessionId}/stop', [\App\Http\Controllers\Api\RecordingEventController::class, 'stopSession']);
        Route::post('/recording-actions', [\App\Http\Controllers\Api\RecordingEventController::class, 'storeAction']);

        // Note: heartbeat route removed - now using Soketi presence webhooks
    });

    // Recording API for real-time workflow sync
    Route::prefix('recording')->group(function () {
        Route::post('/start', [\App\Http\Controllers\Api\RecordingController::class, 'start']);
        Route::post('/event', [\App\Http\Controllers\Api\RecordingController::class, 'event']);
        Route::post('/stop', [\App\Http\Controllers\Api\RecordingController::class, 'stop']);
        Route::get('/sessions', [\App\Http\Controllers\Api\RecordingController::class, 'index']);
        Route::get('/sessions/{sessionId}', [\App\Http\Controllers\Api\RecordingController::class, 'show']);
        Route::post('/convert-to-nodes', [\App\Http\Controllers\Api\RecordingController::class, 'convertToNodes']);
    });

    // Batch job creation
    Route::post('/flows/{flow}/jobs/batch', [\App\Http\Controllers\WorkflowJobController::class, 'storeBatch']);

    // Workflow test-run progress reporting (APK sends real-time action status)
    Route::prefix('workflow')->group(function () {
        Route::post('/test-run/progress', [\App\Http\Controllers\FlowController::class, 'reportTestRunProgress']);
    });

    // Workflow listener management (for APK recording prerequisite check)
    Route::prefix('recording-listener')->group(function () {
        Route::post('/check', [\App\Http\Controllers\Api\RecordingEventController::class, 'checkListener']);
        Route::post('/register', [\App\Http\Controllers\Api\RecordingEventController::class, 'registerListener']);
        Route::post('/unregister', [\App\Http\Controllers\Api\RecordingEventController::class, 'unregisterListener']);
    });
});

// Pusher/Soketi auth endpoint for presence channels (requires auth)
Route::middleware('auth:sanctum')->post('/pusher/auth', [\App\Http\Controllers\Api\SocketAuthController::class, 'auth']);

// Pusher/Soketi webhook for presence events (no auth - verified by webhook secret)
Route::post('/pusher/webhook', [\App\Http\Controllers\Api\PresenceWebhookController::class, 'handle']);

// Pusher presence disconnect detection (new implementation for real-time device status)
Route::post('/pusher/webhooks', [\App\Http\Controllers\PusherWebhookController::class, 'handle']);

// Job API endpoints for APK
Route::prefix('jobs')->group(function () {
    // Get job action config (APK calls this when receiving job:new)
    Route::get('/{job}/config', [\App\Http\Controllers\Api\JobApiController::class, 'getConfig'])
        ->name('api.jobs.config');

    // APK reports job progress
    Route::middleware('auth:sanctum')->group(function () {
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
