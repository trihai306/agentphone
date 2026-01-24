import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage } from '@/i18n';
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
import LanguageSwitcher from '@/Components/LanguageSwitcher';
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

// Helper functions
import {
    generateSmartLabel,
    getAppNameFromPackage as getAppName,
    truncateText
} from '@/helpers/flow/nodeLabels';
import {
    getNodeTypeFromEvent,
    generateNodeId,
    calculateNodePosition
} from '@/helpers/flow/nodeTypes';
import {
    normalizeEventType,
    isLoopableEventType,
    detectLoop,
    LOOP_EXCLUDED_TYPES
} from '@/helpers/flow/loopDetection';
import {
    normalizeEventData,
    extractCoordinates,
    calculateBoundsCenter
} from '@/helpers/flow/eventNormalization';

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
import SmartActionNode from '../../Components/Flow/SmartActionNode';
import ElementCheckNode from '../../Components/Flow/ElementCheckNode';
import WaitForElementNode from '../../Components/Flow/WaitForElementNode';
import LoopSubFlowModal from '../../Components/Flow/LoopSubFlowModal';
import QuickAddMenu from '../../Components/Flow/QuickAddMenu';
import LiveRecordingPanel from '../../Components/Flow/LiveRecordingPanel';
import ImportRecordingModal from '../../Components/Flow/ImportRecordingModal';
import WorkflowPreviewModal from '../../Components/Flow/WorkflowPreviewModal';
import EdgeDelayPopover from '../../Components/Flow/EdgeDelayPopover';
import { NodeIcon, LogIcon } from '../../Components/Flow/FlowIcons';
import DeviceSelectorDropdown from '../../Components/Flow/DeviceSelectorDropdown';

const nodeTypes = {
    // Control Flow
    custom: CustomNode,
    input: InputNode,
    output: OutputNode,
    process: ProcessNode,
    action: CustomNode,

    // Recorded Actions - Smart Professional Nodes
    recorded_action: SmartActionNode,
    smart_action: SmartActionNode,
    open_app: SmartActionNode,
    click: SmartActionNode,
    tap: SmartActionNode,
    long_tap: SmartActionNode,       // Long press/tap from APK
    long_press: SmartActionNode,
    double_tap: SmartActionNode,     // Double tap detection
    text_input: SmartActionNode,
    scroll: SmartActionNode,
    scroll_up: SmartActionNode,      // Direction-specific scroll from APK
    scroll_down: SmartActionNode,
    scroll_left: SmartActionNode,
    scroll_right: SmartActionNode,
    swipe: SmartActionNode,
    swipe_left: SmartActionNode,     // Direction-specific swipe
    swipe_right: SmartActionNode,
    swipe_up: SmartActionNode,
    swipe_down: SmartActionNode,
    key_event: SmartActionNode,
    repeat_click: SmartActionNode,  // Repeat click action
    focus: SmartActionNode,
    back: SmartActionNode,
    home: SmartActionNode,

    // Logic/Conditions - Premium Glass versions
    condition: GlassConditionNode,
    loop: GlassLoopNode,
    loopStart: SmartActionNode,  // Used in LoopSubFlowModal
    loopEnd: SmartActionNode,    // Used in LoopSubFlowModal
    wait: WaitNode,
    assert: AssertNode,
    element_check: ElementCheckNode,      // Check element exists/text/visible
    wait_for_element: WaitForElementNode, // Wait for element with timeout

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
    const { auth } = props; // Get auth for socket channel subscription
    const collections = props.dataCollections || dataCollections;

    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { addToast } = useToast();
    const { t } = useTranslation();

    // ===== Phase 2 Custom Hooks =====
    // Device management
    const { selectedDevice, onlineDevices, setSelectedDevice, setOnlineDevices } = useDeviceManager(props.onlineDevices || [], auth);

    // Device apps (Phase 1)
    const { apps: deviceApps, appsLoading: deviceAppsLoading, requestApps: requestDeviceApps } = useDeviceApps(auth?.user?.id);

    // Modal management
    const modalManager = useModalManager();
    const { modals, openModal, closeModal, openMediaPicker, openCollectionPicker, openLoopSubFlow, openEdgeDelay, MODAL_TYPES } = modalManager;

    // Debug panel
    const { debugEvents, showDebugPanel, setShowDebugPanel, addDebugEvent, toggleDebugPanel } = useDebugPanel();

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
        if (!auth?.user?.id) return;

        const channel = window.Echo?.private(`user.${auth.user.id}`);
        if (!channel) return;

        const handleActionProgress = (event) => {
            // Only update if this event is for the current flow
            if (event.flow_id !== flow?.id) return;

            // Map action_id to node_id (action_id format: "node_<nodeId>_action_<index>")
            const actionId = event.action_id;
            const nodeIdMatch = actionId?.match(/^node_([^_]+)/);
            const nodeId = nodeIdMatch ? nodeIdMatch[1] : null;

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

    // Listen for real-time recording events from APK via socket
    // When APK captures an action during recording, it broadcasts to the device channel
    useEffect(() => {
        if (!selectedDevice?.device_id || !isRecording) return;
        if (!window.Echo) {
            console.warn('[Recording] Echo not available for recording events');
            return;
        }

        const deviceChannel = window.Echo.private(`device.${selectedDevice.device_id}`);
        if (!deviceChannel) return;

        console.log('[Recording] 🎯 Subscribed to device channel for recording events:', selectedDevice.device_id);

        // Handle recording action captured event from APK
        const handleEventCaptured = (event) => {
            console.log('[Recording] 📥 Received event.captured:', event);

            // Skip if recording is paused
            if (isRecordingPaused) {
                console.log('[Recording] Skipping event - recording paused');
                return;
            }

            // Add to debug panel
            setDebugEvents(prev => [...prev.slice(-50), { ...event, receivedAt: new Date().toISOString() }]);

            // Extract event data
            const eventData = event.event || event;
            const nodeSuggestion = event.node_suggestion || {
                data: {
                    label: eventData.event_type,
                    color: 'blue'
                }
            };

            // Create node from event
            if (typeof createNodeFromEvent === 'function') {
                createNodeFromEvent(eventData, nodeSuggestion);
            }
        };

        // Listen for event.captured (from RecordingActionCaptured event)
        deviceChannel.listen('.event.captured', handleEventCaptured);

        return () => {
            console.log('[Recording] 🔌 Unsubscribed from device channel:', selectedDevice.device_id);
            deviceChannel.stopListening('.event.captured', handleEventCaptured);
        };
    }, [selectedDevice?.device_id, isRecording, isRecordingPaused, createNodeFromEvent]);

    // Listen for recording events from selected device via Echo
    useEffect(() => {
        // Only listen when a device is selected
        if (!selectedDevice) return;

        // Helper function to register listener on backend
        const registerListener = async () => {
            try {
                await recordingApi.registerListener({
                    deviceId: selectedDevice.device_id,
                    flowId: flow.id,
                    userId: props.auth?.user?.id,
                });
            } catch (error) {
                console.warn('Failed to register workflow listener:', error);
            }
        };

        // Helper function to unregister listener on backend
        const unregisterListener = async () => {
            try {
                await recordingApi.unregisterListener(selectedDevice.device_id);
            } catch (error) {
                console.warn('Failed to unregister workflow listener:', error);
            }
        };

        try {
            if (typeof window !== 'undefined' && window.Echo && props.auth?.user?.id) {
                // Listen to device-specific channel
                const channelName = `device.${selectedDevice.device_id}`;
                const channel = window.Echo.private(channelName);

                // Register listener on backend so APK knows Editor is listening
                registerListener();

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

                    createNodeFromEvent(openAppEvent, openAppSuggestion);

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

                    // Store raw event for debug panel (limit to last 20 events)
                    setDebugEvents(prev => [...prev.slice(-19), {
                        id: Date.now(),
                        receivedAt: new Date().toISOString(),
                        raw: e.event,
                        suggestion: e.node_suggestion
                    }]);

                    createNodeFromEvent(e.event, e.node_suggestion);
                });

                return () => {
                    try {
                        // Unregister listener on backend when leaving
                        unregisterListener();

                        channel.stopListening('.recording.started');
                        channel.stopListening('.recording.stopped');
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
    }, [selectedDevice, props.auth, createNodeFromEvent, flow.id]);

    // Listen for device status changes (accessibility, etc.) via user channel
    useEffect(() => {
        if (!props.auth?.user?.id) return;

        try {
            if (typeof window !== 'undefined' && window.Echo) {
                const userChannel = window.Echo.private(`user.${props.auth.user.id}`);

                // Listen for device accessibility status changes
                userChannel.listen('.device.accessibility.changed', (event) => {


                    // Update onlineDevices list (for dropdown display)
                    setOnlineDevices(prev => prev.map(d =>
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

    // Handler for media file selection
    const handleMediaFileSelected = (file) => {
        setNodes(nds => nds.map(node =>
            node.id === mediaPickerNodeId
                ? {
                    ...node, data: {
                        ...node.data,
                        selectionType: 'file',
                        fileName: file.original_name,
                        filePath: file.url,
                        fileSize: file.formatted_size,
                        fileType: file.type,
                        fileId: file.id,
                        // Clear folder data when selecting file
                        folderName: null,
                        folderPath: null,
                    }
                }
                : node
        ));
        closeModal('mediaPicker');
    };

    // Handler for media folder selection (random file from folder)
    const handleMediaFolderSelected = (folder) => {
        setNodes(nds => nds.map(node =>
            node.id === mediaPickerNodeId
                ? {
                    ...node, data: {
                        ...node.data,
                        selectionType: 'folder',
                        folderName: folder.name,
                        folderPath: folder.path,
                        // Clear file data when selecting folder
                        fileName: null,
                        filePath: null,
                        fileSize: null,
                        fileType: null,
                        fileId: null,
                    }
                }
                : node
        ));
        closeModal('mediaPicker');
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
        closeModal('collectionPicker');
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

    const nodeTemplates = [
        // Recorded Actions
        { type: 'open_app', label: t('flows.editor.nodes.open_app', 'Open App'), icon: 'app', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', description: t('flows.editor.nodes.open_app_desc', 'Launch an app'), category: 'action' },
        { type: 'click', label: t('flows.editor.nodes.click'), icon: 'cursor', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', description: t('flows.editor.nodes.click_desc', 'Tap on element'), category: 'action' },
        { type: 'text_input', label: t('flows.editor.nodes.type_text'), icon: 'keyboard', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.15)', description: t('flows.editor.nodes.type_text_desc', 'Input text'), category: 'action' },
        { type: 'scroll', label: t('flows.editor.nodes.scroll'), icon: 'scroll', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', description: t('flows.editor.nodes.scroll_desc', 'Scroll view'), category: 'action' },
        { type: 'swipe', label: t('flows.editor.nodes.swipe'), icon: 'swipe', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.15)', description: t('flows.editor.nodes.swipe_desc', 'Swipe gesture'), category: 'action' },
        { type: 'key_event', label: t('flows.editor.nodes.key_press'), icon: 'phone', color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.15)', description: t('flows.editor.nodes.key_press_desc', 'Back/Home key'), category: 'action' },
        { type: 'repeat_click', label: t('flows.editor.nodes.repeat_click', 'Repeat Click'), icon: 'repeat', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)', description: t('flows.editor.nodes.repeat_click_desc', 'Click multiple times'), category: 'action' },

        // Logic/Conditions
        { type: 'condition', label: t('flows.editor.nodes.condition'), icon: 'branch', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)', description: t('flows.editor.nodes.condition_desc', 'If/Else branch'), category: 'logic' },
        { type: 'wait', label: t('flows.editor.nodes.wait'), icon: 'clock', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)', description: t('flows.editor.nodes.wait_desc', 'Delay execution'), category: 'logic' },
        { type: 'loop', label: t('flows.editor.nodes.loop'), icon: 'loop', color: '#14b8a6', bgColor: 'rgba(20, 184, 166, 0.15)', description: t('flows.editor.nodes.loop_desc', 'Repeat actions'), category: 'logic' },
        { type: 'assert', label: t('flows.editor.nodes.assert'), icon: 'check', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)', description: t('flows.editor.nodes.assert_desc', 'Verify element'), category: 'logic' },

        // Resources
        { type: 'file_input', label: t('flows.editor.nodes.file_upload'), icon: 'upload', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.15)', description: t('flows.editor.nodes.file_upload_desc', 'Upload files/images'), category: 'resource' },
        { type: 'data_source', label: t('flows.editor.nodes.data_source'), icon: 'database', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', description: t('flows.editor.nodes.data_source_desc', 'Connect test data'), category: 'resource' },
        { type: 'ai_process', label: t('flows.editor.nodes.ai_process'), icon: 'sparkles', color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.15)', description: t('flows.editor.nodes.ai_process_desc', 'AI integration'), category: 'resource' },
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

    // Note: NodeIcon and LogIcon are now imported from FlowIcons.jsx

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
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? 'bg-white' : 'bg-gray-900'}`}>
                                <svg className={`w-5 h-5 ${isDark ? 'text-black' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                    {/* Right - Actions (compact layout) */}
                    <div className="flex items-center gap-1.5">
                        {/* Device Selector - Always show */}
                        {(
                            <>
                                <div className="relative device-selector-container">
                                    {/* Enhanced Toolbar Button */}
                                    <button
                                        onClick={async () => {
                                            if (modals.deviceSelector.isOpen) {
                                                closeModal(MODAL_TYPES.DEVICE_SELECTOR);
                                            } else {
                                                openModal(MODAL_TYPES.DEVICE_SELECTOR);

                                                // Trigger accessibility check when opening selector
                                                if (selectedDevice?.device_id) {
                                                    try {
                                                        await deviceApi.checkAccessibility(selectedDevice.device_id);
                                                        console.log('🔍 Device selector: Accessibility check triggered for:', selectedDevice.device_id);
                                                    } catch (err) {
                                                        console.warn('⚠️ Device selector: Accessibility check failed:', err);
                                                    }
                                                }
                                            }
                                        }}
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
                                        aria-expanded={modals.deviceSelector.isOpen}
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

                                        <svg className={`w-3 h-3 transition-transform duration-200 ${modals.deviceSelector.isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Device Selector Dropdown */}
                                    <DeviceSelectorDropdown
                                        isOpen={modals.deviceSelector.isOpen}
                                        devices={onlineDevices}
                                        selectedDevice={selectedDevice}
                                        onSelect={setSelectedDevice}
                                        onDisconnect={() => setSelectedDevice(null)}
                                        onClose={() => closeModal('deviceSelector')}
                                        addToast={addToast}
                                    />
                                </div>

                                {/* Divider */}
                                <div className={`w-px h-5 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />
                            </>
                        )}

                        {/* Theme Toggle only */}
                        <ThemeToggle />

                        {/* Execution Controls */}
                        {!isRunning && !isPaused && (
                            <button
                                onClick={async () => {
                                    // If device selected, run on device
                                    if (selectedDevice) {
                                        setTestRunning(true);

                                        // Run the workflow directly (no accessibility check needed)
                                        try {
                                            console.log('🚀 Starting test-run...', {
                                                flowId: flow.id,
                                                deviceId: selectedDevice.id,
                                                deviceName: selectedDevice.name
                                            });
                                            // Set all action nodes to 'pending' state for visual feedback
                                            setNodes(currentNodes =>
                                                currentNodes.map(node => ({
                                                    ...node,
                                                    data: {
                                                        ...node.data,
                                                        executionState: ['start', 'end', 'input', 'output', 'condition'].includes(node.type)
                                                            ? node.data?.executionState
                                                            : 'pending',
                                                    }
                                                }))
                                            );

                                            const result = await flowApi.testRun(flow.id, {
                                                device_id: selectedDevice.id,
                                            });
                                            if (result.success) {
                                                addToast(t('flows.editor.run.success', { device: selectedDevice.name, count: result.data.data?.actions_count }), 'success');
                                            }
                                        } catch (error) {
                                            console.error('🚀 Test-run error:', error);
                                            addToast(t('flows.editor.run.failed', { error: error.message }), 'error');
                                        } finally {
                                            setTestRunning(false);
                                        }
                                    } else {
                                        // No device - run local simulation
                                        startExecution();
                                    }
                                }}
                                disabled={nodes.length === 0 || testRunning}
                                className={`h-8 px-2.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                            >
                                {testRunning ? (
                                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                    </svg>
                                )}
                                <span className="hidden sm:inline">{selectedDevice ? `${selectedDevice.name.substring(0, 8)}` : 'Run'}</span>
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
                                    {t('flows.editor.toolbar.stop')}
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
                                    {t('flows.editor.toolbar.resume')}
                                </button>
                                <button
                                    onClick={stopExecution}
                                    className="h-9 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 border border-red-500/30"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                    </svg>
                                    {t('flows.editor.toolbar.stop')}
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
                                {t('flows.editor.toolbar.reset')}
                            </button>
                        )}

                        {/* Preview Button */}
                        <button
                            onClick={() => openModal('preview')}
                            disabled={nodes.filter(n => n.data?.screenshotUrl).length === 0}
                            className={`h-8 px-2.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 border ${nodes.filter(n => n.data?.screenshotUrl).length > 0
                                ? isDark
                                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20'
                                    : 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100'
                                : isDark
                                    ? 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-600 cursor-not-allowed'
                                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            title="Preview recorded workflow as slideshow"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="hidden sm:inline">{t('flows.editor.toolbar.preview')}</span>
                        </button>

                        {/* Divider */}
                        <div className={`w-px h-5 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />

                        {/* Save Button with status indicator */}
                        <button
                            onClick={handleManualSave}
                            disabled={saving}
                            className={`h-8 px-3 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 border ${saving
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                : lastSaved
                                    ? isDark
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                        : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                    : isDark
                                        ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 border-[#2a2a2a]'
                                        : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                                }`}
                            title={saving ? 'Saving...' : lastSaved ? 'Saved' : 'Save workflow'}
                        >
                            {saving ? (
                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : lastSaved ? (
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                            )}
                            <span className="hidden sm:inline">{saving ? t('flows.editor.toolbar.saving') : lastSaved ? t('flows.editor.toolbar.saved') : t('flows.editor.toolbar.save')}</span>
                        </button>

                        {/* Deploy Button - compact */}
                        <button className={`h-8 px-2.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="hidden sm:inline">{t('flows.editor.toolbar.deploy')}</span>
                        </button>

                        {/* Language Switcher */}
                        <div className="relative">
                            <button
                                onClick={() => modals.langDropdown.isOpen ? closeModal('langDropdown') : openModal('langDropdown')}
                                className={`h-8 px-2 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 border ${isDark
                                    ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 border-[#2a2a2a] hover:border-[#3a3a3a]'
                                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                                    }`}
                                title="Change Language"
                            >
                                <span className="text-sm">{getCurrentLanguage() === 'vi' ? '🇻🇳' : '🇺🇸'}</span>
                                <span className="hidden sm:inline uppercase">{getCurrentLanguage()}</span>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Language Dropdown */}
                            {modals.langDropdown.isOpen && (
                                <div className={`absolute top-full right-0 mt-1 w-32 rounded-lg shadow-xl border overflow-hidden z-50 ${isDark
                                    ? 'bg-[#1a1a1a] border-[#2a2a2a]'
                                    : 'bg-white border-gray-200'
                                    }`}>
                                    <button
                                        onClick={() => {
                                            changeLanguage('vi');
                                            closeModal('langDropdown');
                                        }}
                                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${getCurrentLanguage() === 'vi'
                                            ? isDark
                                                ? 'bg-cyan-500/20 text-cyan-400'
                                                : 'bg-cyan-50 text-cyan-600'
                                            : isDark
                                                ? 'hover:bg-[#252525] text-gray-300'
                                                : 'hover:bg-gray-50 text-gray-700'
                                            }`}
                                    >
                                        <span>🇻🇳</span>
                                        <span>Tiếng Việt</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            changeLanguage('en');
                                            closeModal('langDropdown');
                                        }}
                                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${getCurrentLanguage() === 'en'
                                            ? isDark
                                                ? 'bg-cyan-500/20 text-cyan-400'
                                                : 'bg-cyan-50 text-cyan-600'
                                            : isDark
                                                ? 'hover:bg-[#252525] text-gray-300'
                                                : 'hover:bg-gray-50 text-gray-700'
                                            }`}
                                    >
                                        <span>🇺🇸</span>
                                        <span>English</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 flex overflow-hidden">
                        {/* Left Sidebar - Compact Collapsible */}
                        <div className={`${showSidebar ? (sidebarExpanded ? 'w-64' : 'w-14') : 'w-0'} flex flex-col overflow-hidden transition-all duration-300 border-r ${isDark ? 'bg-[#0f0f0f] border-[#1e1e1e]' : 'bg-white border-gray-200'}`}>
                            {/* Sidebar Header */}
                            <div className={`h-12 px-2 flex items-center ${sidebarExpanded ? 'justify-between' : 'justify-center'} flex-shrink-0 border-b ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                                {sidebarExpanded && (
                                    <span className={`text-sm font-semibold pl-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('flows.editor.toolbar.nodes_title')}</span>
                                )}
                                <button
                                    onClick={() => setSidebarExpanded(!sidebarExpanded)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isDark ? 'hover:bg-[#1a1a1a] text-gray-500 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'}`}
                                    title={sidebarExpanded ? 'Collapse' : 'Expand'}
                                >
                                    <svg className={`w-4 h-4 transition-transform duration-200 ${sidebarExpanded ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Search Filter - Only show when expanded */}
                            {sidebarExpanded && (
                                <div className={`px-2 py-2 border-b ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                                    <div className="relative">
                                        <svg className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <input
                                            type="text"
                                            placeholder={t('flows.editor.sidebar.search_placeholder')}
                                            className={`w-full pl-8 pr-2 py-1.5 text-xs rounded-md border transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#252525] text-white placeholder-gray-500 focus:border-indigo-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'} focus:outline-none`}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Node List with Categories - Compact Mode */}
                            <div className="flex-1 overflow-y-auto flow-editor-sidebar" style={{ scrollBehavior: 'smooth' }}>

                                {/* Recorded Actions Category */}
                                <div className={`border-b ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                                    {sidebarExpanded && (
                                        <div className={`px-2 py-2 sticky top-0 z-10 backdrop-blur-sm ${isDark ? 'bg-[#0f0f0f]/90' : 'bg-white/90'}`}>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('flows.editor.categories.recorded_actions')}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className={`${sidebarExpanded ? 'px-2 pb-2 space-y-1' : 'p-1 space-y-1'}`}>
                                        {nodeTemplates.filter(t => t.category === 'action').map((template) => (
                                            <div
                                                key={template.type}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, template.type, template.label, template.color)}
                                                className={`group relative flex items-center ${sidebarExpanded ? 'gap-2 p-2' : 'justify-center p-1.5'} rounded-lg cursor-grab active:cursor-grabbing border transition-all duration-200 hover:scale-[1.02] ${isDark ? 'bg-[#1a1a1a] hover:bg-[#1e1e1e] border-[#252525] hover:border-[#333]' : 'bg-gray-50 hover:bg-white border-gray-200 hover:border-gray-300'}`}
                                                title={!sidebarExpanded ? template.label : undefined}
                                            >
                                                <div
                                                    className={`${sidebarExpanded ? 'w-7 h-7' : 'w-8 h-8'} rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110`}
                                                    style={{ backgroundColor: template.bgColor }}
                                                >
                                                    <NodeIcon icon={template.icon} color={template.color} />
                                                </div>
                                                {sidebarExpanded && (
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[11px] font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{template.label}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Logic/Conditions Category */}
                                <div className={`border-b ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                                    {sidebarExpanded && (
                                        <div className={`px-2 py-2 sticky top-0 z-10 backdrop-blur-sm ${isDark ? 'bg-[#0f0f0f]/90' : 'bg-white/90'}`}>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('flows.editor.categories.logic_control')}</span>
                                            </div>
                                        </div>
                                    )}
                                    {!sidebarExpanded && (
                                        <div className="flex justify-center py-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                        </div>
                                    )}
                                    <div className={`${sidebarExpanded ? 'px-2 pb-2 space-y-1' : 'p-1 space-y-1'}`}>
                                        {nodeTemplates.filter(t => t.category === 'logic').map((template) => (
                                            <div
                                                key={template.type}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, template.type, template.label, template.color)}
                                                className={`group relative flex items-center ${sidebarExpanded ? 'gap-2 p-2' : 'justify-center p-1.5'} rounded-lg cursor-grab active:cursor-grabbing border transition-all duration-200 hover:scale-[1.02] ${isDark ? 'bg-[#1a1a1a] hover:bg-[#1e1e1e] border-[#252525] hover:border-[#333]' : 'bg-gray-50 hover:bg-white border-gray-200 hover:border-gray-300'}`}
                                                title={!sidebarExpanded ? template.label : undefined}
                                            >
                                                <div
                                                    className={`${sidebarExpanded ? 'w-7 h-7' : 'w-8 h-8'} rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110`}
                                                    style={{ backgroundColor: template.bgColor }}
                                                >
                                                    <NodeIcon icon={template.icon} color={template.color} />
                                                </div>
                                                {sidebarExpanded && (
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[11px] font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{template.label}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Resources Category */}
                                <div className={`border-b ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                                    {sidebarExpanded && (
                                        <div className={`px-2 py-2 sticky top-0 z-10 backdrop-blur-sm ${isDark ? 'bg-[#0f0f0f]/90' : 'bg-white/90'}`}>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('flows.editor.categories.resources')}</span>
                                            </div>
                                        </div>
                                    )}
                                    {!sidebarExpanded && (
                                        <div className="flex justify-center py-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                        </div>
                                    )}
                                    <div className={`${sidebarExpanded ? 'px-2 pb-2 space-y-1' : 'p-1 space-y-1'}`}>
                                        {nodeTemplates.filter(t => t.category === 'resource').map((template) => (
                                            <div
                                                key={template.type}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, template.type, template.label, template.color)}
                                                className={`group relative flex items-center ${sidebarExpanded ? 'gap-2 p-2' : 'justify-center p-1.5'} rounded-lg cursor-grab active:cursor-grabbing border transition-all duration-200 hover:scale-[1.02] ${isDark ? 'bg-[#1a1a1a] hover:bg-[#1e1e1e] border-[#252525] hover:border-[#333]' : 'bg-gray-50 hover:bg-white border-gray-200 hover:border-gray-300'}`}
                                                title={!sidebarExpanded ? template.label : undefined}
                                            >
                                                <div
                                                    className={`${sidebarExpanded ? 'w-7 h-7' : 'w-8 h-8'} rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110`}
                                                    style={{ backgroundColor: template.bgColor }}
                                                >
                                                    <NodeIcon icon={template.icon} color={template.color} />
                                                </div>
                                                {sidebarExpanded && (
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[11px] font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{template.label}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>


                            </div>

                            {/* Sidebar Footer - Keyboard Shortcuts (only when expanded) */}
                            {sidebarExpanded && (
                                <div className={`p-2 border-t ${isDark ? 'border-[#1e1e1e] bg-[#0a0a0a]' : 'border-gray-200 bg-gray-50'}`}>
                                    <div className="space-y-1 text-[9px]">
                                        <div className={`flex items-center justify-between ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            <span>{t('flows.editor.sidebar.delete')}</span>
                                            <kbd className={`px-1 py-0.5 rounded font-mono border text-[8px] ${isDark ? 'bg-[#1a1a1a] text-gray-400 border-[#252525]' : 'bg-white text-gray-500 border-gray-200'}`}>Del</kbd>
                                        </div>
                                        <div className={`flex items-center justify-between ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            <span>{t('flows.editor.sidebar.save')}</span>
                                            <kbd className={`px-1 py-0.5 rounded font-mono border text-[8px] ${isDark ? 'bg-[#1a1a1a] text-gray-400 border-[#252525]' : 'bg-white text-gray-500 border-gray-200'}`}>⌘S</kbd>
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                        {/* Undo Button */}
                                        <button
                                            onClick={undo}
                                            disabled={!canUndo}
                                            className={`w-10 h-10 flex items-center justify-center transition-all ${canUndo
                                                ? isDark ? 'text-gray-400 hover:text-white hover:bg-[#252525]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                                                : isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
                                                }`}
                                            title="Undo (Ctrl+Z)"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                            </svg>
                                        </button>
                                        {/* Redo Button */}
                                        <button
                                            onClick={redo}
                                            disabled={!canRedo}
                                            className={`w-10 h-10 flex items-center justify-center transition-all ${canRedo
                                                ? isDark ? 'text-gray-400 hover:text-white hover:bg-[#252525]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                                                : isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
                                                }`}
                                            title="Redo (Ctrl+Shift+Z)"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                                            </svg>
                                        </button>
                                        <div className={`w-px h-6 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />
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



                                {/* Multi-Selection Floating Toolbar - Premium Design */}
                                {selectedNodes.length > 1 && (
                                    <Panel position="top-center" className="!m-4 !mt-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div
                                            className={`flex items-center gap-1.5 p-1.5 rounded-full shadow-2xl border backdrop-blur-xl ${isDark ? 'bg-[#0a0a0a]/95 border-[#2a2a2a]' : 'bg-white/95 border-gray-200/80'}`}
                                            style={{
                                                boxShadow: isDark
                                                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.05)'
                                                    : '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            {/* Selection Badge - Animated */}
                                            <div className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                                                <div className={`absolute inset-0 rounded-full ${isDark ? 'bg-purple-500/10' : 'bg-purple-200/50'} animate-pulse`} />
                                                <div className={`relative w-2 h-2 rounded-full ${isDark ? 'bg-purple-400' : 'bg-purple-500'}`}>
                                                    <div className={`absolute inset-0 rounded-full ${isDark ? 'bg-purple-400' : 'bg-purple-500'} animate-ping`} />
                                                </div>
                                                <span className={`relative text-xs font-bold tabular-nums ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                                                    {selectedNodes.length}
                                                </span>
                                            </div>

                                            {/* Primary Action: Wrap in Loop */}
                                            <button
                                                onClick={wrapSelectedNodesInLoop}
                                                className={`group relative flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${isDark
                                                    ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 text-white'
                                                    : 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 text-white'
                                                    }`}
                                                style={{
                                                    boxShadow: isDark
                                                        ? '0 4px 20px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
                                                        : '0 4px 20px rgba(139, 92, 246, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)'
                                                }}
                                                title="Wrap in Loop (⌘L)"
                                            >
                                                <svg className="w-4 h-4 transition-transform group-hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                <span>Loop</span>
                                            </button>

                                            {/* Divider */}
                                            <div className={`w-px h-6 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

                                            {/* Secondary Action: Delete */}
                                            <button
                                                onClick={deleteSelectedNodes}
                                                className={`group flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${isDark
                                                    ? 'hover:bg-red-500/20 text-gray-500 hover:text-red-400'
                                                    : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                                                    }`}
                                                title="Delete (⌫)"
                                            >
                                                <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>

                                            {/* Close/Deselect Button */}
                                            <button
                                                onClick={() => setSelectedNodes([])}
                                                className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${isDark
                                                    ? 'hover:bg-white/10 text-gray-600 hover:text-gray-300'
                                                    : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                                                    }`}
                                                title="Deselect all (Esc)"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </Panel>
                                )}
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
                                            <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-gray-100 border border-gray-200'}`}>
                                                <svg className={`w-10 h-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                            </div>
                                            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('flows.editor.sidebar.start_building')}</h3>
                                            <p className={`text-sm max-w-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
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

                                    {/* Screenshot Preview with Tap Indicator */}
                                    {selectedNode.data?.screenshotUrl && (
                                        <div>
                                            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Interaction Screenshot
                                            </label>
                                            <div className="relative w-full rounded-lg overflow-hidden border border-gray-500/20 cursor-pointer group"
                                                style={{ aspectRatio: '9/16' }}>
                                                <img
                                                    src={selectedNode.data.screenshotUrl}
                                                    alt="Action screenshot"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                />
                                                {/* Tap Position Indicator */}
                                                {selectedNode.data?.coordinates && (selectedNode.data.coordinates.x || selectedNode.data.coordinates.y) && (
                                                    <div
                                                        className="absolute w-6 h-6 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                                        style={{
                                                            left: `${(selectedNode.data.coordinates.x / 1080) * 100}%`,
                                                            top: `${(selectedNode.data.coordinates.y / 2400) * 100}%`,
                                                        }}
                                                    >
                                                        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
                                                        <div className="absolute inset-1 bg-red-500 rounded-full border-2 border-white shadow-lg" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                                                    <span className="text-white text-xs font-medium">Click to expand</span>
                                                </div>
                                            </div>
                                            {/* Coordinates display below image */}
                                            {selectedNode.data?.coordinates && (
                                                <div className={`flex justify-center gap-4 mt-2 text-[10px] font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    <span>X: {selectedNode.data.coordinates.x}</span>
                                                    <span>Y: {selectedNode.data.coordinates.y}</span>
                                                </div>
                                            )}
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
                                                            {typeof selectedNode.data.bounds === 'object' && selectedNode.data.bounds !== null
                                                                ? `${selectedNode.data.bounds.width ?? 0}×${selectedNode.data.bounds.height ?? 0} @ (${selectedNode.data.bounds.left ?? 0}, ${selectedNode.data.bounds.top ?? 0})`
                                                                : typeof selectedNode.data.bounds === 'string' ? selectedNode.data.bounds : 'N/A'}
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

                                                {/* Content Description - Important for accessibility-based replay */}
                                                {selectedNode.data?.contentDescription && (
                                                    <div className="mb-3">
                                                        <div className={`flex items-center gap-1.5 mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            <span className="text-[10px] font-semibold uppercase">Content Description</span>
                                                        </div>
                                                        <div className={`text-xs rounded-lg px-3 py-2 border break-all ${isDark ? 'text-green-300/90 bg-green-900/20 border-green-800/30' : 'text-green-700 bg-green-50 border-green-200'}`}>
                                                            "{selectedNode.data.contentDescription}"
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Input Text - For text_input actions */}
                                                {selectedNode.data?.inputText && (
                                                    <div className="mb-3">
                                                        <div className={`flex items-center gap-1.5 mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            <span className="text-[10px] font-semibold uppercase">Input Text</span>
                                                        </div>
                                                        <div className={`text-xs font-mono rounded-lg px-3 py-2 border ${isDark ? 'text-purple-300 bg-purple-900/20 border-purple-800/30' : 'text-purple-700 bg-purple-50 border-purple-200'}`}>
                                                            "{selectedNode.data.inputText}"
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Accessibility Flags */}
                                                {(selectedNode.data?.isClickable !== undefined ||
                                                    selectedNode.data?.isEditable !== undefined ||
                                                    selectedNode.data?.isScrollable !== undefined) && (
                                                        <div className="mb-3">
                                                            <div className={`flex items-center gap-1.5 mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                <span className="text-[10px] font-semibold uppercase">Element Flags</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {selectedNode.data?.isClickable && (
                                                                    <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                                                                        Clickable
                                                                    </span>
                                                                )}
                                                                {selectedNode.data?.isEditable && (
                                                                    <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                                                                        Editable
                                                                    </span>
                                                                )}
                                                                {selectedNode.data?.isScrollable && (
                                                                    <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                                                                        Scrollable
                                                                    </span>
                                                                )}
                                                                {!selectedNode.data?.isClickable && !selectedNode.data?.isEditable && !selectedNode.data?.isScrollable && (
                                                                    <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                                                        No special flags
                                                                    </span>
                                                                )}
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
                                        onClick={deleteSelectedNodes}
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

            {/* Node Configuration Panel */}
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

            {/* Loop Sub-Flow Editor Modal */}
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

            {/* Workflow Preview Modal */}
            <WorkflowPreviewModal
                isOpen={modals.preview.isOpen}
                onClose={() => closeModal('preview')}
                nodes={nodes}
                workflowName={flowName}
            />

            {/* Debug Panel for APK Events */}
            {showDebugPanel && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '300px',
                        background: 'rgba(15, 23, 42, 0.98)',
                        borderTop: '1px solid rgba(139, 92, 246, 0.3)',
                        zIndex: 1000,
                        overflow: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                    }}
                >
                    <div style={{
                        padding: '8px 16px',
                        background: 'rgba(139, 92, 246, 0.2)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1
                    }}>
                        <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>
                            🔍 APK Event Debug ({debugEvents.length} events)
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setDebugEvents([])}
                                style={{
                                    padding: '4px 8px',
                                    background: 'rgba(239, 68, 68, 0.3)',
                                    color: '#f87171',
                                    border: '1px solid rgba(239, 68, 68, 0.5)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '10px'
                                }}
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => setShowDebugPanel(false)}
                                style={{
                                    padding: '4px 8px',
                                    background: 'rgba(100, 116, 139, 0.3)',
                                    color: '#94a3b8',
                                    border: '1px solid rgba(100, 116, 139, 0.5)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '10px'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                    <div style={{ padding: '8px' }}>
                        {debugEvents.length === 0 && (
                            <div style={{
                                color: '#64748b',
                                textAlign: 'center',
                                padding: '40px',
                                fontStyle: 'italic'
                            }}>
                                Waiting for APK events... Start recording to see data here.
                            </div>
                        )}
                        {debugEvents.slice().reverse().map((event, idx) => (
                            <div
                                key={event.id}
                                style={{
                                    marginBottom: '12px',
                                    padding: '8px',
                                    background: 'rgba(30, 41, 59, 0.8)',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(71, 85, 105, 0.3)'
                                }}
                            >
                                <div style={{
                                    color: '#22c55e',
                                    fontWeight: 'bold',
                                    marginBottom: '4px'
                                }}>
                                    #{debugEvents.length - idx}: {event.raw?.event_type || 'unknown'}
                                    <span style={{ color: '#64748b', fontWeight: 'normal', marginLeft: '8px' }}>
                                        {event.receivedAt}
                                    </span>
                                </div>
                                <table style={{ width: '100%', color: '#e2e8f0' }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ color: '#f472b6', width: '120px' }}>package_name:</td>
                                            <td>{event.raw?.package_name || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#f472b6' }}>class_name:</td>
                                            <td style={{ wordBreak: 'break-all' }}>{event.raw?.class_name || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#60a5fa' }}>resource_id:</td>
                                            <td style={{
                                                wordBreak: 'break-all',
                                                color: event.raw?.resource_id ? '#4ade80' : '#64748b'
                                            }}>
                                                {event.raw?.resource_id || '(empty)'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#fbbf24' }}>text:</td>
                                            <td style={{
                                                color: event.raw?.text ? '#fde047' : '#64748b'
                                            }}>
                                                {event.raw?.text || '(empty)'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#c084fc' }}>content_desc:</td>
                                            <td>{event.raw?.content_description || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#2dd4bf' }}>bounds:</td>
                                            <td>{typeof event.raw?.bounds === 'object' && event.raw?.bounds ? `${event.raw.bounds.width ?? 0}×${event.raw.bounds.height ?? 0}` : (event.raw?.bounds || '-')}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#fb923c' }}>x, y:</td>
                                            <td>{event.raw?.x ?? '-'}, {event.raw?.y ?? '-'}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#94a3b8' }}>flags:</td>
                                            <td>
                                                {event.raw?.is_clickable && <span style={{ color: '#22c55e', marginRight: '4px' }}>clickable</span>}
                                                {event.raw?.is_editable && <span style={{ color: '#3b82f6', marginRight: '4px' }}>editable</span>}
                                                {event.raw?.is_scrollable && <span style={{ color: '#a855f7' }}>scrollable</span>}
                                            </td>
                                        </tr>
                                        {event.raw?.action_data && (
                                            <tr>
                                                <td style={{ color: '#e879f9' }}>action_data:</td>
                                                <td style={{ wordBreak: 'break-all' }}>
                                                    {JSON.stringify(event.raw.action_data)}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Debug Panel Toggle Button */}
            <button
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                style={{
                    position: 'fixed',
                    bottom: showDebugPanel ? '310px' : '10px',
                    right: selectedNode ? '340px' : '10px', // Move left when config panel is open
                    padding: '8px 12px',
                    background: showDebugPanel ? 'rgba(139, 92, 246, 0.8)' : 'rgba(30, 41, 59, 0.9)',
                    color: showDebugPanel ? '#fff' : '#a78bfa',
                    border: '1px solid rgba(139, 92, 246, 0.5)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    zIndex: 55, // Below config panel (z-60)
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    transition: 'right 0.3s ease'
                }}
            >
                🔍 Debug {debugEvents.length > 0 && `(${debugEvents.length})`}
            </button>

            {/* Clear All Confirmation Modal */}
            {modals.clearConfirm.isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => closeModal('clearConfirm')}
                    />
                    {/* Modal */}
                    <div className={`relative z-10 w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
                        {/* Header */}
                        <div className={`px-6 py-4 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Clear All Nodes</h3>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>This action cannot be undone</p>
                                </div>
                            </div>
                        </div>
                        {/* Content */}
                        <div className="px-6 py-4">
                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                Are you sure you want to delete <span className="font-bold text-red-500">{nodes.length}</span> node{nodes.length !== 1 ? 's' : ''}?
                                All workflow data will be permanently removed.
                            </p>
                        </div>
                        {/* Actions */}
                        <div className={`px-6 py-4 flex gap-3 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                            <button
                                onClick={() => closeModal('clearConfirm')}
                                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors ${isDark ? 'bg-[#252525] hover:bg-[#2a2a2a] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmClearAllNodes}
                                className="flex-1 py-2.5 rounded-lg font-medium text-sm bg-red-500 hover:bg-red-600 text-white transition-colors"
                            >
                                Delete All
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
