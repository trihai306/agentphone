<?php

namespace App\Events;

use App\Models\Device;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DeviceStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Device $device;
    public string $status;

    public function __construct(Device $device, string $status)
    {
        $this->device = $device;
        $this->status = $status;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            // Use standard Laravel Echo user channel naming
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
                'model' => $this->device->model,
                'status' => $this->status,
                'is_online' => $this->status === 'online',
                'accessibility_enabled' => $this->device->accessibility_enabled ?? false,
                'socket_connected' => $this->device->socket_connected ?? false,
            ],
            'status' => $this->status,
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'device.status.changed';
    }
}
