<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Cache;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Helper to track schedule runs
$trackRun = function ($command) {
    Cache::put('schedule_last_run:' . $command, [
        'time' => now()->format('d/m H:i:s'),
        'status' => 'success',
    ], now()->addHours(24));
};

// =============================================
// DEVICE & JOB MANAGEMENT (Every Minute)
// =============================================

Schedule::command('devices:sync-presence')
    ->everyThirtySeconds()  // Increased from everyMinute to reduce race condition window (TTL is 60s)
    ->onSuccess(fn() => Cache::put('schedule_last_run:devices:sync-presence', ['time' => now()->format('d/m H:i:s'), 'status' => 'success'], now()->addHours(24)));

Schedule::command('jobs:dispatch-scheduled')
    ->everyMinute()
    ->onSuccess(fn() => Cache::put('schedule_last_run:jobs:dispatch-scheduled', ['time' => now()->format('d/m H:i:s'), 'status' => 'success'], now()->addHours(24)));

Schedule::command('devices:check-online-status')
    ->everyMinute()
    ->onSuccess(fn() => Cache::put('schedule_last_run:devices:check-online-status', ['time' => now()->format('d/m H:i:s'), 'status' => 'success'], now()->addHours(24)));

// =============================================
// DATA CLEANUP (Daily at 3 AM)
// =============================================

Schedule::command('cleanup:old-data --force')
    ->dailyAt('03:00')
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/cleanup.log'))
    ->onSuccess(fn() => Cache::put('schedule_last_run:cleanup:old-data', ['time' => now()->format('d/m H:i:s'), 'status' => 'success'], now()->addHours(24)));

// =============================================
// MAINTENANCE (Weekly)
// =============================================

Schedule::command('cache:prune-stale-tags')
    ->weekly()
    ->sundays()
    ->at('04:00')
    ->onSuccess(fn() => Cache::put('schedule_last_run:cache:prune-stale-tags', ['time' => now()->format('d/m H:i:s'), 'status' => 'success'], now()->addHours(24)));

// =============================================
// NOTIFICATIONS (Hourly - disabled for now)
// =============================================

// Schedule::command('notifications:send-scheduled')
//     ->hourly()
//     ->withoutOverlapping();
