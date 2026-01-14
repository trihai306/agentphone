<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SocketAuthController extends Controller
{
    /**
     * Authorize presence channel subscription
     * 
     * Pusher/Soketi sends this when client subscribes to presence channel
     */
    public function auth(Request $request)
    {
        $socketId = $request->input('socket_id');
        $channelName = $request->input('channel_name');

        Log::info('Socket auth request', [
            'socket_id' => $socketId,
            'channel_name' => $channelName,
        ]);

        // Get authenticated user
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Handle private-device.{device_id} channels
        if (str_starts_with($channelName, 'private-device.')) {
            $deviceId = str_replace('private-device.', '', $channelName);

            // Verify user owns this device
            $device = $user->devices()->where('device_id', $deviceId)->first();
            if (!$device) {
                Log::warning('Private channel auth denied - device not owned', [
                    'device_id' => $deviceId,
                    'user_id' => $user->id,
                ]);
                return response()->json(['error' => 'Device not found'], 403);
            }

            // Generate simple auth signature for private channel (no channel_data)
            $auth = $this->generatePrivateAuthSignature($socketId, $channelName);

            Log::info('Private channel auth granted', [
                'channel' => $channelName,
                'device_id' => $deviceId,
            ]);

            return response()->json([
                'auth' => $auth,
            ]);
        }

        // Handle presence-devices.{user_id} channels
        if (!str_starts_with($channelName, 'presence-devices.')) {
            return response()->json(['error' => 'Invalid channel'], 403);
        }

        // Extract user_id from channel name
        $channelUserId = str_replace('presence-devices.', '', $channelName);

        // Ensure user can only join their own channel
        if ($channelUserId != $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        // Get device info from request (sent by APK)
        // Note: Pusher HttpChannelAuthorizer cannot send custom body params,
        // so we auto-detect device from user's devices list
        $deviceId = $request->input('device_id');
        $deviceDbId = $request->input('device_db_id');
        $deviceName = $request->input('device_name', 'Unknown Device');

        // If device_db_id provided, look up device
        if ($deviceDbId) {
            $device = Device::where('id', $deviceDbId)
                ->where('user_id', $user->id)
                ->first();
        } elseif ($deviceId) {
            $device = Device::where('device_id', $deviceId)
                ->where('user_id', $user->id)
                ->first();
        } else {
            // Auto-detect: Get user's most recently active device
            // This handles APK connections where device_id cannot be passed
            $device = Device::where('user_id', $user->id)
                ->orderBy('last_active_at', 'desc')
                ->first();

            if ($device) {
                $deviceId = $device->device_id;
                $deviceDbId = $device->id;
                $deviceName = $device->name;

                // Auto-update device status since it's connecting now
                $device->update([
                    'status' => Device::STATUS_ACTIVE,
                    'last_active_at' => now(),
                    'socket_connected' => true,
                ]);

                Log::info('Auto-detected device for presence auth', [
                    'device_id' => $device->device_id,
                    'device_name' => $device->name,
                    'user_id' => $user->id,
                ]);
            }
        }

        // Build user_info for presence channel
        $userInfo = [
            'device_id' => $deviceId ?? ($device?->device_id ?? 'unknown'),
            'device_db_id' => $deviceDbId ?? $device?->id,
            'device_name' => $device?->name ?? $deviceName,
            'user_id' => $user->id,
        ];

        // Generate auth signature
        $auth = $this->generateAuthSignature($socketId, $channelName, $userInfo);

        Log::info('Socket auth granted', [
            'channel' => $channelName,
            'device' => $userInfo,
        ]);

        return response()->json([
            'auth' => $auth,
            'channel_data' => json_encode([
                'user_id' => (string) $user->id,
                'user_info' => $userInfo,
            ]),
        ]);
    }

    /**
     * Generate Pusher-compatible auth signature
     */
    private function generateAuthSignature(string $socketId, string $channelName, array $userInfo): string
    {
        $appKey = config('broadcasting.connections.pusher.key');
        $appSecret = config('broadcasting.connections.pusher.secret');

        $channelData = json_encode([
            'user_id' => (string) $userInfo['user_id'],
            'user_info' => $userInfo,
        ]);

        $stringToSign = "{$socketId}:{$channelName}:{$channelData}";
        $signature = hash_hmac('sha256', $stringToSign, $appSecret);

        return "{$appKey}:{$signature}";
    }

    /**
     * Generate Pusher-compatible auth signature for private channels (no channel_data)
     */
    private function generatePrivateAuthSignature(string $socketId, string $channelName): string
    {
        $appKey = config('broadcasting.connections.pusher.key');
        $appSecret = config('broadcasting.connections.pusher.secret');

        // Private channels only need socket_id:channel_name
        $stringToSign = "{$socketId}:{$channelName}";
        $signature = hash_hmac('sha256', $stringToSign, $appSecret);

        return "{$appKey}:{$signature}";
    }
}
