import { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';

function OutputNode({ data, selected }) {
    const [label, setLabel] = useState(data.label || 'End');

    useEffect(() => {
        setLabel(data.label || 'End');
    }, [data.label]);

    return (
        <div className={`transition-all duration-200 ${selected ? 'scale-105' : ''}`}>
            {/* Target Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3.5 !h-3.5 !bg-red-500 !border-[3px] !border-[#0a0a0a] !-top-2 !shadow-lg"
                style={{ boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }}
            />

            <div
                className={`
                    relative min-w-[160px] rounded-xl overflow-hidden
                    ${selected
                        ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-[#0a0a0a]'
                        : ''
                    }
                `}
                style={{
                    background: 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)',
                    boxShadow: selected
                        ? '0 0 30px rgba(239, 68, 68, 0.15), 0 4px 20px rgba(0, 0, 0, 0.4)'
                        : '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ background: 'rgba(239, 68, 68, 0.08)' }}
                >
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(239, 68, 68, 0.2)' }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="#ef4444" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">End</span>
                </div>

                {/* Body */}
                <div className="px-3 py-3 border-t border-[#252525]">
                    <p className="text-sm font-medium text-gray-200">{label}</p>
                </div>
            </div>
        </div>
    );
}

export default memo(OutputNode);
