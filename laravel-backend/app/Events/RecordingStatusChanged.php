<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event broadcast when recording status changes (started/stopped)
 * APK sends recording events via HTTP API, Laravel broadcasts to Flow Editor via WebSocket
 */
class RecordingStatusChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $deviceId;
    public string $status;
    public array $data;

    /**
     * Create a new event instance.
     *
     * @param string $deviceId The Android device ID
     * @param string $status 'started' or 'stopped'
     * @param array $data Additional data (session info, timestamps, etc.)
     */
    public function __construct(string $deviceId, string $status, array $data = [])
    {
        $this->deviceId = $deviceId;
        $this->status = $status;
        $this->data = $data;
    }

    /**
     * Get the channels the event should broadcast on.
     * Broadcasts to device-specific private channel
     */
    public function broadcastOn(): array
    {
        // Use same format as RecordingActionCaptured which works correctly
        return [
            new PrivateChannel('device.' . $this->deviceId),
        ];
    }

    /**
     * The event's broadcast name.
     * Frontend listens for: .recording.started or .recording.stopped
     */
    public function broadcastAs(): string
    {
        return 'recording.' . $this->status;
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'device_id' => $this->deviceId,
            'status' => $this->status,
            'session' => $this->data,
        ];
    }
}
