<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class GeminiModelsService
{
    protected string $apiKey;
    protected string $apiUrl;

    public function __construct()
    {
        $this->apiKey = config('ai-generation.providers.gemini.api_key');
        $this->apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    }

    /**
     * Get available image generation models from Gemini API
     * Results are cached for 24 hours
     *
     * @return array
     */
    public function getAvailableImageModels(): array
    {
        return Cache::remember('gemini_image_models', now()->addHours(24), function () {
            return $this->fetchImageModelsFromApi();
        });
    }

    /**
     * Fetch image models from Gemini API
     *
     * @return array
     */
    protected function fetchImageModelsFromApi(): array
    {
        try {
            $response = Http::timeout(10)->get($this->apiUrl, [
                'key' => $this->apiKey,
                'pageSize' => 100,
            ]);

            if (!$response->successful()) {
                Log::error('GeminiModelsService: Failed to fetch models', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return [];
            }

            $allModels = $response->json('models', []);

            // Filter for Imagen image generation models
            $imageModels = collect($allModels)
                ->filter(function ($model) {
                    $baseId = $model['baseModelId'] ?? '';
                    // Only include Imagen models with "generate" in the ID
                    return str_contains($baseId, 'imagen') &&
                        str_contains($baseId, 'generate') &&
                        !str_contains($baseId, 'edit'); // Exclude editing models
                })
                ->map(function ($model) {
                    return [
                        'id' => $model['baseModelId'],
                        'name' => $model['displayName'] ?? $model['baseModelId'],
                        'description' => $model['description'] ?? '',
                        'version' => $model['version'] ?? '',
                        'full_model_id' => $model['name'] ?? '',
                        'maxPromptTokens' => $model['inputTokenLimit'] ?? 480,
                    ];
                })
                ->values()
                ->all();

            Log::info('GeminiModelsService: Fetched image models', [
                'count' => count($imageModels),
                'models' => array_column($imageModels, 'id'),
            ]);

            return $imageModels;

        } catch (\Exception $e) {
            Log::error('GeminiModelsService: Exception during API call', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Clear the cached models (useful for testing/debugging)
     *
     * @return bool
     */
    public function clearCache(): bool
    {
        return Cache::forget('gemini_image_models');
    }

    /**
     * Get merged list of config + discovered models
     * Config models take precedence for pricing
     *
     * @return array
     */
    public function getMergedImageModels(): array
    {
        $configModels = config('ai-generation.models.image', []);
        $discoveredModels = $this->getAvailableImageModels();

        // Filter config models for Gemini provider
        $geminiConfigModels = collect($configModels)
            ->filter(fn($model) => ($model['provider'] ?? '') === 'gemini-imagen')
            ->toArray();

        // Merge: Config takes precedence
        $merged = [];

        // Add all config models first (with pricing and features)
        foreach ($geminiConfigModels as $key => $model) {
            $merged[$key] = array_merge([
                'source' => 'config',
            ], $model);
        }

        // Add discovered models that are NOT in config
        $configVersions = array_column($geminiConfigModels, 'version');
        foreach ($discoveredModels as $discovered) {
            // Check if this version already exists in config
            if (!in_array($discovered['full_model_id'], $configVersions)) {
                // Add as discovered model (no pricing yet)
                $modelKey = 'discovered-' . $discovered['id'];
                $merged[$modelKey] = [
                    'source' => 'discovered',
                    'name' => $discovered['name'],
                    'description' => $discovered['description'],
                    'provider' => 'gemini-imagen',
                    'version' => $discovered['full_model_id'],
                    'credits_per_image' => null, // Unknown pricing
                    'enabled' => false, // Disabled by default for discovered models
                ];
            }
        }

        return $merged;
    }
}
