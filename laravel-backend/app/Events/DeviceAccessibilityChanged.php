<?php

namespace App\Events;

use App\Models\Device;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DeviceAccessibilityChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Device $device;
    public bool $accessibilityEnabled;

    public function __construct(Device $device, bool $accessibilityEnabled)
    {
        $this->device = $device;
        $this->accessibilityEnabled = $accessibilityEnabled;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            // Use user.{userId} channel that frontend subscribes to
            new PrivateChannel('user.' . $this->device->user_id),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'device' => [
                'id' => $this->device->id,
                'name' => $this->device->name,
                'device_id' => $this->device->device_id,
                'accessibility_enabled' => $this->accessibilityEnabled,
            ],
            'accessibility_enabled' => $this->accessibilityEnabled,
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'device.accessibility.changed';
    }
}
