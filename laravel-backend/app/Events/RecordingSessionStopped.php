<?php

namespace App\Events;

use App\Models\RecordingSession;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RecordingSessionStopped implements ShouldBroadcast
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
        return 'session.stopped';
    }

    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->session->session_id,
            'event_count' => $this->session->event_count,
            'duration' => $this->session->duration,
            'stopped_at' => $this->session->stopped_at?->toISOString(),
            'actions' => $this->session->actions,
        ];
    }
}
