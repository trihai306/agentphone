<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemNotification;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    // ============================================
    // SYSTEM NOTIFICATIONS (NEW DATABASE-BACKED)
    // ============================================

    /**
     * Get all notifications for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $limit = $request->input('limit', 50);
        $unreadOnly = $request->boolean('unread_only', false);

        $notifications = $this->notificationService->getNotificationsForUser(
            $user,
            $limit,
            $unreadOnly
        );

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $notifications,
                'unread_count' => $this->notificationService->getUnreadCountForUser($user),
            ],
        ]);
    }

    /**
     * Get unread count for the authenticated user
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $count = $this->notificationService->getUnreadCountForUser($user);

        return response()->json([
            'success' => true,
            'data' => [
                'unread_count' => $count,
            ],
        ]);
    }

    /**
     * Get a single notification
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $notification = SystemNotification::active()
            ->forUser($user)
            ->find($id);

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found',
            ], 404);
        }

        $notification->is_read_by_current_user = $notification->isReadByUser($user);

        return response()->json([
            'success' => true,
            'data' => $notification,
        ]);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $success = $this->notificationService->markAsRead($id, $user);

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
            'data' => [
                'unread_count' => $this->notificationService->getUnreadCountForUser($user),
            ],
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $count = $this->notificationService->markAllAsRead($user);

        return response()->json([
            'success' => true,
            'message' => "{$count} notifications marked as read",
            'data' => [
                'marked_count' => $count,
                'unread_count' => 0,
            ],
        ]);
    }

    /**
     * Delete/hide a notification for the user
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // For users, we just mark as read (soft delete behavior)
        $success = $this->notificationService->markAsRead($id, $user);

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Notification removed',
        ]);
    }

    // ============================================
    // LARAVEL DATABASE NOTIFICATIONS (FILAMENT)
    // ============================================

    /**
     * Get Laravel database notifications (Filament notifications)
     */
    public function getDatabaseNotifications(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $limit = $request->input('limit', 20);

        $notifications = $user->notifications()
            ->latest()
            ->limit($limit)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'data' => $notification->data,
                    'read_at' => $notification->read_at,
                    'created_at' => $notification->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $notifications,
                'unread_count' => $user->unreadNotifications()->count(),
            ],
        ]);
    }

    /**
     * Mark a database notification as read
     */
    public function markDatabaseNotificationAsRead(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $notification = $user->notifications()->find($id);

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found',
            ], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
        ]);
    }

    /**
     * Mark all database notifications as read
     */
    public function markAllDatabaseNotificationsAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $user->unreadNotifications->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read',
        ]);
    }

    // ============================================
    // TEST ENDPOINTS (ORIGINAL)
    // ============================================

    /**
     * Send a test notification to current user (via WebSocket)
     */
    public function testUserNotification(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'sometimes|string|max:255',
            'message' => 'sometimes|string|max:1000',
            'type' => 'sometimes|in:info,success,warning,error',
        ]);

        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $this->notificationService->notifyUser(
            $user->id,
            $request->input('title', 'Test Notification'),
            $request->input('message', 'This is a test notification from the API'),
            $request->input('type', 'info'),
            ['source' => 'api_test']
        );

        return response()->json([
            'success' => true,
            'message' => 'User notification sent successfully',
        ]);
    }

    /**
     * Send a test notification to all admins (via WebSocket)
     */
    public function testAdminNotification(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'sometimes|string|max:255',
            'message' => 'sometimes|string|max:1000',
            'type' => 'sometimes|in:info,success,warning,error',
        ]);

        $this->notificationService->notifyAdmins(
            $request->input('title', 'Admin Notification'),
            $request->input('message', 'This is a test admin notification'),
            $request->input('type', 'info'),
            ['source' => 'api_test']
        );

        return response()->json([
            'success' => true,
            'message' => 'Admin notification sent successfully',
        ]);
    }

    /**
     * Send a test Filament notification to current admin (shows in bell icon)
     */
    public function testFilamentNotification(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'sometimes|string|max:255',
            'body' => 'sometimes|string|max:1000',
            'type' => 'sometimes|in:info,success,warning,danger',
        ]);

        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $this->notificationService->sendFilamentNotification(
            $user,
            $request->input('title', 'Filament Test'),
            $request->input('body', 'This is a test Filament notification'),
            $request->input('type', 'info')
        );

        return response()->json([
            'success' => true,
            'message' => 'Filament notification sent successfully',
        ]);
    }

    /**
     * Send a test Filament notification to all admins
     */
    public function testFilamentAdminNotification(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'sometimes|string|max:255',
            'body' => 'sometimes|string|max:1000',
            'type' => 'sometimes|in:info,success,warning,danger',
        ]);

        $this->notificationService->sendFilamentNotificationToAdmins(
            $request->input('title', 'Admin Alert'),
            $request->input('body', 'This is a test notification for all admins'),
            $request->input('type', 'info')
        );

        return response()->json([
            'success' => true,
            'message' => 'Filament admin notification sent successfully',
        ]);
    }

    /**
     * Send a system-wide announcement
     */
    public function testAnnouncement(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'sometimes|string|max:255',
            'message' => 'sometimes|string|max:1000',
            'type' => 'sometimes|in:info,success,warning,error',
        ]);

        $this->notificationService->announce(
            $request->input('title', 'System Announcement'),
            $request->input('message', 'This is a test system announcement'),
            $request->input('type', 'info'),
            ['source' => 'api_test']
        );

        return response()->json([
            'success' => true,
            'message' => 'System announcement sent successfully',
        ]);
    }

    /**
     * Create and send a system notification with database storage
     */
    public function sendSystemNotification(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string|max:1000',
            'type' => 'sometimes|in:info,success,warning,error',
            'target' => 'sometimes|in:all,admins,specific_user',
            'target_user_id' => 'required_if:target,specific_user|integer|exists:users,id',
            'action_url' => 'sometimes|string|url|max:500',
            'action_text' => 'sometimes|string|max:100',
        ]);

        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $notification = $this->notificationService->createSystemNotification(
            title: $request->input('title'),
            message: $request->input('message'),
            type: $request->input('type', 'info'),
            target: $request->input('target', 'all'),
            targetUserId: $request->input('target_user_id'),
            createdBy: $user->id,
            actionUrl: $request->input('action_url'),
            actionText: $request->input('action_text')
        );

        return response()->json([
            'success' => true,
            'message' => 'System notification created and sent',
            'data' => $notification,
        ]);
    }
}
