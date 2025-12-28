<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserBankAccount extends Model
{
    protected $fillable = [
        'user_id',
        'bank_id',
        'account_number',
        'account_name',
        'branch',
        'is_verified',
        'is_default',
        'verified_at',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'is_default' => 'boolean',
        'verified_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bank(): BelongsTo
    {
        return $this->belongsTo(Bank::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($account) {
            if ($account->is_default) {
                static::where('user_id', $account->user_id)
                    ->where('id', '!=', $account->id)
                    ->update(['is_default' => false]);
            }
        });
    }
}
