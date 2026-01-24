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
    const boundsRaw = data?.bounds;
    const bounds = typeof boundsRaw === 'object' && boundsRaw !== null
        ? `${boundsRaw.width ?? 0}×${boundsRaw.height ?? 0} @ (${boundsRaw.left ?? 0}, ${boundsRaw.top ?? 0})`
        : (typeof boundsRaw === 'string' ? boundsRaw : '');
    const timeout = data?.timeout || 5000;
    const retryCount = data?.retryCount || 0;
    const inputVariable = data?.inputVariable || '';
    const outputVariable = data?.outputVariable || '';

    // Connected data source info (from data wire)
    const connectedDataSource = data?.connectedDataSource || null;
    const connectedVariable = data?.connectedVariable || '';

    // Check if this node type supports data input (text_input, set_text)
    const supportsDataInput = ['text_input', 'set_text'].includes(actionType);

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
            long_tap: { primary: '#6366f1', name: 'indigo', label: 'Long Tap' },
            long_press: { primary: '#6366f1', name: 'indigo', label: 'Long Press' },
            long_click: { primary: '#6366f1', name: 'indigo', label: 'Long Click' },
            double_tap: { primary: '#8b5cf6', name: 'violet', label: 'Double Tap' },
            text_input: { primary: '#a855f7', name: 'purple', label: 'Type Text' },
            set_text: { primary: '#a855f7', name: 'purple', label: 'Set Text' },
            scroll: { primary: '#f59e0b', name: 'amber', label: 'Scroll' },
            scroll_up: { primary: '#f59e0b', name: 'amber', label: 'Scroll Up' },
            scroll_down: { primary: '#f59e0b', name: 'amber', label: 'Scroll Down' },
            scroll_left: { primary: '#f59e0b', name: 'amber', label: 'Scroll Left' },
            scroll_right: { primary: '#f59e0b', name: 'amber', label: 'Scroll Right' },
            swipe: { primary: '#06b6d4', name: 'cyan', label: 'Swipe' },
            swipe_left: { primary: '#06b6d4', name: 'cyan', label: 'Swipe Left' },
            swipe_right: { primary: '#06b6d4', name: 'cyan', label: 'Swipe Right' },
            swipe_up: { primary: '#06b6d4', name: 'cyan', label: 'Swipe Up' },
            swipe_down: { primary: '#06b6d4', name: 'cyan', label: 'Swipe Down' },
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
            long_tap: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="12" cy="12" r="9" strokeDasharray="2 3" />
                </svg>
            ),
            long_press: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="12" cy="12" r="9" strokeDasharray="2 3" />
                </svg>
            ),
            double_tap: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <circle cx="9" cy="12" r="3" />
                    <circle cx="15" cy="12" r="3" />
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
            scroll_up: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
            ),
            scroll_down: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            ),
            scroll_left: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
            ),
            scroll_right: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            ),
            swipe: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
            ),
            swipe_left: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            ),
            swipe_right: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
            ),
            swipe_up: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
            ),
            swipe_down: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
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
            home: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        };
        return icons[actionType] || icons.tap;
    }, [actionType]);

    // Execution status indicator
    const statusColor = isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : colors.primary;

    return (
        <div className={`relative transition-all duration-300 ${selected ? 'scale-[1.02]' : ''} ${isPending ? 'opacity-60' : ''}`}>
            {/* Input Handle - Left edge center */}
            <Handle
                type="target"
                position={Position.Left}
                id="input"
                className="!w-3 !h-3 !border-2 !rounded-full !-left-1.5"
                style={{
                    backgroundColor: isDark ? '#1a1a1a' : '#fff',
                    borderColor: statusColor,
                    boxShadow: isRunning ? `0 0 10px ${statusColor}` : 'none',
                    top: '50%',
                    transform: 'translateY(-50%)'
                }}
            />

            {/* Main Node Card - Single unified card */}
            <div
                className={`
                    min-w-[220px] max-w-[280px] rounded-xl overflow-hidden transition-all duration-300
                    ${selected ? `ring-2 ring-offset-2 ${isDark ? 'ring-offset-[#0a0a0a]' : 'ring-offset-white'}` : ''}
                `}
                style={{
                    background: isDark
                        ? 'linear-gradient(180deg, rgba(30,30,30,0.98) 0%, rgba(22,22,22,1) 100%)'
                        : 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(250,250,250,1) 100%)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                    boxShadow: selected
                        ? `0 0 0 2px ${colors.primary}40, 0 8px 24px rgba(0,0,0,0.15)`
                        : isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 2px 12px rgba(0,0,0,0.08)',
                    ringColor: colors.primary
                }}
            >
                {/* Header with colored accent */}
                <div
                    className="flex items-center gap-2.5 px-3 py-2"
                    style={{
                        background: `linear-gradient(135deg, ${colors.primary}15 0%, transparent 100%)`,
                        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`
                    }}
                >
                    {/* Icon */}
                    <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isRunning ? 'animate-pulse' : ''}`}
                        style={{ background: `${colors.primary}25` }}
                    >
                        <div className="w-3.5 h-3.5" style={{ color: colors.primary }}>
                            {isRunning ? (
                                <svg className="w-full h-full animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : isSuccess ? (
                                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : isError ? (
                                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : ActionIcon}
                        </div>
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                        <div className={`text-[11px] font-bold uppercase tracking-wide ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {colors.label}
                        </div>
                    </div>

                    {/* REC Badge */}
                    {data?.isRecorded && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-500 text-white">
                            REC
                        </span>
                    )}
                </div>

                {/* Body */}
                <div className={`px-3 py-2 ${isDark ? 'bg-[#161616]' : 'bg-white'}`}>
                    {/* Label */}
                    {label && (
                        <p className={`text-sm font-medium truncate mb-1.5 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            {label}
                        </p>
                    )}

                    {/* Selector info */}
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                        <span style={{ color: colors.primary }}>{selector.icon}</span>
                        <span className={`font-mono truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {selector.value}
                        </span>
                    </div>

                    {/* More toggle */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`w-full text-center text-[9px] py-1 mt-1.5 rounded transition-colors ${isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        {isExpanded ? '▲ Less' : '▼ More'}
                    </button>
                </div>

                {/* Output Footer - Clean integrated design */}
                <div className={`flex items-center justify-end gap-3 px-3 py-1.5 border-t ${isDark ? 'border-white/5 bg-[#131313]' : 'border-gray-100 bg-gray-50/50'}`}>
                    {/* Success output */}
                    <div className="flex items-center gap-1 group cursor-pointer">
                        <span className={`text-[9px] font-medium ${isDark ? 'text-emerald-400/70' : 'text-emerald-600/70'} group-hover:text-emerald-400`}>
                            ✓
                        </span>
                        <div
                            className={`w-2 h-2 rounded-full border transition-transform group-hover:scale-125 ${isSuccess ? 'bg-emerald-500 border-emerald-400' : isDark ? 'bg-emerald-900/50 border-emerald-700' : 'bg-emerald-100 border-emerald-300'}`}
                        />
                    </div>

                    {/* Error output */}
                    <div className="flex items-center gap-1 group cursor-pointer">
                        <span className={`text-[9px] font-medium ${isDark ? 'text-red-400/70' : 'text-red-600/70'} group-hover:text-red-400`}>
                            ✗
                        </span>
                        <div
                            className={`w-2 h-2 rounded-full border transition-transform group-hover:scale-125 ${isError ? 'bg-red-500 border-red-400' : isDark ? 'bg-red-900/50 border-red-700' : 'bg-red-100 border-red-300'}`}
                        />
                    </div>
                </div>
            </div>

            {/* Output Handles - On right edge, aligned with footer dots */}
            <Handle
                type="source"
                position={Position.Right}
                id="true"
                className="!w-3 !h-3 !border-2 !rounded-full !-right-1.5"
                style={{
                    backgroundColor: isSuccess ? '#10b981' : (isDark ? '#064e3b' : '#d1fae5'),
                    borderColor: '#22c55e',
                    boxShadow: isSuccess ? '0 0 8px #10b981' : 'none',
                    bottom: '20px',
                    top: 'auto',
                }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="false"
                className="!w-3 !h-3 !border-2 !rounded-full !-right-1.5"
                style={{
                    backgroundColor: isError ? '#ef4444' : (isDark ? '#7f1d1d' : '#fee2e2'),
                    borderColor: '#f87171',
                    boxShadow: isError ? '0 0 8px #ef4444' : 'none',
                    bottom: '20px',
                    top: 'auto',
                    transform: 'translateY(12px)',
                }}
            />
        </div>
    );
}

export default memo(SmartActionNode);
