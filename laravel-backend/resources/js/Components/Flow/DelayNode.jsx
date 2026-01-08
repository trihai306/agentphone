import { memo } from 'react';
import { Handle, Position } from 'reactflow';

function DelayNode({ data, selected }) {
    const formatDelay = () => {
        if (!data.delay) return '1 minute';
        const { value, unit } = data.delay;
        return `${value} ${unit}${value > 1 ? 's' : ''}`;
    };

    return (
        <div className={`transition-all duration-200 ${selected ? 'scale-105' : ''}`}>
            {/* Target Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3.5 !h-3.5 !bg-cyan-500 !border-[3px] !border-[#0a0a0a] !-top-2 !shadow-lg"
                style={{ boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)' }}
            />

            <div
                className={`
                    relative min-w-[160px] rounded-xl overflow-hidden
                    ${selected ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#0a0a0a]' : ''}
                `}
                style={{
                    background: 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)',
                    boxShadow: selected
                        ? '0 0 30px rgba(6, 182, 212, 0.15), 0 4px 20px rgba(0, 0, 0, 0.4)'
                        : '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ background: 'rgba(6, 182, 212, 0.08)' }}
                >
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(6, 182, 212, 0.2)' }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="#06b6d4" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Delay</span>
                </div>

                {/* Body */}
                <div className="px-3 py-3 border-t border-[#252525]">
                    <p className="text-sm font-medium text-gray-200">{data.label || 'Wait'}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                        <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-cyan-400 font-semibold">{formatDelay()}</span>
                    </div>
                </div>
            </div>

            {/* Source Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3.5 !h-3.5 !bg-cyan-500 !border-[3px] !border-[#0a0a0a] !-bottom-2 !shadow-lg"
                style={{ boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)' }}
            />
        </div>
    );
}

export default memo(DelayNode);
