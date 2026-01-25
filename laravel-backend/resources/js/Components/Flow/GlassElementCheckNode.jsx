import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * GlassElementCheckNode - Premium glassmorphic element check with branching
 * Horizontal layout: Input (Left) → True/False (Right Top/Bottom)
 */
function GlassElementCheckNode({ id, data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;

    const checkType = data?.checkType || 'exists';
    const lastResult = data?.lastResult;
    const color = '#3b82f6'; // Blue

    const checkConfigs = {
        exists: { label: 'Exists', icon: '🔍' },
        not_exists: { label: 'Not Exists', icon: '🚫' },
        text_equals: { label: 'Text Equals', icon: '📝' },
        contains: { label: 'Contains', icon: '📄' },
        visible: { label: 'Is Visible', icon: '👁' },
    };

    const config = checkConfigs[checkType] || checkConfigs.exists;
    const targetDisplay = data?.resourceId || data?.text || data?.targetSelector || '';

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
                    borderColor: isDark ? '#525252' : '#d1d5db',
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
                    style={{ background: `rgba(59, 130, 246, 0.1)` }}
                >
                    <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${isRunning ? 'animate-bounce' : ''}`}
                        style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                            boxShadow: `0 4px 12px rgba(59, 130, 246, 0.3)`,
                        }}
                    >
                        <span className="text-lg">{config.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-blue-400">
                            Element Check
                        </h3>
                        <p className={`text-[10px] truncate ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            {data?.label || config.label}
                        </p>
                    </div>
                    {/* Result Badge */}
                    {lastResult !== undefined && (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${lastResult ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                            {lastResult ? 'TRUE' : 'FALSE'}
                        </span>
                    )}
                </div>

                {/* Body - Target Element */}
                <div className={`px-4 py-2.5 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    {targetDisplay ? (
                        <div className={`text-xs font-mono px-2.5 py-1.5 rounded-lg truncate ${isDark ? 'bg-[#0f0f0f] text-blue-400' : 'bg-blue-50 text-blue-600'
                            }`}>
                            {targetDisplay.length > 30 ? targetDisplay.slice(0, 30) + '...' : targetDisplay}
                        </div>
                    ) : (
                        <p className={`text-xs italic ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            Chưa chọn element
                        </p>
                    )}
                    {data?.expectedValue && (
                        <div className={`mt-2 flex items-center gap-2 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <span>=</span>
                            <span className="font-mono text-cyan-400">"{data.expectedValue}"</span>
                        </div>
                    )}
                </div>

                {/* Branch Labels */}
                <div className={`flex justify-between items-center px-4 py-2 text-[10px] font-bold border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-emerald-500">Found</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-red-400">Not Found</span>
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                    </div>
                </div>
            </div>

            {/* True/Found Handle - Right Top */}
            <Handle
                type="source"
                position={Position.Right}
                id="true"
                className="!w-3 !h-3 !border-2 !rounded-full transition-transform hover:!scale-125"
                style={{
                    top: '35%',
                    right: '-6px',
                    backgroundColor: isSuccess && lastResult === true ? '#10b981' : (isDark ? '#065f46' : '#d1fae5'),
                    borderColor: '#22c55e',
                }}
            />

            {/* False/Not Found Handle - Right Bottom */}
            <Handle
                type="source"
                position={Position.Right}
                id="false"
                className="!w-3 !h-3 !border-2 !rounded-full transition-transform hover:!scale-125"
                style={{
                    top: '65%',
                    right: '-6px',
                    backgroundColor: isSuccess && lastResult === false ? '#ef4444' : (isDark ? '#7f1d1d' : '#fee2e2'),
                    borderColor: '#f87171',
                }}
            />
        </div>
    );
}

export default memo(GlassElementCheckNode);
