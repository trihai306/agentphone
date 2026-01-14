<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreFlowRequest;
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
            'device_id' => 'required|integer|exists:devices,id',
        ]);

        $user = Auth::user();

        // Get device and verify ownership
        $device = $user->devices()->find($request->device_id);
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

        // Get flow nodes and convert to actions
        $nodes = $flow->nodes()
            ->whereNotIn('type', ['start', 'end', 'dataSource', 'condition', 'loop'])
            ->orderBy('id')
            ->get();

        $actions = $nodes->map(function ($node, $index) {
            $nodeData = $node->data ?? [];
            $actionType = $this->mapNodeTypeToAction($node->type);

            // Extract and map params based on action type
            $params = $this->extractActionParams($actionType, $nodeData);

            // Smart default wait times based on action type
            $defaultWait = match ($actionType) {
                'start_app' => 4000,  // Heavy apps need more time to load
                'scroll' => 1000,     // Wait for scroll animation
                'text_input' => 1000, // Wait for keyboard/input
                'swipe' => 800,       // Wait for swipe animation
                default => 500,       // Default for tap/click
            };

            return [
                'id' => $node->node_id,
                'type' => $actionType,
                'sequence' => $index + 1,
                'params' => $params,
                // Priority: timeout (from UI panel) -> wait_after -> delayAfter -> default
                'wait_after' => $nodeData['timeout'] ?? $nodeData['wait_after'] ?? $nodeData['delayAfter'] ?? $defaultWait,
            ];
        })->values()->toArray();

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
        ];

        // Broadcast workflow:test event to device
        broadcast(new \App\Events\DispatchJobToDevice($device, $payload, 'workflow:test'))->toOthers();

        \Log::info("Test run sent to device {$device->device_id}", [
            'flow_id' => $flow->id,
            'actions_count' => count($actions),
        ]);

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
     * Map flow node type to APK action type
     */
    protected function mapNodeTypeToAction(string $nodeType): string
    {
        $mapping = [
            'tap' => 'tap',
            'click' => 'tap',
            'doubleTap' => 'double_tap',
            'double_tap' => 'double_tap',
            'longPress' => 'long_press',
            'long_press' => 'long_press',
            'swipe' => 'swipe',
            'scroll' => 'scroll',
            'scroll_up' => 'scroll',
            'scroll_down' => 'scroll',
            'scroll_left' => 'scroll',
            'scroll_right' => 'scroll',
            'input' => 'text_input',
            'textInput' => 'text_input',
            'text_input' => 'text_input',
            'pressKey' => 'press_key',
            'press_key' => 'press_key',
            'back' => 'press_key',
            'home' => 'press_key',
            'startApp' => 'start_app',
            'openApp' => 'start_app',
            'open_app' => 'start_app',  // Recorded from APK
            'start_app' => 'start_app',
            'wait' => 'wait',
            'delay' => 'wait',
            'screenshot' => 'screenshot',
        ];

        return $mapping[$nodeType] ?? 'custom';
    }

    /**
     * Extract and normalize action params from node data
     * Maps ReactFlow node data structure to APK-expected params format
     * Uses Accessibility attributes for element finding, with coordinates as fallback
     */
    protected function extractActionParams(string $actionType, array $nodeData): array
    {
        // Common accessibility attributes that APK uses to find elements
        $commonAttrs = [
            'resourceId' => $nodeData['resourceId'] ?? null,
            'text' => $nodeData['text'] ?? null,
            'contentDescription' => $nodeData['contentDescription'] ?? null,
            'className' => $nodeData['className'] ?? null,
            'bounds' => $nodeData['bounds'] ?? null,
            'packageName' => $nodeData['packageName'] ?? null,
        ];

        // Coordinates as fallback
        $coords = $nodeData['coordinates'] ?? [];
        $x = $coords['x'] ?? $nodeData['x'] ?? null;
        $y = $coords['y'] ?? $nodeData['y'] ?? null;

        switch ($actionType) {
            case 'tap':
            case 'double_tap':
            case 'long_press':
                // APK requires x, y as non-null integers - use center of bounds or default
                $tapX = $x;
                $tapY = $y;
                if (($tapX === null || $tapY === null) && isset($nodeData['bounds'])) {
                    // Parse bounds "left,top,right,bottom" → center point
                    $b = explode(',', $nodeData['bounds']);
                    if (count($b) === 4) {
                        $tapX = (int) (((int) $b[0] + (int) $b[2]) / 2);
                        $tapY = (int) (((int) $b[1] + (int) $b[3]) / 2);
                    }
                }
                return array_merge($commonAttrs, [
                    'x' => $tapX ?? 540,
                    'y' => $tapY ?? 960,
                    'duration' => $nodeData['duration'] ?? 100,
                    'eventType' => $nodeData['eventType'] ?? 'tap',
                ]);

            case 'swipe':
                return array_merge($commonAttrs, [
                    'startX' => $nodeData['startX'] ?? $x,
                    'startY' => $nodeData['startY'] ?? $y,
                    'endX' => $nodeData['endX'] ?? null,
                    'endY' => $nodeData['endY'] ?? null,
                    'duration' => $nodeData['duration'] ?? 300,
                    'direction' => $nodeData['direction'] ?? null,
                ]);

            case 'scroll':
                // Parse direction from multiple sources:
                // 1. Direct nodeData.direction (from config panel)
                // 2. actionData.direction (from APK recording)
                // 3. eventType (scroll_up, scroll_down, etc.)
                // 4. nodeType itself (scroll_up, scroll_down, etc.)
                $actionData = $nodeData['actionData'] ?? [];
                $direction = $nodeData['direction']
                    ?? $actionData['direction']
                    ?? null;

                if (!$direction && isset($nodeData['eventType'])) {
                    if (str_contains($nodeData['eventType'], 'up'))
                        $direction = 'up';
                    elseif (str_contains($nodeData['eventType'], 'down'))
                        $direction = 'down';
                    elseif (str_contains($nodeData['eventType'], 'left'))
                        $direction = 'left';
                    elseif (str_contains($nodeData['eventType'], 'right'))
                        $direction = 'right';
                }

                // Also check the original node type for direction (e.g., scroll_up)
                $originalType = $nodeData['eventType'] ?? $nodeData['type'] ?? '';
                if (!$direction && str_contains($originalType, 'scroll_')) {
                    if (str_contains($originalType, 'up'))
                        $direction = 'up';
                    elseif (str_contains($originalType, 'down'))
                        $direction = 'down';
                    elseif (str_contains($originalType, 'left'))
                        $direction = 'left';
                    elseif (str_contains($originalType, 'right'))
                        $direction = 'right';
                }

                return array_merge($commonAttrs, [
                    'direction' => $direction ?? 'down',
                    'amount' => $nodeData['amount'] ?? $actionData['amount'] ?? 1,
                    'distance' => $nodeData['distance'] ?? 500,
                    'x' => $x ?? 540,
                    'y' => $y ?? 1000,
                ]);

            case 'text_input':
                return array_merge($commonAttrs, [
                    'inputText' => $nodeData['text'] ?? $nodeData['value'] ?? $nodeData['inputText'] ?? '',
                    'clearFirst' => $nodeData['clearFirst'] ?? false,
                ]);

            case 'press_key':
                return [
                    'key' => $nodeData['key'] ?? $nodeData['keyCode'] ?? 'KEYCODE_BACK',
                ];

            case 'start_app':
                return [
                    'package_name' => $nodeData['packageName'] ?? $nodeData['package'] ?? '',  // APK expects 'package_name'
                    'activity' => $nodeData['activity'] ?? null,
                ];

            case 'wait':
                return [
                    'duration' => $nodeData['duration'] ?? $nodeData['delay'] ?? 1000,
                ];

            case 'screenshot':
                return [
                    'filename' => $nodeData['filename'] ?? null,
                ];

            default:
                // Return all node data for custom/unknown types
                return $nodeData;
        }
    }
}
