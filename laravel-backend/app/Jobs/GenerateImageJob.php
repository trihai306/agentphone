<?php

namespace App\Jobs;

use App\Models\AiGeneration;
use App\Services\AiGenerationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job to generate an AI image asynchronously
 * Runs in queue to avoid blocking HTTP requests
 */
class GenerateImageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300; // 5 minutes max
    public int $tries = 2; // Retry once on failure

    public function __construct(
        public AiGeneration $generation
    ) {
    }

    public function handle(AiGenerationService $aiService): void
    {
        $generation = $this->generation;

        Log::info('GenerateImageJob started', [
            'generation_id' => $generation->id,
            'model' => $generation->model,
            'user_id' => $generation->user_id,
        ]);

        try {
            // Start generation with provider
            $aiService->startImageGeneration($generation);

            // Poll for completion
            $maxWaitTime = 240; // 4 minutes
            $startTime = time();
            $completed = false;

            while (time() - $startTime < $maxWaitTime) {
                $generation->refresh();

                if ($generation->isCompleted()) {
                    $completed = true;
                    break;
                } elseif ($generation->isFailed()) {
                    throw new \Exception("Image generation failed: " . $generation->error_message);
                }

                // Check status with provider
                $aiService->checkGenerationStatus($generation);

                sleep(5); // Wait 5 seconds between checks
            }

            if (!$completed) {
                throw new \Exception("Image generation timed out after {$maxWaitTime} seconds");
            }

            Log::info('GenerateImageJob completed', [
                'generation_id' => $generation->id,
                'status' => $generation->status,
            ]);

        } catch (\Exception $e) {
            Log::error('GenerateImageJob failed', [
                'generation_id' => $generation->id,
                'error' => $e->getMessage(),
            ]);

            $generation->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            throw $e; // Re-throw to trigger retry mechanism
        }
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('GenerateImageJob permanently failed', [
            'generation_id' => $this->generation->id,
            'error' => $exception->getMessage(),
        ]);

        $this->generation->update([
            'status' => 'failed',
            'error_message' => $exception->getMessage(),
        ]);
    }
}
