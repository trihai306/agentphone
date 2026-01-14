import { memo, useState, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * SmartActionNode - Professional workflow action node with smart I/O handles
 * 
 * Features:
 * - Input handle (top): Flow control + data input
 * - Output handles: Success (bottom), Error (bottom-right)
 * - Smart selector display with priority: resourceId > text > coordinates
 * - Variable binding support: {{variable}} syntax
 * - Configurable timeout/retry settings
 */
function SmartActionNode({ data, selected, id }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [isExpanded, setIsExpanded] = useState(false);

    // Execution state
    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;
    const isPending = executionState === NodeStatus.PENDING;

    // Action data
    const actionType = data?.eventType || data?.actionType || data?.type || 'tap';
    const label = data?.label || '';
    const resourceId = data?.resourceId || data?.resource_id || '';
    const text = data?.text || '';
    const coordinates = data?.x && data?.y ? { x: data.x, y: data.y } : null;
    const bounds = data?.bounds || '';
    const timeout = data?.timeout || 5000;
    const retryCount = data?.retryCount || 0;
    const inputVariable = data?.inputVariable || '';
    const outputVariable = data?.outputVariable || '';

    // Smart selector - priority display
    const selector = useMemo(() => {
        if (resourceId) return { type: 'id', value: resourceId, icon: '#' };
        if (text) return { type: 'text', value: text, icon: 'T' };
        if (coordinates) return { type: 'coords', value: `(${coordinates.x}, ${coordinates.y})`, icon: '📍' };
        if (bounds) return { type: 'bounds', value: bounds, icon: '⬜' };
        return { type: 'auto', value: 'Auto-detect', icon: '✨' };
    }, [resourceId, text, coordinates, bounds]);

    // Color scheme based on action type
    const colors = useMemo(() => {
        const colorMap = {
            open_app: { primary: '#10b981', name: 'emerald', label: 'Open App' },
            launch_app: { primary: '#10b981', name: 'emerald', label: 'Launch App' },
            tap: { primary: '#3b82f6', name: 'blue', label: 'Tap' },
            click: { primary: '#3b82f6', name: 'blue', label: 'Click' },
            long_press: { primary: '#6366f1', name: 'indigo', label: 'Long Press' },
            long_click: { primary: '#6366f1', name: 'indigo', label: 'Long Click' },
            text_input: { primary: '#a855f7', name: 'purple', label: 'Type Text' },
            set_text: { primary: '#a855f7', name: 'purple', label: 'Set Text' },
            scroll: { primary: '#f59e0b', name: 'amber', label: 'Scroll' },
            scroll_up: { primary: '#f59e0b', name: 'amber', label: 'Scroll Up' },
            scroll_down: { primary: '#f59e0b', name: 'amber', label: 'Scroll Down' },
            swipe: { primary: '#06b6d4', name: 'cyan', label: 'Swipe' },
            back: { primary: '#ec4899', name: 'pink', label: 'Back' },
            home: { primary: '#ec4899', name: 'pink', label: 'Home' },
            focus: { primary: '#8b5cf6', name: 'violet', label: 'Focus' },
            assert: { primary: '#22c55e', name: 'green', label: 'Assert' },
            wait: { primary: '#6b7280', name: 'gray', label: 'Wait' },
        };
        return colorMap[actionType] || { primary: '#6b7280', name: 'gray', label: 'Action' };
    }, [actionType]);

    // Handle icon based on action type
    const ActionIcon = useMemo(() => {
        const icons = {
            tap: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <circle cx="12" cy="12" r="3" />
                    <circle cx="12" cy="12" r="8" strokeDasharray="4 2" />
                </svg>
            ),
            click: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <circle cx="12" cy="12" r="3" />
                    <circle cx="12" cy="12" r="8" strokeDasharray="4 2" />
                </svg>
            ),
            text_input: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
            ),
            scroll: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            ),
            open_app: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v9m0 0l3-3m-3 3l-3-3" />
                </svg>
            ),
            back: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            ),
        };
        return icons[actionType] || icons.tap;
    }, [actionType]);

    // Execution status indicator
    const statusColor = isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : colors.primary;

    return (
        <div className={`transition-all duration-300 ${selected ? 'scale-[1.02]' : ''} ${isPending ? 'opacity-60' : ''}`}>
            {/* Input Handle - Data & Flow */}
            <Handle
                type="target"
                position={Position.Top}
                id="input"
                className="!w-4 !h-4 !border-2 !-top-2 !rounded-lg transition-all"
                style={{
                    backgroundColor: isDark ? '#1a1a1a' : '#fff',
                    borderColor: statusColor,
                    boxShadow: isRunning ? `0 0 10px ${statusColor}` : 'none'
                }}
            />

            {/* Main Node Container */}
            <div
                className={`
                    relative min-w-[240px] max-w-[300px] rounded-2xl overflow-hidden transition-all duration-300
                    ${selected ? `ring-2 ring-offset-2 ${isDark ? 'ring-offset-[#0a0a0a]' : 'ring-offset-white'}` : ''}
                `}
                style={{
                    background: isDark
                        ? 'linear-gradient(180deg, rgba(30,30,30,0.95) 0%, rgba(20,20,20,0.98) 100%)'
                        : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                    boxShadow: selected
                        ? `0 0 20px ${colors.primary}40, 0 8px 32px rgba(0,0,0,0.2)`
                        : isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.1)',
                    ringColor: colors.primary
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-2.5 px-3 py-2.5"
                    style={{
                        background: `linear-gradient(135deg, ${colors.primary}20 0%, ${colors.primary}10 100%)`,
                        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                    }}
                >
                    {/* Icon Container */}
                    <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${isRunning ? 'animate-pulse' : ''}`}
                        style={{ background: `${colors.primary}30` }}
                    >
                        <div style={{ color: colors.primary }}>
                            {isRunning ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : isSuccess ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : isError ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : ActionIcon}
                        </div>
                    </div>

                    {/* Title & Type */}
                    <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white/90' : 'text-gray-800'}`}>
                            {colors.label}
                        </div>
                        {data?.repeatCount > 1 && (
                            <div className="text-[10px] font-medium" style={{ color: colors.primary }}>
                                ×{data.repeatCount} times
                            </div>
                        )}
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-1">
                        {data?.isRecorded && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-red-500/20 text-red-400">
                                REC
                            </span>
                        )}
                        {inputVariable && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-violet-500/20 text-violet-400">
                                IN
                            </span>
                        )}
                        {outputVariable && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-emerald-500/20 text-emerald-400">
                                OUT
                            </span>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className={`px-3 py-3 space-y-2 ${isDark ? 'bg-[#141414]' : 'bg-white'}`}>
                    {/* Label */}
                    {label && (
                        <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            {label}
                        </p>
                    )}

                    {/* Smart Selector */}
                    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                        <span className="text-xs font-bold" style={{ color: colors.primary }}>
                            {selector.icon}
                        </span>
                        <span className={`text-[11px] font-mono flex-1 truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {selector.value}
                        </span>
                        <span className={`text-[9px] uppercase font-medium ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            {selector.type}
                        </span>
                    </div>

                    {/* Text Input Value (for text_input type) */}
                    {(actionType === 'text_input' || actionType === 'set_text') && text && (
                        <div className={`px-2.5 py-2 rounded-lg border ${isDark ? 'bg-purple-500/5 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
                            <div className="flex items-center gap-1 mb-1">
                                <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                <span className="text-[10px] text-purple-400 font-medium">Input Text</span>
                            </div>
                            <p className={`text-xs font-mono ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                                "{text}"
                            </p>
                        </div>
                    )}

                    {/* Variable Bindings */}
                    {inputVariable && (
                        <div className={`flex items-center gap-2 text-[10px] ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span className="font-mono">{`{{${inputVariable}}}`}</span>
                        </div>
                    )}

                    {/* Expanded Details - All APK Event Data */}
                    {isExpanded && (
                        <div className={`pt-2 mt-2 border-t space-y-1.5 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                            {/* Package Name */}
                            {data?.packageName && (
                                <div className={`flex items-start gap-2 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <span className="shrink-0 text-pink-400">📦 Package:</span>
                                    <span className="font-mono break-all">{data.packageName}</span>
                                </div>
                            )}

                            {/* Class Name */}
                            {data?.className && (
                                <div className={`flex items-start gap-2 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <span className="shrink-0 text-orange-400">🏷️ Class:</span>
                                    <span className="font-mono break-all">{data.className}</span>
                                </div>
                            )}

                            {/* Resource ID */}
                            {resourceId && (
                                <div className={`flex items-start gap-2 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <span className="shrink-0 text-blue-400"># ID:</span>
                                    <span className="font-mono break-all text-green-400">{resourceId}</span>
                                </div>
                            )}

                            {/* Content Description */}
                            {data?.contentDescription && (
                                <div className={`flex items-start gap-2 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <span className="shrink-0 text-purple-400">📝 Desc:</span>
                                    <span className="font-mono break-all">{data.contentDescription}</span>
                                </div>
                            )}

                            {/* Bounds */}
                            {bounds && (
                                <div className={`flex items-start gap-2 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <span className="shrink-0 text-cyan-400">⬜ Bounds:</span>
                                    <span className="font-mono">{bounds}</span>
                                </div>
                            )}

                            {/* Coordinates */}
                            {coordinates && (
                                <div className={`flex items-center gap-2 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <span className="text-yellow-400">📍 Coords:</span>
                                    <span className="font-mono">({coordinates.x}, {coordinates.y})</span>
                                </div>
                            )}

                            {/* Action Data */}
                            {data?.actionData && Object.keys(data.actionData).length > 0 && (
                                <div className={`flex flex-col gap-1 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <span className="text-fuchsia-400">⚡ Action Data:</span>
                                    <div className={`font-mono text-[9px] p-1.5 rounded ${isDark ? 'bg-white/5' : 'bg-gray-100'} break-all`}>
                                        {JSON.stringify(data.actionData, null, 2)}
                                    </div>
                                </div>
                            )}

                            {/* Timeout */}
                            {timeout !== 5000 && (
                                <div className={`flex items-center gap-2 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <span>⏱ Timeout:</span>
                                    <span className="font-mono">{timeout}ms</span>
                                </div>
                            )}

                            {/* Retry Count */}
                            {retryCount > 0 && (
                                <div className={`flex items-center gap-2 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <span>🔄 Retry:</span>
                                    <span className="font-mono">{retryCount}x</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Expand Toggle */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`w-full text-center text-[10px] py-1 rounded-md transition-colors ${isDark ? 'text-gray-500 hover:bg-white/5' : 'text-gray-400 hover:bg-gray-100'}`}
                    >
                        {isExpanded ? '▲ Less' : '▼ More'}
                    </button>
                </div>

                {/* Footer - Output Info */}
                {outputVariable && (
                    <div
                        className={`px-3 py-2 text-[10px] ${isDark ? 'bg-emerald-500/5 border-t border-emerald-500/10' : 'bg-emerald-50 border-t border-emerald-100'}`}
                    >
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className={`${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                Output: <span className="font-mono font-medium">{`{{${outputVariable}}}`}</span>
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Output Handles Container with Labels */}
            <div className="relative">
                {/* TRUE Handle - Success Path */}
                <div className="absolute -bottom-7 left-[25%] transform -translate-x-1/2 flex flex-col items-center group">
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="true"
                        className="!relative !transform-none !w-5 !h-5 !border-2 !rounded-lg transition-all group-hover:scale-110"
                        style={{
                            backgroundColor: isDark ? '#0a2e1a' : '#dcfce7',
                            borderColor: isSuccess ? '#10b981' : '#22c55e',
                            boxShadow: isSuccess ? '0 0 12px #10b981' : '0 2px 4px rgba(34, 197, 94, 0.2)'
                        }}
                    />
                    <span className={`mt-1 text-[9px] font-bold uppercase tracking-wide transition-opacity ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        ✓ TRUE
                    </span>
                </div>

                {/* FALSE Handle - Failure Path */}
                <div className="absolute -bottom-7 left-[75%] transform -translate-x-1/2 flex flex-col items-center group">
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="false"
                        className="!relative !transform-none !w-5 !h-5 !border-2 !rounded-lg transition-all group-hover:scale-110"
                        style={{
                            backgroundColor: isDark ? '#2e0a0a' : '#fef2f2',
                            borderColor: isError ? '#ef4444' : '#f87171',
                            boxShadow: isError ? '0 0 12px #ef4444' : '0 2px 4px rgba(248, 113, 113, 0.2)'
                        }}
                    />
                    <span className={`mt-1 text-[9px] font-bold uppercase tracking-wide transition-opacity ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                        ✗ FALSE
                    </span>
                </div>
            </div>

            {/* Spacer for handle labels */}
            <div className="h-5" />
        </div>
    );
}

export default memo(SmartActionNode);
