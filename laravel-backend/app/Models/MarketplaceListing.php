<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MarketplaceListing extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $fillable = [
        'user_id',
        'listable_type',
        'listable_id',
        'title',
        'description',
        'thumbnail',
        'tags',
        'bundled_collection_ids',
        'price_type',
        'price',
        'status',
        'rejection_reason',
        'published_at',
    ];

    protected $casts = [
        'tags' => 'array',
        'bundled_collection_ids' => 'array',
        'published_at' => 'datetime',
        'price' => 'integer',
        'downloads_count' => 'integer',
        'views_count' => 'integer',
        'rating' => 'decimal:1',
        'ratings_count' => 'integer',
    ];

    /**
     * Status constants
     */
    public const STATUS_DRAFT = 'draft';
    public const STATUS_PENDING = 'pending';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_REJECTED = 'rejected';

    /**
     * Price type constants
     */
    public const PRICE_TYPE_FREE = 'free';
    public const PRICE_TYPE_PAID = 'paid';

    /**
     * Relationships
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function listable(): MorphTo
    {
        return $this->morphTo();
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(MarketplacePurchase::class, 'listing_id');
    }

    /**
     * Scopes
     */
    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeByType($query, string $type)
    {
        $modelClass = match ($type) {
            'data_collection', 'collection' => DataCollection::class,
            'flow', 'workflow' => Flow::class,
            default => $type,
        };
        return $query->where('listable_type', $modelClass);
    }

    public function scopeFree($query)
    {
        return $query->where('price_type', self::PRICE_TYPE_FREE);
    }

    public function scopePaid($query)
    {
        return $query->where('price_type', self::PRICE_TYPE_PAID);
    }

    /**
     * Accessors
     */
    public function getListableTypeNameAttribute(): string
    {
        return match ($this->listable_type) {
            DataCollection::class => 'Data Collection',
            Flow::class => 'Workflow',
            default => class_basename($this->listable_type),
        };
    }

    public function getIsFreeAttribute(): bool
    {
        return $this->price_type === self::PRICE_TYPE_FREE;
    }

    /**
     * Helper Methods
     */
    public function publish(): void
    {
        $this->update([
            'status' => self::STATUS_PUBLISHED,
            'published_at' => now(),
            'rejection_reason' => null,
        ]);
    }

    public function reject(string $reason): void
    {
        $this->update([
            'status' => self::STATUS_REJECTED,
            'rejection_reason' => $reason,
        ]);
    }

    public function updateRating(): void
    {
        $purchases = $this->purchases()->whereNotNull('rating');
        $this->update([
            'rating' => $purchases->avg('rating') ?? 0,
            'ratings_count' => $purchases->count(),
        ]);
    }

    /**
     * Get bundled DataCollections
     */
    public function getBundledCollections()
    {
        if (empty($this->bundled_collection_ids)) {
            return collect();
        }
        return DataCollection::whereIn('id', $this->bundled_collection_ids)->get();
    }

    /**
     * Extract DataCollection IDs from Flow nodes
     */
    public static function extractCollectionIdsFromFlow(Flow $flow): array
    {
        $collectionIds = [];

        foreach ($flow->nodes as $node) {
            // Check if node has collectionId in its data
            if (!empty($node->data['collectionId'])) {
                $collectionIds[] = (int) $node->data['collectionId'];
            }
            // Also check for data_collection_id format
            if (!empty($node->data['data_collection_id'])) {
                $collectionIds[] = (int) $node->data['data_collection_id'];
            }
        }

        return array_unique($collectionIds);
    }
}
