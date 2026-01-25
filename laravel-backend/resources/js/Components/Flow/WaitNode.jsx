import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * WaitNode - Delays workflow execution for specified duration
 * Layout: Horizontal (Input Left → Output Right)
 */
function WaitNode({ data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;

    const duration = data?.duration || 1000;
    const color = '#6b7280'; // Gray

    const formatDuration = (ms) => {
        if (ms >= 1000) return `${ms / 1000}s`;
        return `${ms}ms`;
    };

    return (
        <div className={`group transition-all duration-300 ${selected ? 'scale-[1.02]' : ''} ${isRunning ? 'animate-pulse' : ''}`}>
            {/* Input Handle - Left */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-4 !h-4 !border-[3px] !-left-2 transition-all duration-300 group-hover:!scale-110"
                style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : color,
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: `0 0 15px ${color}60`,
                }}
            />

            {/* Main Card */}
            <div
                className={`relative min-w-[180px] rounded-2xl overflow-hidden ${selected ? 'ring-2 ring-offset-2' : ''}`}
                style={{
                    background: isDark
                        ? `linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.9) 100%)`
                        : `linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)`,
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
                    style={{ background: isRunning ? 'rgba(99, 102, 241, 0.15)' : `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)` }}
                >
                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRunning ? 'animate-spin' : ''}`}
                        style={{
                            background: isRunning ? 'rgba(99, 102, 241, 0.3)' : `linear-gradient(135deg, ${color}30 0%, ${color}15 100%)`,
                            boxShadow: `0 4px 12px ${color}30`,
                        }}
                    >
                        <svg className={`w-5 h-5 ${isRunning ? 'text-indigo-400' : ''}`} fill="none" stroke={isRunning ? '#818cf8' : color} viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold" style={{ color: isRunning ? '#818cf8' : color }}>
                            {isRunning ? '⏳ Waiting...' : '⏱️ Wait'}
                        </h3>
                        <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {data?.label || 'Chờ'}
                        </p>
                    </div>
                    {/* Duration Badge */}
                    <span
                        className="px-2 py-1 rounded-lg text-xs font-bold"
                        style={{ backgroundColor: `${color}20`, color }}
                    >
                        {formatDuration(duration)}
                    </span>
                </div>
            </div>

            {/* Output Handle - Right */}
            <Handle
                type="source"
                position={Position.Right}
                id="true"
                className="!w-4 !h-4 !border-[3px] !-right-2 transition-transform hover:!scale-125"
                style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: isSuccess ? '#10b981' : '#22c55e',
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: '0 0 15px rgba(34, 197, 94, 0.5)',
                }}
            />
        </div>
    );
}

export default memo(WaitNode);
