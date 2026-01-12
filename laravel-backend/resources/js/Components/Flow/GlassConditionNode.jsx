import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * GlassConditionNode - Premium glassmorphic condition/branching node
 */
function GlassConditionNode({ id, data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;

    const condition = data?.condition || '{{item.status}} == "active"';
    const lastResult = data?.lastResult; // true or false

    const color = '#f97316'; // Orange

    return (
        <div className={`group transition-all duration-300 ${selected ? 'scale-[1.02]' : ''} ${isRunning ? 'animate-pulse' : ''}`}>
            {/* Top Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-4 !h-4 !border-[3px] !-top-2 transition-all duration-300 group-hover:!scale-110"
                style={{
                    backgroundColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : color,
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: `0 0 15px ${color}60`,
                }}
            />

            {/* Diamond Shape Container */}
            <div
                className={`relative min-w-[200px] rounded-2xl overflow-hidden ${selected ? 'ring-2 ring-offset-2' : ''}`}
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
                        <svg className="w-5 h-5" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold" style={{ color }}>
                            ❓ Condition
                        </h3>
                        <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {data?.label || 'If / Else Branch'}
                        </p>
                    </div>
                    {/* Result Indicator */}
                    {lastResult !== undefined && (
                        <span
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold ${lastResult
                                ? 'bg-emerald-500/20 text-emerald-500'
                                : 'bg-red-500/20 text-red-500'
                                }`}
                        >
                            {lastResult ? 'TRUE' : 'FALSE'}
                        </span>
                    )}
                </div>

                {/* Body */}
                <div className={`px-4 py-3 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    {/* Condition Expression */}
                    <div className={`p-3 rounded-xl font-mono text-xs ${isDark ? 'bg-black/30 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                        <code>{condition}</code>
                    </div>
                </div>

                {/* Branch Labels */}
                <div className={`flex justify-between px-4 py-2 text-[10px] font-semibold border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    <span className="text-emerald-500">✓ True</span>
                    <span className="text-red-400">✗ False</span>
                </div>
            </div>

            {/* True Handle (Left) */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="true"
                className="!w-4 !h-4 !border-[3px] !-bottom-2"
                style={{
                    left: '25%',
                    backgroundColor: lastResult === true ? '#10b981' : '#10b981',
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)',
                }}
            />

            {/* False Handle (Right) */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="false"
                className="!w-4 !h-4 !border-[3px] !-bottom-2"
                style={{
                    left: '75%',
                    backgroundColor: lastResult === false ? '#ef4444' : '#ef4444',
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)',
                }}
            />
        </div>
    );
}

export default memo(GlassConditionNode);
