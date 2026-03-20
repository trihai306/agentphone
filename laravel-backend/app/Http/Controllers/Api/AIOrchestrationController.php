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
     * Generate a ReactFlow workflow from a natural language description using AI
     *
     * POST /api/ai/generate-flow
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function generateFlow(Request $request)
    {
        $request->validate([
            'description' => 'required|string|max:2000',
            'provider' => 'nullable|string|in:openai,anthropic,gemini,groq',
        ]);

        $provider = $request->input('provider', 'gemini');

        $systemPrompt = <<<'PROMPT'
You are a workflow automation expert. Generate a ReactFlow workflow from the user's description.

Available node types and their params:
- open_app: { packageName: "com.example.app" }
- click/tap: { x: number, y: number, resourceId?: string, text?: string, contentDescription?: string }
- text_input: { text: "value", resourceId?: string, x?: number, y?: number }
- scroll: { direction: "up"|"down"|"left"|"right", amount?: number }
- swipe: { direction: "up"|"down"|"left"|"right", startX?: number, startY?: number }
- wait: { duration: number_ms }
- condition: { leftValue: string, operator: "=="|"!="|">"|"<", rightValue: string }
- loop: { iterations: number, dataSource: "fixed" }
- assert: { assertType: "exists"|"not_exists"|"text_equals", resourceId?: string, text?: string }
- key_event: { key: "KEYCODE_BACK"|"KEYCODE_HOME"|"KEYCODE_ENTER" }
- long_tap: { x: number, y: number, duration?: number }
- double_tap: { x: number, y: number }

Output ONLY valid JSON with this exact structure:
{
  "nodes": [
    {
      "id": "node-1",
      "type": "open_app",
      "position": { "x": 400, "y": 100 },
      "data": { "label": "Open Facebook", "packageName": "com.facebook.katana" }
    }
  ],
  "edges": [
    {
      "id": "edge-1-2",
      "source": "node-1",
      "target": "node-2",
      "type": "smoothstep",
      "animated": true
    }
  ]
}

Rules:
- Position nodes vertically, increment y by 180 for each node
- Use descriptive labels in the user's language
- Always start with a "start" type node
- Connect all nodes sequentially with edges
- Use realistic coordinates for tap actions (1080x2400 screen)
- Include wait nodes between actions (500-2000ms)
PROMPT;

        // Get API token: from request, env, or config
        $apiToken = $request->input('api_token')
            ?: config("services.{$provider}.key")
            ?: env('GEMINI_API_KEY')
            ?: env('GOOGLE_AI_API_KEY')
            ?: env('GOOGLE_AI_KEY');

        if (!$apiToken) {
            return response()->json([
                'success' => false,
                'error' => 'No API key configured. Set GEMINI_API_KEY in .env or pass api_token in request.',
            ], 422);
        }

        try {
            // Call Gemini directly via HTTP (simple, no reasoning loop needed)
            $model = match ($provider) {
                'gemini' => 'gemini-2.0-flash',
                'openai' => 'gpt-4o-mini',
                default => 'gemini-2.0-flash',
            };

            $messages = [
                ['role' => 'user', 'content' => $systemPrompt . "\n\nUser request: " . $request->input('description')],
            ];

            $service = app(\App\Services\AIOrchestrationService::class);

            // Use the existing callLLM via reflection (it's protected)
            $reflection = new \ReflectionMethod($service, 'callLLM');
            $reflection->setAccessible(true);
            $result = $reflection->invoke($service, $provider, $model, $apiToken, $messages, [], 0.3, 4000, 0.9);

            $content = $result['content'] ?? '';

            // Try to extract JSON from the response (handle markdown code blocks)
            $content = preg_replace('/```json\s*/', '', $content);
            $content = preg_replace('/```\s*/', '', $content);
            $content = trim($content);

            $flowData = json_decode($content, true);
            if (!$flowData && preg_match('/\{[\s\S]*"nodes"[\s\S]*\}/s', $content, $matches)) {
                $flowData = json_decode($matches[0], true);
            }

            if ($flowData && isset($flowData['nodes'])) {
                return response()->json([
                    'success' => true,
                    'nodes' => $flowData['nodes'],
                    'edges' => $flowData['edges'] ?? [],
                    'provider' => $provider,
                    'model' => $model,
                ]);
            }

            return response()->json([
                'success' => false,
                'error' => 'Could not parse AI response into workflow format',
                'raw' => substr($content, 0, 500),
            ], 422);

        } catch (\Exception $e) {
            Log::error('AI Generate Flow failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
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
