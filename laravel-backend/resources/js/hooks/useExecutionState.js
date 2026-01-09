import { useState, useCallback, useRef } from 'react';

/**
 * Node execution status types
 */
export const NodeStatus = {
    IDLE: 'idle',
    PENDING: 'pending',
    RUNNING: 'running',
    SUCCESS: 'success',
    ERROR: 'error',
};

/**
 * Execution status types
 */
export const ExecutionStatus = {
    IDLE: 'idle',
    RUNNING: 'running',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    ERROR: 'error',
};

/**
 * Custom hook to manage flow execution state with animations
 */
export function useExecutionState(nodes, edges) {
    const [executionStatus, setExecutionStatus] = useState(ExecutionStatus.IDLE);
    const [nodeStates, setNodeStates] = useState({});
    const [currentNodeId, setCurrentNodeId] = useState(null);
    const [executionLog, setExecutionLog] = useState([]);
    const [progress, setProgress] = useState(0);

    const executionRef = useRef(null);
    const isPausedRef = useRef(false);

    /**
     * Add entry to execution log
     */
    const addLog = useCallback((type, nodeId, message, data = null) => {
        const entry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            type, // 'info', 'success', 'error', 'warning'
            nodeId,
            message,
            data,
        };
        setExecutionLog(prev => [...prev, entry]);
        return entry;
    }, []);

    /**
     * Get execution order based on edges (topological sort)
     */
    const getExecutionOrder = useCallback(() => {
        // Find start nodes (nodes with no incoming edges)
        const incomingCount = {};
        const adjacencyList = {};

        nodes.forEach(node => {
            incomingCount[node.id] = 0;
            adjacencyList[node.id] = [];
        });

        edges.forEach(edge => {
            incomingCount[edge.target] = (incomingCount[edge.target] || 0) + 1;
            if (adjacencyList[edge.source]) {
                adjacencyList[edge.source].push(edge.target);
            }
        });

        // Topological sort using Kahn's algorithm
        const queue = nodes.filter(n => incomingCount[n.id] === 0).map(n => n.id);
        const order = [];

        while (queue.length > 0) {
            const nodeId = queue.shift();
            order.push(nodeId);

            (adjacencyList[nodeId] || []).forEach(targetId => {
                incomingCount[targetId]--;
                if (incomingCount[targetId] === 0) {
                    queue.push(targetId);
                }
            });
        }

        return order;
    }, [nodes, edges]);

    /**
     * Simulate node execution with delay
     */
    const executeNode = useCallback(async (nodeId, index, total) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return { success: false, error: 'Node not found' };

        // Check if paused
        while (isPausedRef.current) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Set node as running
        setCurrentNodeId(nodeId);
        setNodeStates(prev => ({
            ...prev,
            [nodeId]: {
                status: NodeStatus.RUNNING,
                startTime: Date.now(),
                endTime: null,
                output: null,
                error: null,
            }
        }));
        addLog('info', nodeId, `Executing: ${node.data?.label || node.type}`);

        // Simulate execution time (1-3 seconds)
        const executionTime = 1000 + Math.random() * 2000;
        await new Promise(resolve => setTimeout(resolve, executionTime));

        // Check if paused again
        while (isPausedRef.current) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Simulate success/failure (95% success rate)
        const success = Math.random() > 0.05;

        if (success) {
            setNodeStates(prev => ({
                ...prev,
                [nodeId]: {
                    ...prev[nodeId],
                    status: NodeStatus.SUCCESS,
                    endTime: Date.now(),
                    output: { result: 'OK', items: Math.floor(Math.random() * 10) + 1 },
                }
            }));
            addLog('success', nodeId, `Completed: ${node.data?.label || node.type}`);
        } else {
            setNodeStates(prev => ({
                ...prev,
                [nodeId]: {
                    ...prev[nodeId],
                    status: NodeStatus.ERROR,
                    endTime: Date.now(),
                    error: 'Simulated execution error',
                }
            }));
            addLog('error', nodeId, `Failed: ${node.data?.label || node.type}`, { error: 'Simulated error' });
        }

        // Update progress
        setProgress(((index + 1) / total) * 100);

        return { success, nodeId };
    }, [nodes, addLog]);

    /**
     * Start flow execution
     */
    const startExecution = useCallback(async () => {
        if (executionStatus === ExecutionStatus.RUNNING) return;

        const executionOrder = getExecutionOrder();
        if (executionOrder.length === 0) {
            addLog('warning', null, 'No nodes to execute');
            return;
        }

        // Initialize all nodes as pending
        const initialStates = {};
        executionOrder.forEach(nodeId => {
            initialStates[nodeId] = {
                status: NodeStatus.PENDING,
                startTime: null,
                endTime: null,
                output: null,
                error: null,
            };
        });
        setNodeStates(initialStates);
        setExecutionLog([]);
        setProgress(0);
        setExecutionStatus(ExecutionStatus.RUNNING);
        isPausedRef.current = false;

        addLog('info', null, `Starting execution with ${executionOrder.length} nodes`);

        // Execute nodes sequentially
        for (let i = 0; i < executionOrder.length; i++) {
            const result = await executeNode(executionOrder[i], i, executionOrder.length);

            // Stop if error
            if (!result.success) {
                setExecutionStatus(ExecutionStatus.ERROR);
                setCurrentNodeId(null);
                addLog('error', null, 'Execution stopped due to error');
                return;
            }
        }

        setCurrentNodeId(null);
        setExecutionStatus(ExecutionStatus.COMPLETED);
        addLog('success', null, 'Execution completed successfully');
    }, [executionStatus, getExecutionOrder, executeNode, addLog]);

    /**
     * Pause execution
     */
    const pauseExecution = useCallback(() => {
        if (executionStatus !== ExecutionStatus.RUNNING) return;
        isPausedRef.current = true;
        setExecutionStatus(ExecutionStatus.PAUSED);
        addLog('warning', null, 'Execution paused');
    }, [executionStatus, addLog]);

    /**
     * Resume execution
     */
    const resumeExecution = useCallback(() => {
        if (executionStatus !== ExecutionStatus.PAUSED) return;
        isPausedRef.current = false;
        setExecutionStatus(ExecutionStatus.RUNNING);
        addLog('info', null, 'Execution resumed');
    }, [executionStatus, addLog]);

    /**
     * Stop execution
     */
    const stopExecution = useCallback(() => {
        isPausedRef.current = false;
        setExecutionStatus(ExecutionStatus.IDLE);
        setCurrentNodeId(null);
        setNodeStates({});
        setProgress(0);
        addLog('warning', null, 'Execution stopped');
    }, [addLog]);

    /**
     * Reset execution state
     */
    const resetExecution = useCallback(() => {
        setExecutionStatus(ExecutionStatus.IDLE);
        setNodeStates({});
        setCurrentNodeId(null);
        setExecutionLog([]);
        setProgress(0);
    }, []);

    /**
     * Get node execution state
     */
    const getNodeState = useCallback((nodeId) => {
        return nodeStates[nodeId] || { status: NodeStatus.IDLE };
    }, [nodeStates]);

    return {
        // State
        executionStatus,
        nodeStates,
        currentNodeId,
        executionLog,
        progress,

        // Actions
        startExecution,
        pauseExecution,
        resumeExecution,
        stopExecution,
        resetExecution,

        // Helpers
        getNodeState,
        isRunning: executionStatus === ExecutionStatus.RUNNING,
        isPaused: executionStatus === ExecutionStatus.PAUSED,
        isCompleted: executionStatus === ExecutionStatus.COMPLETED,
        hasError: executionStatus === ExecutionStatus.ERROR,
    };
}

export default useExecutionState;
