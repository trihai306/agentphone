<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Google Gemini Imagen 3 Provider
 * 
 * Implements image generation using Google's Imagen 3 via Gemini API
 * Supports:
 * - Text-to-image generation
 * - High quality, photorealistic images
 * - Multiple aspect ratios
 * - Fast generation (2-5 seconds typical)
 */
class GeminiImagenProvider implements AiProviderInterface
{
    protected string $apiKey;
    protected string $apiUrl;
    protected int $timeout;

    public function __construct()
    {
        $this->apiKey = config('ai-generation.providers.gemini.api_key');
        $this->apiUrl = config('ai-generation.providers.gemini.api_url');
        $this->timeout = config('ai-generation.providers.gemini.timeout', 120);

        $this->validateApiKey();
    }

    public function getName(): string
    {
        return 'Google Imagen 3';
    }

    public function supportsFeature(string $feature): bool
    {
        return in_array($feature, ['text-to-image']);
    }

    /**
     * Generate image using Imagen 3
     * 
     * @param string $prompt Text prompt
     * @param array $options {
     *     @type int $width Image width
     *     @type int $height Image height
     *     @type string $aspect_ratio Aspect ratio (1:1, 16:9, 9:16, 4:3, 3:4)
     *     @type int $num_images Number of images (1-4)
     *     @type string $negative_prompt Things to avoid
     * }
     * @return array ['task_id' => string, 'status' => 'processing']
     */
    public function generateImage(string $prompt, array $options = []): array
    {
        $aspectRatio = $options['aspect_ratio'] ?? '1:1';
        $numImages = $options['num_images'] ?? 1;
        $negativePrompt = $options['negative_prompt'] ?? '';

        // Build full prompt with safety guidance
        $fullPrompt = $prompt;
        if (!empty($negativePrompt)) {
            $fullPrompt .= "\n\nAvoid: " . $negativePrompt;
        }

        $payload = [
            'prompt' => $fullPrompt,
            'aspectRatio' => $aspectRatio,
            'numberOfImages' => min($numImages, 4), // Max 4 images per request
        ];

        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                ])
                ->post(
                    "{$this->apiUrl}/models/imagen-3.0-generate-001:predict",
                    array_merge(['key' => $this->apiKey], $payload)
                );

            if (!$response->successful()) {
                $error = $response->json('error.message') ?? $response->body();
                throw new \Exception("Gemini Imagen API error: {$error}");
            }

            $data = $response->json();

            Log::info('GeminiImagenProvider: Image generation started', [
                'prompt' => substr($prompt, 0, 100),
                'aspect_ratio' => $aspectRatio,
                'response' => $data,
            ]);

            // Imagen 3 returns images directly (synchronous)
            return $this->parseImagenResponse($data);

        } catch (\Exception $e) {
            Log::error('GeminiImagenProvider: Image generation failed', [
                'error' => $e->getMessage(),
                'prompt' => $prompt,
            ]);
            throw $e;
        }
    }

    public function generateVideo(string $prompt, array $options = []): array
    {
        throw new \Exception('Imagen 3 does not support video generation. Use GeminiVeoProvider instead.');
    }

    public function generateVideoFromImage(string $imagePath, string $prompt, array $options = []): array
    {
        throw new \Exception('Imagen 3 does not support video generation. Use GeminiVeoProvider instead.');
    }

    /**
     * Imagen returns images synchronously, so status is immediate
     */
    public function checkStatus(string $taskId): array
    {
        // For Imagen, we store the result URL as task_id
        // So status check just returns the cached result
        return [
            'status' => 'completed',
            'result_url' => $taskId,
        ];
    }

    /**
     * Download result - for Imagen, URL is already accessible
     */
    public function downloadResult(string $url): string
    {
        try {
            $response = Http::timeout(60)->get($url);

            if (!$response->successful()) {
                throw new \Exception("Failed to download image: HTTP {$response->status()}");
            }

            return $response->body();

        } catch (\Exception $e) {
            Log::error('GeminiImagenProvider: Download failed', [
                'url' => $url,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Parse Imagen 3 response
     * 
     * Response format:
     * {
     *   "predictions": [
     *     {
     *       "mimeType": "image/png",
     *       "bytesBase64Encoded": "..."
     *     }
     *   ]
     * }
     */
    protected function parseImagenResponse(array $data): array
    {
        if (!isset($data['predictions']) || empty($data['predictions'])) {
            throw new \Exception('No images generated in response');
        }

        $prediction = $data['predictions'][0];

        // Imagen returns base64 encoded image
        if (isset($prediction['bytesBase64Encoded'])) {
            // Convert base64 to data URL
            $mimeType = $prediction['mimeType'] ?? 'image/png';
            $dataUrl = "data:{$mimeType};base64,{$prediction['bytesBase64Encoded']}";

            return [
                'status' => 'completed',
                'task_id' => $dataUrl, // Store data URL as task_id for later retrieval
                'result_url' => $dataUrl,
                'format' => 'base64',
            ];
        }

        // Fallback: External URL (less common)
        if (isset($prediction['imageUrl'])) {
            return [
                'status' => 'completed',
                'task_id' => $prediction['imageUrl'],
                'result_url' => $prediction['imageUrl'],
                'format' => 'url',
            ];
        }

        throw new \Exception('Invalid Imagen response format');
    }

    protected function validateApiKey(): void
    {
        if (empty($this->apiKey)) {
            throw new \Exception('Google AI API key not configured. Please set GOOGLE_AI_API_KEY in .env');
        }
    }
}
