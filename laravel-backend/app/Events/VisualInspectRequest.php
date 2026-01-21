<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

/**
 * Request visual inspection (OCR) from device
 * Sent from web to APK via socket
 * Uses presence channel for APK subscription
 */
class VisualInspectRequest implements ShouldBroadcastNow
{
    use SerializesModels;

    public function __construct(
        public string $deviceId,
        public int $userId
    ) {
    }

    public function broadcastOn(): Channel
    {
        // Use private device channel - APK already subscribed and authenticated
        return new \Illuminate\Broadcasting\PrivateChannel("device.{$this->deviceId}");
    }

    public function broadcastAs(): string
    {
        return 'visual:inspect';
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
