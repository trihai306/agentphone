import { memo } from 'react';
import { Handle, Position } from 'reactflow';

function HttpNode({ data, selected }) {
    const getMethodColor = (method) => {
        const colors = {
            GET: 'text-emerald-400 bg-emerald-400/10',
            POST: 'text-blue-400 bg-blue-400/10',
            PUT: 'text-amber-400 bg-amber-400/10',
            PATCH: 'text-orange-400 bg-orange-400/10',
            DELETE: 'text-red-400 bg-red-400/10',
        };
        return colors[method] || colors.GET;
    };

    return (
        <div className={`transition-all duration-200 ${selected ? 'scale-105' : ''}`}>
            {/* Target Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3.5 !h-3.5 !bg-orange-500 !border-[3px] !border-[#0a0a0a] !-top-2 !shadow-lg"
                style={{ boxShadow: '0 0 10px rgba(249, 115, 22, 0.5)' }}
            />

            <div
                className={`
                    relative min-w-[200px] rounded-xl overflow-hidden
                    ${selected ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-[#0a0a0a]' : ''}
                `}
                style={{
                    background: 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)',
                    boxShadow: selected
                        ? '0 0 30px rgba(249, 115, 22, 0.15), 0 4px 20px rgba(0, 0, 0, 0.4)'
                        : '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ background: 'rgba(249, 115, 22, 0.08)' }}
                >
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(249, 115, 22, 0.2)' }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="#f97316" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">HTTP Request</span>
                </div>

                {/* Body */}
                <div className="px-3 py-3 border-t border-[#252525] space-y-2">
                    <p className="text-sm font-medium text-gray-200">{data.label || 'API Call'}</p>

                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getMethodColor(data.method || 'GET')}`}>
                            {data.method || 'GET'}
                        </span>
                        {data.url && (
                            <span className="text-xs text-gray-500 truncate max-w-[120px] font-mono">
                                {data.url}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Source Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3.5 !h-3.5 !bg-orange-500 !border-[3px] !border-[#0a0a0a] !-bottom-2 !shadow-lg"
                style={{ boxShadow: '0 0 10px rgba(249, 115, 22, 0.5)' }}
            />
        </div>
    );
}

export default memo(HttpNode);
