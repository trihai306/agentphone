<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast a screenshot frame from a device to the viewer's browser.
 * Used for live device preview in Flow Editor.
 */
class DeviceScreenFrame implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $userId,
        public int $deviceId,
        public string $frame, // base64 JPEG
        public int $width = 0,
        public int $height = 0
    ) {
    }

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel("devices.{$this->userId}");
    }

    public function broadcastAs(): string
    {
        return 'screen.frame';
    }

    public function broadcastWith(): array
    {
        return [
            'device_id' => $this->deviceId,
            'frame' => $this->frame,
            'width' => $this->width,
            'height' => $this->height,
            'timestamp' => now()->toISOString(),
        ];
    }
}
