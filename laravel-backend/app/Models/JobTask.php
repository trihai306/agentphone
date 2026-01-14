<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'workflow_job_id',
        'flow_node_id',
        'node_id',
        'node_type',
        'node_label',
        'sequence',
        'status',
        'started_at',
        'completed_at',
        'input_data',
        'output_data',
        'error_message',
        'duration_ms',
    ];

    protected $casts = [
        'input_data' => 'array',
        'output_data' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'sequence' => 'integer',
        'duration_ms' => 'integer',
    ];

    // Status constants
    public const STATUS_PENDING = 'pending';
    public const STATUS_RUNNING = 'running';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_SKIPPED = 'skipped';

    // Relationships
    public function workflowJob(): BelongsTo
    {
        return $this->belongsTo(WorkflowJob::class, 'workflow_job_id');
    }

    public function flowNode(): BelongsTo
    {
        return $this->belongsTo(FlowNode::class);
    }

    // Helpers
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isRunning(): bool
    {
        return $this->status === self::STATUS_RUNNING;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    /**
     * Mark task as started
     */
    public function markAsStarted(): void
    {
        $this->update([
            'status' => self::STATUS_RUNNING,
            'started_at' => now(),
        ]);
    }

    /**
     * Mark task as completed
     */
    public function markAsCompleted(array $outputData = []): void
    {
        $duration = $this->started_at ? now()->diffInMilliseconds($this->started_at) : null;

        $this->update([
            'status' => self::STATUS_COMPLETED,
            'completed_at' => now(),
            'output_data' => $outputData,
            'duration_ms' => $duration,
        ]);

        // Update parent job counters
        $this->workflowJob->increment('completed_tasks');
    }

    /**
     * Mark task as failed
     */
    public function markAsFailed(string $errorMessage, array $outputData = []): void
    {
        $duration = $this->started_at ? now()->diffInMilliseconds($this->started_at) : null;

        $this->update([
            'status' => self::STATUS_FAILED,
            'completed_at' => now(),
            'error_message' => $errorMessage,
            'output_data' => $outputData,
            'duration_ms' => $duration,
        ]);

        // Update parent job counters
        $this->workflowJob->increment('failed_tasks');
    }

    /**
     * Mark task as skipped
     */
    public function markAsSkipped(string $reason = null): void
    {
        $this->update([
            'status' => self::STATUS_SKIPPED,
            'completed_at' => now(),
            'error_message' => $reason,
        ]);
    }
}
