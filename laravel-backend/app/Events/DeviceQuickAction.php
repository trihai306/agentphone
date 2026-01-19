<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

/**
 * Quick action sent from Quick Action Bar to device
 * Used for immediate actions like scroll, back, home, etc.
 * Sent from web to APK via socket
 */
class DeviceQuickAction implements ShouldBroadcastNow
{
    use SerializesModels;

    public function __construct(
        public string $deviceId,
        public int $userId,
        public array $action
    ) {
    }

    public function broadcastOn(): Channel
    {
        // Use presence channel - APK already subscribed to this
        return new PresenceChannel("devices.{$this->userId}");
    }

    public function broadcastAs(): string
    {
        return 'command:quick_action';
    }

    public function broadcastWith(): array
    {
        return [
            'device_id' => $this->deviceId,
            'user_id' => $this->userId,
            'action' => $this->action,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
