import { memo } from 'react';
import { Handle, Position } from 'reactflow';

function EmailNode({ data, selected }) {
    return (
        <div className={`transition-all duration-200 ${selected ? 'scale-105' : ''}`}>
            {/* Target Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3.5 !h-3.5 !bg-pink-500 !border-[3px] !border-[#0a0a0a] !-top-2 !shadow-lg"
                style={{ boxShadow: '0 0 10px rgba(236, 72, 153, 0.5)' }}
            />

            <div
                className={`
                    relative min-w-[180px] rounded-xl overflow-hidden
                    ${selected ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-[#0a0a0a]' : ''}
                `}
                style={{
                    background: 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)',
                    boxShadow: selected
                        ? '0 0 30px rgba(236, 72, 153, 0.15), 0 4px 20px rgba(0, 0, 0, 0.4)'
                        : '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ background: 'rgba(236, 72, 153, 0.08)' }}
                >
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(236, 72, 153, 0.2)' }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="#ec4899" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">Email</span>
                </div>

                {/* Body */}
                <div className="px-3 py-3 border-t border-[#252525] space-y-2">
                    <p className="text-sm font-medium text-gray-200">{data.label || 'Send Email'}</p>

                    {data.to && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-500">To:</span>
                            <span className="text-xs text-pink-400 truncate max-w-[120px]">{data.to}</span>
                        </div>
                    )}

                    {data.subject && (
                        <div className="text-xs text-gray-500 bg-[#0f0f0f] rounded-md px-2 py-1.5 truncate">
                            {data.subject}
                        </div>
                    )}
                </div>
            </div>

            {/* Source Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3.5 !h-3.5 !bg-pink-500 !border-[3px] !border-[#0a0a0a] !-bottom-2 !shadow-lg"
                style={{ boxShadow: '0 0 10px rgba(236, 72, 153, 0.5)' }}
            />
        </div>
    );
}

export default memo(EmailNode);
