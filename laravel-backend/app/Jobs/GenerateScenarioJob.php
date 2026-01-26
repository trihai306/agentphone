<?php

namespace App\Jobs;

use App\Models\AiScenario;
use App\Models\AiScenarioScene;
use App\Services\AiScenarioService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job to generate all scenes in a scenario sequentially
 * Uses frame chaining: extracts last frame of each scene to use as input for next scene
 */
class GenerateScenarioJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 1800; // 30 minutes max for entire scenario
    public int $tries = 1; // Don't retry automatically

    public function __construct(
        public AiScenario $scenario
    ) {
    }

    public function handle(AiScenarioService $scenarioService): void
    {
        $scenario = $this->scenario;
        $user = $scenario->user;
        $totalCredits = $scenario->total_credits;

        Log::info('GenerateScenarioJob started', [
            'scenario_id' => $scenario->id,
            'total_scenes' => $scenario->scenes()->count(),
        ]);

        try {
            // Validate credits
            if (!$user->hasEnoughCredits($totalCredits)) {
                throw new \Exception("Insufficient credits. Required: {$totalCredits}, Available: {$user->ai_credits}");
            }

            // Update scenario status
            $scenario->update(['status' => AiScenario::STATUS_GENERATING]);

            $characters = $scenario->characters ?? [];
            $pendingScenes = $scenario->scenes()->pending()->orderBy('order')->get();

            // Always use frame chain mode in Job
            $this->generateWithFrameChaining($scenarioService, $scenario, $pendingScenes, $characters);

            // Update final status
            $scenarioService->updateScenarioStatus($scenario);

            Log::info('GenerateScenarioJob completed', [
                'scenario_id' => $scenario->id,
                'status' => $scenario->fresh()->status,
            ]);

        } catch (\Exception $e) {
            Log::error('GenerateScenarioJob failed', [
                'scenario_id' => $scenario->id,
                'error' => $e->getMessage(),
            ]);

            $scenario->update([
                'status' => AiScenario::STATUS_FAILED,
                'error_message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Generate scenes sequentially with frame chaining
     */
    protected function generateWithFrameChaining(
        AiScenarioService $scenarioService,
        AiScenario $scenario,
        $scenes,
        array $characters = []
    ): void {
        $previousFramePath = null;

        foreach ($scenes as $scene) {
            try {
                // Apply character consistency
                if (!empty($characters)) {
                    $this->applyCharacterConsistency($scenarioService, $scene, $characters);
                }

                // If we have a previous frame and this isn't the first scene, use it as reference
                if ($previousFramePath && $scene->order > 1) {
                    $scene->update(['reference_image_path' => $previousFramePath]);

                    // For Image-to-Video, also set source_image_path if not already set
                    if (empty($scene->source_image_path)) {
                        $scene->update(['source_image_path' => $previousFramePath]);
                    }

                    Log::info('Using previous frame for scene', [
                        'scenario_id' => $scenario->id,
                        'scene_order' => $scene->order,
                        'frame_path' => $previousFramePath,
                    ]);
                }

                // Generate the scene
                $generation = $scenarioService->generateScene($scene);

                // Wait for generation to complete (polling)
                $maxWaitTime = 300; // 5 minutes max per scene
                $startTime = time();
                $completed = false;

                while (time() - $startTime < $maxWaitTime) {
                    $generation->refresh();

                    if ($generation->isCompleted()) {
                        $completed = true;
                        break;
                    } elseif ($generation->isFailed()) {
                        throw new \Exception("Scene generation failed: " . $generation->error_message);
                    }

                    // Check status with provider
                    app(\App\Services\AiGenerationService::class)->checkGenerationStatus($generation);

                    sleep(5); // Wait 5 seconds between checks
                }

                if (!$completed) {
                    throw new \Exception("Scene generation timed out after {$maxWaitTime} seconds");
                }

                // Update scene status
                $scene->update(['status' => AiScenarioScene::STATUS_COMPLETED]);

                Log::info('Scene completed', [
                    'scenario_id' => $scenario->id,
                    'scene_order' => $scene->order,
                ]);

                // Extract last frame for the next scene (only for video output)
                if ($scenario->output_type === 'video' && $generation->result_path) {
                    $extractedFrame = $this->extractLastFrame($generation->result_path);
                    if ($extractedFrame) {
                        $previousFramePath = $extractedFrame;
                        Log::info('Frame extracted for chaining', [
                            'from_scene' => $scene->order,
                            'frame_path' => $extractedFrame,
                        ]);
                    }
                }

            } catch (\Exception $e) {
                Log::error('Scene generation failed in chain mode', [
                    'scenario_id' => $scenario->id,
                    'scene_id' => $scene->id,
                    'scene_order' => $scene->order,
                    'error' => $e->getMessage(),
                ]);

                $scene->update([
                    'status' => AiScenarioScene::STATUS_FAILED,
                    'error_message' => $e->getMessage(),
                ]);

                // In chain mode, stop on first failure to maintain consistency
                break;
            }
        }
    }

    /**
     * Apply character consistency to a scene's prompt
     */
    protected function applyCharacterConsistency(AiScenarioService $service, AiScenarioScene $scene, array $characters): void
    {
        $suffix = $this->buildCharacterPromptSuffix($characters, $scene->order);

        if (!empty($suffix) && !str_contains($scene->prompt, '[CHARACTER CONSISTENCY')) {
            $scene->update([
                'prompt' => $scene->prompt . $suffix,
                'character_refs' => $characters,
            ]);
        }
    }

    /**
     * Build character prompt suffix for consistency across scenes
     */
    protected function buildCharacterPromptSuffix(array $characters, int $sceneOrder): string
    {
        if (empty($characters)) {
            return '';
        }

        $suffix = "\n\n[CHARACTER CONSISTENCY - IMPORTANT]\n";
        $suffix .= "Maintain consistent appearance for these characters:\n";

        foreach ($characters as $index => $char) {
            $name = $char['name'] ?? 'Character ' . ($index + 1);
            $description = $char['description'] ?? '';
            $referenceNote = !empty($char['reference_image']) ? ' (see reference image)' : '';

            $suffix .= "- {$name}: {$description}{$referenceNote}\n";
        }

        if ($sceneOrder > 1) {
            $suffix .= "\nThis is Scene {$sceneOrder}. Characters MUST look identical to previous scenes.";
        }

        return $suffix;
    }

    /**
     * Extract the last frame from a video using FFmpeg
     */
    protected function extractLastFrame(string $videoPath): ?string
    {
        try {
            $ffmpegPath = config('ai-generation.ffmpeg_path', '/usr/local/bin/ffmpeg');
            if (!file_exists($ffmpegPath) && !$this->commandExists('ffmpeg')) {
                Log::warning('FFmpeg not found, frame extraction disabled');
                return null;
            }

            $disk = config('ai-generation.storage.disk', 'public');
            $fullVideoPath = \Storage::disk($disk)->path($videoPath);

            if (!file_exists($fullVideoPath)) {
                Log::error('Video file not found for frame extraction', ['path' => $fullVideoPath]);
                return null;
            }

            // Generate output path for the frame
            $frameName = pathinfo($videoPath, PATHINFO_FILENAME) . '_last_frame.jpg';
            $frameDir = dirname($videoPath);
            $framePath = $frameDir . '/' . $frameName;
            $fullFramePath = \Storage::disk($disk)->path($framePath);

            // FFmpeg command to extract last frame
            $command = sprintf(
                '%s -sseof -1 -i %s -vframes 1 -q:v 2 %s -y 2>&1',
                escapeshellcmd($ffmpegPath),
                escapeshellarg($fullVideoPath),
                escapeshellarg($fullFramePath)
            );

            exec($command, $output, $returnCode);

            if ($returnCode !== 0 || !file_exists($fullFramePath)) {
                Log::error('FFmpeg frame extraction failed', [
                    'command' => $command,
                    'returnCode' => $returnCode,
                ]);
                return null;
            }

            return asset('storage/' . $framePath);

        } catch (\Exception $e) {
            Log::error('Frame extraction error', [
                'video' => $videoPath,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Check if a command exists in the system
     */
    protected function commandExists(string $command): bool
    {
        $whereCmd = PHP_OS_FAMILY === 'Windows' ? 'where' : 'which';
        $result = shell_exec("$whereCmd $command 2>/dev/null");
        return !empty($result);
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('GenerateScenarioJob completely failed', [
            'scenario_id' => $this->scenario->id,
            'error' => $exception->getMessage(),
        ]);

        $this->scenario->update([
            'status' => AiScenario::STATUS_FAILED,
            'error_message' => $exception->getMessage(),
        ]);
    }
}
