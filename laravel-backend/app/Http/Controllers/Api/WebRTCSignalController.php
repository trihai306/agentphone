<?php

namespace App\Http\Controllers\Api;

use App\Events\DeviceScreenFrame;
use App\Events\WebRTCSignalToDevice;
use App\Events\WebRTCSignalToUser;
use App\Http\Controllers\Controller;
use App\Models\Device;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * WebRTC Signaling Controller
 *
 * Relays WebRTC signaling data between APK and browser via Soketi broadcasts.
 *
 * Flow:
 * 1. Browser calls POST /stream/start → broadcasts stream:start to device channel
 * 2. APK creates SDP offer → calls POST /signal → broadcasts webrtc:signal to user channel
 * 3. Browser creates SDP answer → calls POST /signal → broadcasts webrtc:signal to device channel
 * 4. ICE candidates exchanged similarly
 */
class WebRTCSignalController extends Controller
{
    /**
     * Start streaming request from browser → device
     *
     * POST /api/devices/{device}/stream/start
     */
    public function startStream(Request $request, Device $device): JsonResponse
    {
        // Verify user owns this device
        if ($device->user_id !== $request->user()->id) {
            abort(403, 'Not authorized to access this device');
        }

        Log::info("WebRTC: Stream start requested for device {$device->id} by user {$request->user()->id}");

        // Broadcast start event to device channel
        event(new WebRTCSignalToDevice(
            deviceId: $device->device_id,
            signalType: 'start',
            viewerUserId: $request->user()->id
        ));

        return response()->json([
            'success' => true,
            'message' => 'Stream start request sent to device',
        ]);
    }

    /**
     * Stop streaming request from browser → device
     *
     * POST /api/devices/{device}/stream/stop
     */
    public function stopStream(Request $request, Device $device): JsonResponse
    {
        if ($device->user_id !== $request->user()->id) {
            abort(403, 'Not authorized to access this device');
        }

        Log::info("WebRTC: Stream stop requested for device {$device->id}");

        event(new WebRTCSignalToDevice(
            deviceId: $device->device_id,
            signalType: 'stop',
            viewerUserId: $request->user()->id
        ));

        return response()->json([
            'success' => true,
            'message' => 'Stream stop request sent to device',
        ]);
    }

    /**
     * Relay WebRTC signaling data (SDP offers/answers, ICE candidates)
     *
     * POST /api/webrtc/signal
     *
     * Called by both APK (sending SDP offer/ICE) and browser (sending SDP answer/ICE)
     */
    public function signal(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'device_id' => 'required|integer',
            'signal_type' => 'required|string|in:sdp-offer,sdp-answer,ice-candidate',
            'signal_data' => 'required|array',
            'viewer_user_id' => 'nullable|integer',
        ]);

        $device = Device::findOrFail($validated['device_id']);
        $signalType = $validated['signal_type'];
        $signalData = $validated['signal_data'];

        Log::debug("WebRTC: Signal relay - type={$signalType}, device={$device->id}");

        if ($signalType === 'sdp-offer' || ($signalType === 'ice-candidate' && $request->has('viewer_user_id'))) {
            // APK → Browser: broadcast to user's presence channel
            $viewerUserId = $validated['viewer_user_id'] ?? $device->user_id;

            event(new WebRTCSignalToUser(
                userId: $viewerUserId,
                deviceId: $device->id,
                signalType: $signalType,
                signalData: $signalData
            ));
        } else {
            // Browser → APK: broadcast to device's private channel
            event(new WebRTCSignalToDevice(
                deviceId: $device->device_id,
                signalType: $signalType,
                signalData: $signalData,
                viewerUserId: $request->user()->id
            ));
        }

        return response()->json([
            'success' => true,
            'message' => 'Signal relayed',
        ]);
    }

    /**
     * Receive MJPEG stream info from APK and broadcast to user
     *
     * POST /api/devices/stream/mjpeg-info
     *
     * Called by APK when MJPEG server starts — sends local IPs and port.
     * Frontend auto-receives via Echo and connects without manual IP input.
     */
    public function receiveMjpegInfo(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mode' => 'required|string',
            'urls' => 'required|array',
            'port' => 'required|integer',
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        // Find the user's active device
        $device = Device::where('user_id', $user->id)
            ->where('is_online', true)
            ->latest('updated_at')
            ->first();

        if (!$device) {
            return response()->json(['success' => false, 'message' => 'No active device found'], 404);
        }

        Log::info("MJPEG: Device {$device->id} reported stream URLs", $validated);

        // Broadcast MJPEG info to user's channel
        event(new WebRTCSignalToUser(
            userId: $user->id,
            deviceId: $device->id,
            signalType: 'mjpeg-info',
            signalData: [
                'urls' => $validated['urls'],
                'port' => $validated['port'],
                'mode' => $validated['mode'],
            ]
        ));

        return response()->json([
            'success' => true,
            'message' => 'MJPEG info broadcast to frontend',
        ]);
    }

    /**
     * Receive screenshot frame from APK and relay to browser via Echo
     *
     * POST /api/devices/stream/frame
     *
     * Called by APK at ~3fps with compressed JPEG base64.
     * Broadcasts to user's private channel for live preview.
     */
    public function receiveFrame(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'frame' => 'required|string', // base64 JPEG
            'width' => 'nullable|integer',
            'height' => 'nullable|integer',
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        // Find the user's active device
        $device = Device::where('user_id', $user->id)
            ->where('is_online', true)
            ->latest('updated_at')
            ->first();

        if (!$device) {
            return response()->json(['success' => false, 'message' => 'No active device'], 404);
        }

        // Broadcast frame to user's browser via Echo
        event(new DeviceScreenFrame(
            userId: $user->id,
            deviceId: $device->id,
            frame: $validated['frame'],
            width: $validated['width'] ?? 0,
            height: $validated['height'] ?? 0
        ));

        return response()->json(['success' => true]);
    }
}
