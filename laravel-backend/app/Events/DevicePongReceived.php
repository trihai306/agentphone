<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast pong response to frontend to confirm device is online
 */
class DevicePongReceived implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $userId,
        public string $deviceId,
        public string $pingId,
        public int $latencyMs // Round-trip time in milliseconds
    ) {
    }

    public function broadcastOn(): Channel
    {
        // Broadcast to user's private channel so frontend receives the confirmation
        return new \Illuminate\Broadcasting\PrivateChannel("user.{$this->userId}");
    }

    public function broadcastAs(): string
    {
        return 'device.pong';
    }

    public function broadcastWith(): array
    {
        return [
            'success' => true, // Required by frontend
            'device_id' => $this->deviceId,
            'ping_id' => $this->pingId,
            'latency_ms' => $this->latencyMs,
            'online' => true,
            'verified_at' => now()->toISOString(),
        ];
    }
}
