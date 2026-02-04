<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast ping request to device to verify it's online
 * APK should respond with pong within timeout
 */
class DevicePingRequest implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $deviceId,
        public int $userId,
        public string $pingId // Unique ID to match pong response
    ) {
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("device.{$this->deviceId}");
    }

    public function broadcastAs(): string
    {
        return 'ping.request';
    }

    public function broadcastWith(): array
    {
        return [
            'device_id' => $this->deviceId,
            'user_id' => $this->userId,
            'ping_id' => $this->pingId,
            'timestamp' => now()->toISOString(),
        ];
    }
}
