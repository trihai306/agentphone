import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook to manage workflow recording mode
 * Handles recording session, actions, timer, and controls
 * 
 * @param {Object} config - Configuration object
 * @param {Object} config.selectedDevice - Currently selected device
 * @param {Object} config.flow - Flow object with id
 * @param {Object} config.auth - Auth object
 * @param {Function} config.setNodes - Function to update canvas nodes
 * @param {Function} config.setEdges - Function to update canvas edges
 * @returns {Object} Recording state and control functions
 */
export function useRecordingMode({ selectedDevice, flow, auth, setNodes, setEdges }) {
    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSession, setRecordingSession] = useState(null);
    const [recordedNodeCount, setRecordedNodeCount] = useState(0);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [recordedActions, setRecordedActions] = useState([]);
    const [showRecordingPanel, setShowRecordingPanel] = useState(false);
    const [isRecordingPaused, setIsRecordingPaused] = useState(false);

    // Refs for loop detection and timer
    const consecutiveActionsRef = useRef([]);
    const recordingTimerRef = useRef(null);

    // Start recording session
    const startRecording = useCallback(async () => {
        if (!selectedDevice) {
            console.warn('⚠️ useRecordingMode: No device selected');
            return;
        }

        // Check accessibility service first
        if (!selectedDevice.accessibility_enabled) {
            console.error('❌ useRecordingMode: Accessibility not enabled');
            return { success: false, error: 'Accessibility service not enabled' };
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
                consecutiveActionsRef.current = [];
                setShowRecordingPanel(true);
                setIsRecordingPaused(false);

                // Start timer
                recordingTimerRef.current = setInterval(() => {
                    setRecordingDuration(prev => prev + 1);
                }, 1000);

                console.log('✅ useRecordingMode: Recording started');
                return { success: true, session: data.session };
            }
            return { success: false, error: data.message };
        } catch (error) {
            console.error('❌ useRecordingMode: Failed to start recording:', error);
            return { success: false, error: error.message };
        }
    }, [selectedDevice, flow.id]);

    // Stop recording session
    const stopRecording = useCallback(async () => {
        if (!recordingSession) {
            console.warn('⚠️ useRecordingMode: No active recording session');
            return;
        }

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
                console.log('✅ useRecordingMode: Recording stopped');
                return { success: true };
            }
            return { success: false, error: data.message };
        } catch (error) {
            console.error('❌ useRecordingMode: Failed to stop recording:', error);
            return { success: false, error: error.message };
        }
    }, [recordingSession]);

    // Format duration as MM:SS
    const formatDuration = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // Toggle pause recording
    const togglePauseRecording = useCallback(() => {
        setIsRecordingPaused(prev => !prev);
        console.log('🔄 useRecordingMode: Recording paused toggled');
    }, []);

    // Undo last recorded action
    const undoLastAction = useCallback(() => {
        if (recordedActions.length === 0) {
            console.warn('⚠️ useRecordingMode: No actions to undo');
            return;
        }

        const lastAction = recordedActions[recordedActions.length - 1];

        // Remove last node from canvas
        setNodes(prev => prev.filter(n => n.id !== lastAction.nodeId));

        // Remove edges connected to last node
        setEdges(prev => prev.filter(e => e.source !== lastAction.nodeId && e.target !== lastAction.nodeId));

        // Update actions list
        setRecordedActions(prev => prev.slice(0, -1));
        setRecordedNodeCount(prev => prev - 1);

        console.log('↩️ useRecordingMode: Undid last action:', lastAction);
    }, [recordedActions, setNodes, setEdges]);

    // Add recorded action
    const addRecordedAction = useCallback((action) => {
        setRecordedActions(prev => [...prev, action]);
        setRecordedNodeCount(prev => prev + 1);
    }, []);

    // Reset recording state
    const resetRecording = useCallback(() => {
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }

        setIsRecording(false);
        setRecordingSession(null);
        setRecordedNodeCount(0);
        setRecordingDuration(0);
        setRecordedActions([]);
        setShowRecordingPanel(false);
        setIsRecordingPaused(false);
        consecutiveActionsRef.current = [];

        console.log('🔄 useRecordingMode: Recording state reset');
    }, []);

    return {
        // State
        isRecording,
        recordingSession,
        recordedNodeCount,
        recordingDuration,
        recordedActions,
        showRecordingPanel,
        isRecordingPaused,
        consecutiveActionsRef,

        // Functions
        startRecording,
        stopRecording,
        togglePauseRecording,
        undoLastAction,
        formatDuration,
        addRecordedAction,
        setShowRecordingPanel,
        resetRecording,
    };
}
