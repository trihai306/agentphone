<?php

namespace App\Console\Commands;

use App\Models\RecordingSession;
use Illuminate\Console\Command;

class CleanupAbandonedRecordingSessions extends Command
{
    protected $signature = 'recording:cleanup {--hours=24 : Hours threshold for abandoned sessions}';

    protected $description = 'Mark abandoned recording sessions (started/recording but never stopped) as failed';

    public function handle(): int
    {
        $hours = (int) $this->option('hours');

        $abandoned = RecordingSession::whereIn('status', ['started', 'recording'])
            ->where('created_at', '<', now()->subHours($hours))
            ->get();

        if ($abandoned->isEmpty()) {
            $this->info('No abandoned sessions found.');
            return self::SUCCESS;
        }

        $count = $abandoned->count();
        $abandoned->each(function (RecordingSession $session) {
            $session->update([
                'status' => 'failed',
                'stopped_at' => now(),
                'event_count' => count($session->actions ?? []),
            ]);
        });

        $this->info("Cleaned up {$count} abandoned recording session(s).");

        return self::SUCCESS;
    }
}
