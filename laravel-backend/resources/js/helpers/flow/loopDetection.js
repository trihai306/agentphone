/**
 * Loop Detection Helpers
 * Detects repeated actions and suggests loop patterns
 */

/**
 * Normalize event type for comparison (group similar actions)
 * @param {string} eventType - Event type from APK
 * @returns {string} Normalized event type
 */
export const normalizeEventType = (eventType) => {
    const normalizeMap = {
        'tap': 'click',
        'long_click': 'click',
        'long_press': 'click',
        'set_text': 'text_input',
        // Scroll: keep up/down distinct for separate Loops
        'scroll': 'scroll',
        'scroll_up': 'scroll_up',
        'scroll_down': 'scroll_down',
        // Swipe: keep direction for distinct Loops
        'swipe_left': 'swipe_left',
        'swipe_right': 'swipe_right',
        'swipe_up': 'swipe_up',
        'swipe_down': 'swipe_down',
        'back': 'key_event',
        'home': 'key_event',
    };

    return normalizeMap[eventType] || eventType;
};

/**
 * Event types that should NEVER be grouped into loops
 * TAP/CLICK/TYPE actions should never be looped - each tap on different elements is unique
 * Only SCROLL/SWIPE actions can be grouped into loops
 */
export const LOOP_EXCLUDED_TYPES = [
    'text_input',
    'set_text',
    'focus',
    'text_delete',
    'open_app',
    'click',
    'tap',
    'double_tap',
    'long_click',
    'long_press',
];

/**
 * Check if event type can be included in loop detection
 * @param {string} eventType - Event type to check
 * @returns {boolean} True if can be looped
 */
export const isLoopableEventType = (eventType) => {
    const normalized = normalizeEventType(eventType);
    return !LOOP_EXCLUDED_TYPES.includes(normalized);
};

/**
 * Detect if consecutive actions form a loop pattern
 * @param {Array} consecutiveActions - Array of consecutive actions
 * @param {number} threshold - Minimum number of repetitions to consider a loop
 * @returns {Object|null} Loop info or null if no loop detected
 */
export const detectLoop = (consecutiveActions, threshold = 3) => {
    if (consecutiveActions.length < threshold) {
        return null;
    }

    // Check if all actions are the same type
    const firstAction = consecutiveActions[0];
    const allSameType = consecutiveActions.every(
        action => normalizeEventType(action.eventType) === normalizeEventType(firstAction.eventType)
    );

    if (allSameType && isLoopableEventType(firstAction.eventType)) {
        return {
            eventType: firstAction.eventType,
            count: consecutiveActions.length,
            actions: consecutiveActions,
            shouldCreateLoop: true,
        };
    }

    return null;
};
