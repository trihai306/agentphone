import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/Contexts/ThemeContext';
import { useToast } from '@/Components/Layout/ToastProvider';
import { Button } from '@/Components/UI';
import { aiApi } from '@/services/api';

/**
 * @deprecated AINodeConfigModal - DEPRECATED as of Jan 27, 2026
 * 
 * This modal is NO LONGER USED. AI nodes now use the standard NodeConfigPanel
 * sidebar pattern via AIConfig.jsx component (NodeConfig/basic/AIConfig.jsx).
 * 
 * Reason for deprecation: Custom modal caused modal-in-modal conflicts when
 * AI nodes were used inside Loop sub-flows. Migration to sidebar pattern
 * provides consistency with other node types and resolves nesting issues.
 * 
 * This file is kept for reference only and will be removed in future cleanup.
 * 
 * Migration: Jan 27, 2026
 * See: implementation_plan.md for migration details
 */

/**
 * AINodeConfigModal - Full-screen configuration modal for AI Agent node
 * 
 * Features:
 * - 5 tabs: LLM, Prompt, Tools, Memory, Output
 * - Visual prompt builder with variable chips
 * - Tool integration system
 * - Memory/context management
 * - Real-time token estimation
 * - Test prompt functionality
 */
export default function AINodeConfigModal({ isOpen, onClose, nodeData, onSave }) {
    const { theme } = useTheme();
    const { addToast } = useToast();
    const { t } = useTranslation();
    const isDark = theme === 'dark';

    const [activeTab, setActiveTab] = useState('llm');
    const [config, setConfig] = useState({
        provider: nodeData?.provider || 'openai',
        model: nodeData?.model || 'gpt-4-turbo',
        apiToken: nodeData?.apiToken || '',
        prompt: nodeData?.prompt || '',
        temperature: nodeData?.temperature ?? 0.7,
        maxTokens: nodeData?.maxTokens || 2000,
        topP: nodeData?.topP ?? 0.9,
        tools: nodeData?.tools || [],
        memory: nodeData?.memory || { type: 'none' },
        outputVariable: nodeData?.outputVariable || 'aiResult',
        parseJson: nodeData?.parseJson || false,
        isStreaming: nodeData?.isStreaming || false,
        errorHandling: nodeData?.errorHandling || 'stop',
    });

    const [estimatedTokens, setEstimatedTokens] = useState(0);
    const [estimatedCost, setEstimatedCost] = useState(0);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [availableModels, setAvailableModels] = useState([]);

    // Tabs configuration
    const tabs = [
        { id: 'llm', label: t('flow.ai.tabs.llm'), icon: '🧠' },
        { id: 'prompt', label: t('flow.ai.tabs.prompt'), icon: '✍️' },
        { id: 'tools', label: t('flow.ai.tabs.tools'), icon: '🔧' },
        { id: 'memory', label: t('flow.ai.tabs.memory'), icon: '💾' },
        { id: 'output', label: t('flow.ai.tabs.output'), icon: '📤' },
    ];

    // Provider configurations
    const providers = [
        { id: 'openai', name: 'OpenAI', color: '#10b981', models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'] },
        { id: 'anthropic', name: 'Claude', color: '#8b5cf6', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
        { id: 'gemini', name: 'Gemini', color: '#3b82f6', models: ['gemini-pro', 'gemini-pro-vision'] },
        { id: 'groq', name: 'Groq', color: '#f97316', models: ['llama3-70b', 'mixtral-8x7b'] },
        { id: 'custom', name: 'Custom API', color: '#6b7280', models: [] },
    ];

    const currentProvider = providers.find(p => p.id === config.provider) || providers[0];

    // Update config
    const updateConfig = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    // Load models when provider changes
    useEffect(() => {
        const loadModels = async () => {
            if (!config.provider) return;

            setIsLoadingModels(true);
            try {
                const response = await aiApi.getModels(config.provider);
                if (response.success && response.data.models) {
                    setAvailableModels(response.data.models);
                    // Auto-select first model if current model not in list
                    if (response.data.models.length > 0 && !response.data.models.find(m => m.id === config.model)) {
                        updateConfig('model', response.data.models[0].id);
                    }
                }
            } catch (error) {
                console.error('Failed to load models:', error);
            } finally {
                setIsLoadingModels(false);
            }
        };

        loadModels();
    }, [config.provider]);

    // Estimate tokens on prompt change (with debounce)
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (config.prompt && config.model) {
                try {
                    const response = await aiApi.estimateTokens({
                        text: config.prompt,
                        model: config.model,
                        provider: config.provider,
                    });

                    if (response.success && response.data) {
                        setEstimatedTokens(response.data.tokens);
                        setEstimatedCost(response.data.cost);
                    }
                } catch (error) {
                    // Fallback to rough estimate
                    const tokens = Math.ceil(config.prompt.length / 4);
                    setEstimatedTokens(tokens);
                    setEstimatedCost((tokens / 1000) * 0.01);
                }
            } else {
                setEstimatedTokens(0);
                setEstimatedCost(0);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [config.prompt, config.model, config.provider]);

    // Test prompt
    const handleTestPrompt = async () => {
        setIsTesting(true);
        setTestResult(null);

        try {
            const response = await aiApi.testPrompt({
                provider: config.provider,
                model: config.model,
                apiToken: config.apiToken,
                prompt: config.prompt,
                temperature: config.temperature,
            });

            if (response.success && response.data) {
                setTestResult({
                    success: true,
                    content: response.data.result,
                    tokens: response.data.tokens_used,
                    cost: response.data.cost,
                    responseTime: response.data.debug?.response_time_ms,
                });
                addToast(`✅ Test successful! Tokens: ${response.data.tokens_used}`, 'success');
            } else {
                throw new Error(response.error || 'Test failed');
            }
        } catch (error) {
            setTestResult({
                success: false,
                error: error.message || 'Unknown error',
            });
            addToast('❌ Test failed: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            setIsTesting(false);
        }
    };

    // Save configuration
    const handleSave = () => {
        onSave(config);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div
                className={`relative w-full max-w-6xl h-[90vh] rounded-3xl overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'
                    } shadow-2xl`}
                style={{
                    background: isDark
                        ? 'linear-gradient(135deg, rgba(17, 24, 39, 0.98) 0%, rgba(31, 41, 55, 0.95) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(249, 250, 251, 0.95) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                }}
            >
                {/* Header */}
                <div
                    className={`flex items-center justify-between px-8 py-6 border-b ${isDark ? 'border-white/10' : 'border-black/10'
                        }`}
                    style={{
                        background: `linear-gradient(135deg, ${currentProvider.color}15 0%, ${currentProvider.color}05 100%)`,
                    }}
                >
                    <div>
                        <h2 className="text-2xl font-bold" style={{ color: currentProvider.color }}>
                            🤖 {t('flow.ai.configTitle')}
                        </h2>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t('flow.ai.configSubtitle')}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon-xs" onClick={onClose}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </Button>
                </div>

                {/* Tabs Navigation */}
                <div className={`flex gap-2 px-8 py-4 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === tab.id
                                ? `${isDark ? 'bg-white/10' : 'bg-black/5'} shadow-lg`
                                : `${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`
                                }`}
                            style={{
                                color: activeTab === tab.id ? currentProvider.color : (isDark ? '#9ca3af' : '#6b7280'),
                                borderBottom: activeTab === tab.id ? `2px solid ${currentProvider.color}` : 'none',
                            }}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-8" style={{ height: 'calc(90vh - 220px)' }}>
                    {activeTab === 'llm' && (
                        <LLMTab
                            config={config}
                            updateConfig={updateConfig}
                            providers={providers}
                            currentProvider={currentProvider}
                            availableModels={availableModels}
                            isLoadingModels={isLoadingModels}
                            isDark={isDark}
                            t={t}
                        />
                    )}

                    {activeTab === 'prompt' && (
                        <PromptTab
                            config={config}
                            updateConfig={updateConfig}
                            estimatedTokens={estimatedTokens}
                            estimatedCost={estimatedCost}
                            isDark={isDark}
                            t={t}
                        />
                    )}

                    {activeTab === 'tools' && (
                        <ToolsTab
                            config={config}
                            updateConfig={updateConfig}
                            isDark={isDark}
                            t={t}
                        />
                    )}

                    {activeTab === 'memory' && (
                        <MemoryTab
                            config={config}
                            updateConfig={updateConfig}
                            isDark={isDark}
                            t={t}
                        />
                    )}

                    {activeTab === 'output' && (
                        <OutputTab
                            config={config}
                            updateConfig={updateConfig}
                            isDark={isDark}
                            t={t}
                        />
                    )}
                </div>

                {/* Footer Actions */}
                <div className={`flex items-center justify-between px-8 py-6 border-t ${isDark ? 'border-white/10' : 'border-black/10'
                    }`}>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="secondary"
                            onClick={handleTestPrompt}
                            disabled={isTesting || !config.prompt}
                        >
                            {isTesting ? (
                                <>⏳ {t('flow.ai.testing')}</>
                            ) : (
                                <>🧪 {t('flow.ai.test')}</>
                            )}
                        </Button>
                        {estimatedTokens > 0 && (
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                ~{estimatedTokens} tokens · ${estimatedCost.toFixed(4)}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="secondary" onClick={onClose}>
                            {t('common.cancel')}
                        </Button>
                        <Button variant="gradient" onClick={handleSave}>
                            💾 {t('common.save')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Tab Components (will be extracted to separate files later)
function LLMTab({ config, updateConfig, providers, currentProvider, availableModels, isLoadingModels, isDark, t }) {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold" style={{ color: currentProvider.color }}>
                {t('flow.ai.llm.title')}
            </h3>

            {/* Provider Selection */}
            <div>
                <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('flow.ai.llm.provider')}
                </label>
                <div className="grid grid-cols-5 gap-3">
                    {providers.map(provider => (
                        <button
                            key={provider.id}
                            onClick={() => {
                                updateConfig('provider', provider.id);
                                if (provider.models.length > 0) {
                                    updateConfig('model', provider.models[0]);
                                }
                            }}
                            className={`p-4 rounded-xl font-medium transition-all ${config.provider === provider.id
                                ? 'ring-2 shadow-lg'
                                : `${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`
                                }`}
                            style={{
                                background: config.provider === provider.id
                                    ? `linear-gradient(135deg, ${provider.color}20 0%, ${provider.color}10 100%)`
                                    : undefined,
                                ringColor: config.provider === provider.id ? provider.color : undefined,
                                color: config.provider === provider.id ? provider.color : undefined,
                            }}
                        >
                            {provider.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Model Selection */}
            <div>
                <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('flow.ai.llm.model')}
                    {isLoadingModels && <span className="ml-2 text-xs">⏳ Loading...</span>}
                </label>
                <select
                    value={config.model}
                    onChange={(e) => updateConfig('model', e.target.value)}
                    disabled={isLoadingModels}
                    className={`w-full px-4 py-3 rounded-xl font-medium ${isDark
                        ? 'bg-white/10 text-white border-white/20'
                        : 'bg-gray-50 border-gray-200'
                        } border ${isLoadingModels ? 'opacity-50 cursor-wait' : ''}`}
                >
                    {availableModels.length > 0 ? (
                        availableModels.map(model => (
                            <option key={model.id} value={model.id}>
                                {model.name} ({Math.floor(model.max_tokens / 1000)}K tokens)
                            </option>
                        ))
                    ) : (
                        <option value="">{isLoadingModels ? 'Loading models...' : 'No models available'}</option>
                    )}
                </select>
            </div>

            {/* API Token */}
            <div>
                <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('flow.ai.llm.apiToken')}
                    <span className="ml-2 text-xs text-amber-500">({t('common.secure')})</span>
                </label>
                <input
                    type="password"
                    value={config.apiToken}
                    onChange={(e) => updateConfig('apiToken', e.target.value)}
                    placeholder="sk-..."
                    className={`w-full px-4 py-3 rounded-xl font-mono ${isDark
                        ? 'bg-white/10 text-white border-white/20'
                        : 'bg-gray-50 border-gray-200'
                        } border`}
                />
            </div>

            {/* Advanced Parameters */}
            <details className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <summary className="font-semibold cursor-pointer">
                    {t('flow.ai.llm.advanced')}
                </summary>
                <div className="mt-4 space-y-4">
                    {/* Temperature */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Temperature: {config.temperature}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={config.temperature}
                            onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    {/* Max Tokens */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Max Tokens
                        </label>
                        <input
                            type="number"
                            value={config.maxTokens}
                            onChange={(e) => updateConfig('maxTokens', parseInt(e.target.value))}
                            className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-white/10 text-white' : 'bg-white border'}`}
                        />
                    </div>

                    {/* Top P */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Top P: {config.topP}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={config.topP}
                            onChange={(e) => updateConfig('topP', parseFloat(e.target.value))}
                            className="w-full"
                        />
                    </div>
                </div>
            </details>
        </div>
    );
}

function PromptTab({ config, updateConfig, estimatedTokens, estimatedCost, isDark, t }) {
    // TODO: Implement visual prompt builder with variable chips
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-cyan-500">
                {t('flow.ai.prompt.title')}
            </h3>
            <textarea
                value={config.prompt}
                onChange={(e) => updateConfig('prompt', e.target.value)}
                placeholder={t('flow.ai.prompt.placeholder')}
                className={`w-full h-96 px-4 py-3 rounded-xl font-mono resize-none ${isDark ? 'bg-white/10 text-white border-white/20' : 'bg-gray-50 border-gray-200'
                    } border`}
            />
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                ~{estimatedTokens} tokens · ${estimatedCost.toFixed(4)} estimated
            </div>
        </div>
    );
}

function ToolsTab({ config, updateConfig, isDark, t }) {
    // TODO: Implement tool selection and configuration
    return (
        <div className="text-center py-20">
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                🔧 Tool integration coming soon...
            </p>
        </div>
    );
}

function MemoryTab({ config, updateConfig, isDark, t }) {
    // TODO: Implement memory configuration
    return (
        <div className="text-center py-20">
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                💾 Memory management coming soon...
            </p>
        </div>
    );
}

function OutputTab({ config, updateConfig, isDark, t }) {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-green-500">
                {t('flow.ai.output.title')}
            </h3>

            <div>
                <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Output Variable
                </label>
                <input
                    type="text"
                    value={config.outputVariable}
                    onChange={(e) => updateConfig('outputVariable', e.target.value)}
                    placeholder="aiResult"
                    className={`w-full px-4 py-3 rounded-xl font-mono ${isDark ? 'bg-white/10 text-white border-white/20' : 'bg-gray-50 border-gray-200'
                        } border`}
                />
            </div>

            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={config.parseJson}
                        onChange={(e) => updateConfig('parseJson', e.target.checked)}
                        className="w-5 h-5 rounded"
                    />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                        Parse JSON Response
                    </span>
                </label>
            </div>
        </div>
    );
}
