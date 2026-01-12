<?php

namespace App\Http\Controllers\Api;

use App\Events\RecordingEventBroadcast;
use App\Events\RecordingSessionStarted;
use App\Events\RecordingSessionStopped;
use App\Models\Device;
use App\Models\RecordingSession;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class RecordingController extends Controller
{
    /**
     * Start a new recording session
     * Called by Android APK when user starts recording
     */
    public function start(Request $request)
    {
        $request->validate([
            'device_id' => 'required|string',
            'target_app' => 'nullable|string',
            'flow_id' => 'nullable|exists:flows,id',
            'screenshot_enabled' => 'nullable|boolean',
        ]);

        $user = Auth::user();

        // Find device
        $device = Device::where('device_id', $request->device_id)
            ->where('user_id', $user->id)
            ->first();

        if (!$device) {
            return response()->json([
                'success' => false,
                'error' => 'Device not found or not authorized',
            ], 404);
        }

        // Generate unique session ID
        $sessionId = 'rec_' . Str::uuid()->toString();

        // Create recording session
        $session = RecordingSession::create([
            'user_id' => $user->id,
            'device_id' => $device->id,
            'flow_id' => $request->flow_id,
            'session_id' => $sessionId,
            'status' => 'recording',
            'started_at' => now(),
            'target_app' => $request->target_app,
            'event_count' => 0,
            'actions' => [],
            'metadata' => [
                'screenshot_enabled' => $request->screenshot_enabled ?? true,
                'device_name' => $device->name,
                'device_model' => $device->model,
            ],
        ]);

        Log::info('Recording session started', [
            'session_id' => $sessionId,
            'user_id' => $user->id,
            'device_id' => $device->id,
        ]);

        // Broadcast session started event
        broadcast(new RecordingSessionStarted($session))->toOthers();

        return response()->json([
            'success' => true,
            'session_id' => $sessionId,
            'message' => 'Recording session started',
        ]);
    }

    /**
     * Receive a single recording event
     * Called by Android APK for each captured event
     */
    public function event(Request $request)
    {
        $request->validate([
            'session_id' => 'required|string',
            'event_type' => 'required|string',
            'timestamp' => 'required|integer',
            'sequence_number' => 'required|integer',
            'package_name' => 'nullable|string',
            'x' => 'nullable|numeric',
            'y' => 'nullable|numeric',
            'text' => 'nullable|string',
            'element_id' => 'nullable|string',
            'element_class' => 'nullable|string',
            'element_text' => 'nullable|string',
            'thumbnail' => 'nullable|string', // Base64 thumbnail
            'metadata' => 'nullable|array',
        ]);

        $user = Auth::user();

        // Find session
        $session = RecordingSession::where('session_id', $request->session_id)
            ->where('user_id', $user->id)
            ->where('status', 'recording')
            ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'error' => 'Recording session not found or not active',
            ], 404);
        }

        // Build event data
        $eventData = [
            'event_type' => $request->event_type,
            'timestamp' => $request->timestamp,
            'sequence_number' => $request->sequence_number,
            'package_name' => $request->package_name,
            'coordinates' => [
                'x' => $request->x,
                'y' => $request->y,
            ],
            'element' => [
                'id' => $request->element_id,
                'class' => $request->element_class,
                'text' => $request->element_text,
            ],
            'text' => $request->text,
            'thumbnail' => $request->thumbnail,
            'metadata' => $request->metadata ?? [],
        ];

        // Append to session actions
        $actions = $session->actions ?? [];
        $actions[] = $eventData;

        $session->update([
            'actions' => $actions,
            'event_count' => count($actions),
        ]);

        Log::debug('Recording event received', [
            'session_id' => $request->session_id,
            'event_type' => $request->event_type,
            'sequence' => $request->sequence_number,
        ]);

        // Broadcast event to workflow editor
        broadcast(new RecordingEventBroadcast($session, $eventData))->toOthers();

        return response()->json([
            'success' => true,
            'event_count' => count($actions),
        ]);
    }

    /**
     * Stop recording session
     * Called by Android APK when user stops recording
     */
    public function stop(Request $request)
    {
        $request->validate([
            'session_id' => 'required|string',
            'duration' => 'nullable|integer',
        ]);

        $user = Auth::user();

        $session = RecordingSession::where('session_id', $request->session_id)
            ->where('user_id', $user->id)
            ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'error' => 'Recording session not found',
            ], 404);
        }

        $session->update([
            'status' => 'completed',
            'stopped_at' => now(),
            'duration' => $request->duration ?? now()->diffInMilliseconds($session->started_at),
        ]);

        Log::info('Recording session stopped', [
            'session_id' => $request->session_id,
            'event_count' => $session->event_count,
            'duration' => $session->duration,
        ]);

        // Broadcast session stopped event
        broadcast(new RecordingSessionStopped($session))->toOthers();

        return response()->json([
            'success' => true,
            'session' => [
                'id' => $session->id,
                'session_id' => $session->session_id,
                'event_count' => $session->event_count,
                'duration' => $session->duration,
            ],
        ]);
    }

    /**
     * Get recording session details
     */
    public function show(string $sessionId)
    {
        $user = Auth::user();

        $session = RecordingSession::where('session_id', $sessionId)
            ->where('user_id', $user->id)
            ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'error' => 'Recording session not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'session' => $session,
        ]);
    }

    /**
     * Convert recording actions to workflow nodes
     */
    public function convertToNodes(Request $request)
    {
        $request->validate([
            'session_id' => 'required|string',
            'group_similar' => 'nullable|boolean',
        ]);

        $user = Auth::user();

        $session = RecordingSession::where('session_id', $request->session_id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $actions = $session->actions ?? [];
        $nodes = [];
        $baseX = 100;
        $baseY = 100;
        $spacing = 150;

        foreach ($actions as $index => $action) {
            $node = $this->actionToNode($action, $index, $baseX, $baseY + ($index * $spacing));
            if ($node) {
                $nodes[] = $node;
            }
        }

        // Generate edges to connect nodes sequentially
        $edges = [];
        for ($i = 0; $i < count($nodes) - 1; $i++) {
            $edges[] = [
                'id' => 'edge-' . $i,
                'source' => $nodes[$i]['id'],
                'target' => $nodes[$i + 1]['id'],
                'type' => 'smoothstep',
            ];
        }

        return response()->json([
            'success' => true,
            'nodes' => $nodes,
            'edges' => $edges,
            'session_id' => $session->session_id,
            'source_event_count' => count($actions),
        ]);
    }

    /**
     * Convert a single action to a workflow node
     */
    private function actionToNode(array $action, int $index, float $x, float $y): ?array
    {
        $eventType = $action['event_type'] ?? 'unknown';
        $nodeId = 'recorded-' . $index . '-' . Str::random(6);

        $nodeTypeMap = [
            'tap' => 'TapNode',
            'click' => 'TapNode',
            'long_tap' => 'LongTapNode',
            'long_click' => 'LongTapNode',
            'scroll' => 'ScrollNode',
            'swipe' => 'ScrollNode',
            'input_text' => 'InputNode',
            'text_input' => 'InputNode',
            'type' => 'InputNode',
            'back' => 'SystemNode',
            'home' => 'SystemNode',
            'gesture' => 'GestureNode',
        ];

        $nodeType = $nodeTypeMap[$eventType] ?? 'ActionNode';

        $nodeData = [
            'label' => ucfirst(str_replace('_', ' ', $eventType)) . ' #' . ($index + 1),
            'eventType' => $eventType,
            'coordinates' => $action['coordinates'] ?? null,
            'element' => $action['element'] ?? null,
            'text' => $action['text'] ?? null,
            'thumbnail' => $action['thumbnail'] ?? null,
            'sourceAction' => $action,
        ];

        // Add type-specific data
        switch ($nodeType) {
            case 'TapNode':
                $nodeData['x'] = $action['coordinates']['x'] ?? 0;
                $nodeData['y'] = $action['coordinates']['y'] ?? 0;
                break;
            case 'InputNode':
                $nodeData['inputText'] = $action['text'] ?? '';
                break;
            case 'SystemNode':
                $nodeData['action'] = $eventType;
                break;
            case 'ScrollNode':
                $nodeData['direction'] = $action['metadata']['direction'] ?? 'down';
                $nodeData['amount'] = $action['metadata']['amount'] ?? 500;
                break;
        }

        return [
            'id' => $nodeId,
            'type' => $nodeType,
            'position' => ['x' => $x, 'y' => $y],
            'data' => $nodeData,
        ];
    }

    /**
     * List user's recording sessions
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $sessions = RecordingSession::where('user_id', $user->id)
            ->with('device:id,name,model')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'sessions' => $sessions,
        ]);
    }
}
