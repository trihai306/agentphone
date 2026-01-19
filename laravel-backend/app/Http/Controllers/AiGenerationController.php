<?php

namespace App\Http\Controllers;

use App\Models\AiGeneration;
use App\Services\AiGenerationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AiGenerationController extends Controller
{
    protected AiGenerationService $aiService;

    public function __construct(AiGenerationService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Display AI Studio main page
     */
    public function index()
    {
        $user = Auth::user();

        // Get available models
        $imageModels = $this->aiService->getAvailableModels('image');
        $videoModels = $this->aiService->getAvailableModels('video');

        // Get recent generations
        $recentGenerations = $user->aiGenerations()
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn($gen) => $this->formatGeneration($gen));

        return Inertia::render('AiStudio/Index', [
            'currentCredits' => $user->ai_credits,
            'imageModels' => $imageModels,
            'videoModels' => $videoModels,
            'recentGenerations' => $recentGenerations,
        ]);
    }

    /**
     * Get available models (API endpoint)
     */
    public function models(Request $request)
    {
        $type = $request->get('type', 'image');
        $models = $this->aiService->getAvailableModels($type);

        return response()->json([
            'models' => $models,
        ]);
    }

    /**
     * Generate an image
     */
    public function generateImage(Request $request)
    {
        $request->validate([
            'model' => 'required|string',
            'prompt' => 'required|string|min:3|max:1000',
            'negative_prompt' => 'nullable|string|max:500',
            'width' => 'nullable|integer|min:256|max:2048',
            'height' => 'nullable|integer|min:256|max:2048',
            'num_inference_steps' => 'nullable|integer|min:1|max:100',
        ]);

        try {
            $user = Auth::user();
            $generation = $this->aiService->generateImage($user, $request->all());

            return response()->json([
                'success' => true,
                'generation' => $this->formatGeneration($generation),
                'message' => 'Image generation started successfully',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Generate a video
     */
    public function generateVideo(Request $request)
    {
        $request->validate([
            'model' => 'required|string',
            'prompt' => 'required|string|min:3|max:1000',
            'negative_prompt' => 'nullable|string|max:500',
            'duration' => 'nullable|integer|min:1|max:10',
            'resolution' => 'nullable|string|in:720p,1080p,576p,4k',
            'aspect_ratio' => 'nullable|string|in:16:9,9:16,1:1',
            'generate_audio' => 'nullable|boolean',
        ]);

        try {
            $user = Auth::user();
            $generation = $this->aiService->generateVideo($user, $request->all());

            return response()->json([
                'success' => true,
                'generation' => $this->formatGeneration($generation),
                'message' => 'Video generation started successfully',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Generate video from image (image-to-video)
     */
    public function generateVideoFromImage(Request $request)
    {
        $request->validate([
            'model' => 'required|string',
            'prompt' => 'required|string|min:3|max:1000',
            'source_image' => 'required|string', // Storage path or uploaded file
            'duration' => 'nullable|integer|min:1|max:10',
            'resolution' => 'nullable|string|in:720p,1080p,4k',
            'aspect_ratio' => 'nullable|string|in:16:9,9:16',
        ]);

        try {
            $user = Auth::user();
            $generation = $this->aiService->generateVideoFromImage($user, $request->all());

            return response()->json([
                'success' => true,
                'generation' => $this->formatGeneration($generation),
                'message' => 'Image-to-video generation started successfully',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get user's generations (Gallery)
     */
    public function myGenerations(Request $request)
    {
        $user = Auth::user();

        $query = $user->aiGenerations()->latest();

        // Filters
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('model')) {
            $query->where('model', $request->model);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Search by prompt
        if ($request->has('search')) {
            $query->where('prompt', 'like', '%' . $request->search . '%');
        }

        $generations = $query->paginate(20);

        $generations->getCollection()->transform(fn($gen) => $this->formatGeneration($gen));

        return Inertia::render('AiStudio/Gallery', [
            'generations' => $generations,
            'filters' => $request->only(['type', 'model', 'status', 'search']),
            'currentCredits' => $user->ai_credits,
        ]);
    }

    /**
     * Show single generation detail
     */
    public function show(AiGeneration $generation)
    {
        $this->authorize('view', $generation);

        return Inertia::render('AiStudio/Show', [
            'generation' => $this->formatGeneration($generation),
        ]);
    }

    /**
     * Check generation status (polling endpoint)
     */
    public function checkStatus(AiGeneration $generation)
    {
        $this->authorize('view', $generation);

        // Update status from provider
        $generation = $this->aiService->checkGenerationStatus($generation);

        return response()->json([
            'generation' => $this->formatGeneration($generation),
        ]);
    }

    /**
     * Delete a generation
     */
    public function delete(AiGeneration $generation)
    {
        $this->authorize('delete', $generation);

        // Delete file from storage if exists
        if ($generation->result_path) {
            $disk = config('ai-generation.storage.disk');
            Storage::disk($disk)->delete($generation->result_path);
        }

        // Delete database record
        $generation->delete();

        return redirect()->route('ai-studio.generations')
            ->with('success', 'Generation deleted successfully');
    }

    /**
     * Calculate cost estimate before generation
     */
    public function estimateCost(Request $request)
    {
        $request->validate([
            'type' => 'required|in:image,video',
            'model' => 'required|string',
            'params' => 'nullable|array',
        ]);

        try {
            $cost = $request->type === 'image'
                ? $this->aiService->calculateImageCost($request->model, $request->params ?? [])
                : $this->aiService->calculateVideoCost($request->model, $request->params ?? []);

            return response()->json([
                'cost' => $cost,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Format generation for frontend
     */
    protected function formatGeneration(AiGeneration $generation): array
    {
        $data = [
            'id' => $generation->id,
            'type' => $generation->type,
            'model' => $generation->model,
            'provider' => $generation->provider,
            'prompt' => $generation->prompt,
            'negative_prompt' => $generation->negative_prompt,
            'parameters' => $generation->parameters,
            'aspect_ratio' => $generation->aspect_ratio,
            'resolution' => $generation->resolution,
            'has_audio' => $generation->has_audio,
            'credits_used' => $generation->credits_used,
            'status' => $generation->status,
            'status_color' => $generation->status_color,
            'type_icon' => $generation->type_icon,
            'error_message' => $generation->error_message,
            'processing_time' => $generation->processing_time,
            'formatted_processing_time' => $generation->formatted_processing_time,
            'created_at' => $generation->created_at?->toISOString(),
            'updated_at' => $generation->updated_at?->toISOString(),
        ];

        // Add result URLs if completed
        if ($generation->isCompleted() && $generation->result_path) {
            $disk = config('ai-generation.storage.disk');
            $url = Storage::disk($disk)->url($generation->result_path);
            $data['result_url'] = $url;
            $data['output_url'] = $url; // Alias for frontend compatibility
            $data['download_url'] = $url;
        }

        return $data;
    }
}
