<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'user_id',
        'device_id',
        'data_collection_id',
        'status',
        'rejection_reason',
        'workflow_job_id',
        'result',
        'progress',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'result' => 'array',
        'progress' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    // Status constants
    public const STATUS_PENDING = 'pending';
    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_RUNNING = 'running';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';

    /**
     * Relationships
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    public function dataCollection(): BelongsTo
    {
        return $this->belongsTo(DataCollection::class);
    }

    public function workflowJob(): BelongsTo
    {
        return $this->belongsTo(WorkflowJob::class);
    }

    /**
     * Scopes
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeAccepted($query)
    {
        return $query->where('status', self::STATUS_ACCEPTED);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Helpers
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isAccepted(): bool
    {
        return $this->status === self::STATUS_ACCEPTED;
    }

    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
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

    public function canStart(): bool
    {
        return $this->isAccepted() && $this->device;
    }

    /**
     * Accept application
     */
    public function accept(): void
    {
        $this->update(['status' => self::STATUS_ACCEPTED]);
        $this->task->syncStatus();
    }

    /**
     * Reject application
     */
    public function reject(?string $reason = null): void
    {
        $this->update([
            'status' => self::STATUS_REJECTED,
            'rejection_reason' => $reason,
        ]);
    }

    /**
     * Mark as running
     */
    public function markAsRunning(WorkflowJob $job): void
    {
        $this->update([
            'status' => self::STATUS_RUNNING,
            'workflow_job_id' => $job->id,
            'started_at' => now(),
        ]);
    }

    /**
     * Mark as completed
     */
    public function markAsCompleted(array $result = []): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'result' => $result,
            'progress' => 100,
            'completed_at' => now(),
        ]);
        $this->task->syncStatus();
    }

    /**
     * Mark as failed
     */
    public function markAsFailed(?string $error = null): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'result' => ['error' => $error],
            'completed_at' => now(),
        ]);
    }
}
