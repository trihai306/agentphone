import { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';

function CustomNode({ data, selected }) {
    const [label, setLabel] = useState(data.label || 'Action');

    useEffect(() => {
        setLabel(data.label || 'Action');
    }, [data.label]);

    return (
        <div className={`transition-all duration-200 ${selected ? 'scale-105' : ''}`}>
            {/* Target Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3.5 !h-3.5 !bg-violet-500 !border-[3px] !border-[#0a0a0a] !-top-2 !shadow-lg"
                style={{ boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)' }}
            />

            <div
                className={`
                    relative min-w-[160px] rounded-xl overflow-hidden
                    ${selected
                        ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[#0a0a0a]'
                        : ''
                    }
                `}
                style={{
                    background: 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)',
                    boxShadow: selected
                        ? '0 0 30px rgba(139, 92, 246, 0.15), 0 4px 20px rgba(0, 0, 0, 0.4)'
                        : '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ background: 'rgba(139, 92, 246, 0.08)' }}
                >
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(139, 92, 246, 0.2)' }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="#8b5cf6" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Action</span>
                </div>

                {/* Body */}
                <div className="px-3 py-3 border-t border-[#252525]">
                    <p className="text-sm font-medium text-gray-200">{label}</p>
                </div>
            </div>

            {/* Source Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3.5 !h-3.5 !bg-violet-500 !border-[3px] !border-[#0a0a0a] !-bottom-2 !shadow-lg"
                style={{ boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)' }}
            />
        </div>
    );
}

export default memo(CustomNode);
