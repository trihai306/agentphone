import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * GlassNode - Premium glassmorphic node component
 * Base component for all workflow nodes with professional styling
 */
function GlassNode({
    id,
    data,
    selected,
    children,
    color = '#6366f1',
    icon,
    title,
    subtitle,
    showQuickAdd = true,
    handles = { left: true, right: true },
    className = '',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Execution state
    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;
    const isPending = executionState === NodeStatus.PENDING;

    // Dynamic colors based on execution state
    const getStateColor = () => {
        if (isRunning) return '#6366f1';
        if (isSuccess) return '#10b981';
        if (isError) return '#ef4444';
        if (isPending) return '#f59e0b';
        return color;
    };
    const stateColor = getStateColor();

    return (
        <div
            className={`group transition-all duration-300 ${selected ? 'scale-[1.02]' : ''} ${isRunning ? 'animate-pulse' : ''} ${className}`}
        >
            {/* Left Handle - Input (for horizontal flow) */}
            {handles.left && (
                <Handle
                    type="target"
                    position={Position.Left}
                    className="!w-4 !h-4 !border-[3px] !-left-2 transition-all duration-300 group-hover:!scale-110"
                    style={{
                        backgroundColor: stateColor,
                        borderColor: isDark ? '#0a0a0a' : '#ffffff',
                        boxShadow: `0 0 15px ${stateColor}60`,
                        top: '50%',
                        transform: 'translateY(-50%)',
                    }}
                />
            )}

            {/* Main Card */}
            <div
                className={`
                    relative min-w-[240px] max-w-[300px] rounded-2xl overflow-hidden
                    transition-all duration-300
                    ${selected ? 'ring-2 ring-offset-2' : ''}
                `}
                style={{
                    // Glassmorphic background
                    background: isDark
                        ? `linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.9) 100%)`
                        : `linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)`,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    // Premium shadow
                    boxShadow: selected
                        ? `0 0 40px ${stateColor}25, 0 8px 32px rgba(0, 0, 0, ${isDark ? '0.5' : '0.15'}), inset 0 1px 0 rgba(255,255,255,${isDark ? '0.05' : '0.5'})`
                        : `0 8px 32px rgba(0, 0, 0, ${isDark ? '0.4' : '0.1'}), inset 0 1px 0 rgba(255,255,255,${isDark ? '0.05' : '0.5'})`,
                    // Gradient border
                    border: `1px solid transparent`,
                    backgroundClip: 'padding-box',
                    ringColor: stateColor,
                    ringOffsetColor: isDark ? '#0a0a0a' : '#ffffff',
                }}
            >
                {/* Gradient Border Overlay */}
                <div
                    className="absolute inset-0 rounded-2xl -z-10"
                    style={{
                        background: `linear-gradient(135deg, ${stateColor}40 0%, transparent 50%, ${stateColor}20 100%)`,
                        padding: '1px',
                    }}
                />

                {/* Header */}
                <div
                    className="flex items-center gap-3 px-4 py-3 relative overflow-hidden"
                    style={{
                        background: `linear-gradient(135deg, ${stateColor}15 0%, ${stateColor}05 100%)`,
                    }}
                >
                    {/* Animated gradient shine */}
                    <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                            background: `linear-gradient(90deg, transparent 0%, ${stateColor}10 50%, transparent 100%)`,
                            animation: selected ? 'shimmer 2s infinite' : 'none',
                        }}
                    />

                    {/* Icon */}
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center relative z-10 transition-transform duration-300 group-hover:scale-110"
                        style={{
                            background: `linear-gradient(135deg, ${stateColor}30 0%, ${stateColor}15 100%)`,
                            boxShadow: `0 4px 12px ${stateColor}30`,
                        }}
                    >
                        {icon || (
                            <svg className="w-5 h-5" fill="none" stroke={stateColor} viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        )}
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0 relative z-10">
                        <h3
                            className="text-sm font-bold truncate"
                            style={{ color: stateColor }}
                        >
                            {title || data?.label || 'Node'}
                        </h3>
                        {subtitle && (
                            <p className={`text-[10px] truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* Status Indicator */}
                    {(isRunning || isSuccess || isError) && (
                        <div
                            className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'animate-pulse' : ''}`}
                            style={{ backgroundColor: stateColor, boxShadow: `0 0 8px ${stateColor}` }}
                        />
                    )}
                </div>

                {/* Body */}
                <div className={`px-4 py-3 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    {children}
                </div>

                {/* Execution Progress Bar */}
                {isRunning && (
                    <div className="h-0.5 w-full relative overflow-hidden">
                        <div
                            className="absolute inset-0 animate-progress"
                            style={{
                                background: `linear-gradient(90deg, transparent 0%, ${stateColor} 50%, transparent 100%)`,
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Right Handle - Output (for horizontal flow) */}
            {handles.right && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <Handle
                        type="source"
                        position={Position.Right}
                        className="!w-4 !h-4 !border-[3px] !-right-2 transition-all duration-300 group-hover:!scale-110"
                        style={{
                            backgroundColor: stateColor,
                            borderColor: isDark ? '#0a0a0a' : '#ffffff',
                            boxShadow: `0 0 15px ${stateColor}60`,
                        }}
                    />

                    {/* Quick Add Button - Shows on hover */}
                    {showQuickAdd && (
                        <button
                            className={`
                                absolute top-1/2 -translate-y-1/2 right-0 translate-x-8
                                w-6 h-6 rounded-full flex items-center justify-center
                                opacity-0 group-hover:opacity-100 group-hover:translate-x-10
                                transition-all duration-300 cursor-pointer z-10
                            `}
                            style={{
                                background: `linear-gradient(135deg, ${stateColor} 0%, ${stateColor}cc 100%)`,
                                boxShadow: `0 4px 12px ${stateColor}50`,
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (data?.onQuickAdd) {
                                    data.onQuickAdd(id);
                                }
                            }}
                        >
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    )}
                </div>
            )}

            {/* CSS for animations */}
            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
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

export default memo(GlassNode);
