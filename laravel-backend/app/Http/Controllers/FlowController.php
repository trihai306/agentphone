<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreFlowRequest;
use App\Models\Flow;
use App\Models\FlowEdge;
use App\Models\FlowNode;
use App\Services\FlowService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class FlowController extends Controller
{
    public function __construct(
        protected FlowService $flowService
    ) {
    }

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
    public function store(StoreFlowRequest $request)
    {
        $user = Auth::user();

        $flow = Flow::create([
            'user_id' => $user->id,
            'name' => $request->validated('name'),
            'description' => $request->validated('description'),
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
        $this->authorize('view', $flow);

        $user = Auth::user();

        // Get ONLINE devices only (socket_connected = true)
        // When user selects device, we ping to verify it's still online
        $devices = $user->devices()
            ->where('status', 'active')
            ->where('socket_connected', true) // Only online devices
            ->orderBy('last_active_at', 'desc')
            ->get()
            ->map(fn($device) => [
                'id' => $device->id,
                'name' => $device->name,
                'device_id' => $device->device_id,
                'model' => $device->model,
                'accessibility_enabled' => $device->accessibility_enabled,
                'socket_connected' => $device->socket_connected,
                'last_active_at' => $device->last_active_at?->diffForHumans(),
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
            'devices' => $devices->values()->toArray(),
            'mediaFiles' => $mediaFiles->toArray(),
            'dataCollections' => $dataCollections->toArray(),
        ]);
    }

    /**
     * Update flow metadata
     */
    public function update(Request $request, Flow $flow)
    {
        $this->authorize('update', $flow);

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
        $this->authorize('update', $flow);

        $user = Auth::user();

        $request->validate([
            'nodes' => 'present|array',  // Allow empty array when all nodes deleted
            'edges' => 'present|array',  // Allow empty array when all edges deleted
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

                // Process element icon images - extract base64 and save to storage
                $nodeData = $this->processNodeImages($nodeData, $flow->id);

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
        $this->authorize('delete', $flow);

        $flow->delete();

        return redirect()->route('flows.index')->with('success', 'Flow deleted successfully');
    }

    /**
     * Duplicate a flow
     */
    public function duplicate(Flow $flow)
    {
        $this->authorize('duplicate', $flow);

        $user = Auth::user();

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

    /**
     * Show run workflow page
     * Data source is extracted from workflow's dataSource node
     */
    public function run(Flow $flow)
    {
        $this->authorize('run', $flow);

        $user = Auth::user();

        // Get online devices
        $devices = $user->devices()
            ->where('status', 'active')
            ->orderBy('socket_connected', 'desc')
            ->orderBy('last_active_at', 'desc')
            ->get()
            ->map(fn($device) => [
                'id' => $device->id,
                'name' => $device->name,
                'model' => $device->model,
                'device_id' => $device->device_id,
                'is_online' => $device->isOnline(),
                'socket_connected' => $device->socket_connected,
                'last_active_at' => $device->last_active_at?->diffForHumans(),
            ]);

        // Find dataSource node in the workflow
        $dataSourceNode = $flow->nodes()
            ->where('type', 'dataSource')
            ->first();

        $dataSource = null;
        if ($dataSourceNode && isset($dataSourceNode->data['collectionId'])) {
            $collection = \App\Models\DataCollection::where('id', $dataSourceNode->data['collectionId'])
                ->where('user_id', $user->id)
                ->withCount('records')
                ->first();

            if ($collection) {
                $dataSource = [
                    'id' => $collection->id,
                    'name' => $collection->name,
                    'description' => $collection->description,
                    'icon' => $collection->icon,
                    'color' => $collection->color,
                    'schema' => $collection->schema,
                    'records_count' => $collection->records_count,
                ];
            }
        }

        // Flow info with node count (excluding dataSource node for action count)
        $actionNodesCount = $flow->nodes()
            ->whereNotIn('type', ['dataSource', 'start', 'end'])
            ->count();

        $flowData = [
            'id' => $flow->id,
            'name' => $flow->name,
            'description' => $flow->description,
            'status' => $flow->status,
            'nodes_count' => $flow->nodes()->count(),
            'action_nodes_count' => $actionNodesCount,
            'updated_at' => $flow->updated_at->diffForHumans(),
        ];

        return Inertia::render('Flows/Run', [
            'flow' => $flowData,
            'devices' => $devices,
            'dataSource' => $dataSource, // Embedded in workflow, not user-selectable
        ]);
    }

    /**
     * Quick test run workflow on device
     * No job creation, executes immediately for testing/development
     */
    public function testRun(Request $request, Flow $flow)
    {
        $this->authorize('run', $flow);

        $request->validate([
            'device_id' => 'required|string|exists:devices,device_id',  // ✅ UUID string, not database id
        ]);

        $user = Auth::user();

        // Get device by device_id UUID and verify ownership
        $device = $user->devices()->where('device_id', $request->device_id)->first();
        if (!$device) {
            return response()->json([
                'success' => false,
                'message' => 'Device not found or unauthorized',
            ], 404);
        }

        // Check device is online
        if (!$device->isOnline()) {
            return response()->json([
                'success' => false,
                'message' => 'Device is offline. Please ensure the device is connected.',
            ], 400);
        }

        // Traverse flow graph to get actions in correct execution order
        $actions = $this->flowService->traverseFlowForActions($flow);

        if (empty($actions)) {
            return response()->json([
                'success' => false,
                'message' => 'No executable actions in workflow',
            ], 400);
        }

        // Prepare test run payload
        $payload = [
            'flow_id' => $flow->id,
            'flow_name' => $flow->name,
            'test_run' => true,
            'actions' => $actions,
            'variables' => [],
            'timestamp' => now()->timestamp * 1000,
            // Progress callback URL for APK to report action status
            'progress_url' => config('app.url') . '/api/test-run/progress',
        ];

        // Broadcast workflow:test event to device
        Log::info('Test run broadcast', [
            'flow_id' => $flow->id,
            'device_id' => $device->device_id,
            'device_name' => $device->name,
            'actions_count' => count($actions),
            'channel' => 'device.' . $device->device_id,
        ]);

        broadcast(new \App\Events\DispatchJobToDevice($device, $payload, 'workflow:test'))->toOthers();

        Log::info('Test run started successfully', ['flow_id' => $flow->id]);

        return response()->json([
            'success' => true,
            'message' => 'Test run started',
            'data' => [
                'device_id' => $device->id,
                'device_name' => $device->name,
                'actions_count' => count($actions),
            ],
        ]);
    }

    /**
     * Receive real-time action progress from APK and broadcast to frontend
     * This enables node highlighting during workflow execution
     */
    public function reportTestRunProgress(Request $request)
    {
        $request->validate([
            'flow_id' => 'required|integer',
            'action_id' => 'required|string',
            'status' => 'required|in:running,success,error,skipped',
            'sequence' => 'required|integer',
            'total_actions' => 'required|integer',
            'message' => 'nullable|string',
            'error_branch_target' => 'nullable|string',
            'result' => 'nullable|array',
        ]);

        $user = Auth::user();

        // Verify the flow belongs to the user
        $flow = Flow::where('id', $request->flow_id)
            ->where('user_id', $user->id)
            ->first();

        if (!$flow) {
            return response()->json([
                'success' => false,
                'error' => 'Flow not found or unauthorized',
            ], 404);
        }

        // Broadcast progress event to frontend
        event(new \App\Events\WorkflowActionProgress(
            userId: $user->id,
            flowId: $flow->id,
            actionId: $request->action_id,
            status: $request->status,
            sequence: $request->sequence,
            totalActions: $request->total_actions,
            message: $request->message,
            errorBranchTarget: $request->error_branch_target,
            result: $request->result,
        ));

        return response()->json([
            'success' => true,
            'message' => 'Progress reported',
        ]);
    }

    /**
     * Process node images - extract base64 element icons and save to storage
     * Returns node data with image URLs instead of base64
     */
    private function processNodeImages(array $nodeData, int $flowId): array
    {
        if (!isset($nodeData['data']) || !is_array($nodeData['data'])) {
            return $nodeData;
        }

        $data = $nodeData['data'];

        // Check for 'image' field containing base64 data
        if (isset($data['image']) && is_string($data['image'])) {
            $base64 = $data['image'];

            // Check if it's already a URL (not base64)
            if (str_starts_with($base64, 'http://') || str_starts_with($base64, 'https://') || str_starts_with($base64, '/storage/')) {
                return $nodeData;
            }

            // Remove data URL prefix if present (data:image/png;base64,...)
            if (str_contains($base64, ',')) {
                $base64 = explode(',', $base64)[1];
            }

            // Validate it's base64 and reasonable size
            if (strlen($base64) > 100 && strlen($base64) < 500000) { // max ~375KB image
                try {
                    $imageData = base64_decode($base64, true);
                    if ($imageData !== false) {
                        // Generate unique filename
                        $nodeId = str_replace([':', '.', '/'], '_', $nodeData['id'] ?? uniqid());
                        $filename = "element_{$nodeId}.png";
                        $directory = "public/workflows/{$flowId}/element_icons";
                        $path = "{$directory}/{$filename}";

                        // Create directory and save
                        Storage::makeDirectory($directory);
                        Storage::put($path, $imageData);

                        // Replace base64 with URL
                        $nodeData['data']['image'] = Storage::url("workflows/{$flowId}/element_icons/{$filename}");
                        $nodeData['data']['iconUrl'] = $nodeData['data']['image'];

                        Log::info("Saved element icon for workflow {$flowId}: {$filename}");
                    }
                } catch (\Exception $e) {
                    Log::warning("Failed to process element icon: " . $e->getMessage());
                }
            }
        }

        return $nodeData;
    }
}
