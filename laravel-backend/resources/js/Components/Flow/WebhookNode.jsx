import { memo } from 'react';
import { Handle, Position } from 'reactflow';

function WebhookNode({ data, selected }) {
    return (
        <div className={`transition-all duration-200 ${selected ? 'scale-105' : ''}`}>
            <div
                className={`
                    relative min-w-[180px] rounded-xl overflow-hidden
                    ${selected ? 'ring-2 ring-teal-500 ring-offset-2 ring-offset-[#0a0a0a]' : ''}
                `}
                style={{
                    background: 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)',
                    boxShadow: selected
                        ? '0 0 30px rgba(20, 184, 166, 0.15), 0 4px 20px rgba(0, 0, 0, 0.4)'
                        : '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ background: 'rgba(20, 184, 166, 0.08)' }}
                >
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(20, 184, 166, 0.2)' }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Webhook</span>
                    <div className="ml-auto flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                        <span className="text-[10px] text-emerald-400">Trigger</span>
                    </div>
                </div>

                {/* Body */}
                <div className="px-3 py-3 border-t border-[#252525] space-y-2">
                    <p className="text-sm font-medium text-gray-200">{data.label || 'Webhook Trigger'}</p>

                    {data.endpoint && (
                        <div className="text-xs text-gray-500 bg-[#0f0f0f] rounded-md px-2 py-1.5 font-mono truncate">
                            {data.endpoint}
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded font-semibold">
                            {data.method || 'POST'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Source Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3.5 !h-3.5 !bg-teal-500 !border-[3px] !border-[#0a0a0a] !-bottom-2 !shadow-lg"
                style={{ boxShadow: '0 0 10px rgba(20, 184, 166, 0.5)' }}
            />
        </div>
    );
}

export default memo(WebhookNode);
