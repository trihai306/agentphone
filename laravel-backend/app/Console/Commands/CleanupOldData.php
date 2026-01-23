<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\ApiLog;
use App\Models\ActivityLog;
use App\Models\DeviceActivityLog;
use App\Models\JobLog;
use App\Models\InteractionHistory;
use App\Models\RecordingSession;
use App\Models\NotificationRead;
use App\Models\WorkflowJob;

class CleanupOldData extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'cleanup:old-data 
                            {--days=30 : Number of days to keep data}
                            {--dry-run : Show what would be deleted without actually deleting}
                            {--force : Skip confirmation}';

    /**
     * The console command description.
     */
    protected $description = 'Clean up old logs, sessions, and unused data to save database resources';

    /**
     * Data cleanup configuration
     * [Model/Table => Days to keep]
     */
    protected array $cleanupConfig = [
        'api_logs' => 7,              // API logs: 7 days
        'activity_logs' => 30,          // Activity logs: 30 days
        'device_activity_logs' => 14,  // Device activity: 14 days
        'job_logs' => 14,              // Job logs: 14 days
        'interaction_histories' => 30, // Interaction history: 30 days
        'recording_sessions' => 7,     // Recording sessions: 7 days
        'notification_reads' => 60,    // Notification reads: 60 days
        'sessions' => 7,               // Laravel sessions: 7 days
        'cache' => 1,                  // Cache entries: 1 day (expired)
        'failed_jobs' => 30,           // Failed jobs: 30 days
        'completed_jobs' => 30,        // Completed workflow jobs: 30 days
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $defaultDays = (int) $this->option('days');
        $dryRun = $this->option('dry-run');
        $force = $this->option('force');

        $this->info('🧹 Starting data cleanup...');
        $this->newLine();

        if ($dryRun) {
            $this->warn('⚠️  DRY RUN MODE - No data will be deleted');
            $this->newLine();
        }

        $totalDeleted = 0;
        $results = [];

        foreach ($this->cleanupConfig as $table => $days) {
            $result = $this->cleanupTable($table, $days, $dryRun);
            $results[$table] = $result;
            $totalDeleted += $result['deleted'];
        }

        // Display results
        $this->newLine();
        $this->table(
            ['Table', 'Days Kept', 'Records Deleted', 'Space Freed'],
            collect($results)->map(fn($r, $table) => [
                $table,
                $r['days'],
                number_format($r['deleted']),
                $this->formatBytes($r['size_freed'] ?? 0),
            ])->toArray()
        );

        $this->newLine();
        $this->info("✅ Total records " . ($dryRun ? 'would be ' : '') . "deleted: " . number_format($totalDeleted));

        // Additional cleanup tasks
        $this->cleanupTempFiles($dryRun);
        $this->cleanupExpiredTokens($dryRun);
        $this->optimizeTables($dryRun);

        $this->newLine();
        $this->info('🎉 Cleanup completed successfully!');

        return Command::SUCCESS;
    }

    /**
     * Cleanup a specific table
     */
    protected function cleanupTable(string $table, int $days, bool $dryRun): array
    {
        $cutoffDate = now()->subDays($days);
        $deleted = 0;
        $sizeFreed = 0;

        try {
            switch ($table) {
                case 'api_logs':
                    $query = DB::table('api_logs')->where('created_at', '<', $cutoffDate);
                    break;

                case 'activity_logs':
                    $query = DB::table('activity_logs')->where('created_at', '<', $cutoffDate);
                    break;

                case 'device_activity_logs':
                    $query = DB::table('device_activity_logs')->where('created_at', '<', $cutoffDate);
                    break;

                case 'job_logs':
                    $query = DB::table('job_logs')->where('created_at', '<', $cutoffDate);
                    break;

                case 'interaction_histories':
                    $query = DB::table('interaction_histories')->where('created_at', '<', $cutoffDate);
                    break;

                case 'recording_sessions':
                    $query = DB::table('recording_sessions')->where('created_at', '<', $cutoffDate);
                    break;

                case 'notification_reads':
                    $query = DB::table('notification_reads')->where('created_at', '<', $cutoffDate);
                    break;

                case 'sessions':
                    $query = DB::table('sessions')->where('last_activity', '<', $cutoffDate->timestamp);
                    break;

                case 'cache':
                    // Only delete expired cache entries
                    $query = DB::table('cache')->where('expiration', '<', now()->timestamp);
                    break;

                case 'failed_jobs':
                    $query = DB::table('failed_jobs')->where('failed_at', '<', $cutoffDate);
                    break;

                case 'completed_jobs':
                    $query = WorkflowJob::where('status', WorkflowJob::STATUS_COMPLETED)
                        ->where('updated_at', '<', $cutoffDate);
                    break;

                default:
                    return ['days' => $days, 'deleted' => 0, 'size_freed' => 0];
            }

            $deleted = $query->count();

            if (!$dryRun && $deleted > 0) {
                // Delete in chunks to avoid memory issues
                if ($table === 'completed_jobs') {
                    $query->chunkById(1000, function ($records) {
                        WorkflowJob::whereIn('id', $records->pluck('id'))->delete();
                    });
                } else {
                    $query->delete();
                }
            }

            $this->line("  📋 {$table}: " . ($dryRun ? 'Would delete ' : 'Deleted ') . number_format($deleted) . " records (older than {$days} days)");

        } catch (\Exception $e) {
            $this->error("  ❌ {$table}: Error - " . $e->getMessage());
        }

        return [
            'days' => $days,
            'deleted' => $deleted,
            'size_freed' => $sizeFreed,
        ];
    }

    /**
     * Cleanup temporary files
     */
    protected function cleanupTempFiles(bool $dryRun): void
    {
        $this->newLine();
        $this->info('🗂️  Cleaning up temporary files...');

        $tempPaths = [
            storage_path('app/temp'),
            storage_path('app/chunks'),
            storage_path('logs/*.log'),
        ];

        $totalSize = 0;
        $totalFiles = 0;

        foreach ($tempPaths as $path) {
            if (str_contains($path, '*.log')) {
                // Handle log rotation - keep last 7 days
                $logDir = dirname($path);
                if (is_dir($logDir)) {
                    $files = glob($logDir . '/*.log');
                    foreach ($files as $file) {
                        if (filemtime($file) < now()->subDays(7)->timestamp && basename($file) !== 'laravel.log') {
                            $totalSize += filesize($file);
                            $totalFiles++;
                            if (!$dryRun) {
                                @unlink($file);
                            }
                        }
                    }
                }
            } elseif (is_dir($path)) {
                $files = glob($path . '/*');
                foreach ($files as $file) {
                    if (is_file($file) && filemtime($file) < now()->subDays(1)->timestamp) {
                        $totalSize += filesize($file);
                        $totalFiles++;
                        if (!$dryRun) {
                            @unlink($file);
                        }
                    }
                }
            }
        }

        $this->line("  📁 " . ($dryRun ? 'Would delete ' : 'Deleted ') . "{$totalFiles} temp files ({$this->formatBytes($totalSize)})");
    }

    /**
     * Cleanup expired API tokens
     */
    protected function cleanupExpiredTokens(bool $dryRun): void
    {
        $this->newLine();
        $this->info('🔑 Cleaning up expired tokens...');

        try {
            // Clean expired personal access tokens (Sanctum)
            $expiredTokens = DB::table('personal_access_tokens')
                ->whereNotNull('expires_at')
                ->where('expires_at', '<', now())
                ->count();

            if (!$dryRun && $expiredTokens > 0) {
                DB::table('personal_access_tokens')
                    ->whereNotNull('expires_at')
                    ->where('expires_at', '<', now())
                    ->delete();
            }

            $this->line("  🔐 " . ($dryRun ? 'Would delete ' : 'Deleted ') . "{$expiredTokens} expired tokens");

        } catch (\Exception $e) {
            $this->warn("  ⚠️  Token cleanup skipped: " . $e->getMessage());
        }
    }

    /**
     * Optimize database tables
     */
    protected function optimizeTables(bool $dryRun): void
    {
        if ($dryRun) {
            $this->newLine();
            $this->info('🔧 Would optimize database tables (skipped in dry-run)');
            return;
        }

        $this->newLine();
        $this->info('🔧 Optimizing database tables...');

        $tables = [
            'api_logs',
            'activity_log',
            'device_activity_logs',
            'job_logs',
            'workflow_jobs',
            'sessions',
        ];

        foreach ($tables as $table) {
            try {
                DB::statement("OPTIMIZE TABLE {$table}");
                $this->line("  ✅ Optimized: {$table}");
            } catch (\Exception $e) {
                // MySQL might not support OPTIMIZE for InnoDB, try ANALYZE instead
                try {
                    DB::statement("ANALYZE TABLE {$table}");
                    $this->line("  ✅ Analyzed: {$table}");
                } catch (\Exception $e2) {
                    // Skip if table doesn't exist
                }
            }
        }
    }

    /**
     * Format bytes to human readable
     */
    protected function formatBytes(int $bytes): string
    {
        if ($bytes === 0)
            return '0 B';

        $units = ['B', 'KB', 'MB', 'GB'];
        $exp = floor(log($bytes, 1024));

        return round($bytes / pow(1024, $exp), 2) . ' ' . $units[$exp];
    }
}
