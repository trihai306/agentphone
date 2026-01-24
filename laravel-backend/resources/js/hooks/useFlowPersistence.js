import { useState, useRef, useCallback, useEffect } from 'react';
import { flowApi } from '@/services/api';

/**
 * Custom hook to manage flow persistence (auto-save, manual save)
 * Handles flow name editing and save state
 * 
 * @param {Object} config - Configuration
 * @param {Object} config.flow - Flow object with id and name
 * @param {boolean} config.autoSaveEnabled - Whether auto-save is enabled (default: false)
 * @param {number} config.autoSaveDelay - Delay in ms before auto-save triggers (default: 1000)
 * @returns {Object} Persistence state and functions
 */
export function useFlowPersistence({ flow, autoSaveEnabled = false, autoSaveDelay = 1000 }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [flowName, setFlowName] = useState(flow.name);
    const [editingName, setEditingName] = useState(false);

    const saveTimeoutRef = useRef(null);

    // Save flow data to server
    const saveFlow = useCallback(async (nodes, edges, viewport) => {
        if (!flow?.id) {
            console.warn('⚠️ useFlowPersistence: No flow ID');
            return { success: false, error: 'No flow ID' };
        }

        setSaving(true);

        try {
            const result = await flowApi.saveState(flow.id, { nodes, edges, viewport });

            if (result.success) {
                setLastSaved(new Date(result.data.saved_at));
                return { success: true };
            }
            return { success: false, error: result.error || 'Save failed' };
        } catch (error) {
            console.error('❌ useFlowPersistence: Save failed:', error);
            return { success: false, error: error.message };
        } finally {
            setSaving(false);
        }
    }, [flow?.id]);

    // Debounced save - triggers after delay, can be called multiple times
    const debouncedSave = useCallback((nodes, edges, viewport) => {
        if (!autoSaveEnabled) return;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            saveFlow(nodes, edges, viewport);
        }, autoSaveDelay);
    }, [autoSaveEnabled, autoSaveDelay, saveFlow]);

    // Manual save - immediate, no debouncing
    const manualSave = useCallback(async (nodes, edges, viewport) => {
        // Clear any pending debounced save
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }
        return saveFlow(nodes, edges, viewport);
    }, [saveFlow]);

    // Save flow name
    const saveName = useCallback(async (newName) => {
        if (!flow?.id || !newName) {
            console.warn('⚠️ useFlowPersistence: Invalid flow ID or name');
            return { success: false, error: 'Invalid flow ID or name' };
        }

        try {
            const result = await flowApi.updateName(flow.id, newName);

            if (result.success) {
                setFlowName(newName);
                setEditingName(false);
                return { success: true };
            }
            return { success: false, error: result.error || 'Name save failed' };
        } catch (error) {
            console.error('❌ useFlowPersistence: Name save failed:', error);
            return { success: false, error: error.message };
        }
    }, [flow?.id]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return {
        // State
        saving,
        lastSaved,
        flowName,
        editingName,

        // Setters  
        setFlowName,
        setEditingName,

        // Actions
        saveFlow,
        debouncedSave,
        manualSave,
        saveName,
    };
}
