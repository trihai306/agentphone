import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * GlassWaitNode - Premium glassmorphic wait/delay node
 * Horizontal layout: Input (Left) → Output (Right)
 */
function GlassWaitNode({ id, data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;

    const duration = data?.duration || 1000;
    const color = '#6b7280'; // Gray for wait

    const formatDuration = (ms) => {
        if (ms >= 60000) return `${Math.floor(ms / 60000)}m ${((ms % 60000) / 1000)}s`;
        if (ms >= 1000) return `${ms / 1000}s`;
        return `${ms}ms`;
    };

    // Calculate progress for running state
    const progress = data?.progress || 0;

    return (
        <div className={`group transition-all duration-300 ${selected ? 'scale-[1.02]' : ''} ${isRunning ? 'animate-pulse' : ''}`}>
            {/* Input Handle - Left */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !border-2 !rounded-full"
                style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                    left: '-6px',
                    backgroundColor: isDark ? '#1f1f1f' : '#fff',
                    borderColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : color,
                }}
            />

            {/* Main Container */}
            <div
                className={`relative rounded-2xl overflow-hidden ${selected ? 'ring-2 ring-offset-2' : ''}`}
                style={{
                    minWidth: '180px',
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
                    className="flex items-center gap-3 px-4 py-2.5"
                    style={{ background: isRunning ? 'rgba(99, 102, 241, 0.15)' : `rgba(107, 114, 128, 0.1)` }}
                >
                    <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${isRunning ? 'animate-spin' : ''}`}
                        style={{
                            background: isRunning ? 'rgba(99, 102, 241, 0.3)' : 'rgba(107, 114, 128, 0.2)',
                            boxShadow: `0 4px 12px ${isRunning ? 'rgba(99, 102, 241, 0.3)' : 'rgba(107, 114, 128, 0.2)'}`,
                        }}
                    >
                        <svg className={`w-5 h-5 ${isRunning ? 'text-indigo-400' : isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-bold ${isRunning ? 'text-indigo-400' : 'text-gray-500'}`}>
                            {isRunning ? 'Waiting...' : 'Wait'}
                        </h3>
                        <p className={`text-[10px] truncate ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            {data?.label || 'Delay Execution'}
                        </p>
                    </div>
                    {/* Status Badge */}
                    {isSuccess && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400">
                            ✓
                        </span>
                    )}
                    {isError && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400">
                            ✗
                        </span>
                    )}
                </div>

                {/* Progress Bar (when running) */}
                {isRunning && (
                    <div className={`h-1 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* Body - Duration Display */}
                <div className={`px-4 py-3 flex items-center justify-center ${!isRunning ? `border-t ${isDark ? 'border-white/5' : 'border-black/5'}` : ''}`}>
                    <div className={`text-2xl font-bold font-mono tracking-tight ${isRunning ? 'text-indigo-400' : isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                        {formatDuration(duration)}
                    </div>
                </div>
            </div>

            {/* Output Handle - Right */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !border-2 !rounded-full transition-transform hover:!scale-125"
                style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                    right: '-6px',
                    backgroundColor: isSuccess ? '#10b981' : (isDark ? '#374151' : '#e5e7eb'),
                    borderColor: isSuccess ? '#22c55e' : color,
                }}
            />
        </div>
    );
}

export default memo(GlassWaitNode);
