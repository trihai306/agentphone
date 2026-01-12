<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecordingSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_id',
        'user_id',
        'flow_id',
        'session_id',
        'status',
        'started_at',
        'stopped_at',
        'duration',
        'event_count',
        'target_app',
        'metadata',
        'actions',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'stopped_at' => 'datetime',
        'metadata' => 'array',
        'actions' => 'array',
    ];

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function flow(): BelongsTo
    {
        return $this->belongsTo(Flow::class);
    }
}
