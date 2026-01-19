<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

/**
 * Request element inspection from device
 * Sent from web to APK via socket
 * Uses presence channel so APK doesn't need separate auth
 */
class InspectElementsRequest implements ShouldBroadcastNow
{
    use SerializesModels;

    public function __construct(
        public string $deviceId,
        public int $userId
    ) {
    }

    public function broadcastOn(): Channel
    {
        // Use presence channel - APK already subscribed to this
        return new PresenceChannel("devices.{$this->userId}");
    }

    public function broadcastAs(): string
    {
        return 'inspect:elements';
    }

    public function broadcastWith(): array
    {
        return [
            'device_id' => $this->deviceId,
            'user_id' => $this->userId,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
