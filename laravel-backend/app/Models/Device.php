<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Device extends Model
{
    protected $fillable = [
        'user_id',
        'device_id',
        'name',
        'model',
        'android_version',
        'status',
        'socket_url',
        'socket_connected',
        'last_active_at',
    ];

    protected $casts = [
        'last_active_at' => 'datetime',
        'socket_connected' => 'boolean',
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
     * Check if device is currently online
     * Device is online if socket is connected OR was active in last X minutes
     */
    public function isOnline(int $minutes = 5): bool
    {
        // Socket connected is most accurate
        if ($this->socket_connected) {
            return true;
        }

        // Fallback to activity-based check
        return $this->status === self::STATUS_ACTIVE
            && $this->last_active_at
            && $this->last_active_at->gte(now()->subMinutes($minutes));
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
