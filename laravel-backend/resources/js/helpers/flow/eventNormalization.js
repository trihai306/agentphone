/**
 * Event Normalization Helpers
 * Normalize and process event data from APK
 */

/**
 * Normalize event data structure
 * @param {Object} eventData - Raw event data from APK
 * @returns {Object} Normalized event data
 */
export const normalizeEventData = (eventData) => {
    return {
        eventType: eventData.event_type || eventData.eventType || '',
        text: eventData.text || '',
        packageName: eventData.package_name || eventData.packageName || '',
        appName: eventData.app_name || eventData.appName || '',
        resourceId: eventData.resource_id || eventData.resourceId || '',
        className: eventData.class_name || eventData.className || '',
        screenshotUrl: eventData.screenshot_url || eventData.screenshotUrl || '',
        actionData: eventData.action_data || eventData.actionData || {},
        coordinates: normalizeCoordinates(eventData),
        bounds: normalizeBounds(eventData),
    };
};

/**
 * Normalize coordinates from event data
 * @param {Object} eventData - Event data
 * @returns {Object|null} Normalized coordinates {x, y}
 */
export const normalizeCoordinates = (eventData) => {
    // Try multiple possible coordinate formats
    if (eventData.coordinates) {
        return {
            x: eventData.coordinates.x || 0,
            y: eventData.coordinates.y || 0,
        };
    }

    if (eventData.x !== undefined && eventData.y !== undefined) {
        return {
            x: eventData.x,
            y: eventData.y,
        };
    }

    if (eventData.action_data?.x !== undefined) {
        return {
            x: eventData.action_data.x,
            y: eventData.action_data.y || 0,
        };
    }

    return null;
};

/**
 * Normalize bounds from event data
 * @param {Object} eventData - Event data
 * @returns {Object|null} Normalized bounds {left, top, right, bottom}
 */
export const normalizeBounds = (eventData) => {
    if (eventData.bounds) {
        return {
            left: eventData.bounds.left || 0,
            top: eventData.bounds.top || 0,
            right: eventData.bounds.right || 0,
            bottom: eventData.bounds.bottom || 0,
        };
    }

    if (eventData.action_data?.bounds) {
        return {
            left: eventData.action_data.bounds.left || 0,
            top: eventData.action_data.bounds.top || 0,
            right: eventData.action_data.bounds.right || 0,
            bottom: eventData.action_data.bounds.bottom || 0,
        };
    }

    return null;
};

/**
 * Calculate center point from bounds
 * @param {Object} bounds - Bounds object {left, top, right, bottom}
 * @returns {Object} Center coordinates {x, y}
 */
export const calculateBoundsCenter = (bounds) => {
    if (!bounds) return { x: 0, y: 0 };

    return {
        x: (bounds.left + bounds.right) / 2,
        y: (bounds.top + bounds.bottom) / 2,
    };
};

/**
 * Extract coordinates from event data (fallback to bounds center if needed)
 * @param {Object} eventData - Event data
 * @returns {Object} Coordinates {x, y}
 */
export const extractCoordinates = (eventData) => {
    const coords = normalizeCoordinates(eventData);
    if (coords && (coords.x || coords.y)) {
        return coords;
    }

    const bounds = normalizeBounds(eventData);
    if (bounds) {
        return calculateBoundsCenter(bounds);
    }

    return { x: 0, y: 0 };
};
