<?php

namespace App\Services;

use App\Models\Flow;
use App\Models\DataCollection;
use App\Models\FlowNode;
use Illuminate\Support\Arr;

/**
 * Service for building and resolving variable context in workflow execution.
 * 
 * DataSourceNodes provide variables like {{records}}, {{count}} that can be
 * referenced by other nodes (Loop, TextInput, Condition, etc.)
 */
class VariableContextService
{
    /**
     * Build execution context from all DataSourceNodes and FileInputNodes in a flow
     */
    public function buildContext(Flow $flow, ?array $selectedRecordIds = null): array
    {
        $context = [
            'system' => $this->getSystemVariables(),
            'dataSources' => [],
            'records' => [],
            'count' => 0,
        ];

        // Find all DataSource nodes in flow
        $dataSourceNodes = FlowNode::where('flow_id', $flow->id)
            ->where('type', 'data_source')
            ->get();

        foreach ($dataSourceNodes as $node) {
            $nodeData = $this->parseNodeData($node->data);
            $collectionId = $nodeData['collectionId'] ?? null;

            if (!$collectionId) {
                continue;
            }

            $collection = DataCollection::with('records')->find($collectionId);
            if (!$collection) {
                continue;
            }

            // Build records array from collection
            $recordsQuery = $collection->records();

            // If specific records are selected, filter by IDs
            if ($selectedRecordIds !== null && !empty($selectedRecordIds)) {
                $recordsQuery->whereIn('id', $selectedRecordIds);
            }

            $records = $recordsQuery->get()->map(function ($record) {
                // Each record has a `data` JSON column containing the actual fields
                if (is_array($record->data)) {
                    $data = $record->data;
                } elseif (is_string($record->data)) {
                    $data = json_decode($record->data, true) ?? [];
                } else {
                    $data = [];
                }
                return array_merge(['_id' => $record->id], $data);
            })->toArray();

            // Get the custom output name (or default to collection name or 'records')
            $outputName = $nodeData['outputName']
                ?? strtolower(str_replace(' ', '_', $collection->name))
                ?? 'records';

            // Store in context with node reference
            $context['dataSources'][$node->node_id] = [
                'collectionId' => $collectionId,
                'collectionName' => $collection->name,
                'outputName' => $outputName,
                'schema' => $collection->schema,
                'records' => $records,
                'count' => count($records),
            ];

            // Expose with NAMED variable (e.g., {{customers}})
            $context[$outputName] = [
                'records' => $records,
                'count' => count($records),
                'schema' => $collection->schema,
            ];

            // Also expose as global variables for backward compatibility
            $context['records'] = $records;
            $context['count'] = count($records);
        }

        // Process FileInput nodes (file_input) - resolve file path or random from folder
        $fileInputNodes = FlowNode::where('flow_id', $flow->id)
            ->where('type', 'file_input')
            ->get();

        foreach ($fileInputNodes as $node) {
            $nodeData = $this->parseNodeData($node->data);
            $outputVariable = $nodeData['outputVariable'] ?? 'filePath';
            $selectionType = $nodeData['selectionType'] ?? 'file';

            if ($selectionType === 'folder') {
                // Random file from folder
                $folderPath = $nodeData['folderPath'] ?? null;
                if ($folderPath) {
                    $filePath = $this->getRandomFileFromFolder($flow->user_id, $folderPath);
                    $context[$outputVariable] = $filePath;
                }
            } else {
                // Fixed file path
                $filePath = $nodeData['filePath'] ?? null;
                $context[$outputVariable] = $filePath;
            }
        }

        return $context;
    }

    /**
     * Get a random file URL from a folder in user's media library
     */
    private function getRandomFileFromFolder(int $userId, string $folderPath): ?string
    {
        $file = \App\Models\UserMedia::where('user_id', $userId)
            ->where('folder', $folderPath)
            ->inRandomOrder()
            ->first();

        return $file?->url;
    }


    /**
     * Build context directly from record IDs (Campaign mode)
     * This allows Campaigns to inject data into workflow execution
     * without requiring a DataSourceNode in the workflow.
     * 
     * @param DataCollection $collection The data collection from campaign
     * @param array $recordIds Specific record IDs to include
     * @param string|null $outputName Custom variable name (default: collection name)
     * @return array Context with records accessible as {{records}}, {{outputName}}, etc.
     */
    public function buildContextFromRecords(
        DataCollection $collection,
        array $recordIds,
        ?string $outputName = null
    ): array {
        $context = [
            'system' => $this->getSystemVariables(),
            'dataSources' => [],
            'records' => [],
            'count' => 0,
        ];

        // Fetch records by IDs from collection
        $records = $collection->records()
            ->whereIn('id', $recordIds)
            ->get()
            ->map(function ($record) {
                if (is_array($record->data)) {
                    $data = $record->data;
                } elseif (is_string($record->data)) {
                    $data = json_decode($record->data, true) ?? [];
                } else {
                    $data = [];
                }
                return array_merge(['_id' => $record->id], $data);
            })
            ->toArray();

        // Determine output variable name
        $variableName = $outputName
            ?? strtolower(str_replace(' ', '_', $collection->name))
            ?? 'records';

        // Store collection info
        $context['dataSources']['campaign'] = [
            'collectionId' => $collection->id,
            'collectionName' => $collection->name,
            'outputName' => $variableName,
            'schema' => $collection->schema,
            'records' => $records,
            'count' => count($records),
        ];

        // Expose with NAMED variable (e.g., {{customers}})
        $context[$variableName] = [
            'records' => $records,
            'count' => count($records),
            'schema' => $collection->schema,
        ];

        // Also expose as global variables for backward compatibility
        $context['records'] = $records;
        $context['count'] = count($records);

        return $context;
    }

    /**
     * Build context for a specific iteration in a loop
     */
    public function buildIterationContext(
        array $baseContext,
        array $item,
        int $index,
        string $itemVariable = 'item',
        string $indexVariable = 'index'
    ): array {
        return array_merge($baseContext, [
            $itemVariable => $item,
            $indexVariable => $index,
            'item' => $item, // Always provide 'item' as fallback
            'index' => $index, // Always provide 'index' as fallback
        ]);
    }

    /**
     * Interpolate all {{variable}} placeholders in a string
     */
    public function interpolate(string $text, array $context): string
    {
        if (!str_contains($text, '{{')) {
            return $text;
        }

        return preg_replace_callback('/\{\{(.*?)\}\}/', function ($matches) use ($context) {
            $path = trim($matches[1]);
            $resolved = $this->resolveVariable($path, $context);

            // Return original placeholder if not resolved
            return $resolved !== null ? $resolved : $matches[0];
        }, $text);
    }

    /**
     * Interpolate variables in an array of params (recursive)
     */
    public function interpolateParams(array $params, array $context): array
    {
        foreach ($params as $key => $value) {
            if (is_string($value) && str_contains($value, '{{')) {
                $params[$key] = $this->interpolate($value, $context);
            } elseif (is_array($value)) {
                $params[$key] = $this->interpolateParams($value, $context);
            }
        }

        return $params;
    }

    /**
     * Resolve a dot-notation variable path from context
     * Supports: item.name, records[0].email, system.timestamp, etc.
     */
    public function resolveVariable(string $path, array $context): ?string
    {
        // Handle array index notation: records[0], item[key]
        $path = preg_replace_callback('/\[(\d+|[^\]]+)\]/', function ($m) {
            return '.' . $m[1];
        }, $path);

        $value = Arr::get($context, $path);

        if ($value === null) {
            return null;
        }

        // Convert to string representation
        if (is_scalar($value)) {
            return (string) $value;
        }

        if (is_array($value)) {
            return json_encode($value, JSON_UNESCAPED_UNICODE);
        }

        return null;
    }

    /**
     * Check if a string contains any variable placeholders
     */
    public function hasVariables(string $text): bool
    {
        return str_contains($text, '{{') && str_contains($text, '}}');
    }

    /**
     * Extract all variable names from a string
     */
    public function extractVariables(string $text): array
    {
        preg_match_all('/\{\{(.*?)\}\}/', $text, $matches);
        return array_map('trim', $matches[1] ?? []);
    }

    /**
     * Get system variables available in all contexts
     */
    private function getSystemVariables(): array
    {
        return [
            'timestamp' => time(),
            'datetime' => now()->toIso8601String(),
            'date' => now()->toDateString(),
            'time' => now()->toTimeString(),
            'random' => rand(0, 1000),
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
        ];
    }

    /**
     * Parse node data from various formats
     */
    private function parseNodeData($data): array
    {
        if (is_array($data)) {
            return $data;
        }

        if (is_string($data)) {
            return json_decode($data, true) ?? [];
        }

        return [];
    }
}
