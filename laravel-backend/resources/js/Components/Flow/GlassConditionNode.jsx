import { memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * GlassConditionNode - Premium condition node with multi-condition support
 * Features:
 * - Compact grid display for multiple conditions
 * - AND/OR logic indicator
 * - Professional pill-style condition tags
 * - Collapsible when many conditions
 */
function GlassConditionNode({ id, data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;

    // Support for multiple conditions
    const conditions = data?.conditions || [];
    const singleCondition = data?.condition || '';
    const logicOperator = data?.logicOperator || 'AND';
    const lastResult = data?.lastResult;

    // Format conditions for display
    const displayConditions = useMemo(() => {
        if (conditions.length > 0) {
            return conditions.map((c, idx) => ({
                id: idx,
                left: c.leftValue || c.left || '',
                operator: c.operator || '==',
                right: c.rightValue || c.right || '',
                type: c.type || 'variable',
            }));
        }
        // Fallback to single condition
        if (singleCondition) {
            return [{
                id: 0,
                expression: singleCondition,
                type: 'expression',
            }];
        }
        // Build from leftValue/operator/rightValue
        if (data?.leftValue) {
            return [{
                id: 0,
                left: data.leftValue,
                operator: data.operator || '==',
                right: data.rightValue || '',
                type: 'variable',
            }];
        }
        return [];
    }, [conditions, singleCondition, data]);

    const color = '#f97316'; // Orange
    const conditionCount = displayConditions.length;
    const showCompact = conditionCount > 2;

    // Operator display
    const getOperatorSymbol = (op) => {
        const symbols = {
            '==': '=',
            '!=': '≠',
            '>': '>',
            '<': '<',
            '>=': '≥',
            '<=': '≤',
            'contains': '∋',
            'startsWith': '⊃',
            'endsWith': '⊂',
            'exists': '∃',
            'not_exists': '∄',
        };
        return symbols[op] || op;
    };

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
                    minWidth: showCompact ? '280px' : '240px',
                    maxWidth: '360px',
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
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold" style={{ color }}>
                            Condition
                        </h3>
                        <p className={`text-[10px] truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {data?.label || `${conditionCount} điều kiện`}
                        </p>
                    </div>

                    {/* Logic Operator Badge + Count */}
                    <div className="flex items-center gap-1.5">
                        {conditionCount > 1 && (
                            <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold ${logicOperator === 'AND'
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : 'bg-amber-500/20 text-amber-400'
                                    }`}
                            >
                                {logicOperator}
                            </span>
                        )}
                        {lastResult !== undefined && (
                            <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${lastResult ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                    }`}
                            >
                                {lastResult ? '✓' : '✗'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Conditions Grid */}
                <div className={`px-3 py-2.5 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    {displayConditions.length === 0 ? (
                        <p className={`text-xs italic text-center py-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            Chưa cấu hình điều kiện
                        </p>
                    ) : (
                        <div className={`flex flex-wrap gap-1.5 ${showCompact ? 'max-h-[80px] overflow-y-auto custom-scrollbar' : ''}`}>
                            {displayConditions.slice(0, showCompact ? 6 : 3).map((cond, idx) => (
                                <div
                                    key={cond.id}
                                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-mono ${isDark
                                            ? 'bg-[#0f0f0f] border border-[#252525]'
                                            : 'bg-gray-50 border border-gray-200'
                                        }`}
                                    style={{ maxWidth: '100%' }}
                                >
                                    {cond.expression ? (
                                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                                            {cond.expression.length > 30
                                                ? cond.expression.slice(0, 30) + '...'
                                                : cond.expression}
                                        </span>
                                    ) : (
                                        <>
                                            <span className="text-cyan-400 truncate max-w-[60px]" title={cond.left}>
                                                {cond.left?.replace(/\{\{|\}\}/g, '') || '?'}
                                            </span>
                                            <span
                                                className={`px-1 rounded font-bold ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'}`}
                                            >
                                                {getOperatorSymbol(cond.operator)}
                                            </span>
                                            <span className="text-emerald-400 truncate max-w-[60px]" title={cond.right}>
                                                {cond.right || '?'}
                                            </span>
                                        </>
                                    )}
                                    {/* Condition index for multiple */}
                                    {conditionCount > 1 && idx < conditionCount - 1 && (
                                        <span className={`ml-1 text-[8px] ${logicOperator === 'AND' ? 'text-blue-400' : 'text-amber-400'
                                            }`}>
                                            {logicOperator === 'AND' ? '∧' : '∨'}
                                        </span>
                                    )}
                                </div>
                            ))}

                            {/* Show more indicator */}
                            {displayConditions.length > (showCompact ? 6 : 3) && (
                                <div className={`px-2 py-1.5 rounded-lg text-[10px] font-medium ${isDark ? 'bg-[#1a1a1a] text-gray-500' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    +{displayConditions.length - (showCompact ? 6 : 3)} more
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Branch Labels - Compact */}
                <div className={`flex justify-between items-center px-4 py-2 text-[10px] font-bold border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-emerald-500">True</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-red-400">False</span>
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                    </div>
                </div>
            </div>

            {/* True Handle - Right Top */}
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

            {/* False Handle - Right Bottom */}
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

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: ${isDark ? '#333' : '#ddd'};
                    border-radius: 2px;
                }
            `}</style>
        </div>
    );
}

export default memo(GlassConditionNode);
