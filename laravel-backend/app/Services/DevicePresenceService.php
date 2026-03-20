<?php

namespace App\Services;

use App\Models\Device;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

/**
 * Simple Redis-based Device Presence Service
 *
 * ONE mechanism: APK sends HTTP heartbeat every 30s → Redis SETEX with 90s TTL
 * Device is online if key exists, offline if expired. That's it.
 */
class DevicePresenceService
{
    private const HEARTBEAT_TTL = 90; // seconds
    private const KEY_PREFIX = 'device:heartbeat:';

    /**
     * Record heartbeat from device - this is THE ONLY way to mark online
     */
    public function heartbeat(string $deviceId, int $userId, ?int $dbId = null): void
    {
        $key = self::KEY_PREFIX . $deviceId;
        $data = json_encode([
            'user_id' => $userId,
            'db_id' => $dbId,
            'timestamp' => now()->timestamp,
        ]);
        Redis::setex($key, self::HEARTBEAT_TTL, $data);
    }

    /**
     * Check if device is online (key exists = online, expired = offline)
     */
    public function isOnline(int $userId, string $deviceId): bool
    {
        return (bool) Redis::exists(self::KEY_PREFIX . $deviceId);
    }

    /**
     * Mark device offline immediately (e.g., user logout)
     */
    public function markOffline(int $userId, string $deviceId): void
    {
        Redis::del(self::KEY_PREFIX . $deviceId);
    }

    /**
     * Get all online devices for a user
     * Scans Redis keys matching the heartbeat pattern and filters by user_id
     */
    public function getOnlineDevices(int $userId): array
    {
        // Get all user's devices from DB, check which have active heartbeat
        $devices = Device::where('user_id', $userId)->pluck('device_id')->toArray();
        $online = [];
        foreach ($devices as $deviceId) {
            $data = Redis::get(self::KEY_PREFIX . $deviceId);
            if ($data) {
                $parsed = json_decode($data, true);
                if (($parsed['user_id'] ?? null) == $userId) {
                    $online[] = $deviceId;
                }
            }
        }
        return $online;
    }

    /**
     * Get online count for user
     */
    public function getOnlineCount(int $userId): int
    {
        return count($this->getOnlineDevices($userId));
    }

    /**
     * Sync online status to database (called by scheduler, less frequently needed now)
     */
    public function syncToDatabase(): void
    {
        $devices = Device::where('socket_connected', true)->get();
        foreach ($devices as $device) {
            if (!Redis::exists(self::KEY_PREFIX . $device->device_id)) {
                $device->update(['socket_connected' => false]);
            }
        }
    }

    // Keep backward-compatible methods that delegate to new system
    public function markOnline(int $userId, string $deviceId, ?int $dbId = null): void
    {
        $this->heartbeat($deviceId, $userId, $dbId);
    }

    public function refreshPresence(int $userId, string $deviceId): void
    {
        // Just extend the TTL if key exists
        if (Redis::exists(self::KEY_PREFIX . $deviceId)) {
            Redis::expire(self::KEY_PREFIX . $deviceId, self::HEARTBEAT_TTL);
        }
    }

    public function markAllOffline(int $userId): void
    {
        $devices = Device::where('user_id', $userId)->pluck('device_id')->toArray();
        foreach ($devices as $deviceId) {
            Redis::del(self::KEY_PREFIX . $deviceId);
        }
    }

    public function getOnlineDevicesWithDetails(int $userId): array
    {
        $onlineIds = $this->getOnlineDevices($userId);
        if (empty($onlineIds)) return [];
        return Device::where('user_id', $userId)
            ->whereIn('device_id', $onlineIds)
            ->get()
            ->toArray();
    }
}
