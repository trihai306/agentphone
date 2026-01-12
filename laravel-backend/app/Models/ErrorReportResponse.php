<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ErrorReportResponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'error_report_id',
        'user_id',
        'message',
        'is_admin_response',
        'attachments',
    ];

    protected $casts = [
        'is_admin_response' => 'boolean',
        'attachments' => 'array',
    ];

    /**
     * Get the error report this response belongs to
     */
    public function errorReport(): BelongsTo
    {
        return $this->belongsTo(ErrorReport::class);
    }

    /**
     * Get the user who made this response
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if this response is from admin
     */
    public function isFromAdmin(): bool
    {
        return $this->is_admin_response;
    }
}
