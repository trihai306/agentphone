import { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * WaitNode - Delays workflow execution for specified duration
 */
function WaitNode({ data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;

    const duration = data?.duration || 1000;
    const formatDuration = (ms) => {
        if (ms >= 1000) return `${ms / 1000}s`;
        return `${ms}ms`;
    };

    return (
        <div className={`transition-all duration-300 ${selected ? 'scale-105' : ''} ${isRunning ? 'animate-pulse' : ''}`}>
            <Handle
                type="target"
                position={Position.Top}
                className={`!w-3 !h-3 !border-0 !-top-1.5 transition-all`}
                style={{
                    backgroundColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : '#6b7280',
                    boxShadow: '0 0 8px rgba(107, 114, 128, 0.5)'
                }}
            />

            <div
                className={`relative min-w-[140px] rounded-xl overflow-hidden transition-all duration-300
                    ${selected ? `ring-2 ring-gray-500 ring-offset-2 ${isDark ? 'ring-offset-[#0a0a0a]' : 'ring-offset-white'}` : ''}`}
                style={{
                    background: isDark
                        ? 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)'
                        : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)',
                    border: `1px solid ${isDark ? '#252525' : '#e5e7eb'}`,
                }}
            >
                <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ background: isRunning ? 'rgba(99, 102, 241, 0.15)' : 'rgba(107, 114, 128, 0.1)' }}
                >
                    <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${isRunning ? 'animate-spin' : ''}`}
                        style={{ background: isRunning ? 'rgba(99, 102, 241, 0.3)' : 'rgba(107, 114, 128, 0.2)' }}
                    >
                        <svg className={`w-4 h-4 ${isRunning ? 'text-indigo-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isRunning ? 'text-indigo-400' : 'text-gray-500'}`}>
                        {isRunning ? 'Waiting...' : 'Wait'}
                    </span>
                </div>

                <div className={`px-3 py-3 border-t ${isDark ? 'border-[#252525] bg-[#141414]' : 'border-gray-200 bg-white'}`}>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{data?.label || 'Wait'}</p>
                    <div className={`text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatDuration(duration)}
                    </div>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className={`!w-3 !h-3 !border-0 !-bottom-1.5 transition-all`}
                style={{
                    backgroundColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : '#6b7280',
                    boxShadow: '0 0 8px rgba(107, 114, 128, 0.5)'
                }}
            />
        </div>
    );
}

export default memo(WaitNode);
