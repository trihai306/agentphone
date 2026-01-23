import { useState, useCallback } from 'react';

/**
 * Custom hook to manage debug panel state
 * Tracks debug events from APK and manages panel visibility
 * 
 * @returns {Object} Debug panel state and functions
 */
export function useDebugPanel() {
    const [debugEvents, setDebugEvents] = useState([]);
    const [showDebugPanel, setShowDebugPanel] = useState(false);

    const addDebugEvent = useCallback((event) => {
        setDebugEvents(prev => {
            const newEvents = [{
                ...event,
                timestamp: new Date().toISOString(),
                id: `${Date.now()}-${Math.random()}`,
            }, ...prev];

            // Keep only last 100 events to avoid memory issues
            return newEvents.slice(0, 100);
        });
    }, []);

    const clearDebugEvents = useCallback(() => {
        setDebugEvents([]);
    }, []);

    const toggleDebugPanel = useCallback(() => {
        setShowDebugPanel(prev => !prev);
    }, []);

    return {
        // State
        debugEvents,
        showDebugPanel,

        // Functions
        addDebugEvent,
        clearDebugEvents,
        setShowDebugPanel,
        toggleDebugPanel,
    };
}
