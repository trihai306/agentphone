<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiScenarioScene extends Model
{
    protected $fillable = [
        'ai_scenario_id',
        'order',
        'description',
        'prompt',
        'duration',
        'ai_generation_id',
        'status',
        'error_message',
    ];

    protected $casts = [
        'order' => 'integer',
        'duration' => 'integer',
    ];

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_GENERATING = 'generating';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';

    /**
     * Get the scenario this scene belongs to
     */
    public function scenario(): BelongsTo
    {
        return $this->belongsTo(AiScenario::class, 'ai_scenario_id');
    }

    /**
     * Get the generation for this scene
     */
    public function generation(): BelongsTo
    {
        return $this->belongsTo(AiGeneration::class, 'ai_generation_id');
    }

    /**
     * Scope: Pending scenes
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope: Completed scenes
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Check if scene is pending
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check if scene is generating
     */
    public function isGenerating(): bool
    {
        return $this->status === self::STATUS_GENERATING;
    }

    /**
     * Check if scene is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Check if scene has failed
     */
    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    /**
     * Get status color for UI
     */
    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'gray',
            self::STATUS_GENERATING => 'yellow',
            self::STATUS_COMPLETED => 'green',
            self::STATUS_FAILED => 'red',
            default => 'gray',
        };
    }

    /**
     * Get result URL from generation
     */
    public function getResultUrlAttribute(): ?string
    {
        return $this->generation?->result_url;
    }
}
