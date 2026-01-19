<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

/**
 * Element inspection result from device
 * Sent from APK to web via socket (through API)
 */
class InspectElementsResult implements ShouldBroadcastNow
{
    use SerializesModels;

    public function __construct(
        public int $userId,
        public string $deviceId,
        public bool $success,
        public array $elements = [],
        public ?string $packageName = null,
        public ?string $screenshot = null,
        public ?int $screenWidth = null,
        public ?int $screenHeight = null,
        public ?string $error = null
    ) {
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("user.{$this->userId}");
    }

    public function broadcastAs(): string
    {
        return 'inspect:result';
    }

    public function broadcastWith(): array
    {
        return [
            'device_id' => $this->deviceId,
            'success' => $this->success,
            'package_name' => $this->packageName,
            'element_count' => count($this->elements),
            'elements' => $this->elements,
            'screenshot' => $this->screenshot,
            'screen_width' => $this->screenWidth,
            'screen_height' => $this->screenHeight,
            'error' => $this->error,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
