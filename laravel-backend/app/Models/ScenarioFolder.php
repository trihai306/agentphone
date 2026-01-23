<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScenarioFolder extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'description',
        'parent_id',
        'color',
        'order',
    ];

    /**
     * Get the user that owns the folder
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the parent folder
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(ScenarioFolder::class, 'parent_id');
    }

    /**
     * Get child folders
     */
    public function children(): HasMany
    {
        return $this->hasMany(ScenarioFolder::class, 'parent_id')->orderBy('order');
    }

    /**
     * Get scenarios in this folder
     */
    public function scenarios(): HasMany
    {
        return $this->hasMany(AiScenario::class, 'scenario_folder_id');
    }

    /**
     * Scope for user's folders
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for root folders (no parent)
     */
    public function scopeRoots($query)
    {
        return $query->whereNull('parent_id')->orderBy('order');
    }

    /**
     * Get full path of folder (for breadcrumbs)
     */
    public function getPathAttribute(): array
    {
        $path = [$this];
        $current = $this;

        while ($current->parent) {
            $current = $current->parent;
            array_unshift($path, $current);
        }

        return $path;
    }

    /**
     * Count total scenarios (including subfolders)
     */
    public function getTotalScenariosAttribute(): int
    {
        $count = $this->scenarios()->count();

        foreach ($this->children as $child) {
            $count += $child->total_scenarios;
        }

        return $count;
    }
}
