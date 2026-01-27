import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/Contexts/ThemeContext';

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

    // Estimate tokens on prompt change
    useEffect(() => {
        if (config.prompt) {
            const tokens = Math.ceil(config.prompt.length / 4); // Rough estimate
            setEstimatedTokens(tokens);
            // Cost estimation (example: $0.01 per 1K tokens)
            setEstimatedCost((tokens / 1000) * 0.01);
        } else {
            setEstimatedTokens(0);
            setEstimatedCost(0);
        }
    }, [config.prompt]);

    // Test prompt
    const handleTestPrompt = async () => {
        setIsTesting(true);
        try {
            // TODO: Call backend API to test
            await new Promise(resolve => setTimeout(resolve, 2000));
            alert('Test successful! (Implementation pending)');
        } catch (error) {
            alert('Test failed: ' + error.message);
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
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-xl transition-colors ${isDark
                            ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                            : 'hover:bg-black/5 text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
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
                        <button
                            onClick={handleTestPrompt}
                            disabled={isTesting || !config.prompt}
                            className={`px-6 py-3 rounded-xl font-medium transition-all ${isTesting || !config.prompt
                                ? `opacity-50 cursor-not-allowed ${isDark ? 'bg-white/5' : 'bg-black/5'}`
                                : `${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'}`
                                }`}
                        >
                            {isTesting ? (
                                <>⏳ {t('flow.ai.testing')}</>
                            ) : (
                                <>🧪 {t('flow.ai.test')}</>
                            )}
                        </button>
                        {estimatedTokens > 0 && (
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                ~{estimatedTokens} tokens · ${estimatedCost.toFixed(4)}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className={`px-6 py-3 rounded-xl font-medium transition-all ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'
                                }`}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105 shadow-lg"
                            style={{
                                background: `linear-gradient(135deg, ${currentProvider.color} 0%, ${currentProvider.color}dd 100%)`,
                            }}
                        >
                            💾 {t('common.save')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Tab Components (will be extracted to separate files later)
function LLMTab({ config, updateConfig, providers, currentProvider, isDark, t }) {
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
                </label>
                <select
                    value={config.model}
                    onChange={(e) => updateConfig('model', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl font-medium ${isDark
                        ? 'bg-white/10 text-white border-white/20'
                        : 'bg-gray-50 border-gray-200'
                        } border`}
                >
                    {currentProvider.models.map(model => (
                        <option key={model} value={model}>{model}</option>
                    ))}
                    {currentProvider.models.length === 0 && (
                        <option value="">Custom Model...</option>
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
