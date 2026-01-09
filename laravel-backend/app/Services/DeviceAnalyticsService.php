<?php

namespace App\Services;

use App\Models\Device;
use App\Models\DeviceActivityLog;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DeviceAnalyticsService
{
    /**
     * Get count of online devices
     */
    public function getOnlineCount(int $minutes = 5): int
    {
        return Device::online($minutes)->count();
    }

    /**
     * Get count of offline devices
     */
    public function getOfflineCount(int $minutes = 5): int
    {
        return Device::offline($minutes)->count();
    }

    /**
     * Get total device count
     */
    public function getTotalCount(): int
    {
        return Device::count();
    }

    /**
     * Get hourly online stats for the last N hours
     */
    public function getHourlyOnlineStats(int $hours = 24): Collection
    {
        $stats = collect();

        for ($i = $hours - 1; $i >= 0; $i--) {
            $startTime = now()->subHours($i + 1);
            $endTime = now()->subHours($i);

            // Count devices that were active during this hour
            $count = DeviceActivityLog::where('event', DeviceActivityLog::EVENT_HEARTBEAT)
                ->whereBetween('created_at', [$startTime, $endTime])
                ->distinct('device_id')
                ->count('device_id');

            $stats->push([
                'hour' => $endTime->format('H:00'),
                'count' => $count,
                'date' => $endTime->format('Y-m-d H:i'),
            ]);
        }

        return $stats;
    }

    /**
     * Get daily activity stats for the last N days
     */
    public function getDailyActivityStats(int $days = 7): Collection
    {
        $stats = collect();

        for ($i = $days - 1; $i >= 0; $i--) {
            $date = now()->subDays($i);

            $count = DeviceActivityLog::whereDate('created_at', $date->toDateString())
                ->distinct('device_id')
                ->count('device_id');

            $stats->push([
                'date' => $date->format('d/m'),
                'full_date' => $date->format('Y-m-d'),
                'count' => $count,
            ]);
        }

        return $stats;
    }

    /**
     * Get Soketi WebSocket server stats
     */
    public function getSoketiStats(): array
    {
        return Cache::remember('soketi_stats', 10, function () {
            try {
                $appId = config('broadcasting.connections.pusher.app_id', 'app-id');
                $host = config('broadcasting.connections.pusher.options.host', '127.0.0.1');
                $port = config('broadcasting.connections.pusher.options.port', 6001);

                // Soketi exposes metrics on /usage endpoint (port 9601 by default)
                $response = Http::timeout(5)->get("http://{$host}:9601/usage");

                if ($response->successful()) {
                    $data = $response->json();
                    return [
                        'connected' => true,
                        'connections' => $data['connections'] ?? 0,
                        'memory' => $data['memory'] ?? [],
                        'uptime' => $data['uptime'] ?? 0,
                        'peak_connections' => $data['peak_connections'] ?? 0,
                    ];
                }

                return $this->getDefaultSoketiStats();
            } catch (\Exception $e) {
                Log::warning('Failed to get Soketi stats: ' . $e->getMessage());
                return $this->getDefaultSoketiStats();
            }
        });
    }

    /**
     * Get channels from Soketi API
     */
    public function getSoketiChannels(): array
    {
        try {
            $appId = config('broadcasting.connections.pusher.app_id', 'app-id');
            $appKey = config('broadcasting.connections.pusher.key', 'app-key');
            $appSecret = config('broadcasting.connections.pusher.secret', 'app-secret');
            $host = config('broadcasting.connections.pusher.options.host', '127.0.0.1');
            $port = config('broadcasting.connections.pusher.options.port', 6001);

            // Create signature for Pusher HTTP API
            $path = "/apps/{$appId}/channels";
            $method = 'GET';
            $timestamp = time();
            $queryString = "auth_key={$appKey}&auth_timestamp={$timestamp}&auth_version=1.0";
            $stringToSign = "{$method}\n{$path}\n{$queryString}";
            $signature = hash_hmac('sha256', $stringToSign, $appSecret);

            $response = Http::timeout(5)->get(
                "http://{$host}:{$port}{$path}?{$queryString}&auth_signature={$signature}"
            );

            if ($response->successful()) {
                return $response->json()['channels'] ?? [];
            }

            return [];
        } catch (\Exception $e) {
            Log::warning('Failed to get Soketi channels: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get default Soketi stats when unavailable
     */
    private function getDefaultSoketiStats(): array
    {
        return [
            'connected' => false,
            'connections' => 0,
            'memory' => [],
            'uptime' => 0,
            'peak_connections' => 0,
        ];
    }

    /**
     * Record device activity
     */
    public function recordActivity(Device $device, string $event, ?string $ip = null, array $metadata = []): DeviceActivityLog
    {
        $log = $device->logActivity($event, $ip, $metadata);

        // Update device last active time for heartbeats and connections
        if (in_array($event, [DeviceActivityLog::EVENT_CONNECTED, DeviceActivityLog::EVENT_HEARTBEAT])) {
            $device->markAsActive();
        }

        return $log;
    }

    /**
     * Get recent activity logs
     */
    public function getRecentActivityLogs(int $limit = 50): Collection
    {
        return DeviceActivityLog::with('device.user')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get online devices with user info
     */
    public function getOnlineDevices(int $minutes = 5, int $limit = 50): Collection
    {
        return Device::online($minutes)
            ->with('user')
            ->orderBy('last_active_at', 'desc')
            ->limit($limit)
            ->get();
    }
}
