/**
 * Node Type Mapping Helpers
 * Maps event types to ReactFlow node types
 */

/**
 * Map Android event type to ReactFlow node type
 * @param {string} eventType - Event type from APK (e.g., 'tap', 'scroll_up')
 * @returns {string} ReactFlow node type
 */
export const getNodeTypeFromEvent = (eventType) => {
    const typeMap = {
        'open_app': 'open_app',
        'click': 'click',
        'tap': 'tap',
        'long_click': 'long_press',
        'long_tap': 'long_tap',
        'long_press': 'long_press',
        'double_tap': 'double_tap',
        'repeat_click': 'repeat_click',
        'text_input': 'text_input',
        'set_text': 'text_input',
        'scroll': 'scroll',
        'scroll_up': 'scroll_up',
        'scroll_down': 'scroll_down',
        'scroll_left': 'scroll_left',
        'scroll_right': 'scroll_right',
        'swipe': 'swipe',
        'swipe_left': 'swipe_left',
        'swipe_right': 'swipe_right',
        'swipe_up': 'swipe_up',
        'swipe_down': 'swipe_down',
        'key_event': 'key_event',
        'back': 'back',
        'home': 'home',
        'focus': 'focus',
    };

    return typeMap[eventType] || eventType; // Fallback to eventType itself
};

/**
 * Generate unique node ID
 * @param {string} prefix - Prefix for the ID (e.g., 'node', 'loop')
 * @returns {string} Unique node ID
 */
export const generateNodeId = (prefix = 'node') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate node position with offset
 * @param {Object} basePosition - Base position {x, y}
 * @param {number} offsetX - X offset
 * @param {number} offsetY - Y offset
 * @returns {Object} Calculated position {x, y}
 */
export const calculateNodePosition = (basePosition, offsetX = 0, offsetY = 150) => {
    return {
        x: basePosition.x + offsetX,
        y: basePosition.y + offsetY,
    };
};
