<?php

namespace App\Http\Controllers;

use App\Models\AiScenario;
use App\Models\AiScenarioScene;
use App\Services\AiScenarioService;
use App\Services\AiGenerationService;
use App\Services\MediaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AiScenarioController extends Controller
{
    protected AiScenarioService $scenarioService;
    protected AiGenerationService $generationService;

    public function __construct(AiScenarioService $scenarioService, AiGenerationService $generationService)
    {
        $this->scenarioService = $scenarioService;
        $this->generationService = $generationService;
    }

    /**
     * List user's scenarios
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $scenarios = AiScenario::forUser($user->id)
            ->latest()
            ->with([
                'scenes' => function ($q) {
                    $q->orderBy('order');
                }
            ])
            ->paginate(12);

        return Inertia::render('AIStudio/Scenarios', [
            'scenarios' => $scenarios,
            'currentCredits' => $user->ai_credits,
        ]);
    }

    /**
     * Show scenario creation page
     */
    public function create()
    {
        $user = Auth::user();

        // Get active scenarios (queued or generating)
        $activeScenarios = AiScenario::forUser($user->id)
            ->whereIn('status', [AiScenario::STATUS_QUEUED, AiScenario::STATUS_GENERATING])
            ->with([
                'scenes' => function ($q) {
                    $q->orderBy('order');
                }
            ])
            ->latest()
            ->get()
            ->map(fn($s) => $this->formatScenario($s));

        return Inertia::render('AiStudio/Scenario', [
            'currentCredits' => $user->ai_credits,
            'videoModels' => $this->generationService->getAvailableModels('video'),
            'imageModels' => $this->generationService->getAvailableModels('image'),
            'activeScenarios' => $activeScenarios,
        ]);
    }

    /**
     * Parse script or images into scenes (AJAX)
     */
    public function parseScript(Request $request)
    {
        $inputMode = $request->input('input_mode', 'text');

        if ($inputMode === 'images') {
            // Image-based parsing
            $request->validate([
                'images' => 'required|array|min:1|max:10',
                'images.*.data' => 'required|string',
                'output_type' => 'required|in:image,video',
            ]);

            try {
                $result = $this->scenarioService->parseImages(
                    $request->input('images'),
                    $request->input('output_type')
                );

                return response()->json([
                    'success' => true,
                    'data' => $result,
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'error' => $e->getMessage(),
                ], 422);
            }
        }

        // Text-based parsing (default)
        $request->validate([
            'script' => 'required|string|min:10|max:10000',
            'output_type' => 'required|in:image,video',
            // NEW: Style and platform options for professional prompt engineering
            'style' => 'nullable|in:cinematic,documentary,commercial,social_media,storytelling,minimal',
            'platform' => 'nullable|in:youtube,tiktok,instagram,ads,presentation,general',
            'mood' => 'nullable|string|max:100',
        ]);

        // Build options for enhanced parsing
        $options = [
            'style' => $request->input('style', 'cinematic'),
            'platform' => $request->input('platform', 'general'),
            'mood' => $request->input('mood'),
        ];

        try {
            $result = $this->scenarioService->parseScript(
                $request->input('script'),
                $request->input('output_type'),
                $options
            );

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Create and save a scenario with scenes
     */
    public function store(Request $request)
    {
        $request->validate([
            'script' => 'required|string|min:10|max:10000',
            'title' => 'nullable|string|max:255',
            'output_type' => 'required|in:image,video',
            'model' => 'required|string',
            'scenes' => 'required|array|min:1|max:10',
            'scenes.*.order' => 'required|integer|min:1',
            'scenes.*.description' => 'required|string',
            'scenes.*.prompt' => 'required|string',
            'scenes.*.duration' => 'nullable|integer|min:4|max:15',
            'scenes.*.source_image' => 'nullable|string', // Base64 or URL
            'settings' => 'nullable|array',
            // Frame chaining options
            'chain_mode' => 'nullable|in:none,frame_chain',
            'characters' => 'nullable|array',
            'characters.*.name' => 'required_with:characters|string|max:100',
            'characters.*.description' => 'required_with:characters|string|max:500',
            'characters.*.reference_image' => 'nullable|string',
        ]);

        $user = Auth::user();

        try {
            $scenario = $this->scenarioService->createScenario($user, $request->all());

            return response()->json([
                'success' => true,
                'scenario' => $this->formatScenario($scenario),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Show scenario detail
     */
    public function show(AiScenario $scenario)
    {
        $this->authorize('view', $scenario);

        $scenario->load(['scenes.generation', 'user']);

        return Inertia::render('AIStudio/ScenarioDetail', [
            'scenario' => $this->formatScenario($scenario),
            'currentCredits' => Auth::user()->ai_credits,
        ]);
    }

    /**
     * Generate all scenes - dispatches job for sequential processing with frame chaining
     */
    public function generateAll(AiScenario $scenario)
    {
        $this->authorize('update', $scenario);

        try {
            // Validate credits before dispatching
            $user = $scenario->user;
            if (!$user->hasEnoughCredits($scenario->total_credits)) {
                return response()->json([
                    'success' => false,
                    'error' => "Insufficient credits. Required: {$scenario->total_credits}, Available: {$user->ai_credits}",
                ], 422);
            }

            // Set status to queued and dispatch job
            $scenario->update(['status' => AiScenario::STATUS_QUEUED]);

            \App\Jobs\GenerateScenarioJob::dispatch($scenario);

            return response()->json([
                'success' => true,
                'scenario' => $this->formatScenario($scenario->fresh()),
                'message' => 'Video generation queued. Scenes will be processed sequentially.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Update a single scene's prompt
     */
    public function updateScene(Request $request, AiScenario $scenario, AiScenarioScene $scene)
    {
        $this->authorize('update', $scenario);

        if ($scene->ai_scenario_id !== $scenario->id) {
            abort(404);
        }

        $request->validate([
            'prompt' => 'required|string|max:2000',
            'description' => 'nullable|string|max:500',
            'duration' => 'nullable|integer|min:4|max:8',
        ]);

        $scene->update($request->only(['prompt', 'description', 'duration']));

        // Recalculate credits
        $scenario->refresh();
        $totalCredits = $this->scenarioService->calculateTotalCredits(
            $scenario->model,
            $scenario->output_type,
            $scenario->scenes->toArray(),
            $scenario->settings ?? []
        );
        $scenario->update(['total_credits' => $totalCredits]);

        return response()->json([
            'success' => true,
            'scene' => $this->formatScene($scene->fresh()),
            'total_credits' => $totalCredits,
        ]);
    }

    /**
     * Check scenario status (polling endpoint)
     */
    public function checkStatus(AiScenario $scenario)
    {
        $this->authorize('view', $scenario);

        // Sync scene statuses from their generations
        foreach ($scenario->scenes as $scene) {
            if ($scene->ai_generation_id && $scene->status === AiScenarioScene::STATUS_GENERATING) {
                $this->scenarioService->syncSceneStatus($scene);
            }
        }

        $scenario->refresh();
        $scenario->load('scenes.generation');

        return response()->json([
            'success' => true,
            'scenario' => $this->formatScenario($scenario),
        ]);
    }

    /**
     * Retry a failed scene
     */
    public function retryScene(AiScenario $scenario, AiScenarioScene $scene)
    {
        $this->authorize('update', $scenario);

        if ($scene->ai_scenario_id !== $scenario->id) {
            abort(404);
        }

        try {
            $generation = $this->scenarioService->retryScene($scene);

            return response()->json([
                'success' => true,
                'scene' => $this->formatScene($scene->fresh()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Delete a scenario
     */
    public function destroy(AiScenario $scenario)
    {
        $this->authorize('delete', $scenario);

        $this->scenarioService->deleteScenario($scenario);

        return response()->json([
            'success' => true,
            'message' => 'Scenario deleted successfully',
        ]);
    }

    /**
     * Estimate credits for scenes before saving
     */
    public function estimateCredits(Request $request)
    {
        $request->validate([
            'model' => 'required|string',
            'output_type' => 'required|in:image,video',
            'scenes' => 'required|array|min:1',
            'settings' => 'nullable|array',
        ]);

        $totalCredits = $this->scenarioService->calculateTotalCredits(
            $request->input('model'),
            $request->input('output_type'),
            $request->input('scenes'),
            $request->input('settings', [])
        );

        return response()->json([
            'success' => true,
            'total_credits' => $totalCredits,
            'per_scene' => $totalCredits / count($request->input('scenes')),
        ]);
    }

    /**
     * Format scenario for frontend
     */
    protected function formatScenario(AiScenario $scenario): array
    {
        return [
            'id' => $scenario->id,
            'title' => $scenario->title,
            'script' => $scenario->script,
            'output_type' => $scenario->output_type,
            'model' => $scenario->model,
            'settings' => $scenario->settings,
            'chain_mode' => $scenario->chain_mode ?? 'none',
            'characters' => $scenario->characters ?? [],
            'status' => $scenario->status,
            'status_color' => $scenario->status_color,
            'total_credits' => $scenario->total_credits,
            'progress' => $scenario->progress,
            'completed_scenes' => $scenario->completed_scenes_count,
            'total_scenes' => $scenario->total_scenes_count,
            'scenes' => $scenario->scenes->map(fn($s) => $this->formatScene($s))->toArray(),
            'created_at' => $scenario->created_at->toIso8601String(),
            'updated_at' => $scenario->updated_at->toIso8601String(),
        ];
    }

    /**
     * Format scene for frontend
     */
    protected function formatScene(AiScenarioScene $scene): array
    {
        return [
            'id' => $scene->id,
            'order' => $scene->order,
            'description' => $scene->description,
            'prompt' => $scene->prompt,
            'duration' => $scene->duration,
            'status' => $scene->status,
            'status_color' => $scene->status_color,
            'error_message' => $scene->error_message,
            'result_url' => $scene->generation?->result_url,
            'generation' => $scene->generation ? [
                'id' => $scene->generation->id,
                'status' => $scene->generation->status,
                'result_url' => $scene->generation->result_url,
                'type' => $scene->generation->type,
            ] : null,
        ];
    }
}
