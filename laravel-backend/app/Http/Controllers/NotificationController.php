<?php

namespace App\Http\Controllers;

use App\Models\SystemNotification;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    /**
     * Display all notifications for the user
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $notifications = $this->notificationService->getNotificationsForUser($user, 50, false);
        $unreadCount = $this->notificationService->getUnreadCountForUser($user);

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
            'unreadCount' => $unreadCount,
        ]);
    }

    /**
     * Show a single notification
     */
    public function show(Request $request, int $id): Response|RedirectResponse
    {
        $user = $request->user();

        $notification = SystemNotification::active()
            ->forUser($user)
            ->find($id);

        if (!$notification) {
            return redirect()
                ->route('notifications.index')
                ->with('error', 'Notification not found');
        }

        // Mark as read when viewing
        $this->notificationService->markAsRead($id, $user);

        return Inertia::render('Notifications/Show', [
            'notification' => $notification,
        ]);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        $success = $this->notificationService->markAsRead($id, $user);

        if (!$success) {
            return back()->with('error', 'Notification not found');
        }

        return back()->with('success', 'Notification marked as read');
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request): RedirectResponse
    {
        $user = $request->user();

        $count = $this->notificationService->markAllAsRead($user);

        return back()->with('success', "{$count} notifications marked as read");
    }

    /**
     * Delete/dismiss a notification for the user
     */
    public function destroy(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        // For users, we just mark as read (soft delete behavior)
        $success = $this->notificationService->markAsRead($id, $user);

        if (!$success) {
            return back()->with('error', 'Notification not found');
        }

        return back()->with('success', 'Notification removed');
    }

    /**
     * Partial reload for notifications data (for Inertia partial reloads)
     * This is useful when WebSocket triggers a refresh
     */
    public function refresh(Request $request): RedirectResponse
    {
        // Simply redirect back - Inertia will reload shared props including notifications
        return back();
    }
}
