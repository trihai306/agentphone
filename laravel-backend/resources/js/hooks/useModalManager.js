import { useReducer, useCallback } from 'react';

/**
 * Modal state management using reducer pattern
 * Manages all modals in the Flow Editor
 */

export const MODAL_TYPES = {
    MEDIA_PICKER: 'mediaPicker',
    COLLECTION_PICKER: 'collectionPicker',
    LOOP_SUBFLOW: 'loopSubFlow',
    PREVIEW: 'preview',
    EDGE_DELAY: 'edgeDelay',
    LANG_DROPDOWN: 'langDropdown',
    DEVICE_SELECTOR: 'deviceSelector',
    CLEAR_CONFIRM: 'clearConfirm',
    AI_CONFIG: 'aiConfig', // NEW: AI node configuration modal
};

const initialState = {
    mediaPicker: { isOpen: false, nodeId: null },
    collectionPicker: { isOpen: false, nodeId: null },
    loopSubFlow: { isOpen: false, nodeId: null },
    preview: { isOpen: false },
    edgeDelay: { isOpen: false, edge: null, position: { x: 0, y: 0 } },
    langDropdown: { isOpen: false },
    deviceSelector: { isOpen: false },
    clearConfirm: { isOpen: false },
    aiConfig: { isOpen: false, nodeId: null }, // NEW: AI config modal state
};

function modalReducer(state, action) {
    switch (action.type) {
        case 'OPEN_MODAL':
            return {
                ...state,
                [action.modal]: {
                    ...state[action.modal],
                    isOpen: true,
                    ...action.payload,
                },
            };
        case 'CLOSE_MODAL':
            return {
                ...state,
                [action.modal]: {
                    ...initialState[action.modal],
                    isOpen: false,
                },
            };
        case 'CLOSE_ALL':
            return initialState;
        default:
            return state;
    }
}

/**
 * Custom hook to manage all modal states in Flow Editor
 * 
 * @returns {Object} Modal states and control functions
 */
export function useModalManager() {
    const [modals, dispatch] = useReducer(modalReducer, initialState);

    const openModal = useCallback((modalType, payload = {}) => {
        dispatch({ type: 'OPEN_MODAL', modal: modalType, payload });
    }, []);

    const closeModal = useCallback((modalType) => {
        dispatch({ type: 'CLOSE_MODAL', modal: modalType });
    }, []);

    const closeAllModals = useCallback(() => {
        dispatch({ type: 'CLOSE_ALL' });
    }, []);

    // Specific helper functions for common modals
    const openMediaPicker = useCallback((nodeId) => {
        openModal(MODAL_TYPES.MEDIA_PICKER, { nodeId });
    }, [openModal]);

    const openCollectionPicker = useCallback((nodeId) => {
        openModal(MODAL_TYPES.COLLECTION_PICKER, { nodeId });
    }, [openModal]);

    const openLoopSubFlow = useCallback((nodeId) => {
        openModal(MODAL_TYPES.LOOP_SUBFLOW, { nodeId });
    }, [openModal]);

    const openEdgeDelay = useCallback((edge, position) => {
        openModal(MODAL_TYPES.EDGE_DELAY, { edge, position });
    }, [openModal]);

    const openAIConfig = useCallback((nodeId) => {
        openModal(MODAL_TYPES.AI_CONFIG, { nodeId });
    }, [openModal]);


    return {
        // State
        modals,

        // Generic controls
        openModal,
        closeModal,
        closeAllModals,

        // Specific helpers
        openMediaPicker,
        openCollectionPicker,
        openLoopSubFlow,
        openEdgeDelay,
        openAIConfig, // NEW

        // Modal type constants
        MODAL_TYPES,
    };
}
