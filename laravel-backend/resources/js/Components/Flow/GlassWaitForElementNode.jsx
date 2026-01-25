import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * GlassWaitForElementNode - Premium glassmorphic wait for element node
 * Horizontal layout: Input (Left) → Output (Right)
 * Features: Progress bar, timeout display, action badge
 */
function GlassWaitForElementNode({ id, data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === 'running';
    const isSuccess = executionState === 'success';
    const isTimeout = executionState === 'timeout';
    const isError = executionState === 'error';

    const timeout = data?.timeout || 5000;
    const onTimeout = data?.onTimeout || 'skip';
    const progress = data?.progress || 0;
    const color = '#8b5cf6'; // Purple for wait-for

    const targetDisplay = data?.resourceId || data?.text || '';

    // Status config
    const getStatusConfig = () => {
        if (isRunning) return { label: 'Đang chờ...', text: 'text-indigo-400', bg: 'rgba(99, 102, 241, 0.15)' };
        if (isSuccess) return { label: 'Tìm thấy!', text: 'text-emerald-400', bg: 'rgba(16, 185, 129, 0.15)' };
        if (isTimeout) return { label: 'Hết thời gian', text: 'text-amber-400', bg: 'rgba(245, 158, 11, 0.15)' };
        if (isError) return { label: 'Lỗi', text: 'text-red-400', bg: 'rgba(239, 68, 68, 0.15)' };
        return { label: 'Wait For Element', text: 'text-violet-400', bg: 'rgba(139, 92, 246, 0.1)' };
    };

    const status = getStatusConfig();

    return (
        <div className={`group transition-all duration-300 ${selected ? 'scale-[1.02]' : ''}`}>
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
                    borderColor: isRunning ? '#6366f1' : color,
                }}
            />

            {/* Main Container */}
            <div
                className={`relative rounded-2xl overflow-hidden ${selected ? 'ring-2 ring-offset-2' : ''}`}
                style={{
                    minWidth: '220px',
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
                    style={{ background: status.bg }}
                >
                    <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${isRunning ? 'animate-bounce' : ''}`}
                        style={{
                            background: 'rgba(139, 92, 246, 0.2)',
                            boxShadow: `0 4px 12px rgba(139, 92, 246, 0.3)`,
                        }}
                    >
                        <span className="text-lg">{isRunning ? '⏳' : isSuccess ? '✓' : isTimeout ? '⏱' : '🔍'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-bold ${status.text}`}>
                            {status.label}
                        </h3>
                        <p className={`text-[10px] truncate ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            {data?.label || 'Chờ element xuất hiện'}
                        </p>
                    </div>
                    {/* Timeout Badge */}
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600'
                        }`}>
                        {timeout / 1000}s
                    </span>
                </div>

                {/* Progress Bar (when running) */}
                {isRunning && (
                    <div className={`h-1 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                        <div
                            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* Body - Target Element */}
                <div className={`px-4 py-2.5 ${!isRunning ? `border-t ${isDark ? 'border-white/5' : 'border-black/5'}` : ''}`}>
                    {targetDisplay ? (
                        <div className={`text-xs font-mono px-2.5 py-1.5 rounded-lg truncate ${isDark ? 'bg-[#0f0f0f] text-violet-400' : 'bg-violet-50 text-violet-600'
                            }`}>
                            {targetDisplay.length > 30 ? targetDisplay.slice(0, 30) + '...' : targetDisplay}
                        </div>
                    ) : (
                        <p className={`text-xs italic ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            Chưa chọn element
                        </p>
                    )}

                    {/* Timeout Action */}
                    <div className={`mt-2 text-[10px] px-2 py-1 rounded inline-block ${onTimeout === 'skip'
                            ? isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'
                            : isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                        }`}>
                        {onTimeout === 'skip' ? '→ Skip nếu hết thời gian' : '✗ Fail nếu hết thời gian'}
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

export default memo(GlassWaitForElementNode);
