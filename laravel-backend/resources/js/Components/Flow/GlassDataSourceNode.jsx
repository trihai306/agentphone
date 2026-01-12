import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * GlassDataSourceNode - Premium glassmorphic data source node
 */
function GlassDataSourceNode({ id, data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;

    const hasCollection = !!data?.collectionId;
    const collectionName = data?.collectionName || 'No collection';
    const collectionIcon = data?.collectionIcon || '📊';
    const recordCount = data?.recordCount || 0;
    const schema = data?.schema || [];

    const color = '#f59e0b'; // Amber

    return (
        <div className={`group transition-all duration-300 ${selected ? 'scale-[1.02]' : ''} ${isRunning ? 'animate-pulse' : ''}`}>
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
                className={`relative min-w-[240px] max-w-[300px] rounded-2xl overflow-hidden ${selected ? 'ring-2 ring-offset-2' : ''}`}
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
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{
                            background: `linear-gradient(135deg, ${color}30 0%, ${color}15 100%)`,
                            boxShadow: `0 4px 12px ${color}30`,
                        }}
                    >
                        {hasCollection ? collectionIcon : '📊'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold truncate" style={{ color }}>
                            {hasCollection ? collectionName : 'Data Source'}
                        </h3>
                        <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {hasCollection ? `${recordCount} records` : 'Select a collection'}
                        </p>
                    </div>
                    {hasCollection && (
                        <span
                            className="px-2 py-1 rounded-lg text-[10px] font-bold"
                            style={{ backgroundColor: `${color}20`, color }}
                        >
                            {recordCount}
                        </span>
                    )}
                </div>

                {/* Body */}
                <div className={`px-4 py-3 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    {hasCollection ? (
                        <>
                            {/* Schema Fields */}
                            {schema.length > 0 && (
                                <div className={`p-3 rounded-xl mb-3 ${isDark ? 'bg-black/30' : 'bg-gray-50'}`}>
                                    <p className={`text-[10px] uppercase font-semibold mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Output Fields
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {schema.slice(0, 4).map((field, idx) => (
                                            <span
                                                key={idx}
                                                className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}
                                            >
                                                {field.name}
                                            </span>
                                        ))}
                                        {schema.length > 4 && (
                                            <span className={`text-[10px] px-2 py-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                +{schema.length - 4}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Output Variables */}
                            <div className="flex items-center gap-2 text-[10px]">
                                <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Output:</span>
                                <code className="text-cyan-400">{`{{records}}`}</code>
                                <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>•</span>
                                <code className="text-cyan-400">{`{{count}}`}</code>
                            </div>

                            {/* Change Button */}
                            <button
                                onClick={() => data?.onSelectCollection?.(id)}
                                className={`mt-3 w-full py-2 rounded-lg text-xs font-medium transition-all ${isDark
                                    ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                    }`}
                            >
                                Change Collection
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => data?.onSelectCollection?.(id)}
                            className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
                            style={{
                                background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
                                color: 'white',
                                boxShadow: `0 4px 12px ${color}40`,
                            }}
                        >
                            📊 Select Collection
                        </button>
                    )}
                </div>
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

export default memo(GlassDataSourceNode);
