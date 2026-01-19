<?php

namespace App\Services;

use App\Models\Device;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Redis-based Device Presence Service
 * 
 * Optimized for 5000+ devices with minimal DB writes.
 * Uses Redis SET with TTL for real-time presence tracking.
 */
class DevicePresenceService
{
    // Redis key patterns
    private const KEY_ONLINE_DEVICES = 'device:online:%d'; // %d = user_id
    private const KEY_DEVICE_INFO = 'device:info:%s';       // %s = device_id

    // TTL in seconds (60s - devices auto-expire if no refresh)
    private const PRESENCE_TTL = 60;

    /**
     * Mark a device as online
     */
    public function markOnline(int $userId, string $deviceId, ?int $deviceDbId = null): void
    {
        $key = sprintf(self::KEY_ONLINE_DEVICES, $userId);

        // Add device to user's online set
        Redis::sadd($key, $deviceId);
        Redis::expire($key, self::PRESENCE_TTL);

        // Store device info for quick lookup
        if ($deviceDbId) {
            $infoKey = sprintf(self::KEY_DEVICE_INFO, $deviceId);
            Redis::hset($infoKey, 'user_id', $userId, 'db_id', $deviceDbId);
            Redis::expire($infoKey, self::PRESENCE_TTL);
        }

        Log::debug("Device marked online via Redis: {$deviceId}");
    }

    /**
     * Mark a device as offline
     */
    public function markOffline(int $userId, string $deviceId): void
    {
        $key = sprintf(self::KEY_ONLINE_DEVICES, $userId);
        Redis::srem($key, $deviceId);

        // Clean up device info
        $infoKey = sprintf(self::KEY_DEVICE_INFO, $deviceId);
        Redis::del($infoKey);

        Log::debug("Device marked offline via Redis: {$deviceId}");
    }

    /**
     * Get all online device IDs for a user
     */
    public function getOnlineDevices(int $userId): array
    {
        $key = sprintf(self::KEY_ONLINE_DEVICES, $userId);
        return Redis::smembers($key) ?: [];
    }

    /**
     * Check if a specific device is online
     */
    public function isOnline(int $userId, string $deviceId): bool
    {
        $key = sprintf(self::KEY_ONLINE_DEVICES, $userId);
        return (bool) Redis::sismember($key, $deviceId);
    }

    /**
     * Get online count for a user
     */
    public function getOnlineCount(int $userId): int
    {
        $key = sprintf(self::KEY_ONLINE_DEVICES, $userId);
        return (int) Redis::scard($key);
    }

    /**
     * Refresh presence TTL (called during heartbeat)
     */
    public function refreshPresence(int $userId, string $deviceId): void
    {
        $key = sprintf(self::KEY_ONLINE_DEVICES, $userId);

        // Only refresh if device is in the set
        if (Redis::sismember($key, $deviceId)) {
            Redis::expire($key, self::PRESENCE_TTL);

            $infoKey = sprintf(self::KEY_DEVICE_INFO, $deviceId);
            Redis::expire($infoKey, self::PRESENCE_TTL);
        }
    }

    /**
     * Mark all devices offline for a user (channel vacated)
     */
    public function markAllOffline(int $userId): void
    {
        $key = sprintf(self::KEY_ONLINE_DEVICES, $userId);

        // Get all device IDs before deleting
        $deviceIds = Redis::smembers($key) ?: [];

        // Delete the set
        Redis::del($key);

        // Clean up device info keys
        foreach ($deviceIds as $deviceId) {
            $infoKey = sprintf(self::KEY_DEVICE_INFO, $deviceId);
            Redis::del($infoKey);
        }

        Log::debug("All devices marked offline for user: {$userId}");
    }

    /**
     * Sync Redis presence state to database
     * Called by scheduler every minute
     * 
     * @return int Number of devices synced
     */
    public function syncToDatabase(): int
    {
        $syncedCount = 0;

        try {
            // Get all online device keys
            $keys = Redis::keys('device:online:*');
            $onlineDeviceIds = [];

            foreach ($keys as $key) {
                // Remove prefix if present (Laravel may add prefix)
                $cleanKey = str_replace(config('database.redis.options.prefix', ''), '', $key);
                $deviceIds = Redis::smembers($cleanKey);
                if ($deviceIds) {
                    $onlineDeviceIds = array_merge($onlineDeviceIds, $deviceIds);
                }
            }

            $onlineDeviceIds = array_unique($onlineDeviceIds);

            if (empty($onlineDeviceIds)) {
                // No devices online - mark all as offline
                Device::where('socket_connected', true)
                    ->update([
                        'socket_connected' => false,
                        'status' => Device::STATUS_INACTIVE,
                    ]);
                return 0;
            }

            // Use transaction for consistency
            DB::transaction(function () use ($onlineDeviceIds, &$syncedCount) {
                // Mark online devices
                $syncedCount = Device::whereIn('device_id', $onlineDeviceIds)
                    ->update([
                        'socket_connected' => true,
                        'status' => Device::STATUS_ACTIVE,
                        'last_active_at' => now(),
                    ]);

                // Mark offline devices (not in Redis)
                Device::whereNotIn('device_id', $onlineDeviceIds)
                    ->where('socket_connected', true)
                    ->update([
                        'socket_connected' => false,
                        'status' => Device::STATUS_INACTIVE,
                    ]);
            });

            Log::info("Device presence synced to DB: {$syncedCount} online");

        } catch (\Exception $e) {
            Log::error("Device presence sync failed: " . $e->getMessage());
        }

        return $syncedCount;
    }

    /**
     * Get online devices with full details for a user
     */
    public function getOnlineDevicesWithDetails(int $userId): \Illuminate\Database\Eloquent\Collection
    {
        $onlineIds = $this->getOnlineDevices($userId);

        if (empty($onlineIds)) {
            return collect();
        }

        return Device::where('user_id', $userId)
            ->whereIn('device_id', $onlineIds)
            ->get();
    }
}
