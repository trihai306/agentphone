<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
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
    ) {
    }

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

        $this->notificationService->markAsRead($id, $user);

        return Inertia::render('Notifications/Show', [
            'notification' => $notification,
        ]);
    }

    public function markAsRead(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        $success = $this->notificationService->markAsRead($id, $user);

        if (!$success) {
            return back()->with('error', 'Notification not found');
        }

        return back()->with('success', 'Notification marked as read');
    }

    public function markAllAsRead(Request $request): RedirectResponse
    {
        $user = $request->user();

        $count = $this->notificationService->markAllAsRead($user);

        return back()->with('success', "{$count} notifications marked as read");
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        $success = $this->notificationService->markAsRead($id, $user);

        if (!$success) {
            return back()->with('error', 'Notification not found');
        }

        return back()->with('success', 'Notification removed');
    }

    public function refresh(Request $request): RedirectResponse
    {
        return back();
    }
}
