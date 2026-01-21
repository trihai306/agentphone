<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class MarketplacePurchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'listing_id',
        'cloned_type',
        'cloned_id',
        'price_paid',
        'rating',
        'review',
    ];

    protected $casts = [
        'price_paid' => 'integer',
        'rating' => 'integer',
    ];

    /**
     * Relationships
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(MarketplaceListing::class, 'listing_id');
    }

    public function cloned(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Boot method for model events
     */
    protected static function boot()
    {
        parent::boot();

        // Update listing rating when a purchase is rated
        static::saved(function (MarketplacePurchase $purchase) {
            if ($purchase->isDirty('rating') && $purchase->rating) {
                $purchase->listing->updateRating();
            }
        });
    }
}
