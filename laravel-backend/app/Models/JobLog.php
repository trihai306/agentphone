<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'workflow_job_id',
        'job_task_id',
        'level',
        'message',
        'context',
    ];

    protected $casts = [
        'context' => 'array',
        'created_at' => 'datetime',
    ];

    // Level constants
    public const LEVEL_DEBUG = 'debug';
    public const LEVEL_INFO = 'info';
    public const LEVEL_WARNING = 'warning';
    public const LEVEL_ERROR = 'error';

    // Relationships
    public function workflowJob(): BelongsTo
    {
        return $this->belongsTo(WorkflowJob::class, 'workflow_job_id');
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(JobTask::class, 'job_task_id');
    }

    // Scopes
    public function scopeErrors($query)
    {
        return $query->where('level', self::LEVEL_ERROR);
    }

    public function scopeWarnings($query)
    {
        return $query->where('level', self::LEVEL_WARNING);
    }

    // Static helpers for quick logging
    public static function info(WorkflowJob $job, string $message, ?JobTask $task = null, array $context = []): self
    {
        return self::create([
            'workflow_job_id' => $job->id,
            'job_task_id' => $task?->id,
            'level' => self::LEVEL_INFO,
            'message' => $message,
            'context' => $context,
        ]);
    }

    public static function error(WorkflowJob $job, string $message, ?JobTask $task = null, array $context = []): self
    {
        return self::create([
            'workflow_job_id' => $job->id,
            'job_task_id' => $task?->id,
            'level' => self::LEVEL_ERROR,
            'message' => $message,
            'context' => $context,
        ]);
    }

    public static function warning(WorkflowJob $job, string $message, ?JobTask $task = null, array $context = []): self
    {
        return self::create([
            'workflow_job_id' => $job->id,
            'job_task_id' => $task?->id,
            'level' => self::LEVEL_WARNING,
            'message' => $message,
            'context' => $context,
        ]);
    }
}
