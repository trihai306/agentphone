<?php

namespace App\Services\AI;

use InvalidArgumentException;

/**
 * Factory for creating AI provider instances
 */
class AiProviderFactory
{
    /**
     * Create a provider instance by name
     *
     * @param string $provider Provider name: 'replicate', 'gemini-veo', 'kling'
     * @return AiProviderInterface
     * @throws InvalidArgumentException
     */
    public function make(string $provider): AiProviderInterface
    {
        return match ($provider) {
            'replicate' => new ReplicateProvider(),
            'gemini', 'gemini-veo', 'veo' => new GeminiVeoProvider(),
            'gemini-imagen', 'imagen' => new GeminiImagenProvider(),
            'kling' => new KlingAiProvider(),
            default => throw new InvalidArgumentException("Unknown AI provider: {$provider}")
        };
    }

    /**
     * Get provider for a specific model based on config
     *
     * @param string $modelKey Model key from config
     * @param string $type 'image' or 'video'
     * @return AiProviderInterface
     */
    public function forModel(string $modelKey, string $type = 'video'): AiProviderInterface
    {
        $providerName = config("ai-generation.models.{$type}.{$modelKey}.provider", 'replicate');
        return $this->make($providerName);
    }

    /**
     * Get all available providers
     *
     * @return array<string, string> Provider key => display name
     */
    public function getAvailableProviders(): array
    {
        return [
            'replicate' => 'Replicate',
            'gemini-veo' => 'Google Veo',
            'gemini-imagen' => 'Google Imagen 3',
            'kling' => 'Kling AI',
        ];
    }
}
