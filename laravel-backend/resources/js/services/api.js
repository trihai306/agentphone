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

/**
 * AI Orchestration API - AI Agent node execution
 */
export const aiApi = {
    /**
     * Execute AI with tools and reasoning loop
     */
    execute: async ({ provider, model, apiToken, prompt, variables = {}, tools = [], memory = {}, temperature = 0.7, maxTokens = 2000, topP = 0.9 }) => {
        return apiService.post('/api/ai/execute', {
            provider,
            model,
            api_token: apiToken,
            prompt,
            variables,
            tools,
            memory,
            temperature,
            max_tokens: maxTokens,
            top_p: topP,
        });
    },

    /**
     * Test prompt (lightweight, no tools/memory)
     */
    testPrompt: async ({ provider, model, apiToken, prompt, temperature = 0.7 }) => {
        return apiService.post('/api/ai/test-prompt', {
            provider,
            model,
            api_token: apiToken,
            prompt,
            temperature,
        });
    },

    /**
     * Get available models for a provider (public endpoint)
     */
    getModels: async (provider) => {
        return apiService.get(`/api/ai/models/${provider}`);
    },

    /**
     * Estimate token count and cost
     */
    estimateTokens: async ({ text, model, provider }) => {
        return apiService.post('/api/ai/estimate-tokens', {
            text,
            model,
            provider,
        });
    },

    /**
     * Generate portrait image
     */
    generatePortrait: async (payload) => {
        return apiService.post('/api/ai/generate-portrait', payload);
    },
};

/**
 * AI Studio API - Image/Video generation, scenarios
 */
export const aiStudioApi = {
    // Generations
    getGenerationStatus: async (id) => apiService.get(`/ai-studio/generations/${id}/status`),
    generate: async (endpoint, payload) => apiService.post(endpoint, payload),
    generateImage: async (payload) => apiService.post('/ai-studio/generate-image', payload),
    generateVideo: async (payload) => apiService.post('/ai-studio/generate-video', payload),
    getActiveJobs: async () => apiService.get('/ai-studio/active-jobs'),
    estimateCost: async (payload) => apiService.post('/ai-studio/estimate-cost', payload),

    // Scenarios
    parseScenario: async (payload) => apiService.post('/ai-studio/scenarios/parse', payload),
    estimateScenario: async (payload) => apiService.post('/ai-studio/scenarios/estimate', payload),
    saveScenario: async (payload) => apiService.post('/ai-studio/scenarios', payload),
    generateScenario: async (id) => apiService.post(`/ai-studio/scenarios/${id}/generate`),
    getScenarioStatus: async (id) => apiService.get(`/ai-studio/scenarios/${id}/status`),
    deleteScenario: async (id) => apiService.delete(`/ai-studio/scenarios/${id}`),
};

/**
 * Media API - Media library operations
 */
export const mediaApi = {
    list: async (params = '') => apiService.get(`/media/list.json${params ? '?' + params : ''}`),
    getFolders: async () => apiService.get('/media/folders.json'),
    getStats: async () => apiService.get('/media/stats.json'),
    upload: async (formData, config = {}) => {
        try {
            const response = await api.post('/media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                ...config,
            });
            return handleResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
};

/**
 * Campaign API - Data collection records
 */
export const campaignApi = {
    getCollectionRecords: async (collectionId, perPage = 500) =>
        apiService.get(`/api/data-collections/${collectionId}/records?per_page=${perPage}`),
};

/**
 * Extended Flow API - Batch jobs
 */
flowApi.batchJobs = async (flowId, payload) =>
    apiService.post(`/api/flows/${flowId}/jobs/batch`, payload);

/**
 * Extended Recording API - Convert recording to nodes
 */
recordingApi.convertToNodes = async (payload) =>
    apiService.post('/api/recording/convert-to-nodes', payload);

/**
 * Extended Device API - Inspection
 */
deviceApi.inspect = async (deviceId) =>
    apiService.post('/devices/inspect', { device_id: deviceId });

deviceApi.getInspectScreenshot = async (screenshotKey) =>
    apiService.get(`/api/inspect-screenshot/${encodeURIComponent(screenshotKey)}`);

export default apiService;
