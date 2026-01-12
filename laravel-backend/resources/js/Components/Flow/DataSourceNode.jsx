import { memo } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * DataSourceNode - Enhanced with Data Collections integration
 * Connects to user's data collections for workflow automation
 */
function DataSourceNode({ id, data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;

    // Collection data from selection
    const hasCollection = !!data?.collectionId;
    const collectionName = data?.collectionName || 'No collection selected';
    const collectionIcon = data?.collectionIcon || '📊';
    const collectionColor = data?.collectionColor || '#f59e0b';
    const recordCount = data?.recordCount || 0;
    const schema = data?.schema || [];

    const handleSelectCollection = () => {
        if (data?.onSelectCollection) {
            data.onSelectCollection(id);
        }
    };

    return (
        <div className={`transition-all duration-300 ${selected ? 'scale-105' : ''} ${isRunning ? 'animate-pulse' : ''}`}>
            <Handle
                type="target"
                position={Position.Top}
                className={`!w-3 !h-3 !border-0 !-top-1.5`}
                style={{
                    backgroundColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : collectionColor,
                    boxShadow: `0 0 8px ${collectionColor}80`
                }}
            />

            <div
                className={`relative min-w-[220px] max-w-[280px] rounded-xl overflow-hidden transition-all duration-300
                    ${selected ? `ring-2 ring-offset-2 ${isDark ? 'ring-offset-[#0a0a0a]' : 'ring-offset-white'}` : ''}`}
                style={{
                    background: isDark
                        ? 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)'
                        : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)',
                    border: `1px solid ${isDark ? '#252525' : '#e5e7eb'}`,
                    ...(selected && { ringColor: collectionColor }),
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ background: isRunning ? 'rgba(99, 102, 241, 0.15)' : `${collectionColor}15` }}
                >
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-lg"
                        style={{ background: `${collectionColor}25` }}
                    >
                        {hasCollection ? collectionIcon : '📊'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className={`text-xs font-bold uppercase tracking-wider`} style={{ color: collectionColor }}>
                            {isRunning ? 'Loading Data...' : 'Data Source'}
                        </span>
                    </div>
                    {hasCollection && (
                        <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                            style={{ backgroundColor: `${collectionColor}20`, color: collectionColor }}
                        >
                            {recordCount}
                        </span>
                    )}
                </div>

                {/* Body */}
                <div className={`px-3 py-3 border-t ${isDark ? 'border-[#252525] bg-[#141414]' : 'border-gray-200 bg-white'}`}>
                    <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {data?.label || (hasCollection ? collectionName : 'Select a collection')}
                    </p>

                    {/* Schema Fields Preview */}
                    {hasCollection && schema.length > 0 && (
                        <div className={`mt-2 p-2 rounded-lg ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                            <p className={`text-[10px] font-medium uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Output Fields
                            </p>
                            <div className="space-y-1">
                                {schema.slice(0, 3).map((field, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5">
                                        <span className={`text-[10px] ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>•</span>
                                        <span className={`text-xs font-mono truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                            {field.name}
                                        </span>
                                        <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                            ({field.type})
                                        </span>
                                    </div>
                                ))}
                                {schema.length > 3 && (
                                    <p className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                        +{schema.length - 3} more fields
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Select Button or Status */}
                    <div className="mt-3">
                        {hasCollection ? (
                            <div className="flex items-center justify-between">
                                <div className={`flex items-center gap-1.5 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>{recordCount} records</span>
                                </div>
                                {isSuccess && (
                                    <div className="flex items-center gap-1 text-[10px] text-emerald-500">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Loaded</span>
                                    </div>
                                )}
                                <button
                                    onClick={handleSelectCollection}
                                    className={`text-[10px] px-2 py-1 rounded transition-all ${isDark ? 'hover:bg-[#252525] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                                >
                                    Change
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleSelectCollection}
                                className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2`}
                                style={{
                                    backgroundColor: `${collectionColor}15`,
                                    color: collectionColor,
                                }}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                                Select Collection
                            </button>
                        )}
                    </div>
                </div>

                {/* Output Variables Info */}
                {hasCollection && (
                    <div className={`px-3 py-2 text-[10px] border-t ${isDark ? 'border-[#252525] bg-[#0f0f0f] text-gray-500' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                        <span className="font-medium">Output:</span> {`{{records}}`} • {`{{currentRecord}}`}
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className={`!w-3 !h-3 !border-0 !-bottom-1.5`}
                style={{
                    backgroundColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : collectionColor,
                    boxShadow: `0 0 8px ${collectionColor}80`
                }}
            />
        </div>
    );
}

export default memo(DataSourceNode);
