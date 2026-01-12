import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
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

// Theme support
import { useTheme } from '@/Contexts/ThemeContext';
import ThemeToggle from '@/Components/ThemeToggle';
import MediaPickerModal from '@/Components/MediaPickerModal';
import CollectionPickerModal from '@/Components/CollectionPickerModal';

// Execution state
import { useExecutionState, ExecutionStatus, NodeStatus } from '@/hooks/useExecutionState';

// Custom node types
import CustomNode from '../../Components/Flow/CustomNode';
import InputNode from '../../Components/Flow/InputNode';
import OutputNode from '../../Components/Flow/OutputNode';
import ProcessNode from '../../Components/Flow/ProcessNode';
import RecordedActionNode from '../../Components/Flow/RecordedActionNode';
import ConditionNode from '../../Components/Flow/ConditionNode';
import LoopNode from '../../Components/Flow/LoopNode';
import WaitNode from '../../Components/Flow/WaitNode';
import AssertNode from '../../Components/Flow/AssertNode';
import FileInputNode from '../../Components/Flow/FileInputNode';
import TextInputNode from '../../Components/Flow/TextInputNode';
import DataSourceNode from '../../Components/Flow/DataSourceNode';
import AINode from '../../Components/Flow/AINode';
import AnimatedEdge from '../../Components/Flow/AnimatedEdge';
import NodeConfigPanel from '../../Components/Flow/NodeConfigPanel';

// Premium Glass nodes
import GlassNode from '../../Components/Flow/GlassNode';
import GlassLoopNode from '../../Components/Flow/GlassLoopNode';
import GlassDataSourceNode from '../../Components/Flow/GlassDataSourceNode';
import GlassConditionNode from '../../Components/Flow/GlassConditionNode';
import GlassTextInputNode from '../../Components/Flow/GlassTextInputNode';
import GlassHttpNode from '../../Components/Flow/GlassHttpNode';
import QuickAddMenu from '../../Components/Flow/QuickAddMenu';
import LiveRecordingPanel from '../../Components/Flow/LiveRecordingPanel';
import ImportRecordingModal from '../../Components/Flow/ImportRecordingModal';

const nodeTypes = {
    // Control Flow
    custom: CustomNode,
    input: InputNode,
    output: OutputNode,
    process: ProcessNode,
    action: CustomNode,

    // Recorded Actions
    recorded_action: RecordedActionNode,
    click: RecordedActionNode,
    text_input: RecordedActionNode,
    scroll: RecordedActionNode,
    swipe: RecordedActionNode,
    key_event: RecordedActionNode,

    // Logic/Conditions - Premium Glass versions
    condition: GlassConditionNode,
    loop: GlassLoopNode,
    wait: WaitNode,
    assert: AssertNode,

    // Resources - Premium Glass versions
    file_input: FileInputNode,
    text_data: GlassTextInputNode,
    data_source: GlassDataSourceNode,
    ai_process: AINode,
    http: GlassHttpNode,
};

const edgeTypes = {
    animated: AnimatedEdge,
};

const defaultEdgeOptions = {
    type: 'animated',
    animated: true,
    style: { strokeWidth: 2, stroke: '#6366f1' },
    markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#6366f1',
        width: 20,
        height: 20,
    },
};

function FlowEditor({ flow, mediaFiles = [], dataCollections = [] }) {
    // Use usePage to get props directly - workaround for Inertia prop hydration bug
    const { props } = usePage();
    const onlineDevices = props.onlineDevices || [];
    const collections = props.dataCollections || dataCollections;

    const { theme } = useTheme();
    const isDark = theme === 'dark';

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
    const [showLogPanel, setShowLogPanel] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [showDeviceSelector, setShowDeviceSelector] = useState(false);

    // Recording mode state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSession, setRecordingSession] = useState(null);
    const [recordedNodeCount, setRecordedNodeCount] = useState(0);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [recordedActions, setRecordedActions] = useState([]);
    const [showRecordingPanel, setShowRecordingPanel] = useState(false);
    const [isRecordingPaused, setIsRecordingPaused] = useState(false);
    const recordingTimerRef = useRef(null);

    // Media Picker state
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [mediaPickerNodeId, setMediaPickerNodeId] = useState(null);

    // Collection Picker state
    const [showCollectionPicker, setShowCollectionPicker] = useState(false);
    const [collectionPickerNodeId, setCollectionPickerNodeId] = useState(null);

    const reactFlowWrapper = useRef(null);
    const { screenToFlowPosition, fitView, zoomIn, zoomOut, getZoom } = useReactFlow();
    const saveTimeoutRef = useRef(null);

    // Execution state hook
    const {
        executionStatus,
        nodeStates,
        currentNodeId,
        executionLog,
        progress,
        startExecution,
        pauseExecution,
        resumeExecution,
        stopExecution,
        resetExecution,
        isRunning,
        isPaused,
        isCompleted,
        hasError,
    } = useExecutionState(nodes, edges);

    // Update nodes with execution state
    const nodesWithExecution = useMemo(() => {
        return nodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                executionState: nodeStates[node.id]?.status || NodeStatus.IDLE,
            }
        }));
    }, [nodes, nodeStates]);

    // Update edges with execution state
    const edgesWithExecution = useMemo(() => {
        return edges.map(edge => {
            const sourceState = nodeStates[edge.source]?.status;
            const targetState = nodeStates[edge.target]?.status;

            let executionState = 'idle';
            if (sourceState === NodeStatus.SUCCESS && targetState === NodeStatus.RUNNING) {
                executionState = 'running';
            } else if (sourceState === NodeStatus.SUCCESS && targetState === NodeStatus.SUCCESS) {
                executionState = 'success';
            } else if (sourceState === NodeStatus.SUCCESS && targetState === NodeStatus.ERROR) {
                executionState = 'error';
            } else if (sourceState === NodeStatus.PENDING || targetState === NodeStatus.PENDING) {
                executionState = 'pending';
            }

            return {
                ...edge,
                data: {
                    ...edge.data,
                    executionState,
                    isDark,
                }
            };
        });
    }, [edges, nodeStates, isDark]);

    // Recording controls - Start/Stop recording session
    const startRecording = useCallback(async () => {
        if (!selectedDevice) return;

        try {
            const response = await fetch('/recording-sessions/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    device_id: selectedDevice.device_id,
                    flow_id: flow.id,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setRecordingSession(data.session);
                setIsRecording(true);
                setRecordedNodeCount(0);
                setRecordingDuration(0);
                setRecordedActions([]);
                setShowRecordingPanel(true);
                setIsRecordingPaused(false);

                // Start timer
                recordingTimerRef.current = setInterval(() => {
                    setRecordingDuration(prev => prev + 1);
                }, 1000);

                console.log('Recording started:', data.session.session_id);
            }
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    }, [selectedDevice, flow.id, props.auth]);

    const stopRecording = useCallback(async () => {
        if (!recordingSession) return;

        // Clear timer
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }

        try {
            const response = await fetch(`/recording-sessions/${recordingSession.session_id}/stop`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();
            if (data.success) {
                setIsRecording(false);
                setIsRecordingPaused(false);
                console.log('Recording stopped:', recordedNodeCount, 'nodes created');
            }
        } catch (error) {
            console.error('Failed to stop recording:', error);
        }
    }, [recordingSession, recordedNodeCount]);

    // Format duration as MM:SS
    const formatDuration = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // Toggle pause recording
    const togglePauseRecording = useCallback(() => {
        setIsRecordingPaused(prev => !prev);
    }, []);

    // Clear last recorded action
    const undoLastAction = useCallback(() => {
        if (recordedActions.length === 0) return;

        const lastAction = recordedActions[recordedActions.length - 1];
        // Remove last node
        setNodes(prev => prev.filter(n => n.id !== lastAction.nodeId));
        // Remove edges connected to last node
        setEdges(prev => prev.filter(e => e.source !== lastAction.nodeId && e.target !== lastAction.nodeId));
        // Update actions list
        setRecordedActions(prev => prev.slice(0, -1));
        setRecordedNodeCount(prev => prev - 1);
    }, [recordedActions]);

    // Create node from recorded event
    const createNodeFromEvent = useCallback((eventData, nodeSuggestion) => {
        const existingNodesCount = nodes.length;
        const newNodeId = `recorded_${Date.now()}_${eventData.sequence_number}`;

        // Auto-layout: stack nodes vertically with smart positioning
        const baseX = 400;
        const baseY = 100;
        const spacing = 150; // Larger spacing for recorded nodes with screenshots

        // Map event type to node type
        const getNodeType = (eventType) => {
            const typeMap = {
                'click': 'click',
                'long_click': 'click',
                'text_input': 'text_input',
                'set_text': 'text_input',
                'scroll': 'scroll',
                'scroll_up': 'scroll',
                'scroll_down': 'scroll',
                'swipe': 'swipe',
                'swipe_left': 'swipe',
                'swipe_right': 'swipe',
                'swipe_up': 'swipe',
                'swipe_down': 'swipe',
                'key_event': 'key_event',
                'back': 'key_event',
                'home': 'key_event',
            };
            return typeMap[eventType] || 'recorded_action';
        };

        const newNode = {
            id: newNodeId,
            type: getNodeType(eventData.event_type),
            position: {
                x: baseX,
                y: baseY + (existingNodesCount * spacing)
            },
            data: {
                label: nodeSuggestion.data?.label || eventData.event_type,
                color: nodeSuggestion.data?.color || 'blue',
                eventType: eventData.event_type,
                resourceId: eventData.resource_id || eventData.resourceId,
                text: eventData.text,
                screenshotUrl: eventData.screenshot_url || nodeSuggestion.data?.screenshotUrl,
                coordinates: {
                    x: eventData.x || eventData.coordinates?.x,
                    y: eventData.y || eventData.coordinates?.y
                },
                bounds: eventData.bounds,
                packageName: eventData.package_name,
                className: eventData.class_name,
                isRecorded: true,
                sequenceNumber: eventData.sequence_number,
            },
        };

        // Auto-connect to previous node
        const newEdges = [];
        if (existingNodesCount > 0) {
            const previousNode = nodes[existingNodesCount - 1];
            newEdges.push({
                id: `edge_${previousNode.id}_${newNodeId}`,
                source: previousNode.id,
                target: newNodeId,
                type: 'animated',
                animated: true,
            });
        }

        setNodes(prev => [...prev, newNode]);
        if (newEdges.length > 0) {
            setEdges(prev => [...prev, ...newEdges]);
        }
        setRecordedNodeCount(prev => prev + 1);

        // Track action for undo and history panel
        setRecordedActions(prev => [...prev, {
            nodeId: newNodeId,
            eventType: eventData.event_type,
            label: nodeSuggestion.data?.label || eventData.event_type,
            timestamp: Date.now(),
            screenshotUrl: eventData.screenshot_url,
        }]);

        console.log('Node created from recording:', newNode.data.label);
    }, [nodes]);

    // Listen for recording events via Echo
    useEffect(() => {
        if (!isRecording || !recordingSession) return;

        try {
            if (typeof window !== 'undefined' && window.Echo) {
                const channelName = `recording.${props.auth?.user?.id}.${flow.id}`;
                const channel = window.Echo.private(channelName);

                channel.listen('.event.captured', (e) => {
                    console.log('Recording event received:', e);
                    createNodeFromEvent(e.event, e.node_suggestion);
                });

                return () => {
                    try {
                        channel.stopListening('.event.captured');
                        window.Echo.leave(channelName);
                    } catch (err) {
                        console.warn('Error cleaning up channel:', err);
                    }
                };
            }
        } catch (error) {
            console.warn('Echo not available for recording events:', error);
        }
    }, [isRecording, recordingSession, flow.id, props.auth, createNodeFromEvent]);

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

    // Handler for updating node from config panel
    const handleUpdateNode = useCallback((nodeId, updatedNode) => {
        setNodes((nds) => nds.map((n) => n.id === nodeId ? updatedNode : n));
    }, []);

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setIsDraggingOver(true);
    }, []);

    const onDragLeave = useCallback(() => {
        setIsDraggingOver(false);
    }, []);

    // Handler for media file selection
    const handleMediaFileSelected = (file) => {
        setNodes(nds => nds.map(node =>
            node.id === mediaPickerNodeId
                ? {
                    ...node, data: {
                        ...node.data,
                        fileName: file.original_name,
                        filePath: file.url,
                        fileSize: file.formatted_size,
                        fileType: file.type
                    }
                }
                : node
        ));
        setShowMediaPicker(false);
    };

    // Handler for collection selection
    const handleCollectionSelected = (collection) => {
        setNodes(nds => nds.map(node =>
            node.id === collectionPickerNodeId
                ? {
                    ...node, data: {
                        ...node.data,
                        collectionId: collection.id,
                        collectionName: collection.name,
                        collectionIcon: collection.icon,
                        collectionColor: collection.color,
                        schema: collection.schema,
                        recordCount: collection.records_count,
                        label: collection.name,
                    }
                }
                : node
        ));
        setShowCollectionPicker(false);
    };

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
            data: {
                label: label || type,
                // Add media browser callback for FileInputNode
                ...(type === 'file_input' && {
                    onBrowseMedia: (nodeId) => {
                        setMediaPickerNodeId(nodeId);
                        setShowMediaPicker(true);
                    }
                }),
                // Add collection picker callback for DataSourceNode
                ...(type === 'data_source' && {
                    onSelectCollection: (nodeId) => {
                        setCollectionPickerNodeId(nodeId);
                        setShowCollectionPicker(true);
                    }
                })
            },
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

    // Auto show log panel when execution starts
    useEffect(() => {
        if (isRunning && !showLogPanel) {
            setShowLogPanel(true);
        }
    }, [isRunning]);

    // Close device selector when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showDeviceSelector && !e.target.closest('.device-selector-container')) {
                setShowDeviceSelector(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDeviceSelector]);

    const nodeTemplates = [
        // Control Flow
        { type: 'input', label: 'Start', icon: 'play', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', description: 'Trigger workflow', category: 'control' },
        { type: 'output', label: 'End', icon: 'flag', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', description: 'End workflow', category: 'control' },

        // Recorded Actions
        { type: 'click', label: 'Click', icon: 'cursor', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', description: 'Tap on element', category: 'action' },
        { type: 'text_input', label: 'Type Text', icon: 'keyboard', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.15)', description: 'Input text', category: 'action' },
        { type: 'scroll', label: 'Scroll', icon: 'scroll', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', description: 'Scroll view', category: 'action' },
        { type: 'swipe', label: 'Swipe', icon: 'swipe', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.15)', description: 'Swipe gesture', category: 'action' },
        { type: 'key_event', label: 'Key Press', icon: 'phone', color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.15)', description: 'Back/Home key', category: 'action' },

        // Logic/Conditions
        { type: 'condition', label: 'Condition', icon: 'branch', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)', description: 'If/Else branch', category: 'logic' },
        { type: 'wait', label: 'Wait', icon: 'clock', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)', description: 'Delay execution', category: 'logic' },
        { type: 'loop', label: 'Loop', icon: 'loop', color: '#14b8a6', bgColor: 'rgba(20, 184, 166, 0.15)', description: 'Repeat actions', category: 'logic' },
        { type: 'assert', label: 'Assert', icon: 'check', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)', description: 'Verify element', category: 'logic' },

        // Resources
        { type: 'file_input', label: 'File Upload', icon: 'upload', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.15)', description: 'Upload files/images', category: 'resource' },
        { type: 'text_data', label: 'Text Data', icon: 'document', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.15)', description: 'Input text content', category: 'resource' },
        { type: 'data_source', label: 'Data Source', icon: 'database', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', description: 'Connect test data', category: 'resource' },
        { type: 'ai_process', label: 'AI Process', icon: 'sparkles', color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.15)', description: 'AI integration', category: 'resource' },

        // Utilities
        { type: 'process', label: 'Process', icon: 'cog', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', description: 'Process data', category: 'utility' },
        { type: 'custom', label: 'Action', icon: 'bolt', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)', description: 'Execute action', category: 'utility' },
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
                background: ${isDark ? '#1e1e1e' : '#ffffff'};
                border: 2px solid ${color};
                border-radius: 8px;
                padding: 8px 16px;
                color: ${color};
                font-size: 12px;
                font-weight: 600;
                box-shadow: 0 8px 32px rgba(0,0,0,${isDark ? '0.4' : '0.15'});
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
            // Recorded Actions
            cursor: <><circle cx="12" cy="12" r="3" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07l-1.41 1.41M8.34 15.66l-1.41 1.41m0-12.02l1.41 1.41m7.32 7.32l1.41 1.41" /></>,
            keyboard: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
            scroll: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" /></>,
            swipe: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />,
            phone: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />,
            // Logic Icons
            branch: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
            clock: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
            loop: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
            check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
            // Resource Icons
            upload: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />,
            document: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
            database: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />,
            sparkles: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></>,
        };
        return (
            <svg width={18} height={18} fill="none" stroke={color} viewBox="0 0 24 24">
                {icons[icon] || icons.bolt}
            </svg>
        );
    };

    // Get log entry icon based on type
    const LogIcon = ({ type }) => {
        switch (type) {
            case 'success':
                return <div className="w-2 h-2 rounded-full bg-emerald-500" />;
            case 'error':
                return <div className="w-2 h-2 rounded-full bg-red-500" />;
            case 'warning':
                return <div className="w-2 h-2 rounded-full bg-amber-500" />;
            default:
                return <div className="w-2 h-2 rounded-full bg-indigo-500" />;
        }
    };

    return (
        <>
            <Head title={`${flowName} - Flow Editor`} />
            <div className={`h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                {/* Top Toolbar */}
                <div className={`h-14 flex items-center justify-between px-4 flex-shrink-0 border-b transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] border-[#1e1e1e]' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <div className="flex items-center gap-3">
                        {/* Back */}
                        <Link
                            href="/flows"
                            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all border ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white border-[#2a2a2a]' : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 border-gray-200'}`}
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
                                    className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none transition-colors ${isDark ? 'bg-[#1a1a1a] border-indigo-500 text-white' : 'bg-white border-indigo-500 text-gray-900'}`}
                                />
                            ) : (
                                <button
                                    onClick={() => setEditingName(true)}
                                    className={`text-base font-semibold transition-colors ${isDark ? 'text-white hover:text-indigo-400' : 'text-gray-900 hover:text-indigo-600'}`}
                                >
                                    {flowName}
                                </button>
                            )}
                            <span className={`px-2 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider ${flow.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                                : isDark
                                    ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                                }`}>
                                {flow.status}
                            </span>
                        </div>
                    </div>

                    {/* Center - Stats & Progress */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-6">
                        <div className={`flex items-center gap-6 text-sm ${isRunning || isRecordingPaused ? 'opacity-50' : ''}`}>
                            <div className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                <span>{nodes.length} nodes</span>
                            </div>
                            <div className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span>{edges.length} connections</span>
                            </div>
                        </div>

                        {/* Execution Progress */}
                        {(isRunning || isPaused) && (
                            <div className="flex items-center gap-3">
                                <div className={`w-32 h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-200'}`}>
                                    <div
                                        className="h-full progress-bar transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <span className="text-sm font-medium text-indigo-400">{Math.round(progress)}%</span>
                            </div>
                        )}
                    </div>

                    {/* Right - Actions */}
                    <div className="flex items-center gap-3">
                        {/* Device Selector - Always show */}
                        {(
                            <>
                                <div className="relative device-selector-container">
                                    {/* Enhanced Toolbar Button */}
                                    <button
                                        onClick={() => setShowDeviceSelector(!showDeviceSelector)}
                                        className={`h-9 px-3 flex items-center gap-2 text-sm font-medium rounded-lg transition-all duration-300 border backdrop-blur-sm ${selectedDevice
                                            ? isDark
                                                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/20'
                                                : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-700 shadow-lg shadow-emerald-200/50'
                                            : isDark
                                                ? 'bg-[#1a1a1a]/80 border-[#2a2a2a] text-gray-400 hover:text-white hover:border-[#3a3a3a]'
                                                : 'bg-white/80 border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                            }`}
                                        title={selectedDevice ? `Connected: ${selectedDevice.name}` : `${onlineDevices.length} device(s) online`}
                                        aria-label="Device selector"
                                        aria-expanded={showDeviceSelector}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>

                                        {/* Pulsing Connection Indicator */}
                                        {selectedDevice && (
                                            <div className="relative">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
                                            </div>
                                        )}

                                        {/* Device Name or Count Badge */}
                                        {selectedDevice ? (
                                            <span className="truncate max-w-[120px] font-semibold">{selectedDevice.name}</span>
                                        ) : (
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${onlineDevices.length > 0
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : 'bg-gray-500/20 text-gray-500'
                                                }`}>
                                                {onlineDevices.length}
                                            </span>
                                        )}

                                        <svg className={`w-3 h-3 transition-transform duration-200 ${showDeviceSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Premium Glassmorphic Dropdown */}
                                    {showDeviceSelector && (
                                        <div
                                            className={`absolute top-full right-0 mt-2 w-96 rounded-2xl shadow-2xl border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${isDark
                                                ? 'bg-[#1a1a1a]/95 backdrop-blur-xl border-[#2a2a2a]'
                                                : 'bg-white/95 backdrop-blur-xl border-gray-200'
                                                }`}
                                            style={{
                                                boxShadow: isDark
                                                    ? '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                                                    : '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                                            }}
                                        >
                                            {/* Header with Gradient */}
                                            <div className={`px-5 py-4 border-b relative overflow-hidden ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'
                                                }`}>
                                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10"></div>
                                                <div className="relative">
                                                    <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'
                                                        }`}>
                                                        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                        </svg>
                                                        Online Devices
                                                        <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${onlineDevices.length > 0
                                                            ? 'bg-emerald-500/20 text-emerald-400'
                                                            : 'bg-gray-500/20 text-gray-500'
                                                            }`}>
                                                            {onlineDevices.length}
                                                        </span>
                                                    </h3>
                                                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Select a device to connect for recording
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Device Cards with Enhanced Styling */}
                                            <div className="max-h-80 overflow-y-auto p-3 space-y-2">
                                                {onlineDevices.length === 0 ? (
                                                    <div className="text-center py-8">
                                                        <svg className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                        <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            No devices online
                                                        </p>
                                                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                                            Connect a device to get started
                                                        </p>
                                                    </div>
                                                ) : (
                                                    onlineDevices.map((device, index) => {
                                                        const isSelected = selectedDevice?.id === device.id;
                                                        return (
                                                            <button
                                                                key={device.id}
                                                                onClick={() => {
                                                                    setSelectedDevice(device);
                                                                    setTimeout(() => setShowDeviceSelector(false), 300);
                                                                }}
                                                                className={`group w-full text-left p-4 rounded-xl transition-all duration-300 relative overflow-hidden ${isSelected
                                                                    ? isDark
                                                                        ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                                                                        : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 shadow-lg shadow-emerald-200/50'
                                                                    : isDark
                                                                        ? 'bg-[#1e1e1e]/50 border border-[#2a2a2a] hover:bg-[#252525]/80 hover:border-[#3a3a3a]'
                                                                        : 'bg-gray-50/50 border border-gray-200 hover:bg-white hover:border-gray-300'
                                                                    } hover:scale-[1.02] active:scale-[0.98]`}
                                                                style={{
                                                                    animationDelay: `${index * 50}ms`,
                                                                    animationFillMode: 'both'
                                                                }}
                                                                aria-selected={isSelected}
                                                                role="option"
                                                            >
                                                                {/* Animated Border Gradient (only for selected) */}
                                                                {isSelected && (
                                                                    <>
                                                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 animate-pulse"></div>
                                                                        <div className="absolute -inset-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 rounded-xl opacity-20 blur-sm animate-pulse"></div>
                                                                    </>
                                                                )}

                                                                <div className="flex items-center gap-3 relative z-10">
                                                                    {/* Device Avatar with Gradient */}
                                                                    <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${device.is_online
                                                                        ? isSelected
                                                                            ? 'bg-gradient-to-br from-emerald-500/30 to-teal-500/30 shadow-lg shadow-emerald-500/20'
                                                                            : 'bg-emerald-500/20 group-hover:bg-emerald-500/30'
                                                                        : isDark ? 'bg-gray-500/20' : 'bg-gray-200'
                                                                        }`}>
                                                                        <svg className={`w-6 h-6 transition-colors ${device.is_online
                                                                            ? isSelected ? 'text-emerald-400' : 'text-emerald-500'
                                                                            : 'text-gray-400'
                                                                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                        </svg>

                                                                        {/* Pulsing Status Indicator */}
                                                                        {device.is_online && (
                                                                            <div className="absolute -top-1 -right-1">
                                                                                <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-current"></div>
                                                                                <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Device Info */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-0.5">
                                                                            <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'
                                                                                }`}>
                                                                                {device.name}
                                                                            </p>
                                                                        </div>
                                                                        <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'
                                                                            }`}>
                                                                            {device.model || device.device_id || 'Unknown model'}
                                                                        </p>
                                                                    </div>

                                                                    {/* Checkmark Badge with Animation */}
                                                                    {isSelected && (
                                                                        <div className="flex-shrink-0 animate-in zoom-in duration-200">
                                                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                                                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                                </svg>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>

                                            {/* Footer with Disconnect Button */}
                                            {selectedDevice && (
                                                <div className={`p-3 border-t ${isDark ? 'border-[#2a2a2a] bg-[#0f0f0f]/50' : 'border-gray-200 bg-gray-50/50'}`}>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedDevice(null);
                                                            setShowDeviceSelector(false);
                                                        }}
                                                        className={`w-full text-xs font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${isDark
                                                            ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300 active:bg-red-500/20'
                                                            : 'text-red-600 hover:bg-red-50 hover:text-red-700 active:bg-red-100'
                                                            }`}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        Disconnect Device
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className={`w-px h-6 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />

                                {/* Recording Button */}
                                {selectedDevice && (
                                    <button
                                        onClick={isRecording ? stopRecording : startRecording}
                                        className={`h-9 px-4 flex items-center gap-2 text-sm font-medium rounded-lg transition-all border ${isRecording
                                            ? 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30'
                                            : isDark
                                                ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30'
                                                : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'
                                            }`}
                                        title={isRecording ? `Recording... (${recordedNodeCount} actions)` : 'Start recording actions from device'}
                                    >
                                        {isRecording ? (
                                            <>
                                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                <span>Stop</span>
                                                <span className="text-xs opacity-70">({recordedNodeCount})</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <circle cx="12" cy="12" r="8" />
                                                </svg>
                                                <span>Record</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </>
                        )}

                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Execution Controls */}
                        {!isRunning && !isPaused && (
                            <button
                                onClick={startExecution}
                                disabled={nodes.length === 0}
                                className="h-9 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                Run
                            </button>
                        )}

                        {isRunning && (
                            <>
                                <button
                                    onClick={pauseExecution}
                                    className="h-9 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 border border-amber-500/30"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Pause
                                </button>
                                <button
                                    onClick={stopExecution}
                                    className="h-9 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 border border-red-500/30"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                    </svg>
                                    Stop
                                </button>
                            </>
                        )}

                        {isPaused && (
                            <>
                                <button
                                    onClick={resumeExecution}
                                    className="h-9 px-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 border border-emerald-500/30"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                    </svg>
                                    Resume
                                </button>
                                <button
                                    onClick={stopExecution}
                                    className="h-9 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 border border-red-500/30"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                    </svg>
                                    Stop
                                </button>
                            </>
                        )}

                        {(isCompleted || hasError) && (
                            <button
                                onClick={resetExecution}
                                className={`h-9 px-4 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 border ${isCompleted
                                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30'
                                    : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Reset
                            </button>
                        )}

                        {/* Divider */}
                        <div className={`w-px h-6 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />

                        {/* Save Status */}
                        <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-gray-100 border-gray-200'}`}>
                            {saving ? (
                                <span className="text-amber-500 flex items-center gap-2">
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Saving...
                                </span>
                            ) : lastSaved ? (
                                <span className="text-emerald-500 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Saved
                                </span>
                            ) : (
                                <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Unsaved</span>
                            )}
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleManualSave}
                            disabled={saving}
                            className={`h-9 px-4 text-sm font-medium rounded-lg transition-all flex items-center gap-2 border ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 border-[#2a2a2a]' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'}`}
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
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 flex overflow-hidden">
                        {/* Left Sidebar */}
                        <div className={`${showSidebar ? 'w-72' : 'w-0'} flex flex-col overflow-hidden transition-all duration-300 border-r ${isDark ? 'bg-[#0f0f0f] border-[#1e1e1e]' : 'bg-white border-gray-200'}`}>
                            {/* Sidebar Header */}
                            <div className={`h-12 px-4 flex items-center justify-between flex-shrink-0 border-b ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Nodes</span>
                                <button
                                    onClick={() => setShowSidebar(false)}
                                    className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${isDark ? 'hover:bg-[#1a1a1a] text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Search Filter */}
                            <div className={`px-3 py-2 border-b ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                                <div className="relative">
                                    <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search nodes..."
                                        className={`w-full pl-10 pr-3 py-2 text-sm rounded-lg border transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#252525] text-white placeholder-gray-500 focus:border-indigo-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'} focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                                    />
                                </div>
                            </div>

                            {/* Node List with Categories */}
                            <div className="flex-1 overflow-y-auto flow-editor-sidebar" style={{ scrollBehavior: 'smooth' }}>
                                {/* Control Flow Category */}
                                <div className={`border-b ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                                    <div className={`px-3 py-2.5 sticky top-0 z-10 backdrop-blur-sm ${isDark ? 'bg-[#0f0f0f]/90' : 'bg-white/90'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Control Flow</span>
                                        </div>
                                    </div>
                                    <div className="px-3 pb-3 space-y-2">
                                        {nodeTemplates.filter(t => t.category === 'control').map((template) => (
                                            <div
                                                key={template.type}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, template.type, template.label, template.color)}
                                                className={`group relative flex items-center gap-3 p-2.5 rounded-lg cursor-grab active:cursor-grabbing border transition-all duration-200 hover:scale-[1.02] ${isDark ? 'bg-[#1a1a1a] hover:bg-[#1e1e1e] border-[#252525] hover:border-[#333] hover:shadow-lg hover:shadow-black/20' : 'bg-gray-50 hover:bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'}`}
                                            >
                                                <div
                                                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3"
                                                    style={{ backgroundColor: template.bgColor }}
                                                >
                                                    <NodeIcon icon={template.icon} color={template.color} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{template.label}</p>
                                                    <p className={`text-[10px] truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{template.description}</p>
                                                </div>
                                                <svg className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Recorded Actions Category */}
                                <div className={`border-b ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                                    <div className={`px-3 py-2.5 sticky top-0 z-10 backdrop-blur-sm ${isDark ? 'bg-[#0f0f0f]/90' : 'bg-white/90'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Recorded Actions</span>
                                            <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>REC</span>
                                        </div>
                                    </div>
                                    <div className="px-3 pb-3 space-y-2">
                                        {nodeTemplates.filter(t => t.category === 'action').map((template) => (
                                            <div
                                                key={template.type}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, template.type, template.label, template.color)}
                                                className={`group relative flex items-center gap-3 p-2.5 rounded-lg cursor-grab active:cursor-grabbing border transition-all duration-200 hover:scale-[1.02] ${isDark ? 'bg-[#1a1a1a] hover:bg-[#1e1e1e] border-[#252525] hover:border-[#333] hover:shadow-lg hover:shadow-black/20' : 'bg-gray-50 hover:bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'}`}
                                            >
                                                <div
                                                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3"
                                                    style={{ backgroundColor: template.bgColor }}
                                                >
                                                    <NodeIcon icon={template.icon} color={template.color} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{template.label}</p>
                                                    <p className={`text-[10px] truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{template.description}</p>
                                                </div>
                                                <svg className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Logic/Conditions Category */}
                                <div className={`border-b ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                                    <div className={`px-3 py-2.5 sticky top-0 z-10 backdrop-blur-sm ${isDark ? 'bg-[#0f0f0f]/90' : 'bg-white/90'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Logic & Control</span>
                                        </div>
                                    </div>
                                    <div className="px-3 pb-3 space-y-2">
                                        {nodeTemplates.filter(t => t.category === 'logic').map((template) => (
                                            <div
                                                key={template.type}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, template.type, template.label, template.color)}
                                                className={`group relative flex items-center gap-3 p-2.5 rounded-lg cursor-grab active:cursor-grabbing border transition-all duration-200 hover:scale-[1.02] ${isDark ? 'bg-[#1a1a1a] hover:bg-[#1e1e1e] border-[#252525] hover:border-[#333] hover:shadow-lg hover:shadow-black/20' : 'bg-gray-50 hover:bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'}`}
                                            >
                                                <div
                                                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3"
                                                    style={{ backgroundColor: template.bgColor }}
                                                >
                                                    <NodeIcon icon={template.icon} color={template.color} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{template.label}</p>
                                                    <p className={`text-[10px] truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{template.description}</p>
                                                </div>
                                                <svg className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Resources Category */}
                                <div className={`border-b ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                                    <div className={`px-3 py-2.5 sticky top-0 z-10 backdrop-blur-sm ${isDark ? 'bg-[#0f0f0f]/90' : 'bg-white/90'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Resources</span>
                                        </div>
                                    </div>
                                    <div className="px-3 pb-3 space-y-2">
                                        {nodeTemplates.filter(t => t.category === 'resource').map((template) => (
                                            <div
                                                key={template.type}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, template.type, template.label, template.color)}
                                                className={`group relative flex items-center gap-3 p-2.5 rounded-lg cursor-grab active:cursor-grabbing border transition-all duration-200 hover:scale-[1.02] ${isDark ? 'bg-[#1a1a1a] hover:bg-[#1e1e1e] border-[#252525] hover:border-[#333] hover:shadow-lg hover:shadow-black/20' : 'bg-gray-50 hover:bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'}`}
                                            >
                                                <div
                                                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3"
                                                    style={{ backgroundColor: template.bgColor }}
                                                >
                                                    <NodeIcon icon={template.icon} color={template.color} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{template.label}</p>
                                                    <p className={`text-[10px] truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{template.description}</p>
                                                </div>
                                                <svg className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Utilities Category */}
                                <div>
                                    <div className={`px-3 py-2.5 sticky top-0 z-10 backdrop-blur-sm ${isDark ? 'bg-[#0f0f0f]/90' : 'bg-white/90'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Utilities</span>
                                        </div>
                                    </div>
                                    <div className="px-3 pb-3 space-y-2">
                                        {nodeTemplates.filter(t => t.category === 'utility').map((template) => (
                                            <div
                                                key={template.type}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, template.type, template.label, template.color)}
                                                className={`group relative flex items-center gap-3 p-2.5 rounded-lg cursor-grab active:cursor-grabbing border transition-all duration-200 hover:scale-[1.02] ${isDark ? 'bg-[#1a1a1a] hover:bg-[#1e1e1e] border-[#252525] hover:border-[#333] hover:shadow-lg hover:shadow-black/20' : 'bg-gray-50 hover:bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'}`}
                                            >
                                                <div
                                                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3"
                                                    style={{ backgroundColor: template.bgColor }}
                                                >
                                                    <NodeIcon icon={template.icon} color={template.color} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{template.label}</p>
                                                    <p className={`text-[10px] truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{template.description}</p>
                                                </div>
                                                <svg className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Footer - Keyboard Shortcuts */}
                            <div className={`p-3 border-t ${isDark ? 'border-[#1e1e1e] bg-[#0a0a0a]' : 'border-gray-200 bg-gray-50'}`}>
                                <p className={`text-[10px] font-semibold mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>SHORTCUTS</p>
                                <div className="space-y-1.5 text-[10px]">
                                    <div className={`flex items-center justify-between ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        <span>Delete</span>
                                        <kbd className={`px-1.5 py-0.5 rounded font-mono border text-[9px] ${isDark ? 'bg-[#1a1a1a] text-gray-400 border-[#252525]' : 'bg-white text-gray-500 border-gray-200'}`}>Del</kbd>
                                    </div>
                                    <div className={`flex items-center justify-between ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        <span>Save</span>
                                        <kbd className={`px-1.5 py-0.5 rounded font-mono border text-[9px] ${isDark ? 'bg-[#1a1a1a] text-gray-400 border-[#252525]' : 'bg-white text-gray-500 border-gray-200'}`}>⌘S</kbd>
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
                                    className={`absolute left-4 top-4 z-10 w-10 h-10 border rounded-xl flex items-center justify-center transition-all shadow-lg ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#252525]' : 'bg-white border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                    </svg>
                                </button>
                            )}

                            {/* Drop indicator */}
                            {isDraggingOver && (
                                <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-indigo-500/5">
                                    <div className={`px-6 py-4 border-2 border-dashed border-indigo-500 rounded-2xl text-indigo-500 font-semibold text-sm shadow-2xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
                                        Drop to add node
                                    </div>
                                </div>
                            )}

                            {/* Recording Panel - Floating overlay */}
                            {isRecording && showRecordingPanel && (
                                <div className={`absolute top-4 right-4 z-50 w-80 rounded-2xl shadow-2xl border overflow-hidden ${isDark ? 'bg-[#1a1a1a]/95 border-red-500/30 backdrop-blur-lg' : 'bg-white/95 border-red-200 backdrop-blur-lg'
                                    }`}>
                                    {/* Header */}
                                    <div className={`px-4 py-3 border-b ${isDark ? 'border-[#2a2a2a] bg-red-500/10' : 'border-red-100 bg-red-50'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                                <span className={`text-sm font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                                    Recording
                                                </span>
                                                <span className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {formatDuration(recordingDuration)}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setShowRecordingPanel(false)}
                                                className={`p-1 rounded hover:bg-gray-500/20 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {selectedDevice?.name} • {recordedNodeCount} actions
                                        </p>
                                    </div>

                                    {/* Action List */}
                                    <div className="max-h-48 overflow-y-auto">
                                        {recordedActions.length === 0 ? (
                                            <div className={`p-4 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                                </svg>
                                                <p className="text-xs">Waiting for actions...</p>
                                                <p className="text-[10px] mt-1 opacity-70">Interact with the app on your device</p>
                                            </div>
                                        ) : (
                                            <div className="p-2 space-y-1">
                                                {recordedActions.slice(-5).map((action, idx) => (
                                                    <div
                                                        key={action.nodeId}
                                                        className={`flex items-center gap-2 p-2 rounded-lg ${isDark ? 'bg-[#252525]' : 'bg-gray-50'
                                                            }`}
                                                    >
                                                        <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                                                            }`}>
                                                            {recordedActions.length - 4 + idx}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                {action.label}
                                                            </p>
                                                        </div>
                                                        {action.screenshotUrl && (
                                                            <img
                                                                src={action.screenshotUrl}
                                                                alt=""
                                                                className="w-8 h-8 rounded object-cover border border-gray-500/20"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Controls */}
                                    <div className={`p-3 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={togglePauseRecording}
                                                className={`flex-1 h-8 flex items-center justify-center gap-1 text-xs font-medium rounded-lg transition-colors ${isPaused
                                                    ? isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-600'
                                                    : isDark ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-600'
                                                    }`}
                                            >
                                                {isRecordingPaused ? (
                                                    <>
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                        Resume
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                                        Pause
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={undoLastAction}
                                                disabled={recordedActions.length === 0}
                                                className={`h-8 px-3 flex items-center gap-1 text-xs font-medium rounded-lg transition-colors ${recordedActions.length === 0
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : ''
                                                    } ${isDark ? 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                </svg>
                                                Undo
                                            </button>
                                            <button
                                                onClick={stopRecording}
                                                className={`h-8 px-4 flex items-center gap-1 text-xs font-medium rounded-lg transition-colors ${isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'
                                                    }`}
                                            >
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                                                Stop
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Minimized recording indicator */}
                            {isRecording && !showRecordingPanel && (
                                <button
                                    onClick={() => setShowRecordingPanel(true)}
                                    className={`absolute top-4 right-4 z-50 px-4 py-2 rounded-xl shadow-lg border flex items-center gap-2 ${isDark ? 'bg-[#1a1a1a]/95 border-red-500/30' : 'bg-white border-red-200'
                                        }`}
                                >
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className={`text-xs font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                        {formatDuration(recordingDuration)}
                                    </span>
                                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        • {recordedNodeCount} actions
                                    </span>
                                </button>
                            )}

                            <ReactFlow
                                nodes={nodesWithExecution}
                                edges={edgesWithExecution}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                onMoveEnd={onMoveEnd}
                                onNodeClick={onNodeClick}
                                onPaneClick={onPaneClick}
                                nodeTypes={nodeTypes}
                                edgeTypes={edgeTypes}
                                defaultEdgeOptions={defaultEdgeOptions}
                                defaultViewport={viewport}
                                connectionLineType={ConnectionLineType.SmoothStep}
                                connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
                                fitView={nodes.length === 0}
                                snapToGrid={true}
                                snapGrid={[20, 20]}
                                proOptions={{ hideAttribution: true }}
                                className={`transition-colors duration-300 ${isDark ? '!bg-[#0a0a0a]' : '!bg-gray-50'}`}
                            >
                                <Background
                                    variant={BackgroundVariant.Dots}
                                    gap={20}
                                    size={1}
                                    color={isDark ? '#1a1a1a' : '#d1d5db'}
                                />

                                {/* Custom Controls */}
                                <Panel position="bottom-left" className="!m-4">
                                    <div className={`flex items-center rounded-xl overflow-hidden shadow-xl border ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
                                        <button
                                            onClick={() => zoomOut()}
                                            className={`w-10 h-10 flex items-center justify-center transition-all ${isDark ? 'text-gray-400 hover:text-white hover:bg-[#252525]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                                            title="Zoom out"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                            </svg>
                                        </button>
                                        <div className={`w-px h-6 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />
                                        <button
                                            onClick={() => zoomIn()}
                                            className={`w-10 h-10 flex items-center justify-center transition-all ${isDark ? 'text-gray-400 hover:text-white hover:bg-[#252525]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                                            title="Zoom in"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>
                                        <div className={`w-px h-6 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />
                                        <button
                                            onClick={() => fitView({ padding: 0.2 })}
                                            className={`w-10 h-10 flex items-center justify-center transition-all ${isDark ? 'text-gray-400 hover:text-white hover:bg-[#252525]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
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
                                    <div className={`rounded-xl overflow-hidden shadow-xl border ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
                                        <MiniMap
                                            nodeColor={(node) => {
                                                const state = nodeStates[node.id]?.status;
                                                if (state === NodeStatus.RUNNING) return '#6366f1';
                                                if (state === NodeStatus.SUCCESS) return '#10b981';
                                                if (state === NodeStatus.ERROR) return '#ef4444';
                                                const colors = { input: '#10b981', output: '#ef4444', process: '#3b82f6', custom: '#8b5cf6' };
                                                return colors[node.type] || '#6366f1';
                                            }}
                                            maskColor={isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.85)'}
                                            style={{ width: 180, height: 120, background: isDark ? '#0a0a0a' : '#f9fafb' }}
                                            className={`!border-none ${isDark ? '!bg-[#0a0a0a]' : '!bg-gray-50'}`}
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
                                            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Start Building</h3>
                                            <p className={`text-sm max-w-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                Drag nodes from the left panel to create your workflow
                                            </p>
                                        </div>
                                    </Panel>
                                )}
                            </ReactFlow>
                        </div>

                        {/* Right Panel - Node Properties */}
                        {selectedNode && (
                            <div className={`w-80 flex flex-col border-l transition-colors ${isDark ? 'bg-[#0f0f0f] border-[#1e1e1e]' : 'bg-white border-gray-200'}`}>
                                <div className={`h-12 px-4 flex items-center justify-between border-b ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                                    <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Node Properties</span>
                                    <button
                                        onClick={() => setSelectedNode(null)}
                                        className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${isDark ? 'hover:bg-[#1a1a1a] text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {/* Recorded Action Badge */}
                                    {selectedNode.data?.isRecorded && (
                                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            <span className={`text-xs font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>RECORDED ACTION</span>
                                            {selectedNode.data?.sequenceNumber && (
                                                <span className={`text-xs ${isDark ? 'text-red-400/60' : 'text-red-500/60'}`}>#{selectedNode.data.sequenceNumber}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Screenshot Preview */}
                                    {selectedNode.data?.screenshotUrl && (
                                        <div>
                                            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Screenshot</label>
                                            <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-gray-500/20 cursor-pointer group">
                                                <img
                                                    src={selectedNode.data.screenshotUrl}
                                                    alt="Action screenshot"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                                                    <span className="text-white text-xs font-medium">Click to expand</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Type */}
                                    <div>
                                        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Action Type</label>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedNode.data?.eventType === 'click' ? 'bg-blue-500/20' :
                                                    selectedNode.data?.eventType === 'text_input' ? 'bg-purple-500/20' :
                                                        selectedNode.data?.eventType?.includes('scroll') ? 'bg-amber-500/20' :
                                                            selectedNode.data?.eventType?.includes('swipe') ? 'bg-cyan-500/20' :
                                                                'bg-indigo-500/20'
                                                    }`}
                                            >
                                                <svg className={`w-4 h-4 ${selectedNode.data?.eventType === 'click' ? 'text-blue-400' :
                                                    selectedNode.data?.eventType === 'text_input' ? 'text-purple-400' :
                                                        selectedNode.data?.eventType?.includes('scroll') ? 'text-amber-400' :
                                                            selectedNode.data?.eventType?.includes('swipe') ? 'text-cyan-400' :
                                                                'text-indigo-400'
                                                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            </div>
                                            <span className={`text-sm font-medium capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {selectedNode.data?.eventType || selectedNode.type}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Label - Editable */}
                                    <div>
                                        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Label</label>
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
                                            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                        />
                                    </div>

                                    {/* Element Details Section - For recorded actions */}
                                    {selectedNode.data?.isRecorded && (
                                        <>
                                            <div className={`border-t pt-4 ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                                                <label className={`block text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    Element Details
                                                </label>

                                                {/* Resource ID */}
                                                {selectedNode.data?.resourceId && (
                                                    <div className="mb-3">
                                                        <div className={`flex items-center gap-1.5 mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                                            </svg>
                                                            <span className="text-[10px] font-semibold uppercase">Resource ID</span>
                                                        </div>
                                                        <div className={`text-xs font-mono rounded-lg px-3 py-2 border break-all ${isDark ? 'text-gray-300 bg-[#1a1a1a] border-[#2a2a2a]' : 'text-gray-700 bg-gray-50 border-gray-200'}`}>
                                                            {selectedNode.data.resourceId}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Text Content */}
                                                {selectedNode.data?.text && (
                                                    <div className="mb-3">
                                                        <div className={`flex items-center gap-1.5 mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                                            </svg>
                                                            <span className="text-[10px] font-semibold uppercase">Text Content</span>
                                                        </div>
                                                        <div className={`text-xs rounded-lg px-3 py-2 border ${isDark ? 'text-gray-300 bg-[#1a1a1a] border-[#2a2a2a]' : 'text-gray-700 bg-gray-50 border-gray-200'}`}>
                                                            "{selectedNode.data.text}"
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Tap Coordinates */}
                                                {selectedNode.data?.coordinates && (selectedNode.data.coordinates.x || selectedNode.data.coordinates.y) && (
                                                    <div className="mb-3">
                                                        <div className={`flex items-center gap-1.5 mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            </svg>
                                                            <span className="text-[10px] font-semibold uppercase">Tap Coordinates</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className={`text-xs font-mono rounded-lg px-3 py-2 border ${isDark ? 'text-gray-300 bg-[#1a1a1a] border-[#2a2a2a]' : 'text-gray-700 bg-gray-50 border-gray-200'}`}>
                                                                X: {selectedNode.data.coordinates.x}
                                                            </div>
                                                            <div className={`text-xs font-mono rounded-lg px-3 py-2 border ${isDark ? 'text-gray-300 bg-[#1a1a1a] border-[#2a2a2a]' : 'text-gray-700 bg-gray-50 border-gray-200'}`}>
                                                                Y: {selectedNode.data.coordinates.y}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Bounds */}
                                                {selectedNode.data?.bounds && (
                                                    <div className="mb-3">
                                                        <div className={`flex items-center gap-1.5 mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                                                            </svg>
                                                            <span className="text-[10px] font-semibold uppercase">Element Bounds</span>
                                                        </div>
                                                        <div className={`text-xs font-mono rounded-lg px-3 py-2 border break-all ${isDark ? 'text-gray-300 bg-[#1a1a1a] border-[#2a2a2a]' : 'text-gray-700 bg-gray-50 border-gray-200'}`}>
                                                            {selectedNode.data.bounds}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Package Name */}
                                                {selectedNode.data?.packageName && (
                                                    <div className="mb-3">
                                                        <div className={`flex items-center gap-1.5 mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                            </svg>
                                                            <span className="text-[10px] font-semibold uppercase">Package</span>
                                                        </div>
                                                        <div className={`text-xs font-mono rounded-lg px-3 py-2 border break-all ${isDark ? 'text-gray-300 bg-[#1a1a1a] border-[#2a2a2a]' : 'text-gray-700 bg-gray-50 border-gray-200'}`}>
                                                            {selectedNode.data.packageName}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Class Name */}
                                                {selectedNode.data?.className && (
                                                    <div className="mb-3">
                                                        <div className={`flex items-center gap-1.5 mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                            </svg>
                                                            <span className="text-[10px] font-semibold uppercase">Class Name</span>
                                                        </div>
                                                        <div className={`text-xs font-mono rounded-lg px-3 py-2 border break-all ${isDark ? 'text-gray-300 bg-[#1a1a1a] border-[#2a2a2a]' : 'text-gray-700 bg-gray-50 border-gray-200'}`}>
                                                            {selectedNode.data.className}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* Node Technical Info */}
                                    <div className={`border-t pt-4 ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                                        <label className={`block text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Technical Info
                                        </label>
                                        <div className="space-y-2">
                                            <div>
                                                <span className={`text-[10px] font-semibold uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Node ID</span>
                                                <div className={`text-xs font-mono rounded-lg px-3 py-2 border mt-1 ${isDark ? 'text-gray-500 bg-[#1a1a1a] border-[#2a2a2a]' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                                                    {selectedNode.id}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <span className={`text-[10px] font-semibold uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Canvas X</span>
                                                    <div className={`text-xs rounded-lg px-3 py-2 border mt-1 ${isDark ? 'text-gray-500 bg-[#1a1a1a] border-[#2a2a2a]' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                                                        {Math.round(selectedNode.position?.x || 0)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className={`text-[10px] font-semibold uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Canvas Y</span>
                                                    <div className={`text-xs rounded-lg px-3 py-2 border mt-1 ${isDark ? 'text-gray-500 bg-[#1a1a1a] border-[#2a2a2a]' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                                                        {Math.round(selectedNode.position?.y || 0)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-4 border-t ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                                    <button
                                        onClick={deleteSelectedNode}
                                        className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-semibold rounded-lg transition-all border border-red-500/20 hover:border-red-500/40"
                                    >
                                        Delete Node
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Execution Log Panel */}
                    {showLogPanel && executionLog.length > 0 && (
                        <div className={`h-48 border-t flex flex-col ${isDark ? 'bg-[#0f0f0f] border-[#1e1e1e]' : 'bg-white border-gray-200'}`}>
                            <div className={`h-10 px-4 flex items-center justify-between flex-shrink-0 border-b ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Execution Log</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-[#1a1a1a] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                        {executionLog.length} entries
                                    </span>
                                </div>
                                <button
                                    onClick={() => setShowLogPanel(false)}
                                    className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${isDark ? 'hover:bg-[#1a1a1a] text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1 flow-editor-sidebar">
                                {executionLog.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className={`execution-log-entry flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isDark ? '' : ''}`}
                                    >
                                        <LogIcon type={entry.type} />
                                        <span className={`text-xs font-mono ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                            {new Date(entry.timestamp).toLocaleTimeString()}
                                        </span>
                                        <span className={`flex-1 ${entry.type === 'success' ? 'text-emerald-400' :
                                            entry.type === 'error' ? 'text-red-400' :
                                                entry.type === 'warning' ? 'text-amber-400' :
                                                    isDark ? 'text-gray-300' : 'text-gray-700'
                                            }`}>
                                            {entry.message}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Media Picker Modal */}
            <MediaPickerModal
                isOpen={showMediaPicker}
                onClose={() => setShowMediaPicker(false)}
                onSelect={handleMediaFileSelected}
                mediaFiles={mediaFiles}
                fileType="any"
            />

            {/* Collection Picker Modal */}
            <CollectionPickerModal
                isOpen={showCollectionPicker}
                onClose={() => setShowCollectionPicker(false)}
                onSelect={handleCollectionSelected}
                collections={collections}
            />

            {/* Node Configuration Panel */}
            {selectedNode && (
                <NodeConfigPanel
                    node={selectedNode}
                    onUpdateNode={handleUpdateNode}
                    onClose={() => setSelectedNode(null)}
                    upstreamVariables={[]}
                    loopContext={null}
                />
            )}

            {/* Live Recording Panel - Real-time sync from Android APK */}
            <LiveRecordingPanel
                userId={props.auth?.user?.id}
                onImportNodes={(importedNodes, importedEdges) => {
                    // Add imported nodes to canvas
                    const lastNode = nodes[nodes.length - 1];
                    const offsetY = lastNode ? lastNode.position.y + 150 : 100;

                    const positionedNodes = importedNodes.map((node, index) => ({
                        ...node,
                        position: {
                            x: node.position.x + 200,
                            y: node.position.y + offsetY,
                        },
                    }));

                    setNodes(prev => [...prev, ...positionedNodes]);
                    if (importedEdges?.length > 0) {
                        setEdges(prev => [...prev, ...importedEdges]);
                    }

                    // Connect to last existing node if any
                    if (lastNode && positionedNodes.length > 0) {
                        setEdges(prev => [...prev, {
                            id: `edge-import-${Date.now()}`,
                            source: lastNode.id,
                            target: positionedNodes[0].id,
                            type: 'animated',
                        }]);
                    }

                    debouncedSave(nodes.concat(positionedNodes), edges, viewport);
                }}
            />
        </>
    );
}

export default function Editor({ flow, mediaFiles, dataCollections }) {
    return (
        <ReactFlowProvider>
            <FlowEditor flow={flow} mediaFiles={mediaFiles} dataCollections={dataCollections} />
        </ReactFlowProvider>
    );
}
