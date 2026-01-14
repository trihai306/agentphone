import { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * LoopNode - Enhanced with Data Source integration
 * Supports looping through collections, arrays, or fixed iterations
 */
function LoopNode({ id, data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [isConfiguring, setIsConfiguring] = useState(false);

    // Execution state
    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;

    // Loop configuration
    const source = data?.source || 'data'; // 'data' | 'custom' | 'count'
    const sourceVariable = data?.sourceVariable || '{{records}}';
    const itemVariable = data?.itemVariable || 'item';
    const indexVariable = data?.indexVariable || 'index';
    const iterations = data?.iterations || 10;
    const currentIteration = data?.currentIteration;
    const totalIterations = data?.totalIterations;

    // Color based on source type
    const getColor = () => {
        switch (source) {
            case 'data': return '#6366f1'; // Indigo for data
            case 'custom': return '#f59e0b'; // Amber for custom
            case 'count': return '#10b981'; // Green for count
            default: return '#6366f1';
        }
    };
    const color = getColor();

    return (
        <div className={`transition-all duration-200 ${selected ? 'scale-105' : ''} ${isRunning ? 'animate-pulse' : ''}`}>
            {/* Target Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3.5 !h-3.5 !border-[3px] !-top-2 !shadow-lg"
                style={{
                    backgroundColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : color,
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: `0 0 10px ${color}50`
                }}
            />

            <div
                className={`relative min-w-[200px] max-w-[260px] rounded-xl overflow-hidden
                    ${selected ? `ring-2 ring-offset-2 ${isDark ? 'ring-offset-[#0a0a0a]' : 'ring-offset-white'}` : ''}`}
                style={{
                    background: isDark
                        ? 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)'
                        : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                    boxShadow: selected
                        ? `0 0 30px ${color}15, 0 4px 20px rgba(0, 0, 0, ${isDark ? '0.4' : '0.1'})`
                        : `0 4px 20px rgba(0, 0, 0, ${isDark ? '0.3' : '0.08'})`,
                    border: `1px solid ${isDark ? '#252525' : '#e5e7eb'}`,
                    ringColor: color,
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ background: `${color}15` }}
                >
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: `${color}25` }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
                            {isRunning ? 'Iterating...' : 'Loop'}
                        </span>
                    </div>
                    {/* Iteration Counter - Always show iterations */}
                    <span
                        className="px-2 py-1 rounded-full text-xs font-bold"
                        style={{ backgroundColor: `${color}25`, color }}
                    >
                        {currentIteration !== undefined
                            ? `${currentIteration}/${totalIterations ?? iterations}`
                            : `×${iterations}`}
                    </span>
                </div>

                {/* Body */}
                <div className={`px-3 py-3 border-t space-y-2 ${isDark ? 'border-[#252525]' : 'border-gray-200'}`}>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {data?.label || 'For Each'}
                    </p>

                    {/* Source Info */}
                    <div className={`p-2 rounded-lg text-xs space-y-1.5 ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                        {source === 'data' && (
                            <>
                                <div className="flex items-center justify-between">
                                    <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Source:</span>
                                    <span className="font-mono" style={{ color }}>{sourceVariable}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Each as:</span>
                                    <span className="font-mono text-cyan-400">{`{{${itemVariable}}}`}</span>
                                </div>
                            </>
                        )}
                        {source === 'count' && (
                            <div className="flex items-center justify-between">
                                <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Iterations:</span>
                                <span className="font-semibold" style={{ color }}>{iterations}x</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Index as:</span>
                            <span className="font-mono text-cyan-400">{`{{${indexVariable}}}`}</span>
                        </div>
                    </div>

                    {/* Execution Status */}
                    {isSuccess && (
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-500">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Completed all iterations</span>
                        </div>
                    )}
                    {isError && (
                        <div className="flex items-center gap-1.5 text-[10px] text-red-500">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>Error in iteration</span>
                        </div>
                    )}
                </div>

                {/* Branch Labels */}
                <div className={`flex justify-between px-3 py-2 text-[10px] font-semibold border-t ${isDark ? 'border-[#252525]' : 'border-gray-100'}`}>
                    <span style={{ color }}>Each Item ↓</span>
                    <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Complete →</span>
                </div>
            </div>

            {/* Loop Body Handle (Left) - for each iteration */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="loop"
                className="!w-3.5 !h-3.5 !border-[3px] !-bottom-2 !shadow-lg"
                style={{
                    left: '25%',
                    backgroundColor: isRunning ? '#6366f1' : color,
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: `0 0 10px ${color}50`
                }}
            />

            {/* Complete Handle (Right) - after all iterations */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="complete"
                className="!w-3.5 !h-3.5 !border-[3px] !-bottom-2 !shadow-lg"
                style={{
                    left: '75%',
                    backgroundColor: isSuccess ? '#10b981' : (isDark ? '#4b5563' : '#9ca3af'),
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: '0 0 10px rgba(107, 114, 128, 0.5)'
                }}
            />
        </div>
    );
}

export default memo(LoopNode);

