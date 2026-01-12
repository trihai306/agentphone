<?php

namespace App\Http\Controllers;

use App\Models\Flow;
use App\Models\FlowEdge;
use App\Models\FlowNode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FlowController extends Controller
{
    /**
     * Display list of flows
     */
    public function index()
    {
        $user = Auth::user();

        $flows = Flow::where('user_id', $user->id)
            ->withCount(['nodes', 'edges'])
            ->orderBy('updated_at', 'desc')
            ->paginate(12)
            ->through(fn($flow) => [
                'id' => $flow->id,
                'name' => $flow->name,
                'description' => $flow->description,
                'status' => $flow->status,
                'nodes_count' => $flow->nodes_count,
                'edges_count' => $flow->edges_count,
                'is_template' => $flow->is_template,
                'updated_at' => $flow->updated_at->toISOString(),
                'created_at' => $flow->created_at->toISOString(),
            ]);

        return Inertia::render('Flows/Index', [
            'flows' => $flows,
        ]);
    }

    /**
     * Create a new flow
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $user = Auth::user();

        $flow = Flow::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'description' => $request->description,
            'status' => Flow::STATUS_DRAFT,
            'viewport' => ['x' => 0, 'y' => 0, 'zoom' => 1],
        ]);

        return redirect()->route('flows.edit', $flow->id);
    }

    /**
     * Show flow editor
     */
    public function edit(Flow $flow)
    {
        $user = Auth::user();

        if ($flow->user_id !== $user->id) {
            abort(403);
        }

        // Get online devices for this user
        // Extended timeout for development (24 hours instead of 5 minutes)
        $onlineDevices = $user->devices()
            ->online(1440) // 24 hours for dev, consider heartbeat not running frequently
            ->orderBy('last_active_at', 'desc')
            ->get()
            ->map(fn($device) => [
                'id' => $device->id,
                'name' => $device->name,
                'device_id' => $device->device_id,
                'model' => $device->model,
                'is_online' => true, // Already filtered by online scope
                'last_active_at' => $device->last_active_at?->diffForHumans(),
            ]);

        \Log::info('FlowController edit():', [
            'user_id' => $user->id,
            'flow_id' => $flow->id,
            'onlineDevices_count' => $onlineDevices->count(),
            'onlineDevices' => $onlineDevices->values()->toArray(),
        ]);

        // Get user's media files for ResourceNodes
        $mediaFiles = $user->media()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($media) => [
                'id' => $media->id,
                'original_name' => $media->original_name,
                'url' => $media->url,
                'thumbnail_url' => $media->thumbnail_url,
                'type' => $media->type,
                'formatted_size' => $media->formatted_size,
                'created_at' => $media->created_at->toISOString(),
            ]);

        // Get user's data collections for DataSourceNode
        $dataCollections = $user->dataCollections()
            ->withCount('records')
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(fn($collection) => [
                'id' => $collection->id,
                'name' => $collection->name,
                'description' => $collection->description,
                'icon' => $collection->icon,
                'color' => $collection->color,
                'schema' => $collection->schema,
                'records_count' => $collection->records_count,
                'updated_at' => $collection->updated_at->toISOString(),
            ]);

        return Inertia::render('Flows/Editor', [
            'flow' => $flow->toReactFlowFormat(),
            'onlineDevices' => $onlineDevices->values()->toArray(),
            'mediaFiles' => $mediaFiles->toArray(),
            'dataCollections' => $dataCollections->toArray(),
        ]);
    }

    /**
     * Update flow metadata
     */
    public function update(Request $request, Flow $flow)
    {
        $user = Auth::user();

        if ($flow->user_id !== $user->id) {
            abort(403);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'status' => 'sometimes|string|in:draft,active,archived',
            'metadata' => 'sometimes|array',
        ]);

        $flow->update($request->only(['name', 'description', 'status', 'metadata']));

        return back()->with('success', 'Flow updated successfully');
    }

    /**
     * Save flow state (nodes, edges, viewport) - auto-save endpoint
     */
    public function saveState(Request $request, Flow $flow)
    {
        $user = Auth::user();

        if ($flow->user_id !== $user->id) {
            abort(403);
        }

        $request->validate([
            'nodes' => 'required|array',
            'edges' => 'required|array',
            'viewport' => 'nullable|array',
        ]);

        DB::transaction(function () use ($request, $flow, $user) {
            // Update viewport
            if ($request->has('viewport')) {
                $flow->update(['viewport' => $request->viewport]);
            }

            // Sync nodes
            $existingNodeIds = [];
            foreach ($request->nodes as $nodeData) {
                $existingNodeIds[] = $nodeData['id'];

                FlowNode::updateOrCreate(
                    [
                        'flow_id' => $flow->id,
                        'node_id' => $nodeData['id'],
                    ],
                    [
                        'user_id' => $user->id,
                        'type' => $nodeData['type'] ?? 'default',
                        'label' => $nodeData['data']['label'] ?? null,
                        'position_x' => $nodeData['position']['x'] ?? 0,
                        'position_y' => $nodeData['position']['y'] ?? 0,
                        'data' => $nodeData['data'] ?? [],
                        'style' => $nodeData['style'] ?? null,
                        'is_active' => true,
                    ]
                );
            }

            // Delete removed nodes
            FlowNode::where('flow_id', $flow->id)
                ->whereNotIn('node_id', $existingNodeIds)
                ->delete();

            // Sync edges
            $existingEdgeIds = [];
            foreach ($request->edges as $edgeData) {
                $existingEdgeIds[] = $edgeData['id'];

                FlowEdge::updateOrCreate(
                    [
                        'flow_id' => $flow->id,
                        'edge_id' => $edgeData['id'],
                    ],
                    [
                        'user_id' => $user->id,
                        'source_node_id' => $edgeData['source'],
                        'target_node_id' => $edgeData['target'],
                        'source_handle' => $edgeData['sourceHandle'] ?? null,
                        'target_handle' => $edgeData['targetHandle'] ?? null,
                        'type' => $edgeData['type'] ?? 'default',
                        'label' => $edgeData['label'] ?? null,
                        'animated' => $edgeData['animated'] ?? false,
                        'style' => $edgeData['style'] ?? null,
                        'data' => $edgeData['data'] ?? null,
                    ]
                );
            }

            // Delete removed edges
            FlowEdge::where('flow_id', $flow->id)
                ->whereNotIn('edge_id', $existingEdgeIds)
                ->delete();

            // Update flow timestamp
            $flow->touch();
        });

        return response()->json([
            'success' => true,
            'message' => 'Flow saved successfully',
            'saved_at' => now()->toISOString(),
        ]);
    }

    /**
     * Delete flow
     */
    public function destroy(Flow $flow)
    {
        $user = Auth::user();

        if ($flow->user_id !== $user->id) {
            abort(403);
        }

        $flow->delete();

        return redirect()->route('flows.index')->with('success', 'Flow deleted successfully');
    }

    /**
     * Duplicate a flow
     */
    public function duplicate(Flow $flow)
    {
        $user = Auth::user();

        if ($flow->user_id !== $user->id) {
            abort(403);
        }

        $newFlow = DB::transaction(function () use ($flow, $user) {
            $newFlow = $flow->replicate();
            $newFlow->name = $flow->name . ' (Copy)';
            $newFlow->status = Flow::STATUS_DRAFT;
            $newFlow->save();

            // Duplicate nodes
            foreach ($flow->nodes as $node) {
                $newNode = $node->replicate();
                $newNode->flow_id = $newFlow->id;
                $newNode->save();
            }

            // Duplicate edges
            foreach ($flow->edges as $edge) {
                $newEdge = $edge->replicate();
                $newEdge->flow_id = $newFlow->id;
                $newEdge->save();
            }

            return $newFlow;
        });

        return redirect()->route('flows.edit', $newFlow->id);
    }
}
