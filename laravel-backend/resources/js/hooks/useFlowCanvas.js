import { useState, useCallback } from 'react';

/**
 * Custom hook to manage flow canvas interaction state
 * Handles nodes, edges, viewport, selection, and drag/drop
 * 
 * @param {Object} initialState - Initial canvas state
 * @param {Array} initialState.nodes - Initial nodes
 * @param {Array} initialState.edges - Initial edges  
 * @param {Object} initialState.viewport - Initial viewport
 * @returns {Object} Canvas state and interaction handlers
 */
export function useFlowCanvas({ nodes: initialNodes = [], edges: initialEdges = [], viewport: initialViewport = { x: 0, y: 0, zoom: 1 } }) {
    // Core canvas state
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);
    const [viewport, setViewport] = useState(initialViewport);

    // Selection state
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedNodes, setSelectedNodes] = useState([]); // Multi-select support

    // Drag & Drop state
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [draggedNodeType, setDraggedNodeType] = useState(null);

    // Handle node click
    const handleNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
        setSelectedNodes([node]);
        console.log('🖱️ useFlowCanvas: Node selected:', node.id);
    }, []);

    // Handle canvas click (deselect)
    const handlePaneClick = useCallback(() => {
        setSelectedNode(null);
        setSelectedNodes([]);
        console.log('🖱️ useFlowCanvas: Selection cleared');
    }, []);

    // Handle drag start
    const handleDragStart = useCallback((nodeType) => {
        setDraggedNodeType(nodeType);
        setIsDraggingOver(false);
        console.log('🎯 useFlowCanvas: Drag started:', nodeType);
    }, []);

    // Handle drag over canvas
    const handleDragOver = useCallback((event) => {
        event.preventDefault();
        setIsDraggingOver(true);
    }, []);

    // Handle drag leave
    const handleDragLeave = useCallback(() => {
        setIsDraggingOver(false);
    }, []);

    // Handle drop on canvas
    const handleDrop = useCallback((event, screenToFlowPosition) => {
        event.preventDefault();
        setIsDraggingOver(false);

        if (!draggedNodeType || !screenToFlowPosition) {
            console.warn('⚠️ useFlowCanvas: Invalid drop conditions');
            return;
        }

        // Get drop position
        const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        console.log('📍 useFlowCanvas: Node dropped at:', position);

        setDraggedNodeType(null);

        // Return drop info for parent to handle node creation
        return {
            type: draggedNodeType,
            position,
        };
    }, [draggedNodeType]);

    // Add node to canvas
    const addNode = useCallback((node) => {
        setNodes(prev => [...prev, node]);
        console.log('➕ useFlowCanvas: Node added:', node.id);
    }, []);

    // Remove node from canvas
    const removeNode = useCallback((nodeId) => {
        setNodes(prev => prev.filter(n => n.id !== nodeId));
        setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));

        if (selectedNode?.id === nodeId) {
            setSelectedNode(null);
        }

        console.log('➖ useFlowCanvas: Node removed:', nodeId);
    }, [selectedNode]);

    // Update node
    const updateNode = useCallback((nodeId, updates) => {
        setNodes(prev => prev.map(node =>
            node.id === nodeId ? { ...node, ...updates } : node
        ));

        // Update selectedNode if it's the one being updated
        if (selectedNode?.id === nodeId) {
            setSelectedNode(prev => ({ ...prev, ...updates }));
        }

        console.log('✏️ useFlowCanvas: Node updated:', nodeId);
    }, [selectedNode]);

    // Add edge
    const addEdge = useCallback((edge) => {
        setEdges(prev => [...prev, edge]);
        console.log('🔗 useFlowCanvas: Edge added:', edge.id);
    }, []);

    // Remove edge
    const removeEdge = useCallback((edgeId) => {
        setEdges(prev => prev.filter(e => e.id !== edgeId));
        console.log('✂️ useFlowCanvas: Edge removed:', edgeId);
    }, []);

    // Clear all nodes and edges
    const clearCanvas = useCallback(() => {
        setNodes([]);
        setEdges([]);
        setSelectedNode(null);
        setSelectedNodes([]);
        console.log('🗑️ useFlowCanvas: Canvas cleared');
    }, []);

    return {
        // State
        nodes,
        edges,
        viewport,
        selectedNode,
        selectedNodes,
        isDraggingOver,
        draggedNodeType,

        // Setters
        setNodes,
        setEdges,
        setViewport,
        setSelectedNode,
        setSelectedNodes,

        // Interaction handlers
        handleNodeClick,
        handlePaneClick,
        handleDragStart,
        handleDragOver,
        handleDragLeave,
        handleDrop,

        // Node/Edge operations
        addNode,
        removeNode,
        updateNode,
        addEdge,
        removeEdge,
        clearCanvas,
    };
}
