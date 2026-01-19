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
    const [onlineDevices, setOnlineDevices] = useState(props.onlineDevices || []);
    const collections = props.dataCollections || dataCollections;

    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { addToast } = useToast();
    const { t } = useTranslation();

    const [nodes, setNodes] = useState(flow.nodes || []);
    const [edges, setEdges] = useState(flow.edges || []);
    const [viewport, setViewport] = useState(flow.viewport || { x: 0, y: 0, zoom: 1 });

    // Undo/Redo history management
    const { takeSnapshot, undo, redo, canUndo, canRedo } = useUndoRedo(nodes, edges, setNodes, setEdges);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [flowName, setFlowName] = useState(flow.name);
    const [editingName, setEditingName] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedNodes, setSelectedNodes] = useState([]); // Multi-select support
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [draggedNodeType, setDraggedNodeType] = useState(null);
    const [showLogPanel, setShowLogPanel] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [showDeviceSelector, setShowDeviceSelector] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Recording mode state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSession, setRecordingSession] = useState(null);
    const [recordedNodeCount, setRecordedNodeCount] = useState(0);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [recordedActions, setRecordedActions] = useState([]);
    const [showRecordingPanel, setShowRecordingPanel] = useState(false);
    const [isRecordingPaused, setIsRecordingPaused] = useState(false);
    const consecutiveActionsRef = useRef([]); // Track repeated actions for loop detection (useRef to avoid stale closure)
    const recordingTimerRef = useRef(null);

    // Test Run state
    const [testRunning, setTestRunning] = useState(false);

    // Media Picker state
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [mediaPickerNodeId, setMediaPickerNodeId] = useState(null);

    // Collection Picker state
    const [showCollectionPicker, setShowCollectionPicker] = useState(false);
    const [collectionPickerNodeId, setCollectionPickerNodeId] = useState(null);

    // Loop Sub-Flow Modal state
    const [showLoopSubFlowModal, setShowLoopSubFlowModal] = useState(false);
    const [editingLoopNodeId, setEditingLoopNodeId] = useState(null);

    // Workflow Preview Modal state
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // Debug Panel state - shows raw APK event data
    const [debugEvents, setDebugEvents] = useState([]);
    const [showDebugPanel, setShowDebugPanel] = useState(false);
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

    // Auto-select first online device when page loads
    useEffect(() => {
        if (!selectedDevice && onlineDevices && onlineDevices.length > 0) {
            setSelectedDevice(onlineDevices[0]);
        }
    }, [onlineDevices]);

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
                            setCollectionPickerNodeId(nodeId);
                            setShowCollectionPicker(true);
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
                            setMediaPickerNodeId(nodeId);
                            setShowMediaPicker(true);
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

    // Update nodes with execution state and callbacks
    const nodesWithExecution = useMemo(() => {
        return nodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                executionState: nodeStates[node.id]?.status || NodeStatus.IDLE,
                // Pass edit sub-flow callback for loop nodes
                ...(node.type === 'loop' && {
                    onEditSubFlow: (nodeId) => {
                        setEditingLoopNodeId(nodeId);
                        setShowLoopSubFlowModal(true);
                    }
                }),
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

    // Normalize event type for comparison (group similar actions)
    const normalizeEventType = useCallback((eventType) => {
        const normalizeMap = {
            'tap': 'click',
            'long_click': 'click',
            'long_press': 'click',
            'set_text': 'text_input',
            // Scroll: keep up/down distinct for separate Loops
            'scroll': 'scroll',           // Generic scroll
            'scroll_up': 'scroll_up',     // Scroll up - distinct from down
            'scroll_down': 'scroll_down', // Scroll down - distinct from up
            // Swipe: keep direction for distinct Loops
            'swipe_left': 'swipe_left',
            'swipe_right': 'swipe_right',
            'swipe_up': 'swipe_up',
            'swipe_down': 'swipe_down',
            'back': 'key_event',
            'home': 'key_event',
        };
        return normalizeMap[eventType] || eventType;
    }, []);

    // Extract app name from package name (e.g., "com.google.chrome" -> "Chrome")
    const getAppNameFromPackage = useCallback((packageName) => {
        if (!packageName) return '';
        const parts = packageName.split('.');
        const lastPart = parts[parts.length - 1];
        // Capitalize first letter
        return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
    }, []);

    // Generate smart, descriptive label for nodes
    const generateSmartLabel = useCallback((eventData) => {
        const eventType = eventData.event_type || eventData.eventType || '';
        const text = eventData.text || '';
        const appName = eventData.app_name || getAppNameFromPackage(eventData.package_name || eventData.packageName);
        const actionData = eventData.action_data || {};

        // Truncate text for display
        const truncatedText = text.length > 25 ? text.substring(0, 22) + '...' : text;

        switch (eventType) {
            case 'tap':
            case 'click':
                if (truncatedText) return `Tap '${truncatedText}'`;
                return appName ? `Tap in ${appName}` : 'Tap';

            case 'long_tap':
            case 'long_click':
            case 'long_press':
                if (truncatedText) return `Long press '${truncatedText}'`;
                return 'Long Press';

            case 'double_tap':
                if (truncatedText) return `Double tap '${truncatedText}'`;
                return 'Double Tap';

            case 'text_input':
            case 'set_text':
                const inputText = actionData.text || text || '';
                const displayText = inputText.length > 20 ? inputText.substring(0, 17) + '...' : inputText;
                return displayText ? `Type '${displayText}'` : 'Type Text';

            case 'scroll_up':
                return 'Scroll Up';
            case 'scroll_down':
                return 'Scroll Down';
            case 'scroll':
                const direction = actionData.direction || 'down';
                return `Scroll ${direction.charAt(0).toUpperCase() + direction.slice(1)}`;

            case 'swipe_left':
                return 'Swipe Left';
            case 'swipe_right':
                return 'Swipe Right';
            case 'swipe_up':
                return 'Swipe Up';
            case 'swipe_down':
                return 'Swipe Down';

            case 'open_app':
                return appName ? `Open ${appName}` : 'Open App';

            case 'back':
                return 'Press Back';
            case 'home':
                return 'Press Home';

            default:
                // Fallback: capitalize event type
                return eventType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
    }, [getAppNameFromPackage]);

    // Map event type to node type
    // Return the exact event type so SmartActionNode can display correct icon/color
    const getNodeType = useCallback((eventType) => {
        const typeMap = {
            'open_app': 'open_app',
            'click': 'click',
            'tap': 'tap',                       // Keep specific
            'long_click': 'long_press',
            'long_tap': 'long_tap',             // Keep specific 
            'long_press': 'long_press',
            'double_tap': 'double_tap',         // Keep specific
            'text_input': 'text_input',
            'set_text': 'text_input',
            'scroll': 'scroll',
            'scroll_up': 'scroll_up',           // Keep specific direction
            'scroll_down': 'scroll_down',
            'scroll_left': 'scroll_left',
            'scroll_right': 'scroll_right',
            'swipe': 'swipe',
            'swipe_left': 'swipe_left',         // Keep specific direction
            'swipe_right': 'swipe_right',
            'swipe_up': 'swipe_up',
            'swipe_down': 'swipe_down',
            'key_event': 'key_event',
            'back': 'back',                     // Keep specific
            'home': 'home',
            'focus': 'focus',
        };
        return typeMap[eventType] || eventType; // Fallback to eventType itself
    }, []);

    // Create a Loop node from consecutive actions
    const createLoopNodeFromActions = useCallback((actions, position) => {
        const loopNodeId = `loop_${Date.now()}`;
        const firstAction = actions[0];
        const actionLabel = firstAction.label || firstAction.eventType;

        // Create the action node for sub-flow
        const subFlowActionNode = {
            id: 'subflow-action-1',
            type: getNodeType(firstAction.eventType),
            position: { x: 200, y: 200 },
            data: {
                label: actionLabel,
                eventType: firstAction.eventType,
                resourceId: firstAction.resourceId,
                text: firstAction.text,
                screenshotUrl: firstAction.screenshotUrl,
                coordinates: firstAction.coordinates,
                bounds: firstAction.bounds,
                packageName: firstAction.packageName,
                className: firstAction.className,
                isRecorded: true,
            },
        };

        // Create sub-flow with loopStart -> action -> loopEnd
        const subFlow = {
            nodes: [
                {
                    id: 'loop-start',
                    type: 'loopStart',
                    data: { label: 'Loop Start', itemVariable: 'iteration' },
                    position: { x: 200, y: 50 },
                },
                subFlowActionNode,
                {
                    id: 'loop-end',
                    type: 'loopEnd',
                    data: { label: 'Continue' },
                    position: { x: 200, y: 350 },
                },
            ],
            edges: [
                {
                    id: 'edge-start-action',
                    source: 'loop-start',
                    target: 'subflow-action-1',
                    type: 'animated',
                },
                {
                    id: 'edge-action-end',
                    source: 'subflow-action-1',
                    target: 'loop-end',
                    type: 'animated',
                },
            ],
        };

        // Create the Loop node
        const loopNode = {
            id: loopNodeId,
            type: 'loop',
            position: position,
            data: {
                label: `Loop: ${actionLabel} ×${actions.length}`,
                loopType: 'count',
                iterations: actions.length,
                itemVariable: 'iteration',
                indexVariable: 'index',
                subFlow: subFlow,
                isAutoGenerated: true,
                originalActionCount: actions.length,
                onEditSubFlow: (nodeId) => {
                    setEditingLoopNodeId(nodeId);
                    setShowLoopSubFlowModal(true);
                },
            },
        };

        return loopNode;
    }, [getNodeType]);

    // Smart Loop Detection: Create node from recorded event
    const createNodeFromEvent = useCallback((eventData, nodeSuggestion) => {
        const normalizedType = normalizeEventType(eventData.event_type);
        const LOOP_THRESHOLD = 3; // Create loop after 3 repeated actions

        // Event types that should NEVER be grouped into loops
        // TAP/CLICK/TYPE actions should never be looped - each tap on different elements is unique
        // Only SCROLL/SWIPE actions can be grouped into loops
        const LOOP_EXCLUDED_TYPES = [
            'text_input', 'set_text', 'focus', 'text_delete', 'open_app',
            'click', 'tap', 'double_tap', 'long_click', 'long_press'
        ];
        const shouldExcludeFromLoop = LOOP_EXCLUDED_TYPES.includes(normalizedType) ||
            LOOP_EXCLUDED_TYPES.includes(eventData.event_type);

        // Generate node ID first (we'll need it for tracking)
        const newNodeId = `recorded_${Date.now()}_${eventData.sequence_number}`;

        // Access ref directly (not stale like state in closure)
        const currentConsecutive = consecutiveActionsRef.current;

        // Check if this action is similar to consecutive actions (only if not excluded)
        // For click/tap actions, also require same resourceId or text (clicking different buttons shouldn't create a loop)
        const resourceIdOrText = eventData.resource_id || eventData.resourceId || eventData.text || '';
        const firstActionResourceOrText = currentConsecutive[0]?.resourceId || currentConsecutive[0]?.text || '';

        // Also compare coordinates for element-based actions (tap/click at different positions = different elements)
        const currentCoords = { x: eventData.x || 0, y: eventData.y || 0 };
        const firstActionCoords = currentConsecutive[0]?.coordinates || { x: 0, y: 0 };
        const COORD_TOLERANCE = 50; // Pixels - taps within 50px are considered "same position"
        const isSamePosition = Math.abs(currentCoords.x - firstActionCoords.x) <= COORD_TOLERANCE &&
            Math.abs(currentCoords.y - firstActionCoords.y) <= COORD_TOLERANCE;

        // For scrolls/swipes, only match on event type (direction already encoded in normalized type)
        // For taps/clicks, require SAME TARGET ELEMENT (position + identifier)
        const isElementBasedAction = ['click', 'tap', 'long_click', 'long_press', 'double_tap'].includes(normalizedType) ||
            ['click', 'tap', 'long_click', 'long_press', 'double_tap'].includes(eventData.event_type);

        // For element-based actions (tap/click), we need STRICTER matching:
        // - MUST be same position (within tolerance) - different positions = different elements
        // - AND if both have resourceId/text, they must match too
        // This prevents grouping clicks on different icons (Like, Share, Comment) into loops
        const hasIdentifier = resourceIdOrText && firstActionResourceOrText;
        const identifiersMatch = !hasIdentifier || (resourceIdOrText === firstActionResourceOrText);
        const elementBasedMatch = isSamePosition && identifiersMatch;

        const isSimilarAction = !shouldExcludeFromLoop &&
            currentConsecutive.length > 0 &&
            normalizeEventType(currentConsecutive[0].eventType) === normalizedType &&
            // For element-based actions, require same position AND matching identifiers
            (!isElementBasedAction || elementBasedMatch);

        // Build the new action object with nodeId already set
        // Use smart label generation for descriptive node names
        const smartLabel = generateSmartLabel(eventData);
        const newAction = {
            eventType: eventData.event_type,
            label: smartLabel,
            resourceId: eventData.resource_id || eventData.resourceId,
            text: eventData.text,
            screenshotUrl: eventData.screenshot_url || nodeSuggestion.data?.screenshotUrl,
            coordinates: { x: eventData.x, y: eventData.y },
            bounds: eventData.bounds,
            packageName: eventData.package_name,
            className: eventData.class_name,
            nodeId: newNodeId, // Set nodeId immediately
        };

        if (isSimilarAction) {
            // Add to consecutive actions
            const newConsecutiveActions = [...currentConsecutive, newAction];
            consecutiveActionsRef.current = newConsecutiveActions; // Update ref immediately

            // Check if we've reached the threshold
            if (newConsecutiveActions.length >= LOOP_THRESHOLD) {

                // Check if ANY Loop with same action type exists - MERGE into it
                setNodes(prevNodes => {
                    // Find existing Loop with same action type
                    const existingLoop = prevNodes.find(node => {
                        if (node.type !== 'loop' || !node.data?.isAutoGenerated) return false;
                        const loopActionType = node.data.subFlow?.nodes?.find(n => n.type !== 'loopStart' && n.type !== 'loopEnd')?.data?.eventType;
                        const loopNormalizedType = loopActionType ? normalizeEventType(loopActionType) : null;
                        return loopNormalizedType === normalizedType;
                    });

                    // Get the node IDs of consecutive actions we need to remove
                    const existingNodeIds = newConsecutiveActions
                        .slice(0, -1) // Exclude current action (not created yet)
                        .map(a => a.nodeId)
                        .filter(Boolean);

                    if (existingLoop) {
                        // MERGE: Increase iterations of existing Loop and remove individual nodes
                        const newIterations = (existingLoop.data.iterations || 3) + newConsecutiveActions.length;

                        // Update Loop and remove individual nodes
                        const updatedNodes = prevNodes
                            .filter(n => !existingNodeIds.includes(n.id)) // Remove individual scroll nodes
                            .map(n =>
                                n.id === existingLoop.id
                                    ? {
                                        ...n,
                                        data: {
                                            ...n.data,
                                            iterations: newIterations,
                                            originalActionCount: newIterations,
                                            label: `Loop: ${n.data.label.split('×')[0].trim()} ×${newIterations}`,
                                        }
                                    }
                                    : n
                            );

                        // Remove edges connected to removed nodes
                        setEdges(prevEdges =>
                            prevEdges.filter(e =>
                                !existingNodeIds.includes(e.source) && !existingNodeIds.includes(e.target)
                            )
                        );

                        // Update recorded actions
                        setRecordedActions(prev =>
                            prev.filter(a => !existingNodeIds.includes(a.nodeId))
                        );

                        // Reset consecutive tracking
                        consecutiveActionsRef.current = [];
                        return updatedNodes;
                    }

                    // No existing Loop to merge - CREATE NEW LOOP

                    // existingNodeIds already declared above

                    // Find position for loop node
                    const firstNodeToRemove = prevNodes.find(n => n.id === existingNodeIds[0]);
                    const loopPosition = firstNodeToRemove?.position || { x: 400, y: 100 };

                    // Create the loop node
                    const loopNode = createLoopNodeFromActions(newConsecutiveActions, loopPosition);

                    // Find node before first removed node
                    const firstRemovedIndex = prevNodes.findIndex(n => n.id === existingNodeIds[0]);
                    const nodeBeforeLoop = firstRemovedIndex > 0 ? prevNodes[firstRemovedIndex - 1] : null;

                    // Remove old nodes and add loop node
                    const filtered = prevNodes.filter(n => !existingNodeIds.includes(n.id));

                    // Update edges
                    setEdges(prevEdges => {
                        const filteredEdges = prevEdges.filter(e =>
                            !existingNodeIds.includes(e.source) && !existingNodeIds.includes(e.target)
                        );
                        if (nodeBeforeLoop) {
                            // Check if nodeBeforeLoop is a Loop - connect from 'complete' handle
                            const isLoopNode = nodeBeforeLoop.type === 'loop';
                            filteredEdges.push({
                                id: `edge_${nodeBeforeLoop.id}_${loopNode.id}`,
                                source: nodeBeforeLoop.id,
                                target: loopNode.id,
                                sourceHandle: isLoopNode ? 'complete' : undefined,
                                type: 'animated',
                                animated: true,
                            });
                        }
                        return filteredEdges;
                    });

                    // Update recorded actions
                    setRecordedActions(prev => {
                        const filteredActions = prev.filter(a => !existingNodeIds.includes(a.nodeId));
                        return [...filteredActions, {
                            nodeId: loopNode.id,
                            eventType: 'loop',
                            label: loopNode.data.label,
                            timestamp: Date.now(),
                            isLoop: true,
                        }];
                    });

                    // Reset consecutive tracking
                    consecutiveActionsRef.current = [];
                    return [...filtered, loopNode];
                });

                return; // Don't create normal node
            }
            // Not yet at threshold, ref already updated above, continue to create normal node
        } else {
            // Different action type or excluded type
            if (shouldExcludeFromLoop) {
                // Excluded types (text_input, focus, etc.) should reset tracking completely
                consecutiveActionsRef.current = [];
            } else {
                // Start new tracking with this action
                consecutiveActionsRef.current = [newAction];
            }
        }

        // Create normal node with functional update to get latest state
        setNodes(prevNodes => {
            const existingNodesCount = prevNodes.length;
            const lastNode = prevNodes[existingNodesCount - 1];

            // ========== TEXT INPUT MERGING ==========
            // If this is a text_input event and the last node is also text_input with same resourceId,
            // UPDATE the existing node's text instead of creating a new one.
            // This handles the case where timer flushes text every 500ms ("d" → "de" → "den" → "deno")
            const isTextInput = eventData.event_type === 'text_input' || eventData.event_type === 'set_text';
            const eventResourceId = eventData.resource_id || eventData.resourceId || '';

            if (isTextInput && lastNode) {
                const lastNodeIsTextInput = lastNode.data?.eventType === 'text_input' || lastNode.data?.eventType === 'set_text';
                const lastNodeResourceId = lastNode.data?.resourceId || '';

                // Check if same input field (same resourceId or same coordinates if no resourceId)
                const isSameInputField = lastNodeIsTextInput && (
                    (eventResourceId && lastNodeResourceId && eventResourceId === lastNodeResourceId) ||
                    (!eventResourceId && !lastNodeResourceId &&
                        lastNode.data?.coordinates?.x === eventData.x &&
                        lastNode.data?.coordinates?.y === eventData.y)
                );

                if (isSameInputField) {
                    const newText = eventData.text || '';
                    const oldText = lastNode.data?.text || '';

                    // Only update if text actually changed (new text is longer or different)
                    if (newText !== oldText && newText.length >= oldText.length) {
                        // Update the existing node's text
                        return prevNodes.map(node =>
                            node.id === lastNode.id
                                ? {
                                    ...node,
                                    data: {
                                        ...node.data,
                                        text: newText,
                                        label: generateSmartLabel({ ...eventData, text: newText }),
                                        actionData: {
                                            ...node.data.actionData,
                                            text: newText,
                                        },
                                    }
                                }
                                : node
                        );
                    }

                    // Text is same or shorter - no update needed
                    return prevNodes;
                }
            }
            // ========== END TEXT INPUT MERGING ==========

            // Auto-layout: position below last node
            const baseX = 400;
            const baseY = 100;
            const nodeHeight = 150; // Increased for Loop nodes
            const gap = 80;

            let newY = baseY;
            if (lastNode && lastNode.position) {
                newY = lastNode.position.y + nodeHeight + gap;
            }

            const newNode = {
                id: newNodeId,
                type: getNodeType(eventData.event_type),
                position: { x: baseX, y: newY },
                data: {
                    label: nodeSuggestion.data?.label || eventData.event_type,
                    color: nodeSuggestion.data?.color || 'blue',
                    eventType: eventData.event_type,
                    resourceId: eventData.resource_id || eventData.resourceId,
                    text: eventData.text,
                    screenshotUrl: eventData.screenshot_url || nodeSuggestion.data?.screenshotUrl,
                    coordinates: { x: eventData.x, y: eventData.y },
                    bounds: eventData.bounds,
                    packageName: eventData.package_name,
                    className: eventData.class_name,
                    contentDescription: eventData.content_description,
                    actionData: eventData.action_data,
                    isRecorded: true,
                    sequenceNumber: eventData.sequence_number,
                },
            };

            // Auto-connect to previous node
            if (existingNodesCount > 0) {
                const isLoopNode = lastNode.type === 'loop';
                const edgeConfig = {
                    id: `edge_${lastNode.id}_${newNodeId}`,
                    source: lastNode.id,
                    target: newNodeId,
                    type: 'animated',
                    animated: true,
                };
                if (isLoopNode) {
                    edgeConfig.sourceHandle = 'complete';
                }
                setEdges(prevEdges => [...prevEdges, edgeConfig]);
            }

            return [...prevNodes, newNode];
        });

        setRecordedNodeCount(prev => prev + 1);

        // Track action for undo and history panel
        setRecordedActions(prev => [...prev, {
            nodeId: newNodeId,
            eventType: eventData.event_type,
            label: nodeSuggestion.data?.label || eventData.event_type,
            timestamp: Date.now(),
            screenshotUrl: eventData.screenshot_url,
        }]);
    }, [normalizeEventType, getNodeType, createLoopNodeFromActions]);

    // Listen for recording events from selected device via Echo
    useEffect(() => {
        // Only listen when a device is selected
        if (!selectedDevice) return;

        // Helper function to register listener on backend
        const registerListener = async () => {
            try {
                await fetch('/recording-listener/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        device_id: selectedDevice.device_id,
                        flow_id: flow.id,
                        user_id: props.auth?.user?.id,
                    }),
                });
                console.log('✅ Workflow listener registered for device:', selectedDevice.device_id);
            } catch (error) {
                console.warn('Failed to register workflow listener:', error);
            }
        };

        // Helper function to unregister listener on backend
        const unregisterListener = async () => {
            try {
                await fetch('/recording-listener/unregister', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        device_id: selectedDevice.device_id,
                    }),
                });
                console.log('📤 Workflow listener unregistered for device:', selectedDevice.device_id);
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

    // Debounced auto-save (DISABLED - use Ctrl+S for manual save)
    const debouncedSave = useCallback((currentNodes, currentEdges, currentViewport) => {
        // Auto-save disabled - user requested manual save only
        // Uncomment below to re-enable auto-save:
        // if (saveTimeoutRef.current) {
        //     clearTimeout(saveTimeoutRef.current);
        // }
        // saveTimeoutRef.current = setTimeout(() => {
        //     saveFlow(currentNodes, currentEdges, currentViewport);
        // }, 1000);
    }, [saveFlow]);

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
                // CRITICAL: Set eventType so SmartActionNode knows which icon/label to display
                // Without this, SmartActionNode defaults to 'tap' (see line 29 of SmartActionNode.jsx)
                eventType: type,
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

    // Wrap selected nodes in a Loop - Multi-selection feature
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
            data: { label: 'Loop Start', itemVariable: 'item' },
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
            data: { label: 'Continue' },
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
    }, [selectedNodes, nodes, edges, viewport, saveFlow, takeSnapshot, addToast]);

    // Clear all nodes from the workflow
    const handleClearAllNodes = useCallback(() => {
        if (nodes.length === 0) return;
        setShowClearConfirm(true);
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
        setShowClearConfirm(false);
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
            if ((e.key === 'Delete' || e.key === 'Backspace') && !editingName) {
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
                                                                onClick={async () => {
                                                                    setSelectedDevice(device);
                                                                    setTimeout(() => setShowDeviceSelector(false), 300);

                                                                    // Request realtime accessibility check via socket
                                                                    try {
                                                                        const response = await axios.post('/devices/check-accessibility', {
                                                                            device_id: device.device_id
                                                                        });

                                                                        // Show warning based on current DB value (realtime update will come via socket)
                                                                        if (!response.data.current_status) {
                                                                            addToast(`⚠️ ${t('flows.editor.accessibility.checking')}`, 'info');
                                                                        }
                                                                    } catch (err) {
                                                                        console.warn('Failed to request accessibility check:', err);
                                                                        // Fallback to DB value
                                                                        if (!device.accessibility_enabled) {
                                                                            addToast(`⚠️ ${t('flows.editor.accessibility.not_enabled_short')}`, 'warning');
                                                                        }
                                                                    }
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
                                                                            {/* Accessibility Status Badge */}
                                                                            {!device.accessibility_enabled && (
                                                                                <div
                                                                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isDark
                                                                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                                                        : 'bg-amber-100 text-amber-700 border border-amber-300'
                                                                                        }`}
                                                                                    title="Accessibility Service chưa được bật"
                                                                                >
                                                                                    ⚠ A11Y
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'
                                                                            }`}>
                                                                            {device.model || device.device_id || 'Unknown model'}
                                                                        </p>
                                                                        {/* Accessibility warning text */}
                                                                        {!device.accessibility_enabled && (
                                                                            <p className={`text-[10px] mt-1 ${isDark ? 'text-amber-400/80' : 'text-amber-600'}`}>
                                                                                Cần bật Accessibility Service
                                                                            </p>
                                                                        )}
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

                                        // Do realtime accessibility check first
                                        try {
                                            const checkResponse = await axios.post('/devices/check-accessibility', {
                                                device_id: selectedDevice.device_id
                                            });

                                            if (!checkResponse.data.current_status) {
                                                // Just warn, don't block - APK might have accessibility enabled but DB not updated
                                                console.warn('⚠️ Accessibility check returned false, but proceeding anyway for testing');
                                                // addToast(`⚠️ Accessibility có thể chưa bật - đang thử chạy...`, 'warning');
                                            }
                                        } catch (checkError) {
                                            console.warn('Accessibility check failed, proceeding anyway:', checkError);
                                        }

                                        // Now run the workflow
                                        try {
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

                                            const response = await axios.post(`/flows/${flow.id}/test-run`, {
                                                device_id: selectedDevice.id,
                                            });
                                            if (response.data.success) {
                                                addToast(t('flows.editor.run.success', { device: selectedDevice.name, count: response.data.data.actions_count }), 'success');
                                            }
                                        } catch (error) {
                                            console.error('🚀 Test-run error:', error.response?.data || error);
                                            addToast(t('flows.editor.run.failed', { error: error.response?.data?.message || error.message }), 'error');
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

                        {/* Preview Button */}
                        <button
                            onClick={() => setShowPreviewModal(true)}
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
                            <span className="hidden sm:inline">Preview</span>
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
                            <span className="hidden sm:inline">{saving ? 'Saving' : lastSaved ? 'Saved' : 'Save'}</span>
                        </button>

                        {/* Deploy Button - compact */}
                        <button className={`h-8 px-2.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="hidden sm:inline">Deploy</span>
                        </button>

                        {/* Language Switcher */}
                        <div className="relative">
                            <button
                                onClick={() => setShowLangDropdown(!showLangDropdown)}
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
                            {showLangDropdown && (
                                <div className={`absolute top-full right-0 mt-1 w-32 rounded-lg shadow-xl border overflow-hidden z-50 ${isDark
                                    ? 'bg-[#1a1a1a] border-[#2a2a2a]'
                                    : 'bg-white border-gray-200'
                                    }`}>
                                    <button
                                        onClick={() => {
                                            changeLanguage('vi');
                                            setShowLangDropdown(false);
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
                                            setShowLangDropdown(false);
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
                                        placeholder={t('flows.editor.sidebar.search_placeholder')}
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
                                            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('flows.editor.categories.control_flow')}</span>
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
                                            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('flows.editor.categories.recorded_actions')}</span>
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
                                            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('flows.editor.categories.logic_control')}</span>
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
                                            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('flows.editor.categories.resources')}</span>
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
                                <p className={`text-[10px] font-semibold mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('flows.editor.sidebar.shortcuts').toUpperCase()}</p>
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
                                deleteKeyCode={['Delete', 'Backspace']}
                                edgesSelectable={true}
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

                                {/* Quick Action Bar - Only show when device is connected */}
                                {selectedDevice && (
                                    <Panel position="bottom-center" className="!m-4">
                                        <div className={`flex items-center gap-1 px-2 py-2 rounded-2xl shadow-2xl border backdrop-blur-xl ${isDark
                                            ? 'bg-[#1a1a1a]/90 border-[#2a2a2a]'
                                            : 'bg-white/90 border-gray-200'
                                            }`}
                                            style={{
                                                boxShadow: isDark
                                                    ? '0 20px 60px rgba(0, 0, 0, 0.5)'
                                                    : '0 20px 60px rgba(0, 0, 0, 0.15)'
                                            }}
                                        >
                                            {/* Label */}
                                            <div className={`px-3 py-1 flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                <span className="text-xs font-medium">Quick Actions</span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            </div>

                                            <div className={`w-px h-6 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />

                                            {/* Tap Action */}
                                            <button
                                                onClick={() => {
                                                    const newNode = {
                                                        id: `quick-tap-${Date.now()}`,
                                                        type: 'tap',
                                                        position: { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 },
                                                        data: { label: 'Quick Tap', actionType: 'tap' },
                                                    };
                                                    setNodes(nds => [...nds, newNode]);
                                                    setSelectedNode(newNode);
                                                    addToast('👆 Added Tap node - configure element', 'info');
                                                }}
                                                className={`group flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all hover:scale-105 ${isDark ? 'hover:bg-blue-500/20' : 'hover:bg-blue-50'
                                                    }`}
                                                title="Add Tap action"
                                            >
                                                <svg className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <circle cx="12" cy="12" r="3" strokeWidth={2} />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2m10-10h-2M4 12H2" />
                                                </svg>
                                                <span className={`text-[10px] mt-0.5 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tap</span>
                                            </button>

                                            {/* Type Action */}
                                            <button
                                                onClick={() => {
                                                    const newNode = {
                                                        id: `quick-type-${Date.now()}`,
                                                        type: 'text_input',
                                                        position: { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 },
                                                        data: { label: 'Quick Type', actionType: 'text_input', text: '' },
                                                    };
                                                    setNodes(nds => [...nds, newNode]);
                                                    setSelectedNode(newNode);
                                                    addToast('⌨️ Added Type node - enter text', 'info');
                                                }}
                                                className={`group flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all hover:scale-105 ${isDark ? 'hover:bg-purple-500/20' : 'hover:bg-purple-50'
                                                    }`}
                                                title="Add Type Text action"
                                            >
                                                <svg className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                <span className={`text-[10px] mt-0.5 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Type</span>
                                            </button>

                                            <div className={`w-px h-6 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />

                                            {/* Scroll Up */}
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await axios.post('/devices/send-action', {
                                                            device_id: selectedDevice.device_id,
                                                            action: { type: 'scroll', direction: 'up', amount: 500 }
                                                        });
                                                        addToast('⬆️ Scroll Up sent', 'success');
                                                    } catch (e) {
                                                        addToast('Failed to send scroll', 'error');
                                                    }
                                                }}
                                                className={`group flex flex-col items-center justify-center w-12 h-14 rounded-xl transition-all hover:scale-105 ${isDark ? 'hover:bg-amber-500/20' : 'hover:bg-amber-50'
                                                    }`}
                                                title="Scroll Up on device"
                                            >
                                                <svg className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                </svg>
                                                <span className={`text-[10px] mt-0.5 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Up</span>
                                            </button>

                                            {/* Scroll Down */}
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await axios.post('/devices/send-action', {
                                                            device_id: selectedDevice.device_id,
                                                            action: { type: 'scroll', direction: 'down', amount: 500 }
                                                        });
                                                        addToast('⬇️ Scroll Down sent', 'success');
                                                    } catch (e) {
                                                        addToast('Failed to send scroll', 'error');
                                                    }
                                                }}
                                                className={`group flex flex-col items-center justify-center w-12 h-14 rounded-xl transition-all hover:scale-105 ${isDark ? 'hover:bg-amber-500/20' : 'hover:bg-amber-50'
                                                    }`}
                                                title="Scroll Down on device"
                                            >
                                                <svg className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                                <span className={`text-[10px] mt-0.5 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Down</span>
                                            </button>

                                            <div className={`w-px h-6 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />

                                            {/* Back Key */}
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await axios.post('/devices/send-action', {
                                                            device_id: selectedDevice.device_id,
                                                            action: { type: 'key_event', keyCode: 'KEYCODE_BACK' }
                                                        });
                                                        addToast('◀️ Back key sent', 'success');
                                                    } catch (e) {
                                                        addToast('Failed to send key', 'error');
                                                    }
                                                }}
                                                className={`group flex flex-col items-center justify-center w-12 h-14 rounded-xl transition-all hover:scale-105 ${isDark ? 'hover:bg-pink-500/20' : 'hover:bg-pink-50'
                                                    }`}
                                                title="Send Back key to device"
                                            >
                                                <svg className={`w-5 h-5 ${isDark ? 'text-pink-400' : 'text-pink-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                                </svg>
                                                <span className={`text-[10px] mt-0.5 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Back</span>
                                            </button>

                                            {/* Home Key */}
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await axios.post('/devices/send-action', {
                                                            device_id: selectedDevice.device_id,
                                                            action: { type: 'key_event', keyCode: 'KEYCODE_HOME' }
                                                        });
                                                        addToast('🏠 Home key sent', 'success');
                                                    } catch (e) {
                                                        addToast('Failed to send key', 'error');
                                                    }
                                                }}
                                                className={`group flex flex-col items-center justify-center w-12 h-14 rounded-xl transition-all hover:scale-105 ${isDark ? 'hover:bg-teal-500/20' : 'hover:bg-teal-50'
                                                    }`}
                                                title="Send Home key to device"
                                            >
                                                <svg className={`w-5 h-5 ${isDark ? 'text-teal-400' : 'text-teal-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                </svg>
                                                <span className={`text-[10px] mt-0.5 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Home</span>
                                            </button>

                                            <div className={`w-px h-6 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />

                                            {/* Element Picker Shortcut */}
                                            <button
                                                onClick={() => setShowElementPicker(true)}
                                                className={`group flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all hover:scale-105 ${isDark ? 'hover:bg-cyan-500/20' : 'hover:bg-cyan-50'
                                                    }`}
                                                title="Open Element Picker"
                                            >
                                                <svg className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                                </svg>
                                                <span className={`text-[10px] mt-0.5 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Picker</span>
                                            </button>
                                        </div>
                                    </Panel>
                                )}

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
                    selectedDevice={selectedDevice}
                    userId={props.auth?.user?.id}
                    dataSourceNodes={nodes.filter(n => n.type === 'data_source' && n.data?.collectionId)}
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
                isOpen={showLoopSubFlowModal}
                onClose={() => {
                    setShowLoopSubFlowModal(false);
                    setEditingLoopNodeId(null);
                }}
                loopNode={nodes.find(n => n.id === editingLoopNodeId)}
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
                isOpen={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
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
            {showClearConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowClearConfirm(false)}
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
                                onClick={() => setShowClearConfirm(false)}
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
