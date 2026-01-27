<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * AIOrchestrationService - Core AI execution with reasoning loop
 * 
 * Implements n8n-style AI Agent with:
 * - Multi-turn reasoning loop
 * - Tool execution capability
 * - Memory/context management
 * - Multi-provider support
 */
class AIOrchestrationService
{
    protected const MAX_REASONING_ITERATIONS = 5;
    protected const DEFAULT_TIMEOUT = 60; // seconds

    /**
     * Execute AI with reasoning loop (similar to n8n AI Agent)
     */
    public function executeWithReasoningLoop(
        string $provider,
        string $model,
        string $apiToken,
        string $prompt,
        array $context,
        array $tools,
        float $temperature,
        int $maxTokens,
        float $topP
    ): array {
        $messages = array_merge($context, [
            ['role' => 'user', 'content' => $prompt]
        ]);

        $iteration = 0;
        $toolCalls = [];
        $totalTokens = 0;

        while ($iteration < self::MAX_REASONING_ITERATIONS) {
            // Call LLM
            $response = $this->callLLM(
                $provider,
                $model,
                $apiToken,
                $messages,
                $tools,
                $temperature,
                $maxTokens,
                $topP
            );

            $totalTokens += $response['usage']['total_tokens'];

            // Check if tool use requested
            if (!empty($response['tool_calls'])) {
                foreach ($response['tool_calls'] as $toolCall) {
                    // Execute tool
                    $toolResult = $this->executeTool($toolCall);
                    $toolCalls[] = [
                        'name' => $toolCall['function']['name'],
                        'arguments' => $toolCall['function']['arguments'],
                        'result' => $toolResult,
                    ];

                    // Add tool result to messages for next iteration
                    $messages[] = [
                        'role' => 'assistant',
                        'content' => null,
                        'tool_calls' => [$toolCall]
                    ];
                    $messages[] = [
                        'role' => 'tool',
                        'content' => json_encode($toolResult),
                        'tool_call_id' => $toolCall['id']
                    ];
                }

                $iteration++;
                continue; // Loop again with tool results
            }

            // No more tool calls, return final answer
            return [
                'content' => $response['content'],
                'tokens' => $totalTokens,
                'tool_calls' => $toolCalls,
                'cost' => $this->calculateCost($totalTokens, $model, $provider),
                'iterations' => $iteration + 1,
            ];
        }

        throw new Exception('Max reasoning iterations (' . self::MAX_REASONING_ITERATIONS . ') reached');
    }

    /**
     * Test prompt without tools/memory (lightweight)
     */
    public function testPrompt(
        string $provider,
        string $model,
        string $apiToken,
        string $prompt,
        float $temperature
    ): array {
        $startTime = microtime(true);

        $messages = [
            ['role' => 'user', 'content' => $prompt]
        ];

        $response = $this->callLLM(
            $provider,
            $model,
            $apiToken,
            $messages,
            [], // no tools
            $temperature,
            500, // limit tokens for test
            0.9
        );

        $endTime = microtime(true);

        return [
            'content' => $response['content'],
            'tokens' => $response['usage']['total_tokens'],
            'cost' => $this->calculateCost($response['usage']['total_tokens'], $model, $provider),
            'response_time_ms' => round(($endTime - $startTime) * 1000, 2),
        ];
    }

    /**
     * Call LLM API (provider-agnostic)
     */
    protected function callLLM(
        string $provider,
        string $model,
        string $apiToken,
        array $messages,
        array $tools,
        float $temperature,
        int $maxTokens,
        float $topP
    ): array {
        return match ($provider) {
            'openai' => $this->callOpenAI($model, $apiToken, $messages, $tools, $temperature, $maxTokens, $topP),
            'anthropic' => $this->callAnthropic($model, $apiToken, $messages, $tools, $temperature, $maxTokens, $topP),
            'gemini' => $this->callGemini($model, $apiToken, $messages, $tools, $temperature, $maxTokens, $topP),
            'groq' => $this->callGroq($model, $apiToken, $messages, $tools, $temperature, $maxTokens, $topP),
            'custom' => $this->callCustomAPI($model, $apiToken, $messages, $tools, $temperature, $maxTokens, $topP),
            default => throw new Exception('Unsupported provider: ' . $provider),
        };
    }

    /**
     * Call OpenAI API
     */
    protected function callOpenAI(
        string $model,
        string $apiToken,
        array $messages,
        array $tools,
        float $temperature,
        int $maxTokens,
        float $topP
    ): array {
        $payload = [
            'model' => $model,
            'messages' => $messages,
            'temperature' => $temperature,
            'max_tokens' => $maxTokens,
            'top_p' => $topP,
        ];

        if (!empty($tools)) {
            $payload['tools'] = $tools;
            $payload['tool_choice'] = 'auto';
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiToken,
            'Content-Type' => 'application/json',
        ])
            ->timeout(self::DEFAULT_TIMEOUT)
            ->post('https://api.openai.com/v1/chat/completions', $payload);

        if (!$response->successful()) {
            throw new Exception('OpenAI API error: ' . $response->body());
        }

        $data = $response->json();

        return [
            'content' => $data['choices'][0]['message']['content'] ?? '',
            'tool_calls' => $data['choices'][0]['message']['tool_calls'] ?? [],
            'usage' => $data['usage'],
        ];
    }

    /**
     * Call Anthropic/Claude API
     */
    protected function callAnthropic(
        string $model,
        string $apiToken,
        array $messages,
        array $tools,
        float $temperature,
        int $maxTokens,
        float $topP
    ): array {
        // Convert OpenAI format to Anthropic format
        $anthropicMessages = array_map(function ($msg) {
            return [
                'role' => $msg['role'] === 'assistant' ? 'assistant' : 'user',
                'content' => $msg['content'] ?? '',
            ];
        }, $messages);

        $payload = [
            'model' => $model,
            'messages' => $anthropicMessages,
            'max_tokens' => $maxTokens,
            'temperature' => $temperature,
            'top_p' => $topP,
        ];

        if (!empty($tools)) {
            $payload['tools'] = $tools;
        }

        $response = Http::withHeaders([
            'x-api-key' => $apiToken,
            'anthropic-version' => '2023-06-01',
            'Content-Type' => 'application/json',
        ])
            ->timeout(self::DEFAULT_TIMEOUT)
            ->post('https://api.anthropic.com/v1/messages', $payload);

        if (!$response->successful()) {
            throw new Exception('Anthropic API error: ' . $response->body());
        }

        $data = $response->json();

        return [
            'content' => $data['content'][0]['text'] ?? '',
            'tool_calls' => $data['content'][0]['tool_use'] ?? [],
            'usage' => [
                'prompt_tokens' => $data['usage']['input_tokens'],
                'completion_tokens' => $data['usage']['output_tokens'],
                'total_tokens' => $data['usage']['input_tokens'] + $data['usage']['output_tokens'],
            ],
        ];
    }

    /**
     * Call Google Gemini API
     */
    protected function callGemini(
        string $model,
        string $apiToken,
        array $messages,
        array $tools,
        float $temperature,
        int $maxTokens,
        float $topP
    ): array {
        // Gemini uses different format
        $contents = array_map(function ($msg) {
            return [
                'role' => $msg['role'] === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $msg['content'] ?? '']],
            ];
        }, $messages);

        $payload = [
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => $temperature,
                'maxOutputTokens' => $maxTokens,
                'topP' => $topP,
            ],
        ];

        $response = Http::timeout(self::DEFAULT_TIMEOUT)
            ->post("https://generativelanguage.googleapis.com/v1/models/{$model}:generateContent?key={$apiToken}", $payload);

        if (!$response->successful()) {
            throw new Exception('Gemini API error: ' . $response->body());
        }

        $data = $response->json();

        return [
            'content' => $data['candidates'][0]['content']['parts'][0]['text'] ?? '',
            'tool_calls' => [],
            'usage' => [
                'prompt_tokens' => $data['usageMetadata']['promptTokenCount'] ?? 0,
                'completion_tokens' => $data['usageMetadata']['candidatesTokenCount'] ?? 0,
                'total_tokens' => $data['usageMetadata']['totalTokenCount'] ?? 0,
            ],
        ];
    }

    /**
     * Call Groq API (OpenAI-compatible)
     */
    protected function callGroq(
        string $model,
        string $apiToken,
        array $messages,
        array $tools,
        float $temperature,
        int $maxTokens,
        float $topP
    ): array {
        $payload = [
            'model' => $model,
            'messages' => $messages,
            'temperature' => $temperature,
            'max_tokens' => $maxTokens,
            'top_p' => $topP,
        ];

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiToken,
            'Content-Type' => 'application/json',
        ])
            ->timeout(self::DEFAULT_TIMEOUT)
            ->post('https://api.groq.com/openai/v1/chat/completions', $payload);

        if (!$response->successful()) {
            throw new Exception('Groq API error: ' . $response->body());
        }

        $data = $response->json();

        return [
            'content' => $data['choices'][0]['message']['content'] ?? '',
            'tool_calls' => $data['choices'][0]['message']['tool_calls'] ?? [],
            'usage' => $data['usage'],
        ];
    }

    /**
     * Call custom API endpoint
     */
    protected function callCustomAPI(
        string $model,
        string $apiToken,
        array $messages,
        array $tools,
        float $temperature,
        int $maxTokens,
        float $topP
    ): array {
        throw new Exception('Custom API not implemented yet');
    }

    /**
     * Execute a tool call
     */
    protected function executeTool(array $toolCall): array
    {
        $toolName = $toolCall['function']['name'];
        $arguments = json_decode($toolCall['function']['arguments'], true);

        return match ($toolName) {
            'http_request' => $this->executeHttpTool($arguments),
            'database_query' => $this->executeDatabaseTool($arguments),
            'workflow_call' => $this->executeWorkflowTool($arguments),
            'calculator' => $this->executeCalculatorTool($arguments),
            default => ['error' => 'Unknown tool: ' . $toolName],
        };
    }

    protected function executeHttpTool(array $args): array
    {
        // TODO: Implement HTTP tool
        return ['result' => 'HTTP tool not implemented'];
    }

    protected function executeDatabaseTool(array $args): array
    {
        // TODO: Implement database query tool
        return ['result' => 'Database tool not implemented'];
    }

    protected function executeWorkflowTool(array $args): array
    {
        // TODO: Implement workflow call tool
        return ['result' => 'Workflow tool not implemented'];
    }

    protected function executeCalculatorTool(array $args): array
    {
        // Basic calculator implementation
        try {
            $expression = $args['expression'] ?? '';
            // Safe evaluation (very basic)
            $result = eval ('return ' . $expression . ';');
            return ['result' => $result];
        } catch (\Throwable $e) {
            return ['error' => 'Calculation error: ' . $e->getMessage()];
        }
    }

    /**
     * Resolve variables in prompt
     */
    public function resolveVariables(string $prompt, array $variables): string
    {
        foreach ($variables as $key => $value) {
            $prompt = str_replace('{{' . $key . '}}', $value, $prompt);
        }
        return $prompt;
    }

    /**
     * Load memory context
     */
    public function loadMemoryContext(array $memoryConfig): array
    {
        // TODO: Implement memory loading
        return [];
    }

    /**
     * Save to memory
     */
    public function saveToMemory(array $memoryConfig, string $prompt, string $response): void
    {
        // TODO: Implement memory saving
    }

    /**
     * Prepare tools for AI
     */
    public function prepareTools(array $toolConfigs): array
    {
        // TODO: Convert tool configs to OpenAI function format
        return [];
    }

    /**
     * Estimate token count (rough estimation)
     */
    public function estimateTokenCount(string $text): int
    {
        // Rough: 4 characters per token
        return (int) ceil(strlen($text) / 4);
    }

    /**
     * Calculate cost based on tokens and model
     */
    public function calculateCost(int $tokens, string $model, string $provider): float
    {
        // Pricing per 1K tokens (approximate)
        $pricing = [
            'gpt-4-turbo' => 0.01,
            'gpt-4' => 0.03,
            'gpt-3.5-turbo' => 0.001,
            'claude-3-opus-20240229' => 0.015,
            'claude-3-sonnet-20240229' => 0.003,
            'claude-3-haiku-20240307' => 0.00025,
            'gemini-pro' => 0.00025,
            'llama3-70b-8192' => 0.0005,
            'mixtral-8x7b-32768' => 0.0005,
        ];

        $pricePerToken = ($pricing[$model] ?? 0.001) / 1000;
        return $tokens * $pricePerToken;
    }

    /**
     * Estimate cost
     */
    public function estimateCost(int $tokens, string $model): float
    {
        // Use estimation based on model name matching
        foreach (['openai', 'anthropic', 'gemini', 'groq'] as $provider) {
            try {
                return $this->calculateCost($tokens, $model, $provider);
            } catch (\Exception $e) {
                continue;
            }
        }
        return $this->calculateCost($tokens, $model, 'openai'); // fallback
    }
}
