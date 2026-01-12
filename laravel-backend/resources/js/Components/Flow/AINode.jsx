import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * AINode - AI processing and integration
 */
function AINode({ data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;

    const aiModel = data?.aiModel || 'GPT-4';
    const prompt = data?.prompt || '';

    return (
        <div className={`transition-all duration-300 ${selected ? 'scale-105' : ''} ${isRunning ? 'animate-pulse' : ''}`}>
            <Handle
                type="target"
                position={Position.Top}
                className={`!w-3 !h-3 !border-0 !-top-1.5`}
                style={{
                    backgroundColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : '#ec4899',
                    boxShadow: '0 0 8px rgba(236, 72, 153, 0.5)'
                }}
            />

            <div
                className={`relative min-w-[200px] rounded-xl overflow-hidden transition-all duration-300
                    ${selected ? `ring-2 ring-pink-500 ring-offset-2 ${isDark ? 'ring-offset-[#0a0a0a]' : 'ring-offset-white'}` : ''}`}
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
                    style={{ background: isRunning ? 'rgba(99, 102, 241, 0.15)' : 'rgba(236, 72, 153, 0.1)' }}
                >
                    <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${isRunning ? 'animate-spin' : ''}`}
                        style={{ background: isRunning ? 'rgba(99, 102, 241, 0.3)' : 'rgba(236, 72, 153, 0.2)' }}
                    >
                        <svg className={`w-4 h-4 ${isRunning ? 'text-indigo-400' : 'text-pink-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isRunning ? 'text-indigo-400' : 'text-pink-500'}`}>
                        {isRunning ? 'Processing...' : 'AI Process'}
                    </span>
                </div>

                <div className={`px-3 py-3 border-t ${isDark ? 'border-[#252525] bg-[#141414]' : 'border-gray-200 bg-white'}`}>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {data?.label || 'AI Integration'}
                    </p>

                    <div className={`mt-2 px-2 py-1.5 rounded flex items-center gap-1.5 text-xs ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 animate-pulse" />
                        <span className={`font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{aiModel}</span>
                    </div>

                    {prompt && (
                        <div className={`mt-2 px-2 py-1.5 rounded text-xs italic ${isDark ? 'bg-[#0f0f0f] text-gray-400 border border-[#252525]' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                            "{prompt.slice(0, 60)}{prompt.length > 60 ? '...' : ''}"
                        </div>
                    )}

                    <div className={`flex items-center gap-1.5 mt-2 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>AI-powered</span>
                    </div>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className={`!w-3 !h-3 !border-0 !-bottom-1.5`}
                style={{
                    backgroundColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : '#ec4899',
                    boxShadow: '0 0 8px rgba(236, 72, 153, 0.5)'
                }}
            />
        </div>
    );
}

export default memo(AINode);
