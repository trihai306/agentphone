<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

/**
 * Request installed apps list from device
 * Sent from web to APK via socket
 */
class GetInstalledAppsRequest implements ShouldBroadcastNow
{
    use SerializesModels;

    public function __construct(
        public string $deviceId,
        public int $userId
    ) {
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("device.{$this->deviceId}");
    }

    public function broadcastAs(): string
    {
        return 'apps:request';
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
