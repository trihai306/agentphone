<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AI Service Providers Configuration
    |--------------------------------------------------------------------------
    |
    | Configure multiple AI providers: Replicate, Google Gemini (Veo), Kling AI
    |
    */
    'providers' => [
        'replicate' => [
            'api_key' => env('REPLICATE_API_KEY'),
            'api_url' => env('REPLICATE_API_URL', 'https://api.replicate.com/v1'),
            'timeout' => 300,
            'max_retries' => 3,
        ],
        'gemini' => [
            'api_key' => env('GOOGLE_AI_API_KEY'),
            'api_url' => env('GOOGLE_AI_API_URL', 'https://generativelanguage.googleapis.com/v1beta'),
            'timeout' => 300,
        ],
        'kling' => [
            'access_key' => env('KLING_ACCESS_KEY'),
            'secret_key' => env('KLING_SECRET_KEY'),
            'api_url' => env('KLING_API_URL', 'https://api.klingai.com'),
            'timeout' => 300,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Legacy Replicate Config (for backward compatibility)
    |--------------------------------------------------------------------------
    */
    'replicate' => [
        'api_key' => env('REPLICATE_API_KEY'),
        'api_url' => env('REPLICATE_API_URL', 'https://api.replicate.com/v1'),
        'timeout' => 300,
        'max_retries' => 3,
    ],

    /*
    |--------------------------------------------------------------------------
    | Available AI Models
    |--------------------------------------------------------------------------
    |
    | Configuration for each AI model, including provider, credits cost, and parameters
    | NOTE: Using hyphen instead of dots in keys for Laravel config compatibility
    |
    */
    'models' => [
        'image' => [
            // ============ GOOGLE IMAGEN 4 (Only Active Provider) ============
            'imagen-4-fast' => [
                'name' => 'Imagen 4 Fast',
                'description' => 'Fastest text-to-image generation from Google',
                'provider' => 'gemini-imagen',
                'version' => 'imagen-4.0-fast-generate-001',
                'credits_per_image' => 4,
                'max_width' => 2048,
                'max_height' => 2048,
                'default_width' => 1024,
                'default_height' => 1024,
                'aspect_ratios' => ['1:1', '16:9', '9:16', '4:3', '3:4'],
                'parameters' => [
                    'numberOfImages' => 1,
                    'imageSize' => '1K',
                ],
                'features' => [
                    'text-to-image',
                    'photorealistic',
                    'fast-generation',
                ],
                'badge' => 'New',
                'badge_color' => 'green',
                'enabled' => true,
            ],
            'imagen-4-standard' => [
                'name' => 'Imagen 4',
                'description' => 'High-quality balanced text-to-image generation',
                'provider' => 'gemini-imagen',
                'version' => 'imagen-4.0-generate-001',
                'credits_per_image' => 7,
                'max_width' => 2048,
                'max_height' => 2048,
                'default_width' => 1024,
                'default_height' => 1024,
                'aspect_ratios' => ['1:1', '16:9', '9:16', '4:3', '3:4'],
                'parameters' => [
                    'numberOfImages' => 1,
                    'imageSize' => '2K',
                ],
                'features' => [
                    'text-to-image',
                    'photorealistic',
                    'synthid-watermark',
                ],
                'badge' => 'Recommended',
                'badge_color' => 'purple',
                'enabled' => true,
            ],

            'imagen-4-ultra' => [
                'name' => 'Imagen 4 Ultra',
                'description' => 'Ultra-high quality photorealistic images',
                'provider' => 'gemini-imagen',
                'version' => 'imagen-4.0-ultra-generate-001',
                'credits_per_image' => 10,
                'max_width' => 2048,
                'max_height' => 2048,
                'default_width' => 1024,
                'default_height' => 1024,
                'aspect_ratios' => ['1:1', '16:9', '9:16', '4:3', '3:4'],
                'parameters' => [
                    'numberOfImages' => 1,
                    'imageSize' => '2K',
                ],
                'features' => [
                    'text-to-image',
                    'photorealistic',
                    'ultra-quality',
                    'synthid-watermark',
                ],
                'badge' => 'Best Quality',
                'badge_color' => 'amber',
                'enabled' => true,
            ],

            // ============ KLING AI IMAGE (Coming Soon) ============
            'kling-image' => [
                'name' => 'Kling AI Image',
                'description' => 'High-quality AI image generation by Kuaishou',
                'provider' => 'kling',
                'version' => 'kling-v1',
                'credits_per_image' => 8,
                'max_width' => 2048,
                'max_height' => 2048,
                'default_width' => 1024,
                'default_height' => 1024,
                'aspect_ratios' => ['1:1', '16:9', '9:16', '4:3', '3:4'],
                'badge' => 'Coming Soon',
                'badge_color' => 'yellow',
                'enabled' => false,
                'coming_soon' => true,
            ],
        ],

        'video' => [
            // ============ GOOGLE VEO 3 (Active) ============
            'veo-3-1' => [
                'name' => 'Google Veo 3.1',
                'description' => 'State-of-the-art video with native audio, 8s max',
                'provider' => 'gemini',
                'version' => 'veo-3.1-generate-preview',
                'credits_per_second' => 25,
                'max_duration' => 8,
                'default_duration' => 6,
                'resolutions' => [
                    '720p' => ['width' => 1280, 'height' => 720],
                    '1080p' => ['width' => 1920, 'height' => 1080],
                ],
                'default_resolution' => '1080p',
                'aspect_ratios' => ['16:9', '9:16'],
                'features' => [
                    'text-to-video',
                    'image-to-video',
                    'audio-generation',
                ],
                'badge' => 'Premium',
                'badge_color' => 'purple',
                'enabled' => true,
            ],
            'veo-3-1-fast' => [
                'name' => 'Google Veo 3.1 Fast',
                'description' => 'Faster generation, optimized for quick previews',
                'provider' => 'gemini',
                'version' => 'veo-3.1-fast-generate-preview',
                'credits_per_second' => 15,
                'max_duration' => 8,
                'default_duration' => 4,
                'resolutions' => [
                    '720p' => ['width' => 1280, 'height' => 720],
                    '1080p' => ['width' => 1920, 'height' => 1080],
                ],
                'default_resolution' => '720p',
                'aspect_ratios' => ['16:9', '9:16'],
                'features' => [
                    'text-to-video',
                    'image-to-video',
                    'audio-generation',
                ],
                'badge' => 'Fast',
                'badge_color' => 'green',
                'enabled' => true,
            ],
            'veo-3-0' => [
                'name' => 'Google Veo 3.0',
                'description' => 'Previous generation, still powerful',
                'provider' => 'gemini',
                'version' => 'veo-3.0-generate-001',
                'credits_per_second' => 20,
                'max_duration' => 8,
                'default_duration' => 5,
                'resolutions' => [
                    '720p' => ['width' => 1280, 'height' => 720],
                    '1080p' => ['width' => 1920, 'height' => 1080],
                ],
                'default_resolution' => '720p',
                'aspect_ratios' => ['16:9', '9:16'],
                'features' => [
                    'text-to-video',
                    'image-to-video',
                ],
                'enabled' => true,
            ],
            'veo-2-0' => [
                'name' => 'Google Veo 2.0',
                'description' => 'Budget-friendly option, good quality',
                'provider' => 'gemini',
                'version' => 'veo-2.0-generate-001',
                'credits_per_second' => 12,
                'max_duration' => 8,
                'default_duration' => 5,
                'resolutions' => [
                    '720p' => ['width' => 1280, 'height' => 720],
                ],
                'default_resolution' => '720p',
                'aspect_ratios' => ['16:9', '9:16'],
                'features' => [
                    'text-to-video',
                ],
                'badge' => 'Budget',
                'badge_color' => 'blue',
                'enabled' => true,
            ],

            // ============ KLING AI VIDEO (Coming Soon) ============
            'kling-2-6' => [
                'name' => 'Kling AI 2.6',
                'description' => 'Professional video with synchronized audio',
                'provider' => 'kling',
                'version' => 'kling-v1-6',
                'credits_per_second' => 20,
                'max_duration' => 10,
                'default_duration' => 5,
                'resolutions' => [
                    '720p' => ['width' => 1280, 'height' => 720],
                    '1080p' => ['width' => 1920, 'height' => 1080],
                ],
                'default_resolution' => '720p',
                'aspect_ratios' => ['16:9', '9:16', '1:1'],
                'features' => [
                    'text-to-video',
                    'image-to-video',
                    'motion-control',
                    'audio',
                ],
                'badge' => 'Coming Soon',
                'badge_color' => 'yellow',
                'enabled' => false,
                'coming_soon' => true,
            ],
            'kling-3-1' => [
                'name' => 'Kling AI 3.1 Pro',
                'description' => 'Latest Kling model with enhanced quality',
                'provider' => 'kling',
                'version' => 'kling-v1-6',
                'credits_per_second' => 30,
                'max_duration' => 10,
                'default_duration' => 5,
                'resolutions' => [
                    '720p' => ['width' => 1280, 'height' => 720],
                    '1080p' => ['width' => 1920, 'height' => 1080],
                ],
                'default_resolution' => '1080p',
                'aspect_ratios' => ['16:9', '9:16', '1:1'],
                'features' => [
                    'text-to-video',
                    'image-to-video',
                    'motion-control',
                    'audio',
                ],
                'badge' => 'Coming Soon',
                'badge_color' => 'yellow',
                'enabled' => false,
                'coming_soon' => true,
            ],

            // Replicate models removed - only Google Gemini models active
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
        'max_concurrent_generations' => 3,
        'max_queue_size' => 10,
        'polling_timeout' => 300,
        'poll_interval' => 5,
    ],

    /*
    |--------------------------------------------------------------------------
    | Credit Cost Modifiers
    |--------------------------------------------------------------------------
    */
    'cost_modifiers' => [
        'hd_multiplier' => 1.5,
        'high_quality_multiplier' => 1.3,
        '4k_multiplier' => 2.0,
    ],
];
