<?php

namespace App\Events;

use App\Models\Device;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event to dispatch job commands to Android device via Soketi
 */
class DispatchJobToDevice implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Device $device;
    public array $payload;
    public string $eventType;

    /**
     * Create a new event instance.
     *
     * @param Device $device Target device
     * @param array $payload Job payload or command data
     * @param string $eventType Event type: job:new, job:cancel, job:pause, job:resume
     */
    public function __construct(Device $device, array $payload, string $eventType = 'job:new')
    {
        $this->device = $device;
        $this->payload = $payload;
        $this->eventType = $eventType;
    }

    /**
     * Get the channels the event should broadcast on.
     * Broadcasts to device-specific private channel that APK is subscribed to
     */
    public function broadcastOn(): array
    {
        return [
            // Private channel: Laravel prefixes with 'private-' to become 'private-device.{android_id}'
            new \Illuminate\Broadcasting\PrivateChannel('device.' . $this->device->device_id),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return $this->payload;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return $this->eventType;
    }
}
