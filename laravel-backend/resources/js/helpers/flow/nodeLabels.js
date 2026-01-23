/**
 * Node Label Generation Helpers
 * Generates smart, descriptive labels for workflow nodes
 */

/**
 * Extract app name from package name
 * @param {string} packageName - Android package name (e.g., "com.google.chrome")
 * @returns {string} Formatted app name (e.g., "Chrome")
 */
export const getAppNameFromPackage = (packageName) => {
    if (!packageName) return '';
    const parts = packageName.split('.');
    const lastPart = parts[parts.length - 1];
    // Capitalize first letter
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
};

/**
 * Truncate text for display
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text with ellipsis if needed
 */
export const truncateText = (text, maxLength = 25) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
};

/**
 * Generate smart, descriptive label for a node based on event data
 * @param {Object} eventData - Event data from APK
 * @returns {string} Human-readable node label
 */
export const generateSmartLabel = (eventData) => {
    const eventType = eventData.event_type || eventData.eventType || '';
    const text = eventData.text || '';
    const appName = eventData.app_name || getAppNameFromPackage(eventData.package_name || eventData.packageName);
    const actionData = eventData.action_data || {};

    // Truncate text for display
    const truncatedText = truncateText(text);

    switch (eventType) {
        case 'tap':
        case 'click':
            if (truncatedText) return `Tap '${truncatedText}'`;
            return appName ? `Tap in ${appName}` : 'Tap';

        case 'long_tap':
        case 'long_click':
        case 'long_press':
            if (truncatedText) return `Long press '${truncatedText}'`;
            return 'Long Press';

        case 'double_tap':
            if (truncatedText) return `Double tap '${truncatedText}'`;
            return 'Double Tap';

        case 'repeat_click':
            const count = actionData.clickCount || 3;
            if (truncatedText) return `Click '${truncatedText}' ${count}x`;
            return `Repeat Click ${count}x`;

        case 'text_input':
        case 'set_text':
            const inputText = actionData.text || text || '';
            const displayText = truncateText(inputText, 20);
            return displayText ? `Type '${displayText}'` : 'Type Text';

        case 'scroll_up':
            return 'Scroll Up';
        case 'scroll_down':
            return 'Scroll Down';
        case 'scroll':
            const direction = actionData.direction || 'down';
            return `Scroll ${direction.charAt(0).toUpperCase() + direction.slice(1)}`;

        case 'swipe_left':
            return 'Swipe Left';
        case 'swipe_right':
            return 'Swipe Right';
        case 'swipe_up':
            return 'Swipe Up';
        case 'swipe_down':
            return 'Swipe Down';

        case 'open_app':
            return appName ? `Open ${appName}` : 'Open App';

        case 'back':
            return 'Press Back';
        case 'home':
            return 'Press Home';

        default:
            // Fallback: capitalize event type
            return eventType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
};
