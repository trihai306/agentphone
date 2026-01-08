<?php

namespace App\Notifications;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class AdminAlertNotification extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    protected string $title;
    protected string $message;
    protected string $type;
    protected array $data;
    protected ?string $actionUrl;
    protected ?string $actionText;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        string $title,
        string $message,
        string $type = 'info',
        array $data = [],
        ?string $actionUrl = null,
        ?string $actionText = null
    ) {
        $this->title = $title;
        $this->message = $message;
        $this->type = $type;
        $this->data = $data;
        $this->actionUrl = $actionUrl;
        $this->actionText = $actionText;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Get the array representation of the notification for database.
     * This format is compatible with Filament notifications.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'body' => $this->message,
            'icon' => $this->getIconForType($this->type),
            'iconColor' => $this->getColorForType($this->type),
            'status' => $this->type,
            'data' => $this->data,
            'actions' => $this->actionUrl ? [
                [
                    'name' => 'view',
                    'label' => $this->actionText ?? 'View Details',
                    'url' => $this->actionUrl,
                    'color' => 'primary',
                ],
            ] : [],
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'title' => $this->title,
            'message' => $this->message,
            'type' => $this->type,
            'data' => $this->data,
            'action_url' => $this->actionUrl,
            'action_text' => $this->actionText,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Get icon for notification type (Heroicon names for Filament)
     */
    protected function getIconForType(string $type): string
    {
        return match ($type) {
            'success' => 'heroicon-o-check-circle',
            'error' => 'heroicon-o-x-circle',
            'warning' => 'heroicon-o-exclamation-triangle',
            default => 'heroicon-o-information-circle',
        };
    }

    /**
     * Get color for notification type
     */
    protected function getColorForType(string $type): string
    {
        return match ($type) {
            'success' => 'success',
            'error' => 'danger',
            'warning' => 'warning',
            default => 'info',
        };
    }
}
