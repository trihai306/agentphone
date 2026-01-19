<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiGeneration extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'model',
        'provider',
        'prompt',
        'negative_prompt',
        'parameters',
        'aspect_ratio',
        'resolution',
        'source_image_path',
        'has_audio',
        'credits_used',
        'status',
        'result_url',
        'result_path',
        'provider_id',
        'provider_metadata',
        'error_message',
        'processing_time',
    ];

    protected $casts = [
        'parameters' => 'array',
        'provider_metadata' => 'array',
        'credits_used' => 'integer',
        'processing_time' => 'integer',
        'has_audio' => 'boolean',
    ];


    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';

    // Type constants
    const TYPE_IMAGE = 'image';
    const TYPE_VIDEO = 'video';

    /**
     * Get the user that owns the generation
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the transaction associated with this generation
     */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'id', 'ai_generation_id');
    }

    /**
     * Scope: Images only
     */
    public function scopeImages($query)
    {
        return $query->where('type', self::TYPE_IMAGE);
    }

    /**
     * Scope: Videos only
     */
    public function scopeVideos($query)
    {
        return $query->where('type', self::TYPE_VIDEO);
    }

    /**
     * Scope: Completed generations
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Scope: Failed generations
     */
    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    /**
     * Scope: Pending or processing
     */
    public function scopePending($query)
    {
        return $query->whereIn('status', [self::STATUS_PENDING, self::STATUS_PROCESSING]);
    }

    /**
     * Scope: Latest first
     */
    public function scopeLatest($query)
    {
        return $query->orderByDesc('created_at');
    }

    /**
     * Check if generation is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Check if generation is failed
     */
    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    /**
     * Check if generation is pending
     */
    public function isPending(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_PROCESSING]);
    }

    /**
     * Get status color for UI
     */
    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'yellow',
            self::STATUS_PROCESSING => 'blue',
            self::STATUS_COMPLETED => 'green',
            self::STATUS_FAILED => 'red',
            default => 'gray',
        };
    }

    /**
     * Get type icon
     */
    public function getTypeIconAttribute(): string
    {
        return match ($this->type) {
            self::TYPE_IMAGE => 'photo',
            self::TYPE_VIDEO => 'video',
            default => 'file',
        };
    }

    /**
     * Get formatted processing time
     */
    public function getFormattedProcessingTimeAttribute(): ?string
    {
        if (!$this->processing_time) {
            return null;
        }

        if ($this->processing_time < 60) {
            return $this->processing_time . 's';
        }

        $minutes = floor($this->processing_time / 60);
        $seconds = $this->processing_time % 60;

        return "{$minutes}m {$seconds}s";
    }
}
