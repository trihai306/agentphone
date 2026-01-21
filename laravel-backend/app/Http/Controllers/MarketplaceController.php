<?php

namespace App\Http\Controllers;

use App\Models\DataCollection;
use App\Models\DataRecord;
use App\Models\Flow;
use App\Models\MarketplaceListing;
use App\Models\MarketplacePurchase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MarketplaceController extends Controller
{
    /**
     * Browse published listings
     */
    public function index(Request $request)
    {
        $query = MarketplaceListing::published()
            ->with(['user:id,name,avatar', 'listable'])
            ->withCount('purchases');

        // Filter by type
        if ($request->filled('type')) {
            $query->byType($request->type);
        }

        // Filter by price type
        if ($request->filled('price_type')) {
            if ($request->price_type === 'free') {
                $query->free();
            } elseif ($request->price_type === 'paid') {
                $query->paid();
            }
        }

        // Filter by category (search in tags)
        if ($request->filled('category') && $request->category !== 'all') {
            $category = $request->category;
            $query->where(function ($q) use ($category) {
                $q->whereJsonContains('tags', $category)
                    ->orWhere('title', 'like', "%{$category}%")
                    ->orWhere('description', 'like', "%{$category}%");
            });
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereJsonContains('tags', $search);
            });
        }

        // Sort
        $sortBy = $request->get('sort', 'popular');
        $query->when($sortBy === 'popular', fn($q) => $q->orderByDesc('downloads_count'))
            ->when($sortBy === 'newest', fn($q) => $q->orderByDesc('published_at'))
            ->when($sortBy === 'rating', fn($q) => $q->orderByDesc('rating'))
            ->when($sortBy === 'price_low', fn($q) => $q->orderBy('price'))
            ->when($sortBy === 'price_high', fn($q) => $q->orderByDesc('price'));

        $listings = $query->paginate(18)->withQueryString();

        // Get stats
        $stats = [
            'total_listings' => MarketplaceListing::published()->count(),
            'total_downloads' => MarketplaceListing::published()->sum('downloads_count'),
            'collections_count' => MarketplaceListing::published()->byType('collection')->count(),
            'workflows_count' => MarketplaceListing::published()->byType('flow')->count(),
        ];

        // Get popular tags
        $popularTags = MarketplaceListing::published()
            ->whereNotNull('tags')
            ->get()
            ->pluck('tags')
            ->flatten()
            ->countBy()
            ->sortDesc()
            ->take(20)
            ->keys()
            ->toArray();

        return Inertia::render('Marketplace/Index', [
            'listings' => $listings,
            'filters' => [
                'type' => $request->get('type'),
                'search' => $request->get('search'),
                'price_type' => $request->get('price_type'),
                'category' => $request->get('category'),
                'sort' => $request->get('sort', 'popular'),
            ],
            'stats' => $stats,
            'popularTags' => $popularTags,
        ]);
    }

    /**
     * View listing detail
     */
    public function show(MarketplaceListing $listing)
    {
        abort_unless($listing->status === MarketplaceListing::STATUS_PUBLISHED, 404);

        // Increment view count
        $listing->increment('views_count');

        $user = auth()->user();
        $hasPurchased = $user
            ? $user->marketplacePurchases()->where('listing_id', $listing->id)->exists()
            : false;

        $userPurchase = $hasPurchased
            ? $user->marketplacePurchases()->where('listing_id', $listing->id)->first()
            : null;

        // Get related listings
        $relatedListings = MarketplaceListing::published()
            ->where('id', '!=', $listing->id)
            ->where('listable_type', $listing->listable_type)
            ->limit(4)
            ->get();

        // Get recent reviews
        $reviews = $listing->purchases()
            ->whereNotNull('rating')
            ->with('user:id,name,avatar')
            ->latest()
            ->limit(10)
            ->get();

        // Get bundled collections info
        $bundledCollections = $listing->getBundledCollections()
            ->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'icon' => $c->icon,
                'color' => $c->color,
                'schema' => $c->schema,
            ]);

        return Inertia::render('Marketplace/Show', [
            'listing' => $listing->load(['user:id,name,avatar', 'listable']),
            'bundledCollections' => $bundledCollections,
            'hasPurchased' => $hasPurchased,
            'userPurchase' => $userPurchase,
            'relatedListings' => $relatedListings,
            'reviews' => $reviews,
        ]);
    }

    /**
     * Purchase/Download a listing
     */
    public function purchase(Request $request, MarketplaceListing $listing)
    {
        abort_unless($listing->status === MarketplaceListing::STATUS_PUBLISHED, 404);

        $user = auth()->user();

        // Check if already purchased
        if ($user->marketplacePurchases()->where('listing_id', $listing->id)->exists()) {
            return back()->with('error', 'You have already purchased this item.');
        }

        // Cannot purchase own listing
        if ($listing->user_id === $user->id) {
            return back()->with('error', 'You cannot purchase your own listing.');
        }

        return DB::transaction(function () use ($user, $listing) {
            $pricePaid = 0;

            // Handle payment for paid items
            if ($listing->price_type === MarketplaceListing::PRICE_TYPE_PAID) {
                if ($user->ai_credits < $listing->price) {
                    return back()->with('error', 'Insufficient credits. You need ' . $listing->price . ' credits.');
                }

                // Deduct from buyer
                $user->deductAiCredits($listing->price);
                $pricePaid = $listing->price;

                // Credit to seller (80%)
                $sellerShare = (int) ($listing->price * 0.8);
                $listing->user->addAiCredits($sellerShare);
            }

            // Clone bundled DataCollections first (for workflows)
            $collectionMapping = [];
            if ($listing->listable instanceof Flow && !empty($listing->bundled_collection_ids)) {
                $bundledCollections = DataCollection::whereIn('id', $listing->bundled_collection_ids)->get();
                foreach ($bundledCollections as $collection) {
                    $clonedCollection = $this->cloneDataCollectionSchemaOnly($collection, $user);
                    $collectionMapping[$collection->id] = $clonedCollection->id;
                }
            }

            // Clone the listable to user's account
            $cloned = $this->cloneListable($listing->listable, $user, $collectionMapping);

            // Record purchase
            MarketplacePurchase::create([
                'user_id' => $user->id,
                'listing_id' => $listing->id,
                'cloned_type' => get_class($cloned),
                'cloned_id' => $cloned->id,
                'price_paid' => $pricePaid,
            ]);

            // Increment download count
            $listing->increment('downloads_count');

            $redirectRoute = $cloned instanceof Flow
                ? route('flows.edit', $cloned)
                : route('data-collections.show', $cloned);

            return redirect($redirectRoute)->with('success', 'Successfully added to your account!');
        });
    }

    /**
     * My listings management page
     */
    public function myListings()
    {
        $user = auth()->user();

        $listings = $user->marketplaceListings()
            ->with('listable')
            ->withSum('purchases', 'price_paid')
            ->latest()
            ->paginate(20);

        $stats = [
            'total_listings' => $user->marketplaceListings()->count(),
            'published' => $user->marketplaceListings()->where('status', 'published')->count(),
            'pending' => $user->marketplaceListings()->where('status', 'pending')->count(),
            'total_downloads' => $user->marketplaceListings()->sum('downloads_count'),
            'total_earnings' => MarketplacePurchase::whereIn('listing_id', $user->marketplaceListings()->pluck('id'))
                ->sum('price_paid') * 0.8, // 80% seller share
        ];

        // Get user's available items for publishing
        $userFlows = $user->flows()
            ->select('id', 'name', 'description')
            ->with('nodes:id,flow_id,type,data')
            ->get()
            ->map(function ($flow) {
                // Extract bundled collection count from nodes
                $collectionIds = MarketplaceListing::extractCollectionIdsFromFlow($flow);
                return [
                    'id' => $flow->id,
                    'name' => $flow->name,
                    'description' => $flow->description,
                    'bundled_collection_count' => count($collectionIds),
                ];
            });

        $userCollections = $user->dataCollections()
            ->select('id', 'name', 'description', 'icon', 'color', 'total_records')
            ->get();

        return Inertia::render('Marketplace/MyListings', [
            'listings' => $listings,
            'stats' => $stats,
            'userFlows' => $userFlows,
            'userCollections' => $userCollections,
        ]);
    }

    /**
     * Publish a new listing (workflows only - data collections are bundled automatically)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'listable_id' => 'required|integer|exists:flows,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'tags' => 'nullable|array|max:10',
            'tags.*' => 'string|max:50',
            'price_type' => 'required|in:free,paid',
            'price' => 'required_if:price_type,paid|nullable|integer|min:1000|max:100000000',
        ]);

        $user = auth()->user();

        // Marketplace only sells workflows - Data Collections are bundled automatically
        $modelClass = Flow::class;

        // Verify ownership
        $listable = $modelClass::where('user_id', $user->id)
            ->findOrFail($validated['listable_id']);

        // Check if already listed
        $existingListing = MarketplaceListing::where('listable_type', $modelClass)
            ->where('listable_id', $listable->id)
            ->whereNull('deleted_at')
            ->first();

        if ($existingListing) {
            return back()->with('error', 'This workflow is already listed on the marketplace.');
        }

        // Extract bundled DataCollection IDs from workflow nodes
        $bundledCollectionIds = null;
        $listable->load('nodes');
        $collectionIds = MarketplaceListing::extractCollectionIdsFromFlow($listable);

        // Verify ownership of bundled collections
        if (!empty($collectionIds)) {
            $ownedCollections = DataCollection::where('user_id', $user->id)
                ->whereIn('id', $collectionIds)
                ->pluck('id')
                ->toArray();
            $bundledCollectionIds = $ownedCollections;
        }

        // Create listing - auto-published (no review required)
        $listing = MarketplaceListing::create([
            'user_id' => $user->id,
            'listable_type' => $modelClass,
            'listable_id' => $listable->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'tags' => $validated['tags'] ?? [],
            'bundled_collection_ids' => $bundledCollectionIds,
            'price_type' => $validated['price_type'],
            'price' => $validated['price_type'] === 'paid' ? ($validated['price'] ?? 0) : 0,
            'status' => MarketplaceListing::STATUS_PUBLISHED,
            'published_at' => now(),
        ]);

        return redirect()->route('marketplace.my-listings')
            ->with('success', 'Tin đăng đã được đăng thành công!');
    }

    /**
     * Update a listing
     */
    public function update(Request $request, MarketplaceListing $listing)
    {
        $this->authorize('update', $listing);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'tags' => 'nullable|array|max:10',
            'price_type' => 'sometimes|required|in:free,paid',
            'price' => 'required_if:price_type,paid|nullable|integer|min:1|max:100000',
        ]);

        $listing->update($validated);

        // If significant changes, set back to pending
        if ($listing->wasChanged(['title', 'description'])) {
            $listing->update(['status' => MarketplaceListing::STATUS_PENDING]);
        }

        return back()->with('success', 'Listing updated successfully.');
    }

    /**
     * Delete a listing
     */
    public function destroy(MarketplaceListing $listing)
    {
        $this->authorize('delete', $listing);

        $listing->delete();

        return redirect()->route('marketplace.my-listings')
            ->with('success', 'Listing removed from marketplace.');
    }

    /**
     * Rate a purchased listing
     */
    public function rate(Request $request, MarketplaceListing $listing)
    {
        $user = auth()->user();

        $purchase = $user->marketplacePurchases()
            ->where('listing_id', $listing->id)
            ->firstOrFail();

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string|max:1000',
        ]);

        $purchase->update($validated);

        return back()->with('success', 'Thank you for your review!');
    }

    /**
     * Clone a listable (DataCollection or Flow) to user's account
     * @param array $collectionMapping Mapping of old collection IDs to new ones for updating node references
     */
    private function cloneListable($original, $user, array $collectionMapping = [])
    {
        if ($original instanceof DataCollection) {
            return $this->cloneDataCollection($original, $user);
        }

        if ($original instanceof Flow) {
            return $this->cloneFlow($original, $user, $collectionMapping);
        }

        throw new \Exception('Unknown listable type: ' . get_class($original));
    }

    /**
     * Clone a DataCollection (with records)
     */
    private function cloneDataCollection(DataCollection $original, $user): DataCollection
    {
        $clone = $original->replicate(['user_id', 'total_records']);
        $clone->user_id = $user->id;
        $clone->name = $original->name . ' (Marketplace)';
        $clone->total_records = 0;
        $clone->save();

        // Clone records
        $original->records->each(function (DataRecord $record) use ($clone) {
            $clone->records()->create([
                'data' => $record->data,
                'status' => 'active',
            ]);
        });

        $clone->updateRecordCount();

        return $clone;
    }

    /**
     * Clone a DataCollection (schema only, no records)
     */
    private function cloneDataCollectionSchemaOnly(DataCollection $original, $user): DataCollection
    {
        $clone = $original->replicate(['user_id', 'total_records']);
        $clone->user_id = $user->id;
        $clone->name = $original->name . ' (Marketplace)';
        $clone->total_records = 0;
        $clone->save();

        // No records cloned - buyer gets empty structure
        return $clone;
    }

    /**
     * Clone a Flow (workflow) with optional collection ID remapping
     */
    private function cloneFlow(Flow $original, $user, array $collectionMapping = []): Flow
    {
        $clone = $original->replicate(['user_id']);
        $clone->user_id = $user->id;
        $clone->name = $original->name . ' (Marketplace)';
        $clone->status = Flow::STATUS_DRAFT;
        $clone->save();

        // Clone nodes with ID mapping and update collection references
        $nodeMapping = [];
        foreach ($original->nodes as $node) {
            $nodeData = $node->data;

            // Update collectionId references in node data
            if (!empty($collectionMapping)) {
                if (isset($nodeData['collectionId']) && isset($collectionMapping[$nodeData['collectionId']])) {
                    $nodeData['collectionId'] = $collectionMapping[$nodeData['collectionId']];
                }
                if (isset($nodeData['data_collection_id']) && isset($collectionMapping[$nodeData['data_collection_id']])) {
                    $nodeData['data_collection_id'] = $collectionMapping[$nodeData['data_collection_id']];
                }
            }

            $newNode = $clone->nodes()->create([
                'node_id' => $node->node_id,
                'type' => $node->type,
                'label' => $node->label,
                'position_x' => $node->position_x,
                'position_y' => $node->position_y,
                'data' => $nodeData,
            ]);
            $nodeMapping[$node->id] = $newNode->id;
        }

        // Clone edges with updated node references
        foreach ($original->edges as $edge) {
            $clone->edges()->create([
                'edge_id' => $edge->edge_id,
                'source_node_id' => $nodeMapping[$edge->source_node_id] ?? null,
                'target_node_id' => $nodeMapping[$edge->target_node_id] ?? null,
                'source_handle' => $edge->source_handle,
                'target_handle' => $edge->target_handle,
            ]);
        }

        return $clone;
    }
}

