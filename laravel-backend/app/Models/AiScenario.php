<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class AiScenario extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'script',
        'output_type',
        'model',
        'settings',
        'status',
        'total_credits',
        'error_message',
    ];

    protected $casts = [
        'settings' => 'array',
        'total_credits' => 'integer',
    ];

    // Status constants
    const STATUS_DRAFT = 'draft';
    const STATUS_PARSED = 'parsed';
    const STATUS_GENERATING = 'generating';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
    const STATUS_PARTIAL = 'partial';

    // Output type constants
    const OUTPUT_IMAGE = 'image';
    const OUTPUT_VIDEO = 'video';

    /**
     * Get the user that owns the scenario
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the scenes for this scenario
     */
    public function scenes(): HasMany
    {
        return $this->hasMany(AiScenarioScene::class)->orderBy('order');
    }

    /**
     * Get all generations through scenes
     */
    public function generations(): HasManyThrough
    {
        return $this->hasManyThrough(
            AiGeneration::class,
            AiScenarioScene::class,
            'ai_scenario_id',
            'id',
            'id',
            'ai_generation_id'
        );
    }

    /**
     * Scope: For a specific user
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: Completed scenarios
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Scope: Active (generating) scenarios
     */
    public function scopeGenerating($query)
    {
        return $query->where('status', self::STATUS_GENERATING);
    }

    /**
     * Scope: Latest first
     */
    public function scopeLatest($query)
    {
        return $query->orderByDesc('created_at');
    }

    /**
     * Check if scenario is generating
     */
    public function isGenerating(): bool
    {
        return $this->status === self::STATUS_GENERATING;
    }

    /**
     * Check if scenario is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Get progress percentage (0-100)
     */
    public function getProgressAttribute(): int
    {
        $totalScenes = $this->scenes()->count();
        if ($totalScenes === 0)
            return 0;

        $completedScenes = $this->scenes()
            ->where('status', AiScenarioScene::STATUS_COMPLETED)
            ->count();

        return (int) round(($completedScenes / $totalScenes) * 100);
    }

    /**
     * Get completed scenes count
     */
    public function getCompletedScenesCountAttribute(): int
    {
        return $this->scenes()->where('status', AiScenarioScene::STATUS_COMPLETED)->count();
    }

    /**
     * Get total scenes count
     */
    public function getTotalScenesCountAttribute(): int
    {
        return $this->scenes()->count();
    }

    /**
     * Get status color for UI
     */
    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_DRAFT => 'gray',
            self::STATUS_PARSED => 'blue',
            self::STATUS_GENERATING => 'yellow',
            self::STATUS_COMPLETED => 'green',
            self::STATUS_FAILED => 'red',
            self::STATUS_PARTIAL => 'orange',
            default => 'gray',
        };
    }
}
