<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\AIOrchestrationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

/**
 * AIOrchestrationController - API endpoints for AI Agent node execution
 * 
 * Provides endpoints for:
 * - Executing AI with tools and memory
 * - Testing prompts before saving
 * - Getting available models for providers
 * - Estimating token count and cost
 */
class AIOrchestrationController extends Controller
{
    protected AIOrchestrationService $aiService;

    public function __construct(AIOrchestrationService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Execute AI node with tools and memory
     * 
     * POST /api/ai/execute
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function execute(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'provider' => 'required|string|in:openai,anthropic,gemini,groq,custom',
            'model' => 'required|string',
            'prompt' => 'required|string',
            'api_token' => 'required|string',
            'variables' => 'array',
            'tools' => 'array',
            'memory' => 'array',
            'temperature' => 'numeric|min:0|max:2',
            'max_tokens' => 'integer|min:1|max:100000',
            'top_p' => 'numeric|min:0|max:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $validated = $validator->validated();

            // 1. Variable substitution
            $resolvedPrompt = $this->aiService->resolveVariables(
                $validated['prompt'],
                $validated['variables'] ?? []
            );

            // 2. Load memory context
            $context = $this->aiService->loadMemoryContext($validated['memory'] ?? []);

            // 3. Prepare tools
            $availableTools = $this->aiService->prepareTools($validated['tools'] ?? []);

            // 4. Execute AI call with reasoning loop
            $result = $this->aiService->executeWithReasoningLoop(
                provider: $validated['provider'],
                model: $validated['model'],
                apiToken: $validated['api_token'],
                prompt: $resolvedPrompt,
                context: $context,
                tools: $availableTools,
                temperature: $validated['temperature'] ?? 0.7,
                maxTokens: $validated['max_tokens'] ?? 2000,
                topP: $validated['top_p'] ?? 0.9
            );

            // 5. Save to memory if configured
            if (!empty($validated['memory'])) {
                $this->aiService->saveToMemory(
                    $validated['memory'],
                    $resolvedPrompt,
                    $result['content']
                );
            }

            return response()->json([
                'success' => true,
                'result' => $result['content'],
                'metadata' => [
                    'tokens_used' => $result['tokens'],
                    'tools_called' => $result['tool_calls'] ?? [],
                    'cost' => $result['cost'],
                    'iterations' => $result['iterations'] ?? 1,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('AI execution failed', [
                'error' => $e->getMessage(),
                'provider' => $validated['provider'] ?? null,
                'model' => $validated['model'] ?? null,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'AI execution failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Test prompt with real API call (lightweight version)
     * 
     * POST /api/ai/test-prompt
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function testPrompt(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'provider' => 'required|string|in:openai,anthropic,gemini,groq,custom',
            'model' => 'required|string',
            'prompt' => 'required|string',
            'api_token' => 'required|string',
            'temperature' => 'numeric|min:0|max:2',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $validated = $validator->validated();

            // Simple test call without tools/memory
            $result = $this->aiService->testPrompt(
                provider: $validated['provider'],
                model: $validated['model'],
                apiToken: $validated['api_token'],
                prompt: $validated['prompt'],
                temperature: $validated['temperature'] ?? 0.7
            );

            return response()->json([
                'success' => true,
                'result' => $result['content'],
                'tokens_used' => $result['tokens'],
                'cost' => $result['cost'],
                'debug' => [
                    'response_time_ms' => $result['response_time_ms'] ?? null,
                    'model_used' => $validated['model'],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Test failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get available models for a provider
     * 
     * GET /api/ai/models/{provider}
     * 
     * @param string $provider
     * @return \Illuminate\Http\JsonResponse
     */
    public function getModels(string $provider)
    {
        $models = [
            'openai' => [
                ['id' => 'gpt-4-turbo', 'name' => 'GPT-4 Turbo', 'max_tokens' => 128000],
                ['id' => 'gpt-4', 'name' => 'GPT-4', 'max_tokens' => 8192],
                ['id' => 'gpt-3.5-turbo', 'name' => 'GPT-3.5 Turbo', 'max_tokens' => 16385],
            ],
            'anthropic' => [
                ['id' => 'claude-3-opus-20240229', 'name' => 'Claude 3 Opus', 'max_tokens' => 200000],
                ['id' => 'claude-3-sonnet-20240229', 'name' => 'Claude 3 Sonnet', 'max_tokens' => 200000],
                ['id' => 'claude-3-haiku-20240307', 'name' => 'Claude 3 Haiku', 'max_tokens' => 200000],
            ],
            'gemini' => [
                ['id' => 'gemini-pro', 'name' => 'Gemini Pro', 'max_tokens' => 30720],
                ['id' => 'gemini-pro-vision', 'name' => 'Gemini Pro Vision', 'max_tokens' => 30720],
            ],
            'groq' => [
                ['id' => 'llama3-70b-8192', 'name' => 'Llama 3 70B', 'max_tokens' => 8192],
                ['id' => 'mixtral-8x7b-32768', 'name' => 'Mixtral 8x7B', 'max_tokens' => 32768],
            ],
        ];

        if (!isset($models[$provider])) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid provider',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'provider' => $provider,
            'models' => $models[$provider],
        ]);
    }

    /**
     * Estimate token count and cost for a prompt
     * 
     * POST /api/ai/estimate-tokens
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function estimateTokens(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'text' => 'required|string',
            'model' => 'required|string',
            'provider' => 'string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();
        $text = $validated['text'];
        $model = $validated['model'];

        // Rough token estimation (4 chars per token average)
        $tokens = $this->aiService->estimateTokenCount($text);

        // Cost estimation based on model
        $cost = $this->aiService->estimateCost($tokens, $model);

        return response()->json([
            'success' => true,
            'tokens' => $tokens,
            'cost' => round($cost, 6),
            'cost_formatted' => '$' . number_format($cost, 6),
            'model' => $model,
        ]);
    }
}
