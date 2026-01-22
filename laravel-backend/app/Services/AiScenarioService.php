<?php

namespace App\Services;

use App\Models\AiGeneration;
use App\Models\AiScenario;
use App\Models\AiScenarioScene;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiScenarioService
{
    protected AiGenerationService $generationService;
    protected ?string $geminiApiKey;
    protected string $geminiApiUrl;

    // Maximum scenes allowed per scenario
    const MAX_SCENES = 10;

    // Minimum duration per scene (seconds)
    const MIN_SCENE_DURATION = 4;
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
     */
    public function parseScript(string $script, string $outputType = 'video'): array
    {
        if (empty($this->geminiApiKey)) {
            throw new \Exception('Gemini API key is not configured');
        }

        $prompt = $this->buildParsePrompt($script, $outputType);

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

        // Ensure each scene has required fields
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
            'title' => $parsed['title'] ?? null,
            'scenes' => $formattedScenes,
            'total_scenes' => count($formattedScenes),
        ];
    }

    /**
     * Build the AI prompt for parsing scripts
     */
    protected function buildParsePrompt(string $script, string $outputType): string
    {
        $mediaType = $outputType === 'video' ? 'video clips' : 'images';
        $durationNote = $outputType === 'video'
            ? "- \"suggested_duration\": thời lượng video đề xuất (4-8 giây)"
            : "";

        return <<<PROMPT
Bạn là một chuyên gia biên kịch và đạo diễn phim. Nhiệm vụ của bạn là phân tích kịch bản sau và chia thành các cảnh riêng biệt để tạo {$mediaType}.

KỊCH BẢN:
{$script}

YÊU CẦU:
1. Chia kịch bản thành tối đa 10 cảnh (scenes)
2. Mỗi cảnh phải độc lập và có thể tạo thành 1 {$mediaType} riêng
3. Prompt cho mỗi cảnh phải chi tiết, mô tả rõ:
   - Khung cảnh/bối cảnh
   - Nhân vật (nếu có)
   - Hành động chính
   - Ánh sáng, màu sắc, mood
4. Prompt phải bằng tiếng Anh để AI generation hiểu tốt hơn

OUTPUT FORMAT (JSON):
{
  "title": "Tiêu đề gợi ý cho kịch bản",
  "scenes": [
    {
      "order": 1,
      "description": "Mô tả ngắn gọn bằng tiếng Việt",
      "prompt": "Detailed English prompt for AI video/image generation. Include scene setting, characters, actions, lighting, mood, camera angle.",
      {$durationNote}
    }
  ]
}

Chỉ trả về JSON, không có text khác.
PROMPT;
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
                AiScenarioScene::create([
                    'ai_scenario_id' => $scenario->id,
                    'order' => $sceneData['order'],
                    'description' => $sceneData['description'],
                    'prompt' => $sceneData['prompt'],
                    'duration' => $sceneData['duration'] ?? self::DEFAULT_SCENE_DURATION,
                    'status' => AiScenarioScene::STATUS_PENDING,
                ]);
            }

            return $scenario->fresh(['scenes']);
        });
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
                $generation = $this->generationService->generateVideo($user, $params);
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
