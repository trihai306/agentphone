<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDataCollectionRequest;
use App\Models\DataCollection;
use App\Models\DataRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DataCollectionController extends Controller
{
    /**
     * Display a listing of collections (Grid view)
     */
    public function index()
    {
        $user = Auth::user();

        $collections = $user->dataCollections()
            ->withCount([
                    'records' => function ($query) {
                        $query->where('status', 'active');
                    }
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

        $totalRecords = DataRecord::whereHas('collection', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->where('status', 'active')->count();

        return Inertia::render('DataCollections/Index', [
            'collections' => $collections,
            'stats' => [
                'total_collections' => $user->dataCollections()->count(),
                'total_records' => $totalRecords,
                'active_workflows' => 0, // TODO: Count workflows using data sources
            ],
        ]);
    }

    /**
     * Store a newly created collection
     */
    public function store(StoreDataCollectionRequest $request)
    {
        $validated = $request->validated();

        $collection = Auth::user()->dataCollections()->create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? '📊',
            'color' => $validated['color'] ?? '#3b82f6',
            'schema' => $validated['schema'],
            'total_records' => 0,
        ]);

        return redirect()->route('data-collections.show', $collection)
            ->with('success', 'Collection created successfully!');
    }

    /**
     * Display the specified collection with records (Table view)
     * Optimized with cursor pagination for handling millions of records
     */
    public function show(Request $request, DataCollection $dataCollection)
    {
        $this->authorize('view', $dataCollection);

        // Get cache service
        $cache = app(\App\Services\DataCollectionCacheService::class);

        // Parse query parameters
        $cursor = $request->input('cursor'); // Record ID for cursor pagination
        $direction = $request->input('direction', 'next'); // next or prev
        $perPage = min((int) $request->input('per_page', 50), 100); // Max 100
        $search = $request->input('search');
        $sortField = $request->input('sort', 'id');
        $sortDir = $request->input('order', 'desc');

        // Build optimized query
        $query = $dataCollection->records()
            ->where('status', 'active')
            ->whereNull('deleted_at');

        // Apply search if provided (uses fulltext index if available)
        if ($search) {
            $query->where(function ($q) use ($search) {
                // Search in JSON data field
                $q->whereRaw("JSON_SEARCH(LOWER(data), 'one', LOWER(?)) IS NOT NULL", ["%{$search}%"]);
            });
        }

        // Apply cursor pagination (O(1) performance!)
        if ($cursor) {
            if ($direction === 'next') {
                $query->where('id', '<', $cursor);
            } else {
                $query->where('id', '>', $cursor);
            }
        }

        // Order and limit
        $query->orderBy($sortField === 'created_at' ? 'created_at' : 'id', $sortDir);

        // Fetch one extra to determine if there are more pages
        $records = $query->limit($perPage + 1)->get();

        // Check if there are more records
        $hasMore = $records->count() > $perPage;
        if ($hasMore) {
            $records = $records->take($perPage);
        }

        // Get cursors for navigation
        $nextCursor = $hasMore && $records->isNotEmpty() ? $records->last()->id : null;
        $prevCursor = $cursor ? $records->first()?->id : null;

        // Map records
        $mappedRecords = $records->map(fn($record) => [
            'id' => $record->id,
            'data' => $record->data,
            'created_at' => $record->created_at?->toISOString(),
            'updated_at' => $record->updated_at?->diffForHumans(),
        ]);

        // Get total count from cache (critical for large tables!)
        $totalRecords = $cache->getRecordCount($dataCollection);

        return Inertia::render('DataCollections/Show', [
            'collection' => $cache->getMetadata($dataCollection) + [
                'total_records' => $totalRecords,
                'updated_at' => $dataCollection->updated_at?->diffForHumans(),
            ],
            'records' => [
                'data' => $mappedRecords,
                'next_cursor' => $nextCursor,
                'prev_cursor' => $prevCursor,
                'has_more' => $hasMore,
                'per_page' => $perPage,
            ],
            'filters' => [
                'search' => $search,
                'sort' => $sortField,
                'order' => $sortDir,
            ],
        ]);
    }

    /**
     * Update the specified collection
     */
    public function update(Request $request, DataCollection $dataCollection)
    {
        $this->authorize('update', $dataCollection);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:10',
            'color' => 'nullable|string|max:7',
            'schema' => 'sometimes|array',
        ]);

        $dataCollection->update($validated);

        return back()->with('success', 'Collection updated successfully!');
    }

    /**
     * Remove the specified collection
     */
    public function destroy(DataCollection $dataCollection)
    {
        $this->authorize('delete', $dataCollection);

        $dataCollection->delete();

        return redirect()->route('data-collections.index')
            ->with('success', 'Collection deleted successfully!');
    }

    /**
     * Import data from CSV
     */
    public function import(Request $request, DataCollection $dataCollection)
    {
        $this->authorize('update', $dataCollection);

        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
            'mapping' => 'required|array',
        ]);

        $file = $request->file('file');
        $mapping = $request->mapping;

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

            $dataCollection->records()->create([
                'data' => $data,
                'status' => 'active',
            ]);
            $imported++;
        }

        return back()->with('success', "Imported {$imported} records successfully!");
    }

    /**
     * Export collection to CSV
     */
    public function export(DataCollection $dataCollection)
    {
        $this->authorize('view', $dataCollection);

        $records = $dataCollection->records()->where('status', 'active')->get();
        $schema = $dataCollection->schema;

        $filename = str_slug($dataCollection->name) . '-' . now()->format('Y-m-d') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($records, $schema) {
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

        return response()->stream($callback, 200, $headers);
    }
}
