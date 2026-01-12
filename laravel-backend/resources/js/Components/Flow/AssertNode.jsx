import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * AssertNode - Verifies element exists, has value, or condition is met
 */
function AssertNode({ data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;

    const assertType = data?.assertType || 'exists'; // exists, text, visible, enabled

    const getAssertLabel = () => {
        const labels = {
            'exists': 'Element Exists',
            'text': 'Text Equals',
            'visible': 'Is Visible',
            'enabled': 'Is Enabled',
            'contains': 'Contains Text',
        };
        return labels[assertType] || 'Assert';
    };

    return (
        <div className={`transition-all duration-300 ${selected ? 'scale-105' : ''} ${isRunning ? 'animate-pulse' : ''}`}>
            <Handle
                type="target"
                position={Position.Top}
                className={`!w-3 !h-3 !border-0 !-top-1.5`}
                style={{
                    backgroundColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : '#22c55e',
                    boxShadow: '0 0 8px rgba(34, 197, 94, 0.5)'
                }}
            />

            <div
                className={`relative min-w-[180px] rounded-xl overflow-hidden transition-all duration-300
                    ${selected ? `ring-2 ${isError ? 'ring-red-500' : isSuccess ? 'ring-emerald-500' : 'ring-green-500'} ring-offset-2 ${isDark ? 'ring-offset-[#0a0a0a]' : 'ring-offset-white'}` : ''}`}
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
                    style={{
                        background: isError ? 'rgba(239, 68, 68, 0.15)' :
                            isSuccess ? 'rgba(16, 185, 129, 0.15)' :
                                isRunning ? 'rgba(99, 102, 241, 0.15)' :
                                    'rgba(34, 197, 94, 0.1)'
                    }}
                >
                    <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${isRunning ? 'animate-spin' : ''}`}
                        style={{
                            background: isError ? 'rgba(239, 68, 68, 0.3)' :
                                isSuccess ? 'rgba(16, 185, 129, 0.3)' :
                                    isRunning ? 'rgba(99, 102, 241, 0.3)' :
                                        'rgba(34, 197, 94, 0.2)'
                        }}
                    >
                        {isSuccess ? (
                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : isError ? (
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className={`w-4 h-4 ${isRunning ? 'text-indigo-400' : 'text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isError ? 'text-red-400' :
                            isSuccess ? 'text-emerald-400' :
                                isRunning ? 'text-indigo-400' :
                                    'text-green-500'
                        }`}>
                        {isError ? 'Failed' : isSuccess ? 'Passed' : isRunning ? 'Checking...' : 'Assert'}
                    </span>
                </div>

                <div className={`px-3 py-3 border-t ${isDark ? 'border-[#252525] bg-[#141414]' : 'border-gray-200 bg-white'}`}>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {data?.label || getAssertLabel()}
                    </p>

                    {data?.resourceId && (
                        <div className={`text-xs font-mono mt-2 px-2 py-1.5 rounded ${isDark ? 'bg-[#0f0f0f] text-gray-500' : 'bg-gray-50 text-gray-500'}`}>
                            {data.resourceId}
                        </div>
                    )}

                    {data?.expectedValue && (
                        <div className={`flex items-center gap-1.5 mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span>=</span>
                            <span className="font-mono">"{data.expectedValue}"</span>
                        </div>
                    )}
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className={`!w-3 !h-3 !border-0 !-bottom-1.5`}
                style={{
                    backgroundColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : '#22c55e',
                    boxShadow: '0 0 8px rgba(34, 197, 94, 0.5)'
                }}
            />
        </div>
    );
}

export default memo(AssertNode);
