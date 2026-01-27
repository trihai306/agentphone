<?php

namespace App\Events;

use App\Models\AiGeneration;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AiGenerationCompleted implements ShouldBroadcast
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
        return 'ai-generation.completed';
    }

    public function broadcastWith(): array
    {
        return [
            'generation_id' => $this->generation->id,
            'status' => $this->generation->status,
            'result_url' => $this->generation->result_url,
            'result_path' => $this->generation->result_path,
            'type' => $this->generation->type,
            'model' => $this->generation->model,
            'prompt' => $this->generation->prompt,
        ];
    }
}
