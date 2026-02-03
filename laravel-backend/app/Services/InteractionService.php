<?php

namespace App\Services;

use App\Models\InteractionHistory;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * InteractionService - Manages user interaction history and sessions
 * 
 * Responsibilities:
 * - Store single and batch interactions
 * - Query interactions with filters
 * - Session management and statistics
 */
class InteractionService
{
    // ============================================
    // INTERACTION STORAGE
    // ============================================

    /**
     * Store a single interaction
     */
    public function store(array $data, ?User $user = null): InteractionHistory
    {
        if ($user) {
            $data['user_id'] = $user->id;
        }

        return InteractionHistory::createFromSyncData($data);
    }

    /**
     * Store multiple interactions in batch
     * 
     * @return array ['saved_ids' => [], 'errors' => []]
     */
    public function syncBatch(array $interactions, ?User $user = null): array
    {
        $savedIds = [];
        $errors = [];

        DB::beginTransaction();

        try {
            foreach ($interactions as $index => $data) {
                try {
                    if ($user) {
                        $data['user_id'] = $user->id;
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
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return [
            'saved_ids' => $savedIds,
            'errors' => $errors,
        ];
    }

    // ============================================
    // INTERACTION QUERIES
    // ============================================

    /**
     * Get interactions with filters
     */
    public function list(array $filters = [], ?User $user = null): Collection
    {
        $query = InteractionHistory::query();

        // Apply filters
        if (!empty($filters['device_serial'])) {
            $query->forDevice($filters['device_serial']);
        }

        if (!empty($filters['package_name'])) {
            $query->forPackage($filters['package_name']);
        }

        if (!empty($filters['session_id'])) {
            $query->forSession($filters['session_id']);
        }

        if (!empty($filters['action_type'])) {
            $query->ofActionType($filters['action_type']);
        }

        if (!empty($filters['user_id'])) {
            $query->forUser((int) $filters['user_id']);
        } elseif ($user) {
            $query->forUser($user->id);
        }

        if (!empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->where('created_at', '<=', $filters['end_date']);
        }

        // Pagination
        $limit = min((int) ($filters['limit'] ?? 100), 500);
        $offset = (int) ($filters['offset'] ?? 0);

        return $query
            ->orderByDesc('created_at')
            ->offset($offset)
            ->limit($limit)
            ->get()
            ->map(fn($i) => $this->formatInteraction($i));
    }

    /**
     * Get a single interaction formatted
     */
    public function find(InteractionHistory $interaction): array
    {
        return $this->formatInteraction($interaction, true);
    }

    /**
     * Delete an interaction
     * 
     * @throws \Exception if unauthorized
     */
    public function delete(InteractionHistory $interaction, ?User $user = null): void
    {
        if ($user && $interaction->user_id !== $user->id) {
            throw new \Exception('Unauthorized');
        }

        $interaction->delete();
    }

    // ============================================
    // STATISTICS & SESSIONS
    // ============================================

    /**
     * Get interaction statistics
     */
    public function getStatistics(?string $deviceSerial = null, ?string $packageName = null): array
    {
        return InteractionHistory::getStatistics($deviceSerial, $packageName);
    }

    /**
     * Get recent sessions
     */
    public function getSessions(array $filters = [], ?User $user = null): Collection
    {
        $limit = min((int) ($filters['limit'] ?? 20), 50);

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

        if (!empty($filters['device_serial'])) {
            $query->where('device_serial', $filters['device_serial']);
        }

        if ($user) {
            $query->where('user_id', $user->id);
        }

        return $query->get()->map(fn($session) => [
            'session_id' => $session->session_id,
            'device_serial' => $session->device_serial,
            'package_name' => $session->package_name,
            'interaction_count' => $session->interaction_count,
            'started_at' => $session->started_at,
            'ended_at' => $session->ended_at,
        ]);
    }

    /**
     * Create a new session ID
     */
    public function createSession(): string
    {
        return (string) Str::uuid();
    }

    // ============================================
    // PRIVATE HELPERS
    // ============================================

    /**
     * Format interaction for API response
     */
    private function formatInteraction(InteractionHistory $interaction, bool $includeUpdatedAt = false): array
    {
        $data = [
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

        if ($includeUpdatedAt) {
            $data['updated_at'] = $interaction->updated_at->toIso8601String();
        }

        return $data;
    }
}
