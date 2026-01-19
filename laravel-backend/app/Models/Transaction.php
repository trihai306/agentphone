<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Transaction extends Model
{
    use LogsActivity;
    protected $fillable = [
        'transaction_code',
        'user_id',
        'wallet_id',
        'ai_generation_id',
        'type',
        'amount',
        'fee',
        'final_amount',
        'status',
        'user_bank_account_id',
        'payment_method',
        'payment_details',
        'approved_by',
        'admin_note',
        'user_note',
        'reject_reason',
        'proof_images',
        'bank_transaction_id',
        'approved_at',
        'completed_at',
        'cancelled_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'fee' => 'decimal:2',
        'final_amount' => 'decimal:2',
        'payment_details' => 'array',
        'proof_images' => 'array',
        'approved_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    const TYPE_DEPOSIT = 'deposit';
    const TYPE_WITHDRAWAL = 'withdrawal';
    const TYPE_AI_GENERATION = 'ai_generation';

    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
    const STATUS_CANCELLED = 'cancelled';

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($transaction) {
            if (empty($transaction->transaction_code)) {
                $transaction->transaction_code = static::generateTransactionCode();
            }
        });
    }

    public static function generateTransactionCode(): string
    {
        do {
            $code = strtoupper(Str::random(3)) . date('YmdHis') . rand(100, 999);
        } while (static::where('transaction_code', $code)->exists());

        return $code;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

    public function userBankAccount(): BelongsTo
    {
        return $this->belongsTo(UserBankAccount::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function aiGeneration(): BelongsTo
    {
        return $this->belongsTo(AiGeneration::class);
    }

    public function scopeDeposit($query)
    {
        return $query->where('type', self::TYPE_DEPOSIT);
    }

    public function scopeWithdrawal($query)
    {
        return $query->where('type', self::TYPE_WITHDRAWAL);
    }

    public function scopeAiGeneration($query)
    {
        return $query->where('type', self::TYPE_AI_GENERATION);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeProcessing($query)
    {
        return $query->where('status', self::STATUS_PROCESSING);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'warning',
            self::STATUS_PROCESSING => 'info',
            self::STATUS_COMPLETED => 'success',
            self::STATUS_FAILED => 'danger',
            self::STATUS_CANCELLED => 'secondary',
            default => 'secondary',
        };
    }

    public function getTypeColorAttribute(): string
    {
        return match ($this->type) {
            self::TYPE_DEPOSIT => 'success',
            self::TYPE_WITHDRAWAL => 'danger',
            self::TYPE_AI_GENERATION => 'info',
            default => 'secondary',
        };
    }
}
