<?php

namespace App\Services;

use App\Events\RecordingEventBroadcast;
use App\Events\RecordingSessionStarted;
use App\Events\RecordingSessionStopped;
use App\Models\Device;
use App\Models\RecordingSession;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * RecordingService - Manages recording sessions from Android APK
 * 
 * Responsibilities:
 * - Session lifecycle (start, stop, get)
 * - Event storage and broadcasting
 * - Workflow node conversion
 */
class RecordingService
{
    // ============================================
    // SESSION LIFECYCLE
    // ============================================

    /**
     * Start a new recording session
     * 
     * @throws \Exception if device not found
     */
    public function startSession(
        User $user,
        string $deviceId,
        ?string $targetApp = null,
        ?int $flowId = null,
        bool $screenshotEnabled = true
    ): array {
        $device = Device::where('device_id', $deviceId)
            ->where('user_id', $user->id)
            ->first();

        if (!$device) {
            throw new \Exception('Device not found or not authorized');
        }

        $sessionId = 'rec_' . Str::uuid()->toString();

        $session = RecordingSession::create([
            'user_id' => $user->id,
            'device_id' => $device->id,
            'flow_id' => $flowId,
            'session_id' => $sessionId,
            'status' => 'recording',
            'started_at' => now(),
            'target_app' => $targetApp,
            'event_count' => 0,
            'actions' => [],
            'metadata' => [
                'screenshot_enabled' => $screenshotEnabled,
                'device_name' => $device->name,
                'device_model' => $device->model,
            ],
        ]);

        Log::info('Recording session started', [
            'session_id' => $sessionId,
            'user_id' => $user->id,
            'device_id' => $device->id,
        ]);

        broadcast(new RecordingSessionStarted($session))->toOthers();

        return [
            'session_id' => $sessionId,
            'message' => 'Recording session started',
        ];
    }

    /**
     * Add event to recording session
     * 
     * @throws \Exception if session not found
     */
    public function addEvent(User $user, string $sessionId, array $eventData): int
    {
        $session = RecordingSession::where('session_id', $sessionId)
            ->where('user_id', $user->id)
            ->where('status', 'recording')
            ->first();

        if (!$session) {
            throw new \Exception('Recording session not found or not active');
        }

        $formattedEvent = [
            'event_type' => $eventData['event_type'],
            'timestamp' => $eventData['timestamp'],
            'sequence_number' => $eventData['sequence_number'],
            'package_name' => $eventData['package_name'] ?? null,
            'coordinates' => [
                'x' => $eventData['x'] ?? null,
                'y' => $eventData['y'] ?? null,
            ],
            'element' => [
                'id' => $eventData['element_id'] ?? null,
                'class' => $eventData['element_class'] ?? null,
                'text' => $eventData['element_text'] ?? null,
            ],
            'text' => $eventData['text'] ?? null,
            'thumbnail' => $eventData['thumbnail'] ?? null,
            'metadata' => $eventData['metadata'] ?? [],
        ];

        $actions = $session->actions ?? [];
        $actions[] = $formattedEvent;

        $session->update([
            'actions' => $actions,
            'event_count' => count($actions),
        ]);

        Log::debug('Recording event received', [
            'session_id' => $sessionId,
            'event_type' => $eventData['event_type'],
            'sequence' => $eventData['sequence_number'],
        ]);

        broadcast(new RecordingEventBroadcast($session, $formattedEvent))->toOthers();

        return count($actions);
    }

    /**
     * Stop recording session
     * 
     * @throws \Exception if session not found
     */
    public function stopSession(User $user, string $sessionId, ?int $duration = null): array
    {
        $session = RecordingSession::where('session_id', $sessionId)
            ->where('user_id', $user->id)
            ->first();

        if (!$session) {
            throw new \Exception('Recording session not found');
        }

        $calculatedDuration = $duration ?? now()->diffInMilliseconds($session->started_at);

        $session->update([
            'status' => 'completed',
            'stopped_at' => now(),
            'duration' => $calculatedDuration,
        ]);

        Log::info('Recording session stopped', [
            'session_id' => $sessionId,
            'event_count' => $session->event_count,
            'duration' => $calculatedDuration,
        ]);

        broadcast(new RecordingSessionStopped($session))->toOthers();

        return [
            'id' => $session->id,
            'session_id' => $session->session_id,
            'event_count' => $session->event_count,
            'duration' => $calculatedDuration,
        ];
    }

    /**
     * Get session by ID
     * 
     * @throws \Exception if not found
     */
    public function getSession(User $user, string $sessionId): RecordingSession
    {
        $session = RecordingSession::where('session_id', $sessionId)
            ->where('user_id', $user->id)
            ->first();

        if (!$session) {
            throw new \Exception('Recording session not found');
        }

        return $session;
    }

    /**
     * List user's recording sessions
     */
    public function listSessions(User $user, int $perPage = 20): LengthAwarePaginator
    {
        return RecordingSession::where('user_id', $user->id)
            ->with('device:id,name,model')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    // ============================================
    // WORKFLOW CONVERSION
    // ============================================

    /**
     * Convert recording actions to workflow nodes
     */
    public function convertToNodes(User $user, string $sessionId): array
    {
        $session = $this->getSession($user, $sessionId);
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

        return [
            'nodes' => $nodes,
            'edges' => $edges,
            'session_id' => $session->session_id,
            'source_event_count' => count($actions),
        ];
    }

    // ============================================
    // PRIVATE HELPERS
    // ============================================

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
}
