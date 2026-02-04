<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Google Gemini Veo 3 Provider
 * 
 * Implements video generation using Google's Veo 3 API via Gemini API
 * Supports:
 * - Text-to-video generation
 * - Image-to-video generation
 * - Native audio generation
 * - 720p, 1080p, 4K resolution
 * - 4, 6, 8 second videos
 * - Portrait (9:16) and Landscape (16:9) aspect ratios
 */
class GeminiVeoProvider implements AiProviderInterface
{
    protected ?string $apiKey;
    protected string $apiUrl;
    protected int $timeout;

    protected array $supportedFeatures = [
        'text-to-video',
        'image-to-video',
        'audio-generation',
        'video-extension',
        'first-last-frame',
    ];

    protected array $validAspectRatios = ['16:9', '9:16'];
    protected array $validResolutions = ['720p', '1080p', '4k'];
    protected array $validDurations = [4, 5, 6, 7, 8];

    public function __construct()
    {
        $this->apiKey = config('ai-generation.providers.gemini.api_key');
        $this->apiUrl = config(
            'ai-generation.providers.gemini.api_url',
            'https://generativelanguage.googleapis.com/v1beta'
        );
        $this->timeout = config('ai-generation.providers.gemini.timeout', 300);
    }

    public function getName(): string
    {
        return 'gemini-veo';
    }

    public function supportsFeature(string $feature): bool
    {
        return in_array($feature, $this->supportedFeatures);
    }

    /**
     * Veo 3 does not support image generation
     */
    public function generateImage(string $prompt, array $options = []): array
    {
        throw new \Exception('Veo 3 does not support image generation. Use Kling AI or Replicate for images.');
    }

    /**
     * Generate video from text prompt
     */
    public function generateVideo(string $prompt, array $options = []): array
    {
        $this->validateApiKey();

        $model = $options['model'] ?? 'veo-3.1-generate-preview';

        // Build instance object
        $instance = [
            'prompt' => $prompt,
        ];

        // Add negative prompt if provided
        if (!empty($options['negative_prompt'])) {
            $instance['negativePrompt'] = $options['negative_prompt'];
        }

        // NOTE: aspectRatio, resolution, and durationSeconds are NOT supported in:
        // - Preview models (suffix 'preview')
        // - Veo 2.0 models (veo-2.0-*)
        // Only send these params when using Veo 3.x stable/ga versions
        $isPreviewModel = str_contains($model, 'preview');
        $isVeo2 = str_contains($model, 'veo-2');
        $supportsAdvancedParams = !$isPreviewModel && !$isVeo2;
        
        if ($supportsAdvancedParams) {
            // Aspect ratio
            $aspectRatio = $options['aspect_ratio'] ?? '16:9';
            if (in_array($aspectRatio, $this->validAspectRatios)) {
                $instance['aspectRatio'] = $aspectRatio;
            }

            // Resolution
            if (!empty($options['resolution']) && in_array($options['resolution'], $this->validResolutions)) {
                $instance['resolution'] = $options['resolution'];
            }

            // Duration (only for non-preview models)
            if (!empty($options['duration']) && in_array((int) $options['duration'], $this->validDurations)) {
                $instance['durationSeconds'] = (int) $options['duration'];
            }

            // Person generation setting (only for non-preview models)
            $instance['personGeneration'] = $options['person_generation'] ?? 'allow_adult';
        }

        // Optional seed for reproducibility (may or may not be supported by preview)
        if ($supportsAdvancedParams && !empty($options['seed'])) {
            $instance['seed'] = (int) $options['seed'];
        }

        Log::info('Veo generate video request', [
            'model' => $model,
            'prompt' => substr($prompt, 0, 100),
            'isPreviewModel' => $isPreviewModel,
        ]);

        return $this->makeGenerateRequest($model, ['instances' => [$instance]]);
    }

    /**
     * Generate video from image (image-to-video)
     */
    public function generateVideoFromImage(string $imagePath, string $prompt, array $options = []): array
    {
        $this->validateApiKey();

        $model = $options['model'] ?? 'veo-3.1-generate-preview';

        // Read and encode image
        $imageContent = $this->readImageFile($imagePath);
        $mimeType = $this->getMimeType($imagePath);

        $instance = [
            'prompt' => $prompt,
            'image' => [
                'bytesBase64Encoded' => base64_encode($imageContent),
                'mimeType' => $mimeType,
            ],
        ];

        // Add optional last frame image
        if (!empty($options['last_frame_path'])) {
            $lastFrameContent = $this->readImageFile($options['last_frame_path']);
            $lastFrameMime = $this->getMimeType($options['last_frame_path']);
            $instance['lastFrame'] = [
                'image' => [
                    'bytesBase64Encoded' => base64_encode($lastFrameContent),
                    'mimeType' => $lastFrameMime,
                ],
            ];
        }

        // Add optional parameters
        $aspectRatio = $options['aspect_ratio'] ?? '16:9';
        if (in_array($aspectRatio, $this->validAspectRatios)) {
            $instance['aspectRatio'] = $aspectRatio;
        }

        if (!empty($options['resolution']) && in_array($options['resolution'], $this->validResolutions)) {
            $instance['resolution'] = $options['resolution'];
        }

        if (!empty($options['duration']) && in_array((int) $options['duration'], $this->validDurations)) {
            $instance['durationSeconds'] = (int) $options['duration'];
        }

        $instance['personGeneration'] = $options['person_generation'] ?? 'allow_adult';

        Log::info('Veo 3 image-to-video request', [
            'model' => $model,
            'prompt' => substr($prompt, 0, 100),
            'imagePath' => $imagePath,
        ]);

        return $this->makeGenerateRequest($model, ['instances' => [$instance]]);
    }

    /**
     * Check the status of an async operation
     * taskId format: "models/veo-3.1-generate-preview/operations/xxx"
     */
    public function checkStatus(string $taskId): array
    {
        $this->validateApiKey();

        // taskId is the full operation path
        $url = "{$this->apiUrl}/{$taskId}";

        $response = Http::timeout($this->timeout)
            ->withHeaders(['x-goog-api-key' => $this->apiKey])
            ->get($url);

        if (!$response->successful()) {
            throw new \Exception(
                "Veo 3 API error ({$response->status()}): " . $response->body()
            );
        }

        $data = $response->json();

        return $this->mapOperationStatus($data);
    }

    /**
     * Download result video
     * URL format: https://generativelanguage.googleapis.com/v1beta/files/xxx:download?alt=media
     */
    public function downloadResult(string $url): string
    {
        $this->validateApiKey();

        // URL is already complete, just add API key header
        $response = Http::timeout($this->timeout)
            ->withHeaders(['x-goog-api-key' => $this->apiKey])
            ->get($url);

        if (!$response->successful()) {
            throw new \Exception("Failed to download Veo 3 result: " . $response->status());
        }

        return $response->body();
    }

    /**
     * Make the predictLongRunning request
     */
    protected function makeGenerateRequest(string $model, array $payload): array
    {
        $url = "{$this->apiUrl}/models/{$model}:predictLongRunning";

        Log::debug('Veo 3 API request', ['url' => $url, 'model' => $model]);

        $response = Http::timeout($this->timeout)
            ->withHeaders([
                'Content-Type' => 'application/json',
                'x-goog-api-key' => $this->apiKey,
            ])
            ->post($url, $payload);

        if (!$response->successful()) {
            Log::error('Veo 3 API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \Exception(
                "Veo 3 API error ({$response->status()}): " . $response->body()
            );
        }

        $data = $response->json();

        // Response contains operation name for async polling
        // Example: {"name": "models/veo-3.1-fast-generate-preview/operations/xxx"}
        return [
            'id' => $data['name'] ?? null, // Full operation path for polling
            'status' => 'processing',
            'provider' => 'gemini-veo',
            'raw' => $data,
        ];
    }

    /**
     * Map Veo operation status to standard format
     */
    protected function mapOperationStatus(array $data): array
    {
        $done = $data['done'] ?? false;
        $error = $data['error'] ?? null;

        if ($error) {
            return [
                'id' => $data['name'] ?? null,
                'status' => 'failed',
                'error' => $error['message'] ?? 'Unknown error',
                'raw' => $data,
            ];
        }

        if ($done) {
            // Response structure: response.generateVideoResponse.generatedSamples[0].video.uri
            $response = $data['response'] ?? [];
            $generateVideoResponse = $response['generateVideoResponse'] ?? [];
            $generatedSamples = $generateVideoResponse['generatedSamples'] ?? [];
            $video = $generatedSamples[0] ?? null;

            return [
                'id' => $data['name'] ?? null,
                'status' => 'succeeded',
                'output' => $video['video']['uri'] ?? null,
                'raw' => $data,
            ];
        }

        return [
            'id' => $data['name'] ?? null,
            'status' => 'processing',
            'raw' => $data,
        ];
    }

    /**
     * Read image file content
     */
    protected function readImageFile(string $path): string
    {
        // Check if it's a storage path
        if (Storage::disk('public')->exists($path)) {
            return Storage::disk('public')->get($path);
        }

        // Try as absolute path
        if (file_exists($path)) {
            return file_get_contents($path);
        }

        throw new \Exception("Image file not found: {$path}");
    }

    /**
     * Get MIME type for image
     */
    protected function getMimeType(string $path): string
    {
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return match ($extension) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            default => 'image/jpeg',
        };
    }

    protected function validateApiKey(): void
    {
        if (empty($this->apiKey)) {
            throw new \Exception('Google AI API key is not configured. Please set GOOGLE_AI_API_KEY in .env');
        }
    }
}
