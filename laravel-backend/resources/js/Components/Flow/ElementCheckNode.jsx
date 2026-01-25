import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * ElementCheckNode - Kiểm tra element tồn tại/text content và branching
 * Layout: Horizontal (Input Left → Outputs Right)
 */
function ElementCheckNode({ data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const checkType = data?.checkType || 'exists';
    const executionState = data?.executionState || 'idle';
    const lastResult = data?.lastResult;

    const isRunning = executionState === 'running';
    const isTrue = lastResult === 'true';
    const isFalse = lastResult === 'false';

    const color = '#f59e0b'; // Amber

    const checkTypeLabels = {
        'exists': '✓ Tồn tại',
        'not_exists': '✗ Không tồn tại',
        'text_equals': '= Text bằng',
        'contains': '⊃ Chứa text',
        'visible': '👁 Hiển thị',
    };

    return (
        <div className={`group transition-all duration-300 ${selected ? 'scale-[1.02]' : ''} ${isRunning ? 'animate-pulse' : ''}`}>
            {/* Input Handle - Left */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-4 !h-4 !border-[3px] !-left-2 transition-all duration-300 group-hover:!scale-110"
                style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: isRunning ? '#6366f1' : isTrue ? '#10b981' : isFalse ? '#ef4444' : color,
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: `0 0 15px ${color}60`,
                }}
            />

            {/* Main Card */}
            <div
                className={`relative min-w-[220px] rounded-2xl overflow-hidden ${selected ? 'ring-2 ring-offset-2' : ''}`}
                style={{
                    background: isDark
                        ? `linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.9) 100%)`
                        : `linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)`,
                    backdropFilter: 'blur(20px)',
                    boxShadow: selected
                        ? `0 0 40px ${color}25, 0 8px 32px rgba(0, 0, 0, ${isDark ? '0.5' : '0.15'})`
                        : `0 8px 32px rgba(0, 0, 0, ${isDark ? '0.4' : '0.1'})`,
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                    ringColor: color,
                    ringOffsetColor: isDark ? '#0a0a0a' : '#ffffff',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)` }}
                >
                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRunning ? 'animate-spin' : ''}`}
                        style={{
                            background: `linear-gradient(135deg, ${color}30 0%, ${color}15 100%)`,
                            boxShadow: `0 4px 12px ${color}30`,
                        }}
                    >
                        {isRunning ? (
                            <svg className="w-5 h-5" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        ) : isTrue ? (
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : isFalse ? (
                            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold" style={{ color: isTrue ? '#10b981' : isFalse ? '#ef4444' : color }}>
                            {isRunning ? '🔍 Đang kiểm tra...' : isTrue ? '✓ Đúng' : isFalse ? '✗ Sai' : '❓ Kiểm Tra'}
                        </h3>
                        <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {data?.label || 'Element Check'}
                        </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium`} style={{ backgroundColor: `${color}20`, color }}>
                        IF
                    </span>
                </div>

                {/* Body */}
                <div className={`px-4 py-3 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    {/* Check Type Badge */}
                    <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg mb-2`} style={{ backgroundColor: `${color}15`, color }}>
                        {checkTypeLabels[checkType] || checkType}
                    </div>

                    {/* Resource ID */}
                    {data?.resourceId && (
                        <div className={`text-xs font-mono px-2.5 py-1.5 rounded-lg truncate ${isDark ? 'bg-black/30 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                            {data.resourceId}
                        </div>
                    )}
                </div>
            </div>

            {/* True Handle - Right Top */}
            <Handle
                type="source"
                position={Position.Right}
                id="true"
                className="!w-4 !h-4 !border-[3px] !-right-2 transition-transform hover:!scale-125"
                style={{
                    top: '35%',
                    backgroundColor: '#10b981',
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: isTrue ? '0 0 15px rgba(16, 185, 129, 0.8)' : '0 0 10px rgba(16, 185, 129, 0.4)',
                }}
            />

            {/* False Handle - Right Bottom */}
            <Handle
                type="source"
                position={Position.Right}
                id="false"
                className="!w-4 !h-4 !border-[3px] !-right-2 transition-transform hover:!scale-125"
                style={{
                    top: '65%',
                    backgroundColor: '#ef4444',
                    borderColor: isDark ? '#0a0a0a' : '#ffffff',
                    boxShadow: isFalse ? '0 0 15px rgba(239, 68, 68, 0.8)' : '0 0 10px rgba(239, 68, 68, 0.4)',
                }}
            />
        </div>
    );
}

export default memo(ElementCheckNode);
