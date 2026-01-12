import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * TextInputNode - Allows inputting dynamic text content for workflow
 */
function TextInputNode({ data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;

    const textContent = data?.textContent || '';
    const placeholder = data?.placeholder || 'Enter text...';
    const lineCount = textContent ? textContent.split('\n').length : 0;

    return (
        <div className={`transition-all duration-300 ${selected ? 'scale-105' : ''}`}>
            <Handle
                type="target"
                position={Position.Top}
                className={`!w-3 !h-3 !border-0 !-top-1.5`}
                style={{
                    backgroundColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : '#a855f7',
                    boxShadow: '0 0 8px rgba(168, 85, 247, 0.5)'
                }}
            />

            <div
                className={`relative min-w-[220px] max-w-[280px] rounded-xl overflow-hidden transition-all duration-300
                    ${selected ? `ring-2 ring-purple-500 ring-offset-2 ${isDark ? 'ring-offset-[#0a0a0a]' : 'ring-offset-white'}` : ''}`}
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
                    style={{ background: 'rgba(168, 85, 247, 0.1)' }}
                >
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(168, 85, 247, 0.2)' }}
                    >
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-500">
                        Text Input
                    </span>
                </div>

                <div className={`px-3 py-3 border-t ${isDark ? 'border-[#252525] bg-[#141414]' : 'border-gray-200 bg-white'}`}>
                    <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {data?.label || 'Text Content'}
                    </p>

                    {textContent ? (
                        <div className={`px-2 py-2 rounded text-xs font-mono ${isDark ? 'bg-[#0f0f0f] text-gray-300 border border-[#252525]' : 'bg-gray-50 text-gray-700 border border-gray-200'}`}>
                            <div className="max-h-24 overflow-y-auto">
                                {textContent.slice(0, 150)}{textContent.length > 150 ? '...' : ''}
                            </div>
                        </div>
                    ) : (
                        <div className={`px-2 py-2 rounded text-xs italic ${isDark ? 'bg-[#0f0f0f] text-gray-500 border border-[#252525]' : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
                            {placeholder}
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                        <div className={`flex items-center gap-1.5 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>{lineCount} lines</span>
                        </div>
                        <div className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {textContent.length} chars
                        </div>
                    </div>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className={`!w-3 !h-3 !border-0 !-bottom-1.5`}
                style={{
                    backgroundColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : '#a855f7',
                    boxShadow: '0 0 8px rgba(168, 85, 247, 0.5)'
                }}
            />
        </div>
    );
}

export default memo(TextInputNode);
