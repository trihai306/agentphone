<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event broadcast when a workflow node's execution status changes
 * Used for real-time visual feedback in Flow Editor
 */
class NodeStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public string $nodeId;
    public string $status; // 'running', 'success', 'error'
    public int $flowId;
    public ?string $error;
    public int $timestamp;

    public function __construct(
        string $nodeId,
        string $status,
        int $flowId,
        ?string $error = null
    ) {
        $this->nodeId = $nodeId;
        $this->status = $status;
        $this->flowId = $flowId;
        $this->error = $error;
        $this->timestamp = now()->timestamp;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('flow.' . $this->flowId),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'node.status';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'node_id' => $this->nodeId,
            'status' => $this->status,
            'error' => $this->error,
            'timestamp' => $this->timestamp,
        ];
    }
}
