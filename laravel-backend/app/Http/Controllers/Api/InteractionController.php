<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InteractionHistory;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class InteractionController extends Controller
{
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
            $data = $request->all();

            // Associate with authenticated user if available
            if ($request->user()) {
                $data['user_id'] = $request->user()->id;
            }

            $interaction = InteractionHistory::createFromSyncData($data);

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
            $interactions = $request->input('interactions', []);
            $savedIds = [];
            $errors = [];

            DB::beginTransaction();

            foreach ($interactions as $index => $data) {
                try {
                    // Associate with authenticated user if available
                    if ($request->user()) {
                        $data['user_id'] = $request->user()->id;
                    }

                    $interaction = InteractionHistory::createFromSyncData($data);
                    $savedIds[] = $interaction->id;
                } catch (\Exception $e) {
                    $errors[] = [
                        'index' => $index,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Sync completed',
                'saved_count' => count($savedIds),
                'interaction_ids' => $savedIds,
                'errors' => $errors,
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();

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
            $query = InteractionHistory::query();

            // Apply filters
            if ($request->has('device_serial')) {
                $query->forDevice($request->input('device_serial'));
            }

            if ($request->has('package_name')) {
                $query->forPackage($request->input('package_name'));
            }

            if ($request->has('session_id')) {
                $query->forSession($request->input('session_id'));
            }

            if ($request->has('action_type')) {
                $query->ofActionType($request->input('action_type'));
            }

            if ($request->has('user_id')) {
                $query->forUser((int) $request->input('user_id'));
            } elseif ($request->user()) {
                // Default to current user's interactions
                $query->forUser($request->user()->id);
            }

            if ($request->has('start_date')) {
                $query->where('created_at', '>=', $request->input('start_date'));
            }

            if ($request->has('end_date')) {
                $query->where('created_at', '<=', $request->input('end_date'));
            }

            // Pagination
            $limit = min((int) $request->input('limit', 100), 500);
            $offset = (int) $request->input('offset', 0);

            $interactions = $query
                ->orderByDesc('created_at')
                ->offset($offset)
                ->limit($limit)
                ->get()
                ->map(function ($interaction) {
                    return [
                        'id' => $interaction->id,
                        'user_id' => $interaction->user_id,
                        'device_serial' => $interaction->device_serial,
                        'session_id' => $interaction->session_id,
                        'package_name' => $interaction->package_name,
                        'activity_name' => $interaction->activity_name,
                        'node' => $interaction->node,
                        'action_type' => $interaction->action_type,
                        'tap_x' => $interaction->tap_x,
                        'tap_y' => $interaction->tap_y,
                        'screenshot_path' => $interaction->screenshot_path,
                        'metadata' => $interaction->metadata,
                        'created_at' => $interaction->created_at->toIso8601String(),
                    ];
                });

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
            'interaction' => [
                'id' => $interaction->id,
                'user_id' => $interaction->user_id,
                'device_serial' => $interaction->device_serial,
                'session_id' => $interaction->session_id,
                'package_name' => $interaction->package_name,
                'activity_name' => $interaction->activity_name,
                'node' => $interaction->node,
                'action_type' => $interaction->action_type,
                'tap_x' => $interaction->tap_x,
                'tap_y' => $interaction->tap_y,
                'screenshot_path' => $interaction->screenshot_path,
                'metadata' => $interaction->metadata,
                'created_at' => $interaction->created_at->toIso8601String(),
                'updated_at' => $interaction->updated_at->toIso8601String(),
            ],
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
            // Check ownership if user is authenticated
            if ($request->user() && $interaction->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            $interaction->delete();

            return response()->json([
                'success' => true,
                'message' => 'Interaction deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete interaction: ' . $e->getMessage(),
            ], 500);
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
            $deviceSerial = $request->input('device_serial');
            $packageName = $request->input('package_name');

            $stats = InteractionHistory::getStatistics($deviceSerial, $packageName);

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
            $limit = min((int) $request->input('limit', 20), 50);

            $query = InteractionHistory::query()
                ->whereNotNull('session_id')
                ->selectRaw('
                    session_id,
                    device_serial,
                    package_name,
                    COUNT(*) as interaction_count,
                    MIN(created_at) as started_at,
                    MAX(created_at) as ended_at
                ')
                ->groupBy('session_id', 'device_serial', 'package_name')
                ->orderByDesc(DB::raw('MAX(created_at)'))
                ->limit($limit);

            if ($request->has('device_serial')) {
                $query->where('device_serial', $request->input('device_serial'));
            }

            if ($request->user()) {
                $query->where('user_id', $request->user()->id);
            }

            $sessions = $query->get()->map(function ($session) {
                return [
                    'session_id' => $session->session_id,
                    'device_serial' => $session->device_serial,
                    'package_name' => $session->package_name,
                    'interaction_count' => $session->interaction_count,
                    'started_at' => $session->started_at,
                    'ended_at' => $session->ended_at,
                ];
            });

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
            'session_id' => (string) Str::uuid(),
        ], 201);
    }
}
