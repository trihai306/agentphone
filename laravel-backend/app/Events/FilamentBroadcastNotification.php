<?php

namespace App\Events;

use Filament\Notifications\Notification;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class FilamentBroadcastNotification implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $notificationData;
    public int $userId;

    /**
     * Create a new event instance.
     */
    public function __construct(int $userId, Notification $notification)
    {
        $this->userId = $userId;
        $this->notificationData = $notification->getDatabaseMessage();
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("user.{$this->userId}"),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return $this->notificationData;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'database-notification.created';
    }
}
