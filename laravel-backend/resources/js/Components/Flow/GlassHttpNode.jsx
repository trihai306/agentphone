import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * GlassHttpNode - Premium glassmorphic HTTP request node
 */
function GlassHttpNode({ id, data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;

    const method = data?.method || 'GET';
    const url = data?.url || 'https://api.example.com';
    const responseTime = data?.responseTime;
    const statusCode = data?.statusCode;

    // Color based on HTTP method
    const getMethodColor = () => {
        switch (method) {
            case 'GET': return '#10b981';
            case 'POST': return '#3b82f6';
            case 'PUT': return '#f59e0b';
            case 'DELETE': return '#ef4444';
            default: return '#6366f1';
        }
    };
    const color = getMethodColor();

    return (
        <div className={`group transition-all duration-300 ${selected ? 'scale-[1.02]' : ''} ${isRunning ? 'animate-pulse' : ''}`}>
            {/* Top Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-4 !h-4 !border-[3px] !-top-2 transition-all duration-300 group-hover:!scale-110"
                style={{
                    backgroundColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : color,
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: `0 0 15px ${color}60`,
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
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{
                            background: `linear-gradient(135deg, ${color}30 0%, ${color}15 100%)`,
                            boxShadow: `0 4px 12px ${color}30`,
                        }}
                    >
                        <svg className="w-5 h-5" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold" style={{ color }}>
                            🌐 HTTP Request
                        </h3>
                        <p className={`text-[10px] truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {data?.label || 'API Call'}
                        </p>
                    </div>
                    {/* Method Badge */}
                    <span
                        className="px-2.5 py-1 rounded-lg text-xs font-bold"
                        style={{ backgroundColor: `${color}25`, color }}
                    >
                        {method}
                    </span>
                </div>

                {/* Body */}
                <div className={`px-4 py-3 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    {/* URL */}
                    <div className={`p-3 rounded-xl mb-3 ${isDark ? 'bg-black/30' : 'bg-gray-50'}`}>
                        <p className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            URL
                        </p>
                        <code className={`text-xs font-mono break-all ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {url}
                        </code>
                    </div>

                    {/* Status Info */}
                    {(statusCode || responseTime) && (
                        <div className="flex items-center justify-between text-xs">
                            {statusCode && (
                                <span className={`px-2 py-1 rounded font-bold ${statusCode >= 200 && statusCode < 300
                                        ? 'bg-emerald-500/20 text-emerald-500'
                                        : statusCode >= 400
                                            ? 'bg-red-500/20 text-red-500'
                                            : 'bg-yellow-500/20 text-yellow-500'
                                    }`}>
                                    {statusCode}
                                </span>
                            )}
                            {responseTime && (
                                <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                                    ⚡ {responseTime}ms
                                </span>
                            )}
                        </div>
                    )}

                    {/* Output */}
                    <div className={`mt-3 flex items-center gap-2 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <span>Output:</span>
                        <code className="text-cyan-400">{`{{response}}`}</code>
                    </div>
                </div>

                {/* Loading indicator */}
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

            {/* Bottom Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-4 !h-4 !border-[3px] !-bottom-2 transition-all duration-300 group-hover:!scale-110"
                style={{
                    backgroundColor: isSuccess ? '#10b981' : isError ? '#ef4444' : color,
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: `0 0 15px ${color}60`,
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
    );
}

export default memo(GlassHttpNode);
