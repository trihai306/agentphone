import { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { NodeStatus } from '@/hooks/useExecutionState';

/**
 * RecordedActionNode - Special node for recorded device actions
 * Shows action type icon, element info, coordinates, and screenshot thumbnail
 */
function RecordedActionNode({ data, selected }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Execution state
    const executionState = data?.executionState || NodeStatus.IDLE;
    const isRunning = executionState === NodeStatus.RUNNING;
    const isSuccess = executionState === NodeStatus.SUCCESS;
    const isError = executionState === NodeStatus.ERROR;
    const isPending = executionState === NodeStatus.PENDING;

    // Action type determines color and icon
    const actionType = data?.eventType || data?.type || 'click';

    // Get action color scheme
    const getActionColors = () => {
        switch (actionType) {
            case 'open_app':
            case 'launch_app':
                return {
                    primary: '#10b981',    // emerald/green for app launch
                    bg: 'rgba(16, 185, 129, 0.15)',
                    iconBg: 'rgba(16, 185, 129, 0.2)',
                    ring: 'ring-emerald-500',
                    text: 'text-emerald-400',
                    glow: '0 0 15px rgba(16, 185, 129, 0.3)'
                };
            case 'click':
            case 'tap':
            case 'long_click':
            case 'long_press':
                return {
                    primary: '#3b82f6',    // blue
                    bg: 'rgba(59, 130, 246, 0.15)',
                    iconBg: 'rgba(59, 130, 246, 0.2)',
                    ring: 'ring-blue-500',
                    text: 'text-blue-400',
                    glow: '0 0 15px rgba(59, 130, 246, 0.3)'
                };
            case 'text_input':
            case 'set_text':
                return {
                    primary: '#a855f7',    // purple
                    bg: 'rgba(168, 85, 247, 0.15)',
                    iconBg: 'rgba(168, 85, 247, 0.2)',
                    ring: 'ring-purple-500',
                    text: 'text-purple-400',
                    glow: '0 0 15px rgba(168, 85, 247, 0.3)'
                };
            case 'scroll':
            case 'scroll_up':
            case 'scroll_down':
                return {
                    primary: '#f59e0b',    // amber
                    bg: 'rgba(245, 158, 11, 0.15)',
                    iconBg: 'rgba(245, 158, 11, 0.2)',
                    ring: 'ring-amber-500',
                    text: 'text-amber-400',
                    glow: '0 0 15px rgba(245, 158, 11, 0.3)'
                };
            case 'swipe':
            case 'swipe_left':
            case 'swipe_right':
            case 'swipe_up':
            case 'swipe_down':
                return {
                    primary: '#06b6d4',    // cyan
                    bg: 'rgba(6, 182, 212, 0.15)',
                    iconBg: 'rgba(6, 182, 212, 0.2)',
                    ring: 'ring-cyan-500',
                    text: 'text-cyan-400',
                    glow: '0 0 15px rgba(6, 182, 212, 0.3)'
                };
            case 'key_event':
            case 'back':
            case 'home':
                return {
                    primary: '#ec4899',    // pink
                    bg: 'rgba(236, 72, 153, 0.15)',
                    iconBg: 'rgba(236, 72, 153, 0.2)',
                    ring: 'ring-pink-500',
                    text: 'text-pink-400',
                    glow: '0 0 15px rgba(236, 72, 153, 0.3)'
                };
            case 'wait':
            case 'delay':
                return {
                    primary: '#6b7280',    // gray
                    bg: 'rgba(107, 114, 128, 0.15)',
                    iconBg: 'rgba(107, 114, 128, 0.2)',
                    ring: 'ring-gray-500',
                    text: 'text-gray-400',
                    glow: '0 0 15px rgba(107, 114, 128, 0.3)'
                };
            case 'focus':
                return {
                    primary: '#8b5cf6',    // violet
                    bg: 'rgba(139, 92, 246, 0.15)',
                    iconBg: 'rgba(139, 92, 246, 0.2)',
                    ring: 'ring-violet-500',
                    text: 'text-violet-400',
                    glow: '0 0 15px rgba(139, 92, 246, 0.3)'
                };
            default:
                return {
                    primary: '#10b981',    // emerald
                    bg: 'rgba(16, 185, 129, 0.15)',
                    iconBg: 'rgba(16, 185, 129, 0.2)',
                    ring: 'ring-emerald-500',
                    text: 'text-emerald-400',
                    glow: '0 0 15px rgba(16, 185, 129, 0.3)'
                };
        }
    };

    // Get action icon SVG
    const getActionIcon = () => {
        switch (actionType) {
            case 'open_app':
            case 'launch_app':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l3-3m0 0l3 3m-3-3v8" opacity="0.6" />
                    </svg>
                );
            case 'tap':
            case 'click':
            case 'long_click':
            case 'long_press':
                return (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="4" fill="currentColor" />
                        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4" />
                        <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" />
                    </svg>
                );
            case 'focus':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                );
            case 'text_input':
            case 'set_text':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                );
            case 'scroll':
            case 'scroll_up':
            case 'scroll_down':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V1" opacity="0.4" />
                    </svg>
                );
            case 'swipe':
            case 'swipe_left':
            case 'swipe_right':
            case 'swipe_up':
            case 'swipe_down':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                );
            case 'key_event':
            case 'back':
            case 'home':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                );
            case 'wait':
            case 'delay':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                );
        }
    };

    // Format action label
    const getActionLabel = () => {
        const labels = {
            'open_app': 'Open App',
            'launch_app': 'Launch App',
            'tap': 'Tap',
            'click': 'Click',
            'long_click': 'Long Press',
            'long_press': 'Long Press',
            'focus': 'Focus',
            'text_input': 'Type Text',
            'set_text': 'Set Text',
            'scroll': 'Scroll',
            'scroll_up': 'Scroll Up',
            'scroll_down': 'Scroll Down',
            'swipe': 'Swipe',
            'swipe_left': 'Swipe Left',
            'swipe_right': 'Swipe Right',
            'swipe_up': 'Swipe Up',
            'swipe_down': 'Swipe Down',
            'key_event': 'Key Event',
            'back': 'Back Button',
            'home': 'Home Button',
            'wait': 'Wait',
            'delay': 'Delay'
        };
        return labels[actionType] || 'Action';
    };

    const colors = getActionColors();
    const label = data?.label || getActionLabel();
    const resourceId = data?.resourceId || '';
    const text = data?.text || '';
    const coordinates = data?.coordinates;
    const screenshotUrl = data?.screenshotUrl;

    // Get execution-based colors
    const getExecutionColors = () => {
        if (isRunning) return {
            bg: 'rgba(99, 102, 241, 0.15)',
            iconBg: 'rgba(99, 102, 241, 0.3)',
            ring: 'ring-indigo-500',
            text: 'text-indigo-400',
            glow: '0 0 20px rgba(99, 102, 241, 0.5)'
        };
        if (isSuccess) return {
            bg: 'rgba(16, 185, 129, 0.15)',
            iconBg: 'rgba(16, 185, 129, 0.3)',
            ring: 'ring-emerald-500',
            text: 'text-emerald-400',
            glow: '0 0 20px rgba(16, 185, 129, 0.4)'
        };
        if (isError) return {
            bg: 'rgba(239, 68, 68, 0.15)',
            iconBg: 'rgba(239, 68, 68, 0.3)',
            ring: 'ring-red-500',
            text: 'text-red-400',
            glow: '0 0 20px rgba(239, 68, 68, 0.5)'
        };
        return colors;
    };

    const activeColors = getExecutionColors();

    return (
        <div className={`transition-all duration-300 ${selected ? 'scale-105' : ''} ${isPending ? 'opacity-50' : ''} ${isRunning ? 'animate-pulse' : ''}`}>
            {/* Target Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className={`!w-3 !h-3 !border-0 !-top-1.5 transition-all`}
                style={{
                    backgroundColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : colors.primary,
                    boxShadow: `0 0 8px ${colors.primary}99`
                }}
            />

            <div
                className={`
                    relative min-w-[200px] max-w-[280px] rounded-xl overflow-hidden transition-all duration-300
                    ${selected ? `ring-2 ${activeColors.ring} ring-offset-2 ${isDark ? 'ring-offset-[#0a0a0a]' : 'ring-offset-white'}` : ''}
                `}
                style={{
                    background: isDark
                        ? 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)'
                        : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                    boxShadow: selected ? activeColors.glow : isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)',
                    border: `1px solid ${isDark ? '#252525' : '#e5e7eb'}`,
                }}
            >
                {/* Header with action type */}
                <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ background: activeColors.bg }}
                >
                    <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${isRunning ? 'animate-spin' : ''}`}
                        style={{ background: activeColors.iconBg }}
                    >
                        <div className={activeColors.text}>
                            {isRunning ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
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
                            ) : (
                                getActionIcon()
                            )}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className={`text-xs font-bold uppercase tracking-wider ${activeColors.text}`}>
                            {isRunning ? 'Executing...' : isSuccess ? 'Done' : isError ? 'Error' : getActionLabel()}
                        </span>
                    </div>
                    {/* Recorded badge */}
                    {data?.isRecorded && (
                        <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
                            REC
                        </div>
                    )}
                    {/* Repeat count badge for merged scrolls */}
                    {data?.repeatCount > 1 && (
                        <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                            ×{data.repeatCount}
                        </div>
                    )}
                </div>

                {/* Body with details */}
                <div className={`px-3 py-3 border-t ${isDark ? 'border-[#252525] bg-[#141414]' : 'border-gray-200 bg-white'}`}>
                    {/* Main label */}
                    <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {label}
                    </p>

                    {/* Resource ID or element selector */}
                    {resourceId && (
                        <div className={`flex items-center gap-1.5 mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            <span className="text-[10px] font-mono truncate">{resourceId}</span>
                        </div>
                    )}

                    {/* Text content preview */}
                    {text && (
                        <div className={`flex items-start gap-1.5 mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <svg className="w-3 h-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            <span className="text-[10px] truncate">"{text}"</span>
                        </div>
                    )}

                    {/* Coordinates */}
                    {coordinates && (coordinates.x !== undefined || coordinates.y !== undefined) && (
                        <div className={`flex items-center gap-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-[10px] font-mono">({coordinates.x}, {coordinates.y})</span>
                        </div>
                    )}
                </div>

                {/* Screenshot thumbnail */}
                {screenshotUrl && (
                    <div className={`px-3 py-2 border-t ${isDark ? 'border-[#252525] bg-[#0f0f0f]' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-gray-500/20">
                            <img
                                src={screenshotUrl}
                                alt="Action screenshot"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[8px] text-white font-medium">
                                Screenshot
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Source Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className={`!w-3 !h-3 !border-0 !-bottom-1.5 transition-all`}
                style={{
                    backgroundColor: isRunning ? '#6366f1' : isSuccess ? '#10b981' : isError ? '#ef4444' : colors.primary,
                    boxShadow: `0 0 8px ${colors.primary}99`
                }}
            />
        </div>
    );
}

export default memo(RecordedActionNode);
