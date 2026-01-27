import { memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * GlassAINode - Premium glassmorphic AI Call API node
 * 
 * Features:
 * - Multi-provider support (OpenAI, Anthropic, Gemini, Groq, Custom)
 * - Dynamic model display
 * - Prompt preview with token estimate
 * - Secure token indicator
 * - Smart I/O handles with execution states
 */
function GlassAINode({ id, data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;

    // AI Configuration
    const provider = data?.provider || 'openai';
    const model = data?.model || 'gpt-4';
    const prompt = data?.prompt || '';
    const hasToken = !!data?.apiToken;
    const outputVariable = data?.outputVariable || 'aiResult';
    const temperature = data?.temperature ?? 0.7;

    // Provider config
    const providerConfig = useMemo(() => {
        const configs = {
            openai: { name: 'OpenAI', color: '#10b981', icon: '🤖' },
            anthropic: { name: 'Claude', color: '#8b5cf6', icon: '🧠' },
            gemini: { name: 'Gemini', color: '#3b82f6', icon: '✨' },
            groq: { name: 'Groq', color: '#f97316', icon: '⚡' },
            custom: { name: 'Custom', color: '#6b7280', icon: '🔧' },
        };
        return configs[provider] || configs.openai;
    }, [provider]);

    const color = providerConfig.color;

    // Estimate token count (rough: ~4 chars per token)
    const estimatedTokens = Math.ceil(prompt.length / 4);



    return (
        <>
            <div
                className={`group transition-all duration-300 ${selected ? 'scale-[1.02]' : ''} ${isRunning ? 'animate-pulse' : ''}`}
            >
                {/* Input Handle - Left */}
                <Handle
                    type="target"
                    position={Position.Left}
                    id="input"
                    className="!w-3 !h-3 !border-2 !rounded-full"
                    style={{
                        backgroundColor: isDark ? '#1f1f1f' : '#fff',
                        borderColor: isDark ? '#525252' : '#d1d5db',
                        left: '-6px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                    }}
                />

                {/* Main Card */}
                <div
                    className={`relative min-w-[260px] max-w-[340px] rounded-2xl overflow-hidden ${selected ? 'ring-2 ring-offset-2' : ''}`}
                    style={{
                        background: isDark
                            ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.9) 100%)'
                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: selected
                            ? `0 0 40px ${color}25, 0 8px 32px rgba(0, 0, 0, ${isDark ? '0.5' : '0.15'})`
                            : `0 8px 32px rgba(0, 0, 0, ${isDark ? '0.4' : '0.1'})`,
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                        ringColor: color,
                        ringOffsetColor: isDark ? '#0a0a0a' : '#ffffff',
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)` }}
                    >
                        <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${isRunning ? 'animate-bounce' : ''}`}
                            style={{
                                background: `linear-gradient(135deg, ${color}30 0%, ${color}15 100%)`,
                                boxShadow: `0 4px 12px ${color}30`,
                            }}
                        >
                            {isRunning ? '⏳' : isSuccess ? '✅' : isError ? '❌' : providerConfig.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold" style={{ color }}>
                                🤖 AI Call
                            </h3>
                            <p className={`text-[10px] truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {data?.label || 'AI API Integration'}
                            </p>
                        </div>
                        {/* Provider Badge */}
                        <span
                            className="px-2.5 py-1 rounded-lg text-xs font-bold"
                            style={{ backgroundColor: `${color}25`, color }}
                        >
                            {providerConfig.name}
                        </span>
                    </div>

                    {/* Body */}
                    <div className={`px-4 py-3 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                        {/* Model */}
                        <div className={`p-2.5 rounded-xl mb-3 ${isDark ? 'bg-black/30' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between">
                                <span className={`text-[10px] uppercase font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Model
                                </span>
                                <code className={`text-xs font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {model}
                                </code>
                            </div>
                        </div>

                        {/* Prompt Preview */}
                        {prompt && (
                            <div className={`p-2.5 rounded-xl mb-3 ${isDark ? 'bg-black/20' : 'bg-gray-50/80'}`}>
                                <p className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Prompt
                                </p>
                                <p className={`text-xs italic line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    "{prompt.slice(0, 80)}{prompt.length > 80 ? '...' : ''}"
                                </p>
                            </div>
                        )}

                        {/* Stats Row */}
                        <div className="flex items-center justify-between text-xs">
                            {/* Token indicator */}
                            <div className="flex items-center gap-1.5">
                                {hasToken ? (
                                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-500">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        Token Set
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 text-amber-500">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        No Token
                                    </span>
                                )}
                            </div>

                            {/* Temperature & tokens estimate */}
                            <div className="flex items-center gap-2">
                                <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    🌡️ {temperature}
                                </span>
                                {prompt && (
                                    <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        ~{estimatedTokens} tokens
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Output Variable */}
                        <div className={`mt-3 flex items-center gap-2 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <span>Output:</span>
                            <code className="text-cyan-400">{`{{${outputVariable}}}`}</code>
                        </div>
                    </div>

                    {/* Loading Indicator */}
                    {isRunning && (
                        <div className="h-1 w-full relative overflow-hidden">
                            <div
                                className="absolute inset-0 animate-progress"
                                style={{
                                    background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Output Handle - Right */}
                <Handle
                    type="source"
                    position={Position.Right}
                    id="output"
                    className="!w-3 !h-3 !border-2 !rounded-full transition-transform hover:!scale-125"
                    style={{
                        backgroundColor: isSuccess ? '#10b981' : isError ? '#ef4444' : (isDark ? color : `${color}20`),
                        borderColor: color,
                        right: '-6px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                    }}
                />

                <style jsx>{`
                @keyframes progress {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-progress {
                    animation: progress 1s ease-in-out infinite;
                }
            `}</style>
            </div>
        </>
    );
}

export default memo(GlassAINode);
