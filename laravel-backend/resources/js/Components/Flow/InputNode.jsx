import { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';

function InputNode({ data, selected }) {
    const [label, setLabel] = useState(data.label || 'Start');

    useEffect(() => {
        setLabel(data.label || 'Start');
    }, [data.label]);

    return (
        <div className={`transition-all duration-200 ${selected ? 'scale-105' : ''}`}>
            <div
                className={`
                    relative min-w-[160px] rounded-xl overflow-hidden
                    ${selected
                        ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#0a0a0a]'
                        : ''
                    }
                `}
                style={{
                    background: 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)',
                    boxShadow: selected
                        ? '0 0 30px rgba(16, 185, 129, 0.15), 0 4px 20px rgba(0, 0, 0, 0.4)'
                        : '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ background: 'rgba(16, 185, 129, 0.08)' }}
                >
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(16, 185, 129, 0.2)' }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="#10b981" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Start</span>
                </div>

                {/* Body */}
                <div className="px-3 py-3 border-t border-[#252525]">
                    <p className="text-sm font-medium text-gray-200">{label}</p>
                </div>
            </div>

            {/* Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3.5 !h-3.5 !bg-emerald-500 !border-[3px] !border-[#0a0a0a] !-bottom-2 !shadow-lg"
                style={{ boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }}
            />
        </div>
    );
}

export default memo(InputNode);
