import { memo } from 'react';
import { Handle, Position } from 'reactflow';

function ConditionNode({ data, selected }) {
    return (
        <div className={`transition-all duration-200 ${selected ? 'scale-105' : ''}`}>
            {/* Target Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3.5 !h-3.5 !bg-amber-500 !border-[3px] !border-[#0a0a0a] !-top-2 !shadow-lg"
                style={{ boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)' }}
            />

            <div
                className={`
                    relative min-w-[180px] rounded-xl overflow-hidden
                    ${selected ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-[#0a0a0a]' : ''}
                `}
                style={{
                    background: 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)',
                    boxShadow: selected
                        ? '0 0 30px rgba(245, 158, 11, 0.15), 0 4px 20px rgba(0, 0, 0, 0.4)'
                        : '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ background: 'rgba(245, 158, 11, 0.08)' }}
                >
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(245, 158, 11, 0.2)' }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="#f59e0b" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Condition</span>
                </div>

                {/* Body */}
                <div className="px-3 py-3 border-t border-[#252525]">
                    <p className="text-sm font-medium text-gray-200 mb-2">{data.label || 'If/Else'}</p>
                    {data.condition && (
                        <div className="text-xs text-gray-500 bg-[#0f0f0f] rounded-md px-2 py-1.5 font-mono truncate">
                            {data.condition}
                        </div>
                    )}
                </div>

                {/* Branch Labels */}
                <div className="flex justify-between px-3 pb-2 text-[10px] font-semibold">
                    <span className="text-emerald-400">True</span>
                    <span className="text-red-400">False</span>
                </div>
            </div>

            {/* True Handle (Left) */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="true"
                className="!w-3.5 !h-3.5 !bg-emerald-500 !border-[3px] !border-[#0a0a0a] !-bottom-2 !shadow-lg"
                style={{ left: '25%', boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }}
            />

            {/* False Handle (Right) */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="false"
                className="!w-3.5 !h-3.5 !bg-red-500 !border-[3px] !border-[#0a0a0a] !-bottom-2 !shadow-lg"
                style={{ left: '75%', boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }}
            />
        </div>
    );
}

export default memo(ConditionNode);
