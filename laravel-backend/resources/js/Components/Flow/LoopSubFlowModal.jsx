import { memo, useState, useCallback, useRef } from 'react';
import ReactFlow, {
    Background,
    Controls,
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    MarkerType,
    Handle,
    Position,
    ReactFlowProvider,
    useReactFlow,
} from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { Button } from '@/Components/UI';
import SmartActionNode from './SmartActionNode';
import GlassConditionNode from './GlassConditionNode';
import AnimatedEdge from './AnimatedEdge';
import NodeConfigPanel from './NodeConfigPanel';
import NodePalette from './NodePalette';

// Custom Loop Start Node with proper source handle
const LoopStartNode = memo(({ data }) => {
    return (
        <div className="relative px-8 py-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-2 border-indigo-500/40 rounded-2xl min-w-[180px] text-center">
            <div className="flex items-center justify-center gap-2">
                <span className="text-xl">🔄</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Loop Start</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">For each {`{{${data?.itemVariable || 'item'}}}`}</p>
            {/* Source handle at bottom */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="out"
                className="!w-4 !h-4 !border-[3px] !-bottom-2 !rounded-lg !bg-indigo-500 !border-white"
                style={{ boxShadow: '0 2px 8px rgba(99, 102, 241, 0.5)' }}
            />
        </div>
    );
});
LoopStartNode.displayName = 'LoopStartNode';

// Custom Loop End Node with proper target handle
const LoopEndNode = memo(({ data }) => {
    return (
        <div className="relative px-8 py-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-2 border-emerald-500/40 rounded-2xl min-w-[180px] text-center">
            {/* Target handle at top */}
            <Handle
                type="target"
                position={Position.Top}
                id="in"
                className="!w-4 !h-4 !border-[3px] !-top-2 !rounded-lg !bg-emerald-500 !border-white"
                style={{ boxShadow: '0 2px 8px rgba(16, 185, 129, 0.5)' }}
            />
            <div className="flex items-center justify-center gap-2">
                <span className="text-xl">✅</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Continue</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Next iteration</p>
        </div>
    );
});
LoopEndNode.displayName = 'LoopEndNode';

// ====================================================================
// CRITICAL: Define nodeTypes and edgeTypes OUTSIDE the component
// to prevent React Flow infinite re-render loop (error #002)
// ====================================================================
const nodeTypes = {
    loopStart: LoopStartNode,
    loopEnd: LoopEndNode,
    // Action nodes
    tap: SmartActionNode,
    click: SmartActionNode,
    scroll: SmartActionNode,
    scroll_up: SmartActionNode,
    scroll_down: SmartActionNode,
    scroll_left: SmartActionNode,
    scroll_right: SmartActionNode,
    text_input: SmartActionNode,
    smart_action: SmartActionNode,
    swipe: SmartActionNode,
    open_app: SmartActionNode,
    start_app: SmartActionNode,
    key_event: SmartActionNode,
    focus: SmartActionNode,
    back: SmartActionNode,
    home: SmartActionNode,
    long_press: SmartActionNode,
    double_tap: SmartActionNode,
    recorded_action: SmartActionNode,
    // Logic nodes
    condition: GlassConditionNode,
    delay: SmartActionNode,
    wait: SmartActionNode,
    assert: SmartActionNode,
    wait_for_element: SmartActionNode,
    element_check: SmartActionNode,
    // Loop node (for nested loops)
    loop: SmartActionNode,
};

const edgeTypes = {
    animated: AnimatedEdge,
};

/**
 * LoopSubFlowModal - Premium modal for editing sub-workflow inside a Loop node
 * Features: Glassmorphic design, sidebar with drag-drop, 3-column layout
 */
function LoopSubFlowModal({ isOpen, onClose, loopNode, onSaveSubFlow, selectedDevice, userId }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const reactFlowWrapper = useRef(null);
    const { screenToFlowPosition } = useReactFlow();

    // Sub-flow nodes and edges (stored in loopNode.data.subFlow)
    const initialSubFlow = loopNode?.data?.subFlow || {
        nodes: [
            {
                id: 'loop-start',
                type: 'loopStart',
                data: { label: 'Loop Start', itemVariable: loopNode?.data?.itemVariable || 'item' },
                position: { x: 250, y: 50 },
            },
            {
                id: 'loop-end',
                type: 'loopEnd',
                data: { label: 'Continue' },
                position: { x: 250, y: 400 },
            },
        ],
        edges: [],
    };

    const [nodes, setNodes] = useState(initialSubFlow.nodes);
    const [edges, setEdges] = useState(initialSubFlow.edges);
    const [selectedNode, setSelectedNode] = useState(null);

    // Node click handler
    const onNodeClick = useCallback((event, node) => {
        // Don't open config for loopStart/loopEnd nodes
        if (node.type === 'loopStart' || node.type === 'loopEnd') return;
        setSelectedNode(node);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    // Handler for updating node from config panel
    const handleUpdateNode = useCallback((nodeId, updatedNode) => {
        setNodes((nds) => nds.map((n) => n.id === nodeId ? updatedNode : n));
        setSelectedNode(updatedNode);
    }, []);

    const onNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    const onConnect = useCallback(
        (connection) => setEdges((eds) => addEdge({
            ...connection,
            type: 'animated',
            markerEnd: { type: MarkerType.ArrowClosed },
        }, eds)),
        []
    );

    const handleSave = () => {
        onSaveSubFlow(loopNode.id, { nodes, edges });
        onClose();
    };

    // ========================================================================
    // DRAG & DROP HANDLERS
    // ========================================================================
    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((event) => {
        event.preventDefault();

        const type = event.dataTransfer.getData('application/reactflow');
        const nodeDataStr = event.dataTransfer.getData('application/nodedata');

        if (!type) return;

        // Get drop position in flow coordinates
        const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        // Parse node data
        let nodeInfo = {};
        try {
            nodeInfo = JSON.parse(nodeDataStr);
        } catch (e) {
            console.error('Failed to parse node data', e);
        }

        // Build node data based on type
        const nodeData = {
            eventType: type,
            actionType: type,
            label: nodeInfo?.label || type,
            isRecorded: false,
        };

        // Add type-specific default data
        if (type === 'delay' || type === 'wait') {
            nodeData.duration = 1000;
        } else if (type === 'condition') {
            nodeData.condition = '{{item.status}} == "active"';
        } else if (type === 'assert') {
            nodeData.assertType = 'exists';
            nodeData.timeout = 5000;
        } else if (type === 'wait_for_element') {
            nodeData.timeout = 10000;
        } else if (type === 'element_check') {
            nodeData.checkType = 'exists';
            nodeData.timeout = 3000;
        }

        const newNode = {
            id: `${type}-${Date.now()}`,
            type: type,
            data: nodeData,
            position,
        };

        setNodes((nds) => [...nds, newNode]);
    }, [screenToFlowPosition]);

    const itemVar = loopNode?.data?.itemVariable || 'item';
    const indexVar = loopNode?.data?.indexVariable || 'index';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div
                className={`relative w-[95vw] max-w-7xl h-[90vh] rounded-3xl overflow-hidden flex flex-col ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                    boxShadow: isDark
                        ? '0 0 60px rgba(99, 102, 241, 0.15), 0 25px 80px rgba(0, 0, 0, 0.7)'
                        : '0 25px 80px rgba(0, 0, 0, 0.25)',
                    border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.3)'}`,
                }}
            >
                {/* Gradient overlay at top */}
                <div
                    className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-10"
                    style={{
                        background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%)',
                    }}
                />

                {/* Header */}
                <div className={`relative z-20 flex items-center justify-between px-6 py-4 border-b shrink-0 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-4">
                        {/* Animated Loop Icon */}
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
                            }}
                        >
                            <div className="absolute inset-0 bg-white/10 animate-pulse" />
                            <svg className="w-6 h-6 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>

                        <div>
                            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Loop Sub-Workflow
                            </h2>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Design actions for each iteration
                            </p>
                        </div>
                    </div>

                    {/* Variable Pills */}
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-200'}`}>
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Item:</span>
                            <code className="text-xs font-bold text-indigo-400">{`{{${itemVar}}}`}</code>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${isDark ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-cyan-50 border border-cyan-200'}`}>
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Index:</span>
                            <code className="text-xs font-bold text-cyan-400">{`{{${indexVar}}}`}</code>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        {/* Node count badge */}
                        {nodes.length > 2 && (
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-medium text-emerald-500">
                                    {nodes.length - 2} nodes
                                </span>
                            </div>
                        )}
                        <Button variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button variant="gradient" onClick={handleSave}>
                            💾 Save
                        </Button>
                    </div>
                </div>

                {/* 3-Column Layout: Sidebar + Canvas + Config */}
                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT: Node Palette Sidebar */}
                    <NodePalette />

                    {/* CENTER: ReactFlow Canvas */}
                    <div
                        ref={reactFlowWrapper}
                        className="flex-1 relative"
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                    >
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onNodeClick={onNodeClick}
                            onPaneClick={onPaneClick}
                            nodeTypes={nodeTypes}
                            edgeTypes={edgeTypes}
                            fitView
                            proOptions={{ hideAttribution: true }}
                            defaultEdgeOptions={{
                                type: 'animated',
                                style: { stroke: '#6366f1', strokeWidth: 2 },
                                markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
                            }}
                        >
                            <Background
                                variant="dots"
                                gap={24}
                                size={1.5}
                                color={isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)'}
                            />
                            <Controls
                                showInteractive={false}
                                position="bottom-right"
                                className={`rounded-xl overflow-hidden ${isDark ? '!bg-[#1a1a1a] !border-white/10' : '!bg-white !border-gray-200'}`}
                            />
                        </ReactFlow>

                        {/* Drop Hint Overlay */}
                        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-medium pointer-events-none ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                            💡 Drag nodes from sidebar or connect handles
                        </div>
                    </div>

                    {/* RIGHT: Node Configuration Panel */}
                    {selectedNode && (
                        <div className={`w-80 border-l overflow-y-auto ${isDark ? 'border-white/10 bg-[#0f0f0f]' : 'border-gray-200 bg-gray-50'}`}>
                            <NodeConfigPanel
                                node={selectedNode}
                                onUpdateNode={handleUpdateNode}
                                onClose={() => setSelectedNode(null)}
                                upstreamVariables={[]}
                                loopContext={{ itemVariable: itemVar, indexVariable: indexVar }}
                                selectedDevice={selectedDevice}
                                userId={userId}
                                embedded={true}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Wrap with ReactFlowProvider to isolate from main Editor's ReactFlow context
function LoopSubFlowModalWrapper(props) {
    if (!props.isOpen) return null;

    return (
        <ReactFlowProvider>
            <LoopSubFlowModal {...props} />
        </ReactFlowProvider>
    );
}

export default memo(LoopSubFlowModalWrapper);
