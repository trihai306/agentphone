<?php

namespace App\Events;

use App\Models\RecordingSession;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RecordingEventBroadcast implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public RecordingSession $session;
    public array $eventData;

    public function __construct(RecordingSession $session, array $eventData)
    {
        $this->session = $session;
        $this->eventData = $eventData;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('recording.' . $this->session->user_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'event.received';
    }

    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->session->session_id,
            'event_count' => $this->session->event_count,
            'event' => $this->eventData,
        ];
    }
}
