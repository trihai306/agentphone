<?php

namespace App\Services\AI;

use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Kling AI Provider
 * 
 * Implements image and video generation using Kling AI's official API
 * Supports:
 * - Text-to-image generation
 * - Text-to-video generation
 * - Image-to-video generation
 * - Motion control
 * - Audio sync (Kling 2.6+)
 */
class KlingAiProvider implements AiProviderInterface
{
    protected ?string $accessKey;
    protected ?string $secretKey;
    protected string $apiUrl;
    protected int $timeout;

    protected array $supportedFeatures = [
        'text-to-image',
        'text-to-video',
        'image-to-video',
        'motion-control',
        'audio',
    ];

    protected array $validResolutions = ['720p', '1080p'];
    protected array $validDurations = [5, 10];
    protected array $validAspectRatios = ['16:9', '9:16', '1:1'];

    public function __construct()
    {
        $this->accessKey = config('ai-generation.providers.kling.access_key');
        $this->secretKey = config('ai-generation.providers.kling.secret_key');
        $this->apiUrl = config(
            'ai-generation.providers.kling.api_url',
            'https://api.klingai.com'
        );
        $this->timeout = config('ai-generation.providers.kling.timeout', 300);
    }

    public function getName(): string
    {
        return 'kling';
    }

    public function supportsFeature(string $feature): bool
    {
        return in_array($feature, $this->supportedFeatures);
    }

    /**
     * Generate image from text prompt
     */
    public function generateImage(string $prompt, array $options = []): array
    {
        $this->validateCredentials();

        $payload = [
            'model_name' => $options['model'] ?? 'kling-v1',
            'prompt' => $prompt,
            'n' => $options['count'] ?? 1,
            'aspect_ratio' => $options['aspect_ratio'] ?? '1:1',
        ];

        if (!empty($options['negative_prompt'])) {
            $payload['negative_prompt'] = $options['negative_prompt'];
        }

        // Image reference for style transfer
        if (!empty($options['image_reference'])) {
            $payload['image_reference'] = $options['image_reference'];
        }

        Log::info('Kling AI generate image request', [
            'prompt' => substr($prompt, 0, 100),
        ]);

        return $this->makeRequest('POST', '/v1/images/generations', $payload);
    }

    /**
     * Generate video from text prompt
     */
    public function generateVideo(string $prompt, array $options = []): array
    {
        $this->validateCredentials();

        $model = $options['model'] ?? 'kling-v1';

        // Map model names
        $modelName = match ($model) {
            'kling-2.6', 'kling-v2.6' => 'kling-v1-6',
            'kling-3.1', 'kling-v3.1' => 'kling-v1-6',
            default => 'kling-v1-5',
        };

        // Duration: 5 or 10 seconds
        $duration = (int) ($options['duration'] ?? 5);
        $durationMode = $duration >= 10 ? '10' : '5';

        // Aspect ratio
        $aspectRatio = $options['aspect_ratio'] ?? '16:9';

        // Mode: std (standard) or pro (professional)
        $mode = $options['mode'] ?? 'std';

        $payload = [
            'model_name' => $modelName,
            'prompt' => $prompt,
            'duration' => $durationMode,
            'aspect_ratio' => $aspectRatio,
            'mode' => $mode,
        ];

        if (!empty($options['negative_prompt'])) {
            $payload['negative_prompt'] = $options['negative_prompt'];
        }

        // Camera control
        if (!empty($options['camera_control'])) {
            $payload['camera_control'] = $options['camera_control'];
        }

        Log::info('Kling AI generate video request', [
            'model' => $modelName,
            'prompt' => substr($prompt, 0, 100),
            'duration' => $durationMode,
        ]);

        return $this->makeRequest('POST', '/v1/videos/text2video', $payload);
    }

    /**
     * Generate video from image (image-to-video)
     */
    public function generateVideoFromImage(string $imagePath, string $prompt, array $options = []): array
    {
        $this->validateCredentials();

        $model = $options['model'] ?? 'kling-v1';
        $modelName = match ($model) {
            'kling-2.6', 'kling-v2.6' => 'kling-v1-6',
            'kling-3.1', 'kling-v3.1' => 'kling-v1-6',
            default => 'kling-v1-5',
        };

        // Read and encode image
        $imageContent = $this->readImageFile($imagePath);
        $imageBase64 = base64_encode($imageContent);

        $duration = (int) ($options['duration'] ?? 5);
        $durationMode = $duration >= 10 ? '10' : '5';

        $payload = [
            'model_name' => $modelName,
            'prompt' => $prompt,
            'duration' => $durationMode,
            'image' => $imageBase64,
            'mode' => $options['mode'] ?? 'std',
        ];

        if (!empty($options['negative_prompt'])) {
            $payload['negative_prompt'] = $options['negative_prompt'];
        }

        // Optional: tail image for end frame
        if (!empty($options['tail_image_path'])) {
            $tailContent = $this->readImageFile($options['tail_image_path']);
            $payload['image_tail'] = base64_encode($tailContent);
        }

        Log::info('Kling AI image-to-video request', [
            'model' => $modelName,
            'prompt' => substr($prompt, 0, 100),
            'imagePath' => $imagePath,
        ]);

        return $this->makeRequest('POST', '/v1/videos/image2video', $payload);
    }

    /**
     * Check the status of a generation task
     */
    public function checkStatus(string $taskId): array
    {
        $this->validateCredentials();

        // Determine if it's an image or video task based on ID format
        // Kling uses different endpoints for status checking
        $endpoint = "/v1/videos/text2video/{$taskId}";

        try {
            $result = $this->makeRequest('GET', $endpoint);
            return $this->mapTaskStatus($result);
        } catch (\Exception $e) {
            // Try image endpoint
            try {
                $result = $this->makeRequest('GET', "/v1/images/generations/{$taskId}");
                return $this->mapTaskStatus($result);
            } catch (\Exception $e2) {
                throw $e; // Throw original error
            }
        }
    }

    /**
     * Download result from URL
     */
    public function downloadResult(string $url): string
    {
        $response = Http::timeout($this->timeout)->get($url);

        if (!$response->successful()) {
            throw new \Exception("Failed to download Kling AI result: " . $response->status());
        }

        return $response->body();
    }

    /**
     * Generate JWT token for API authentication
     */
    protected function generateJwtToken(): string
    {
        $now = time();
        $expiry = $now + 1800; // 30 minutes

        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT',
        ];

        $payload = [
            'iss' => $this->accessKey,
            'exp' => $expiry,
            'nbf' => $now - 5, // 5 seconds buffer
        ];

        return JWT::encode($payload, $this->secretKey, 'HS256');
    }

    /**
     * Make authenticated request to Kling API
     */
    protected function makeRequest(string $method, string $endpoint, array $data = []): array
    {
        $token = $this->generateJwtToken();
        $url = $this->apiUrl . $endpoint;

        Log::debug('Kling AI API request', [
            'method' => $method,
            'endpoint' => $endpoint,
        ]);

        $request = Http::timeout($this->timeout)
            ->withHeaders([
                'Authorization' => "Bearer {$token}",
                'Content-Type' => 'application/json',
            ]);

        $response = match ($method) {
            'GET' => $request->get($url),
            'POST' => $request->post($url, $data),
            default => throw new \Exception("Unsupported HTTP method: {$method}")
        };

        if (!$response->successful()) {
            Log::error('Kling AI API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \Exception(
                "Kling AI API error ({$response->status()}): " . $response->body()
            );
        }

        $result = $response->json();
        $code = $result['code'] ?? 0;

        // Kling API uses code 0 for success
        if ($code !== 0) {
            throw new \Exception(
                "Kling AI error ({$code}): " . ($result['message'] ?? 'Unknown error')
            );
        }

        return [
            'id' => $result['data']['task_id'] ?? null,
            'status' => $this->mapStatus($result['data']['task_status'] ?? 'submitted'),
            'provider' => 'kling',
            'raw' => $result,
        ];
    }

    /**
     * Map Kling task status to standard format
     */
    protected function mapTaskStatus(array $result): array
    {
        $data = $result['raw']['data'] ?? $result['data'] ?? [];
        $status = $data['task_status'] ?? 'unknown';

        $mapped = [
            'id' => $data['task_id'] ?? $result['id'] ?? null,
            'status' => $this->mapStatus($status),
            'raw' => $result,
        ];

        // If completed, extract output URLs
        if ($mapped['status'] === 'succeeded') {
            $videos = $data['task_result']['videos'] ?? [];
            $images = $data['task_result']['images'] ?? [];

            if (!empty($videos)) {
                $mapped['output'] = $videos[0]['url'] ?? null;
            } elseif (!empty($images)) {
                $mapped['output'] = $images[0]['url'] ?? null;
            }
        }

        // If failed, extract error
        if ($mapped['status'] === 'failed') {
            $mapped['error'] = $data['task_status_msg'] ?? 'Unknown error';
        }

        return $mapped;
    }

    /**
     * Map Kling status to standard status
     */
    protected function mapStatus(string $klingStatus): string
    {
        return match ($klingStatus) {
            'submitted', 'processing' => 'processing',
            'succeed' => 'succeeded',
            'failed' => 'failed',
            default => 'processing',
        };
    }

    /**
     * Read image file content
     */
    protected function readImageFile(string $path): string
    {
        if (Storage::disk('public')->exists($path)) {
            return Storage::disk('public')->get($path);
        }

        if (file_exists($path)) {
            return file_get_contents($path);
        }

        throw new \Exception("Image file not found: {$path}");
    }

    protected function validateCredentials(): void
    {
        if (empty($this->accessKey) || empty($this->secretKey)) {
            throw new \Exception(
                'Kling AI credentials not configured. Please set KLING_ACCESS_KEY and KLING_SECRET_KEY in .env'
            );
        }
    }
}
