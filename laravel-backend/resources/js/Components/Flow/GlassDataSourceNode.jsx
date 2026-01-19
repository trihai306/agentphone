import { memo, useState, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * GlassDataSourceNode - Premium glassmorphic data source node
 * Now with Named Output Variables for multi-datasource workflows
 */
function GlassDataSourceNode({ id, data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [isEditingName, setIsEditingName] = useState(false);

    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;

    const hasCollection = !!data?.collectionId;
    const collectionName = data?.collectionName || 'No collection';
    const collectionIcon = data?.collectionIcon || '📊';
    const recordCount = data?.recordCount || 0;
    const schema = data?.schema || [];

    // Named output variable (default to collection name or 'records')
    const outputName = data?.outputName ||
        (data?.collectionName ? data.collectionName.toLowerCase().replace(/\s+/g, '_') : 'records');

    const color = '#f59e0b'; // Amber

    const handleOutputNameChange = useCallback((e) => {
        const newName = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
        data?.onUpdateData?.(id, 'outputName', newName);
    }, [id, data?.onUpdateData]);

    const handleOutputNameBlur = useCallback(() => {
        setIsEditingName(false);
    }, []);

    return (
        <div className={`group transition-all duration-300 ${selected ? 'scale-[1.02]' : ''} ${isRunning ? 'animate-pulse' : ''}`}>
            {/* NO TOP HANDLE - This is a source-only node */}

            {/* Main Card */}
            <div
                className={`relative min-w-[260px] max-w-[320px] rounded-2xl overflow-hidden ${selected ? 'ring-2 ring-offset-2' : ''}`}
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

                            {/* Named Output Variable */}
                            <div className={`p-3 rounded-xl mb-3 ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                                <p className={`text-[10px] uppercase font-semibold mb-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                    Output Variable Name
                                </p>
                                <div className="flex items-center gap-1">
                                    <span className={`text-xs font-mono ${isDark ? 'text-cyan-500' : 'text-cyan-600'}`}>{'{{'}</span>
                                    {isEditingName ? (
                                        <input
                                            type="text"
                                            value={outputName}
                                            onChange={handleOutputNameChange}
                                            onBlur={handleOutputNameBlur}
                                            onKeyDown={(e) => e.key === 'Enter' && handleOutputNameBlur()}
                                            autoFocus
                                            className={`flex-1 px-2 py-1 text-xs font-mono rounded border ${isDark
                                                ? 'bg-black/50 border-amber-500/50 text-amber-400'
                                                : 'bg-white border-amber-300 text-amber-700'
                                                } focus:outline-none focus:ring-1 focus:ring-amber-500`}
                                            placeholder="variable_name"
                                        />
                                    ) : (
                                        <button
                                            onClick={() => setIsEditingName(true)}
                                            className={`flex-1 px-2 py-1 text-xs font-mono text-left rounded transition-all ${isDark
                                                ? 'text-amber-400 hover:bg-amber-500/20'
                                                : 'text-amber-600 hover:bg-amber-100'
                                                }`}
                                        >
                                            {outputName}
                                            <span className={`ml-1 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>✎</span>
                                        </button>
                                    )}
                                    <span className={`text-xs font-mono ${isDark ? 'text-cyan-500' : 'text-cyan-600'}`}>{'}}'}</span>
                                </div>
                            </div>

                            {/* Output Variables Preview */}
                            <div className={`p-2 rounded-lg ${isDark ? 'bg-black/20' : 'bg-gray-50'}`}>
                                <div className="flex flex-col gap-1 text-[10px]">
                                    <div className="flex items-center gap-2">
                                        <code className="text-cyan-400 font-mono">{`{{${outputName}}}`}</code>
                                        <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>→ all records</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="text-cyan-400 font-mono">{`{{${outputName}.count}}`}</code>
                                        <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>→ record count</span>
                                    </div>
                                    {schema.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <code className="text-cyan-400 font-mono">{`{{item.${schema[0]?.name || 'field'}}}`}</code>
                                            <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>→ in loop</span>
                                        </div>
                                    )}
                                </div>
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

            {/* Data Output Handle - RIGHT SIDE (prominent, amber color) */}
            <Handle
                type="source"
                position={Position.Right}
                id="data-output"
                className="!w-5 !h-5 !border-[3px] transition-all duration-300 group-hover:!scale-125"
                style={{
                    backgroundColor: color,
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: `0 0 20px ${color}80`,
                    right: '-10px',
                }}
            />

            {/* Data Output Label */}
            {hasCollection && (
                <div
                    className="absolute right-[-8px] top-1/2 transform translate-x-full -translate-y-1/2 ml-2"
                    style={{ pointerEvents: 'none' }}
                >
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono whitespace-nowrap ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                        ▸ {`{{${outputName}}}`}
                    </span>
                </div>
            )}
        </div>
    );
}

export default memo(GlassDataSourceNode);
