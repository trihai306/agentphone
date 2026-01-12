<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AI Service Provider
    |--------------------------------------------------------------------------
    |
    | The AI service provider to use for image and video generation.
    | Currently supported: 'replicate'
    |
    */
    'provider' => env('AI_PROVIDER', 'replicate'),

    /*
    |--------------------------------------------------------------------------
    | Replicate API Configuration
    |--------------------------------------------------------------------------
    */
    'replicate' => [
        'api_key' => env('REPLICATE_API_KEY'),
        'api_url' => env('REPLICATE_API_URL', 'https://api.replicate.com/v1'),
        'timeout' => 300, // seconds
        'max_retries' => 3,
    ],

    /*
    |--------------------------------------------------------------------------
    | Available AI Models
    |--------------------------------------------------------------------------
    |
    | Configuration for each AI model, including credits cost and parameters
    |
    */
    'models' => [
        'image' => [
            'flux-1.1-pro' => [
                'name' => 'FLUX 1.1 Pro',
                'description' => 'State-of-the-art image generation with exceptional quality',
                'version' => 'black-forest-labs/flux-1.1-pro',
                'credits_per_image' => 10,
                'max_width' => 2048,
                'max_height' => 2048,
                'default_width' => 1024,
                'default_height' => 1024,
                'parameters' => [
                    'prompt_strength' => 0.85,
                    'num_inference_steps' => 28,
                ],
            ],
            'stable-diffusion-3.5' => [
                'name' => 'Stable Diffusion 3.5 Large',
                'description' => 'High quality, fast image generation',
                'version' => 'stability-ai/stable-diffusion-3.5-large',
                'credits_per_image' => 5,
                'max_width' => 1024,
                'max_height' => 1024,
                'default_width' => 512,
                'default_height' => 512,
                'parameters' => [
                    'num_inference_steps' => 20,
                    'guidance_scale' => 7.5,
                ],
            ],
            'sdxl-turbo' => [
                'name' => 'SDXL Turbo',
                'description' => 'Ultra-fast image generation, lower quality',
                'version' => 'stability-ai/sdxl-turbo',
                'credits_per_image' => 3,
                'max_width' => 1024,
                'max_height' => 1024,
                'default_width' => 512,
                'default_height' => 512,
                'parameters' => [
                    'num_inference_steps' => 4,
                ],
            ],
        ],

        'video' => [
            'kling-2.0' => [
                'name' => 'Kling 2.0',
                'description' => 'Professional video generation with superior motion',
                'version' => 'kling-ai/kling-2.0',
                'credits_per_second' => 10,
                'max_duration' => 10, // seconds
                'default_duration' => 5,
                'resolutions' => [
                    '720p' => ['width' => 1280, 'height' => 720],
                    '1080p' => ['width' => 1920, 'height' => 1080],
                ],
                'default_resolution' => '720p',
                'fps' => 24,
            ],
            'stable-video' => [
                'name' => 'Stable Video Diffusion',
                'description' => 'Stable Diffusion for video generation',
                'version' => 'stability-ai/stable-video-diffusion',
                'credits_per_second' => 6,
                'max_duration' => 5,
                'default_duration' => 3,
                'resolutions' => [
                    '576p' => ['width' => 1024, 'height' => 576],
                ],
                'default_resolution' => '576p',
                'fps' => 24,
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Storage Configuration
    |--------------------------------------------------------------------------
    */
    'storage' => [
        'disk' => env('AI_STORAGE_DISK', 'public'),
        'path' => 'ai-generations',
        'image_path' => 'ai-generations/images',
        'video_path' => 'ai-generations/videos',
    ],

    /*
    |--------------------------------------------------------------------------
    | Generation Limits
    |--------------------------------------------------------------------------
    */
    'limits' => [
        // Maximum concurrent generations per user
        'max_concurrent_generations' => 3,

        // Maximum queued generations per user
        'max_queue_size' => 10,

        // Default timeout for generation polling (seconds)
        'polling_timeout' => 300,

        // Poll interval (seconds)
        'poll_interval' => 5,
    ],

    /*
    |--------------------------------------------------------------------------
    | Credit Cost Modifiers
    |--------------------------------------------------------------------------
    */
    'cost_modifiers' => [
        // Higher resolution multiplier
        'hd_multiplier' => 1.5,

        // Higher quality/steps multiplier
        'high_quality_multiplier' => 1.3,
    ],
];
