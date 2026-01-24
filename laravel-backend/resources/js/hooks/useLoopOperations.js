import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Custom hook for loop-related operations
 * Handles wrapping selected nodes into a Loop node
 * 
 * @param {Object} config - Configuration
 * @param {Array} config.selectedNodes - Currently selected nodes
 * @param {Array} config.nodes - All nodes
 * @param {Array} config.edges - All edges
 * @param {Object} config.viewport - Current viewport
 * @param {Function} config.setNodes - Function to update nodes
 * @param {Function} config.setEdges - Function to update edges  
 * @param {Function} config.setSelectedNodes - Function to update selected nodes
 * @param {Function} config.setSelectedNode - Function to set single selected node
 * @param {Function} config.saveFlow - Function to save flow
 * @param {Function} config.takeSnapshot - Function to take snapshot for undo
 * @param {Function} config.addToast - Function to show toast notification
 * @returns {Object} Loop operation functions
 */
export function useLoopOperations({
    selectedNodes,
    nodes,
    edges,
    viewport,
    setNodes,
    setEdges,
    setSelectedNodes,
    setSelectedNode,
    saveFlow,
    takeSnapshot,
    addToast,
}) {
    const { t } = useTranslation();

    /**
     * Wrap selected nodes in a Loop node
     * Creates a subFlow containing all selected nodes and reconnects external edges
     */
    const wrapSelectedNodesInLoop = useCallback(() => {
        if (selectedNodes.length < 1) {
            addToast('Select at least 1 node to wrap in Loop', 'warning');
            return;
        }

        // Take snapshot for undo
        takeSnapshot();

        // Get selected node IDs
        const selectedNodeIds = selectedNodes.map(n => n.id);

        // Find edges that connect selected nodes to each other (internal edges)
        const internalEdges = edges.filter(e =>
            selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target)
        );

        // Find edges from outside to selected nodes (incoming)
        const incomingEdges = edges.filter(e =>
            !selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target)
        );

        // Find edges from selected nodes to outside (outgoing)
        const outgoingEdges = edges.filter(e =>
            selectedNodeIds.includes(e.source) && !selectedNodeIds.includes(e.target)
        );

        // Sort selected nodes by position to determine order (top to bottom, left to right)
        const sortedNodes = [...selectedNodes].sort((a, b) => {
            const yDiff = (a.position?.y || 0) - (b.position?.y || 0);
            if (Math.abs(yDiff) > 50) return yDiff;
            return (a.position?.x || 0) - (b.position?.x || 0);
        });

        // Create subFlow nodes
        const subFlowNodes = [];
        const subFlowEdges = [];

        // Add loopStart
        subFlowNodes.push({
            id: 'loop-start',
            type: 'loopStart',
            data: { label: t('flows.editor.nodes.loop_start', 'Loop Start'), itemVariable: 'item' },
            position: { x: 200, y: 50 },
        });

        // Add sorted action nodes
        sortedNodes.forEach((node, index) => {
            const subNodeId = `subflow-action-${index + 1}`;
            subFlowNodes.push({
                id: subNodeId,
                type: node.type,
                position: { x: 200, y: 150 + index * 100 },
                data: {
                    ...node.data,
                    label: node.data?.label || node.type,
                },
            });

            // Create edge from previous node
            if (index === 0) {
                subFlowEdges.push({
                    id: `edge-start-${subNodeId}`,
                    source: 'loop-start',
                    target: subNodeId,
                    type: 'smoothstep',
                });
            } else {
                subFlowEdges.push({
                    id: `edge-${index}-${subNodeId}`,
                    source: `subflow-action-${index}`,
                    target: subNodeId,
                    type: 'smoothstep',
                });
            }
        });

        // Add loopEnd
        const lastNodeId = `subflow-action-${sortedNodes.length}`;
        subFlowNodes.push({
            id: 'loop-end',
            type: 'loopEnd',
            data: { label: t('flows.editor.nodes.loop_end', 'Continue') },
            position: { x: 200, y: 150 + sortedNodes.length * 100 },
        });
        subFlowEdges.push({
            id: 'edge-last-end',
            source: lastNodeId,
            target: 'loop-end',
            type: 'smoothstep',
        });

        // Calculate Loop node position (center of selected nodes)
        const avgX = sortedNodes.reduce((sum, n) => sum + (n.position?.x || 0), 0) / sortedNodes.length;
        const avgY = sortedNodes.reduce((sum, n) => sum + (n.position?.y || 0), 0) / sortedNodes.length;

        // Create Loop node
        const loopNodeId = `loop-${Date.now()}`;
        const loopNode = {
            id: loopNodeId,
            type: 'loop',
            position: { x: avgX, y: avgY },
            data: {
                label: `Loop (${sortedNodes.length} actions)`,
                loopType: 'count',
                iterations: 3,
                itemVariable: 'item',
                indexVariable: 'index',
                subFlow: {
                    nodes: subFlowNodes,
                    edges: subFlowEdges,
                },
            },
        };

        // Remove selected nodes and add Loop node
        const remainingNodes = nodes.filter(n => !selectedNodeIds.includes(n.id));
        const newNodes = [...remainingNodes, loopNode];

        // Reconnect external edges to Loop node
        const newEdges = edges.filter(e =>
            !selectedNodeIds.includes(e.source) && !selectedNodeIds.includes(e.target)
        );

        // Redirect incoming edges to Loop node
        incomingEdges.forEach(e => {
            newEdges.push({
                ...e,
                id: `${e.id}-to-loop`,
                target: loopNodeId,
            });
        });

        // Redirect outgoing edges from Loop node
        outgoingEdges.forEach(e => {
            newEdges.push({
                ...e,
                id: `loop-${e.id}`,
                source: loopNodeId,
                sourceHandle: 'complete', // Use complete handle for loop continuation
            });
        });

        // Update state
        setNodes(newNodes);
        setEdges(newEdges);
        setSelectedNodes([]);
        setSelectedNode(loopNode);

        // Save
        saveFlow(newNodes, newEdges, viewport);

        addToast(`✅ Wrapped ${sortedNodes.length} nodes in Loop`, 'success');
    }, [selectedNodes, nodes, edges, viewport, setNodes, setEdges, setSelectedNodes, setSelectedNode, saveFlow, takeSnapshot, addToast, t]);

    return {
        wrapSelectedNodesInLoop,
    };
}
