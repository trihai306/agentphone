<?php

namespace App\Console\Commands;

use App\Models\WorkflowJob;
use App\Services\JobDispatchService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Dispatch scheduled jobs that are due to run
 * 
 * This command should be registered in the scheduler to run every minute.
 * It finds all pending jobs with scheduled_at <= now() and dispatches them.
 */
class ScheduleJobsCommand extends Command
{
    protected $signature = 'jobs:dispatch-scheduled {--dry-run : Show jobs that would be dispatched without actually dispatching}';

    protected $description = 'Dispatch jobs that are scheduled to run now';

    public function handle(JobDispatchService $dispatchService): int
    {
        $dryRun = $this->option('dry-run');

        // Find pending jobs that are scheduled to run now
        $jobs = WorkflowJob::where('status', WorkflowJob::STATUS_PENDING)
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->with(['device', 'flow'])
            ->get();

        if ($jobs->isEmpty()) {
            $this->info('No scheduled jobs to dispatch.');
            return Command::SUCCESS;
        }

        $this->info("Found {$jobs->count()} scheduled job(s) to process.");

        $dispatched = 0;
        $skipped = 0;

        foreach ($jobs as $job) {
            $jobInfo = "Job #{$job->id} ({$job->name})";

            // Check if device is online
            if (!$job->device) {
                $this->warn("{$jobInfo}: No device assigned, skipping.");
                $skipped++;
                continue;
            }

            if (!$job->device->isOnline()) {
                $this->warn("{$jobInfo}: Device {$job->device->device_id} is offline, skipping.");
                $skipped++;
                continue;
            }

            if ($dryRun) {
                $this->info("[DRY RUN] Would dispatch {$jobInfo} to device {$job->device->device_id}");
                $dispatched++;
                continue;
            }

            // Dispatch the job
            try {
                if ($dispatchService->dispatch($job)) {
                    $this->info("✓ Dispatched {$jobInfo} to device {$job->device->device_id}");
                    $dispatched++;
                } else {
                    $this->error("✗ Failed to dispatch {$jobInfo}");
                    $skipped++;
                }
            } catch (\Exception $e) {
                $this->error("✗ Error dispatching {$jobInfo}: {$e->getMessage()}");
                Log::error("Scheduled job dispatch failed", [
                    'job_id' => $job->id,
                    'error' => $e->getMessage(),
                ]);
                $skipped++;
            }
        }

        $this->newLine();
        $this->info("Summary: Dispatched {$dispatched} job(s), Skipped {$skipped} job(s).");

        if ($dispatched > 0) {
            Log::info("Scheduled jobs dispatch completed", [
                'dispatched' => $dispatched,
                'skipped' => $skipped,
            ]);
        }

        return Command::SUCCESS;
    }
}
