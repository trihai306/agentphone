import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';
import GlassNode from './GlassNode';

/**
 * GlassLoopNode - Premium glassmorphic loop node
 */
function GlassLoopNode({ id, data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;

    // Loop configuration
    const source = data?.source || 'data';
    const sourceVariable = data?.sourceVariable || '{{records}}';
    const itemVariable = data?.itemVariable || 'item';
    const indexVariable = data?.indexVariable || 'index';
    const iterations = data?.iterations || 10;
    const currentIteration = data?.currentIteration;
    const totalIterations = data?.totalIterations;

    const color = '#6366f1'; // Indigo

    const LoopIcon = (
        <svg className="w-5 h-5" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    );

    return (
        <div className={`transition-all duration-300 ${selected ? 'scale-[1.02]' : ''} ${isRunning ? 'animate-pulse' : ''}`}>
            {/* Top Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-4 !h-4 !border-[3px] !-top-2 transition-all duration-300"
                style={{
                    backgroundColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : color,
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: `0 0 15px ${color}60`,
                }}
            />

            {/* Main Card */}
            <div
                className={`relative min-w-[220px] max-w-[280px] rounded-2xl overflow-hidden ${selected ? 'ring-2 ring-offset-2' : ''}`}
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
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{
                            background: `linear-gradient(135deg, ${color}30 0%, ${color}15 100%)`,
                            boxShadow: `0 4px 12px ${color}30`,
                        }}
                    >
                        {LoopIcon}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold" style={{ color }}>
                            {isRunning ? '⚡ Iterating...' : '🔄 Loop'}
                        </h3>
                        <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {data?.label || 'For Each Item'}
                        </p>
                    </div>
                    {/* Iteration Counter */}
                    {(currentIteration !== undefined || totalIterations) && (
                        <span
                            className="px-2 py-1 rounded-lg text-xs font-bold"
                            style={{ backgroundColor: `${color}20`, color }}
                        >
                            {currentIteration ?? 0}/{totalIterations ?? iterations}
                        </span>
                    )}
                </div>

                {/* Body */}
                <div className={`px-4 py-3 border-t space-y-3 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    {/* Source Info */}
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-black/30' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] uppercase font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Source
                            </span>
                            <span className="font-mono text-xs" style={{ color }}>{sourceVariable}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1.5">
                                <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Item:</span>
                                <code className="text-cyan-400">{`{{${itemVariable}}}`}</code>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Index:</span>
                                <code className="text-cyan-400">{`{{${indexVariable}}}`}</code>
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    {isSuccess && (
                        <div className="flex items-center gap-2 text-xs text-emerald-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>All iterations completed</span>
                        </div>
                    )}
                </div>

                {/* Branch Labels */}
                <div className={`flex justify-between px-4 py-2 text-[10px] font-semibold border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    <span style={{ color }}>↓ Each Item</span>
                    <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Complete →</span>
                </div>

                {/* Progress Bar */}
                {isRunning && (
                    <div className="h-1 w-full bg-black/20 overflow-hidden">
                        <div
                            className="h-full transition-all duration-300"
                            style={{
                                width: `${((currentIteration || 0) / (totalIterations || iterations)) * 100}%`,
                                background: `linear-gradient(90deg, ${color} 0%, #8b5cf6 100%)`,
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Loop Body Handle (Left) */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="loop"
                className="!w-4 !h-4 !border-[3px] !-bottom-2"
                style={{
                    left: '25%',
                    backgroundColor: color,
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: `0 0 15px ${color}60`,
                }}
            />

            {/* Complete Handle (Right) */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="complete"
                className="!w-4 !h-4 !border-[3px] !-bottom-2"
                style={{
                    left: '75%',
                    backgroundColor: isSuccess ? '#10b981' : (isDark ? '#4b5563' : '#9ca3af'),
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: '0 0 15px rgba(107, 114, 128, 0.5)',
                }}
            />
        </div>
    );
}

export default memo(GlassLoopNode);
