<?php

namespace App\Services\AI;

/**
 * Interface for AI generation providers
 * Supports multiple providers: Replicate, Gemini Veo, Kling AI
 */
interface AiProviderInterface
{
    /**
     * Generate an image from text prompt
     *
     * @param string $prompt Text description
     * @param array $options Provider-specific options (width, height, etc.)
     * @return array ['id' => string, 'status' => string, ...]
     */
    public function generateImage(string $prompt, array $options = []): array;

    /**
     * Generate a video from text prompt
     *
     * @param string $prompt Text description
     * @param array $options Provider-specific options (duration, resolution, etc.)
     * @return array ['id' => string, 'status' => string, ...]
     */
    public function generateVideo(string $prompt, array $options = []): array;

    /**
     * Generate a video from an image (image-to-video)
     *
     * @param string $imagePath Path to source image
     * @param string $prompt Motion/animation description
     * @param array $options Provider-specific options
     * @return array ['id' => string, 'status' => string, ...]
     */
    public function generateVideoFromImage(string $imagePath, string $prompt, array $options = []): array;

    /**
     * Check the status of a generation task
     *
     * @param string $taskId Provider-specific task/operation ID
     * @return array ['status' => string, 'output' => mixed, 'error' => string|null, ...]
     */
    public function checkStatus(string $taskId): array;

    /**
     * Download the result file from provider
     *
     * @param string $url URL to download from
     * @return string File contents
     */
    public function downloadResult(string $url): string;

    /**
     * Get provider name identifier
     *
     * @return string
     */
    public function getName(): string;

    /**
     * Check if provider supports a specific feature
     *
     * @param string $feature Feature name (e.g., 'image-to-video', 'audio-generation')
     * @return bool
     */
    public function supportsFeature(string $feature): bool;
}
