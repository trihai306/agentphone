<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class GeneralNotification extends Notification implements ShouldBroadcast, ShouldQueue
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
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'body' => $this->message,
            'type' => $this->type,
            'data' => $this->data,
            'actions' => $this->actionUrl ? [
                [
                    'name' => 'view',
                    'label' => $this->actionText ?? 'View',
                    'url' => $this->actionUrl,
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
            'id' => $this->id,
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
     * Get the type of the notification being broadcast.
     */
    public function broadcastType(): string
    {
        return 'general.notification';
    }
}
