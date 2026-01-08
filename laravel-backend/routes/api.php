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
    Route::get('/devices', [DeviceController::class, 'index']);
    Route::delete('/devices/{id}', [DeviceController::class, 'destroy']);
    Route::post('/devices/logout-all', [DeviceController::class, 'logoutAll']);

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
    });
});
