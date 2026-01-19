<?php

namespace App\Services;

use App\Models\Flow;
use App\Models\FlowNode;
use App\Models\FlowEdge;
use Illuminate\Support\Collection;

/**
 * Service class for Flow business logic
 * Handles graph traversal, action mapping, and execution preparation
 * 
 * @see VariableContextService for variable interpolation
 */
class FlowService
{
    protected VariableContextService $variableService;

    public function __construct(VariableContextService $variableService)
    {
        $this->variableService = $variableService;
    }
    /**
     * Map flow node type to APK action type
     */
    public function mapNodeTypeToAction(string $nodeType): ?string
    {
        $mapping = [
            // Tap/Click actions
            'tap' => 'tap',
            'click' => 'tap',
            'double_tap' => 'double_tap',
            'long_press' => 'long_press',
            'long_click' => 'long_press',

            // Scroll actions
            'scroll' => 'scroll',
            'scroll_up' => 'scroll',
            'scroll_down' => 'scroll',
            'scroll_left' => 'scroll',
            'scroll_right' => 'scroll',
            'swipe' => 'swipe',

            // Text input
            'text_input' => 'text_input',
            'input_text' => 'text_input',
            'type' => 'text_input',

            // Navigation/Control
            'wait' => 'wait',
            'delay' => 'wait',
            'back' => 'back',
            'home' => 'home',
            'recents' => 'recents',
            'screenshot' => 'screenshot',
            'start_app' => 'start_app',
            'launch_app' => 'start_app',

            // Assertions & Conditions
            'assert' => 'assert',
            'element_check' => 'element_check',
            'wait_for_element' => 'wait_for_element',

            // Non-executable nodes (return null)
            'start' => null,
            'end' => null,
            'loop' => null,
            'loopStart' => null,
            'loopEnd' => null,
            'dataSource' => null,
            'condition' => null,
            'variable' => null,
            'input' => null,
            'output' => null,
        ];

        return $mapping[$nodeType] ?? $nodeType;
    }

    /**
     * Extract and normalize action params from node data
     * Maps ReactFlow node data structure to APK-expected params format
     */
    public function extractActionParams(string $actionType, array $nodeData): array
    {
        $actionData = $nodeData['actionData'] ?? $nodeData;

        switch ($actionType) {
            case 'tap':
            case 'double_tap':
            case 'long_press':
                return [
                    'x' => $this->getCoordinate($actionData, 'x'),
                    'y' => $this->getCoordinate($actionData, 'y'),
                    'resourceId' => $actionData['resourceId'] ?? null,
                    'contentDescription' => $actionData['contentDescription'] ?? null,
                    'text' => $actionData['text'] ?? null,
                    'className' => $actionData['className'] ?? null,
                    'bounds' => $actionData['bounds'] ?? null,
                ];

            case 'scroll':
            case 'swipe':
                return $this->extractScrollParams($actionData, $nodeData);

            case 'text_input':
                return [
                    'text' => $actionData['text'] ?? $nodeData['text'] ?? '',
                    'resourceId' => $actionData['resourceId'] ?? null,
                    'contentDescription' => $actionData['contentDescription'] ?? null,
                    'x' => $this->getCoordinate($actionData, 'x'),
                    'y' => $this->getCoordinate($actionData, 'y'),
                ];

            case 'assert':
                return $this->extractAssertParams($actionData, $nodeData);

            case 'element_check':
                return $this->extractElementCheckParams($actionData, $nodeData);

            case 'wait_for_element':
                return $this->extractWaitForElementParams($actionData, $nodeData);

            case 'start_app':
                return [
                    'package_name' => $nodeData['packageName'] ?? $nodeData['package'] ?? '',
                    'activity' => $nodeData['activity'] ?? null,
                ];

            case 'wait':
                return [
                    'duration' => $nodeData['duration'] ?? $nodeData['delay'] ?? 1000,
                ];

            case 'screenshot':
                return [
                    'filename' => $nodeData['filename'] ?? null,
                ];

            default:
                return $nodeData;
        }
    }

    /**
     * Traverse flow graph and get actions in execution order
     * Legacy method - use traverseFlowForActionsWithContext for data-driven workflows
     */
    public function traverseFlowForActions(Flow $flow): array
    {
        return $this->traverseFlowForActionsWithContext($flow, []);
    }

    /**
     * Traverse flow graph with variable context for data-driven execution
     * 
     * @param Flow $flow The workflow to traverse
     * @param array|null $selectedRecordIds Optional: specific record IDs to use
     * @return array List of actions with interpolated variables
     */
    public function traverseFlowForActionsWithContext(Flow $flow, ?array $selectedRecordIds = null): array
    {
        $nodes = FlowNode::where('flow_id', $flow->id)->get();
        $edges = FlowEdge::where('flow_id', $flow->id)->get();

        if ($nodes->isEmpty()) {
            return [];
        }

        // Build variable context from DataSourceNodes
        $context = $this->variableService->buildContext($flow, $selectedRecordIds);

        // Index nodes by node_id
        $allNodes = $nodes->keyBy('node_id');

        // Build adjacency list with source handles
        $adjacency = [];
        foreach ($edges as $edge) {
            $sourceHandle = $edge->source_handle ?? 'default';
            $adjacency[$edge->source_node_id][$sourceHandle] = $edge->target_node_id;
        }

        // Find start node
        $startNode = $this->findStartNode($allNodes, $edges);
        if (!$startNode) {
            return [];
        }

        // Traverse from start
        $actions = [];
        $visited = [];
        $currentNodeId = $startNode->node_id;
        $maxIterations = 100;
        $iteration = 0;

        while ($currentNodeId && $iteration < $maxIterations) {
            $iteration++;

            if (isset($visited[$currentNodeId])) {
                break;
            }
            $visited[$currentNodeId] = true;

            $node = $allNodes->get($currentNodeId);
            if (!$node) {
                break;
            }

            // Handle Loop nodes with data-driven expansion
            if ($node->type === 'loop') {
                $actions = array_merge(
                    $actions,
                    $this->expandLoopNodeWithData($node, $adjacency, $currentNodeId, $context)
                );

                // Follow 'complete' edge
                $currentNodeId = $adjacency[$currentNodeId]['complete']
                    ?? $adjacency[$currentNodeId]['true']
                    ?? null;
                continue;
            }

            // Skip non-action nodes
            $actionType = $this->mapNodeTypeToAction($node->type);
            if (!$actionType) {
                $currentNodeId = $this->getNextNodeId($adjacency, $currentNodeId);
                continue;
            }

            // Build action with interpolated params
            $nodeData = $this->parseNodeData($node->data);
            $action = $this->buildAction($node, $actionType, $nodeData, $adjacency);

            // Interpolate variables in params (for non-loop actions)
            $action['params'] = $this->variableService->interpolateParams($action['params'], $context);
            $actions[] = $action;

            $currentNodeId = $this->getNextNodeId($adjacency, $currentNodeId);
        }

        return $actions;
    }

    /**
     * Find the start node of the flow
     */
    private function findStartNode(Collection $allNodes, Collection $edges): ?FlowNode
    {
        // Look for explicit start node
        $startNode = $allNodes->first(fn($n) => $n->type === 'start');
        if ($startNode) {
            return $startNode;
        }

        // Fallback: Find entry point (source but not target)
        $targetNodeIds = $edges->pluck('target_node_id')->unique();
        $sourceNodeIds = $edges->pluck('source_node_id')->unique();

        $entryNodeIds = $sourceNodeIds->diff($targetNodeIds);
        if ($entryNodeIds->isNotEmpty()) {
            return $allNodes->get($entryNodeIds->first());
        }

        // Final fallback: first action node
        $skipTypes = ['end', 'dataSource', 'condition', 'assert'];
        return $allNodes->first(fn($n) => !in_array($n->type, $skipTypes));
    }

    /**
     * Get next node ID from adjacency list
     */
    private function getNextNodeId(array $adjacency, string $currentNodeId): ?string
    {
        if (!isset($adjacency[$currentNodeId])) {
            return null;
        }

        return $adjacency[$currentNodeId]['true']
            ?? $adjacency[$currentNodeId]['default']
            ?? $adjacency[$currentNodeId]['complete']
            ?? reset($adjacency[$currentNodeId]) ?: null;
    }

    /**
     * Build action array from node
     */
    private function buildAction(FlowNode $node, string $actionType, array $nodeData, array $adjacency): array
    {
        // Check for FALSE handle connection (error branch)
        $hasErrorBranch = isset($adjacency[$node->node_id]['false']);
        $errorBranchTarget = $hasErrorBranch ? $adjacency[$node->node_id]['false'] : null;

        // Frontend saves delay as 'timeout', map to 'wait_after' for APK
        $waitAfter = $nodeData['timeout']
            ?? $nodeData['wait_after']
            ?? $nodeData['waitAfter']
            ?? 500;

        return [
            'id' => $node->node_id,
            'type' => $actionType,
            'params' => $this->extractActionParams($actionType, $nodeData),
            'wait_after' => (int) $waitAfter,
            'on_error' => $nodeData['onError'] ?? 'stop',
            'retry_attempts' => $nodeData['retryAttempts'] ?? 3,
            'has_error_branch' => $hasErrorBranch,
            'error_branch_target' => $errorBranchTarget,
        ];
    }

    /**
     * Expand loop node into repeated actions (legacy, no data context)
     */
    private function expandLoopNode(FlowNode $node, array $adjacency, string $currentNodeId): array
    {
        return $this->expandLoopNodeWithData($node, $adjacency, $currentNodeId, []);
    }

    /**
     * Expand loop node with data-driven iteration
     * Supports both fixed iterations and data source-driven loops
     */
    private function expandLoopNodeWithData(FlowNode $node, array $adjacency, string $currentNodeId, array $context): array
    {
        $nodeData = $this->parseNodeData($node->data);
        $dataSource = $nodeData['dataSource'] ?? 'fixed';
        $subFlow = $nodeData['subFlow'] ?? null;

        if (!$subFlow || empty($subFlow['nodes'])) {
            return [];
        }

        // Determine iteration data
        $records = [];
        if ($dataSource === 'data' || $dataSource === 'collection') {
            // Use records from DataSourceNode context
            $records = $context['records'] ?? [];
        } else {
            // Fixed iterations - create dummy records
            $iterations = $nodeData['iterations'] ?? 3;
            for ($i = 0; $i < $iterations; $i++) {
                $records[] = ['_iteration' => $i];
            }
        }

        if (empty($records)) {
            return [];
        }

        // Get variable names for loop context
        $itemVariable = $nodeData['itemVariable'] ?? 'item';
        $indexVariable = $nodeData['indexVariable'] ?? 'index';

        // Build template actions from subflow
        $subFlowActionTemplates = [];
        foreach ($subFlow['nodes'] as $subNode) {
            if (in_array($subNode['type'], ['loopStart', 'loopEnd'])) {
                continue;
            }

            $subActionType = $this->mapNodeTypeToAction($subNode['type']);
            if (!$subActionType) {
                continue;
            }

            $subNodeData = $subNode['data'] ?? [];
            $subWaitAfter = $subNodeData['timeout']
                ?? $subNodeData['wait_after']
                ?? $subNodeData['waitAfter']
                ?? 500;

            $subFlowActionTemplates[] = [
                'id' => $subNode['id'],
                'type' => $subActionType,
                'params' => $this->extractActionParams($subActionType, $subNodeData),
                'wait_after' => (int) $subWaitAfter,
                'on_error' => $subNodeData['onError'] ?? 'stop',
                'retry_attempts' => $subNodeData['retryAttempts'] ?? 3,
                'has_error_branch' => false,
                'error_branch_target' => null,
            ];
        }

        // Expand for each record with interpolated variables
        $expandedActions = [];
        foreach ($records as $index => $record) {
            // Build iteration-specific context
            $iterationContext = $this->variableService->buildIterationContext(
                $context,
                $record,
                $index,
                $itemVariable,
                $indexVariable
            );

            foreach ($subFlowActionTemplates as $action) {
                // Clone and interpolate params for this iteration
                $interpolatedParams = $this->variableService->interpolateParams(
                    $action['params'],
                    $iterationContext
                );

                $expandedActions[] = array_merge($action, [
                    'id' => "{$action['id']}_iter_{$index}",
                    'params' => $interpolatedParams,
                    'iteration_context' => [
                        'index' => $index,
                        'total' => count($records),
                        'item_variable' => $itemVariable,
                    ],
                ]);
            }
        }

        return $expandedActions;
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

    // ===========================================
    // Helper methods for parameter extraction
    // ===========================================

    private function getCoordinate(array $data, string $key): ?int
    {
        $value = $data[$key] ?? null;
        return $value !== null ? (int) $value : null;
    }

    private function extractScrollParams(array $actionData, array $nodeData): array
    {
        $direction = $actionData['direction'] ?? $nodeData['direction'] ?? 'down';
        $eventType = $nodeData['eventType'] ?? null;

        if ($eventType) {
            $direction = match ($eventType) {
                'scroll_up' => 'up',
                'scroll_down' => 'down',
                'scroll_left' => 'left',
                'scroll_right' => 'right',
                default => $direction,
            };
        }

        return [
            'direction' => $direction,
            'amount' => $actionData['amount'] ?? $nodeData['amount'] ?? 500,
            'duration' => $actionData['duration'] ?? 300,
            'startX' => $actionData['startX'] ?? null,
            'startY' => $actionData['startY'] ?? null,
            'endX' => $actionData['endX'] ?? null,
            'endY' => $actionData['endY'] ?? null,
        ];
    }

    private function extractAssertParams(array $actionData, array $nodeData): array
    {
        return [
            'assertion_type' => $nodeData['assertionType'] ?? 'element_exists',
            'expected_value' => $nodeData['expectedValue'] ?? null,
            'timeout' => $nodeData['timeout'] ?? 5000,
            'resourceId' => $actionData['resourceId'] ?? null,
            'contentDescription' => $actionData['contentDescription'] ?? null,
            'text' => $actionData['text'] ?? $nodeData['text'] ?? null,
            'className' => $actionData['className'] ?? null,
            'bounds' => $actionData['bounds'] ?? null,
            'x' => $this->getCoordinate($actionData, 'x'),
            'y' => $this->getCoordinate($actionData, 'y'),
        ];
    }

    private function extractElementCheckParams(array $actionData, array $nodeData): array
    {
        return [
            'check_type' => $nodeData['checkType'] ?? 'exists',
            'timeout' => $nodeData['timeout'] ?? 3000,
            'resourceId' => $actionData['resourceId'] ?? $nodeData['resourceId'] ?? null,
            'contentDescription' => $actionData['contentDescription'] ?? $nodeData['contentDescription'] ?? null,
            'text' => $actionData['text'] ?? $nodeData['text'] ?? null,
            'className' => $actionData['className'] ?? $nodeData['className'] ?? null,
            'bounds' => $actionData['bounds'] ?? $nodeData['bounds'] ?? null,
        ];
    }

    private function extractWaitForElementParams(array $actionData, array $nodeData): array
    {
        return [
            'timeout' => $nodeData['timeout'] ?? 10000,
            'poll_interval' => $nodeData['pollInterval'] ?? 500,
            'resourceId' => $actionData['resourceId'] ?? $nodeData['resourceId'] ?? null,
            'contentDescription' => $actionData['contentDescription'] ?? $nodeData['contentDescription'] ?? null,
            'text' => $actionData['text'] ?? $nodeData['text'] ?? null,
            'className' => $actionData['className'] ?? $nodeData['className'] ?? null,
            'bounds' => $actionData['bounds'] ?? $nodeData['bounds'] ?? null,
        ];
    }
}
