<?php

namespace App\Console\Commands;

use App\Events\DeviceStatusChanged;
use App\Models\Device;
use Illuminate\Console\Command;

/**
 * Check devices that haven't sent heartbeat/socket activity in 5 minutes
 * Mark them as offline and broadcast to frontend
 */
class CheckDeviceOnlineStatus extends Command
{
    protected $signature = 'devices:check-online-status 
                            {--timeout=5 : Minutes of inactivity before marking offline}';

    protected $description = 'Mark devices as offline if no activity for 5+ minutes and broadcast to FE';

    public function handle(): int
    {
        $timeoutMinutes = (int) $this->option('timeout');
        $cutoffTime = now()->subMinutes($timeoutMinutes);

        // Find devices that are marked as online/socket_connected but inactive
        $staleDevices = Device::where('socket_connected', true)
            ->where('last_active_at', '<', $cutoffTime)
            ->get();

        if ($staleDevices->isEmpty()) {
            $this->info("✅ All devices are active (0 stale devices found)");
            return Command::SUCCESS;
        }

        $this->info("⚠️ Found {$staleDevices->count()} stale devices (inactive > {$timeoutMinutes} min)");

        foreach ($staleDevices as $device) {
            $minutesInactive = $device->last_active_at->diffInMinutes(now());

            // Update device status to offline
            $device->update([
                'socket_connected' => false,
            ]);

            // Broadcast status change to frontend
            try {
                broadcast(new DeviceStatusChanged($device, 'offline'))->toOthers();
                $this->line("  📤 Broadcast offline: {$device->name} (inactive {$minutesInactive}m)");
            } catch (\Exception $e) {
                $this->error("  ❌ Broadcast failed for {$device->name}: {$e->getMessage()}");
            }
        }

        $this->info("✅ Marked {$staleDevices->count()} devices as offline");

        return Command::SUCCESS;
    }
}
