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
 * Job to generate an AI video asynchronously
 * Runs in queue to avoid blocking HTTP requests
 */
class GenerateVideoJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 180; // 3 minutes max for video
    public int $tries = 2; // Retry once on failure

    public function __construct(
        public AiGeneration $generation
    ) {
    }

    public function handle(AiGenerationService $aiService): void
    {
        $generation = $this->generation;

        Log::info('GenerateVideoJob started', [
            'generation_id' => $generation->id,
            'model' => $generation->model,
            'type' => $generation->type,
            'user_id' => $generation->user_id,
        ]);

        try {
            // Determine generation type and start accordingly
            if ($generation->type === 'video' && $generation->parameters['source_image'] ?? null) {
                // Image-to-video
                $aiService->startImageToVideoGeneration($generation);
            } else {
                // Text-to-video
                $aiService->startVideoGeneration($generation);
            }

            // Poll for completion
            $maxWaitTime = 170; // 2 minutes 50 seconds
            $startTime = time();
            $completed = false;

            while (time() - $startTime < $maxWaitTime) {
                $generation->refresh();

                if ($generation->isCompleted()) {
                    $completed = true;
                    break;
                } elseif ($generation->isFailed()) {
                    throw new \Exception("Video generation failed: " . $generation->error_message);
                }

                // Check status with provider
                $aiService->checkGenerationStatus($generation);

                sleep(10); // Wait 10 seconds between checks (videos take longer)
            }

            if (!$completed) {
                throw new \Exception("Video generation timed out after {$maxWaitTime} seconds");
            }

            Log::info('GenerateVideoJob completed', [
                'generation_id' => $generation->id,
                'status' => $generation->status,
            ]);

        } catch (\Exception $e) {
            Log::error('GenerateVideoJob failed', [
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
        Log::error('GenerateVideoJob permanently failed', [
            'generation_id' => $this->generation->id,
            'error' => $exception->getMessage(),
        ]);

        $this->generation->update([
            'status' => 'failed',
            'error_message' => $exception->getMessage(),
        ]);
    }
}
