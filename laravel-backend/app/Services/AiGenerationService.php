<?php

namespace App\Services;

use App\Models\AiGeneration;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AiGenerationService
{
    protected ?ReplicateApiClient $replicateClient = null;

    public function __construct()
    {
        // Lazy loading - client will be created when needed
    }

    /**
     * Get or create the Replicate API client
     */
    protected function getReplicateClient(): ReplicateApiClient
    {
        if ($this->replicateClient === null) {
            $this->replicateClient = new ReplicateApiClient();
        }
        return $this->replicateClient;
    }

    /**
     * Generate an image
     */
    public function generateImage(User $user, array $params): AiGeneration
    {
        $model = $params['model'] ?? 'flux-1.1-pro';
        $prompt = $params['prompt'];
        $negativePrompt = $params['negative_prompt'] ?? null;
        $width = $params['width'] ?? config("ai-generation.models.image.{$model}.default_width", 1024);
        $height = $params['height'] ?? config("ai-generation.models.image.{$model}.default_height", 1024);

        // Calculate cost
        $cost = $this->calculateImageCost($model, $params);

        // Validate credits
        if (!$user->hasEnoughCredits($cost)) {
            throw new \Exception("Insufficient credits. Required: {$cost}, Available: {$user->ai_credits}");
        }

        // Start transaction
        return DB::transaction(function () use ($user, $model, $prompt, $negativePrompt, $width, $height, $cost, $params) {
            // Deduct credits
            $user->deductAiCredits($cost);

            // Create generation record
            $generation = AiGeneration::create([
                'user_id' => $user->id,
                'type' => AiGeneration::TYPE_IMAGE,
                'model' => $model,
                'prompt' => $prompt,
                'negative_prompt' => $negativePrompt,
                'parameters' => [
                    'width' => $width,
                    'height' => $height,
                    ...$params,
                ],
                'credits_used' => $cost,
                'status' => AiGeneration::STATUS_PENDING,
            ]);

            // Create transaction record
            Transaction::create([
                'user_id' => $user->id,
                'wallet_id' => null,
                'ai_generation_id' => $generation->id,
                'type' => Transaction::TYPE_AI_GENERATION,
                'amount' => $cost,
                'final_amount' => $cost,
                'status' => Transaction::STATUS_COMPLETED,
                'payment_method' => 'ai_credits',
                'user_note' => "AI Image Generation: {$prompt}",
                'completed_at' => now(),
            ]);

            // Start async generation
            $this->startImageGeneration($generation);

            return $generation->fresh();
        });
    }

    /**
     * Generate a video
     */
    public function generateVideo(User $user, array $params): AiGeneration
    {
        $model = $params['model'] ?? 'kling-2.0';
        $prompt = $params['prompt'];
        $duration = $params['duration'] ?? config("ai-generation.models.video.{$model}.default_duration", 5);

        // Calculate cost
        $cost = $this->calculateVideoCost($model, $params);

        // Validate credits
        if (!$user->hasEnoughCredits($cost)) {
            throw new \Exception("Insufficient credits. Required: {$cost}, Available: {$user->ai_credits}");
        }

        // Start transaction
        return DB::transaction(function () use ($user, $model, $prompt, $duration, $cost, $params) {
            // Deduct credits
            $user->deductAiCredits($cost);

            // Create generation record
            $generation = AiGeneration::create([
                'user_id' => $user->id,
                'type' => AiGeneration::TYPE_VIDEO,
                'model' => $model,
                'prompt' => $prompt,
                'parameters' => [
                    'duration' => $duration,
                    ...$params,
                ],
                'credits_used' => $cost,
                'status' => AiGeneration::STATUS_PENDING,
            ]);

            // Create transaction record
            Transaction::create([
                'user_id' => $user->id,
                'wallet_id' => null,
                'ai_generation_id' => $generation->id,
                'type' => Transaction::TYPE_AI_GENERATION,
                'amount' => $cost,
                'final_amount' => $cost,
                'status' => Transaction::STATUS_COMPLETED,
                'payment_method' => 'ai_credits',
                'user_note' => "AI Video Generation: {$prompt}",
                'completed_at' => now(),
            ]);

            // Start async generation
            $this->startVideoGeneration($generation);

            return $generation->fresh();
        });
    }

    /**
     * Calculate cost for image generation
     */
    public function calculateImageCost(string $model, array $params): int
    {
        $baseCost = config("ai-generation.models.image.{$model}.credits_per_image", 10);

        // Apply modifiers based on parameters
        $multiplier = 1.0;

        // HD/size multiplier
        $width = $params['width'] ?? config("ai-generation.models.image.{$model}.default_width");
        $height = $params['height'] ?? config("ai-generation.models.image.{$model}.default_height");
        if ($width > 1024 || $height > 1024) {
            $multiplier *= config('ai-generation.cost_modifiers.hd_multiplier', 1.5);
        }

        // Quality/steps multiplier
        $steps = $params['num_inference_steps'] ?? 0;
        if ($steps > 30) {
            $multiplier *= config('ai-generation.cost_modifiers.high_quality_multiplier', 1.3);
        }

        return (int) ceil($baseCost * $multiplier);
    }

    /**
     * Calculate cost for video generation
     */
    public function calculateVideoCost(string $model, array $params): int
    {
        $costPerSecond = config("ai-generation.models.video.{$model}.credits_per_second", 10);
        $duration = $params['duration'] ?? config("ai-generation.models.video.{$model}.default_duration", 5);

        $baseCost = $costPerSecond * $duration;

        // Apply resolution modifier for 1080p
        $resolution = $params['resolution'] ?? config("ai-generation.models.video.{$model}.default_resolution");
        if ($resolution === '1080p') {
            $baseCost *= 1.5;
        }

        return (int) ceil($baseCost);
    }

    /**
     * Start async image generation
     */
    protected function startImageGeneration(AiGeneration $generation): void
    {
        try {
            $model = $generation->model;
            $modelVersion = config("ai-generation.models.image.{$model}.version");
            $params = $generation->parameters;

            // Prepare input for Replicate
            $input = [
                'prompt' => $generation->prompt,
                'width' => $params['width'] ?? 1024,
                'height' => $params['height'] ?? 1024,
            ];

            if ($generation->negative_prompt) {
                $input['negative_prompt'] = $generation->negative_prompt;
            }

            // Merge model-specific parameters
            $modelParams = config("ai-generation.models.image.{$model}.parameters", []);
            $input = array_merge($input, $modelParams, $params);

            // Call Replicate API
            $prediction = $this->getReplicateClient()->predict($modelVersion, $input);

            // Update generation with provider ID
            $generation->update([
                'provider_id' => $prediction['id'],
                'status' => AiGeneration::STATUS_PROCESSING,
                'provider_metadata' => $prediction,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to start image generation', [
                'generation_id' => $generation->id,
                'error' => $e->getMessage(),
            ]);

            $generation->update([
                'status' => AiGeneration::STATUS_FAILED,
                'error_message' => $e->getMessage(),
            ]);

            // Refund credits
            $generation->user->addAiCredits($generation->credits_used);
        }
    }

    /**
     * Start async video generation
     */
    protected function startVideoGeneration(AiGeneration $generation): void
    {
        try {
            $model = $generation->model;
            $modelVersion = config("ai-generation.models.video.{$model}.version");
            $params = $generation->parameters;

            // Prepare input for Replicate
            $input = [
                'prompt' => $generation->prompt,
                'duration' => $params['duration'] ?? 5,
            ];

            // Add resolution data
            $resolution = $params['resolution'] ?? config("ai-generation.models.video.{$model}.default_resolution");
            $resolutionData = config("ai-generation.models.video.{$model}.resolutions.{$resolution}");
            if ($resolutionData) {
                $input['width'] = $resolutionData['width'];
                $input['height'] = $resolutionData['height'];
            }

            // Merge model-specific parameters
            $modelParams = config("ai-generation.models.video.{$model}.parameters", []);
            $input = array_merge($input, $modelParams);

            // Call Replicate API
            $prediction = $this->getReplicateClient()->predict($modelVersion, $input);

            // Update generation with provider ID
            $generation->update([
                'provider_id' => $prediction['id'],
                'status' => AiGeneration::STATUS_PROCESSING,
                'provider_metadata' => $prediction,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to start video generation', [
                'generation_id' => $generation->id,
                'error' => $e->getMessage(),
            ]);

            $generation->update([
                'status' => AiGeneration::STATUS_FAILED,
                'error_message' => $e->getMessage(),
            ]);

            // Refund credits
            $generation->user->addAiCredits($generation->credits_used);
        }
    }

    /**
     * Check generation status and update
     */
    public function checkGenerationStatus(AiGeneration $generation): AiGeneration
    {
        if (!$generation->provider_id || $generation->isCompleted() || $generation->isFailed()) {
            return $generation;
        }

        try {
            $prediction = $this->getReplicateClient()->getPrediction($generation->provider_id);
            $status = $prediction['status'] ?? '';

            $generation->provider_metadata = $prediction;

            if ($status === 'succeeded') {
                $this->handleSuccessfulGeneration($generation, $prediction);
            } elseif (in_array($status, ['failed', 'canceled'])) {
                $generation->update([
                    'status' => AiGeneration::STATUS_FAILED,
                    'error_message' => $prediction['error'] ?? 'Generation failed or was canceled',
                ]);

                // Refund credits
                $generation->user->addAiCredits($generation->credits_used);
            }

            $generation->save();

        } catch (\Exception $e) {
            Log::error('Failed to check generation status', [
                'generation_id' => $generation->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $generation->fresh();
    }

    /**
     * Handle successful generation - download and store result
     */
    protected function handleSuccessfulGeneration(AiGeneration $generation, array $prediction): void
    {
        try {
            $output = $prediction['output'] ?? null;

            if (!$output) {
                throw new \Exception('No output in prediction result');
            }

            // Output can be a URL string or array of URLs
            $url = is_array($output) ? $output[0] : $output;

            // Download file
            $fileContent = file_get_contents($url);

            if ($fileContent === false) {
                throw new \Exception('Failed to download generation result');
            }

            // Determine file extension
            $extension = $generation->type === AiGeneration::TYPE_IMAGE ? 'png' : 'mp4';
            $pathPrefix = $generation->type === AiGeneration::TYPE_IMAGE
                ? config('ai-generation.storage.image_path')
                : config('ai-generation.storage.video_path');

            // Generate filename
            $filename = $generation->id . '_' . time() . '.' . $extension;
            $path = $pathPrefix . '/' . $filename;

            // Store file
            $disk = config('ai-generation.storage.disk');
            Storage::disk($disk)->put($path, $fileContent);

            // Update generation
            $generation->update([
                'status' => AiGeneration::STATUS_COMPLETED,
                'result_url' => $url,
                'result_path' => $path,
                'processing_time' => $prediction['metrics']['predict_time'] ?? null,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to handle successful generation', [
                'generation_id' => $generation->id,
                'error' => $e->getMessage(),
            ]);

            $generation->update([
                'status' => AiGeneration::STATUS_FAILED,
                'error_message' => 'Failed to download result: ' . $e->getMessage(),
            ]);

            // Refund credits
            $generation->user->addAiCredits($generation->credits_used);
        }
    }

    /**
     * Get available models for a specific type
     */
    public function getAvailableModels(string $type = 'image'): array
    {
        $models = config("ai-generation.models.{$type}", []);

        $result = [];
        foreach ($models as $key => $config) {
            $result[] = [
                'id' => $key,
                'name' => $config['name'],
                'description' => $config['description'] ?? '',
                'credits_cost' => $type === 'image'
                    ? $config['credits_per_image']
                    : $config['credits_per_second'],
                'type' => $type,
            ];
        }

        return $result;
    }
}
