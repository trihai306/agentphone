<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast WebRTC signaling data to a device's private channel.
 * Used for: stream:start, stream:stop, webrtc:signal (SDP answer, ICE from browser)
 */
class WebRTCSignalToDevice implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $deviceId,
        public string $signalType,
        public array $signalData = [],
        public int $viewerUserId = 0
    ) {
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("device.{$this->deviceId}");
    }

    public function broadcastAs(): string
    {
        // Map signal types to Soketi event names
        return match ($this->signalType) {
            'start' => 'stream.start',
            'stop' => 'stream.stop',
            default => 'webrtc.signal',
        };
    }

    public function broadcastWith(): array
    {
        return [
            'signal_type' => $this->signalType,
            'signal_data' => $this->signalData,
            'viewer_user_id' => $this->viewerUserId,
            'timestamp' => now()->toISOString(),
        ];
    }
}
