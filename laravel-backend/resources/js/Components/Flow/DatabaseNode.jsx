import { memo } from 'react';
import { Handle, Position } from 'reactflow';

function DatabaseNode({ data, selected }) {
    const getOperationColor = (operation) => {
        const colors = {
            SELECT: 'text-emerald-400 bg-emerald-400/10',
            INSERT: 'text-blue-400 bg-blue-400/10',
            UPDATE: 'text-amber-400 bg-amber-400/10',
            DELETE: 'text-red-400 bg-red-400/10',
        };
        return colors[operation] || colors.SELECT;
    };

    return (
        <div className={`transition-all duration-200 ${selected ? 'scale-105' : ''}`}>
            {/* Target Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3.5 !h-3.5 !bg-lime-500 !border-[3px] !border-[#0a0a0a] !-top-2 !shadow-lg"
                style={{ boxShadow: '0 0 10px rgba(132, 204, 22, 0.5)' }}
            />

            <div
                className={`
                    relative min-w-[180px] rounded-xl overflow-hidden
                    ${selected ? 'ring-2 ring-lime-500 ring-offset-2 ring-offset-[#0a0a0a]' : ''}
                `}
                style={{
                    background: 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)',
                    boxShadow: selected
                        ? '0 0 30px rgba(132, 204, 22, 0.15), 0 4px 20px rgba(0, 0, 0, 0.4)'
                        : '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ background: 'rgba(132, 204, 22, 0.08)' }}
                >
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(132, 204, 22, 0.2)' }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="#84cc16" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-lime-400 uppercase tracking-wider">Database</span>
                </div>

                {/* Body */}
                <div className="px-3 py-3 border-t border-[#252525] space-y-2">
                    <p className="text-sm font-medium text-gray-200">{data.label || 'Query'}</p>

                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getOperationColor(data.operation || 'SELECT')}`}>
                            {data.operation || 'SELECT'}
                        </span>
                        {data.table && (
                            <span className="text-xs text-gray-500 font-mono">{data.table}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Source Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3.5 !h-3.5 !bg-lime-500 !border-[3px] !border-[#0a0a0a] !-bottom-2 !shadow-lg"
                style={{ boxShadow: '0 0 10px rgba(132, 204, 22, 0.5)' }}
            />
        </div>
    );
}

export default memo(DatabaseNode);
