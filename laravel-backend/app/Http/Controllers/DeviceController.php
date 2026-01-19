<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeviceRequest;
use App\Http\Resources\DeviceResource;
use App\Models\Device;
use App\Services\DevicePresenceService;
use App\Services\DeviceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class DeviceController extends Controller
{
    public function __construct(
        protected DeviceService $deviceService,
        protected DevicePresenceService $presenceService
    ) {
    }

    /**
     * Register or update a device.
     * Also marks device as online in Redis (APK is now active)
     */
    public function store(DeviceRequest $request): JsonResponse
    {
        $result = $this->deviceService->registerOrUpdateDevice(
            $request->user(),
            $request->validated(),
            $request->ip()
        );

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
                'error' => $result['error'],
            ], 422);
        }

        $device = $result['device'];
        $isNew = $result['is_new'];
        $isModelMatch = $result['is_model_match'];

        // Mark device online in Redis (APK just opened/registered)
        $this->deviceService->markDeviceOnlineAfterRegister($device);

        return response()->json([
            'success' => true,
            'message' => $isNew
                ? 'Thiết bị đã được đăng ký thành công'
                : ($isModelMatch ? 'Thiết bị đã được nhận diện lại' : 'Thiết bị đã được cập nhật thành công'),
            'device' => new DeviceResource($device),
        ], $isNew ? 201 : 200);
    }

    /**
     * List all devices for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $devices = $this->deviceService->getUserDevices($request->user());

        return response()->json([
            'data' => DeviceResource::collection($devices),
            'meta' => [
                'total' => $devices->count(),
                'max_devices' => DeviceService::MAX_DEVICES_PER_USER,
            ],
        ]);
    }

    /**
     * Show a specific device with activity logs.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $device = Device::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->with([
                'activityLogs' => fn($q) => $q->orderBy('created_at', 'desc')->limit(50)
            ])
            ->first();

        if (!$device) {
            return response()->json(['message' => 'Thiết bị không tồn tại'], 404);
        }

        return response()->json(['data' => new DeviceResource($device)]);
    }

    /**
     * Device heartbeat/ping to update last active time.
     */
    public function ping(Request $request, int $id): JsonResponse
    {
        $device = Device::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$device) {
            return response()->json(['message' => 'Thiết bị không tồn tại'], 404);
        }

        $this->deviceService->handleHeartbeat($device, $request->ip());

        return response()->json([
            'message' => 'Device is active',
            'last_active_at' => $device->last_active_at->toIso8601String(),
        ]);
    }

    /**
     * Delete a device.
     */
    public function destroy(Request $request, int $id): Response|JsonResponse
    {
        $device = Device::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$device) {
            return response()->json(['message' => 'Thiết bị không tồn tại'], 404);
        }

        $device->logActivity('device_deleted', $request->ip());
        $device->delete();

        return response()->noContent();
    }

    /**
     * Revoke all device tokens except the current one.
     */
    public function logoutAll(Request $request): JsonResponse
    {
        $currentTokenId = $request->user()->currentAccessToken()->id;
        $request->user()->tokens()->where('id', '!=', $currentTokenId)->delete();

        return response()->json(['message' => 'Đã đăng xuất khỏi tất cả các thiết bị khác']);
    }

    /**
     * Update device socket connection status - by route parameter
     */
    public function updateStatusById(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:online,offline',
            'socket_connected' => 'sometimes|boolean',
        ]);

        return $this->doUpdateStatus($request, $id);
    }

    /**
     * Update device socket connection status - by body device_id
     */
    public function updateStatusByDeviceId(Request $request): JsonResponse
    {
        $request->validate([
            'device_id' => 'required|string',
            'status' => 'required|string|in:online,offline',
            'socket_connected' => 'sometimes|boolean',
            'accessibility_enabled' => 'sometimes|boolean',
        ]);

        return $this->doUpdateStatus($request, $request->input('device_id'));
    }

    /**
     * Common logic for updating device status
     */
    private function doUpdateStatus(Request $request, string $deviceId): JsonResponse
    {
        $device = $this->deviceService->findByDeviceId($request->user(), $deviceId);

        if (!$device) {
            return response()->json([
                'success' => false,
                'message' => 'Device not found',
            ], 404);
        }

        $device = $this->deviceService->updateDeviceStatus($device, [
            'status' => $request->input('status'),
            'socket_connected' => $request->input('socket_connected'),
            'accessibility_enabled' => $request->input('accessibility_enabled'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Device status updated',
            'device' => [
                'id' => $device->id,
                'name' => $device->name,
                'status' => $request->input('status'),
                'socket_connected' => $device->socket_connected,
                'accessibility_enabled' => $device->accessibility_enabled,
            ],
        ]);
    }

    /**
     * Heartbeat endpoint for APK to report alive status
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $request->validate(['device_id' => 'required|string']);

        $device = $this->deviceService->findByDeviceId($request->user(), $request->input('device_id'));

        if (!$device) {
            return response()->json([
                'success' => true,
                'message' => 'Heartbeat received (device not registered)',
            ]);
        }

        $this->deviceService->handleHeartbeat($device, $request->ip());

        return response()->json([
            'success' => true,
            'message' => 'Heartbeat received',
            'last_active_at' => $device->last_active_at->toIso8601String(),
        ]);
    }

    /**
     * Request element inspection from device
     */
    public function inspectElements(Request $request): JsonResponse
    {
        $request->validate(['device_id' => 'required|string']);

        $device = $this->deviceService->findByDeviceId($request->user(), $request->input('device_id'));

        if (!$device) {
            return response()->json(['success' => false, 'message' => 'Device not found'], 404);
        }

        if (!$this->deviceService->requestElementInspection($device, $request->user()->id)) {
            return response()->json(['success' => false, 'message' => 'Device is offline'], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Inspection request sent to device',
            'device_id' => $device->device_id,
        ]);
    }

    /**
     * Request visual inspection (OCR text detection) from device
     */
    public function visualInspect(Request $request): JsonResponse
    {
        $request->validate(['device_id' => 'required|string']);

        $device = $this->deviceService->findByDeviceId($request->user(), $request->input('device_id'));

        if (!$device) {
            return response()->json(['success' => false, 'message' => 'Device not found'], 404);
        }

        if (!$this->deviceService->requestVisualInspection($device, $request->user()->id)) {
            return response()->json(['success' => false, 'message' => 'Device is offline'], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Visual inspection (OCR) request sent to device',
            'device_id' => $device->device_id,
        ]);
    }

    /**
     * Receive element inspection results from device
     */
    public function inspectElementsResult(Request $request): JsonResponse
    {
        $request->validate([
            'device_id' => 'required|string',
            'success' => 'required|boolean',
            'elements' => 'sometimes|array',
            'package_name' => 'sometimes|string',
            'error' => 'sometimes|string',
        ]);

        $this->deviceService->broadcastInspectionResults(
            $request->user()->id,
            $request->input('device_id'),
            $request->input('success'),
            $request->input('elements', []),
            $request->input('package_name'),
            $request->input('error')
        );

        return response()->json([
            'success' => true,
            'message' => 'Inspection result received',
            'element_count' => count($request->input('elements', [])),
        ]);
    }

    /**
     * Request realtime accessibility check from device via socket
     */
    public function checkAccessibility(Request $request): JsonResponse
    {
        $request->validate(['device_id' => 'required|string']);

        $device = $this->deviceService->findByDeviceId($request->user(), $request->input('device_id'));

        if (!$device) {
            return response()->json(['success' => false, 'message' => 'Device not found'], 404);
        }

        if (!$this->deviceService->requestAccessibilityCheck($device, $request->user()->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Device is offline',
                'accessibility_enabled' => $device->accessibility_enabled ?? false,
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Accessibility check request sent to device',
            'device_id' => $device->device_id,
            'current_status' => $device->accessibility_enabled ?? false,
        ]);
    }

    /**
     * Receive accessibility check result from device
     */
    public function checkAccessibilityResult(Request $request): JsonResponse
    {
        $request->validate([
            'device_id' => 'required|string',
            'accessibility_enabled' => 'required|boolean',
        ]);

        $device = $this->deviceService->findByDeviceId($request->user(), $request->input('device_id'));

        if (!$device) {
            return response()->json(['success' => false, 'message' => 'Device not found'], 404);
        }

        $this->deviceService->broadcastAccessibilityStatus($device, $request->input('accessibility_enabled'));

        return response()->json([
            'success' => true,
            'message' => 'Accessibility status broadcast',
            'accessibility_enabled' => $request->input('accessibility_enabled'),
        ]);
    }

    /**
     * Send quick action to device via websocket
     * Used by Quick Action Bar in workflow editor
     */
    public function sendAction(Request $request): JsonResponse
    {
        $request->validate([
            'device_id' => 'required|string',
            'action' => 'required|array',
            'action.type' => 'required|string|in:scroll,key_event,tap,swipe',
        ]);

        $device = $this->deviceService->findByDeviceId($request->user(), $request->input('device_id'));

        if (!$device) {
            return response()->json(['success' => false, 'message' => 'Device not found'], 404);
        }

        $action = $request->input('action');

        // Broadcast action to device via websocket
        $success = $this->deviceService->sendQuickActionToDevice($device, $action, $request->user()->id);

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => 'Device is offline or action failed to send',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => "Action '{$action['type']}' sent to device",
            'device_id' => $device->device_id,
            'action' => $action,
        ]);
    }

    /**
     * Get online status for all user's devices
     * 
     * OPTIMIZED: Uses Redis for O(1) lookup
     * Frontend should poll this every 45s instead of using sockets
     */
    public function getOnlineStatus(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $onlineDeviceIds = $this->presenceService->getOnlineDevices($userId);

        // Get device details for online devices
        $onlineDevices = [];
        if (!empty($onlineDeviceIds)) {
            $onlineDevices = Device::where('user_id', $userId)
                ->whereIn('device_id', $onlineDeviceIds)
                ->get(['id', 'device_id', 'name', 'model', 'accessibility_enabled'])
                ->toArray();
        }

        return response()->json([
            'success' => true,
            'online_device_ids' => $onlineDeviceIds,
            'online_devices' => $onlineDevices,
            'count' => count($onlineDeviceIds),
            'checked_at' => now()->toISOString(),
        ]);
    }
}
