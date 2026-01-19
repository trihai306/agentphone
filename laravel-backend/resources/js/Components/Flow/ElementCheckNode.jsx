import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * ElementCheckNode - Kiểm tra element tồn tại/text content và branching
 * 
 * Check types:
 * - exists: Element có tồn tại
 * - not_exists: Element không tồn tại  
 * - text_equals: Text khớp chính xác
 * - contains: Chứa text
 * - visible: Element visible trên màn hình
 */
function ElementCheckNode({ data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const checkType = data?.checkType || 'exists';
    const executionState = data?.executionState || 'idle';
    const lastResult = data?.lastResult; // 'true' | 'false' | null

    const isRunning = executionState === 'running';
    const isTrue = lastResult === 'true';
    const isFalse = lastResult === 'false';

    const checkTypeLabels = {
        'exists': '✓ Tồn tại',
        'not_exists': '✗ Không tồn tại',
        'text_equals': '= Text bằng',
        'contains': '⊃ Chứa text',
        'visible': '👁 Hiển thị',
    };

    const getStatusColor = () => {
        if (isRunning) return { bg: 'rgba(99, 102, 241, 0.15)', text: 'text-indigo-400', border: 'border-indigo-500' };
        if (isTrue) return { bg: 'rgba(16, 185, 129, 0.15)', text: 'text-emerald-400', border: 'border-emerald-500' };
        if (isFalse) return { bg: 'rgba(239, 68, 68, 0.15)', text: 'text-red-400', border: 'border-red-500' };
        return { bg: 'rgba(245, 158, 11, 0.1)', text: 'text-amber-400', border: 'border-amber-500' };
    };

    const status = getStatusColor();

    return (
        <div className={`transition-all duration-300 ${selected ? 'scale-105' : ''} ${isRunning ? 'animate-pulse' : ''}`}>
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3.5 !h-3.5 !border-[3px] !-top-2"
                style={{
                    backgroundColor: '#f59e0b',
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)'
                }}
            />

            <div
                className={`relative min-w-[220px] rounded-xl overflow-hidden transition-all duration-300
                    ${selected ? `ring-2 ${status.border} ring-offset-2 ${isDark ? 'ring-offset-[#0a0a0a]' : 'ring-offset-white'}` : ''}`}
                style={{
                    background: isDark
                        ? 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)'
                        : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                    boxShadow: isDark ? '0 4px 25px rgba(0,0,0,0.4)' : '0 4px 25px rgba(0,0,0,0.1)',
                    border: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`,
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-2.5 px-3.5 py-3"
                    style={{ background: status.bg }}
                >
                    <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${isRunning ? 'animate-spin' : ''}`}
                        style={{ background: 'rgba(245, 158, 11, 0.25)' }}
                    >
                        {isRunning ? (
                            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        ) : isTrue ? (
                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : isFalse ? (
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1">
                        <span className={`text-xs font-bold uppercase tracking-wider ${status.text}`}>
                            {isRunning ? 'Đang kiểm tra...' : isTrue ? 'Đúng ✓' : isFalse ? 'Sai ✗' : 'Kiểm Tra'}
                        </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                        IF
                    </span>
                </div>

                {/* Body */}
                <div className={`px-3.5 py-3 border-t ${isDark ? 'border-[#252525]' : 'border-gray-100'}`}>
                    {/* Label */}
                    <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {data?.label || 'Element Check'}
                    </p>

                    {/* Check Type Badge */}
                    <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg mb-2 ${isDark ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
                        {checkTypeLabels[checkType] || checkType}
                    </div>

                    {/* Resource ID */}
                    {data?.resourceId && (
                        <div className={`text-xs font-mono px-2.5 py-1.5 rounded-lg mb-2 truncate ${isDark ? 'bg-[#0f0f0f] text-gray-500' : 'bg-gray-50 text-gray-500'}`}>
                            {data.resourceId}
                        </div>
                    )}

                    {/* Expected Value */}
                    {(checkType === 'text_equals' || checkType === 'contains') && data?.expectedValue && (
                        <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span className="text-amber-400">=</span>
                            <span className="font-mono truncate">"{data.expectedValue}"</span>
                        </div>
                    )}

                    {/* Timeout */}
                    {data?.timeout && (
                        <div className={`flex items-center gap-1 text-[10px] mt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            <span>⏱</span>
                            <span>{data.timeout / 1000}s timeout</span>
                        </div>
                    )}
                </div>

                {/* Branch Labels */}
                <div className={`flex items-center justify-between px-3.5 py-2.5 ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${isTrue ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500/50'}`} />
                        <span className={`text-[11px] font-semibold ${isTrue ? 'text-emerald-400' : isDark ? 'text-emerald-500/70' : 'text-emerald-600/70'}`}>
                            TRUE
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-semibold ${isFalse ? 'text-red-400' : isDark ? 'text-red-500/70' : 'text-red-600/70'}`}>
                            FALSE
                        </span>
                        <div className={`w-2.5 h-2.5 rounded-full ${isFalse ? 'bg-red-500 animate-pulse' : 'bg-red-500/50'}`} />
                    </div>
                </div>
            </div>

            {/* True Handle (Left) */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="true"
                className="!w-3.5 !h-3.5 !border-[3px] !-bottom-2"
                style={{
                    left: '25%',
                    backgroundColor: '#10b981',
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: isTrue ? '0 0 15px rgba(16, 185, 129, 0.8)' : '0 0 8px rgba(16, 185, 129, 0.4)'
                }}
            />

            {/* False Handle (Right) */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="false"
                className="!w-3.5 !h-3.5 !border-[3px] !-bottom-2"
                style={{
                    left: '75%',
                    backgroundColor: '#ef4444',
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: isFalse ? '0 0 15px rgba(239, 68, 68, 0.8)' : '0 0 8px rgba(239, 68, 68, 0.4)'
                }}
            />
        </div>
    );
}

export default memo(ElementCheckNode);
