<?php

namespace App\Services;

use App\Models\DataCollection;
use App\Models\DataRecord;
use App\Models\User;
use Illuminate\Support\Collection;

class DataCollectionService
{
    public function __construct(
        protected DataCollectionCacheService $cacheService
    ) {
    }

    /**
     * Get all collections for user with stats
     */
    public function getCollectionsForUser(User $user): Collection
    {
        return $user->dataCollections()
            ->withCount([
                'records' => fn($query) => $query->where('status', 'active')
            ])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(fn($collection) => [
                'id' => $collection->id,
                'name' => $collection->name,
                'description' => $collection->description,
                'icon' => $collection->icon,
                'color' => $collection->color,
                'total_records' => $collection->total_records,
                'schema' => $collection->schema,
                'updated_at' => $collection->updated_at->diffForHumans(),
                'created_at' => $collection->created_at->toISOString(),
            ]);
    }

    /**
     * Get collection stats for user
     */
    public function getCollectionStats(User $user): array
    {
        $totalRecords = DataRecord::whereHas('collection', fn($query) => $query->where('user_id', $user->id))
            ->where('status', 'active')
            ->count();

        return [
            'total_collections' => $user->dataCollections()->count(),
            'total_records' => $totalRecords,
            'active_workflows' => 0,
        ];
    }

    /**
     * Get records with cursor pagination
     */
    public function getRecordsWithPagination(DataCollection $collection, array $params): array
    {
        $cursor = $params['cursor'] ?? null;
        $direction = $params['direction'] ?? 'next';
        $perPage = min((int) ($params['per_page'] ?? 50), 100);
        $search = $params['search'] ?? null;
        $sortField = $params['sort'] ?? 'id';
        $sortDir = $params['order'] ?? 'desc';

        $query = $collection->records()
            ->where('status', 'active')
            ->whereNull('deleted_at');

        // Apply search
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereRaw("JSON_SEARCH(LOWER(data), 'one', LOWER(?)) IS NOT NULL", ["%{$search}%"]);
            });
        }

        // Apply cursor pagination
        if ($cursor) {
            if ($direction === 'next') {
                $query->where('id', '<', $cursor);
            } else {
                $query->where('id', '>', $cursor);
            }
        }

        // Order and limit
        $query->orderBy($sortField === 'created_at' ? 'created_at' : 'id', $sortDir);

        $records = $query->limit($perPage + 1)->get();

        $hasMore = $records->count() > $perPage;
        if ($hasMore) {
            $records = $records->take($perPage);
        }

        return [
            'data' => $records->map(fn($record) => [
                'id' => $record->id,
                'data' => $record->data,
                'created_at' => $record->created_at?->toISOString(),
                'updated_at' => $record->updated_at?->diffForHumans(),
            ]),
            'next_cursor' => $hasMore && $records->isNotEmpty() ? $records->last()->id : null,
            'prev_cursor' => $cursor ? $records->first()?->id : null,
            'has_more' => $hasMore,
            'per_page' => $perPage,
        ];
    }

    /**
     * Create collection from imported data
     */
    public function createFromImport(User $user, array $validated): DataCollection
    {
        $collection = $user->dataCollections()->create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? 'Imported from CSV',
            'icon' => $validated['icon'] ?? '📊',
            'color' => $validated['color'] ?? '#3b82f6',
            'schema' => $validated['schema'],
            'total_records' => count($validated['records']),
        ]);

        foreach ($validated['records'] as $recordData) {
            $collection->records()->create([
                'data' => $recordData,
                'status' => 'active',
            ]);
        }

        return $collection;
    }

    /**
     * Import records from CSV file
     */
    public function importFromFile(DataCollection $collection, $file, array $mapping): int
    {
        $csv = array_map('str_getcsv', file($file->getRealPath()));
        $headers = array_shift($csv);

        $imported = 0;
        foreach ($csv as $row) {
            $data = [];
            foreach ($mapping as $schemaField => $csvColumn) {
                $columnIndex = array_search($csvColumn, $headers);
                if ($columnIndex !== false) {
                    $data[$schemaField] = $row[$columnIndex] ?? null;
                }
            }

            $collection->records()->create([
                'data' => $data,
                'status' => 'active',
            ]);
            $imported++;
        }

        return $imported;
    }

    /**
     * Export records to CSV
     */
    public function exportToCsv(DataCollection $collection, ?array $recordIds = null): \Closure
    {
        $query = $collection->records()->where('status', 'active');

        if ($recordIds) {
            $query->whereIn('id', $recordIds);
        }

        $records = $query->get();
        $schema = $collection->schema;

        return function () use ($records, $schema) {
            $file = fopen('php://output', 'w');

            // Header row
            $headerRow = array_column($schema, 'name');
            fputcsv($file, $headerRow);

            // Data rows
            foreach ($records as $record) {
                $row = [];
                foreach ($schema as $field) {
                    $row[] = $record->data[$field['name']] ?? '';
                }
                fputcsv($file, $row);
            }

            fclose($file);
        };
    }
}
