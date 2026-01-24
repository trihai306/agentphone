/**
 * API Service - Base configuration and utilities
 * Provides unified API calling pattern across the application
 * 
 * Uses axios from window.axios (configured in bootstrap.js)
 * Falls back to creating new instance if not available
 */
import axios from 'axios';

// Get axios instance - prefer window.axios (configured with CSRF, base URL)
const getAxiosInstance = () => {
    if (typeof window !== 'undefined' && window.axios) {
        return window.axios;
    }

    // Fallback: create configured instance
    const instance = axios.create({
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    });

    // Add CSRF token if available
    instance.interceptors.request.use((config) => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (token) {
            config.headers['X-CSRF-TOKEN'] = token;
        }
        return config;
    });

    return instance;
};

const api = getAxiosInstance();

/**
 * Generic API response handler
 * Extracts data and handles common error patterns
 */
const handleResponse = (response) => {
    return {
        success: true,
        data: response.data,
        status: response.status,
    };
};

const handleError = (error) => {
    console.error('❌ API Error:', error.response?.data || error.message);
    return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status,
        data: error.response?.data,
    };
};

/**
 * Base API methods
 */
export const apiService = {
    get: async (url, config = {}) => {
        try {
            const response = await api.get(url, config);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    post: async (url, data = {}, config = {}) => {
        try {
            const response = await api.post(url, data, config);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    put: async (url, data = {}, config = {}) => {
        try {
            const response = await api.put(url, data, config);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    delete: async (url, config = {}) => {
        try {
            const response = await api.delete(url, config);
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Raw axios instance for special cases
    instance: api,
};

// ============================================================
// Domain-specific API modules
// ============================================================

/**
 * Flow API - Save/load workflows
 */
export const flowApi = {
    /**
     * Save flow state (nodes, edges, viewport)
     */
    saveState: async (flowId, { nodes, edges, viewport }) => {
        return apiService.post(`/flows/${flowId}/save-state`, { nodes, edges, viewport });
    },

    /**
     * Update flow name
     */
    updateName: async (flowId, name) => {
        return apiService.post(`/flows/${flowId}/update-name`, { name });
    },

    /**
     * Execute test run
     */
    testRun: async (flowId, { device_id, nodes, edges }) => {
        return apiService.post(`/flows/${flowId}/test-run`, { device_id, nodes, edges });
    },
};

/**
 * Device API - Device management and accessibility
 */
export const deviceApi = {
    /**
     * Check device accessibility status
     */
    checkAccessibility: async (deviceId) => {
        return apiService.post('/devices/check-accessibility', { device_id: deviceId });
    },

    /**
     * Get installed apps on device
     */
    getApps: async (deviceId) => {
        return apiService.post('/devices/apps', { device_id: deviceId });
    },

    /**
     * Send command to device
     */
    sendCommand: async (deviceId, command, params = {}) => {
        return apiService.post('/devices/command', { device_id: deviceId, command, ...params });
    },
};

/**
 * Recording API - Recording sessions
 */
export const recordingApi = {
    /**
     * Start recording session
     */
    start: async ({ flowId, deviceId, userId, targetApp }) => {
        return apiService.post('/recording-sessions/start', {
            flow_id: flowId,
            device_id: deviceId,
            user_id: userId,
            target_app: targetApp,
        });
    },

    /**
     * Stop recording session
     */
    stop: async (sessionId, { nodes, edges }) => {
        return apiService.post(`/recording-sessions/${sessionId}/stop`, { nodes, edges });
    },

    /**
     * Register recording listener
     */
    registerListener: async ({ deviceId, flowId, userId }) => {
        return apiService.post('/recording-listener/register', {
            device_id: deviceId,
            flow_id: flowId,
            user_id: userId,
        });
    },

    /**
     * Unregister recording listener
     */
    unregisterListener: async (deviceId) => {
        return apiService.post('/recording-listener/unregister', { device_id: deviceId });
    },
};

export default apiService;
