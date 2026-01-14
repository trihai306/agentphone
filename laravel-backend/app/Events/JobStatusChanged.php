<?php

namespace App\Events;

use App\Models\WorkflowJob;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class JobStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public WorkflowJob $job;

    /**
     * Create a new event instance.
     */
    public function __construct(WorkflowJob $job)
    {
        $this->job = $job->load(['flow:id,name', 'device:id,name']);
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->job->user_id),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->job->id,
            'name' => $this->job->name,
            'status' => $this->job->status,
            'progress' => $this->job->progress,
            'completed_tasks' => $this->job->completed_tasks,
            'total_tasks' => $this->job->total_tasks,
            'failed_tasks' => $this->job->failed_tasks,
            'error_message' => $this->job->error_message,
            'flow' => $this->job->flow ? [
                'id' => $this->job->flow->id,
                'name' => $this->job->flow->name,
            ] : null,
            'device' => $this->job->device ? [
                'id' => $this->job->device->id,
                'name' => $this->job->device->name,
            ] : null,
            'started_at' => $this->job->started_at?->toIso8601String(),
            'completed_at' => $this->job->completed_at?->toIso8601String(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'job.status.changed';
    }
}
