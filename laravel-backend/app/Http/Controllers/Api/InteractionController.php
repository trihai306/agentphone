<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InteractionHistory;
use App\Services\InteractionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class InteractionController extends Controller
{
    public function __construct(
        private InteractionService $service
    ) {
    }

    /**
     * Save a single interaction from portal-apk or controller
     *
     * POST /api/interactions
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'device_serial' => 'required|string|max:100',
            'session_id' => 'nullable|uuid',
            'package_name' => 'nullable|string|max:255',
            'activity_name' => 'nullable|string|max:255',
            'node' => 'nullable|array',
            'node.class' => 'nullable|string|max:255',
            'node.text' => 'nullable|string',
            'node.content_desc' => 'nullable|string',
            'node.resource_id' => 'nullable|string|max:255',
            'node.bounds' => 'nullable|array',
            'node.xpath' => 'nullable|string',
            'action_type' => 'nullable|string|max:50',
            'tap_x' => 'nullable|integer',
            'tap_y' => 'nullable|integer',
            'screenshot_path' => 'nullable|string|max:500',
            'metadata' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $interaction = $this->service->store($request->all(), $request->user());

            return response()->json([
                'success' => true,
                'message' => 'Interaction saved successfully',
                'interaction_id' => $interaction->id,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save interaction: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Save multiple interactions in batch (for sync from controller)
     *
     * POST /api/interactions/sync
     */
    public function sync(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'interactions' => 'required|array|min:1|max:500',
            'interactions.*.device_serial' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $result = $this->service->syncBatch(
                $request->input('interactions', []),
                $request->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Sync completed',
                'saved_count' => count($result['saved_ids']),
                'interaction_ids' => $result['saved_ids'],
                'errors' => $result['errors'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Sync failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get interactions with filters
     *
     * GET /api/interactions
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only([
                'device_serial',
                'package_name',
                'session_id',
                'action_type',
                'user_id',
                'start_date',
                'end_date',
                'limit',
                'offset'
            ]);

            $interactions = $this->service->list($filters, $request->user());

            return response()->json([
                'success' => true,
                'interactions' => $interactions,
                'count' => $interactions->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve interactions: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a single interaction
     *
     * GET /api/interactions/{id}
     */
    public function show(InteractionHistory $interaction): JsonResponse
    {
        return response()->json([
            'success' => true,
            'interaction' => $this->service->find($interaction),
        ]);
    }

    /**
     * Delete an interaction
     *
     * DELETE /api/interactions/{id}
     */
    public function destroy(Request $request, InteractionHistory $interaction): JsonResponse
    {
        try {
            $this->service->delete($interaction, $request->user());

            return response()->json([
                'success' => true,
                'message' => 'Interaction deleted successfully',
            ]);
        } catch (\Exception $e) {
            $statusCode = str_contains($e->getMessage(), 'Unauthorized') ? 403 : 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * Get interaction statistics
     *
     * GET /api/interactions/stats
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            $stats = $this->service->getStatistics(
                $request->input('device_serial'),
                $request->input('package_name')
            );

            return response()->json([
                'success' => true,
                'statistics' => $stats,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get statistics: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get recent sessions
     *
     * GET /api/interactions/sessions
     */
    public function sessions(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['device_serial', 'limit']);
            $sessions = $this->service->getSessions($filters, $request->user());

            return response()->json([
                'success' => true,
                'sessions' => $sessions,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get sessions: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a new session ID
     *
     * POST /api/interactions/session/new
     */
    public function createSession(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'session_id' => $this->service->createSession(),
        ], 201);
    }
}
