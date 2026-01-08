import { useState, useCallback, useRef, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import ReactFlow, {
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    Background,
    MiniMap,
    Panel,
    useReactFlow,
    ReactFlowProvider,
    MarkerType,
    BackgroundVariant,
    ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom node types
import CustomNode from '../../Components/Flow/CustomNode';
import InputNode from '../../Components/Flow/InputNode';
import OutputNode from '../../Components/Flow/OutputNode';
import ProcessNode from '../../Components/Flow/ProcessNode';

const nodeTypes = {
    custom: CustomNode,
    input: InputNode,
    output: OutputNode,
    process: ProcessNode,
};

const defaultEdgeOptions = {
    type: 'smoothstep',
    animated: true,
    style: { strokeWidth: 2, stroke: '#6366f1' },
    markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#6366f1',
        width: 20,
        height: 20,
    },
};

function FlowEditor({ flow }) {
    const [nodes, setNodes] = useState(flow.nodes || []);
    const [edges, setEdges] = useState(flow.edges || []);
    const [viewport, setViewport] = useState(flow.viewport || { x: 0, y: 0, zoom: 1 });
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [flowName, setFlowName] = useState(flow.name);
    const [editingName, setEditingName] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [draggedNodeType, setDraggedNodeType] = useState(null);

    const reactFlowWrapper = useRef(null);
    const { screenToFlowPosition, fitView, zoomIn, zoomOut, getZoom } = useReactFlow();
    const saveTimeoutRef = useRef(null);

    // Auto-save function
    const saveFlow = useCallback(async (currentNodes, currentEdges, currentViewport) => {
        setSaving(true);
        try {
            const response = await fetch(`/flows/${flow.id}/save-state`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    nodes: currentNodes,
                    edges: currentEdges,
                    viewport: currentViewport,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setLastSaved(new Date(data.saved_at));
            }
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setSaving(false);
        }
    }, [flow.id]);

    // Debounced auto-save
    const debouncedSave = useCallback((currentNodes, currentEdges, currentViewport) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            saveFlow(currentNodes, currentEdges, currentViewport);
        }, 1000);
    }, [saveFlow]);

    const onNodesChange = useCallback((changes) => {
        setNodes((nds) => {
            const newNodes = applyNodeChanges(changes, nds);
            debouncedSave(newNodes, edges, viewport);
            return newNodes;
        });
    }, [edges, viewport, debouncedSave]);

    const onEdgesChange = useCallback((changes) => {
        setEdges((eds) => {
            const newEdges = applyEdgeChanges(changes, eds);
            debouncedSave(nodes, newEdges, viewport);
            return newEdges;
        });
    }, [nodes, viewport, debouncedSave]);

    const onConnect = useCallback((connection) => {
        setEdges((eds) => {
            const newEdge = {
                ...connection,
                id: `e${connection.source}-${connection.target}-${Date.now()}`,
                ...defaultEdgeOptions,
            };
            const newEdges = addEdge(newEdge, eds);
            debouncedSave(nodes, newEdges, viewport);
            return newEdges;
        });
    }, [nodes, viewport, debouncedSave]);

    const onMoveEnd = useCallback((event, newViewport) => {
        setViewport(newViewport);
        debouncedSave(nodes, edges, newViewport);
    }, [nodes, edges, debouncedSave]);

    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setIsDraggingOver(true);
    }, []);

    const onDragLeave = useCallback(() => {
        setIsDraggingOver(false);
    }, []);

    const onDrop = useCallback((event) => {
        event.preventDefault();
        setIsDraggingOver(false);
        setDraggedNodeType(null);

        const type = event.dataTransfer.getData('application/reactflow/type');
        const label = event.dataTransfer.getData('application/reactflow/label');
        if (!type) return;

        const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        const newNode = {
            id: `node-${Date.now()}`,
            type,
            position,
            data: { label: label || type },
        };

        setNodes((nds) => {
            const newNodes = [...nds, newNode];
            debouncedSave(newNodes, edges, viewport);
            return newNodes;
        });
    }, [screenToFlowPosition, edges, viewport, debouncedSave]);

    const handleUpdateName = () => {
        if (flowName && flowName !== flow.name) {
            router.put(`/flows/${flow.id}`, { name: flowName }, { preserveScroll: true });
        }
        setEditingName(false);
    };

    const handleManualSave = () => {
        saveFlow(nodes, edges, viewport);
    };

    const deleteSelectedNode = useCallback(() => {
        if (selectedNode) {
            setNodes((nds) => {
                const newNodes = nds.filter(n => n.id !== selectedNode.id);
                debouncedSave(newNodes, edges, viewport);
                return newNodes;
            });
            setEdges((eds) => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
            setSelectedNode(null);
        }
    }, [selectedNode, edges, viewport, debouncedSave]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode && !editingName) {
                deleteSelectedNode();
            }
            if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleManualSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNode, editingName, deleteSelectedNode]);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    const nodeTemplates = [
        { type: 'input', label: 'Start', icon: 'play', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', description: 'Trigger workflow' },
        { type: 'process', label: 'Process', icon: 'cog', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', description: 'Process data' },
        { type: 'custom', label: 'Action', icon: 'bolt', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)', description: 'Execute action' },
        { type: 'output', label: 'End', icon: 'flag', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', description: 'End workflow' },
    ];

    const onDragStart = (event, nodeType, nodeLabel, color) => {
        event.dataTransfer.setData('application/reactflow/type', nodeType);
        event.dataTransfer.setData('application/reactflow/label', nodeLabel);
        event.dataTransfer.effectAllowed = 'move';
        setDraggedNodeType({ type: nodeType, color });

        // Create custom drag image
        const dragImage = document.createElement('div');
        dragImage.className = 'flow-drag-preview';
        dragImage.innerHTML = `
            <div style="
                background: #1e1e1e;
                border: 2px solid ${color};
                border-radius: 8px;
                padding: 8px 16px;
                color: ${color};
                font-size: 12px;
                font-weight: 600;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span style="
                    width: 8px;
                    height: 8px;
                    background: ${color};
                    border-radius: 50%;
                "></span>
                ${nodeLabel}
            </div>
        `;
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        document.body.appendChild(dragImage);
        event.dataTransfer.setDragImage(dragImage, 60, 20);
        setTimeout(() => document.body.removeChild(dragImage), 0);
    };

    const NodeIcon = ({ icon, color }) => {
        const icons = {
            play: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />,
            cog: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
            bolt: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />,
            flag: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />,
        };
        return (
            <svg width={18} height={18} fill="none" stroke={color} viewBox="0 0 24 24">
                {icons[icon]}
            </svg>
        );
    };

    return (
        <>
            <Head title={`${flowName} - Flow Editor`} />
            <div className="h-screen flex flex-col bg-[#0a0a0a]">
                {/* Top Toolbar */}
                <div className="h-14 bg-[#0a0a0a] border-b border-[#1e1e1e] flex items-center justify-between px-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Back */}
                        <Link
                            href="/flows"
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white transition-all border border-[#2a2a2a]"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>

                        {/* Flow Name */}
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                </svg>
                            </div>
                            {editingName ? (
                                <input
                                    type="text"
                                    value={flowName}
                                    onChange={(e) => setFlowName(e.target.value)}
                                    onBlur={handleUpdateName}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                                    autoFocus
                                    className="bg-[#1a1a1a] border border-indigo-500 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                                />
                            ) : (
                                <button
                                    onClick={() => setEditingName(true)}
                                    className="text-base font-semibold text-white hover:text-indigo-400 transition-colors"
                                >
                                    {flowName}
                                </button>
                            )}
                            <span className={`px-2 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider ${
                                flow.status === 'active'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }`}>
                                {flow.status}
                            </span>
                        </div>
                    </div>

                    {/* Center - Stats */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                            <span>{nodes.length} nodes</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span>{edges.length} connections</span>
                        </div>
                    </div>

                    {/* Right - Actions */}
                    <div className="flex items-center gap-3">
                        {/* Save Status */}
                        <div className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                            {saving ? (
                                <span className="text-amber-400 flex items-center gap-2">
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Saving...
                                </span>
                            ) : lastSaved ? (
                                <span className="text-emerald-400 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Saved
                                </span>
                            ) : (
                                <span className="text-gray-500">Unsaved</span>
                            )}
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleManualSave}
                            disabled={saving}
                            className="h-9 px-4 bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 text-sm font-medium rounded-lg transition-all flex items-center gap-2 border border-[#2a2a2a]"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Save
                        </button>

                        {/* Deploy Button */}
                        <button className="h-9 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Deploy
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar */}
                    <div className={`${showSidebar ? 'w-72' : 'w-0'} bg-[#0f0f0f] border-r border-[#1e1e1e] flex flex-col overflow-hidden transition-all duration-300`}>
                        {/* Sidebar Header */}
                        <div className="h-12 px-4 flex items-center justify-between border-b border-[#1e1e1e] flex-shrink-0">
                            <span className="text-sm font-semibold text-white">Nodes</span>
                            <button
                                onClick={() => setShowSidebar(false)}
                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#1a1a1a] text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                </svg>
                            </button>
                        </div>

                        {/* Node List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 flow-editor-sidebar">
                            <p className="text-xs text-gray-500 px-1 mb-3">Drag nodes to the canvas</p>
                            {nodeTemplates.map((template) => (
                                <div
                                    key={template.type}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, template.type, template.label, template.color)}
                                    className="group relative flex items-center gap-3 p-3 rounded-xl cursor-grab active:cursor-grabbing bg-[#1a1a1a] hover:bg-[#1e1e1e] border border-[#252525] hover:border-[#333] transition-all hover:scale-[1.02] hover:shadow-lg"
                                    style={{ '--node-color': template.color }}
                                >
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                                        style={{ backgroundColor: template.bgColor }}
                                    >
                                        <NodeIcon icon={template.icon} color={template.color} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white">{template.label}</p>
                                        <p className="text-xs text-gray-500">{template.description}</p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Sidebar Footer - Keyboard Shortcuts */}
                        <div className="p-4 border-t border-[#1e1e1e] bg-[#0a0a0a]">
                            <p className="text-xs font-semibold text-gray-400 mb-3">Keyboard Shortcuts</p>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between text-gray-500">
                                    <span>Delete node</span>
                                    <kbd className="px-2 py-1 bg-[#1a1a1a] rounded text-gray-400 font-mono border border-[#252525]">Del</kbd>
                                </div>
                                <div className="flex items-center justify-between text-gray-500">
                                    <span>Save</span>
                                    <kbd className="px-2 py-1 bg-[#1a1a1a] rounded text-gray-400 font-mono border border-[#252525]">⌘S</kbd>
                                </div>
                                <div className="flex items-center justify-between text-gray-500">
                                    <span>Zoom</span>
                                    <kbd className="px-2 py-1 bg-[#1a1a1a] rounded text-gray-400 font-mono border border-[#252525]">Scroll</kbd>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Canvas */}
                    <div
                        className={`flex-1 relative transition-all ${isDraggingOver ? 'ring-2 ring-indigo-500 ring-inset' : ''}`}
                        ref={reactFlowWrapper}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                    >
                        {/* Toggle Sidebar Button */}
                        {!showSidebar && (
                            <button
                                onClick={() => setShowSidebar(true)}
                                className="absolute left-4 top-4 z-10 w-10 h-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#252525] transition-all shadow-lg"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                            </button>
                        )}

                        {/* Drop indicator */}
                        {isDraggingOver && (
                            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-indigo-500/5">
                                <div className="px-6 py-4 bg-[#1a1a1a] border-2 border-dashed border-indigo-500 rounded-2xl text-indigo-400 font-semibold text-sm shadow-2xl">
                                    Drop to add node
                                </div>
                            </div>
                        )}

                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onMoveEnd={onMoveEnd}
                            onNodeClick={onNodeClick}
                            onPaneClick={onPaneClick}
                            nodeTypes={nodeTypes}
                            defaultEdgeOptions={defaultEdgeOptions}
                            defaultViewport={viewport}
                            connectionLineType={ConnectionLineType.SmoothStep}
                            connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
                            fitView={nodes.length === 0}
                            snapToGrid={true}
                            snapGrid={[20, 20]}
                            proOptions={{ hideAttribution: true }}
                            className="!bg-[#0a0a0a]"
                        >
                            <Background
                                variant={BackgroundVariant.Dots}
                                gap={20}
                                size={1}
                                color="#1a1a1a"
                            />

                            {/* Custom Controls */}
                            <Panel position="bottom-left" className="!m-4">
                                <div className="flex items-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-xl">
                                    <button
                                        onClick={() => zoomOut()}
                                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#252525] transition-all"
                                        title="Zoom out"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                    </button>
                                    <div className="w-px h-6 bg-[#2a2a2a]" />
                                    <button
                                        onClick={() => zoomIn()}
                                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#252525] transition-all"
                                        title="Zoom in"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                    <div className="w-px h-6 bg-[#2a2a2a]" />
                                    <button
                                        onClick={() => fitView({ padding: 0.2 })}
                                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#252525] transition-all"
                                        title="Fit view"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                        </svg>
                                    </button>
                                </div>
                            </Panel>

                            {/* Mini Map */}
                            <Panel position="bottom-right" className="!m-4">
                                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-xl">
                                    <MiniMap
                                        nodeColor={(node) => {
                                            const colors = { input: '#10b981', output: '#ef4444', process: '#3b82f6', custom: '#8b5cf6' };
                                            return colors[node.type] || '#6366f1';
                                        }}
                                        maskColor="rgba(0, 0, 0, 0.85)"
                                        style={{ width: 180, height: 120, background: '#0a0a0a' }}
                                        className="!bg-[#0a0a0a] !border-none"
                                    />
                                </div>
                            </Panel>

                            {/* Empty State */}
                            {nodes.length === 0 && (
                                <Panel position="top-center" className="!m-0 !top-1/2 !-translate-y-1/2">
                                    <div className="text-center">
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shadow-2xl shadow-indigo-500/10">
                                            <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Start Building</h3>
                                        <p className="text-sm text-gray-500 max-w-xs">
                                            Drag nodes from the left panel to create your workflow
                                        </p>
                                    </div>
                                </Panel>
                            )}
                        </ReactFlow>
                    </div>

                    {/* Right Panel - Node Properties */}
                    {selectedNode && (
                        <div className="w-80 bg-[#0f0f0f] border-l border-[#1e1e1e] flex flex-col">
                            <div className="h-12 px-4 flex items-center justify-between border-b border-[#1e1e1e]">
                                <span className="text-sm font-semibold text-white">Node Properties</span>
                                <button
                                    onClick={() => setSelectedNode(null)}
                                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#1a1a1a] text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-1 p-4 space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Type</label>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{
                                                backgroundColor: nodeTemplates.find(t => t.type === selectedNode.type)?.bgColor
                                            }}
                                        >
                                            <NodeIcon
                                                icon={nodeTemplates.find(t => t.type === selectedNode.type)?.icon || 'bolt'}
                                                color={nodeTemplates.find(t => t.type === selectedNode.type)?.color || '#8b5cf6'}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-white capitalize">{selectedNode.type}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Label</label>
                                    <input
                                        type="text"
                                        value={selectedNode.data?.label || ''}
                                        onChange={(e) => {
                                            setNodes((nds) =>
                                                nds.map((n) =>
                                                    n.id === selectedNode.id
                                                        ? { ...n, data: { ...n.data, label: e.target.value } }
                                                        : n
                                                )
                                            );
                                        }}
                                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Node ID</label>
                                    <div className="text-sm text-gray-500 font-mono bg-[#1a1a1a] rounded-lg px-3 py-2.5 border border-[#2a2a2a]">{selectedNode.id}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Position</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="text-sm text-gray-500 bg-[#1a1a1a] rounded-lg px-3 py-2.5 border border-[#2a2a2a]">
                                            X: {Math.round(selectedNode.position?.x || 0)}
                                        </div>
                                        <div className="text-sm text-gray-500 bg-[#1a1a1a] rounded-lg px-3 py-2.5 border border-[#2a2a2a]">
                                            Y: {Math.round(selectedNode.position?.y || 0)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border-t border-[#1e1e1e]">
                                <button
                                    onClick={deleteSelectedNode}
                                    className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold rounded-lg transition-all border border-red-500/20 hover:border-red-500/40"
                                >
                                    Delete Node
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default function Editor({ flow }) {
    return (
        <ReactFlowProvider>
            <FlowEditor flow={flow} />
        </ReactFlowProvider>
    );
}
