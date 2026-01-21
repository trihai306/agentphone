<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Request to find an icon template on device screen
 * Sent to device channel, APK will search and respond with coordinates
 */
class FindIconRequest implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $deviceId;
    public int $userId;
    public string $template;
    public float $minConfidence;

    public function __construct(string $deviceId, int $userId, string $template, float $minConfidence = 0.65)
    {
        $this->deviceId = $deviceId;
        $this->userId = $userId;
        $this->template = $template;
        $this->minConfidence = $minConfidence;
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("device.{$this->deviceId}");
    }

    public function broadcastAs(): string
    {
        return 'find:icon';
    }

    public function broadcastWith(): array
    {
        return [
            'device_id' => $this->deviceId,
            'user_id' => $this->userId,
            'template' => $this->template,
            'min_confidence' => $this->minConfidence,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
