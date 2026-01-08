<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SystemNotification extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'message',
        'type',
        'target',
        'target_user_id',
        'created_by',
        'data',
        'is_read',
        'read_at',
        'is_broadcasted',
        'broadcasted_at',
        'scheduled_at',
        'expires_at',
        'action_url',
        'action_text',
        'icon',
        'is_active',
    ];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'is_broadcasted' => 'boolean',
        'is_active' => 'boolean',
        'read_at' => 'datetime',
        'broadcasted_at' => 'datetime',
        'scheduled_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Notification types
     */
    public const TYPE_INFO = 'info';
    public const TYPE_SUCCESS = 'success';
    public const TYPE_WARNING = 'warning';
    public const TYPE_ERROR = 'error';

    /**
     * Notification targets
     */
    public const TARGET_ALL = 'all';
    public const TARGET_ADMINS = 'admins';
    public const TARGET_SPECIFIC_USER = 'specific_user';

    /**
     * Get the creator of the notification
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the target user (if specific user)
     */
    public function targetUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_user_id');
    }

    /**
     * Users who have read this notification
     */
    public function readers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'notification_reads', 'notification_id', 'user_id')
            ->withPivot('read_at')
            ->withTimestamps();
    }

    /**
     * Check if a user has read this notification
     */
    public function isReadByUser(User $user): bool
    {
        return $this->readers()->where('user_id', $user->id)->exists();
    }

    /**
     * Mark as read by a user
     */
    public function markAsReadByUser(User $user): void
    {
        if (!$this->isReadByUser($user)) {
            $this->readers()->attach($user->id, ['read_at' => now()]);
        }
    }

    /**
     * Scope for active notifications
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Scope for notifications visible to a specific user
     */
    public function scopeForUser($query, User $user)
    {
        return $query->where(function ($q) use ($user) {
            $q->where('target', self::TARGET_ALL)
                ->orWhere(function ($q2) use ($user) {
                    $q2->where('target', self::TARGET_SPECIFIC_USER)
                        ->where('target_user_id', $user->id);
                });

            // Include admin notifications if user is admin
            if ($user->hasRole('super_admin') || $user->hasRole('admin')) {
                $q->orWhere('target', self::TARGET_ADMINS);
            }
        });
    }

    /**
     * Scope for unread notifications by a user
     */
    public function scopeUnreadByUser($query, User $user)
    {
        return $query->whereDoesntHave('readers', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        });
    }

    /**
     * Scope for scheduled notifications ready to broadcast
     */
    public function scopeReadyToBroadcast($query)
    {
        return $query->where('is_active', true)
            ->where('is_broadcasted', false)
            ->where(function ($q) {
                $q->whereNull('scheduled_at')
                    ->orWhere('scheduled_at', '<=', now());
            });
    }

    /**
     * Get type badge color for Filament
     */
    public function getTypeBadgeColor(): string
    {
        return match ($this->type) {
            self::TYPE_SUCCESS => 'success',
            self::TYPE_WARNING => 'warning',
            self::TYPE_ERROR => 'danger',
            default => 'info',
        };
    }

    /**
     * Get target badge color for Filament
     */
    public function getTargetBadgeColor(): string
    {
        return match ($this->target) {
            self::TARGET_ADMINS => 'warning',
            self::TARGET_SPECIFIC_USER => 'primary',
            default => 'success',
        };
    }

    /**
     * Get icon for type
     */
    public function getTypeIcon(): string
    {
        return match ($this->type) {
            self::TYPE_SUCCESS => 'heroicon-o-check-circle',
            self::TYPE_WARNING => 'heroicon-o-exclamation-triangle',
            self::TYPE_ERROR => 'heroicon-o-x-circle',
            default => 'heroicon-o-information-circle',
        };
    }
}
