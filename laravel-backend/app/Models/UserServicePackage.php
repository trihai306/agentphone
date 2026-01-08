<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class UserServicePackage extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'order_code',
        'user_id',
        'service_package_id',
        'transaction_id',
        'price_paid',
        'discount_amount',
        'discount_code',
        'currency',
        'status',
        'payment_status',
        'payment_method',
        'activated_at',
        'expires_at',
        'credits_remaining',
        'credits_used',
        'usage_stats',
        'auto_renew',
        'renewed_at',
        'renewed_from_id',
        'admin_note',
        'user_note',
        'metadata',
        'cancel_reason',
        'cancelled_by',
        'cancelled_at',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'price_paid' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'credits_remaining' => 'integer',
        'credits_used' => 'integer',
        'usage_stats' => 'array',
        'metadata' => 'array',
        'auto_renew' => 'boolean',
        'activated_at' => 'datetime',
        'expires_at' => 'datetime',
        'renewed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_ACTIVE = 'active';
    const STATUS_EXPIRED = 'expired';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_REFUNDED = 'refunded';

    const PAYMENT_STATUS_PENDING = 'pending';
    const PAYMENT_STATUS_PAID = 'paid';
    const PAYMENT_STATUS_FAILED = 'failed';
    const PAYMENT_STATUS_REFUNDED = 'refunded';

    public static function getStatuses(): array
    {
        return [
            self::STATUS_PENDING => 'Chờ xử lý',
            self::STATUS_ACTIVE => 'Đang hoạt động',
            self::STATUS_EXPIRED => 'Hết hạn',
            self::STATUS_CANCELLED => 'Đã hủy',
            self::STATUS_REFUNDED => 'Đã hoàn tiền',
        ];
    }

    public static function getPaymentStatuses(): array
    {
        return [
            self::PAYMENT_STATUS_PENDING => 'Chờ thanh toán',
            self::PAYMENT_STATUS_PAID => 'Đã thanh toán',
            self::PAYMENT_STATUS_FAILED => 'Thanh toán thất bại',
            self::PAYMENT_STATUS_REFUNDED => 'Đã hoàn tiền',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($userPackage) {
            if (empty($userPackage->order_code)) {
                $userPackage->order_code = static::generateOrderCode();
            }
        });
    }

    public static function generateOrderCode(): string
    {
        do {
            $code = 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(6));
        } while (static::where('order_code', $code)->exists());

        return $code;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function servicePackage(): BelongsTo
    {
        return $this->belongsTo(ServicePackage::class);
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function renewedFrom(): BelongsTo
    {
        return $this->belongsTo(UserServicePackage::class, 'renewed_from_id');
    }

    public function cancelledByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function approvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeExpired($query)
    {
        return $query->where('status', self::STATUS_EXPIRED);
    }

    public function scopeExpiring($query, $days = 7)
    {
        return $query->where('status', self::STATUS_ACTIVE)
            ->whereNotNull('expires_at')
            ->whereBetween('expires_at', [now(), now()->addDays($days)]);
    }

    public function scopePaid($query)
    {
        return $query->where('payment_status', self::PAYMENT_STATUS_PAID);
    }

    public function getIsExpiredAttribute(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->status === self::STATUS_ACTIVE && !$this->is_expired;
    }

    public function getDaysRemainingAttribute(): ?int
    {
        if (!$this->expires_at) {
            return null;
        }

        if ($this->expires_at->isPast()) {
            return 0;
        }

        return (int) now()->diffInDays($this->expires_at);
    }

    public function getCreditsPercentUsedAttribute(): ?int
    {
        if (!$this->credits_remaining && !$this->credits_used) {
            return null;
        }

        $total = $this->credits_remaining + $this->credits_used;
        if ($total === 0) {
            return 0;
        }

        return (int) round(($this->credits_used / $total) * 100);
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            self::STATUS_PENDING => 'warning',
            self::STATUS_ACTIVE => 'success',
            self::STATUS_EXPIRED => 'secondary',
            self::STATUS_CANCELLED => 'danger',
            self::STATUS_REFUNDED => 'info',
            default => 'secondary',
        };
    }

    public function getPaymentStatusColorAttribute(): string
    {
        return match($this->payment_status) {
            self::PAYMENT_STATUS_PENDING => 'warning',
            self::PAYMENT_STATUS_PAID => 'success',
            self::PAYMENT_STATUS_FAILED => 'danger',
            self::PAYMENT_STATUS_REFUNDED => 'info',
            default => 'secondary',
        };
    }

    public function activate(): void
    {
        $package = $this->servicePackage;

        $this->update([
            'status' => self::STATUS_ACTIVE,
            'activated_at' => now(),
            'expires_at' => $package->duration_days ? now()->addDays($package->duration_days) : null,
            'credits_remaining' => $package->credits,
        ]);
    }

    public function cancel(int $userId, ?string $reason = null): void
    {
        $this->update([
            'status' => self::STATUS_CANCELLED,
            'cancelled_by' => $userId,
            'cancelled_at' => now(),
            'cancel_reason' => $reason,
        ]);
    }

    public function useCredits(int $amount): bool
    {
        if ($this->credits_remaining === null || $this->credits_remaining < $amount) {
            return false;
        }

        $this->update([
            'credits_remaining' => $this->credits_remaining - $amount,
            'credits_used' => $this->credits_used + $amount,
        ]);

        return true;
    }

    public function checkAndExpire(): bool
    {
        if ($this->is_expired && $this->status === self::STATUS_ACTIVE) {
            $this->update(['status' => self::STATUS_EXPIRED]);
            return true;
        }

        return false;
    }
}
