<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast workflow action progress for real-time node highlighting
 */
class WorkflowActionProgress implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $userId;
    public int $flowId;
    public string $actionId;
    public string $status; // 'running', 'success', 'error'
    public ?string $message;
    public ?string $errorBranchTarget;
    public int $sequence;
    public int $totalActions;
    public ?array $result;

    public function __construct(
        int $userId,
        int $flowId,
        string $actionId,
        string $status,
        int $sequence,
        int $totalActions,
        ?string $message = null,
        ?string $errorBranchTarget = null,
        ?array $result = null
    ) {
        $this->userId = $userId;
        $this->flowId = $flowId;
        $this->actionId = $actionId;
        $this->status = $status;
        $this->sequence = $sequence;
        $this->totalActions = $totalActions;
        $this->message = $message;
        $this->errorBranchTarget = $errorBranchTarget;
        $this->result = $result;
    }

    public function broadcastOn(): array
    {
        return [
            // Use standard Laravel Echo user channel naming
            new PrivateChannel('user.' . $this->userId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'workflow.action.progress';
    }

    public function broadcastWith(): array
    {
        return [
            'flow_id' => $this->flowId,
            'action_id' => $this->actionId,
            'status' => $this->status,
            'sequence' => $this->sequence,
            'total_actions' => $this->totalActions,
            'progress' => $this->totalActions > 0 ? ($this->sequence / $this->totalActions) * 100 : 0,
            'message' => $this->message,
            'error_branch_target' => $this->errorBranchTarget,
            'result' => $this->result,
            'timestamp' => now()->toISOString(),
        ];
    }
}
