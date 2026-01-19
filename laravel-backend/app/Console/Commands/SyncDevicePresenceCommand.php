<?php

namespace App\Console\Commands;

use App\Services\DevicePresenceService;
use Illuminate\Console\Command;

class SyncDevicePresenceCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'devices:sync-presence';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync device online status from Redis to database';

    /**
     * Execute the console command.
     */
    public function handle(DevicePresenceService $presenceService): int
    {
        $count = $presenceService->syncToDatabase();

        $this->info("✅ Synced device presence: {$count} devices online");

        return Command::SUCCESS;
    }
}
