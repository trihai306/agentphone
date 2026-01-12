<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ReplicateApiClient
{
    protected ?string $apiKey;
    protected string $apiUrl;
    protected int $timeout;
    protected int $maxRetries;

    public function __construct()
    {
        $this->apiKey = config('ai-generation.replicate.api_key');
        $this->apiUrl = config('ai-generation.replicate.api_url', 'https://api.replicate.com/v1');
        $this->timeout = config('ai-generation.replicate.timeout', 300);
        $this->maxRetries = config('ai-generation.replicate.max_retries', 3);

        if (empty($this->apiKey)) {
            throw new \Exception('Replicate API key is not configured. Please set REPLICATE_API_KEY in .env');
        }
    }

    /**
     * Create a new prediction
     */
    public function predict(string $model, array $input): array
    {
        $response = $this->makeRequest('POST', '/predictions', [
            'version' => $model,
            'input' => $input,
        ]);

        return $response;
    }

    /**
     * Get prediction status and output
     */
    public function getPrediction(string $predictionId): array
    {
        return $this->makeRequest('GET', "/predictions/{$predictionId}");
    }

    /**
     * Cancel a prediction
     */
    public function cancelPrediction(string $predictionId): array
    {
        return $this->makeRequest('POST', "/predictions/{$predictionId}/cancel");
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
                ])
                    ->timeout($this->timeout);

                $url = $this->apiUrl . $endpoint;

                $response = match ($method) {
                    'GET' => $request->get($url),
                    'POST' => $request->post($url, $data),
                    default => throw new \Exception("Unsupported HTTP method: {$method}")
                };

                if ($response->successful()) {
                    return $response->json();
                }

                // If non-retriable error (4xx except 429), throw immediately
                $statusCode = $response->status();
                if ($statusCode >= 400 && $statusCode < 500 && $statusCode !== 429) {
                    throw new \Exception(
                        "Replicate API error ({$statusCode}): " . $response->body()
                    );
                }

                // Otherwise, log and retry
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

            // Wait before retry (exponential backoff)
            if ($attempt < $this->maxRetries) {
                sleep(pow(2, $attempt));
            }
        }

        throw $lastException ?? new \Exception('Unknown error making Replicate API request');
    }

    /**
     * Wait for prediction to complete
     */
    public function waitForCompletion(string $predictionId, int $timeoutSeconds = 300): array
    {
        $startTime = time();
        $pollInterval = config('ai-generation.limits.poll_interval', 5);

        while (time() - $startTime < $timeoutSeconds) {
            $prediction = $this->getPrediction($predictionId);
            $status = $prediction['status'] ?? '';

            if (in_array($status, ['succeeded', 'failed', 'canceled'])) {
                return $prediction;
            }

            sleep($pollInterval);
        }

        throw new \Exception("Prediction timeout after {$timeoutSeconds} seconds");
    }
}
