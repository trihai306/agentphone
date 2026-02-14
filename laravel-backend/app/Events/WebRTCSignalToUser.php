<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast WebRTC signaling data to a user's presence channel.
 * Used for: SDP offer and ICE candidates from APK → browser
 */
class WebRTCSignalToUser implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $userId,
        public int $deviceId,
        public string $signalType,
        public array $signalData = []
    ) {
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("devices.{$this->userId}");
    }

    public function broadcastAs(): string
    {
        return 'webrtc.signal';
    }

    public function broadcastWith(): array
    {
        return [
            'device_id' => $this->deviceId,
            'signal_type' => $this->signalType,
            'signal_data' => $this->signalData,
            'timestamp' => now()->toISOString(),
        ];
    }
}
