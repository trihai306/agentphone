import { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

function OutputNode({ data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [label, setLabel] = useState(data.label || 'End');

    // Execution state
    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;
    const isPending = executionState === NodeStatus.PENDING;

    useEffect(() => {
        setLabel(data.label || 'End');
    }, [data.label]);

    // Get ring color based on execution state
    const getRingColor = () => {
        if (isRunning) return 'ring-indigo-500';
        if (isSuccess) return 'ring-emerald-500';
        if (isError) return 'ring-red-500';
        return 'ring-red-500';
    };

    // Get glow style based on execution state
    const getGlowStyle = () => {
        if (isRunning) return '0 0 20px rgba(99, 102, 241, 0.5), 0 0 40px rgba(99, 102, 241, 0.3)';
        if (isSuccess) return '0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2)';
        if (isError) return '0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3)';
        return '';
    };

    return (
        <div className={`transition-all duration-300 ${selected ? 'scale-105' : ''} ${isPending ? 'opacity-50' : ''} ${isRunning ? 'animate-pulse' : ''} ${isError ? 'animate-shake' : ''}`}>
            {/* Target Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className={`!w-3 !h-3 !border-0 !-top-1.5 transition-all ${isRunning ? '!bg-indigo-500' :
                    isSuccess ? '!bg-emerald-500' :
                        isError ? '!bg-red-500' :
                            '!bg-red-500'
                    }`}
                style={{
                    boxShadow: isRunning
                        ? '0 0 8px rgba(99, 102, 241, 0.6)'
                        : '0 0 6px rgba(239, 68, 68, 0.5)'
                }}
            />

            <div
                className={`
                    relative min-w-[160px] rounded-xl overflow-hidden transition-all duration-300
                    ${selected && !isRunning && !isSuccess && !isError
                        ? isDark
                            ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-[#0a0a0a]'
                            : 'ring-2 ring-red-500 ring-offset-2 ring-offset-white'
                        : ''
                    }
                    ${isRunning || isSuccess || isError
                        ? `ring-2 ${getRingColor()} ring-offset-2 ${isDark ? 'ring-offset-[#0a0a0a]' : 'ring-offset-white'}`
                        : ''
                    }
                `}
                style={{
                    background: isDark
                        ? 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)'
                        : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                    boxShadow: isRunning || isSuccess || isError
                        ? getGlowStyle()
                        : selected
                            ? isDark
                                ? '0 0 20px rgba(239, 68, 68, 0.15), 0 4px 20px rgba(0, 0, 0, 0.4)'
                                : '0 0 20px rgba(239, 68, 68, 0.2), 0 4px 20px rgba(0, 0, 0, 0.1)'
                            : isDark
                                ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                                : '0 4px 20px rgba(0, 0, 0, 0.08)',
                    border: isDark ? '1px solid #252525' : '1px solid #e5e7eb',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{
                        background: isRunning
                            ? 'rgba(99, 102, 241, 0.15)'
                            : isSuccess
                                ? 'rgba(16, 185, 129, 0.15)'
                                : isError
                                    ? 'rgba(239, 68, 68, 0.15)'
                                    : 'rgba(239, 68, 68, 0.08)'
                    }}
                >
                    <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${isRunning ? 'animate-spin' : ''}`}
                        style={{
                            background: isRunning
                                ? 'rgba(99, 102, 241, 0.3)'
                                : isSuccess
                                    ? 'rgba(16, 185, 129, 0.3)'
                                    : isError
                                        ? 'rgba(239, 68, 68, 0.3)'
                                        : 'rgba(239, 68, 68, 0.2)'
                        }}
                    >
                        {isRunning ? (
                            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : isSuccess ? (
                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : isError ? (
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="#ef4444" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                            </svg>
                        )}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${isRunning ? 'text-indigo-400' :
                        isSuccess ? 'text-emerald-400' :
                            isError ? 'text-red-400' :
                                'text-red-500'
                        }`}>
                        {isRunning ? 'Finishing...' : isSuccess ? 'Complete' : isError ? 'Error' : 'End'}
                    </span>
                </div>

                {/* Body */}
                <div className={`px-3 py-3 border-t ${isDark ? 'border-[#252525] bg-[#141414]' : 'border-gray-200 bg-white'}`}>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{label}</p>
                </div>
            </div>
        </div>
    );
}

export default memo(OutputNode);
