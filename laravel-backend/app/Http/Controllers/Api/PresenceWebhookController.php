<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Services\DevicePresenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PresenceWebhookController extends Controller
{
    public function __construct(
        private DevicePresenceService $presenceService
    ) {
    }

    /**
     * Handle Pusher/Soketi webhook for presence events
     * 
     * Events: member_added, member_removed, channel_occupied, channel_vacated
     * 
     * OPTIMIZED: Uses Redis instead of DB writes for each event.
     * DB sync happens every minute via scheduler.
     */
    public function handle(Request $request)
    {
        $events = $request->input('events', []);

        Log::debug('Presence webhook received:', ['count' => count($events)]);

        foreach ($events as $event) {
            $eventName = $event['name'] ?? null;
            $channel = $event['channel'] ?? null;

            // Only process presence-devices channels
            if (!str_starts_with($channel, 'presence-devices.')) {
                continue;
            }

            // Extract user ID from channel name
            $userId = (int) str_replace('presence-devices.', '', $channel);

            switch ($eventName) {
                case 'member_added':
                    $this->handleMemberAdded($event, $userId);
                    break;

                case 'member_removed':
                    $this->handleMemberRemoved($event, $userId);
                    break;

                case 'channel_vacated':
                    // All members left - mark all devices offline for this user
                    $this->handleChannelVacated($userId);
                    break;
            }
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Device connected - mark as online in Redis
     * 
     * No DB write here - synced every minute by scheduler
     */
    private function handleMemberAdded(array $event, int $userId): void
    {
        $userInfo = $event['user_info'] ?? [];
        $deviceId = $userInfo['device_id'] ?? null;
        $deviceDbId = $userInfo['device_db_id'] ?? null;

        if (!$deviceId) {
            // Try to find device by DB ID if device_id not provided
            if ($deviceDbId) {
                $device = Device::find($deviceDbId);
                $deviceId = $device?->device_id;
            }

            if (!$deviceId) {
                Log::warning("Presence webhook: No device_id in member_added", $userInfo);
                return;
            }
        }

        // Mark online in Redis (O(1) operation, no DB write)
        $this->presenceService->markOnline($userId, $deviceId, $deviceDbId);

        Log::info("Device online via Redis: {$deviceId}");

        // NOTE: We don't broadcast here anymore to reduce socket traffic
        // Frontend will poll /devices/online-status every 45s
    }

    /**
     * Device disconnected - mark as offline in Redis
     */
    private function handleMemberRemoved(array $event, int $userId): void
    {
        $userInfo = $event['user_info'] ?? [];
        $deviceId = $userInfo['device_id'] ?? null;
        $deviceDbId = $userInfo['device_db_id'] ?? null;

        if (!$deviceId && $deviceDbId) {
            $device = Device::find($deviceDbId);
            $deviceId = $device?->device_id;
        }

        if (!$deviceId) {
            Log::warning("Presence webhook: No device_id in member_removed", $userInfo);
            return;
        }

        // Mark offline in Redis
        $this->presenceService->markOffline($userId, $deviceId);

        Log::info("Device offline via Redis: {$deviceId}");
    }

    /**
     * All members left channel - mark all devices offline in Redis
     */
    private function handleChannelVacated(int $userId): void
    {
        $this->presenceService->markAllOffline($userId);

        Log::info("All devices offline for user: {$userId}");
    }
}

