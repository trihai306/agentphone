<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

/**
 * Request accessibility status check from device
 * Sent from web to APK via socket when selecting a device
 */
class CheckAccessibilityRequest implements ShouldBroadcastNow
{
    use SerializesModels;

    public function __construct(
        public string $deviceId,
        public int $userId
    ) {
    }

    public function broadcastOn(): Channel
    {
        // Use private device channel - APK subscribes to this
        return new PrivateChannel("device.{$this->deviceId}");
    }

    public function broadcastAs(): string
    {
        return 'check:accessibility';
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
