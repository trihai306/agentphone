<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApiLog extends Model
{
    protected $fillable = [
        'user_id',
        'method',
        'endpoint',
        'status_code',
        'response_time',
        'ip_address',
        'user_agent',
        'request_headers',
        'request_body',
        'response_body',
        'error_message',
    ];

    protected $casts = [
        'response_time' => 'float',
        'request_headers' => 'array',
        'request_body' => 'array',
        'response_body' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get status color for display
     */
    public function getStatusColorAttribute(): string
    {
        return match (true) {
            $this->status_code >= 500 => 'danger',
            $this->status_code >= 400 => 'warning',
            $this->status_code >= 300 => 'info',
            $this->status_code >= 200 => 'success',
            default => 'gray',
        };
    }

    /**
     * Get method color for display
     */
    public function getMethodColorAttribute(): string
    {
        return match ($this->method) {
            'GET' => 'info',
            'POST' => 'success',
            'PUT', 'PATCH' => 'warning',
            'DELETE' => 'danger',
            default => 'gray',
        };
    }

    /**
     * Log an API request
     */
    public static function logRequest(
        string $method,
        string $endpoint,
        int $statusCode,
        ?float $responseTime = null,
        ?array $requestBody = null,
        ?array $responseBody = null,
        ?string $errorMessage = null
    ): self {
        return static::create([
            'user_id' => auth()->id(),
            'method' => strtoupper($method),
            'endpoint' => $endpoint,
            'status_code' => $statusCode,
            'response_time' => $responseTime,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'request_headers' => request()->headers->all(),
            'request_body' => $requestBody,
            'response_body' => $responseBody,
            'error_message' => $errorMessage,
        ]);
    }

    /**
     * Scope for successful requests
     */
    public function scopeSuccessful($query)
    {
        return $query->whereBetween('status_code', [200, 299]);
    }

    /**
     * Scope for failed requests
     */
    public function scopeFailed($query)
    {
        return $query->where('status_code', '>=', 400);
    }

    /**
     * Scope for slow requests (> 1 second)
     */
    public function scopeSlow($query, float $threshold = 1000)
    {
        return $query->where('response_time', '>=', $threshold);
    }
}
