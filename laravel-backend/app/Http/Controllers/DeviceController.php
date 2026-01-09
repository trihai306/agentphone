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

        // Check if device already exists
        $existingDevice = Device::where('device_id', $request->device_id)->first();

        if (!$existingDevice) {
            // Check device limit for new devices
            $deviceCount = Device::where('user_id', $user->id)->count();

            if ($deviceCount >= self::MAX_DEVICES_PER_USER) {
                return response()->json([
                    'message' => 'Bạn đã đạt giới hạn tối đa ' . self::MAX_DEVICES_PER_USER . ' thiết bị.',
                    'error' => 'device_limit_exceeded',
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            $device = Device::updateOrCreate(
                ['device_id' => $request->device_id],
                [
                    'user_id' => $user->id,
                    'name' => $request->name,
                    'model' => $request->model,
                    'android_version' => $request->android_version,
                    'status' => Device::STATUS_ACTIVE,
                    'last_active_at' => now(),
                ]
            );

            // Log the activity
            $event = $existingDevice ? 'device_updated' : 'device_registered';
            $device->logActivity($event, $ipAddress, [
                'user_agent' => $request->userAgent(),
                'name' => $request->name,
                'model' => $request->model,
                'android_version' => $request->android_version,
            ]);

            DB::commit();

            return response()->json([
                'message' => $existingDevice
                    ? 'Thiết bị đã được cập nhật thành công'
                    : 'Thiết bị đã được đăng ký thành công',
                'device' => new DeviceResource($device),
            ], $existingDevice ? 200 : 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
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
}
