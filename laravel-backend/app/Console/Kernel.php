<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use Illuminate\Support\Facades\Cache;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Các schedules được định nghĩa trong routes/console.php
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }

    /**
     * Track schedule execution for monitoring
     */
    public static function trackScheduleRun(string $command, bool $success = true, ?string $error = null): void
    {
        Cache::put('schedule_last_run:' . $command, [
            'time' => now()->format('d/m H:i:s'),
            'status' => $success ? 'success' : 'failed',
            'error' => $error,
        ], now()->addHours(24));
    }
}
