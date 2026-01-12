<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class HeartbeatController extends Controller
{
    /**
     * Store heartbeat from Android device
     */
    public function store(Request $request)
    {
        try {
            $user = $request->user();

            // Get device_id from request or header
            $deviceId = $request->input('device_id')
                ?? $request->header('X-Device-ID');

            if (!$deviceId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Device ID required'
                ], 400);
            }

            // Find device by user and device_id
            $device = Device::where('user_id', $user->id)
                ->where('device_id', $deviceId)
                ->first();

            if (!$device) {
                return response()->json([
                    'success' => false,
                    'message' => 'Device not found'
                ], 404);
            }

            // Update last_active_at timestamp
            $device->markAsActive();

            // Log heartbeat if needed (optional)
            if ($request->boolean('log', false)) {
                $device->logActivity('heartbeat', $request->ip(), [
                    'is_recording' => $request->boolean('is_recording'),
                    'socket_connected' => $request->boolean('socket_connected'),
                    'battery_level' => $request->input('battery_level'),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Heartbeat received',
                'online' => true,
                'last_active_at' => $device->last_active_at
            ]);

        } catch (\Exception $e) {
            Log::error('Heartbeat error', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }
}
