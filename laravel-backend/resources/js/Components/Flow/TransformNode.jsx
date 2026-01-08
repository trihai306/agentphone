import { memo } from 'react';
import { Handle, Position } from 'reactflow';

function TransformNode({ data, selected }) {
    return (
        <div className={`transition-all duration-200 ${selected ? 'scale-105' : ''}`}>
            {/* Target Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3.5 !h-3.5 !bg-fuchsia-500 !border-[3px] !border-[#0a0a0a] !-top-2 !shadow-lg"
                style={{ boxShadow: '0 0 10px rgba(217, 70, 239, 0.5)' }}
            />

            <div
                className={`
                    relative min-w-[170px] rounded-xl overflow-hidden
                    ${selected ? 'ring-2 ring-fuchsia-500 ring-offset-2 ring-offset-[#0a0a0a]' : ''}
                `}
                style={{
                    background: 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)',
                    boxShadow: selected
                        ? '0 0 30px rgba(217, 70, 239, 0.15), 0 4px 20px rgba(0, 0, 0, 0.4)'
                        : '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ background: 'rgba(217, 70, 239, 0.08)' }}
                >
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(217, 70, 239, 0.2)' }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="#d946ef" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider">Transform</span>
                </div>

                {/* Body */}
                <div className="px-3 py-3 border-t border-[#252525] space-y-2">
                    <p className="text-sm font-medium text-gray-200">{data.label || 'Data Transform'}</p>

                    {data.transformation && (
                        <div className="text-xs text-gray-500 bg-[#0f0f0f] rounded-md px-2 py-1.5 font-mono truncate">
                            {data.transformation}
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span className="text-[10px] text-fuchsia-400 font-semibold">{data.type || 'Map'}</span>
                    </div>
                </div>
            </div>

            {/* Source Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3.5 !h-3.5 !bg-fuchsia-500 !border-[3px] !border-[#0a0a0a] !-bottom-2 !shadow-lg"
                style={{ boxShadow: '0 0 10px rgba(217, 70, 239, 0.5)' }}
            />
        </div>
    );
}

export default memo(TransformNode);
