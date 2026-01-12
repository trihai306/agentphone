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

        // Validate presence channel format: presence-devices.{user_id}
        if (!str_starts_with($channelName, 'presence-devices.')) {
            return response()->json(['error' => 'Invalid channel'], 403);
        }

        // Get authenticated user
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Extract user_id from channel name
        $channelUserId = str_replace('presence-devices.', '', $channelName);

        // Ensure user can only join their own channel
        if ($channelUserId != $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        // Get device info from request (sent by APK)
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
            $device = null;
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
}
