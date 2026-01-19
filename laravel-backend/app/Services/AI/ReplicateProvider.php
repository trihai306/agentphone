<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Replicate AI Provider
 * Wraps existing ReplicateApiClient with AiProviderInterface
 */
class ReplicateProvider implements AiProviderInterface
{
    protected ?string $apiKey;
    protected string $apiUrl;
    protected int $timeout;
    protected int $maxRetries;

    protected array $supportedFeatures = [
        'text-to-image',
        'text-to-video',
    ];

    public function __construct()
    {
        $this->apiKey = config('ai-generation.replicate.api_key');
        $this->apiUrl = config('ai-generation.replicate.api_url', 'https://api.replicate.com/v1');
        $this->timeout = config('ai-generation.replicate.timeout', 300);
        $this->maxRetries = config('ai-generation.replicate.max_retries', 3);
    }

    public function getName(): string
    {
        return 'replicate';
    }

    public function supportsFeature(string $feature): bool
    {
        return in_array($feature, $this->supportedFeatures);
    }

    /**
     * Generate an image from text prompt
     */
    public function generateImage(string $prompt, array $options = []): array
    {
        $this->validateApiKey();

        $model = $options['version'] ?? $options['model'] ?? null;
        if (!$model) {
            throw new \Exception('Model version is required for Replicate');
        }

        $input = [
            'prompt' => $prompt,
            'width' => $options['width'] ?? 1024,
            'height' => $options['height'] ?? 1024,
        ];

        if (!empty($options['negative_prompt'])) {
            $input['negative_prompt'] = $options['negative_prompt'];
        }

        // Merge additional parameters
        $input = array_merge($input, $options['parameters'] ?? []);

        return $this->predict($model, $input);
    }

    /**
     * Generate a video from text prompt
     */
    public function generateVideo(string $prompt, array $options = []): array
    {
        $this->validateApiKey();

        $model = $options['version'] ?? $options['model'] ?? null;
        if (!$model) {
            throw new \Exception('Model version is required for Replicate');
        }

        $input = [
            'prompt' => $prompt,
            'duration' => $options['duration'] ?? 5,
        ];

        // Add resolution if specified
        if (!empty($options['width']) && !empty($options['height'])) {
            $input['width'] = $options['width'];
            $input['height'] = $options['height'];
        }

        // Merge additional parameters
        $input = array_merge($input, $options['parameters'] ?? []);

        return $this->predict($model, $input);
    }

    /**
     * Image-to-video not fully supported via Replicate
     */
    public function generateVideoFromImage(string $imagePath, string $prompt, array $options = []): array
    {
        // Some Replicate models support image input
        $options['image'] = $imagePath;
        return $this->generateVideo($prompt, $options);
    }

    /**
     * Check the status of a prediction
     */
    public function checkStatus(string $taskId): array
    {
        $this->validateApiKey();
        return $this->getPrediction($taskId);
    }

    /**
     * Download result from URL
     */
    public function downloadResult(string $url): string
    {
        $content = file_get_contents($url);
        if ($content === false) {
            throw new \Exception("Failed to download result from: {$url}");
        }
        return $content;
    }

    /**
     * Create a new prediction
     */
    protected function predict(string $model, array $input): array
    {
        return $this->makeRequest('POST', '/predictions', [
            'version' => $model,
            'input' => $input,
        ]);
    }

    /**
     * Get prediction status and output
     */
    protected function getPrediction(string $predictionId): array
    {
        return $this->makeRequest('GET', "/predictions/{$predictionId}");
    }

    /**
     * Make HTTP request to Replicate API with retry logic
     */
    protected function makeRequest(string $method, string $endpoint, array $data = []): array
    {
        $attempt = 0;
        $lastException = null;

        while ($attempt < $this->maxRetries) {
            try {
                $request = Http::withHeaders([
                    'Authorization' => 'Token ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])->timeout($this->timeout);

                $url = $this->apiUrl . $endpoint;

                $response = match ($method) {
                    'GET' => $request->get($url),
                    'POST' => $request->post($url, $data),
                    default => throw new \Exception("Unsupported HTTP method: {$method}")
                };

                if ($response->successful()) {
                    return $response->json();
                }

                $statusCode = $response->status();
                if ($statusCode >= 400 && $statusCode < 500 && $statusCode !== 429) {
                    throw new \Exception(
                        "Replicate API error ({$statusCode}): " . $response->body()
                    );
                }

                Log::warning("Replicate API request failed (attempt {$attempt})", [
                    'status' => $statusCode,
                    'body' => $response->body(),
                ]);

                $lastException = new \Exception(
                    "Replicate API error ({$statusCode}): " . $response->body()
                );

            } catch (\Exception $e) {
                Log::error("Replicate API request exception (attempt {$attempt})", [
                    'message' => $e->getMessage(),
                ]);
                $lastException = $e;
            }

            $attempt++;

            if ($attempt < $this->maxRetries) {
                sleep(pow(2, $attempt));
            }
        }

        throw $lastException ?? new \Exception('Unknown error making Replicate API request');
    }

    protected function validateApiKey(): void
    {
        if (empty($this->apiKey)) {
            throw new \Exception('Replicate API key is not configured. Please set REPLICATE_API_KEY in .env');
        }
    }
}
