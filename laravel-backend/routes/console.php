<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Sync device presence from Redis to DB every minute
// This is the batch sync that replaces per-event DB writes
Schedule::command('devices:sync-presence')->everyMinute();

// Dispatch scheduled workflow jobs every minute
// Finds pending jobs with scheduled_at <= now() and dispatches them to devices
Schedule::command('jobs:dispatch-scheduled')->everyMinute();

// Check for inactive devices (no heartbeat/socket activity for 5+ minutes)
// Mark them as offline and broadcast status change to frontend
Schedule::command('devices:check-online-status')->everyMinute();
