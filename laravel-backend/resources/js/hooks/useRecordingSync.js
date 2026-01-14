import { useState, useEffect, useCallback, useRef } from 'react';
import Echo from 'laravel-echo';

/**
 * Hook for real-time recording session synchronization
 * Subscribes to WebSocket channel for live recording events
 */
export function useRecordingSync(userId, options = {}) {
    const [isConnected, setIsConnected] = useState(false);
    const [activeSession, setActiveSession] = useState(null);
    const [events, setEvents] = useState([]);
    const [eventCount, setEventCount] = useState(0);
    const channelRef = useRef(null);

    // Store callbacks in refs to prevent re-subscription on callback changes
    const callbacksRef = useRef(options);
    callbacksRef.current = options;

    const {
        enabled = true,
    } = options;

    // Subscribe to recording channel
    useEffect(() => {
        if (!enabled || !userId || !window.Echo) {
            return;
        }

        const channelName = `recording.${userId}`;

        try {
            channelRef.current = window.Echo.private(channelName);

            channelRef.current
                .listen('.session.started', (data) => {
                    console.log('📹 Recording session started:', data);
                    setActiveSession({
                        sessionId: data.session_id,
                        deviceName: data.device_name,
                        deviceModel: data.device_model,
                        targetApp: data.target_app,
                        startedAt: new Date(data.started_at),
                    });
                    setEvents([]);
                    setEventCount(0);
                    callbacksRef.current.onSessionStarted?.(data);
                })
                .listen('.session.stopped', (data) => {
                    console.log('⏹️ Recording session stopped:', data);
                    setActiveSession(prev => prev ? {
                        ...prev,
                        status: 'completed',
                        eventCount: data.event_count,
                        duration: data.duration,
                        stoppedAt: new Date(data.stopped_at),
                        actions: data.actions,
                    } : null);
                    callbacksRef.current.onSessionStopped?.(data);
                })
                .listen('.event.received', (data) => {
                    console.log('📍 Recording event:', data.event?.event_type);
                    setEvents(prev => [...prev, data.event]);
                    setEventCount(data.event_count);
                    callbacksRef.current.onEventReceived?.(data);
                });

            setIsConnected(true);
            console.log(`✅ Subscribed to ${channelName}`);
        } catch (error) {
            console.error('Failed to subscribe to recording channel:', error);
            setIsConnected(false);
        }

        return () => {
            if (channelRef.current) {
                console.log(`🔌 Leaving channel ${channelName}`);
                window.Echo.leave(channelName);
                channelRef.current = null;
                setIsConnected(false);
            }
        };
    }, [userId, enabled]); // Only re-subscribe when userId or enabled changes

    // Clear session
    const clearSession = useCallback(() => {
        setActiveSession(null);
        setEvents([]);
        setEventCount(0);
    }, []);

    // Get formatted duration
    const getDuration = useCallback(() => {
        if (!activeSession?.startedAt) return '00:00';

        const now = activeSession.stoppedAt || new Date();
        const diff = Math.floor((now - activeSession.startedAt) / 1000);
        const mins = Math.floor(diff / 60).toString().padStart(2, '0');
        const secs = (diff % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }, [activeSession]);

    return {
        isConnected,
        activeSession,
        events,
        eventCount,
        clearSession,
        getDuration,
        isRecording: activeSession && !activeSession.stoppedAt,
    };
}

export default useRecordingSync;
