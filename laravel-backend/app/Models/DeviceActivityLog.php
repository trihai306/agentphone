<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeviceActivityLog extends Model
{
    protected $fillable = [
        'device_id',
        'event',
        'ip_address',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    // Event constants
    public const EVENT_CONNECTED = 'connected';
    public const EVENT_DISCONNECTED = 'disconnected';
    public const EVENT_HEARTBEAT = 'heartbeat';
    public const EVENT_APP_OPENED = 'app_opened';
    public const EVENT_APP_CLOSED = 'app_closed';

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    /**
     * Scope to filter by event type
     */
    public function scopeOfEvent($query, string $event)
    {
        return $query->where('event', $event);
    }

    /**
     * Scope for recent logs
     */
    public function scopeRecent($query, int $minutes = 60)
    {
        return $query->where('created_at', '>=', now()->subMinutes($minutes));
    }
}
