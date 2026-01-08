<?php

namespace App\Services;

use App\Events\AdminNotification;
use App\Events\FilamentBroadcastNotification;
use App\Events\SystemAnnouncement;
use App\Events\UserNotification;
use App\Models\SystemNotification;
use App\Models\User;
use Filament\Notifications\Notification as FilamentNotification;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send notification to a specific user (WebSocket only)
     */
    public function notifyUser(
        int|User $user,
        string $title,
        string $message,
        string $type = 'info',
        array $data = []
    ): void {
        $userId = $user instanceof User ? $user->id : $user;

        event(new UserNotification($userId, $title, $message, $type, $data));
    }

    /**
     * Send notification to all admins (WebSocket only)
     */
    public function notifyAdmins(
        string $title,
        string $message,
        string $type = 'info',
        array $data = []
    ): void {
        event(new AdminNotification($title, $message, $type, $data));
    }

    /**
     * Send system-wide announcement (public channel)
     */
    public function announce(
        string $title,
        string $message,
        string $type = 'info',
        array $data = []
    ): void {
        event(new SystemAnnouncement($title, $message, $type, $data));
    }

    /**
     * Send Filament native notification to a user (shows in admin panel bell icon)
     * This also saves to database and broadcasts via WebSocket
     */
    public function sendFilamentNotification(
        int|User $user,
        string $title,
        string $body,
        string $type = 'info',
        ?string $icon = null,
        ?string $iconColor = null,
        array $actions = []
    ): void {
        $userModel = $user instanceof User ? $user : User::find($user);

        if (!$userModel) {
            Log::warning("NotificationService: User not found for ID: {$user}");
            return;
        }

        $notification = FilamentNotification::make()
            ->title($title)
            ->body($body);

        // Set notification type
        match ($type) {
            'success' => $notification->success(),
            'warning' => $notification->warning(),
            'danger', 'error' => $notification->danger(),
            default => $notification->info(),
        };

        // Set custom icon if provided
        if ($icon) {
            $notification->icon($icon);
        }

        if ($iconColor) {
            $notification->iconColor($iconColor);
        }

        // Send to database (shows in Filament notification bell)
        $notification->sendToDatabase($userModel);

        // Broadcast for real-time update
        event(new FilamentBroadcastNotification($userModel->id, $notification));
    }

    /**
     * Send Filament notification to all admins
     */
    public function sendFilamentNotificationToAdmins(
        string $title,
        string $body,
        string $type = 'info',
        ?string $icon = null,
        ?string $iconColor = null,
        array $actions = []
    ): void {
        $admins = User::whereHas('roles', function ($query) {
            $query->whereIn('name', ['super_admin', 'admin']);
        })->get();

        foreach ($admins as $admin) {
            $this->sendFilamentNotification(
                $admin,
                $title,
                $body,
                $type,
                $icon,
                $iconColor,
                $actions
            );
        }
    }

    // ============================================
    // DATABASE NOTIFICATION METHODS (NEW)
    // ============================================

    /**
     * Create a system notification and optionally broadcast it
     */
    public function createSystemNotification(
        string $title,
        string $message,
        string $type = 'info',
        string $target = 'all',
        ?int $targetUserId = null,
        ?int $createdBy = null,
        array $data = [],
        ?string $actionUrl = null,
        ?string $actionText = null,
        ?\DateTimeInterface $scheduledAt = null,
        ?\DateTimeInterface $expiresAt = null,
        bool $broadcast = true
    ): SystemNotification {
        $notification = SystemNotification::create([
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'target' => $target,
            'target_user_id' => $target === SystemNotification::TARGET_SPECIFIC_USER ? $targetUserId : null,
            'created_by' => $createdBy ?? auth()->id(),
            'data' => $data,
            'action_url' => $actionUrl,
            'action_text' => $actionText,
            'scheduled_at' => $scheduledAt,
            'expires_at' => $expiresAt,
            'is_active' => true,
        ]);

        // Broadcast immediately if no scheduled time and broadcast is enabled
        if ($broadcast && !$scheduledAt) {
            $this->broadcastSystemNotification($notification);
        }

        return $notification;
    }

    /**
     * Broadcast a system notification to appropriate channels
     */
    public function broadcastSystemNotification(SystemNotification $notification): void
    {
        if ($notification->is_broadcasted) {
            return;
        }

        $broadcastData = [
            'notification_id' => $notification->id,
            'action_url' => $notification->action_url,
            'action_text' => $notification->action_text,
        ];

        switch ($notification->target) {
            case SystemNotification::TARGET_ALL:
                $this->announce(
                    $notification->title,
                    $notification->message,
                    $notification->type,
                    $broadcastData
                );
                break;

            case SystemNotification::TARGET_ADMINS:
                $this->notifyAdmins(
                    $notification->title,
                    $notification->message,
                    $notification->type,
                    $broadcastData
                );
                // Also send Filament notifications
                $this->sendFilamentNotificationToAdmins(
                    $notification->title,
                    $notification->message,
                    $notification->type
                );
                break;

            case SystemNotification::TARGET_SPECIFIC_USER:
                if ($notification->target_user_id) {
                    $this->notifyUser(
                        $notification->target_user_id,
                        $notification->title,
                        $notification->message,
                        $notification->type,
                        $broadcastData
                    );
                }
                break;
        }

        $notification->update([
            'is_broadcasted' => true,
            'broadcasted_at' => now(),
        ]);
    }

    /**
     * Send notification to a specific user with database storage
     */
    public function sendToUser(
        int|User $user,
        string $title,
        string $message,
        string $type = 'info',
        array $data = [],
        ?string $actionUrl = null,
        ?string $actionText = null
    ): SystemNotification {
        $userId = $user instanceof User ? $user->id : $user;

        return $this->createSystemNotification(
            title: $title,
            message: $message,
            type: $type,
            target: SystemNotification::TARGET_SPECIFIC_USER,
            targetUserId: $userId,
            data: $data,
            actionUrl: $actionUrl,
            actionText: $actionText
        );
    }

    /**
     * Send notification to all admins with database storage
     */
    public function sendToAdmins(
        string $title,
        string $message,
        string $type = 'info',
        array $data = [],
        ?string $actionUrl = null,
        ?string $actionText = null
    ): SystemNotification {
        return $this->createSystemNotification(
            title: $title,
            message: $message,
            type: $type,
            target: SystemNotification::TARGET_ADMINS,
            data: $data,
            actionUrl: $actionUrl,
            actionText: $actionText
        );
    }

    /**
     * Send announcement to all users with database storage
     */
    public function sendAnnouncement(
        string $title,
        string $message,
        string $type = 'info',
        array $data = [],
        ?string $actionUrl = null,
        ?string $actionText = null,
        ?\DateTimeInterface $expiresAt = null
    ): SystemNotification {
        return $this->createSystemNotification(
            title: $title,
            message: $message,
            type: $type,
            target: SystemNotification::TARGET_ALL,
            data: $data,
            actionUrl: $actionUrl,
            actionText: $actionText,
            expiresAt: $expiresAt
        );
    }

    /**
     * Get notifications for a user
     */
    public function getNotificationsForUser(User $user, int $limit = 50, bool $unreadOnly = false)
    {
        $query = SystemNotification::active()
            ->forUser($user)
            ->orderBy('created_at', 'desc');

        if ($unreadOnly) {
            $query->unreadByUser($user);
        }

        return $query->limit($limit)->get()->map(function ($notification) use ($user) {
            $notification->is_read_by_current_user = $notification->isReadByUser($user);
            return $notification;
        });
    }

    /**
     * Get unread count for a user
     */
    public function getUnreadCountForUser(User $user): int
    {
        return SystemNotification::active()
            ->forUser($user)
            ->unreadByUser($user)
            ->count();
    }

    /**
     * Mark notification as read by user
     */
    public function markAsRead(int $notificationId, User $user): bool
    {
        $notification = SystemNotification::find($notificationId);

        if (!$notification) {
            return false;
        }

        $notification->markAsReadByUser($user);
        return true;
    }

    /**
     * Mark all notifications as read for a user
     */
    public function markAllAsRead(User $user): int
    {
        $notifications = SystemNotification::active()
            ->forUser($user)
            ->unreadByUser($user)
            ->get();

        $count = 0;
        foreach ($notifications as $notification) {
            $notification->markAsReadByUser($user);
            $count++;
        }

        return $count;
    }

    // ============================================
    // HELPER METHODS (ORIGINAL)
    // ============================================

    /**
     * Send success notification to user
     */
    public function success(int|User $user, string $title, string $message, array $data = []): void
    {
        $this->notifyUser($user, $title, $message, 'success', $data);
    }

    /**
     * Send error notification to user
     */
    public function error(int|User $user, string $title, string $message, array $data = []): void
    {
        $this->notifyUser($user, $title, $message, 'error', $data);
    }

    /**
     * Send warning notification to user
     */
    public function warning(int|User $user, string $title, string $message, array $data = []): void
    {
        $this->notifyUser($user, $title, $message, 'warning', $data);
    }

    /**
     * Send info notification to user
     */
    public function info(int|User $user, string $title, string $message, array $data = []): void
    {
        $this->notifyUser($user, $title, $message, 'info', $data);
    }

    /**
     * Send success notification to admins
     */
    public function adminSuccess(string $title, string $message, array $data = []): void
    {
        $this->notifyAdmins($title, $message, 'success', $data);
    }

    /**
     * Send error notification to admins
     */
    public function adminError(string $title, string $message, array $data = []): void
    {
        $this->notifyAdmins($title, $message, 'error', $data);
    }

    /**
     * Send warning notification to admins
     */
    public function adminWarning(string $title, string $message, array $data = []): void
    {
        $this->notifyAdmins($title, $message, 'warning', $data);
    }

    /**
     * Send info notification to admins
     */
    public function adminInfo(string $title, string $message, array $data = []): void
    {
        $this->notifyAdmins($title, $message, 'info', $data);
    }

    /**
     * Send Filament success notification to admins
     */
    public function filamentAdminSuccess(string $title, string $body): void
    {
        $this->sendFilamentNotificationToAdmins($title, $body, 'success', 'heroicon-o-check-circle');
    }

    /**
     * Send Filament error notification to admins
     */
    public function filamentAdminError(string $title, string $body): void
    {
        $this->sendFilamentNotificationToAdmins($title, $body, 'danger', 'heroicon-o-x-circle');
    }

    /**
     * Send Filament warning notification to admins
     */
    public function filamentAdminWarning(string $title, string $body): void
    {
        $this->sendFilamentNotificationToAdmins($title, $body, 'warning', 'heroicon-o-exclamation-triangle');
    }

    /**
     * Send Filament info notification to admins
     */
    public function filamentAdminInfo(string $title, string $body): void
    {
        $this->sendFilamentNotificationToAdmins($title, $body, 'info', 'heroicon-o-information-circle');
    }
}
