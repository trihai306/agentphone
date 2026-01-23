import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook to manage flow persistence (auto-save, manual save)
 * Handles flow name editing and save state
 * 
 * @param {Object} config - Configuration
 * @param {Object} config.flow - Flow object with id and name
 * @param {Array} config.nodes - Current nodes array
 * @param {Array} config.edges - Current edges array
 * @param {Object} config.viewport - Current viewport state
 * @returns {Object} Persistence state and functions
 */
export function useFlowPersistence({ flow, nodes, edges, viewport }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [flowName, setFlowName] = useState(flow.name);
    const [editingName, setEditingName] = useState(false);

    const saveTimeoutRef = useRef(null);

    // Auto-save flow data when nodes/edges/viewport change
    useEffect(() => {
        // Clear previous timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Debounce save - wait 2 seconds after last change
        saveTimeoutRef.current = setTimeout(() => {
            saveFlow();
        }, 2000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [nodes, edges, viewport]);

    // Save flow data to server
    const saveFlow = useCallback(async () => {
        if (!flow?.id) {
            console.warn('⚠️ useFlowPersistence: No flow ID');
            return;
        }

        setSaving(true);

        try {
            const response = await window.axios.post(`/flows/${flow.id}/save`, {
                nodes,
                edges,
                viewport,
                name: flowName,
            });

            if (response.data.success) {
                setLastSaved(new Date());
                console.log('✅ useFlowPersistence: Flow saved');
                return { success: true };
            }
            return { success: false, error: response.data.message };
        } catch (error) {
            console.error('❌ useFlowPersistence: Save failed:', error);
            return { success: false, error: error.message };
        } finally {
            setSaving(false);
        }
    }, [flow?.id, nodes, edges, viewport, flowName]);

    // Save flow name
    const saveName = useCallback(async (newName) => {
        if (!flow?.id || !newName) {
            console.warn('⚠️ useFlowPersistence: Invalid flow ID or name');
            return;
        }

        try {
            const response = await window.axios.post(`/flows/${flow.id}/update-name`, {
                name: newName,
            });

            if (response.data.success) {
                setFlowName(newName);
                setEditingName(false);
                console.log('✅ useFlowPersistence: Name saved:', newName);
                return { success: true };
            }
            return { success: false, error: response.data.message };
        } catch (error) {
            console.error('❌ useFlowPersistence: Name save failed:', error);
            return { success: false, error: error.message };
        }
    }, [flow?.id]);

    return {
        // State
        saving,
        lastSaved,
        flowName,
        editingName,

        // Functions
        setFlowName,
        setEditingName,
        saveFlow,
        saveName,
    };
}
