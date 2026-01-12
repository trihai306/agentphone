import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * GlassTextInputNode - Premium glassmorphic text/data node
 */
function GlassTextInputNode({ id, data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;

    const text = data?.text || '';
    const outputVariable = data?.outputVariable || 'text';
    const lineCount = (text.match(/\n/g) || []).length + 1;
    const charCount = text.length;

    const color = '#8b5cf6'; // Purple

    return (
        <div className={`group transition-all duration-300 ${selected ? 'scale-[1.02]' : ''}`}>
            {/* Top Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-4 !h-4 !border-[3px] !-top-2 transition-all duration-300 group-hover:!scale-110"
                style={{
                    backgroundColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : color,
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: `0 0 15px ${color}60`,
                }}
            />

            {/* Main Card */}
            <div
                className={`relative min-w-[240px] max-w-[320px] rounded-2xl overflow-hidden ${selected ? 'ring-2 ring-offset-2' : ''}`}
                style={{
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
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold" style={{ color }}>
                            📝 Text Data
                        </h3>
                        <p className={`text-[10px] truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {data?.label || 'Static Text Content'}
                        </p>
                    </div>
                    {/* Stats */}
                    <div className="flex items-center gap-2">
                        <span
                            className="px-2 py-1 rounded-lg text-[10px] font-bold"
                            style={{ backgroundColor: `${color}20`, color }}
                        >
                            {lineCount}L
                        </span>
                    </div>
                </div>

                {/* Body */}
                <div className={`px-4 py-3 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    {/* Text Preview */}
                    <div
                        className={`p-3 rounded-xl font-mono text-xs mb-3 ${isDark ? 'bg-black/30 text-gray-300' : 'bg-gray-50 text-gray-600'}`}
                        style={{ maxHeight: '120px', overflow: 'hidden' }}
                    >
                        {text ? (
                            <div className="line-clamp-4">
                                {text.split('\n').slice(0, 4).map((line, idx) => (
                                    <div key={idx}>{line || ' '}</div>
                                ))}
                            </div>
                        ) : (
                            <div className={isDark ? 'text-gray-600' : 'text-gray-400'}>
                                No content...
                            </div>
                        )}
                    </div>

                    {/* Output Variable */}
                    <div className="flex items-center justify-between text-xs">
                        <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Output:</span>
                        <code className="text-cyan-400">{`{{${outputVariable}}}`}</code>
                    </div>

                    {/* Character Count */}
                    <div className={`mt-2 text-[10px] text-right ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {charCount} characters
                    </div>
                </div>

                {/* Success Indicator */}
                {isSuccess && (
                    <div className="h-1 w-full bg-emerald-500" />
                )}
            </div>

            {/* Bottom Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-4 !h-4 !border-[3px] !-bottom-2 transition-all duration-300 group-hover:!scale-110"
                style={{
                    backgroundColor: isSuccess ? '#10b981' : color,
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: `0 0 15px ${color}60`,
                }}
            />
        </div>
    );
}

export default memo(GlassTextInputNode);
