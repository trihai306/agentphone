<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wallet extends Model
{
    protected $fillable = [
        'user_id',
        'balance',
        'locked_balance',
        'currency',
        'is_active',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'locked_balance' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function getAvailableBalanceAttribute(): float
    {
        return $this->balance - $this->locked_balance;
    }

    public function deposit(float $amount): bool
    {
        $this->balance += $amount;
        return $this->save();
    }

    public function withdraw(float $amount): bool
    {
        if ($this->available_balance < $amount) {
            return false;
        }

        $this->balance -= $amount;
        return $this->save();
    }

    public function lock(float $amount): bool
    {
        if ($this->available_balance < $amount) {
            return false;
        }

        $this->locked_balance += $amount;
        return $this->save();
    }

    public function unlock(float $amount): bool
    {
        $this->locked_balance -= $amount;
        return $this->save();
    }
}
