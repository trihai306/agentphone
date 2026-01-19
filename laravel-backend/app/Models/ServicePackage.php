<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class ServicePackage extends Model
{
    use SoftDeletes, LogsActivity;

    protected $fillable = [
        'code',
        'name',
        'description',
        'type',
        'price',
        'original_price',
        'currency',
        'duration_days',
        'credits',
        'features',
        'limits',
        'max_devices',
        'priority',
        'is_featured',
        'is_active',
        'is_trial',
        'trial_days',
        'badge',
        'badge_color',
        'icon',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'original_price' => 'decimal:2',
        'duration_days' => 'integer',
        'credits' => 'integer',
        'features' => 'array',
        'limits' => 'array',
        'max_devices' => 'integer',
        'priority' => 'integer',
        'is_featured' => 'boolean',
        'is_active' => 'boolean',
        'is_trial' => 'boolean',
        'trial_days' => 'integer',
    ];

    const TYPE_SUBSCRIPTION = 'subscription';
    const TYPE_ONE_TIME = 'one_time';
    const TYPE_CREDITS = 'credits';

    public static function getTypes(): array
    {
        return [
            self::TYPE_SUBSCRIPTION => 'Gói thuê bao',
            self::TYPE_ONE_TIME => 'Mua một lần',
            self::TYPE_CREDITS => 'Gói Credits',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($package) {
            if (empty($package->code)) {
                $package->code = static::generateCode();
            }
        });
    }

    public static function generateCode(): string
    {
        do {
            $code = 'PKG-' . strtoupper(Str::random(8));
        } while (static::where('code', $code)->exists());

        return $code;
    }

    public function userServicePackages(): HasMany
    {
        return $this->hasMany(UserServicePackage::class);
    }

    public function activeSubscriptions(): HasMany
    {
        return $this->hasMany(UserServicePackage::class)
            ->where('status', UserServicePackage::STATUS_ACTIVE);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeSubscription($query)
    {
        return $query->where('type', self::TYPE_SUBSCRIPTION);
    }

    public function scopeOneTime($query)
    {
        return $query->where('type', self::TYPE_ONE_TIME);
    }

    public function scopeCredits($query)
    {
        return $query->where('type', self::TYPE_CREDITS);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('priority', 'desc')->orderBy('price', 'asc');
    }

    public function getDiscountPercentAttribute(): ?int
    {
        if (!$this->original_price || $this->original_price <= $this->price) {
            return null;
        }

        return (int) round((($this->original_price - $this->price) / $this->original_price) * 100);
    }

    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->price, 0, ',', '.') . ' ' . $this->currency;
    }

    public function getFormattedOriginalPriceAttribute(): ?string
    {
        if (!$this->original_price) {
            return null;
        }
        return number_format($this->original_price, 0, ',', '.') . ' ' . $this->currency;
    }

    public function getTotalSubscribersAttribute(): int
    {
        return $this->userServicePackages()->count();
    }

    public function getActiveSubscribersAttribute(): int
    {
        return $this->activeSubscriptions()->count();
    }
}
