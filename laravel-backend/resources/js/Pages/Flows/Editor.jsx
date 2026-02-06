import { useState, useCallback, useRef, useEffect, useMemo, lazy, Suspense } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import ReactFlow, {
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    Background,
    MiniMap,
    Panel,
    useReactFlow,
    ReactFlowProvider,
    BackgroundVariant,
    ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Theme support
import { useTheme } from '@/Contexts/ThemeContext';
import { getEditorClasses, getReactFlowTheme } from '@/constants/editorTheme';

// Constants - Node/Edge types and templates
import { nodeTypes } from '@/constants/nodeTypes';
import { edgeTypes, defaultEdgeOptions } from '@/constants/edgeTypes';
import { getNodeTemplates } from '@/constants/nodeTemplates';

import MediaPickerModal from '@/Components/MediaPickerModal';
import CollectionPickerModal from '@/Components/CollectionPickerModal';
import { useToast } from '@/Components/Layout/ToastProvider';

// Execution state
import { useExecutionState, ExecutionStatus, NodeStatus } from '@/hooks/useExecutionState';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useDeviceApps } from '@/hooks/useDeviceApps';
import { useModalManager } from '@/hooks/useModalManager';
import { useDeviceManager } from '@/hooks/useDeviceManager';
import { useDebugPanel } from '@/hooks/useDebugPanel';
import { useFlowPersistence } from '@/hooks/useFlowPersistence';
import { useNodeCreation } from '@/hooks/useNodeCreation';
import { useLoopOperations } from '@/hooks/useLoopOperations';
import { deviceApi, flowApi, recordingApi } from '@/services/api';

// Flow components - Regular imports (always needed)
import NodeConfigPanel from '@/Components/Flow/NodeConfigPanel';
import EdgeDelayPopover from '@/Components/Flow/EdgeDelayPopover';
import DebugEventPanel from '@/Components/Flow/DebugEventPanel';
import RecordingPanel from '@/Components/Flow/RecordingPanel';
import NodeSidebar from '@/Components/Flow/NodeSidebar';
import CanvasControls from '@/Components/Flow/CanvasControls';
import MultiSelectionToolbar from '@/Components/Flow/MultiSelectionToolbar';
import NodePropertiesPanel from '@/Components/Flow/NodePropertiesPanel';
import ExecutionLogPanel from '@/Components/Flow/ExecutionLogPanel';
import EditorToolbar from '@/Components/Flow/EditorToolbar';
import ClearConfirmModal from '@/Components/Flow/ClearConfirmModal';
import { MouseDragProvider } from '@/Components/Flow/MouseDragProvider';

// Lazy-loaded modals (heavy components, loaded only when needed)
const LoopSubFlowModal = lazy(() => import('@/Components/Flow/LoopSubFlowModal'));
const AINodeConfigModal = lazy(() => import('@/Components/Flow/AINodeConfigModal'));
const WorkflowPreviewModal = lazy(() => import('@/Components/Flow/WorkflowPreviewModal'));
const LiveRecordingPanel = lazy(() => import('@/Components/Flow/LiveRecordingPanel'));

// Simple loading fallback for lazy modals
const ModalLoader = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl">
            <div className="animate-spin w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full mx-auto" />
        </div>
    </div>
);

// nodeTypes, edgeTypes, defaultEdgeOptions are imported from constants/

function FlowEditor({ flow, mediaFiles = [], dataCollections = [] }) {
    // Use usePage to get props directly - workaround for Inertia prop hydration bug
    const { props } = usePage();
    const { auth } = props; // Get auth for socket channel subscription
    const collections = props.dataCollections || dataCollections;

    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { addToast } = useToast();
    const { t } = useTranslation();

    // Theme utilities - MEMOIZED for performance (Phase 6)
    const themeClasses = useMemo(() => getEditorClasses(isDark), [isDark]);
    const reactFlowTheme = useMemo(() => getReactFlowTheme(isDark), [isDark]);

    // ===== Phase 2 Custom Hooks =====
    // Device management
    const { selectedDevice, devices, setSelectedDevice, setDevices, isPinging, pingError, hasVerifiedDevice, clearPingError } = useDeviceManager(props.devices || [], auth);

    // Device apps (Phase 1)
    const { apps: deviceApps, appsLoading: deviceAppsLoading, requestApps: requestDeviceApps } = useDeviceApps(auth?.user?.id);

    // Modal management
    const modalManager = useModalManager();
    const { modals, openModal, closeModal, openMediaPicker, openCollectionPicker, openLoopSubFlow, openEdgeDelay, openAIConfig, MODAL_TYPES } = modalManager;

    // Debug panel
    const { debugEvents, showDebugPanel, setShowDebugPanel, addDebugEvent, clearDebugEvents, toggleDebugPanel } = useDebugPanel();

    // ===== Core Flow State =====
    const [nodes, setNodes] = useState(flow.nodes || []);
    const [edges, setEdges] = useState(flow.edges || []);
    const [viewport, setViewport] = useState(flow.viewport || { x: 0, y: 0, zoom: 1 });

    // Undo/Redo history management
    const { takeSnapshot, undo, redo, canUndo, canRedo } = useUndoRedo(nodes, edges, setNodes, setEdges);

    // ===== Flow Persistence (extracted to hook) =====
    const {
        saving,
        lastSaved,
        flowName,
        editingName,
        setFlowName,
        setEditingName,
        saveFlow,
        debouncedSave,
        manualSave,
        saveName,
    } = useFlowPersistence({ flow, autoSaveEnabled: false });

    // ===== Canvas Interaction State (TODO: extract to useFlowCanvas) =====
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedNodes, setSelectedNodes] = useState([]); // Multi-select support
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [draggedNodeType, setDraggedNodeType] = useState(null);

    // ===== UI State =====
    const [showSidebar, setShowSidebar] = useState(true);
    const [sidebarExpanded, setSidebarExpanded] = useState(false); // Compact by default
    const [showLogPanel, setShowLogPanel] = useState(false);

    // ===== Recording Mode State (TODO: extract to useRecordingMode) =====
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSession, setRecordingSession] = useState(null);
    const [recordedNodeCount, setRecordedNodeCount] = useState(0);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [recordedActions, setRecordedActions] = useState([]);
    const [showRecordingPanel, setShowRecordingPanel] = useState(false);
    const [isRecordingPaused, setIsRecordingPaused] = useState(false);
    const consecutiveActionsRef = useRef([]);
    const recordingTimerRef = useRef(null);

    // ===== Node Creation Hook =====
    const {
        createNodeFromEvent,
        createLoopNodeFromActions,
        resetConsecutiveActions,
        getNodeType,
        consecutiveActionsRef: nodeCreationConsecutiveRef,
    } = useNodeCreation({
        setNodes,
        setEdges,
        setSelectedNode,
        setRecordedActions,
        setRecordedNodeCount,
        openLoopSubFlow: (nodeId) => openLoopSubFlow(nodeId),
        t,
    });

    // Test Run state
    const [testRunning, setTestRunning] = useState(false);

    const reactFlowWrapper = useRef(null);
    const { screenToFlowPosition, fitView, zoomIn, zoomOut, getZoom } = useReactFlow();

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
        updateNodeState,
        isRunning,
        isPaused,
        isCompleted,
        hasError,
    } = useExecutionState(nodes, edges);

    // Listen for real-time workflow action progress from APK via socket
    useEffect(() => {
        if (!auth?.user?.id) {
            console.log('[Progress] No auth user, skipping subscription');
            return;
        }

        console.log('[Progress] Subscribing to channel: user.' + auth.user.id);
        const channel = window.Echo?.private(`user.${auth.user.id}`);
        if (!channel) {
            console.log('[Progress] Echo channel not available!', { Echo: !!window.Echo });
            return;
        }

        console.log('[Progress] Channel subscribed, listening for .workflow.action.progress');

        const handleActionProgress = (event) => {
            console.log('[Progress] 📥 Event received:', event);
            // Only update if this event is for the current flow
            if (event.flow_id !== flow?.id) {
                console.log('[Progress] Skipping - different flow_id', { received: event.flow_id, current: flow?.id });
                return;
            }

            // action_id from APK is the node ID directly (e.g., "click_1769315062846")
            // Try regex first for legacy format, fallback to using action_id as node_id
            const actionId = event.action_id;
            const nodeIdMatch = actionId?.match(/^node_([^_]+)/);
            const nodeId = nodeIdMatch ? nodeIdMatch[1] : actionId;

            console.log('[Progress] action_id:', actionId, '→ node_id:', nodeId, 'status:', event.status);

            if (nodeId && event.status) {
                updateNodeState(
                    nodeId,
                    event.status, // 'running', 'success', 'error'
                    event.message || null
                );
            }
        };


        channel.listen('.workflow.action.progress', handleActionProgress);

        return () => {
            console.log('[Progress] Unsubscribing from channel');
            channel.stopListening('.workflow.action.progress', handleActionProgress);
        };
    }, [auth?.user?.id, flow?.id, updateNodeState]);


    // Sync selectedNode when nodes change (fix stale state bug)
    useEffect(() => {
        if (selectedNode) {
            const updatedNode = nodes.find(n => n.id === selectedNode.id);
            if (updatedNode && JSON.stringify(updatedNode) !== JSON.stringify(selectedNode)) {
                setSelectedNode(updatedNode);
            } else if (!updatedNode) {
                // Node was deleted
                setSelectedNode(null);
            }
        }
    }, [nodes]);

    // NOTE: Device auto-select and accessibility check now handled by useDeviceManager hook



    // Inject callbacks into data_source and file_input nodes after initial load
    // This ensures "Change Collection" and "Browse Media" buttons work for nodes loaded from DB
    useEffect(() => {
        let needsUpdate = false;

        const updatedNodes = nodes.map(node => {
            // Inject callbacks for data_source nodes
            if (node.type === 'data_source' && !node.data?.onSelectCollection) {
                needsUpdate = true;
                return {
                    ...node,
                    data: {
                        ...node.data,
                        onSelectCollection: (nodeId) => {
                            setSelectedNode(null); // Close config panel when opening modal
                            openCollectionPicker(nodeId);
                        },
                        onUpdateData: (nodeId, key, value) => {
                            setNodes((nds) => nds.map(n =>
                                n.id === nodeId
                                    ? { ...n, data: { ...n.data, [key]: value } }
                                    : n
                            ));
                        }
                    }
                };
            }
            // Inject callbacks for file_input nodes
            if (node.type === 'file_input' && !node.data?.onBrowseMedia) {
                needsUpdate = true;
                return {
                    ...node,
                    data: {
                        ...node.data,
                        onBrowseMedia: (nodeId) => {
                            setSelectedNode(null); // Close config panel when opening modal
                            openMediaPicker(nodeId);
                        }
                    }
                };
            }
            // Inject callbacks for ai_call nodes
            if (node.type === 'ai_call' && !node.data?.onUpdateConfig) {
                needsUpdate = true;
                return {
                    ...node,
                    data: {
                        ...node.data,
                        onUpdateConfig: (nodeId, newConfig) => {
                            setNodes((nds) => nds.map(n =>
                                n.id === nodeId
                                    ? { ...n, data: { ...n.data, ...newConfig } }
                                    : n
                            ));
                        }
                    }
                };
            }
            return node;
        });

        if (needsUpdate) {
            setNodes(updatedNodes);
        }
    }, []); // Run only on mount

    // Process existing data wire connections on mount
    // This ensures LoopNodes connected to DataSourceNodes are properly configured
    useEffect(() => {
        const processedNodes = new Set();

        edges.forEach(edge => {
            // Check if this is a data wire connection
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);

            if (!sourceNode || !targetNode) return;

            const isDataWire = edge.sourceHandle === 'data-output' ||
                (sourceNode.type === 'data_source' && edge.targetHandle === 'data-input');

            // If DataSourceNode → LoopNode connection exists but LoopNode isn't configured
            if (isDataWire &&
                sourceNode.type === 'data_source' &&
                targetNode.type === 'loop' &&
                !targetNode.data?.dataSourceNodeId &&
                !processedNodes.has(targetNode.id)) {

                const outputName = sourceNode.data?.outputName ||
                    sourceNode.data?.collectionName?.toLowerCase().replace(/\s+/g, '_') || 'records';

                processedNodes.add(targetNode.id);

                setNodes(nds => nds.map(node => {
                    if (node.id === targetNode.id) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                dataSource: 'data',
                                dataSourceNodeId: sourceNode.id,
                                dataSourceName: outputName,
                                sourceVariable: `{{${outputName}}}`,
                                connectedCollectionName: sourceNode.data?.collectionName,
                                connectedRecordCount: sourceNode.data?.recordCount,
                            }
                        };
                    }
                    return node;
                }));
            }
        });
    }, []); // Run once on mount

    // Update nodes with execution state, visual styling, and callbacks
    const nodesWithExecution = useMemo(() => {
        return nodes.map(node => {
            const state = nodeStates[node.id];

            // Generate className based on execution status
            let executionClass = '';
            if (state) {
                switch (state.status) {
                    case NodeStatus.RUNNING:
                        executionClass = 'ring-4 ring-indigo-500/50 shadow-lg shadow-indigo-500/30 animate-pulse';
                        break;
                    case NodeStatus.SUCCESS:
                        executionClass = 'ring-2 ring-emerald-500/70';
                        break;
                    case NodeStatus.ERROR:
                        executionClass = 'ring-2 ring-rose-500 shadow-lg shadow-rose-500/50';
                        break;
                }
            }

            return {
                ...node,
                className: `${node.className || ''} ${executionClass}`.trim(),
                data: {
                    ...node.data,
                    executionState: state?.status || NodeStatus.IDLE,
                    // Pass edit sub-flow callback for loop nodes
                    ...(node.type === 'loop' && {
                        onEditSubFlow: (nodeId) => {
                            setSelectedNode(null); // Close config panel when opening modal
                            openLoopSubFlow(nodeId);
                        }
                    }),
                }
            };
        });
    }, [nodes, nodeStates]);

    // Handler for edge click - open delay config popover
    // Note: Defined here before edgesWithExecution since it's used in the memo
    const handleEdgeClick = useCallback((edgeId, position, currentDelay) => {
        const edge = edges.find(e => e.id === edgeId);
        if (edge) {
            const popoverPosition = {
                x: position.x + (reactFlowWrapper.current?.getBoundingClientRect()?.left || 0),
                y: position.y + (reactFlowWrapper.current?.getBoundingClientRect()?.top || 0) - 20
            };
            openEdgeDelay(edge, popoverPosition);
        }
    }, [edges, openEdgeDelay]);

    // Update edges with execution state and delay click handler
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
                    onEdgeClick: handleEdgeClick, // Inject click handler for delay config
                }
            };
        });
    }, [edges, nodeStates, isDark, handleEdgeClick]);

    // Recording controls - Start/Stop recording session
    const startRecording = useCallback(async () => {
        if (!selectedDevice) return;

        // Check accessibility service first
        if (!selectedDevice.accessibility_enabled) {
            addToast(`❌ ${t('flows.editor.accessibility.not_enabled_record')}`, 'error');
            return;
        }

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
                consecutiveActionsRef.current = []; // Reset loop detection tracking
                setShowRecordingPanel(true);
                setIsRecordingPaused(false);

                // Start timer
                recordingTimerRef.current = setInterval(() => {
                    setRecordingDuration(prev => prev + 1);
                }, 1000);
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


    // Note: getNodeType, createLoopNodeFromActions, createNodeFromEvent are now provided by useNodeCreation hook
    // The main recording event listener is in the next useEffect (line 687-805) which handles:
    // - .recording.started (sets isRecording = true)
    // - .recording.stopped (sets isRecording = false)  
    // - .event.captured (creates nodes via createNodeFromEvent)
    // No separate useEffect needed here - it was causing duplicate subscriptions and race conditions

    // Use ref to store createNodeFromEvent to avoid stale closure issues
    const createNodeFromEventRef = useRef(createNodeFromEvent);
    useEffect(() => {
        createNodeFromEventRef.current = createNodeFromEvent;
    }, [createNodeFromEvent]);

    // SEPARATE useEffect for registerListener/unregisterListener - only runs when device changes
    // This prevents spam caused by other dependencies changing frequently
    useEffect(() => {
        if (!selectedDevice?.device_id) return;

        let mounted = true;

        const registerListener = async () => {
            try {
                await recordingApi.registerListener({
                    deviceId: selectedDevice.device_id,
                    flowId: flow.id,
                    userId: props.auth?.user?.id,
                });
                if (mounted) {
                    console.log('[Recording] ✅ Registered listener for device:', selectedDevice.device_id);
                }
            } catch (error) {
                console.warn('Failed to register workflow listener:', error);
            }
        };

        const unregisterListener = async () => {
            try {
                await recordingApi.unregisterListener(selectedDevice.device_id);
                console.log('[Recording] 🔌 Unregistered listener for device:', selectedDevice.device_id);
            } catch (error) {
                console.warn('Failed to unregister workflow listener:', error);
            }
        };

        registerListener();

        return () => {
            mounted = false;
            unregisterListener();
        };
    }, [selectedDevice?.device_id, flow.id, props.auth?.user?.id]); // ONLY device_id, flow.id, user.id - not createNodeFromEvent!

    // Listen for recording events from selected device via Echo
    // NO registerListener here - it's handled by the useEffect above
    useEffect(() => {
        // Only listen when a device is selected
        if (!selectedDevice) return;

        try {
            if (typeof window !== 'undefined' && window.Echo && props.auth?.user?.id) {
                // Listen to device-specific channel
                const channelName = `device.${selectedDevice.device_id}`;
                const channel = window.Echo.private(channelName);

                console.log('[Recording] 🎯 Subscribed to device channel:', selectedDevice.device_id);

                // APK started recording
                channel.listen('.recording.started', (e) => {

                    setRecordingSession(e.session);
                    setIsRecording(true);
                    setRecordedNodeCount(0);
                    setRecordingDuration(0);
                    setRecordedActions([]);
                    consecutiveActionsRef.current = []; // Reset loop detection tracking
                    setShowRecordingPanel(true);
                    setIsRecordingPaused(false);

                    // Auto-create "Open App" node as the first node in workflow
                    const targetApp = e.session?.target_app || e.session?.session?.target_app || 'App';
                    const appName = targetApp === 'manual' ? 'Manual Navigation' :
                        targetApp.split('.').pop() || targetApp; // Get last part of package name

                    const openAppEvent = {
                        event_type: 'open_app',
                        sequence_number: 0,
                        package_name: targetApp,
                        text: '',
                        resource_id: '',
                    };

                    const openAppSuggestion = {
                        type: 'open_app',
                        data: {
                            label: `Open ${appName}`,
                            color: 'green',
                        }
                    };

                    createNodeFromEventRef.current(openAppEvent, openAppSuggestion);

                    // Start timer
                    recordingTimerRef.current = setInterval(() => {
                        setRecordingDuration(prev => prev + 1);
                    }, 1000);
                });

                // APK stopped recording
                channel.listen('.recording.stopped', (e) => {

                    if (recordingTimerRef.current) {
                        clearInterval(recordingTimerRef.current);
                        recordingTimerRef.current = null;
                    }
                    setIsRecording(false);
                    setIsRecordingPaused(false);
                });

                // APK captured an event (action)
                channel.listen('.event.captured', (e) => {
                    console.log('[Recording] 📥 Received event.captured:', e);

                    // Store raw event for debug panel
                    addDebugEvent({
                        type: 'event.captured',
                        raw: e.event,
                        suggestion: e.node_suggestion
                    });

                    // Use ref to always get latest createNodeFromEvent
                    createNodeFromEventRef.current(e.event, e.node_suggestion);
                });

                return () => {
                    try {
                        // NO unregisterListener here - it's handled by the dedicated useEffect above
                        channel.stopListening('.recording.started');
                        channel.stopListening('.recording.stopped');
                        channel.stopListening('.event.captured');
                        window.Echo.leave(channelName);
                        console.log('[Recording] 🔌 Left device channel:', selectedDevice.device_id);
                    } catch (err) {
                        console.warn('Error cleaning up channel:', err);
                    }
                };
            }
        } catch (error) {
            console.warn('Echo not available for recording events:', error);
        }
    }, [selectedDevice?.device_id, props.auth?.user?.id]); // Removed createNodeFromEvent - use ref instead

    // Listen for device status changes (accessibility, etc.) via user channel
    useEffect(() => {
        if (!props.auth?.user?.id) return;

        try {
            if (typeof window !== 'undefined' && window.Echo) {
                const userChannel = window.Echo.private(`user.${props.auth.user.id}`);

                // Listen for device accessibility status changes
                userChannel.listen('.device.accessibility.changed', (event) => {


                    // Update devices list (for dropdown display)
                    setDevices(prev => prev.map(d =>
                        d.device_id === event.device.device_id
                            ? { ...d, accessibility_enabled: event.accessibility_enabled }
                            : d
                    ));

                    // Update selectedDevice if it's the one that changed
                    if (selectedDevice && selectedDevice.device_id === event.device.device_id) {
                        setSelectedDevice(prev => ({
                            ...prev,
                            accessibility_enabled: event.accessibility_enabled,
                        }));

                        // Show toast notification
                        if (event.accessibility_enabled) {
                            addToast(`✅ ${t('flows.editor.accessibility.enabled', { device: event.device.name })}`, 'success');
                        } else {
                            addToast(`⚠️ ${t('flows.editor.accessibility.disabled', { device: event.device.name })}`, 'warning');
                        }
                    }
                });

                // Listen for general device status changes
                userChannel.listen('.device.status.changed', (event) => {


                    // Update selectedDevice if needed
                    if (selectedDevice && selectedDevice.id === event.device.id) {
                        setSelectedDevice(prev => ({
                            ...prev,
                            ...event.device,
                        }));
                    }
                });

                // Listen for workflow action progress (real-time node highlighting)
                userChannel.listen('.workflow.action.progress', (event) => {

                    // Only process events for current flow
                    if (event.flow_id !== flow.id) return;

                    // Update node execution state
                    setNodes(currentNodes =>
                        currentNodes.map(node => {
                            // Check if this is the active action node
                            if (node.id === event.action_id) {
                                return {
                                    ...node,
                                    data: {
                                        ...node.data,
                                        executionState: event.status === 'running' ? 'running'
                                            : event.status === 'success' ? 'success'
                                                : event.status === 'error' ? 'error'
                                                    : event.status === 'skipped' ? 'error'
                                                        : 'idle',
                                    }
                                };
                            }
                            // Reset previous running nodes to pending if still running
                            if (node.data?.executionState === 'running' && event.status === 'running') {
                                return {
                                    ...node,
                                    data: {
                                        ...node.data,
                                        executionState: 'pending',
                                    }
                                };
                            }
                            return node;
                        })
                    );

                    // Show progress toast
                    if (event.status === 'error') {
                        addToast(`❌ Action failed: ${event.message || 'Unknown error'}`, 'error');
                    }
                });

                return () => {
                    userChannel.stopListening('.device.accessibility.changed');
                    userChannel.stopListening('.device.status.changed');
                    userChannel.stopListening('.workflow.action.progress');
                };
            }
        } catch (error) {
            console.warn('Echo not available for user events:', error);
        }
    }, [props.auth?.user?.id, selectedDevice?.device_id, addToast, flow.id, setNodes]);

    // Note: saveFlow and debouncedSave are now provided by useFlowPersistence hook

    const onNodesChange = useCallback((changes) => {
        // Snapshot before node removals for undo
        const hasRemove = changes.some(c => c.type === 'remove');
        if (hasRemove) takeSnapshot();

        setNodes((nds) => {
            const newNodes = applyNodeChanges(changes, nds);
            debouncedSave(newNodes, edges, viewport);
            return newNodes;
        });
    }, [edges, viewport, debouncedSave, takeSnapshot]);

    const onEdgesChange = useCallback((changes) => {
        // Snapshot before edge removals for undo
        const hasRemove = changes.some(c => c.type === 'remove');
        if (hasRemove) takeSnapshot();

        setEdges((eds) => {
            const newEdges = applyEdgeChanges(changes, eds);
            debouncedSave(nodes, newEdges, viewport);
            return newEdges;
        });
    }, [nodes, viewport, debouncedSave, takeSnapshot]);

    const onConnect = useCallback((connection) => {
        // Check if this is a data wire connection (from DataSourceNode data-output)
        const sourceNode = nodes.find(n => n.id === connection.source);
        const targetNode = nodes.find(n => n.id === connection.target);

        const isDataWire = connection.sourceHandle === 'data-output' ||
            (sourceNode?.type === 'data_source' && connection.targetHandle === 'data-input');

        // If connecting DataSourceNode to LoopNode via data wire, auto-populate variables
        if (isDataWire && sourceNode?.type === 'data_source' && targetNode?.type === 'loop') {
            const outputName = sourceNode.data?.outputName ||
                sourceNode.data?.collectionName?.toLowerCase().replace(/\s+/g, '_') || 'records';

            // Update LoopNode with data source info
            setNodes((nds) => nds.map(node => {
                if (node.id === targetNode.id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            dataSource: 'data',
                            dataSourceNodeId: sourceNode.id,
                            dataSourceName: outputName,
                            sourceVariable: `{{${outputName}}}`,
                            // Also set collection info for display
                            connectedCollectionName: sourceNode.data?.collectionName,
                            connectedRecordCount: sourceNode.data?.recordCount,
                        }
                    };
                }
                return node;
            }));
        }

        // If connecting DataSourceNode to Action nodes (text_input, set_text, click, tap) via data wire
        const actionNodeTypes = ['text_input', 'set_text', 'click', 'tap'];
        const targetActionType = targetNode?.data?.eventType || targetNode?.data?.actionType || targetNode?.type;

        if (isDataWire && sourceNode?.type === 'data_source' && actionNodeTypes.includes(targetActionType)) {
            const outputName = sourceNode.data?.outputName ||
                sourceNode.data?.collectionName?.toLowerCase().replace(/\s+/g, '_') || 'records';
            const collectionName = sourceNode.data?.collectionName || 'Data Source';

            // Get first field from schema if available, otherwise use generic variable
            const schema = sourceNode.data?.schema || [];
            const firstField = schema.length > 0 ? schema[0].name : null;
            const variableSuggestion = firstField
                ? `{{item.${firstField}}}`
                : `{{${outputName}}}`;

            // Update Action node with data source info
            setNodes((nds) => nds.map(node => {
                if (node.id === targetNode.id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            connectedDataSource: collectionName,
                            connectedVariable: variableSuggestion,
                            dataSourceNodeId: sourceNode.id,
                            // For text_input, also set the inputText to use the variable
                            ...(targetActionType === 'text_input' || targetActionType === 'set_text' ? {
                                inputText: variableSuggestion,
                            } : {}),
                        }
                    };
                }
                return node;
            }));
        }

        // Create the edge
        setEdges((eds) => {
            const newEdge = {
                ...connection,
                id: `e${connection.source}-${connection.target}-${Date.now()}`,
                ...defaultEdgeOptions,
                // Style data wires differently
                ...(isDataWire && {
                    style: { stroke: '#f59e0b', strokeWidth: 3 },
                    animated: true,
                    type: 'smoothstep',
                }),
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
        setSelectedNodes([]);
    }, []);

    // Handle multi-selection changes from ReactFlow
    const onSelectionChange = useCallback(({ nodes: selectedNodesList }) => {
        setSelectedNodes(selectedNodesList || []);
        // If single selection, also set selectedNode for config panel
        if (selectedNodesList?.length === 1) {
            setSelectedNode(selectedNodesList[0]);
        } else if (selectedNodesList?.length > 1) {
            setSelectedNode(null); // Clear single selection when multi-selecting
        }
    }, []);

    // Handler for updating node from config panel
    const handleUpdateNode = useCallback((nodeId, updatedNode) => {
        setNodes((nds) => nds.map((n) => n.id === nodeId ? updatedNode : n));
    }, []);

    // Handler for updating edge delay config
    const handleEdgeDelayUpdate = useCallback((delayConfig) => {
        if (!modals.edgeDelay.edge) return;

        setEdges((eds) => eds.map((e) => {
            if (e.id === modals.edgeDelay.edge.id) {
                return {
                    ...e,
                    data: {
                        ...e.data,
                        delay: delayConfig,
                    },
                };
            }
            return e;
        }));

        closeModal(MODAL_TYPES.EDGE_DELAY);

        // Trigger auto-save
        debouncedSave(nodes, edges);
    }, [modals.edgeDelay.edge, nodes, edges, debouncedSave, closeModal, MODAL_TYPES]);

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setIsDraggingOver(true);
    }, []);

    const onDragLeave = useCallback(() => {
        setIsDraggingOver(false);
    }, []);

    // Utility to update node data by ID
    const updateNodeData = useCallback((nodeId, dataUpdates) => {
        setNodes(nds => nds.map(node =>
            node.id === nodeId
                ? { ...node, data: { ...node.data, ...dataUpdates } }
                : node
        ));
    }, [setNodes]);

    // Handler for media file selection
    const handleMediaFileSelected = useCallback((file) => {
        updateNodeData(mediaPickerNodeId, {
            selectionType: 'file',
            fileName: file.original_name,
            filePath: file.url,
            fileSize: file.formatted_size,
            fileType: file.type,
            fileId: file.id,
            // Clear folder data when selecting file
            folderName: null,
            folderPath: null,
        });
        closeModal('mediaPicker');
    }, [mediaPickerNodeId, updateNodeData, closeModal]);

    // Handler for media folder selection (random file from folder)
    const handleMediaFolderSelected = useCallback((folder) => {
        updateNodeData(mediaPickerNodeId, {
            selectionType: 'folder',
            folderName: folder.name,
            folderPath: folder.path,
            // Clear file data when selecting folder
            fileName: null,
            filePath: null,
            fileSize: null,
            fileType: null,
            fileId: null,
        });
        closeModal('mediaPicker');
    }, [mediaPickerNodeId, updateNodeData, closeModal]);

    // Handler for collection selection
    const handleCollectionSelected = useCallback((collection) => {
        updateNodeData(collectionPickerNodeId, {
            collectionId: collection.id,
            collectionName: collection.name,
            collectionIcon: collection.icon,
            collectionColor: collection.color,
            schema: collection.schema,
            recordCount: collection.records_count,
            label: collection.name,
        });
        closeModal('collectionPicker');
    }, [collectionPickerNodeId, updateNodeData, closeModal]);

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
                // CRITICAL: Set eventType so SmartActionNode knows which icon/label to display
                // Without this, SmartActionNode defaults to 'tap' (see line 29 of SmartActionNode.jsx)
                eventType: type,
                // Add media browser callback for FileInputNode
                ...(type === 'file_input' && {
                    onBrowseMedia: (nodeId) => {
                        setSelectedNode(null); // Close config panel when opening modal
                        openMediaPicker(nodeId);
                    }
                }),
                // Add collection picker callback for DataSourceNode
                ...(type === 'data_source' && {
                    onSelectCollection: (nodeId) => {
                        setSelectedNode(null); // Close config panel when opening modal
                        openCollectionPicker(nodeId);
                    },
                    // Callback for updating data inline (e.g., outputName)
                    onUpdateData: (nodeId, key, value) => {
                        setNodes((nds) => nds.map(node =>
                            node.id === nodeId
                                ? { ...node, data: { ...node.data, [key]: value } }
                                : node
                        ));
                    }
                }),
                // Add AI config modal callback for AINode
                ...(type === 'ai_call' && {
                    onConfigureAI: (nodeId) => {
                        setSelectedNode(null); // Close config panel/sidebar
                        openAIConfig(nodeId); // Open AI modal at Editor level
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

    // Delete selected nodes (supports single and multi-selection)
    const deleteSelectedNodes = useCallback(() => {
        // Get all node IDs to delete
        const nodeIdsToDelete = selectedNodes.length > 0
            ? selectedNodes.map(n => n.id)
            : selectedNode ? [selectedNode.id] : [];

        if (nodeIdsToDelete.length === 0) return;

        // Take snapshot BEFORE delete for undo
        takeSnapshot();

        // Calculate new nodes and edges BEFORE setting state
        const newNodes = nodes.filter(n => !nodeIdsToDelete.includes(n.id));
        const newEdges = edges.filter(e =>
            !nodeIdsToDelete.includes(e.source) && !nodeIdsToDelete.includes(e.target)
        );

        // Update state
        setNodes(newNodes);
        setEdges(newEdges);

        // Clear browser memory/cache: reset recording tracking
        consecutiveActionsRef.current = [];
        setRecordedActions(prev => prev.filter(a => !nodeIdsToDelete.includes(a.nodeId)));
        setRecordedNodeCount(newNodes.length);

        // Save IMMEDIATELY (not debounced) to ensure persistence
        saveFlow(newNodes, newEdges, viewport);

        setSelectedNode(null);
        setSelectedNodes([]);
    }, [nodes, edges, selectedNode, selectedNodes, viewport, saveFlow, takeSnapshot]);

    // ===== Loop Operations Hook =====
    const { wrapSelectedNodesInLoop } = useLoopOperations({
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
    });

    // Clear all nodes from the workflow
    const handleClearAllNodes = useCallback(() => {
        if (nodes.length === 0) return;
        openModal('clearConfirm');
    }, [nodes.length]);

    const confirmClearAllNodes = useCallback(() => {
        // Clear all nodes and edges
        setNodes([]);
        setEdges([]);

        // Clear browser memory/cache
        consecutiveActionsRef.current = [];
        setRecordedActions([]);
        setRecordedNodeCount(0);

        // Save immediately
        saveFlow([], [], viewport);

        setSelectedNode(null);
        setSelectedNodes([]);
        closeModal('clearConfirm');
    }, [nodes.length, viewport, saveFlow]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl/Cmd+Z = Undo (without Shift)
            if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey && !editingName) {
                e.preventDefault();
                undo();
                return;
            }
            // Ctrl/Cmd+Shift+Z = Redo
            if (e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey && !editingName) {
                e.preventDefault();
                redo();
                return;
            }
            // Ctrl/Cmd+Y = Redo (alternative)
            if (e.key === 'y' && (e.metaKey || e.ctrlKey) && !editingName) {
                e.preventDefault();
                redo();
                return;
            }
            // Delete/Backspace to delete selected nodes
            // Skip if user is typing in an input, textarea, or contenteditable
            if ((e.key === 'Delete' || e.key === 'Backspace') && !editingName) {
                const activeElement = document.activeElement;
                const isTyping = activeElement && (
                    activeElement.tagName === 'INPUT' ||
                    activeElement.tagName === 'TEXTAREA' ||
                    activeElement.isContentEditable ||
                    activeElement.closest('[contenteditable="true"]')
                );
                if (isTyping) return; // Don't delete nodes when typing in inputs

                const hasSelection = selectedNode || selectedNodes.length > 0;
                if (hasSelection) {
                    e.preventDefault();
                    deleteSelectedNodes();
                }
            }
            // Cmd/Ctrl+S to save
            if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleManualSave();
            }
            // Cmd/Ctrl+A to select all nodes
            if (e.key === 'a' && (e.metaKey || e.ctrlKey) && !editingName) {
                e.preventDefault();
                setSelectedNodes(nodes);
            }
            // Cmd/Ctrl+L to wrap selected nodes in Loop
            if (e.key === 'l' && (e.metaKey || e.ctrlKey) && !editingName && selectedNodes.length > 0) {
                e.preventDefault();
                wrapSelectedNodesInLoop();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNode, selectedNodes, editingName, deleteSelectedNodes, nodes, undo, redo, wrapSelectedNodesInLoop]);

    // Note: saveTimeoutRef cleanup is now handled by useFlowPersistence hook

    // Auto show log panel when execution starts
    useEffect(() => {
        if (isRunning && !showLogPanel) {
            setShowLogPanel(true);
        }
    }, [isRunning]);

    // Close device selector when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modals.deviceSelector.isOpen && !e.target.closest('.device-selector-container')) {
                closeModal(MODAL_TYPES.DEVICE_SELECTOR);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [modals.deviceSelector.isOpen, closeModal, MODAL_TYPES]);

    // Node templates memoized - only regenerate when translation function changes
    const nodeTemplates = useMemo(() => getNodeTemplates(t), [t]);

    // Legacy HTML5 drag handler (keep for compatibility but not actively used)
    const onDragStart = (event, nodeType, nodeLabel, color) => {
        event.dataTransfer.setData('application/reactflow/type', nodeType);
        event.dataTransfer.setData('application/reactflow/label', nodeLabel);
        event.dataTransfer.setData('text/plain', nodeType);
        event.dataTransfer.effectAllowed = 'move';
        setDraggedNodeType({ type: nodeType, color });
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        event.dataTransfer.setDragImage(img, 0, 0);
    };

    // New mouse-based drop handler - called when user releases mouse on canvas
    const onMouseDropInCanvas = useCallback((dropData) => {
        if (!dropData?.type) return;

        // Convert client position to flow position
        const position = screenToFlowPosition({
            x: dropData.clientX,
            y: dropData.clientY,
        });

        // Find matching template for label
        const template = nodeTemplates.find(t => t.type === dropData.type);
        const label = template?.label || dropData.label || dropData.type;

        // Create new node
        const newNode = {
            id: `${dropData.type}_${Date.now()}`,
            type: dropData.type,
            position,
            data: {
                label,
                nodeId: `${dropData.type}_${Date.now()}`,
                actionType: dropData.type, // Required for SmartActionNode to display correct icon/color
            },
        };

        setNodes((nds) => [...nds, newNode]);
        setSelectedNode(newNode.id);

        // Reset drag state
        setDraggedNodeType(null);
        setIsDraggingOver(false);
    }, [screenToFlowPosition, nodeTemplates, setNodes, setSelectedNode]);

    // Note: NodeIcon and LogIcon are now imported from FlowIcons.jsx

    return (
        <MouseDragProvider onDropInCanvas={onMouseDropInCanvas} isDark={isDark}>
            <Head title={`${flowName} - Flow Editor`} />
            <div className={`h-screen flex flex-col transition-colors duration-300 ${themeClasses.bgPrimary}`}>
                {/* Top Toolbar */}
                <EditorToolbar
                    // Flow metadata
                    flow={flow}
                    flowName={flowName}
                    editingName={editingName}
                    setEditingName={setEditingName}
                    setFlowName={setFlowName}
                    handleUpdateName={handleUpdateName}
                    handleManualSave={handleManualSave}
                    saving={saving}
                    lastSaved={lastSaved}

                    // Device state
                    selectedDevice={selectedDevice}
                    setSelectedDevice={setSelectedDevice}
                    devices={devices}
                    isPinging={isPinging}
                    pingError={pingError}

                    // Modal controls
                    modals={modals}
                    openModal={openModal}
                    closeModal={closeModal}

                    // Execution state
                    isRunning={isRunning}
                    isPaused={isPaused}
                    isCompleted={isCompleted}
                    hasError={hasError}
                    testRunning={testRunning}
                    setTestRunning={setTestRunning}
                    nodes={nodes}
                    setNodes={setNodes}

                    // Execution actions
                    startExecution={startExecution}
                    pauseExecution={pauseExecution}
                    stopExecution={stopExecution}
                    resumeExecution={resumeExecution}
                    resetExecution={resetExecution}

                    // Toast
                    addToast={addToast}
                />

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 flex overflow-hidden">
                        {/* Left Sidebar - Node Palette */}
                        <NodeSidebar
                            showSidebar={showSidebar}
                            sidebarExpanded={sidebarExpanded}
                            setSidebarExpanded={setSidebarExpanded}
                            nodeTemplates={nodeTemplates}
                            onDragStart={onDragStart}
                        />

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
                                    className={`absolute left-4 top-4 z-10 w-10 h-10 border rounded-xl flex items-center justify-center transition-all shadow-lg ${themeClasses.panel} ${themeClasses.textTertiary} ${isDark ? 'hover:text-white' : 'hover:text-gray-700'} ${themeClasses.panelHover}`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                    </svg>
                                </button>
                            )}

                            {/* Drop indicator */}
                            {isDraggingOver && (
                                <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-indigo-500/5">
                                    <div className={`px-6 py-4 border-2 border-dashed border-indigo-500 rounded-2xl text-indigo-500 font-semibold text-sm shadow-2xl ${themeClasses.bgSecondary}`}>
                                        Drop to add node
                                    </div>
                                </div>
                            )}

                            {/* Recording Panel - Floating overlay */}
                            <RecordingPanel
                                isRecording={isRecording}
                                showRecordingPanel={showRecordingPanel}
                                setShowRecordingPanel={setShowRecordingPanel}
                                isRecordingPaused={isRecordingPaused}
                                recordingDuration={recordingDuration}
                                recordedActions={recordedActions}
                                recordedNodeCount={recordedNodeCount}
                                selectedDevice={selectedDevice}
                                togglePauseRecording={togglePauseRecording}
                                undoLastAction={undoLastAction}
                                stopRecording={stopRecording}
                                formatDuration={formatDuration}
                            />

                            <ReactFlow
                                nodes={nodesWithExecution}
                                edges={edgesWithExecution}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                onMoveEnd={onMoveEnd}
                                onNodeClick={onNodeClick}
                                onPaneClick={onPaneClick}
                                onSelectionChange={onSelectionChange}
                                nodeTypes={nodeTypes}
                                edgeTypes={edgeTypes}
                                defaultEdgeOptions={defaultEdgeOptions}
                                defaultViewport={viewport}
                                connectionLineType={ConnectionLineType.SmoothStep}
                                connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
                                fitView={nodes.length === 0}
                                snapToGrid={true}
                                snapGrid={[20, 20]}
                                selectionOnDrag={true}
                                selectionMode="partial"
                                multiSelectionKeyCode="Shift"
                                deleteKeyCode={null} /* Disable default delete - handled manually to avoid deleting nodes when typing in inputs */
                                proOptions={{ hideAttribution: true }}
                                className="transition-colors duration-300"
                                style={{ background: reactFlowTheme.background }}
                            >
                                <Background
                                    variant={BackgroundVariant.Dots}
                                    gap={20}
                                    size={1}
                                    color={reactFlowTheme.backgroundDots}
                                />

                                {/* Custom Controls */}
                                <CanvasControls
                                    undo={undo}
                                    redo={redo}
                                    canUndo={canUndo}
                                    canRedo={canRedo}
                                    zoomIn={zoomIn}
                                    zoomOut={zoomOut}
                                    fitView={fitView}
                                />



                                {/* Multi-Selection Floating Toolbar */}
                                <MultiSelectionToolbar
                                    selectedNodes={selectedNodes}
                                    wrapSelectedNodesInLoop={wrapSelectedNodesInLoop}
                                    deleteSelectedNodes={deleteSelectedNodes}
                                    clearSelection={() => setSelectedNodes([])}
                                />
                                {/* Mini Map */}
                                <Panel position="bottom-right" className="!m-4">
                                    <div className={`rounded-xl overflow-hidden shadow-xl border ${themeClasses.panel}`}>
                                        <MiniMap
                                            nodeColor={(node) => {
                                                const state = nodeStates[node.id]?.status;
                                                if (state === NodeStatus.RUNNING) return '#6366f1';
                                                if (state === NodeStatus.SUCCESS) return '#10b981';
                                                if (state === NodeStatus.ERROR) return '#ef4444';
                                                const colors = { input: '#10b981', output: '#ef4444', process: '#3b82f6', custom: '#8b5cf6' };
                                                return colors[node.type] || '#6366f1';
                                            }}
                                            maskColor={reactFlowTheme.miniMapMask}
                                            style={{ width: 180, height: 120, background: reactFlowTheme.miniMapBg }}
                                            className={`!border-none ${themeClasses.bgMuted}`}
                                        />
                                    </div>
                                </Panel>

                                {/* Empty State */}
                                {nodes.length === 0 && (
                                    <Panel position="top-center" className="!m-0 !top-1/2 !-translate-y-1/2">
                                        <div className="text-center">
                                            <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center border ${themeClasses.panel}`}>
                                                <svg className={`w-10 h-10 ${themeClasses.textTertiary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                            </div>
                                            <h3 className={`text-xl font-bold mb-2 ${themeClasses.textPrimary}`}>{t('flows.editor.sidebar.start_building')}</h3>
                                            <p className={`text-sm max-w-xs ${themeClasses.textTertiary}`}>
                                                {t('flows.editor.sidebar.start_building_desc')}
                                            </p>
                                        </div>
                                    </Panel>
                                )}
                            </ReactFlow>
                        </div>

                        {/* Edge Delay Popover */}
                        <EdgeDelayPopover
                            isOpen={modals.edgeDelay.isOpen}
                            onClose={() => closeModal('edgeDelay')}
                            onSave={handleEdgeDelayUpdate}
                            position={modals.edgeDelay.position || { x: 0, y: 0 }}
                            isDark={isDark}
                            initialDelay={modals.edgeDelay.edge?.data?.delay || { mode: 'none', fixedMs: 500, minMs: 500, maxMs: 1500 }}
                        />

                        {/* Right Panel - Node Properties */}
                        <NodePropertiesPanel
                            selectedNode={selectedNode}
                            setSelectedNode={setSelectedNode}
                            setNodes={setNodes}
                            deleteSelectedNodes={deleteSelectedNodes}
                        />
                    </div>

                    {/* Execution Log Panel */}
                    <ExecutionLogPanel
                        showLogPanel={showLogPanel}
                        setShowLogPanel={setShowLogPanel}
                        executionLog={executionLog}
                    />
                </div>
            </div>
            {/* Media Picker Modal */}
            <MediaPickerModal
                isOpen={modals.mediaPicker.isOpen}
                onClose={() => closeModal(MODAL_TYPES.MEDIA_PICKER)}
                onSelect={handleMediaFileSelected}
                onSelectFolder={handleMediaFolderSelected}
                allowFolderSelection={true}
                mediaFiles={mediaFiles}
                fileType="any"
            />

            <CollectionPickerModal
                isOpen={modals.collectionPicker.isOpen}
                onClose={() => closeModal(MODAL_TYPES.COLLECTION_PICKER)}
                onSelect={handleCollectionSelected}
                collections={collections}
            />

            {selectedNode && (
                <NodeConfigPanel
                    node={selectedNode}
                    onUpdateNode={handleUpdateNode}
                    onClose={() => setSelectedNode(null)}
                    upstreamVariables={[]}
                    loopContext={null}
                    selectedDevice={selectedDevice}
                    userId={props.auth?.user?.id}
                    dataSourceNodes={nodes.filter(n => n.type === 'data_source' && n.data?.collectionId)}
                    deviceApps={deviceApps}
                    deviceAppsLoading={deviceAppsLoading}
                    onRequestDeviceApps={requestDeviceApps}
                />
            )}

            {/* Live Recording Panel - Real-time sync from Android APK */}
            {auth?.user?.id && (
                <Suspense fallback={<ModalLoader />}>
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
                </Suspense>
            )}

            {/* Loop Sub-Flow Editor Modal - Lazy loaded */}
            {modals.loopSubFlow.isOpen && (
                <Suspense fallback={<ModalLoader />}>
                    <LoopSubFlowModal
                        isOpen={modals.loopSubFlow.isOpen}
                        onClose={() => closeModal('loopSubFlow')}
                        loopNode={nodes.find(n => n.id === modals.loopSubFlow.nodeId)}
                        onSaveSubFlow={(nodeId, subFlow) => {
                            setNodes(prev => prev.map(node =>
                                node.id === nodeId
                                    ? { ...node, data: { ...node.data, subFlow } }
                                    : node
                            ));
                            debouncedSave(nodes, edges, viewport);
                        }}
                        selectedDevice={selectedDevice}
                        userId={props.auth?.user?.id}
                    />
                </Suspense>
            )}

            {/* AI Config Modal - Lazy loaded */}
            {modals.aiConfig.isOpen && (
                <Suspense fallback={<ModalLoader />}>
                    <AINodeConfigModal
                        isOpen={modals.aiConfig.isOpen}
                        onClose={() => closeModal(MODAL_TYPES.AI_CONFIG)}
                        nodeData={nodes.find(n => n.id === modals.aiConfig.nodeId)?.data || {}}
                        onSave={(newConfig) => {
                            const nodeId = modals.aiConfig.nodeId;
                            setNodes(prev => prev.map(node =>
                                node.id === nodeId
                                    ? { ...node, data: { ...node.data, ...newConfig } }
                                    : node
                            ));
                            closeModal(MODAL_TYPES.AI_CONFIG);
                            debouncedSave(nodes, edges, viewport);
                        }}
                    />
                </Suspense>
            )}

            {/* Workflow Preview Modal - Lazy loaded */}
            {modals.preview.isOpen && (
                <Suspense fallback={<ModalLoader />}>
                    <WorkflowPreviewModal
                        isOpen={modals.preview.isOpen}
                        onClose={() => closeModal('preview')}
                        nodes={nodes}
                        workflowName={flowName}
                    />
                </Suspense>
            )}

            {/* Debug Panel for APK Events */}
            <DebugEventPanel
                events={debugEvents}
                isOpen={showDebugPanel}
                onToggle={() => setShowDebugPanel(!showDebugPanel)}
                onClose={() => setShowDebugPanel(false)}
                onClear={clearDebugEvents}
                hasConfigPanel={!!selectedNode}
            />

            {/* Clear All Confirmation Modal */}
            <ClearConfirmModal
                isOpen={modals.clearConfirm.isOpen}
                onClose={() => closeModal('clearConfirm')}
                onConfirm={confirmClearAllNodes}
                nodeCount={nodes.length}
            />
        </MouseDragProvider>
    );
}

export default function Editor({ flow, mediaFiles, dataCollections }) {
    return (
        <ReactFlowProvider>
            <FlowEditor flow={flow} mediaFiles={mediaFiles} dataCollections={dataCollections} />
        </ReactFlowProvider>
    );
}
