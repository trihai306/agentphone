<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PresenceWebhookController extends Controller
{
    /**
     * Handle Pusher/Soketi webhook for presence events
     * 
     * Events: member_added, member_removed, channel_occupied, channel_vacated
     */
    public function handle(Request $request)
    {
        $events = $request->input('events', []);

        Log::info('Presence webhook received:', ['events' => $events]);

        foreach ($events as $event) {
            $eventName = $event['name'] ?? null;
            $channel = $event['channel'] ?? null;
            $userId = $event['user_id'] ?? null;

            // Only process presence-devices channels
            if (!str_starts_with($channel, 'presence-devices.')) {
                continue;
            }

            // Extract user ID from channel name
            $channelUserId = str_replace('presence-devices.', '', $channel);

            switch ($eventName) {
                case 'member_added':
                    $this->handleMemberAdded($event, $channelUserId);
                    break;

                case 'member_removed':
                    $this->handleMemberRemoved($event, $channelUserId);
                    break;

                case 'channel_vacated':
                    // All members left - mark all devices offline for this user
                    $this->handleChannelVacated($channelUserId);
                    break;
            }
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Device connected - mark as online
     */
    private function handleMemberAdded(array $event, string $userId): void
    {
        $userInfo = $event['user_info'] ?? [];
        $deviceId = $userInfo['device_id'] ?? null;
        $deviceDbId = $userInfo['device_db_id'] ?? null;

        if ($deviceDbId) {
            $device = Device::find($deviceDbId);
        } elseif ($deviceId) {
            $device = Device::where('user_id', $userId)
                ->where('device_id', $deviceId)
                ->first();
        }

        if ($device) {
            $device->update([
                'status' => 'active',
                'last_active_at' => now(),
                'socket_connected' => true,
            ]);

            Log::info("Device online via presence: {$device->name}");

            // Broadcast device online event to frontend
            broadcast(new \App\Events\DeviceStatusChanged($device, 'online'))->toOthers();
        }
    }

    /**
     * Device disconnected - mark as offline
     */
    private function handleMemberRemoved(array $event, string $userId): void
    {
        $userInfo = $event['user_info'] ?? [];
        $deviceId = $userInfo['device_id'] ?? null;
        $deviceDbId = $userInfo['device_db_id'] ?? null;

        if ($deviceDbId) {
            $device = Device::find($deviceDbId);
        } elseif ($deviceId) {
            $device = Device::where('user_id', $userId)
                ->where('device_id', $deviceId)
                ->first();
        }

        if ($device) {
            $device->update([
                'socket_connected' => false,
                'status' => 'inactive',  // Mark as inactive immediately
            ]);

            Log::info("Device offline via presence: {$device->name}");

            // Broadcast device offline event to frontend
            broadcast(new \App\Events\DeviceStatusChanged($device, 'offline'))->toOthers();
        }
    }

    /**
     * All members left channel - mark all devices offline
     */
    private function handleChannelVacated(string $userId): void
    {
        Device::where('user_id', $userId)
            ->update([
                'socket_connected' => false,
                'status' => 'inactive',
            ]);

        Log::info("All devices offline for user: {$userId}");
    }
}
