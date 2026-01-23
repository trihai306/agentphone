<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// =============================================
// DEVICE & JOB MANAGEMENT (Every Minute)
// =============================================

// Sync device presence from Redis to DB every minute
Schedule::command('devices:sync-presence')->everyMinute();

// Dispatch scheduled workflow jobs every minute
Schedule::command('jobs:dispatch-scheduled')->everyMinute();

// Check for inactive devices (no heartbeat for 5+ minutes)
Schedule::command('devices:check-online-status')->everyMinute();

// =============================================
// DATA CLEANUP (Daily at 3 AM)
// =============================================

// Clean up old logs and unused data
Schedule::command('cleanup:old-data --force')
    ->dailyAt('03:00')
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/cleanup.log'));

// =============================================
// MAINTENANCE (Weekly)
// =============================================

// Clear expired cache entries
Schedule::command('cache:prune-stale-tags')
    ->weekly()
    ->sundays()
    ->at('04:00');

// Prune old telescope entries (if using telescope)
// Schedule::command('telescope:prune --hours=48')->daily();

// =============================================
// NOTIFICATIONS (Hourly)
// =============================================

// Send scheduled notifications
Schedule::command('notifications:send-scheduled')
    ->hourly()
    ->withoutOverlapping();
