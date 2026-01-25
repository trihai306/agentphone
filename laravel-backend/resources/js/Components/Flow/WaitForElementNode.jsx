import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * WaitForElementNode - Chờ element xuất hiện với timeout
 * Layout: Horizontal (Input Left → Output Right)
 */
function WaitForElementNode({ data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const executionState = data?.executionState || 'idle';
    const progress = data?.progress || 0;
    const timeout = data?.timeout || 5000;
    const onTimeout = data?.onTimeout || 'skip';

    const isRunning = executionState === 'running';
    const isSuccess = executionState === 'success';
    const isTimeout = executionState === 'timeout';
    const isError = executionState === 'error';

    const color = '#3b82f6'; // Blue

    const getStatusIcon = () => {
        if (isRunning) return '⏳';
        if (isSuccess) return '✓';
        if (isTimeout) return '⏱';
        if (isError) return '✗';
        return '⏳';
    };

    const getStatusLabel = () => {
        if (isRunning) return 'Đang chờ...';
        if (isSuccess) return 'Đã tìm thấy';
        if (isTimeout) return 'Hết thời gian';
        if (isError) return 'Lỗi';
        return 'Chờ Element';
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
                className={`relative min-w-[200px] rounded-2xl overflow-hidden ${selected ? 'ring-2 ring-offset-2' : ''}`}
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
                    style={{ background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)` }}
                >
                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRunning ? 'animate-bounce' : ''}`}
                        style={{
                            background: `linear-gradient(135deg, ${color}30 0%, ${color}15 100%)`,
                            boxShadow: `0 4px 12px ${color}30`,
                        }}
                    >
                        <span className="text-lg">{getStatusIcon()}</span>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold" style={{ color: isSuccess ? '#10b981' : isError ? '#ef4444' : color }}>
                            {getStatusLabel()}
                        </h3>
                        <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {data?.label || 'Wait For Element'}
                        </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium`} style={{ backgroundColor: `${color}20`, color }}>
                        WAIT
                    </span>
                </div>

                {/* Progress Bar (when running) */}
                {isRunning && (
                    <div className={`h-1 ${isDark ? 'bg-black/30' : 'bg-gray-100'}`}>
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* Body */}
                <div className={`px-4 py-3 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    {/* Resource ID */}
                    {data?.resourceId && (
                        <div className={`text-xs font-mono px-2.5 py-1.5 rounded-lg mb-2 truncate ${isDark ? 'bg-black/30 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                            {data.resourceId}
                        </div>
                    )}

                    {/* Config row */}
                    <div className="flex items-center justify-between mt-2">
                        <div className={`flex items-center gap-1.5 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <span>⏱</span>
                            <span>{timeout / 1000}s</span>
                        </div>
                        <div className={`text-[10px] px-2 py-0.5 rounded ${onTimeout === 'skip'
                            ? isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'
                            : isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                            }`}>
                            {onTimeout === 'skip' ? '→ Skip' : '✗ Fail'}
                        </div>
                    </div>
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

export default memo(WaitForElementNode);
