<?php

namespace App\Events;

use App\Models\AiGeneration;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AiGenerationFailed implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public AiGeneration $generation;

    public function __construct(AiGeneration $generation)
    {
        $this->generation = $generation;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('user.' . $this->generation->user_id);
    }

    public function broadcastAs(): string
    {
        return 'ai-generation.failed';
    }

    public function broadcastWith(): array
    {
        return [
            'generation_id' => $this->generation->id,
            'status' => $this->generation->status,
            'error_message' => $this->generation->error_message,
            'type' => $this->generation->type,
            'model' => $this->generation->model,
            'prompt' => $this->generation->prompt,
        ];
    }
}
