import { memo, useState, useCallback } from 'react';
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
} from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import SmartActionNode from './SmartActionNode';
import AnimatedEdge from './AnimatedEdge';

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
    text_input: SmartActionNode,
    smart_action: SmartActionNode,
    swipe: SmartActionNode,
    open_app: SmartActionNode,
    key_event: SmartActionNode,
    focus: SmartActionNode,
    back: SmartActionNode,
    home: SmartActionNode,
    long_press: SmartActionNode,
    recorded_action: SmartActionNode,
    // Loop node (for nested loops)
    loop: SmartActionNode,
};

const edgeTypes = {
    animated: AnimatedEdge,
};

/**
 * LoopSubFlowModal - Premium modal for editing sub-workflow inside a Loop node
 * Features: Glassmorphic design, action toolbar with icons, variable hints
 */
function LoopSubFlowModal({ isOpen, onClose, loopNode, onSaveSubFlow }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Sub-flow nodes and edges (stored in loopNode.data.subFlow)
    const initialSubFlow = loopNode?.data?.subFlow || {
        nodes: [
            {
                id: 'loop-start',
                type: 'loopStart',
                data: { label: 'Loop Start', itemVariable: loopNode?.data?.itemVariable || 'item' },
                position: { x: 200, y: 50 },
            },
            {
                id: 'loop-end',
                type: 'loopEnd',
                data: { label: 'Continue' },
                position: { x: 200, y: 450 },
            },
        ],
        edges: [],
    };

    const [nodes, setNodes] = useState(initialSubFlow.nodes);
    const [edges, setEdges] = useState(initialSubFlow.edges);

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

    // Action types with icons and colors
    const actionTypes = [
        { type: 'tap', label: 'Tap', icon: '👆', color: '#3b82f6' },
        { type: 'text_input', label: 'Type', icon: '⌨️', color: '#a855f7' },
        { type: 'scroll', label: 'Scroll', icon: '📜', color: '#f59e0b' },
        { type: 'swipe', label: 'Swipe', icon: '👋', color: '#06b6d4' },
        { type: 'click', label: 'Click', icon: '🖱️', color: '#10b981' },
    ];

    // Quick add action node
    const addActionNode = (type, color) => {
        const actionInfo = actionTypes.find(a => a.type === type);
        const newNode = {
            id: `${type}-${Date.now()}`,
            type: type,
            data: {
                eventType: type,
                actionType: type,
                label: actionInfo?.label || type,
                isRecorded: false,
            },
            position: { x: 200, y: 120 + (nodes.length - 1) * 100 },
        };
        setNodes((nds) => [...nds, newNode]);
    };

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
                className={`relative w-[90vw] max-w-6xl h-[85vh] rounded-3xl overflow-hidden ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'
                    }`}
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
                    className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
                    style={{
                        background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%)',
                    }}
                />

                {/* Header */}
                <div className={`relative flex items-center justify-between px-8 py-5 border-b ${isDark ? 'border-white/10' : 'border-gray-200'
                    }`}>
                    <div className="flex items-center gap-4">
                        {/* Animated Loop Icon */}
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
                            }}
                        >
                            <div className="absolute inset-0 bg-white/10 animate-pulse" />
                            <svg className="w-7 h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>

                        <div>
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Loop Sub-Workflow
                            </h2>
                            <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Design actions for each iteration
                            </p>
                        </div>
                    </div>

                    {/* Variable Pills */}
                    <div className="flex items-center gap-3 mr-6">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-200'}`}>
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Current Item:</span>
                            <code className="text-sm font-bold text-indigo-400">{`{{${itemVar}}}`}</code>
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isDark ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-cyan-50 border border-cyan-200'}`}>
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Index:</span>
                            <code className="text-sm font-bold text-cyan-400">{`{{${indexVar}}}`}</code>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${isDark
                                ? 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200'
                                }`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                            style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                            }}
                        >
                            💾 Save Sub-Flow
                        </button>
                    </div>
                </div>

                {/* Action Toolbar */}
                <div className={`flex items-center gap-3 px-8 py-4 border-b ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>
                    <span className={`text-sm font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Add Action:
                    </span>

                    <div className="flex items-center gap-2">
                        {actionTypes.map((action) => (
                            <button
                                key={action.type}
                                onClick={() => addActionNode(action.type, action.color)}
                                className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 ${isDark
                                    ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                                    : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-sm'
                                    }`}
                                style={{
                                    '--action-color': action.color,
                                }}
                            >
                                <span className="text-lg">{action.icon}</span>
                                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{action.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Node count badge */}
                    {nodes.length > 2 && (
                        <div className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-medium text-emerald-500">
                                {nodes.length - 2} actions
                            </span>
                        </div>
                    )}
                </div>

                {/* ReactFlow Editor */}
                <div className="h-[calc(100%-180px)]">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
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
                </div>

                {/* Footer Tip */}
                <div className={`absolute bottom-0 left-0 right-0 px-8 py-4 border-t ${isDark ? 'border-white/5 bg-gradient-to-r from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]' : 'border-gray-100 bg-gradient-to-r from-gray-50 via-white to-gray-50'
                    }`}>
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-6">
                            <span className={`flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                <span className="text-lg">💡</span>
                                Drag handles to connect nodes
                            </span>
                            <span className={`flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                <span className="text-lg">🔄</span>
                                Actions run for each item
                            </span>
                        </div>
                        <div className={`flex items-center gap-2 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`}>
                            <span className="text-lg">⚡</span>
                            <span className="font-medium">Pro tip: Use TRUE/FALSE handles for conditional logic</span>
                        </div>
                    </div>
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
