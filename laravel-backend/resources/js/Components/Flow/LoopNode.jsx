import { memo } from 'react';
import { Handle, Position } from 'reactflow';

function LoopNode({ data, selected }) {
    return (
        <div className={`transition-all duration-200 ${selected ? 'scale-105' : ''}`}>
            {/* Target Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3.5 !h-3.5 !bg-indigo-500 !border-[3px] !border-[#0a0a0a] !-top-2 !shadow-lg"
                style={{ boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)' }}
            />

            <div
                className={`
                    relative min-w-[180px] rounded-xl overflow-hidden
                    ${selected ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0a0a0a]' : ''}
                `}
                style={{
                    background: 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)',
                    boxShadow: selected
                        ? '0 0 30px rgba(99, 102, 241, 0.15), 0 4px 20px rgba(0, 0, 0, 0.4)'
                        : '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ background: 'rgba(99, 102, 241, 0.08)' }}
                >
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(99, 102, 241, 0.2)' }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="#6366f1" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Loop</span>
                </div>

                {/* Body */}
                <div className="px-3 py-3 border-t border-[#252525] space-y-2">
                    <p className="text-sm font-medium text-gray-200">{data.label || 'For Each'}</p>

                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">Items:</span>
                        <span className="text-indigo-400 font-mono">{data.items || 'array'}</span>
                    </div>

                    {data.iterations && (
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="text-xs text-indigo-400 font-semibold">{data.iterations}x</span>
                        </div>
                    )}
                </div>

                {/* Branch Labels */}
                <div className="flex justify-between px-3 pb-2 text-[10px] font-semibold">
                    <span className="text-indigo-400">Each Item</span>
                    <span className="text-gray-500">Complete</span>
                </div>
            </div>

            {/* Loop Body Handle (Left) */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="loop"
                className="!w-3.5 !h-3.5 !bg-indigo-500 !border-[3px] !border-[#0a0a0a] !-bottom-2 !shadow-lg"
                style={{ left: '25%', boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)' }}
            />

            {/* Complete Handle (Right) */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="complete"
                className="!w-3.5 !h-3.5 !bg-gray-500 !border-[3px] !border-[#0a0a0a] !-bottom-2 !shadow-lg"
                style={{ left: '75%', boxShadow: '0 0 10px rgba(107, 114, 128, 0.5)' }}
            />
        </div>
    );
}

export default memo(LoopNode);
