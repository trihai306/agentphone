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
            // Basic actions
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
            repeat_click: { primary: '#8b5cf6', name: 'violet', label: 'Repeat Click' },
            // Advanced Gestures
            drag_drop: { primary: '#14b8a6', name: 'teal', label: 'Drag & Drop' },
            pinch_zoom: { primary: '#f97316', name: 'orange', label: 'Pinch Zoom' },
            fling: { primary: '#eab308', name: 'yellow', label: 'Fling' },
            // System Actions
            recents: { primary: '#0ea5e9', name: 'sky', label: 'Recent Apps' },
            notifications: { primary: '#f43f5e', name: 'rose', label: 'Notifications' },
            quick_settings: { primary: '#8b5cf6', name: 'violet', label: 'Quick Settings' },
            lock_screen: { primary: '#6b7280', name: 'gray', label: 'Lock Screen' },
            power_dialog: { primary: '#ef4444', name: 'red', label: 'Power Menu' },
            // Text Operations
            clear_text: { primary: '#ef4444', name: 'red', label: 'Clear Text' },
            get_text: { primary: '#22c55e', name: 'green', label: 'Get Text' },
            append_text: { primary: '#3b82f6', name: 'blue', label: 'Append Text' },
            select_all: { primary: '#a855f7', name: 'purple', label: 'Select All' },
            // Element Inspection
            get_bounds: { primary: '#06b6d4', name: 'cyan', label: 'Get Bounds' },
            is_visible: { primary: '#10b981', name: 'emerald', label: 'Is Visible' },
            count_elements: { primary: '#f59e0b', name: 'amber', label: 'Count Elements' },
            // Media Controls
            volume_up: { primary: '#3b82f6', name: 'blue', label: 'Volume Up' },
            volume_down: { primary: '#6b7280', name: 'gray', label: 'Volume Down' },
            mute: { primary: '#ef4444', name: 'red', label: 'Mute' },
            media_play_pause: { primary: '#22c55e', name: 'green', label: 'Play/Pause' },
            media_next: { primary: '#3b82f6', name: 'blue', label: 'Next Track' },
            media_previous: { primary: '#3b82f6', name: 'blue', label: 'Previous Track' },
            // Wait Conditions
            wait_for_text: { primary: '#8b5cf6', name: 'violet', label: 'Wait for Text' },
            wait_for_activity: { primary: '#06b6d4', name: 'cyan', label: 'Wait for Activity' },
            wait_for_package: { primary: '#22c55e', name: 'green', label: 'Wait for App' },
            wait_idle: { primary: '#6b7280', name: 'gray', label: 'Wait Idle' },
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
            // Advanced Gestures
            drag_drop: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
            ),
            pinch_zoom: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                </svg>
            ),
            fling: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            // System Actions
            recents: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            ),
            notifications: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            ),
            quick_settings: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            lock_screen: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            ),
            power_dialog: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                </svg>
            ),
            // Text Operations
            clear_text: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            ),
            get_text: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            append_text: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            ),
            select_all: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
            ),
            // Element Inspection
            get_bounds: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
            ),
            is_visible: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            ),
            count_elements: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
            ),
            // Media Controls
            volume_up: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
            ),
            volume_down: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
            ),
            mute: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
            ),
            media_play_pause: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            media_next: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 5v14" />
                </svg>
            ),
            media_previous: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 5v14" />
                </svg>
            ),
            // Wait Conditions
            wait_for_text: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            ),
            wait_for_activity: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                </svg>
            ),
            wait_for_package: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            ),
            wait_idle: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
