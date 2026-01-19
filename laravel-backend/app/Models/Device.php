<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Redis;

class Device extends Model
{
    use LogsActivity;

    /**
     * Columns to exclude from activity logging (noisy heartbeat data)
     */
    protected array $dontLogColumns = [
        'updated_at',
        'created_at',
        'last_active_at',
        'socket_connected',
        'accessibility_enabled',
        'accessibility_checked_at',
    ];

    protected $fillable = [
        'user_id',
        'device_id',
        'name',
        'model',
        'android_version',
        'status',
        'socket_url',
        'socket_connected',
        'accessibility_enabled',
        'accessibility_checked_at',
        'last_active_at',
    ];

    protected $casts = [
        'last_active_at' => 'datetime',
        'accessibility_checked_at' => 'datetime',
        'socket_connected' => 'boolean',
        'accessibility_enabled' => 'boolean',
    ];

    // Status constants
    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_BLOCKED = 'blocked';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(DeviceActivityLog::class);
    }

    public function jobs(): HasMany
    {
        return $this->hasMany(WorkflowJob::class);
    }

    /**
     * Scope for devices with active socket connection (real-time online)
     */
    public function scopeSocketOnline($query)
    {
        return $query->where('socket_connected', true);
    }

    /**
     * Scope for online devices (active in last 5 minutes OR socket connected)
     */
    public function scopeOnline($query, int $minutes = 5)
    {
        return $query->where('status', self::STATUS_ACTIVE)
            ->where(function ($q) use ($minutes) {
                $q->where('socket_connected', true)
                    ->orWhere('last_active_at', '>=', now()->subMinutes($minutes));
            });
    }

    /**
     * Scope for offline devices
     */
    public function scopeOffline($query, int $minutes = 5)
    {
        return $query->where(function ($q) use ($minutes) {
            $q->where('last_active_at', '<', now()->subMinutes($minutes))
                ->orWhereNull('last_active_at');
        });
    }

    /**
     * Scope for active status devices
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Check if device is currently online via Redis (preferred)
     * Falls back to DB-based check if Redis unavailable
     */
    public function isOnline(int $minutes = 5): bool
    {
        // Try Redis first (O(1) operation)
        try {
            $key = sprintf('device:online:%d', $this->user_id);
            if (Redis::sismember($key, $this->device_id)) {
                return true;
            }
        } catch (\Exception $e) {
            // Redis unavailable, fall back to DB check
        }

        // Fallback: Socket connected flag
        if ($this->socket_connected) {
            return true;
        }

        // Fallback: Activity-based check
        return $this->status === self::STATUS_ACTIVE
            && $this->last_active_at
            && $this->last_active_at->gte(now()->subMinutes($minutes));
    }

    /**
     * Check if device is online via Redis only (fast path)
     */
    public function isOnlineViaRedis(): bool
    {
        try {
            $key = sprintf('device:online:%d', $this->user_id);
            return (bool) Redis::sismember($key, $this->device_id);
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get all online devices for a user via Redis
     */
    public static function getOnlineForUser(int $userId): \Illuminate\Database\Eloquent\Collection
    {
        try {
            $key = sprintf('device:online:%d', $userId);
            $onlineIds = Redis::smembers($key) ?: [];

            if (!empty($onlineIds)) {
                return static::where('user_id', $userId)
                    ->whereIn('device_id', $onlineIds)
                    ->get();
            }
        } catch (\Exception $e) {
            // Fall back to DB-based check
        }

        // Fallback: Use DB scope
        return static::where('user_id', $userId)->online()->get();
    }

    /**
     * Update last active timestamp
     */
    public function markAsActive(): void
    {
        $this->update([
            'status' => self::STATUS_ACTIVE,
            'last_active_at' => now(),
        ]);
    }

    /**
     * Log activity
     */
    public function logActivity(string $event, ?string $ip = null, array $metadata = []): DeviceActivityLog
    {
        return $this->activityLogs()->create([
            'event' => $event,
            'ip_address' => $ip,
            'metadata' => $metadata,
        ]);
    }
}

