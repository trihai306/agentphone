<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiCreditPackage extends Model
{
    protected $fillable = [
        'name',
        'description',
        'credits',
        'price',
        'original_price',
        'currency',
        'is_active',
        'is_featured',
        'sort_order',
        'badge',
        'badge_color',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'original_price' => 'decimal:2',
        'credits' => 'integer',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Scope: Active packages only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Featured packages only
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope: Ordered by sort_order
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('price');
    }

    /**
     * Get discount percentage
     */
    public function getDiscountPercentAttribute(): ?int
    {
        if (!$this->original_price || $this->original_price <= $this->price) {
            return null;
        }

        return (int) round((($this->original_price - $this->price) / $this->original_price) * 100);
    }

    /**
     * Get formatted price
     */
    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->price, 0, ',', '.') . '₫';
    }

    /**
     * Get formatted original price
     */
    public function getFormattedOriginalPriceAttribute(): ?string
    {
        if (!$this->original_price) {
            return null;
        }

        return number_format($this->original_price, 0, ',', '.') . '₫';
    }

    /**
     * Get price per credit
     */
    public function getPricePerCreditAttribute(): float
    {
        return $this->credits > 0 ? $this->price / $this->credits : 0;
    }

    /**
     * Get credits per VND
     */
    public function getCreditsPerVndAttribute(): float
    {
        return $this->price > 0 ? $this->credits / $this->price : 0;
    }
}
