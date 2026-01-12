<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ErrorReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'error_type',
        'severity',
        'status',
        'page_url',
        'device_info',
        'screenshots',
        'admin_notes',
        'assigned_to',
        'resolved_at',
    ];

    protected $casts = [
        'device_info' => 'array',
        'screenshots' => 'array',
        'resolved_at' => 'datetime',
    ];

    /**
     * Error Types
     */
    public const TYPE_BUG = 'bug';
    public const TYPE_UI_ISSUE = 'ui_issue';
    public const TYPE_PERFORMANCE = 'performance';
    public const TYPE_FEATURE_REQUEST = 'feature_request';
    public const TYPE_OTHER = 'other';

    public const TYPES = [
        self::TYPE_BUG => 'Bug / Lỗi',
        self::TYPE_UI_ISSUE => 'Vấn đề giao diện',
        self::TYPE_PERFORMANCE => 'Hiệu suất',
        self::TYPE_FEATURE_REQUEST => 'Yêu cầu tính năng',
        self::TYPE_OTHER => 'Khác',
    ];

    /**
     * Severity Levels
     */
    public const SEVERITY_LOW = 'low';
    public const SEVERITY_MEDIUM = 'medium';
    public const SEVERITY_HIGH = 'high';
    public const SEVERITY_CRITICAL = 'critical';

    public const SEVERITIES = [
        self::SEVERITY_LOW => 'Thấp',
        self::SEVERITY_MEDIUM => 'Trung bình',
        self::SEVERITY_HIGH => 'Cao',
        self::SEVERITY_CRITICAL => 'Nghiêm trọng',
    ];

    /**
     * Status
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_REVIEWING = 'reviewing';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_CLOSED = 'closed';

    public const STATUSES = [
        self::STATUS_PENDING => 'Chờ xử lý',
        self::STATUS_REVIEWING => 'Đang xem xét',
        self::STATUS_IN_PROGRESS => 'Đang xử lý',
        self::STATUS_RESOLVED => 'Đã giải quyết',
        self::STATUS_CLOSED => 'Đã đóng',
    ];

    /**
     * Get the user who submitted the report
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the admin assigned to handle this report
     */
    public function assignedAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get all responses for this report
     */
    public function responses(): HasMany
    {
        return $this->hasMany(ErrorReportResponse::class)->orderBy('created_at', 'asc');
    }

    /**
     * Scope for pending reports
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope for reports by status
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for reports by a specific user
     */
    public function scopeForUser($query, User $user)
    {
        return $query->where('user_id', $user->id);
    }

    /**
     * Scope for unresolved reports
     */
    public function scopeUnresolved($query)
    {
        return $query->whereNotIn('status', [self::STATUS_RESOLVED, self::STATUS_CLOSED]);
    }

    /**
     * Scope for critical reports
     */
    public function scopeCritical($query)
    {
        return $query->where('severity', self::SEVERITY_CRITICAL);
    }

    /**
     * Get status badge color for Filament
     */
    public function getStatusBadgeColor(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'warning',
            self::STATUS_REVIEWING => 'info',
            self::STATUS_IN_PROGRESS => 'primary',
            self::STATUS_RESOLVED => 'success',
            self::STATUS_CLOSED => 'gray',
            default => 'gray',
        };
    }

    /**
     * Get severity badge color for Filament
     */
    public function getSeverityBadgeColor(): string
    {
        return match ($this->severity) {
            self::SEVERITY_LOW => 'gray',
            self::SEVERITY_MEDIUM => 'warning',
            self::SEVERITY_HIGH => 'danger',
            self::SEVERITY_CRITICAL => 'danger',
            default => 'gray',
        };
    }

    /**
     * Get status label
     */
    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    /**
     * Get severity label
     */
    public function getSeverityLabelAttribute(): string
    {
        return self::SEVERITIES[$this->severity] ?? $this->severity;
    }

    /**
     * Get error type label
     */
    public function getTypeLabelAttribute(): string
    {
        return self::TYPES[$this->error_type] ?? $this->error_type;
    }

    /**
     * Get type icon
     */
    public function getTypeIcon(): string
    {
        return match ($this->error_type) {
            self::TYPE_BUG => 'heroicon-o-bug-ant',
            self::TYPE_UI_ISSUE => 'heroicon-o-paint-brush',
            self::TYPE_PERFORMANCE => 'heroicon-o-bolt',
            self::TYPE_FEATURE_REQUEST => 'heroicon-o-light-bulb',
            default => 'heroicon-o-question-mark-circle',
        };
    }

    /**
     * Check if report is resolved
     */
    public function isResolved(): bool
    {
        return in_array($this->status, [self::STATUS_RESOLVED, self::STATUS_CLOSED]);
    }

    /**
     * Mark report as resolved
     */
    public function markAsResolved(): void
    {
        $this->update([
            'status' => self::STATUS_RESOLVED,
            'resolved_at' => now(),
        ]);
    }
}
