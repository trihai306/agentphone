<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowJob extends Model
{
    use HasFactory, LogsActivity;

    protected array $dontLogColumns = [
        'updated_at',
        'created_at',
        'completed_tasks',
        'failed_tasks',
        'total_tasks', // Progress updates frequently
        'current_record_index',
        'records_processed',
        'records_failed',
        'current_workflow_index',
        'retry_count',
        'started_at',
        'completed_at', // Managed by markAs* methods
    ];

    protected $table = 'workflow_jobs';

    protected $fillable = [
        'user_id',
        'flow_id',
        'device_id',
        'campaign_id',
        'data_collection_id',
        'data_record_ids',
        'execution_mode',
        'current_record_index',
        'total_records_to_process',
        'records_processed',
        'records_failed',
        'name',
        'status',
        'priority',
        'scheduled_at',
        'started_at',
        'completed_at',
        'error_message',
        'retry_count',
        'max_retries',
        'config',
        'result',
        'total_tasks',
        'completed_tasks',
        'failed_tasks',
        'current_workflow_index',
    ];

    protected $casts = [
        'config' => 'array',
        'result' => 'array',
        'data_record_ids' => 'array',
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'priority' => 'integer',
        'retry_count' => 'integer',
        'max_retries' => 'integer',
        'total_tasks' => 'integer',
        'completed_tasks' => 'integer',
        'failed_tasks' => 'integer',
        'current_record_index' => 'integer',
        'total_records_to_process' => 'integer',
        'records_processed' => 'integer',
        'records_failed' => 'integer',
        'current_workflow_index' => 'integer',
    ];

    // Status constants
    public const STATUS_PENDING = 'pending';
    public const STATUS_QUEUED = 'queued';
    public const STATUS_RUNNING = 'running';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Single flow (backward compatibility)
     */
    public function flow(): BelongsTo
    {
        return $this->belongsTo(Flow::class);
    }

    /**
     * Multiple workflow items (new multi-workflow support)
     */
    public function workflowItems(): HasMany
    {
        return $this->hasMany(JobWorkflowItem::class)->orderBy('sequence');
    }

    /**
     * Multiple workflows via pivot table
     */
    public function workflows(): BelongsToMany
    {
        return $this->belongsToMany(Flow::class, 'job_workflow_items')
            ->withPivot(['sequence', 'status', 'started_at', 'completed_at', 'error_message', 'config'])
            ->orderByPivot('sequence');
    }

    /**
     * Get current running or next pending workflow item
     */
    public function getCurrentWorkflowItem(): ?JobWorkflowItem
    {
        return $this->workflowItems()->where('status', JobWorkflowItem::STATUS_RUNNING)->first()
            ?? $this->workflowItems()->where('status', JobWorkflowItem::STATUS_PENDING)->first();
    }

    /**
     * Check if this job uses multi-workflow mode
     */
    public function isMultiWorkflow(): bool
    {
        return $this->workflowItems()->count() > 0;
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    public function dataCollection(): BelongsTo
    {
        return $this->belongsTo(DataCollection::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(JobTask::class, 'workflow_job_id')->orderBy('sequence');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(JobLog::class, 'workflow_job_id')->orderBy('created_at');
    }


    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeRunning($query)
    {
        return $query->where('status', self::STATUS_RUNNING);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
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

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function canRetry(): bool
    {
        return $this->isFailed() && $this->retry_count < $this->max_retries;
    }

    public function canCancel(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_QUEUED, self::STATUS_RUNNING]);
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
     * Log a message
     */
    public function log(string $message, string $level = 'info', ?JobTask $task = null, array $context = []): JobLog
    {
        return $this->logs()->create([
            'job_task_id' => $task?->id,
            'level' => $level,
            'message' => $message,
            'context' => $context,
        ]);
    }

    /**
     * Mark job as started
     */
    public function markAsStarted(): void
    {
        $this->update([
            'status' => self::STATUS_RUNNING,
            'started_at' => now(),
        ]);
    }

    /**
     * Mark job as completed
     */
    public function markAsCompleted(array $result = []): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'completed_at' => now(),
            'result' => $result,
        ]);
    }

    /**
     * Mark job as failed
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
     * Mark job as cancelled
     */
    public function markAsCancelled(): void
    {
        $this->update([
            'status' => self::STATUS_CANCELLED,
            'completed_at' => now(),
        ]);
    }
}
