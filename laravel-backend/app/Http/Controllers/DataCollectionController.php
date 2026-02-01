<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDataCollectionRequest;
use App\Models\DataCollection;
use App\Services\DataCollectionService;
use App\Services\DataCollectionCacheService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DataCollectionController extends Controller
{
    public function __construct(
        protected DataCollectionService $collectionService,
        protected DataCollectionCacheService $cacheService
    ) {
    }

    /**
     * Display a listing of collections
     */
    public function index()
    {
        $user = Auth::user();

        return Inertia::render('DataCollections/Index', [
            'collections' => $this->collectionService->getCollectionsForUser($user),
            'stats' => $this->collectionService->getCollectionStats($user),
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
     * Display the specified collection with records
     */
    public function show(Request $request, DataCollection $dataCollection)
    {
        $this->authorize('view', $dataCollection);

        $params = [
            'cursor' => $request->input('cursor'),
            'direction' => $request->input('direction', 'next'),
            'per_page' => $request->input('per_page', 50),
            'search' => $request->input('search'),
            'sort' => $request->input('sort', 'id'),
            'order' => $request->input('order', 'desc'),
        ];

        $totalRecords = $this->cacheService->getRecordCount($dataCollection);

        return Inertia::render('DataCollections/Show', [
            'collection' => $this->cacheService->getMetadata($dataCollection) + [
                'total_records' => $totalRecords,
                'updated_at' => $dataCollection->updated_at?->diffForHumans(),
            ],
            'records' => $this->collectionService->getRecordsWithPagination($dataCollection, $params),
            'filters' => [
                'search' => $params['search'],
                'sort' => $params['sort'],
                'order' => $params['order'],
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
     * Import CSV to create new collection with records
     */
    public function importCSV(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:10',
            'color' => 'nullable|string|max:20',
            'schema' => 'required|array|min:1',
            'schema.*.name' => 'required|string',
            'schema.*.type' => 'required|string',
            'records' => 'required|array',
        ]);

        $collection = $this->collectionService->createFromImport(Auth::user(), $validated);

        return redirect()->route('data-collections.show', $collection)
            ->with('success', "Collection created with {$collection->total_records} records!");
    }

    /**
     * Import data from CSV file
     */
    public function import(Request $request, DataCollection $dataCollection)
    {
        $this->authorize('update', $dataCollection);

        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
            'mapping' => 'required|array',
        ]);

        $imported = $this->collectionService->importFromFile(
            $dataCollection,
            $request->file('file'),
            $request->mapping
        );

        return back()->with('success', "Imported {$imported} records successfully!");
    }

    /**
     * Export collection to CSV
     */
    public function export(Request $request, DataCollection $dataCollection)
    {
        $this->authorize('view', $dataCollection);

        $ids = $request->input('ids');
        $recordIds = $ids ? explode(',', $ids) : null;

        $filename = str_slug($dataCollection->name) . '-' . now()->format('Y-m-d') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = $this->collectionService->exportToCsv($dataCollection, $recordIds);

        return response()->stream($callback, 200, $headers);
    }
}
