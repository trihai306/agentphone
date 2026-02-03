<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RecordingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RecordingController extends Controller
{
    public function __construct(
        private RecordingService $service
    ) {
    }

    /**
     * Start a new recording session
     * Called by Android APK when user starts recording
     */
    public function start(Request $request): JsonResponse
    {
        $request->validate([
            'device_id' => 'required|string',
            'target_app' => 'nullable|string',
            'flow_id' => 'nullable|exists:flows,id',
            'screenshot_enabled' => 'nullable|boolean',
        ]);

        try {
            $result = $this->service->startSession(
                Auth::user(),
                $request->device_id,
                $request->target_app,
                $request->flow_id,
                $request->screenshot_enabled ?? true
            );

            return response()->json([
                'success' => true,
                'session_id' => $result['session_id'],
                'message' => $result['message'],
            ]);
        } catch (\Exception $e) {
            $statusCode = str_contains($e->getMessage(), 'not found') ? 404 : 500;
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * Receive a single recording event
     * Called by Android APK for each captured event
     */
    public function event(Request $request): JsonResponse
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
            'thumbnail' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        try {
            $eventCount = $this->service->addEvent(
                Auth::user(),
                $request->session_id,
                $request->all()
            );

            return response()->json([
                'success' => true,
                'event_count' => $eventCount,
            ]);
        } catch (\Exception $e) {
            $statusCode = str_contains($e->getMessage(), 'not found') ? 404 : 500;
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * Stop recording session
     * Called by Android APK when user stops recording
     */
    public function stop(Request $request): JsonResponse
    {
        $request->validate([
            'session_id' => 'required|string',
            'duration' => 'nullable|integer',
        ]);

        try {
            $session = $this->service->stopSession(
                Auth::user(),
                $request->session_id,
                $request->duration
            );

            return response()->json([
                'success' => true,
                'session' => $session,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Get recording session details
     */
    public function show(string $sessionId): JsonResponse
    {
        try {
            $session = $this->service->getSession(Auth::user(), $sessionId);

            return response()->json([
                'success' => true,
                'session' => $session,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Convert recording actions to workflow nodes
     */
    public function convertToNodes(Request $request): JsonResponse
    {
        $request->validate([
            'session_id' => 'required|string',
            'group_similar' => 'nullable|boolean',
        ]);

        try {
            $result = $this->service->convertToNodes(Auth::user(), $request->session_id);

            return response()->json([
                'success' => true,
                'nodes' => $result['nodes'],
                'edges' => $result['edges'],
                'session_id' => $result['session_id'],
                'source_event_count' => $result['source_event_count'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * List user's recording sessions
     */
    public function index(Request $request): JsonResponse
    {
        $sessions = $this->service->listSessions(Auth::user());

        return response()->json([
            'success' => true,
            'sessions' => $sessions,
        ]);
    }
}
