<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'creator_id',
        'flow_id',
        'data_collection_id',
        'campaign_id',
        'title',
        'description',
        'icon',
        'color',
        'tags',
        'reward_amount',
        'required_devices',
        'accepted_devices',
        'execution_config',
        'user_provides_data',
        'status',
        'deadline_at',
        'completed_at',
    ];

    protected $casts = [
        'tags' => 'array',
        'execution_config' => 'array',
        'user_provides_data' => 'boolean',
        'reward_amount' => 'integer',
        'required_devices' => 'integer',
        'accepted_devices' => 'integer',
        'deadline_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    // Status constants
    public const STATUS_OPEN = 'open';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Relationships
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function flow(): BelongsTo
    {
        return $this->belongsTo(Flow::class);
    }

    public function dataCollection(): BelongsTo
    {
        return $this->belongsTo(DataCollection::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(TaskApplication::class);
    }

    public function acceptedApplications(): HasMany
    {
        return $this->hasMany(TaskApplication::class)->whereIn('status', ['accepted', 'running', 'completed']);
    }

    /**
     * Scopes
     */
    public function scopeOpen($query)
    {
        return $query->where('status', self::STATUS_OPEN);
    }

    public function scopeNotExpired($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('deadline_at')
                ->orWhere('deadline_at', '>', now());
        });
    }

    public function scopeByCreator($query, $userId)
    {
        return $query->where('creator_id', $userId);
    }

    /**
     * Helpers
     */
    public function isOpen(): bool
    {
        return $this->status === self::STATUS_OPEN;
    }

    public function isInProgress(): bool
    {
        return $this->status === self::STATUS_IN_PROGRESS;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function isExpired(): bool
    {
        return $this->deadline_at && $this->deadline_at->isPast();
    }

    public function isFree(): bool
    {
        return $this->reward_amount <= 0;
    }

    public function canApply(User $user): bool
    {
        // Can't apply to own task
        if ($this->creator_id === $user->id) {
            return false;
        }

        // Task must be open
        if (!$this->isOpen()) {
            return false;
        }

        // Check if expired
        if ($this->isExpired()) {
            return false;
        }

        // Check if slots available
        if ($this->accepted_devices >= $this->required_devices) {
            return false;
        }

        return true;
    }

    public function getRemainingDevicesAttribute(): int
    {
        return max(0, $this->required_devices - $this->accepted_devices);
    }

    public function getProgressAttribute(): int
    {
        if ($this->required_devices === 0) {
            return 0;
        }

        $completedApps = $this->applications()->where('status', 'completed')->count();
        return (int) round(($completedApps / $this->required_devices) * 100);
    }

    /**
     * Update task status based on applications
     */
    public function syncStatus(): void
    {
        $acceptedCount = $this->acceptedApplications()->count();
        $completedCount = $this->applications()->where('status', 'completed')->count();

        $this->accepted_devices = $acceptedCount;

        if ($completedCount >= $this->required_devices) {
            $this->status = self::STATUS_COMPLETED;
            $this->completed_at = now();
        } elseif ($acceptedCount > 0) {
            $this->status = self::STATUS_IN_PROGRESS;
        }

        $this->save();
    }
}
