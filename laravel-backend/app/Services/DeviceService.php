<?php

namespace App\Services;

use App\Events\CheckAccessibilityRequest;
use App\Events\DeviceAccessibilityChanged;
use App\Events\DeviceStatusChanged;
use App\Events\InspectElementsRequest;
use App\Events\InspectElementsResult;
use App\Models\Device;
use App\Models\DeviceActivityLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Service class for Device business logic
 * Handles device registration, status updates, and real-time communication
 */
class DeviceService
{
    public const MAX_DEVICES_PER_USER = 10;
    private const HEARTBEAT_LOG_INTERVAL_MINUTES = 5;

    public function __construct(
        private ?DevicePresenceService $presenceService = null
    ) {
        // Allow null for backwards compatibility, auto-resolve if not provided
        $this->presenceService ??= app(DevicePresenceService::class);
    }

    /**
     * Register a new device or update existing one
     */
    public function registerOrUpdateDevice(User $user, array $data, string $ipAddress): array
    {
        $deviceName = $data['name'] ?? $data['device_name'] ?? 'Unknown Device';
        $deviceId = $data['device_id'];
        $model = $data['model'] ?? null;

        // Find existing device by device_id only
        // Note: Do NOT match by model - multiple physical devices can have same model
        $existingDevice = Device::where('device_id', $deviceId)->first();

        // Check device limit for new devices
        if (!$existingDevice) {
            $deviceCount = Device::where('user_id', $user->id)->count();
            if ($deviceCount >= self::MAX_DEVICES_PER_USER) {
                return [
                    'success' => false,
                    'error' => 'device_limit_exceeded',
                    'message' => 'Bạn đã đạt giới hạn tối đa ' . self::MAX_DEVICES_PER_USER . ' thiết bị.',
                ];
            }
        }

        $device = DB::transaction(function () use ($existingDevice, $user, $data, $deviceId, $deviceName, $model, $ipAddress) {
            if ($existingDevice) {
                $existingDevice->update([
                    'device_id' => $deviceId,
                    'user_id' => $user->id,
                    'name' => $deviceName,
                    'model' => $model,
                    'android_version' => $data['android_version'] ?? null,
                    'status' => Device::STATUS_ACTIVE,
                    'last_active_at' => now(),
                ]);
                $device = $existingDevice;
            } else {
                $device = Device::create([
                    'device_id' => $deviceId,
                    'user_id' => $user->id,
                    'name' => $deviceName,
                    'model' => $model,
                    'android_version' => $data['android_version'] ?? null,
                    'status' => Device::STATUS_ACTIVE,
                    'last_active_at' => now(),
                ]);
            }

            // Log the activity
            $event = $existingDevice ? 'device_updated' : 'device_registered';
            $device->logActivity($event, $ipAddress, [
                'name' => $deviceName,
                'model' => $model,
                'android_version' => $data['android_version'] ?? null,
            ]);

            return $device;
        });

        return [
            'success' => true,
            'device' => $device,
            'is_new' => !$existingDevice,
        ];
    }

    /**
     * Mark device online in Redis after registration
     * Called when APK opens and registers/updates device
     */
    public function markDeviceOnlineAfterRegister(Device $device): void
    {
        $this->presenceService->markOnline(
            $device->user_id,
            $device->device_id,
            $device->id
        );
    }

    /**
     * Process device heartbeat
     * Also refreshes Redis presence TTL
     */
    public function handleHeartbeat(Device $device, string $ipAddress): void
    {
        $device->markAsActive();

        // Refresh Redis presence (extends TTL)
        $this->presenceService->refreshPresence($device->user_id, $device->device_id);

        // If device wasn't in Redis (e.g., after restart), add it
        if (!$this->presenceService->isOnline($device->user_id, $device->device_id)) {
            $this->presenceService->markOnline($device->user_id, $device->device_id, $device->id);
        }

        // Log heartbeat periodically to avoid spam
        $lastHeartbeat = DeviceActivityLog::where('device_id', $device->id)
            ->where('event', DeviceActivityLog::EVENT_HEARTBEAT)
            ->latest()
            ->first();

        if (!$lastHeartbeat || $lastHeartbeat->created_at->diffInMinutes(now()) >= self::HEARTBEAT_LOG_INTERVAL_MINUTES) {
            $device->logActivity(DeviceActivityLog::EVENT_HEARTBEAT, $ipAddress);
        }
    }

    /**
     * Update device status (socket connected, accessibility, etc.)
     * Also updates Redis presence
     */
    public function updateDeviceStatus(Device $device, array $data): Device
    {
        $oldAccessibilityEnabled = $device->accessibility_enabled;
        $isOnline = $data['socket_connected'] ?? ($data['status'] === 'online');

        $updateData = [
            'socket_connected' => $isOnline,
            'last_active_at' => now(),
        ];

        if (isset($data['accessibility_enabled'])) {
            $updateData['accessibility_enabled'] = $data['accessibility_enabled'];
            $updateData['accessibility_checked_at'] = now();
        }

        $device->update($updateData);

        // Update Redis presence
        if ($isOnline) {
            $this->presenceService->markOnline($device->user_id, $device->device_id, $device->id);
        } else {
            $this->presenceService->markOffline($device->user_id, $device->device_id);
        }

        // Broadcast status change
        if (class_exists(DeviceStatusChanged::class)) {
            broadcast(new DeviceStatusChanged($device, $data['status']))->toOthers();
        }

        // Broadcast accessibility change if it changed
        if (isset($data['accessibility_enabled']) && $oldAccessibilityEnabled !== $data['accessibility_enabled']) {
            if (class_exists(DeviceAccessibilityChanged::class)) {
                broadcast(new DeviceAccessibilityChanged($device, $data['accessibility_enabled']))->toOthers();
            }
        }

        return $device;
    }

    /**
     * Request element inspection from device
     */
    public function requestElementInspection(Device $device, int $userId): bool
    {
        // Use Redis presence check for accurate real-time online status
        // DB socket_connected can be outdated if not synced properly
        if (!$this->presenceService->isOnline($device->user_id, $device->device_id)) {
            \Log::info('Device not online in Redis for inspection', [
                'device_id' => $device->device_id,
                'user_id' => $device->user_id,
            ]);
            return false;
        }

        broadcast(new InspectElementsRequest($device->device_id, $userId));
        return true;
    }

    /**
     * Broadcast element inspection results to frontend
     */
    public function broadcastInspectionResults(int $userId, string $deviceId, bool $success, array $elements, ?string $packageName, ?string $error): void
    {
        broadcast(new InspectElementsResult($userId, $deviceId, $success, $elements, $packageName, $error));
    }

    /**
     * Request accessibility check from device
     */
    public function requestAccessibilityCheck(Device $device, int $userId): bool
    {
        if (!$device->socket_connected) {
            return false;
        }

        broadcast(new CheckAccessibilityRequest($device->device_id, $userId));
        return true;
    }

    /**
     * Request installed apps list from device
     */
    public function requestInstalledApps(Device $device, int $userId): bool
    {
        \Log::info('🔍 requestInstalledApps called', [
            'device_id' => $device->device_id,
            'socket_connected' => $device->socket_connected,
            'user_id' => $userId,
        ]);

        if (!$device->socket_connected) {
            \Log::warning('❌ Device socket not connected, cannot request apps', [
                'device_id' => $device->device_id,
            ]);
            return false;
        }

        \Log::info('📤 Broadcasting GetInstalledAppsRequest to device', [
            'device_id' => $device->device_id,
            'user_id' => $userId,
        ]);

        broadcast(new \App\Events\GetInstalledAppsRequest($device->device_id, $userId));
        return true;
    }

    /**
     * Broadcast installed apps list to frontend
     */
    public function broadcastInstalledAppsResult(int $userId, string $deviceId, bool $success, array $apps, ?string $error = null): void
    {
        broadcast(new \App\Events\InstalledAppsResult($userId, $deviceId, $success, $apps, $error));
    }

    /**
     * Broadcast accessibility status to frontend
     */
    public function broadcastAccessibilityStatus(Device $device, bool $accessibilityEnabled): void
    {
        broadcast(new DeviceAccessibilityChanged($device, $accessibilityEnabled));
    }

    /**
     * Request visual inspection (OCR) from device
     * @param Device $device The target device
     * @param int $userId The user ID
     * @return bool True if request was sent successfully
     */
    public function requestVisualInspection(Device $device, int $userId): bool
    {
        if (!$device->socket_connected) {
            return false;
        }

        broadcast(new \App\Events\VisualInspectRequest($device->device_id, $userId));
        return true;
    }

    /**
     * Request icon template matching from device
     * @param Device $device The target device
     * @param int $userId The user ID
     * @param string $template Base64 encoded template icon image
     * @param float $minConfidence Minimum confidence threshold (0-1)
     * @return bool True if request was sent successfully
     */
    public function requestFindIcon(Device $device, int $userId, string $template, float $minConfidence = 0.65): bool
    {
        if (!$device->socket_connected) {
            return false;
        }

        broadcast(new \App\Events\FindIconRequest($device->device_id, $userId, $template, $minConfidence));
        return true;
    }

    /**
     * Broadcast visual inspection (OCR) results to frontend
     * @param int $userId The user ID
     * @param string $deviceId The device ID
     * @param bool $success Whether OCR was successful
     * @param array $textElements Array of detected text elements with coordinates
     * @param int $totalElements Total number of elements detected
     * @param int $processingTimeMs Time taken for OCR processing
     * @param int $screenshotWidth Screenshot width
     * @param int $screenshotHeight Screenshot height
     * @param int $statusBarHeight Status bar height for coordinate adjustment
     * @param string|null $screenshot Base64 encoded screenshot
     * @param string|null $error Error message if failed
     */
    public function broadcastVisualInspectionResults(
        int $userId,
        string $deviceId,
        bool $success,
        array $textElements,
        int $totalElements,
        int $processingTimeMs,
        int $screenshotWidth,
        int $screenshotHeight,
        int $statusBarHeight,
        ?string $screenshot = null,
        ?string $error = null
    ): void {
        broadcast(new \App\Events\VisualInspectResult(
            $userId,
            $deviceId,
            $success,
            $textElements,
            $totalElements,
            $processingTimeMs,
            $screenshotWidth,
            $screenshotHeight,
            $statusBarHeight,
            $screenshot,
            $error
        ));
    }

    /**
     * Find device by device_id for a user
     */
    public function findByDeviceId(User $user, string $deviceId): ?Device
    {
        return Device::where('user_id', $user->id)
            ->where('device_id', $deviceId)
            ->first();
    }

    /**
     * Send quick action to device via websocket
     * Used by Quick Action Bar in workflow editor
     * 
     * @param Device $device The target device
     * @param array $action Action data (type, direction, keyCode, etc.)
     * @param int $userId The user performing the action
     * @return bool True if action was sent successfully
     */
    public function sendQuickActionToDevice(Device $device, array $action, int $userId): bool
    {
        if (!$this->presenceService->isOnline($device->user_id, $device->device_id)) {
            return false;
        }

        // Broadcast quick action event to device channel
        broadcast(new \App\Events\DeviceQuickAction($device->device_id, $userId, $action));
        return true;
    }

    /**
     * Get all devices for a user
     */
    public function getUserDevices(User $user): \Illuminate\Database\Eloquent\Collection
    {
        return Device::where('user_id', $user->id)
            ->orderBy('last_active_at', 'desc')
            ->get();
    }
}
