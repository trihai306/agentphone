<?php

namespace App\Jobs;

use App\Events\AiGenerationCompleted;
use App\Events\AiGenerationFailed;
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
    public int $tries = 1; // No retry - fail fast

    public function __construct(
        public AiGeneration $generation
    ) {
    }

    /**
     * Execute the job
     */
    public function handle(AiGenerationService $aiService): void
    {
        $generation = $this->generation;

        Log::info('GenerateImageJob started', [
            'generation_id' => $generation->id,
            'model' => $generation->model,
            'user_id' => $generation->user_id,
        ]);

        try {
            // Process image generation (handles both sync and async providers)
            $aiService->processImageGeneration($generation);

            // Refresh generation to get updated status
            $generation->refresh();

            // Broadcast completion event via WebSocket
            broadcast(new AiGenerationCompleted($generation));

            Log::info('GenerateImageJob completed successfully', [
                'generation_id' => $generation->id,
                'status' => $generation->status,
            ]);

        } catch (\Exception $e) {
            Log::error('GenerateImageJob failed', [
                'generation_id' => $generation->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Update generation status if not already failed
            if ($generation->status !== AiGeneration::STATUS_FAILED) {
                $generation->update([
                    'status' => AiGeneration::STATUS_FAILED,
                    'error_message' => $e->getMessage(),
                ]);

                // Refund credits
                $generation->user->addAiCredits($generation->credits_used);
            }

            // Broadcast failure event via WebSocket
            broadcast(new AiGenerationFailed($generation->fresh()));

            // Re-throw to mark job as failed
            throw $e;
        }
    }

    /**
     * Handle job failure (called when all retries exhausted)
     */
    public function failed(\Throwable $exception): void
    {
        $generation = $this->generation;

        Log::error('GenerateImageJob permanently failed', [
            'generation_id' => $generation->id,
            'error' => $exception->getMessage(),
        ]);

        // Ensure status is failed
        if ($generation->status !== AiGeneration::STATUS_FAILED) {
            $generation->update([
                'status' => AiGeneration::STATUS_FAILED,
                'error_message' => $exception->getMessage(),
            ]);

            // Refund credits if not already done
            $generation->user->addAiCredits($generation->credits_used);

            // Broadcast failure event
            broadcast(new AiGenerationFailed($generation));
        }
    }
}
