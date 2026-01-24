<?php

namespace App\Services;

use App\Models\AiGeneration;
use App\Models\AiScenario;
use App\Models\AiScenarioScene;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AiScenarioService
{
    protected AiGenerationService $generationService;
    protected ?string $geminiApiKey;
    protected string $geminiApiUrl;

    // Maximum scenes allowed per scenario
    const MAX_SCENES = 10;

    // Duration per scene (seconds)
    const MIN_SCENE_DURATION = 4;
    const MAX_SCENE_DURATION = 15;
    const DEFAULT_SCENE_DURATION = 6;

    public function __construct(AiGenerationService $generationService)
    {
        $this->generationService = $generationService;
        $this->geminiApiKey = config('ai-generation.providers.gemini.api_key');
        $this->geminiApiUrl = config(
            'ai-generation.providers.gemini.api_url',
            'https://generativelanguage.googleapis.com/v1beta'
        );
    }

    /**
     * Parse a script into scenes using Gemini AI
     * @param string $script The raw script text
     * @param string $outputType 'video' or 'image'
     * @param array $options Additional options: style, platform, mood
     */
    public function parseScript(string $script, string $outputType = 'video', array $options = []): array
    {
        if (empty($this->geminiApiKey)) {
            throw new \Exception('Gemini API key is not configured');
        }

        $prompt = $this->buildParsePrompt($script, $outputType, $options);

        $url = "{$this->geminiApiUrl}/models/gemini-2.0-flash:generateContent";

        $response = Http::timeout(60)
            ->withHeaders([
                'Content-Type' => 'application/json',
                'x-goog-api-key' => $this->geminiApiKey,
            ])
            ->post($url, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.7,
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 8192,
                    'responseMimeType' => 'application/json',
                ],
            ]);

        if (!$response->successful()) {
            Log::error('Gemini parse script error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \Exception('Failed to parse script: ' . $response->body());
        }

        $data = $response->json();

        // Extract JSON from response
        $content = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';

        try {
            $parsed = json_decode($content, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            Log::error('Failed to parse Gemini JSON response', ['content' => $content]);
            throw new \Exception('Failed to parse AI response as JSON');
        }

        // Validate and limit scenes
        $scenes = $parsed['scenes'] ?? [];
        if (count($scenes) > self::MAX_SCENES) {
            $scenes = array_slice($scenes, 0, self::MAX_SCENES);
        }

        // Ensure each scene has required fields with enhanced metadata
        $formattedScenes = [];
        foreach ($scenes as $index => $scene) {
            $formattedScenes[] = [
                'order' => $index + 1,
                'description' => $scene['description'] ?? 'Scene ' . ($index + 1),
                'prompt' => $scene['prompt'] ?? $scene['description'] ?? '',
                'duration' => max(self::MIN_SCENE_DURATION, min(self::MAX_SCENE_DURATION, (int) ($scene['suggested_duration'] ?? self::DEFAULT_SCENE_DURATION))),
                // Enhanced metadata from professional prompt
                'camera_movement' => $scene['camera_movement'] ?? null,
                'transition_to_next' => $scene['transition_to_next'] ?? null,
                'audio_cue' => $scene['audio_cue'] ?? null,
            ];
        }

        return [
            'title' => $parsed['title'] ?? null,
            'theme' => $parsed['theme'] ?? null,
            'overall_mood' => $parsed['overall_mood'] ?? null,
            'color_palette' => $parsed['color_palette'] ?? [],
            'background_music_suggestion' => $parsed['background_music_suggestion'] ?? null,
            'director_notes' => $parsed['director_notes'] ?? null,
            'scenes' => $formattedScenes,
            'total_scenes' => count($formattedScenes),
            'total_duration' => (int) ($parsed['total_duration'] ?? array_sum(array_column($formattedScenes, 'duration'))),
        ];
    }

    /**
     * Parse images into scenes using Gemini Vision
     */
    public function parseImages(array $images, string $outputType = 'video'): array
    {
        if (empty($this->geminiApiKey)) {
            throw new \Exception('Gemini API key is not configured');
        }

        if (empty($images)) {
            throw new \Exception('No images provided');
        }

        // Build multimodal content with images
        $parts = [];

        // Add prompt first
        $parts[] = ['text' => $this->buildImageParsePrompt($outputType, count($images))];

        // Add each image
        foreach ($images as $index => $image) {
            // Extract base64 data and mime type from data URL
            $dataUrl = $image['data'];
            if (preg_match('/^data:image\/(\w+);base64,(.+)$/', $dataUrl, $matches)) {
                $mimeType = 'image/' . $matches[1];
                $base64Data = $matches[2];

                $parts[] = [
                    'inline_data' => [
                        'mime_type' => $mimeType,
                        'data' => $base64Data,
                    ]
                ];
            }
        }

        $url = "{$this->geminiApiUrl}/models/gemini-2.0-flash:generateContent";

        $response = Http::timeout(120) // Longer timeout for images
            ->withHeaders([
                'Content-Type' => 'application/json',
                'x-goog-api-key' => $this->geminiApiKey,
            ])
            ->post($url, [
                'contents' => [
                    [
                        'parts' => $parts
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.7,
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 8192,
                    'responseMimeType' => 'application/json',
                ],
            ]);

        if (!$response->successful()) {
            Log::error('Gemini parse images error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \Exception('Failed to parse images: ' . $response->body());
        }

        $data = $response->json();
        $content = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';

        try {
            $parsed = json_decode($content, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            Log::error('Failed to parse Gemini image response', ['content' => $content]);
            throw new \Exception('Failed to parse AI response as JSON');
        }

        // Format scenes to match image order
        $scenes = $parsed['scenes'] ?? [];
        $formattedScenes = [];
        foreach ($scenes as $index => $scene) {
            $formattedScenes[] = [
                'order' => $index + 1,
                'description' => $scene['description'] ?? 'Scene ' . ($index + 1),
                'prompt' => $scene['prompt'] ?? $scene['description'] ?? '',
                'duration' => max(self::MIN_SCENE_DURATION, (int) ($scene['suggested_duration'] ?? self::DEFAULT_SCENE_DURATION)),
            ];
        }

        return [
            'title' => $parsed['title'] ?? 'Video từ ảnh',
            'scenes' => $formattedScenes,
            'total_scenes' => count($formattedScenes),
        ];
    }

    /**
     * Build prompt for image-based scene generation
     */
    protected function buildImageParsePrompt(string $outputType, int $imageCount): string
    {
        $mediaType = $outputType === 'video' ? 'video clips' : 'images';
        $durationNote = $outputType === 'video'
            ? "- \"suggested_duration\": thời lượng video đề xuất (4-15 giây, dựa trên độ phức tạp của ảnh)"
            : "";

        return <<<PROMPT
Bạn là một chuyên gia AI phân tích hình ảnh và sáng tạo nội dung. Nhiệm vụ của bạn là phân tích {$imageCount} ảnh được cung cấp và tạo kịch bản video dựa trên nội dung mỗi ảnh.

YÊU CẦU:
1. Mỗi ảnh sẽ trở thành 1 cảnh (scene) riêng biệt
2. Phân tích kỹ nội dung, bối cảnh, nhân vật, hành động trong mỗi ảnh
3. Tạo prompt chi tiết bằng tiếng Anh để AI có thể tạo {$mediaType} dựa trên ảnh gốc
4. Prompt phải mô tả:
   - Mọi thứ có trong ảnh (objects, people, scenery)
   - Phong cách nghệ thuật, màu sắc chủ đạo
   - Góc camera, ánh sáng
   - Chuyển động gợi ý cho video (nếu là video)
5. Giữ nguyên thứ tự ảnh được cung cấp

OUTPUT FORMAT (JSON):
{
  "title": "Tiêu đề gợi ý dựa trên nội dung các ảnh",
  "scenes": [
    {
      "order": 1,
      "description": "Mô tả ngắn gọn bằng tiếng Việt về nội dung ảnh",
      "prompt": "Detailed English prompt describing exactly what's in the image, including scene setting, subjects, colors, lighting, mood, and suggested camera movements for video. Start with: 'Starting from the reference image: ...'",
      {$durationNote}
    }
  ]
}

Phân tích lần lượt từng ảnh theo thứ tự. Chỉ trả về JSON, không có text khác.
PROMPT;
    }

    /**
     * Build the AI prompt for parsing scripts
     * Enhanced with professional cinematography context
     */
    protected function buildParsePrompt(string $script, string $outputType, array $options = []): string
    {
        $mediaType = $outputType === 'video' ? 'video clips' : 'images';
        $durationNote = $outputType === 'video'
            ? '"suggested_duration": 5'
            : '';

        // Extract options
        $style = $options['style'] ?? 'cinematic';
        $platform = $options['platform'] ?? 'general';
        $mood = $options['mood'] ?? null;

        $styleGuide = $this->getStyleGuide($style);
        $platformGuide = $this->getPlatformGuide($platform);
        $moodInstruction = $mood ? "\n## MOOD YÊU CẦU: {$mood}" : '';

        return <<<PROMPT
# BẠN LÀ MỘT CHUYÊN GIA BIÊN KỊCH & ĐẠO DIỄN PHIM CHUYÊN NGHIỆP

## VAI TRÒ
Bạn là đạo diễn quảng cáo với 20 năm kinh nghiệm, từng làm việc cho các thương hiệu lớn như Apple, Nike, Samsung. Bạn có khả năng biến ý tưởng thô thành kịch bản hình ảnh chuyên nghiệp.

## NHIỆM VỤ
Phân tích và chuyển đổi kịch bản sau thành chuỗi cảnh {$mediaType} chuyên nghiệp.

## KỊCH BẢN GỐC
{$script}

## PHONG CÁCH: {$style}
{$styleGuide}

## NỀN TẢNG MỤC TIÊU: {$platform}
{$platformGuide}
{$moodInstruction}

## YÊU CẦU KỸ THUẬT CHI TIẾT

### 1. PHÂN TÍCH KỊCH BẢN
- Xác định chủ đề chính, thông điệp cốt lõi
- Tìm điểm cao trào (climax) và cấu trúc 3 hồi (setup → conflict → resolution)
- Nhận diện nhân vật, bối cảnh, tone giọng

### 2. SCENE BREAKDOWN
Chia thành 3-8 cảnh (tối đa 10). Mỗi cảnh PHẢI có:

**A. Visual Composition**
- Camera: Wide/Medium/Close-up/Extreme close-up
- Angle: Eye-level/High/Low/Dutch angle/Bird's eye
- Movement: Static/Pan/Tilt/Dolly/Tracking/Crane

**B. Lighting Design**
- Key light direction và intensity
- Mood lighting (High-key/Low-key/Natural/Dramatic)
- Color temperature (Warm/Cool/Neutral)

**C. Color Grading**
- Primary palette (dominant colors)
- LUT suggestion (Teal & Orange/Film Noir/Pastel...)
- Saturation level

**D. Motion & Pacing**
- Speed: Normal/Slow-mo/Time-lapse
- Transition type: Cut/Dissolve/Wipe/Match cut

**E. Audio Cues**
- Sound design hints (ambient, SFX)
- Music mood suggestion

### 3. PROMPT ENGINEERING CHO AI VIDEO
Prompt tiếng Anh PHẢI:
- Bắt đầu bằng style keyword: "Cinematic 4K footage of..."
- Mô tả camera movement cụ thể
- Chỉ định lighting và mood
- Kết thúc bằng: "shot on ARRI Alexa, 24fps, shallow depth of field"

### 4. CHARACTER CONSISTENCY
Nếu có nhân vật xuất hiện nhiều cảnh:
- Mô tả chi tiết ngoại hình 1 lần
- Reference lại ở các cảnh sau để consistency

## OUTPUT FORMAT (STRICTLY JSON)
{
  "title": "Tiêu đề sáng tạo, hấp dẫn",
  "theme": "Chủ đề chính",
  "overall_mood": "Mood tổng thể",
  "color_palette": ["#hex1", "#hex2", "#hex3"],
  "background_music_suggestion": "Thể loại nhạc nền phù hợp",
  "scenes": [
    {
      "order": 1,
      "description": "Mô tả ngắn gọn bằng tiếng Việt (1-2 câu)",
      "prompt": "Cinematic 4K footage of [detailed scene description]. Camera [specific movement]. Lighting: [type]. Color grade: [style]. Shot on ARRI Alexa Mini, 24fps, anamorphic lens, shallow depth of field.",
      {$durationNote},
      "camera_movement": "dolly in slowly",
      "transition_to_next": "dissolve",
      "audio_cue": "soft piano begins"
    }
  ],
  "total_duration": 25,
  "director_notes": "Ghi chú đạo diễn về cách kết nối các cảnh"
}

## QUY TẮC BẮT BUỘC
1. Prompt PHẢI bằng tiếng Anh, professional terminology
2. Mỗi cảnh 4-15 giây, tổng video không quá 2 phút
3. Consistent character descriptions
4. Smooth visual transitions
5. Output CHỈ CÓ JSON, không có text khác

PROMPT;
    }

    /**
     * Get style guide for video production
     */
    protected function getStyleGuide(string $style): string
    {
        $styles = [
            'cinematic' => 'Phong cách điện ảnh Hollywood: Ánh sáng dramatic với deep shadows, góc quay cinematic (wide establishing → intimate close-ups), màu sắc được grade chuyên nghiệp với rich contrast. Slow camera movements, meaningful pauses. Tham khảo: Denis Villeneuve, Christopher Nolan.',
            'documentary' => 'Phong cách tài liệu: Handheld camera tạo cảm giác real-time, natural lighting không setup, intimate close-ups bắt emotion thật. Raw textures, authentic environments. Không over-produced.',
            'commercial' => 'Phong cách quảng cáo cao cấp: Crisp 4K visuals, hero product shots với perfect lighting, dynamic camera movements (orbits, reveals). Aspirational lifestyle, polished finish. Tham khảo: Apple advertising.',
            'social_media' => 'Phong cách social media/viral: Vertical 9:16 framing, punchy visuals grab attention trong 1-3 giây đầu, quick cuts rhythmic. Bold colors, dynamic text overlays implied, trend-aware aesthetics.',
            'storytelling' => 'Phong cách kể chuyện emotional: Character-driven với focus on faces và reactions. Warm color tones, soft lighting tạo intimacy. Meaningful pauses for impact, music-synced emotional beats. Tham khảo: Pixar storytelling principles.',
            'minimal' => 'Phong cách tối giản: Clean solid backgrounds, single subject focus, generous negative space. Muted desaturated colors, elegant slow movements. Simple = sophisticated.',
        ];

        return $styles[$style] ?? $styles['cinematic'];
    }

    /**
     * Get platform-specific guidelines
     */
    protected function getPlatformGuide(string $platform): string
    {
        $platforms = [
            'youtube' => 'YouTube: Landscape 16:9. Hook mạnh trong 5 giây đầu. Structure với chapters-friendly segments. Longer scenes (6-15s) cho retention. Subtitles-friendly framing.',
            'tiktok' => 'TikTok/Reels: Portrait 9:16 MANDATORY. Ultra-fast pacing, mỗi scene 3-5 giây max. First frame = scroll-stopper. Trend-aware transitions. Text-safe zones.',
            'instagram' => 'Instagram: Square 1:1 hoặc Portrait 4:5. Aesthetic-focused, muted premium colors. Story-worthy moments. Clean compositions cho grid appearance.',
            'ads' => 'Quảng cáo: Value proposition trong 3 giây đầu. Clear CTA scene cuối. Brand colors consistently. Professional voiceover-ready pacing.',
            'presentation' => 'Presentation/Corporate: Clean professional look, informative framing, B-roll style. Expert authoritative tone. 16:9 landscape, graphics-friendly.',
            'general' => 'Đa nền tảng: Flexible 16:9 landscape default. Universally appealing, can be cropped. Balanced pacing phù hợp nhiều platforms.',
        ];

        return $platforms[$platform] ?? $platforms['general'];
    }

    /**
     * Create a new scenario with scenes
     */
    public function createScenario(User $user, array $data): AiScenario
    {
        return DB::transaction(function () use ($user, $data) {
            // Calculate total credits
            $totalCredits = $this->calculateTotalCredits(
                $data['model'],
                $data['output_type'],
                $data['scenes'],
                $data['settings'] ?? []
            );

            // Create scenario
            $scenario = AiScenario::create([
                'user_id' => $user->id,
                'title' => $data['title'] ?? null,
                'script' => $data['script'],
                'output_type' => $data['output_type'],
                'model' => $data['model'],
                'settings' => $data['settings'] ?? [],
                'status' => AiScenario::STATUS_PARSED,
                'total_credits' => $totalCredits,
            ]);

            // Create scenes
            foreach ($data['scenes'] as $sceneData) {
                // Handle source_image if provided (can be base64 or URL)
                $sourceImagePath = null;
                if (!empty($sceneData['source_image'])) {
                    $sourceImagePath = $this->processSourceImage(
                        $sceneData['source_image'],
                        $user->id,
                        $scenario->id
                    );
                }

                AiScenarioScene::create([
                    'ai_scenario_id' => $scenario->id,
                    'order' => $sceneData['order'],
                    'description' => $sceneData['description'],
                    'prompt' => $sceneData['prompt'],
                    'duration' => $sceneData['duration'] ?? self::DEFAULT_SCENE_DURATION,
                    'source_image_path' => $sourceImagePath,
                    'status' => AiScenarioScene::STATUS_PENDING,
                ]);
            }

            return $scenario->fresh(['scenes']);
        });
    }

    /**
     * Process source image (base64 or URL) and save to storage
     */
    protected function processSourceImage(string $imageData, int $userId, int $scenarioId): ?string
    {
        try {
            // Check if it's a base64 image
            if (str_starts_with($imageData, 'data:image')) {
                // Extract the base64 content
                $parts = explode(',', $imageData, 2);
                if (count($parts) !== 2) {
                    return null;
                }

                $imageContent = base64_decode($parts[1]);
                if ($imageContent === false) {
                    return null;
                }

                // Determine extension from mime type
                $mimeType = str_contains($parts[0], 'png') ? 'png' :
                    (str_contains($parts[0], 'gif') ? 'gif' : 'jpg');

                // Generate filename
                $filename = "scenario_{$scenarioId}_" . time() . '_' . uniqid() . ".{$mimeType}";
                $path = "ai-scenarios/{$userId}/{$filename}";

                // Save to storage
                Storage::disk('public')->put($path, $imageContent);

                // Return the full URL for the AI provider
                return asset("storage/{$path}");
            }

            // If it's already a URL, return as-is
            if (filter_var($imageData, FILTER_VALIDATE_URL)) {
                return $imageData;
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Failed to process source image', [
                'scenario_id' => $scenarioId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Calculate total credits needed for entire scenario
     */
    public function calculateTotalCredits(string $model, string $outputType, array $scenes, array $settings = []): int
    {
        $total = 0;

        foreach ($scenes as $scene) {
            $duration = $scene['duration'] ?? self::DEFAULT_SCENE_DURATION;

            if ($outputType === 'video') {
                $total += $this->generationService->calculateVideoCost($model, [
                    'duration' => $duration,
                    'resolution' => $settings['resolution'] ?? '1080p',
                ]);
            } else {
                $total += $this->generationService->calculateImageCost($model, [
                    'width' => $settings['width'] ?? 1024,
                    'height' => $settings['height'] ?? 1024,
                ]);
            }
        }

        return $total;
    }

    /**
     * Generate all scenes in a scenario
     * Returns immediately, scenes are generated in background via queue
     */
    public function generateAll(AiScenario $scenario): AiScenario
    {
        $user = $scenario->user;
        $totalCredits = $scenario->total_credits;

        // Validate credits
        if (!$user->hasEnoughCredits($totalCredits)) {
            throw new \Exception("Insufficient credits. Required: {$totalCredits}, Available: {$user->ai_credits}");
        }

        // Update scenario status
        $scenario->update(['status' => AiScenario::STATUS_GENERATING]);

        // Get pending scenes
        $pendingScenes = $scenario->scenes()->pending()->get();

        foreach ($pendingScenes as $scene) {
            try {
                $this->generateScene($scene);
            } catch (\Exception $e) {
                Log::error('Failed to generate scene', [
                    'scenario_id' => $scenario->id,
                    'scene_id' => $scene->id,
                    'error' => $e->getMessage(),
                ]);

                $scene->update([
                    'status' => AiScenarioScene::STATUS_FAILED,
                    'error_message' => $e->getMessage(),
                ]);
            }
        }

        // Check final status
        $this->updateScenarioStatus($scenario);

        return $scenario->fresh(['scenes']);
    }

    /**
     * Generate a single scene
     */
    public function generateScene(AiScenarioScene $scene): AiGeneration
    {
        $scenario = $scene->scenario;
        $user = $scenario->user;
        $settings = $scenario->settings ?? [];

        // Mark scene as generating
        $scene->update(['status' => AiScenarioScene::STATUS_GENERATING]);

        try {
            // Prepare generation params
            $params = [
                'model' => $scenario->model,
                'prompt' => $scene->prompt,
                'duration' => $scene->duration ?? self::DEFAULT_SCENE_DURATION,
                'resolution' => $settings['resolution'] ?? '1080p',
                'aspect_ratio' => $settings['aspect_ratio'] ?? '16:9',
                'generate_audio' => $settings['generate_audio'] ?? true,
            ];

            // Generate based on output type
            if ($scenario->output_type === 'video') {
                // Use Image-to-Video if scene has a reference image
                if (!empty($scene->source_image_path)) {
                    $params['source_image'] = $scene->source_image_path;
                    $generation = $this->generationService->generateVideoFromImage($user, $params);
                } else {
                    $generation = $this->generationService->generateVideo($user, $params);
                }
            } else {
                $generation = $this->generationService->generateImage($user, [
                    'model' => $scenario->model,
                    'prompt' => $scene->prompt,
                    'width' => $settings['width'] ?? 1024,
                    'height' => $settings['height'] ?? 1024,
                ]);
            }

            // Link generation to scene
            $scene->update([
                'ai_generation_id' => $generation->id,
            ]);

            return $generation;

        } catch (\Exception $e) {
            $scene->update([
                'status' => AiScenarioScene::STATUS_FAILED,
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Update scene status based on its generation
     */
    public function syncSceneStatus(AiScenarioScene $scene): void
    {
        if (!$scene->ai_generation_id) {
            return;
        }

        $generation = $scene->generation->fresh();

        if ($generation->isCompleted()) {
            $scene->update(['status' => AiScenarioScene::STATUS_COMPLETED]);
        } elseif ($generation->isFailed()) {
            $scene->update([
                'status' => AiScenarioScene::STATUS_FAILED,
                'error_message' => $generation->error_message,
            ]);
        }

        // Update parent scenario status
        $this->updateScenarioStatus($scene->scenario);
    }

    /**
     * Update scenario status based on scenes
     */
    public function updateScenarioStatus(AiScenario $scenario): void
    {
        $totalScenes = $scenario->scenes()->count();
        $completedScenes = $scenario->scenes()->where('status', AiScenarioScene::STATUS_COMPLETED)->count();
        $failedScenes = $scenario->scenes()->where('status', AiScenarioScene::STATUS_FAILED)->count();
        $generatingScenes = $scenario->scenes()->where('status', AiScenarioScene::STATUS_GENERATING)->count();

        $newStatus = $scenario->status;

        if ($completedScenes === $totalScenes) {
            $newStatus = AiScenario::STATUS_COMPLETED;
        } elseif ($failedScenes === $totalScenes) {
            $newStatus = AiScenario::STATUS_FAILED;
        } elseif ($completedScenes > 0 && ($completedScenes + $failedScenes) === $totalScenes) {
            $newStatus = AiScenario::STATUS_PARTIAL;
        } elseif ($generatingScenes > 0) {
            $newStatus = AiScenario::STATUS_GENERATING;
        }

        if ($scenario->status !== $newStatus) {
            $scenario->update(['status' => $newStatus]);
        }
    }

    /**
     * Update a scene's prompt
     */
    public function updateScenePrompt(AiScenarioScene $scene, string $prompt): AiScenarioScene
    {
        $scene->update(['prompt' => $prompt]);

        // Recalculate total credits
        $scenario = $scene->scenario;
        $totalCredits = $this->calculateTotalCredits(
            $scenario->model,
            $scenario->output_type,
            $scenario->scenes->toArray(),
            $scenario->settings ?? []
        );
        $scenario->update(['total_credits' => $totalCredits]);

        return $scene->fresh();
    }

    /**
     * Retry a failed scene
     */
    public function retryScene(AiScenarioScene $scene): AiGeneration
    {
        if (!$scene->isFailed()) {
            throw new \Exception('Only failed scenes can be retried');
        }

        // Reset scene status
        $scene->update([
            'status' => AiScenarioScene::STATUS_PENDING,
            'error_message' => null,
            'ai_generation_id' => null,
        ]);

        return $this->generateScene($scene);
    }

    /**
     * Delete a scenario and all its scenes
     */
    public function deleteScenario(AiScenario $scenario): void
    {
        // Scenes will be deleted via cascade
        $scenario->delete();
    }
}
