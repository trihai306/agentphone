<?php

namespace App\Events;

use App\Models\RecordingSession;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RecordingSessionStarted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public RecordingSession $session;

    public function __construct(RecordingSession $session)
    {
        $this->session = $session;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('recording.' . $this->session->user_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'session.started';
    }

    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->session->session_id,
            'device_name' => $this->session->metadata['device_name'] ?? 'Unknown',
            'device_model' => $this->session->metadata['device_model'] ?? '',
            'target_app' => $this->session->target_app,
            'started_at' => $this->session->started_at->toISOString(),
        ];
    }
}
