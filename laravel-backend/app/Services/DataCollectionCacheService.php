<?php

namespace App\Services;

use App\Models\DataCollection;
use Illuminate\Support\Facades\Cache;

/**
 * Cache service for Data Collections
 * Optimizes performance for high-volume data access
 */
class DataCollectionCacheService
{
    // Cache TTL constants (in seconds)
    const TTL_METADATA = 3600;      // 1 hour for collection metadata
    const TTL_COUNT = 300;          // 5 minutes for record counts
    const TTL_RECENT = 60;          // 1 minute for recent records

    /**
     * Get collection metadata from cache or database
     */
    public function getMetadata(DataCollection $collection): array
    {
        $key = "collection:{$collection->id}:meta";

        return Cache::remember($key, self::TTL_METADATA, function () use ($collection) {
            return [
                'id' => $collection->id,
                'name' => $collection->name,
                'description' => $collection->description,
                'icon' => $collection->icon,
                'color' => $collection->color,
                'schema' => $collection->schema,
                'created_at' => $collection->created_at?->toISOString(),
            ];
        });
    }

    /**
     * Get record count from cache (critical for large tables!)
     */
    public function getRecordCount(DataCollection $collection): int
    {
        $key = "collection:{$collection->id}:count";

        return Cache::remember($key, self::TTL_COUNT, function () use ($collection) {
            return $collection->records()
                ->where('status', 'active')
                ->whereNull('deleted_at')
                ->count();
        });
    }

    /**
     * Get recent records from cache (for dashboard/preview)
     */
    public function getRecentRecords(DataCollection $collection, int $limit = 10): array
    {
        $key = "collection:{$collection->id}:recent:{$limit}";

        return Cache::remember($key, self::TTL_RECENT, function () use ($collection, $limit) {
            return $collection->records()
                ->where('status', 'active')
                ->whereNull('deleted_at')
                ->orderByDesc('id')
                ->limit($limit)
                ->get()
                ->map(fn($record) => [
                    'id' => $record->id,
                    'data' => $record->data,
                    'created_at' => $record->created_at?->toISOString(),
                ])
                ->toArray();
        });
    }

    /**
     * Invalidate all caches for a collection
     * Call this after any record change (create/update/delete)
     */
    public function invalidate(DataCollection $collection): void
    {
        Cache::forget("collection:{$collection->id}:meta");
        Cache::forget("collection:{$collection->id}:count");

        // Clear all recent record caches
        foreach ([10, 20, 50, 100] as $limit) {
            Cache::forget("collection:{$collection->id}:recent:{$limit}");
        }
    }

    /**
     * Invalidate only count and recent (after record changes)
     */
    public function invalidateRecords(DataCollection $collection): void
    {
        Cache::forget("collection:{$collection->id}:count");

        foreach ([10, 20, 50, 100] as $limit) {
            Cache::forget("collection:{$collection->id}:recent:{$limit}");
        }
    }

    /**
     * Warm up cache for a collection (called after creation)
     */
    public function warmUp(DataCollection $collection): void
    {
        $this->getMetadata($collection);
        $this->getRecordCount($collection);
    }
}
