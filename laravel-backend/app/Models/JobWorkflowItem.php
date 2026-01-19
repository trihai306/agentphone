<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobWorkflowItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'workflow_job_id',
        'flow_id',
        'sequence',
        'status',
        'started_at',
        'completed_at',
        'error_message',
        'config',
        'total_tasks',
        'completed_tasks',
        'failed_tasks',
    ];

    protected $casts = [
        'config' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'sequence' => 'integer',
        'total_tasks' => 'integer',
        'completed_tasks' => 'integer',
        'failed_tasks' => 'integer',
    ];

    // Status constants
    public const STATUS_PENDING = 'pending';
    public const STATUS_RUNNING = 'running';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_SKIPPED = 'skipped';

    // Relationships
    public function job(): BelongsTo
    {
        return $this->belongsTo(WorkflowJob::class, 'workflow_job_id');
    }

    public function flow(): BelongsTo
    {
        return $this->belongsTo(Flow::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(JobTask::class, 'job_workflow_item_id')->orderBy('sequence');
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
     * Calculate progress percentage
     */
    public function getProgressAttribute(): int
    {
        if ($this->total_tasks === 0) {
            return 0;
        }
        return (int) round(($this->completed_tasks / $this->total_tasks) * 100);
    }

    /**
     * Mark as started
     */
    public function markAsStarted(): void
    {
        $this->update([
            'status' => self::STATUS_RUNNING,
            'started_at' => now(),
        ]);
    }

    /**
     * Mark as completed
     */
    public function markAsCompleted(): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);
    }

    /**
     * Mark as failed
     */
    public function markAsFailed(string $errorMessage): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'completed_at' => now(),
            'error_message' => $errorMessage,
        ]);
    }

    /**
     * Mark as skipped
     */
    public function markAsSkipped(?string $reason = null): void
    {
        $this->update([
            'status' => self::STATUS_SKIPPED,
            'completed_at' => now(),
            'error_message' => $reason,
        ]);
    }
}
