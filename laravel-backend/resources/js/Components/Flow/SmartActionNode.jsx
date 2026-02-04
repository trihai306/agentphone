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

    // Display label - prefer custom label, fallback to action type label
    const displayLabel = label || '';
    const subtitle = selector.type !== 'auto' ? selector.value : '';

    return (
        <div className={`relative transition-all duration-200 ${isPending ? 'opacity-50' : ''}`}>
            {/* Input Handle - Left center */}
            <Handle
                type="target"
                position={Position.Left}
                id="input"
                className="!w-3 !h-3 !border-2 !rounded-full"
                style={{
                    backgroundColor: isDark ? '#1f1f1f' : '#fff',
                    borderColor: isDark ? '#525252' : '#d1d5db',
                    left: '-6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                }}
            />

            {/* Main Card - n8n style horizontal card */}
            <div
                className={`
                    relative flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer
                    min-w-[220px] max-w-[300px]
                    transition-all duration-200 group
                    ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                    ${isRunning ? 'animate-pulse' : ''}
                `}
                style={{
                    backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
                    border: `1.5px solid ${selected ? '#3b82f6' : isDark ? '#333' : '#e5e7eb'}`,
                    boxShadow: selected
                        ? '0 4px 20px rgba(59, 130, 246, 0.3)'
                        : isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.08)',
                }}
            >
                {/* Icon with colored background */}
                <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isRunning ? 'animate-pulse' : ''}`}
                    style={{
                        backgroundColor: `${colors.primary}20`,
                    }}
                >
                    {/* Show app icon for open_app if available */}
                    {(actionType === 'open_app' || actionType === 'launch_app') && data?.appIcon ? (
                        <img
                            src={`data:image/png;base64,${data.appIcon}`}
                            alt={data?.appName || 'App'}
                            className="w-8 h-8 object-contain rounded-lg"
                        />
                    ) : (
                        <div className="w-6 h-6 [&>svg]:w-full [&>svg]:h-full" style={{ color: colors.primary }}>
                            {isRunning ? (
                                <svg className="w-full h-full animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : isSuccess ? (
                                <svg className="w-full h-full text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : isError ? (
                                <svg className="w-full h-full text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : ActionIcon}
                        </div>
                    )}
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                    <div className={`text-base font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {colors.label}
                    </div>
                    {(displayLabel || subtitle) && (
                        <div className={`text-sm truncate mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {displayLabel || subtitle}
                        </div>
                    )}
                </div>

                {/* REC indicator */}
                {data?.isRecorded && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    </div>
                )}

                {/* Probability indicator - show when < 100% */}
                {data?.probability !== undefined && data.probability < 100 && (
                    <div
                        className={`absolute -top-2 ${data?.isRecorded ? '-right-8' : '-right-2'} px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 border-2 ${data.probability < 50
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'bg-blue-500 text-white border-blue-600'
                            }`}
                        title={`${data.probability}% chance to execute`}
                    >
                        <span>🎲</span>
                        <span>{data.probability}%</span>
                    </div>
                )}
            </div>

            {/* Output Handles - Right side, vertically spaced */}
            {/* Success/True handle */}
            <Handle
                type="source"
                position={Position.Right}
                id="true"
                className="!w-3 !h-3 !border-2 !rounded-full transition-transform hover:!scale-125"
                style={{
                    backgroundColor: isSuccess ? '#10b981' : (isDark ? '#065f46' : '#d1fae5'),
                    borderColor: '#22c55e',
                    right: '-6px',
                    top: '35%',
                }}
            />

            {/* Error/False handle */}
            <Handle
                type="source"
                position={Position.Right}
                id="false"
                className="!w-3 !h-3 !border-2 !rounded-full transition-transform hover:!scale-125"
                style={{
                    backgroundColor: isError ? '#ef4444' : (isDark ? '#7f1d1d' : '#fee2e2'),
                    borderColor: '#f87171',
                    right: '-6px',
                    top: '65%',
                }}
            />
        </div>
    );
}

export default memo(SmartActionNode);
