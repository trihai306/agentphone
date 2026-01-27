<?php

namespace App\Services;

use App\Models\AiGeneration;
use App\Models\Transaction;
use App\Models\User;
use App\Services\AI\AiProviderFactory;
use App\Services\AI\AiProviderInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AiGenerationService
{
    protected AiProviderFactory $providerFactory;

    public function __construct(AiProviderFactory $providerFactory)
    {
        $this->providerFactory = $providerFactory;
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

        // Get provider for this model
        $providerName = config("ai-generation.models.image.{$model}.provider", 'replicate');

        // Calculate cost
        $cost = $this->calculateImageCost($model, $params);

        // Validate credits
        if (!$user->hasEnoughCredits($cost)) {
            throw new \Exception("Insufficient credits. Required: {$cost}, Available: {$user->ai_credits}");
        }

        // Start transaction
        return DB::transaction(function () use ($user, $model, $providerName, $prompt, $negativePrompt, $width, $height, $cost, $params) {
            // Deduct credits
            $user->deductAiCredits($cost);

            // Create generation record
            $generation = AiGeneration::create([
                'user_id' => $user->id,
                'type' => AiGeneration::TYPE_IMAGE,
                'model' => $model,
                'provider' => $providerName,
                'prompt' => $prompt,
                'negative_prompt' => $negativePrompt,
                'parameters' => [
                    'width' => $width,
                    'height' => $height,
                    ...$params,
                ],
                'aspect_ratio' => $params['aspect_ratio'] ?? null,
                'resolution' => null,
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
        $model = $params['model'] ?? 'veo-3.1';
        $prompt = $params['prompt'];
        $duration = $params['duration'] ?? config("ai-generation.models.video.{$model}.default_duration", 5);
        $resolution = $params['resolution'] ?? config("ai-generation.models.video.{$model}.default_resolution", '1080p');
        $aspectRatio = $params['aspect_ratio'] ?? '16:9';

        // Get provider for this model
        $providerName = config("ai-generation.models.video.{$model}.provider", 'replicate');

        // Calculate cost
        $cost = $this->calculateVideoCost($model, $params);

        // Validate credits
        if (!$user->hasEnoughCredits($cost)) {
            throw new \Exception("Insufficient credits. Required: {$cost}, Available: {$user->ai_credits}");
        }

        // Start transaction
        return DB::transaction(function () use ($user, $model, $providerName, $prompt, $duration, $resolution, $aspectRatio, $cost, $params) {
            // Deduct credits
            $user->deductAiCredits($cost);

            // Create generation record
            $generation = AiGeneration::create([
                'user_id' => $user->id,
                'type' => AiGeneration::TYPE_VIDEO,
                'model' => $model,
                'provider' => $providerName,
                'prompt' => $prompt,
                'parameters' => [
                    'duration' => $duration,
                    'resolution' => $resolution,
                    'aspect_ratio' => $aspectRatio,
                    ...$params,
                ],
                'aspect_ratio' => $aspectRatio,
                'resolution' => $resolution,
                'has_audio' => $params['generate_audio'] ?? false,
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
     * Generate video from an image (image-to-video)
     */
    public function generateVideoFromImage(User $user, array $params): AiGeneration
    {
        $model = $params['model'] ?? 'veo-3.1';
        $prompt = $params['prompt'];
        $imagePath = $params['source_image'];
        $duration = $params['duration'] ?? config("ai-generation.models.video.{$model}.default_duration", 5);
        $resolution = $params['resolution'] ?? config("ai-generation.models.video.{$model}.default_resolution", '1080p');
        $aspectRatio = $params['aspect_ratio'] ?? '16:9';

        $providerName = config("ai-generation.models.video.{$model}.provider", 'replicate');

        // Calculate cost (same as video)
        $cost = $this->calculateVideoCost($model, $params);

        if (!$user->hasEnoughCredits($cost)) {
            throw new \Exception("Insufficient credits. Required: {$cost}, Available: {$user->ai_credits}");
        }

        return DB::transaction(function () use ($user, $model, $providerName, $prompt, $imagePath, $duration, $resolution, $aspectRatio, $cost, $params) {
            $user->deductAiCredits($cost);

            $generation = AiGeneration::create([
                'user_id' => $user->id,
                'type' => AiGeneration::TYPE_VIDEO,
                'model' => $model,
                'provider' => $providerName,
                'prompt' => $prompt,
                'parameters' => [
                    'duration' => $duration,
                    'resolution' => $resolution,
                    'aspect_ratio' => $aspectRatio,
                    ...$params,
                ],
                'aspect_ratio' => $aspectRatio,
                'resolution' => $resolution,
                'source_image_path' => $imagePath,
                'has_audio' => $params['generate_audio'] ?? false,
                'credits_used' => $cost,
                'status' => AiGeneration::STATUS_PENDING,
            ]);

            Transaction::create([
                'user_id' => $user->id,
                'wallet_id' => null,
                'ai_generation_id' => $generation->id,
                'type' => Transaction::TYPE_AI_GENERATION,
                'amount' => $cost,
                'final_amount' => $cost,
                'status' => Transaction::STATUS_COMPLETED,
                'payment_method' => 'ai_credits',
                'user_note' => "AI Image-to-Video: {$prompt}",
                'completed_at' => now(),
            ]);

            $this->startImageToVideoGeneration($generation);

            return $generation->fresh();
        });
    }

    /**
     * Calculate cost for image generation
     */
    public function calculateImageCost(string $model, array $params): int
    {
        $baseCost = config("ai-generation.models.image.{$model}.credits_per_image", 10);

        $multiplier = 1.0;

        $width = $params['width'] ?? config("ai-generation.models.image.{$model}.default_width");
        $height = $params['height'] ?? config("ai-generation.models.image.{$model}.default_height");
        if ($width > 1024 || $height > 1024) {
            $multiplier *= config('ai-generation.cost_modifiers.hd_multiplier', 1.5);
        }

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

        // Apply resolution modifier
        $resolution = $params['resolution'] ?? config("ai-generation.models.video.{$model}.default_resolution");
        if ($resolution === '1080p') {
            $baseCost *= 1.5;
        } elseif ($resolution === '4k') {
            $baseCost *= config('ai-generation.cost_modifiers.4k_multiplier', 2.0);
        }

        return (int) ceil($baseCost);
    }

    /**
     * Start async image generation using provider
     */
    protected function startImageGeneration(AiGeneration $generation): void
    {
        try {
            $provider = $this->providerFactory->forModel($generation->model, 'image');
            $modelConfig = config("ai-generation.models.image.{$generation->model}");
            $params = $generation->parameters;

            $result = $provider->generateImage($generation->prompt, [
                'version' => $modelConfig['version'] ?? $generation->model,
                'model' => $modelConfig['version'] ?? $generation->model,
                'width' => $params['width'] ?? 1024,
                'height' => $params['height'] ?? 1024,
                'negative_prompt' => $generation->negative_prompt,
                'parameters' => $modelConfig['parameters'] ?? [],
            ]);

            $generation->update([
                'provider_id' => $result['id'],
                'status' => AiGeneration::STATUS_PROCESSING,
                'provider_metadata' => $result['raw'] ?? $result,
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

            $generation->user->addAiCredits($generation->credits_used);
        }
    }

    /**
     * Start async video generation using provider
     */
    protected function startVideoGeneration(AiGeneration $generation): void
    {
        try {
            $provider = $this->providerFactory->forModel($generation->model, 'video');
            $modelConfig = config("ai-generation.models.video.{$generation->model}");
            $params = $generation->parameters;

            $result = $provider->generateVideo($generation->prompt, [
                'model' => $modelConfig['version'] ?? $generation->model,
                'duration' => $params['duration'] ?? 5,
                'resolution' => $params['resolution'] ?? '1080p',
                'aspect_ratio' => $params['aspect_ratio'] ?? '16:9',
                'negative_prompt' => $generation->negative_prompt ?? null,
            ]);

            $generation->update([
                'provider_id' => $result['id'],
                'status' => AiGeneration::STATUS_PROCESSING,
                'provider_metadata' => $result['raw'] ?? $result,
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

            $generation->user->addAiCredits($generation->credits_used);
        }
    }

    /**
     * Start image-to-video generation
     */
    protected function startImageToVideoGeneration(AiGeneration $generation): void
    {
        try {
            $provider = $this->providerFactory->forModel($generation->model, 'video');
            $params = $generation->parameters;

            $result = $provider->generateVideoFromImage(
                $generation->source_image_path,
                $generation->prompt,
                [
                    'model' => config("ai-generation.models.video.{$generation->model}.version"),
                    'duration' => $params['duration'] ?? 5,
                    'resolution' => $params['resolution'] ?? '1080p',
                    'aspect_ratio' => $params['aspect_ratio'] ?? '16:9',
                ]
            );

            $generation->update([
                'provider_id' => $result['id'],
                'status' => AiGeneration::STATUS_PROCESSING,
                'provider_metadata' => $result['raw'] ?? $result,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to start image-to-video generation', [
                'generation_id' => $generation->id,
                'error' => $e->getMessage(),
            ]);

            $generation->update([
                'status' => AiGeneration::STATUS_FAILED,
                'error_message' => $e->getMessage(),
            ]);

            $generation->user->addAiCredits($generation->credits_used);
        }
    }

    /**
     * Check generation status and update using provider
     */
    public function checkGenerationStatus(AiGeneration $generation): AiGeneration
    {
        if (!$generation->provider_id || $generation->isCompleted() || $generation->isFailed()) {
            return $generation;
        }

        try {
            $provider = $this->providerFactory->make($generation->provider);
            $result = $provider->checkStatus($generation->provider_id);

            $generation->provider_metadata = $result['raw'] ?? $result;

            if ($result['status'] === 'succeeded') {
                $this->handleSuccessfulGeneration($generation, $result);
            } elseif ($result['status'] === 'failed') {
                $generation->update([
                    'status' => AiGeneration::STATUS_FAILED,
                    'error_message' => $result['error'] ?? 'Generation failed',
                ]);

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
    protected function handleSuccessfulGeneration(AiGeneration $generation, array $result): void
    {
        try {
            $output = $result['output'] ?? null;

            if (!$output) {
                throw new \Exception('No output in generation result');
            }

            // Get provider to download
            $provider = $this->providerFactory->make($generation->provider);
            $fileContent = $provider->downloadResult($output);

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

            // Create UserMedia record to show in Media Library
            $this->createMediaRecord($generation, $path, $disk, strlen($fileContent));

            // Update generation
            $generation->update([
                'status' => AiGeneration::STATUS_COMPLETED,
                'result_url' => $output,
                'result_path' => $path,
                'processing_time' => $result['raw']['metrics']['predict_time'] ?? null,
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

            $generation->user->addAiCredits($generation->credits_used);
        }
    }

    /**
     * Create a UserMedia record for AI generated content
     */
    protected function createMediaRecord(AiGeneration $generation, string $path, string $disk, int $fileSize): void
    {
        try {
            $isImage = $generation->type === AiGeneration::TYPE_IMAGE;
            $mimeType = $isImage ? 'image/png' : 'video/mp4';
            $extension = $isImage ? 'png' : 'mp4';
            $filename = basename($path);

            \App\Models\UserMedia::create([
                'user_id' => $generation->user_id,
                'filename' => $filename,
                'original_name' => 'AI Generated - ' . mb_substr($generation->prompt, 0, 50, 'UTF-8') . '.' . $extension,
                'mime_type' => $mimeType,
                'file_size' => $fileSize,
                'path' => $path,
                'folder' => 'ai-generated',
                'source' => 'ai_generated',
                'ai_generation_id' => $generation->id,
                'tags' => ['ai-generated', $generation->type, $generation->provider],
                'metadata' => [
                    'prompt' => $generation->prompt,
                    'model' => $generation->model,
                    'provider' => $generation->provider,
                    'credits_used' => $generation->credits_used,
                ],
                'description' => 'Generated via AI Studio: ' . $generation->prompt,
            ]);

            Log::info('Created UserMedia record for AI generation', [
                'generation_id' => $generation->id,
                'path' => $path,
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to create UserMedia record', [
                'generation_id' => $generation->id,
                'error' => $e->getMessage(),
            ]);
            // Don't throw - the generation was successful, media record is optional
        }
    }

    /**
     * Get available models for a specific type with provider info
     */
    public function getAvailableModels(string $type = 'image'): array
    {
        $models = config("ai-generation.models.{$type}", []);

        // For image models, merge with Gemini discovered models
        if ($type === 'image' && config('ai-generation.providers.gemini.enable_model_discovery', false)) {
            try {
                $geminiService = new \App\Services\AI\GeminiModelsService();
                $discoveredModels = $geminiService->getMergedImageModels();

                // Replace Gemini config models with merged models
                foreach ($models as $key => $model) {
                    if (($model['provider'] ?? '') === 'gemini-imagen') {
                        unset($models[$key]);
                    }
                }

                // Add merged models
                $models = array_merge($models, $discoveredModels);
            } catch (\Exception $e) {
                // Fallback to config models if discovery fails
                Log::error('AiGenerationService: Failed to discover Gemini models', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $result = [];
        foreach ($models as $key => $config) {
            // Include all models but mark disabled ones
            $result[] = [
                'id' => $key,
                'name' => $config['name'],
                'description' => $config['description'] ?? '',
                'provider' => $config['provider'] ?? 'replicate',
                'credits_cost' => $type === 'image'
                    ? $config['credits_per_image']
                    : $config['credits_per_second'],
                'type' => $type,
                'badge' => $config['badge'] ?? null,
                'badge_color' => $config['badge_color'] ?? null,
                'features' => $config['features'] ?? [],
                'resolutions' => $config['resolutions'] ?? [],
                'aspect_ratios' => $config['aspect_ratios'] ?? [],
                'max_duration' => $config['max_duration'] ?? null,
                'enabled' => $config['enabled'] ?? true,
                'coming_soon' => $config['coming_soon'] ?? false,
            ];
        }

        return $result;
    }
}
