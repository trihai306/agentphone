/**
 * Node Templates for Flow Editor Sidebar Palette
 * Defines all draggable node types with their metadata
 */

/**
 * Get node templates with translations
 * @param {Function} t - i18n translation function
 * @returns {Array} Array of node template objects
 */
export const getNodeTemplates = (t) => [
    // Recorded Actions - Basic
    { type: 'open_app', label: t('flows.editor.nodes.open_app', 'Open App'), icon: 'app', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', description: t('flows.editor.nodes.open_app_desc', 'Launch an app'), category: 'action' },
    { type: 'click', label: t('flows.editor.nodes.click'), icon: 'cursor', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', description: t('flows.editor.nodes.click_desc', 'Tap on element'), category: 'action' },
    { type: 'text_input', label: t('flows.editor.nodes.type_text'), icon: 'keyboard', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.15)', description: t('flows.editor.nodes.type_text_desc', 'Input text'), category: 'action' },
    { type: 'scroll', label: t('flows.editor.nodes.scroll'), icon: 'scroll', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', description: t('flows.editor.nodes.scroll_desc', 'Scroll view'), category: 'action' },
    { type: 'swipe', label: t('flows.editor.nodes.swipe'), icon: 'swipe', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.15)', description: t('flows.editor.nodes.swipe_desc', 'Swipe gesture'), category: 'action' },
    { type: 'key_event', label: t('flows.editor.nodes.key_press'), icon: 'phone', color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.15)', description: t('flows.editor.nodes.key_press_desc', 'Back/Home key'), category: 'action' },
    { type: 'repeat_click', label: t('flows.editor.nodes.repeat_click', 'Repeat Click'), icon: 'repeat', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)', description: t('flows.editor.nodes.repeat_click_desc', 'Click multiple times'), category: 'action' },

    // Advanced Tap/Click Actions
    { type: 'long_tap', label: t('flows.editor.nodes.long_tap', 'Long Press'), icon: 'longpress', color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.15)', description: t('flows.editor.nodes.long_tap_desc', 'Long press element'), category: 'action' },
    { type: 'double_tap', label: t('flows.editor.nodes.double_tap', 'Double Tap'), icon: 'doubletap', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)', description: t('flows.editor.nodes.double_tap_desc', 'Double tap element'), category: 'action' },

    // Advanced Gestures
    { type: 'drag_drop', label: t('flows.editor.nodes.drag_drop', 'Drag & Drop'), icon: 'dragdrop', color: '#14b8a6', bgColor: 'rgba(20, 184, 166, 0.15)', description: t('flows.editor.nodes.drag_drop_desc', 'Drag element to location'), category: 'action' },
    { type: 'pinch_zoom', label: t('flows.editor.nodes.pinch_zoom', 'Pinch Zoom'), icon: 'pinchzoom', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)', description: t('flows.editor.nodes.pinch_zoom_desc', 'Zoom in or out'), category: 'action' },
    { type: 'fling', label: t('flows.editor.nodes.fling', 'Fling'), icon: 'fling', color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.15)', description: t('flows.editor.nodes.fling_desc', 'Fast scroll/fling'), category: 'action' },

    // System Actions
    { type: 'recents', label: t('flows.editor.nodes.recents', 'Recent Apps'), icon: 'grid', color: '#0ea5e9', bgColor: 'rgba(14, 165, 233, 0.15)', description: t('flows.editor.nodes.recents_desc', 'Open recent apps'), category: 'action' },
    { type: 'notifications', label: t('flows.editor.nodes.notifications', 'Notifications'), icon: 'bell', color: '#f43f5e', bgColor: 'rgba(244, 63, 94, 0.15)', description: t('flows.editor.nodes.notifications_desc', 'Open notification panel'), category: 'action' },
    { type: 'quick_settings', label: t('flows.editor.nodes.quick_settings', 'Quick Settings'), icon: 'settings', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)', description: t('flows.editor.nodes.quick_settings_desc', 'Open quick settings'), category: 'action' },

    // Text Operations
    { type: 'clear_text', label: t('flows.editor.nodes.clear_text', 'Clear Text'), icon: 'trash', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', description: t('flows.editor.nodes.clear_text_desc', 'Clear text field'), category: 'action' },
    { type: 'get_text', label: t('flows.editor.nodes.get_text', 'Get Text'), icon: 'text', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)', description: t('flows.editor.nodes.get_text_desc', 'Extract text from element'), category: 'action' },
    { type: 'append_text', label: t('flows.editor.nodes.append_text', 'Append Text'), icon: 'plus', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', description: t('flows.editor.nodes.append_text_desc', 'Add text to field'), category: 'action' },
    { type: 'select_all', label: t('flows.editor.nodes.select_all', 'Select All'), icon: 'selectall', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.15)', description: t('flows.editor.nodes.select_all_desc', 'Select all text'), category: 'action' },

    // Element Inspection
    { type: 'get_bounds', label: t('flows.editor.nodes.get_bounds', 'Get Bounds'), icon: 'box', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.15)', description: t('flows.editor.nodes.get_bounds_desc', 'Get element position'), category: 'action' },
    { type: 'is_visible', label: t('flows.editor.nodes.is_visible', 'Is Visible'), icon: 'eye', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', description: t('flows.editor.nodes.is_visible_desc', 'Check visibility'), category: 'action' },
    { type: 'count_elements', label: t('flows.editor.nodes.count_elements', 'Count Elements'), icon: 'hash', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', description: t('flows.editor.nodes.count_elements_desc', 'Count matching elements'), category: 'action' },

    // Media Controls
    { type: 'volume_up', label: t('flows.editor.nodes.volume_up', 'Volume Up'), icon: 'volumeup', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', description: t('flows.editor.nodes.volume_up_desc', 'Increase volume'), category: 'action' },
    { type: 'volume_down', label: t('flows.editor.nodes.volume_down', 'Volume Down'), icon: 'volumedown', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)', description: t('flows.editor.nodes.volume_down_desc', 'Decrease volume'), category: 'action' },
    { type: 'media_play_pause', label: t('flows.editor.nodes.media_play_pause', 'Play/Pause'), icon: 'play', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)', description: t('flows.editor.nodes.media_play_pause_desc', 'Toggle playback'), category: 'action' },

    // Wait Conditions
    { type: 'wait_for_text', label: t('flows.editor.nodes.wait_for_text', 'Wait for Text'), icon: 'search', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)', description: t('flows.editor.nodes.wait_for_text_desc', 'Wait for text to appear'), category: 'logic' },
    { type: 'wait_for_activity', label: t('flows.editor.nodes.wait_for_activity', 'Wait for Activity'), icon: 'window', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.15)', description: t('flows.editor.nodes.wait_for_activity_desc', 'Wait for activity'), category: 'logic' },
    { type: 'wait_for_package', label: t('flows.editor.nodes.wait_for_package', 'Wait for App'), icon: 'app', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)', description: t('flows.editor.nodes.wait_for_package_desc', 'Wait for app foreground'), category: 'logic' },
    { type: 'wait_idle', label: t('flows.editor.nodes.wait_idle', 'Wait Idle'), icon: 'pause', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)', description: t('flows.editor.nodes.wait_idle_desc', 'Wait for UI idle'), category: 'logic' },

    // Logic/Conditions
    { type: 'condition', label: t('flows.editor.nodes.condition'), icon: 'branch', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)', description: t('flows.editor.nodes.condition_desc', 'If/Else branch'), category: 'logic' },
    { type: 'probability', label: t('flows.editor.nodes.probability', 'Probability'), icon: 'dice', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)', description: t('flows.editor.nodes.probability_desc', 'Random weighted branch'), category: 'logic' },
    { type: 'wait', label: t('flows.editor.nodes.wait'), icon: 'clock', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)', description: t('flows.editor.nodes.wait_desc', 'Delay execution'), category: 'logic' },
    { type: 'loop', label: t('flows.editor.nodes.loop'), icon: 'loop', color: '#14b8a6', bgColor: 'rgba(20, 184, 166, 0.15)', description: t('flows.editor.nodes.loop_desc', 'Repeat actions'), category: 'logic' },
    { type: 'assert', label: t('flows.editor.nodes.assert'), icon: 'check', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)', description: t('flows.editor.nodes.assert_desc', 'Verify element'), category: 'logic' },

    // Resources
    { type: 'file_input', label: t('flows.editor.nodes.file_upload'), icon: 'upload', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.15)', description: t('flows.editor.nodes.file_upload_desc', 'Upload files/images'), category: 'resource' },
    { type: 'data_source', label: t('flows.editor.nodes.data_source'), icon: 'database', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', description: t('flows.editor.nodes.data_source_desc', 'Connect test data'), category: 'resource' },
    { type: 'ai_process', label: t('flows.editor.nodes.ai_process'), icon: 'sparkles', color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.15)', description: t('flows.editor.nodes.ai_process_desc', 'AI integration'), category: 'resource' },
    { type: 'ai_call', label: t('flows.editor.nodes.ai_call', 'AI Call'), icon: 'ai', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)', description: t('flows.editor.nodes.ai_call_desc', 'Call AI API'), category: 'resource' },
];

export default getNodeTemplates;
