import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * GlassAssertNode - Premium glassmorphic assertion/verification node
 * Horizontal layout: Input (Left) → Output (Right)
 */
function GlassAssertNode({ id, data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;

    const assertType = data?.assertType || 'exists';
    const color = '#22c55e'; // Green for assertions

    const assertConfigs = {
        exists: { label: 'Element Exists', icon: '🔍', desc: 'Tồn tại' },
        not_exists: { label: 'Not Exists', icon: '🚫', desc: 'Không tồn tại' },
        text: { label: 'Text Equals', icon: '📝', desc: 'Text khớp' },
        contains: { label: 'Contains', icon: '📄', desc: 'Chứa text' },
        visible: { label: 'Is Visible', icon: '👁', desc: 'Hiển thị' },
        enabled: { label: 'Is Enabled', icon: '✓', desc: 'Có thể thao tác' },
    };

    const config = assertConfigs[assertType] || assertConfigs.exists;

    // Status colors
    const statusColor = isError ? '#ef4444' : isSuccess ? '#10b981' : isRunning ? '#6366f1' : color;

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
                    borderColor: statusColor,
                }}
            />

            {/* Main Container */}
            <div
                className={`relative rounded-2xl overflow-hidden ${selected ? 'ring-2 ring-offset-2' : ''}`}
                style={{
                    minWidth: '200px',
                    background: isDark
                        ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.9) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: selected
                        ? `0 0 40px ${statusColor}25, 0 8px 32px rgba(0, 0, 0, ${isDark ? '0.5' : '0.15'})`
                        : `0 8px 32px rgba(0, 0, 0, ${isDark ? '0.4' : '0.1'})`,
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                    ringColor: statusColor,
                    ringOffsetColor: isDark ? '#0a0a0a' : '#ffffff',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-3 px-4 py-2.5"
                    style={{
                        background: isError
                            ? 'rgba(239, 68, 68, 0.15)'
                            : isSuccess
                                ? 'rgba(16, 185, 129, 0.15)'
                                : isRunning
                                    ? 'rgba(99, 102, 241, 0.15)'
                                    : `rgba(34, 197, 94, 0.1)`
                    }}
                >
                    <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${isRunning ? 'animate-spin' : ''}`}
                        style={{
                            background: isError
                                ? 'rgba(239, 68, 68, 0.3)'
                                : isSuccess
                                    ? 'rgba(16, 185, 129, 0.3)'
                                    : 'rgba(34, 197, 94, 0.2)',
                            boxShadow: `0 4px 12px ${statusColor}30`,
                        }}
                    >
                        {isSuccess ? (
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : isError ? (
                            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-bold ${isError ? 'text-red-400' : isSuccess ? 'text-emerald-400' : 'text-green-500'
                            }`}>
                            {isError ? 'Failed' : isSuccess ? 'Passed' : isRunning ? 'Checking...' : 'Assert'}
                        </h3>
                        <p className={`text-[10px] truncate ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            {data?.label || config.label}
                        </p>
                    </div>
                    {/* Type Badge */}
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                        }`}>
                        {config.icon}
                    </span>
                </div>

                {/* Body - Target Info */}
                <div className={`px-4 py-2.5 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    {data?.resourceId ? (
                        <div className={`text-xs font-mono px-2.5 py-1.5 rounded-lg truncate ${isDark ? 'bg-[#0f0f0f] text-gray-400' : 'bg-gray-50 text-gray-500'
                            }`}>
                            {data.resourceId}
                        </div>
                    ) : data?.expectedValue ? (
                        <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span className="font-medium">Expected:</span>
                            <span className="font-mono text-cyan-400">"{data.expectedValue}"</span>
                        </div>
                    ) : (
                        <p className={`text-xs italic ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            {config.desc}
                        </p>
                    )}
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
                    backgroundColor: isSuccess ? '#10b981' : isError ? '#ef4444' : (isDark ? '#374151' : '#e5e7eb'),
                    borderColor: statusColor,
                }}
            />
        </div>
    );
}

export default memo(GlassAssertNode);
