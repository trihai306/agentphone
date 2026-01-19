import { useCallback, useRef } from 'react';

/**
 * useUndoRedo - History management hook for ReactFlow editor
 * 
 * Provides undo/redo functionality by maintaining snapshots of nodes and edges.
 * Uses refs to avoid stale closure issues with state in callbacks.
 * 
 * @param {Array} nodes - Current nodes array
 * @param {Array} edges - Current edges array  
 * @param {Function} setNodes - State setter for nodes
 * @param {Function} setEdges - State setter for edges
 * @param {number} maxHistory - Maximum history entries (default: 50)
 */
export function useUndoRedo(nodes, edges, setNodes, setEdges, maxHistory = 50) {
    // Use refs to store history to avoid re-renders and stale closures
    const pastRef = useRef([]);
    const futureRef = useRef([]);

    // Store current state in refs for access in callbacks
    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);

    // Keep refs in sync with state
    nodesRef.current = nodes;
    edgesRef.current = edges;

    /**
     * Take a snapshot of current state before making changes
     * Call this BEFORE any mutation operation (delete, add, move, etc.)
     */
    const takeSnapshot = useCallback(() => {
        const snapshot = {
            nodes: JSON.parse(JSON.stringify(nodesRef.current)),
            edges: JSON.parse(JSON.stringify(edgesRef.current)),
            timestamp: Date.now(),
        };

        // Push to past stack
        pastRef.current = [...pastRef.current.slice(-maxHistory + 1), snapshot];

        // Clear future stack (new action invalidates redo history)
        futureRef.current = [];
    }, [maxHistory]);

    /**
     * Undo - Restore previous state
     */
    const undo = useCallback(() => {
        if (pastRef.current.length === 0) return;

        // Save current state to future stack
        const currentSnapshot = {
            nodes: JSON.parse(JSON.stringify(nodesRef.current)),
            edges: JSON.parse(JSON.stringify(edgesRef.current)),
            timestamp: Date.now(),
        };
        futureRef.current = [currentSnapshot, ...futureRef.current];

        // Pop and restore from past stack
        const previousSnapshot = pastRef.current[pastRef.current.length - 1];
        pastRef.current = pastRef.current.slice(0, -1);

        // Restore state
        setNodes(previousSnapshot.nodes);
        setEdges(previousSnapshot.edges);
    }, [setNodes, setEdges]);

    /**
     * Redo - Restore next state (after undo)
     */
    const redo = useCallback(() => {
        if (futureRef.current.length === 0) return;

        // Save current state to past stack
        const currentSnapshot = {
            nodes: JSON.parse(JSON.stringify(nodesRef.current)),
            edges: JSON.parse(JSON.stringify(edgesRef.current)),
            timestamp: Date.now(),
        };
        pastRef.current = [...pastRef.current, currentSnapshot];

        // Pop and restore from future stack
        const nextSnapshot = futureRef.current[0];
        futureRef.current = futureRef.current.slice(1);

        // Restore state
        setNodes(nextSnapshot.nodes);
        setEdges(nextSnapshot.edges);
    }, [setNodes, setEdges]);

    /**
     * Clear all history (useful when loading a new flow)
     */
    const clearHistory = useCallback(() => {
        pastRef.current = [];
        futureRef.current = [];
    }, []);

    return {
        takeSnapshot,
        undo,
        redo,
        clearHistory,
        canUndo: pastRef.current.length > 0,
        canRedo: futureRef.current.length > 0,
        historyLength: pastRef.current.length,
        futureLength: futureRef.current.length,
    };
}

export default useUndoRedo;
