<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeviceRequest;
use App\Http\Resources\DeviceResource;
use App\Models\Device;
use App\Models\DeviceActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class DeviceController extends Controller
{
    // Maximum devices per user
    private const MAX_DEVICES_PER_USER = 10;

    /**
     * Register or update a device.
     *
     * @param DeviceRequest $request
     * @return JsonResponse
     */
    public function store(DeviceRequest $request): JsonResponse
    {
        $user = $request->user();
        $ipAddress = $request->ip();

        // Normalize field names (support both 'name' and 'device_name')
        $deviceName = $request->input('name') ?? $request->input('device_name') ?? 'Unknown Device';
        $deviceId = $request->input('device_id');
        $model = $request->input('model');

        // Find existing device - priority:
        // 1. By device_id (exact match)
        // 2. By model + user_id (for emulators that change device_id)
        $existingDevice = Device::where('device_id', $deviceId)->first();

        // If not found by device_id, check by model + user_id (prevents duplicates for same model)
        $isModelMatch = false;
        if (!$existingDevice && $model) {
            $existingDevice = Device::where('user_id', $user->id)
                ->where('model', $model)
                ->first();
            $isModelMatch = (bool) $existingDevice;
        }

        if (!$existingDevice) {
            // Check device limit for new devices
            $deviceCount = Device::where('user_id', $user->id)->count();

            if ($deviceCount >= self::MAX_DEVICES_PER_USER) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn đã đạt giới hạn tối đa ' . self::MAX_DEVICES_PER_USER . ' thiết bị.',
                    'error' => 'device_limit_exceeded',
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            if ($existingDevice) {
                // Update existing device (including device_id if it changed)
                $existingDevice->update([
                    'device_id' => $deviceId, // Update device_id in case it changed
                    'user_id' => $user->id,
                    'name' => $deviceName,
                    'model' => $model,
                    'android_version' => $request->input('android_version'),
                    'status' => Device::STATUS_ACTIVE,
                    'last_active_at' => now(),
                ]);
                $device = $existingDevice;
            } else {
                // Create new device
                $device = Device::create([
                    'device_id' => $deviceId,
                    'user_id' => $user->id,
                    'name' => $deviceName,
                    'model' => $model,
                    'android_version' => $request->input('android_version'),
                    'status' => Device::STATUS_ACTIVE,
                    'last_active_at' => now(),
                ]);
            }

            // Log the activity
            $event = $existingDevice ? ($isModelMatch ? 'device_id_updated' : 'device_updated') : 'device_registered';
            $device->logActivity($event, $ipAddress, [
                'user_agent' => $request->userAgent(),
                'name' => $deviceName,
                'model' => $model,
                'android_version' => $request->input('android_version'),
                'device_id_changed' => $isModelMatch,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $existingDevice
                    ? ($isModelMatch ? 'Thiết bị đã được nhận diện lại' : 'Thiết bị đã được cập nhật thành công')
                    : 'Thiết bị đã được đăng ký thành công',
                'device' => new DeviceResource($device),
            ], $existingDevice ? 200 : 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi khi đăng ký thiết bị',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * List all devices for the authenticated user.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $devices = Device::where('user_id', $request->user()->id)
            ->orderBy('last_active_at', 'desc')
            ->get();

        return response()->json([
            'data' => DeviceResource::collection($devices),
            'meta' => [
                'total' => $devices->count(),
                'max_devices' => self::MAX_DEVICES_PER_USER,
            ],
        ]);
    }

    /**
     * Show a specific device with activity logs.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $device = Device::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->with([
                'activityLogs' => function ($query) {
                    $query->orderBy('created_at', 'desc')->limit(50);
                }
            ])
            ->first();

        if (!$device) {
            return response()->json([
                'message' => 'Thiết bị không tồn tại',
            ], 404);
        }

        return response()->json([
            'data' => new DeviceResource($device),
        ]);
    }

    /**
     * Device heartbeat/ping to update last active time.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function ping(Request $request, int $id): JsonResponse
    {
        $device = Device::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$device) {
            return response()->json([
                'message' => 'Thiết bị không tồn tại',
            ], 404);
        }

        $device->markAsActive();

        // Log heartbeat periodically (only every 5 minutes to avoid spam)
        $lastHeartbeat = DeviceActivityLog::where('device_id', $device->id)
            ->where('event', DeviceActivityLog::EVENT_HEARTBEAT)
            ->latest()
            ->first();

        if (!$lastHeartbeat || $lastHeartbeat->created_at->diffInMinutes(now()) >= 5) {
            $device->logActivity(DeviceActivityLog::EVENT_HEARTBEAT, $request->ip());
        }

        return response()->json([
            'message' => 'Device is active',
            'last_active_at' => $device->last_active_at->toIso8601String(),
        ]);
    }

    /**
     * Delete a device.
     *
     * @param Request $request
     * @param int $id
     * @return Response|JsonResponse
     */
    public function destroy(Request $request, int $id): Response|JsonResponse
    {
        $device = Device::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$device) {
            return response()->json([
                'message' => 'Thiết bị không tồn tại',
            ], 404);
        }

        // Log before deletion
        $device->logActivity('device_deleted', $request->ip());

        $device->delete();

        return response()->noContent();
    }

    /**
     * Revoke all device tokens except the current one.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logoutAll(Request $request): JsonResponse
    {
        $currentTokenId = $request->user()->currentAccessToken()->id;

        $request->user()->tokens()->where('id', '!=', $currentTokenId)->delete();

        return response()->json([
            'message' => 'Đã đăng xuất khỏi tất cả các thiết bị khác',
        ]);
    }

    /**
     * Update device socket connection status (online/offline)
     * Called by Android app when socket connects/disconnects
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function updateStatus(Request $request): JsonResponse
    {
        $request->validate([
            'device_id' => 'required|string',
            'status' => 'required|string|in:online,offline',
            'socket_connected' => 'required|boolean',
        ]);

        $user = $request->user();
        $deviceId = $request->input('device_id');

        $device = Device::where('user_id', $user->id)
            ->where('device_id', $deviceId)
            ->first();

        if (!$device) {
            return response()->json([
                'success' => false,
                'message' => 'Device not found',
            ], 404);
        }

        $device->update([
            'socket_connected' => $request->input('socket_connected'),
            'last_active_at' => now(),
        ]);

        // Broadcast status change to frontend
        broadcast(new \App\Events\DeviceStatusChanged(
            $device,
            $request->input('status')
        ))->toOthers();

        \Log::info("Device status updated via socket: {$device->name} -> {$request->input('status')}");

        return response()->json([
            'success' => true,
            'message' => 'Device status updated',
            'device' => [
                'id' => $device->id,
                'name' => $device->name,
                'status' => $request->input('status'),
                'socket_connected' => $device->socket_connected,
            ],
        ]);
    }
}

