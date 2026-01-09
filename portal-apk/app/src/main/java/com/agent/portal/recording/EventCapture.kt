package com.agent.portal.recording

import android.graphics.Rect
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * EventCapture extracts interaction data and element properties from AccessibilityEvents.
 *
 * This object handles the conversion of raw AccessibilityEvents into RecordedEvent objects
 * that can be stored and later used for workflow replay. It properly manages the lifecycle
 * of AccessibilityNodeInfo objects to prevent memory leaks.
 *
 * Supported event types:
 * - TYPE_VIEW_CLICKED: User tapped on an element
 * - TYPE_VIEW_LONG_CLICKED: User long-pressed on an element
 * - TYPE_VIEW_TEXT_CHANGED: User entered text in an editable field
 * - TYPE_VIEW_SCROLLED: User scrolled a scrollable container
 * - TYPE_VIEW_FOCUSED: An element received focus
 * - TYPE_GESTURE_DETECTION_START/END: Gesture detection events
 */
object EventCapture {

    private const val TAG = "EventCapture"

    // Packages to exclude from recording (e.g., the portal app itself)
    // This prevents Quick Actions button clicks from polluting the recording history
    private val EXCLUDED_PACKAGES = setOf(
        "com.agent.portal"
    )

    // Event type constants for consistent naming in recorded events
    private const val EVENT_TAP = "tap"
    private const val EVENT_DOUBLE_TAP = "double_tap"
    private const val EVENT_LONG_TAP = "long_tap"
    private const val EVENT_TEXT_INPUT = "text_input"
    private const val EVENT_TEXT_DELETE = "text_delete"
    private const val EVENT_SCROLL = "scroll"
    private const val EVENT_FOCUS = "focus"
    private const val EVENT_GESTURE_START = "gesture_start"
    private const val EVENT_GESTURE_END = "gesture_end"
    private const val EVENT_UNKNOWN = "unknown"

    // Advanced gesture detector instance
    private val gestureDetector = AdvancedGestureDetector()

    /**
     * Process an AccessibilityEvent and extract relevant data for recording.
     *
     * This is the main entry point for event capture. It:
     * 1. Determines the event type and maps it to a recording action
     * 2. Extracts element properties from the event source node
     * 3. Creates a RecordedEvent with all relevant data
     * 4. Properly recycles AccessibilityNodeInfo to prevent memory leaks
     *
     * @param event The AccessibilityEvent to process
     * @return RecordedEvent if the event is recordable, null if it should be ignored
     */
    fun captureEvent(event: AccessibilityEvent): RecordedEvent? {
        // Filter out events from excluded packages (e.g., portal app itself)
        // This prevents Quick Actions button clicks from being recorded
        val packageName = event.packageName?.toString() ?: ""
        if (packageName in EXCLUDED_PACKAGES) {
            Log.d(TAG, "Ignoring event from excluded package: $packageName")
            return null
        }

        // Map event type to recording action first
        var eventType = mapEventType(event.eventType)
        if (eventType == null) {
            Log.d(TAG, "Ignoring event type: ${event.eventType}")
            return null
        }

        // Handle scroll debouncing - only record when gesture is complete
        if (eventType == EVENT_SCROLL) {
            return captureScrollEvent(event)
        }

        // Get the source node - may be null for some events
        val node = event.source

        return try {
            if (node != null) {
                // Extract element properties from node
                val elementData = extractElementData(node)

                // Build action-specific data (may be enhanced with gesture detection)
                var actionData = extractActionData(event)

                // Detect advanced gestures for tap events
                if (eventType == EVENT_TAP) {
                    val gestureType = gestureDetector.processTapEvent(
                        event,
                        elementData.centerX,
                        elementData.centerY,
                        elementData.resourceId
                    )

                    if (gestureType == GestureType.DOUBLE_TAP) {
                        eventType = EVENT_DOUBLE_TAP
                        actionData = (actionData ?: mutableMapOf()).toMutableMap().apply {
                            put("gesture_type", "double_tap")
                            put("tap_count", 2)
                        }
                        Log.d(TAG, "✓ Converted tap to double_tap")
                    }
                }

                // Detect text operations for text change events
                if (eventType == EVENT_TEXT_INPUT) {
                    val beforeText = event.beforeText?.toString() ?: ""
                    val currentText = getTextFromEvent(event)
                    val textOp = gestureDetector.processTextChange(
                        beforeText,
                        currentText,
                        event.addedCount,
                        event.removedCount
                    )

                    // If it's a deletion, change event type
                    if (textOp == TextOperationType.DELETE) {
                        eventType = EVENT_TEXT_DELETE
                        actionData = (actionData ?: mutableMapOf()).toMutableMap().apply {
                            put("operation_type", "delete")
                            put("is_backspace", event.removedCount == 1)
                            put("deleted_text", beforeText.substring(
                                event.fromIndex,
                                minOf(event.fromIndex + event.removedCount, beforeText.length)
                            ))
                        }
                        Log.d(TAG, "✓ Detected text deletion: ${event.removedCount} chars")
                    }
                }

                // Create the recorded event with full data
                RecordedEvent(
                    eventType = eventType,
                    timestamp = System.currentTimeMillis(),
                    packageName = event.packageName?.toString() ?: "",
                    className = event.className?.toString() ?: "",
                    resourceId = elementData.resourceId,
                    contentDescription = elementData.contentDescription,
                    text = elementData.text,
                    bounds = elementData.bounds,
                    isClickable = elementData.isClickable,
                    isEditable = elementData.isEditable,
                    isScrollable = elementData.isScrollable,
                    actionData = actionData,
                    x = elementData.centerX,
                    y = elementData.centerY,
                    nodeIndex = null  // Will be calculated if needed during replay
                )
            } else {
                // Create event with available data when source is null
                Log.d(TAG, "Event source is null, creating basic event: $eventType")
                val actionData = extractActionData(event)
                RecordedEvent(
                    eventType = eventType,
                    timestamp = System.currentTimeMillis(),
                    packageName = event.packageName?.toString() ?: "",
                    className = event.className?.toString() ?: "",
                    resourceId = "",
                    contentDescription = event.contentDescription?.toString() ?: "",
                    text = event.text?.joinToString(" ") ?: "",
                    bounds = "",
                    isClickable = false,
                    isEditable = false,
                    isScrollable = false,
                    actionData = actionData,
                    x = null,
                    y = null,
                    nodeIndex = null
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error capturing event", e)
            null
        } finally {
            // CRITICAL: Always recycle the node to prevent memory leaks
            if (node != null) {
                try {
                    node.recycle()
                } catch (e: Exception) {
                    Log.w(TAG, "Error recycling node", e)
                }
            }
        }
    }

    /**
     * Capture scroll event with debouncing.
     * Multiple rapid scroll events are accumulated into a single event.
     *
     * @param event The scroll AccessibilityEvent
     * @return RecordedEvent if scroll gesture is complete, null if still accumulating
     */
    private fun captureScrollEvent(event: AccessibilityEvent): RecordedEvent? {
        val packageName = event.packageName?.toString() ?: ""
        val className = event.className?.toString() ?: ""

        // Extract scroll data
        val deltaX = if (event.maxScrollX > 0) event.scrollDeltaX else 0
        val deltaY = if (event.maxScrollY > 0) event.scrollDeltaY else 0

        // Determine direction
        val direction = when {
            deltaY > 0 -> "down"
            deltaY < 0 -> "up"
            deltaX > 0 -> "right"
            deltaX < 0 -> "left"
            else -> "unknown"
        }

        // Process with debouncing
        val scrollResult = gestureDetector.processScrollEvent(
            direction = direction,
            deltaX = deltaX,
            deltaY = deltaY,
            packageName = packageName,
            className = className
        )

        // If not ready to record yet, return null
        if (!scrollResult.shouldRecord) {
            Log.d(TAG, "Scroll debounced, waiting for more events or timeout")
            return null
        }

        // Create scroll event with accumulated deltas
        Log.d(TAG, "✓ Recording scroll: direction=${scrollResult.direction}, deltaX=${scrollResult.accumulatedDeltaX}, deltaY=${scrollResult.accumulatedDeltaY}")

        val node = event.source
        return try {
            val actionData = buildScrollActionData(
                scrollResult.direction,
                scrollResult.accumulatedDeltaX,
                scrollResult.accumulatedDeltaY,
                event.scrollX,
                event.scrollY,
                event.maxScrollX,
                event.maxScrollY
            )

            if (node != null) {
                val elementData = extractElementData(node)
                RecordedEvent(
                    eventType = EVENT_SCROLL,
                    timestamp = System.currentTimeMillis(),
                    packageName = packageName,
                    className = className,
                    resourceId = elementData.resourceId,
                    contentDescription = elementData.contentDescription,
                    text = elementData.text,
                    bounds = elementData.bounds,
                    isClickable = elementData.isClickable,
                    isEditable = elementData.isEditable,
                    isScrollable = elementData.isScrollable,
                    actionData = actionData,
                    x = elementData.centerX,
                    y = elementData.centerY,
                    nodeIndex = null
                )
            } else {
                RecordedEvent(
                    eventType = EVENT_SCROLL,
                    timestamp = System.currentTimeMillis(),
                    packageName = packageName,
                    className = className,
                    resourceId = "",
                    contentDescription = event.contentDescription?.toString() ?: "",
                    text = event.text?.joinToString(" ") ?: "",
                    bounds = "",
                    isClickable = false,
                    isEditable = false,
                    isScrollable = true,
                    actionData = actionData,
                    x = null,
                    y = null,
                    nodeIndex = null
                )
            }
        } finally {
            node?.recycle()
        }
    }

    /**
     * Build action data map for scroll events with swipe coordinates for replay.
     */
    private fun buildScrollActionData(
        direction: String,
        accumulatedDeltaX: Int,
        accumulatedDeltaY: Int,
        scrollX: Int,
        scrollY: Int,
        maxScrollX: Int,
        maxScrollY: Int
    ): Map<String, Any> {
        val screenWidth = android.content.res.Resources.getSystem().displayMetrics.widthPixels
        val screenHeight = android.content.res.Resources.getSystem().displayMetrics.heightPixels

        // Calculate swipe coordinates based on scroll direction
        val (startX, startY, endX, endY) = when (direction) {
            "up" -> {
                val centerX = screenWidth / 2
                val startY = (screenHeight * 0.7).toInt()
                val endY = (screenHeight * 0.3).toInt()
                listOf(centerX, startY, centerX, endY)
            }
            "down" -> {
                val centerX = screenWidth / 2
                val startY = (screenHeight * 0.3).toInt()
                val endY = (screenHeight * 0.7).toInt()
                listOf(centerX, startY, centerX, endY)
            }
            "left" -> {
                val centerY = screenHeight / 2
                val startX = (screenWidth * 0.7).toInt()
                val endX = (screenWidth * 0.3).toInt()
                listOf(startX, centerY, endX, centerY)
            }
            "right" -> {
                val centerY = screenHeight / 2
                val startX = (screenWidth * 0.3).toInt()
                val endX = (screenWidth * 0.7).toInt()
                listOf(startX, centerY, endX, centerY)
            }
            else -> listOf(0, 0, 0, 0)
        }

        return mapOf(
            "scroll_x" to scrollX,
            "scroll_y" to scrollY,
            "delta_x" to accumulatedDeltaX,
            "delta_y" to accumulatedDeltaY,
            "max_scroll_x" to maxScrollX,
            "max_scroll_y" to maxScrollY,
            "direction" to direction,
            "start_x" to startX,
            "start_y" to startY,
            "end_x" to endX,
            "end_y" to endY,
            "duration" to 300
        )
    }

    /**
     * Check for pending scroll events that should be flushed.
     * Call this periodically or when recording stops.
     *
     * @return RecordedEvent if there's a pending scroll, null otherwise
     */
    fun checkPendingScrollEvent(packageName: String = "", className: String = ""): RecordedEvent? {
        val scrollResult = gestureDetector.checkScrollTimeout() ?: return null

        Log.d(TAG, "✓ Flushing pending scroll: direction=${scrollResult.direction}")

        val actionData = buildScrollActionData(
            scrollResult.direction,
            scrollResult.accumulatedDeltaX,
            scrollResult.accumulatedDeltaY,
            0, 0, 0, 0
        )

        return RecordedEvent(
            eventType = EVENT_SCROLL,
            timestamp = System.currentTimeMillis(),
            packageName = packageName,
            className = className,
            resourceId = "",
            contentDescription = "",
            text = "",
            bounds = "",
            isClickable = false,
            isEditable = false,
            isScrollable = true,
            actionData = actionData,
            x = null,
            y = null,
            nodeIndex = null
        )
    }

    /**
     * Flush any pending scroll when recording stops.
     *
     * @return RecordedEvent if there was a pending scroll, null otherwise
     */
    fun flushPendingScroll(packageName: String = "", className: String = ""): RecordedEvent? {
        val scrollResult = gestureDetector.flushPendingScroll() ?: return null

        Log.d(TAG, "✓ Final flush scroll: direction=${scrollResult.direction}")

        val actionData = buildScrollActionData(
            scrollResult.direction,
            scrollResult.accumulatedDeltaX,
            scrollResult.accumulatedDeltaY,
            0, 0, 0, 0
        )

        return RecordedEvent(
            eventType = EVENT_SCROLL,
            timestamp = System.currentTimeMillis(),
            packageName = packageName,
            className = className,
            resourceId = "",
            contentDescription = "",
            text = "",
            bounds = "",
            isClickable = false,
            isEditable = false,
            isScrollable = true,
            actionData = actionData,
            x = null,
            y = null,
            nodeIndex = null
        )
    }

    /**
     * Map Android AccessibilityEvent type to our recording event type.
     *
     * @param eventType The Android event type constant
     * @return Our event type string, or null if the event should be ignored
     */
    private fun mapEventType(eventType: Int): String? {
        return when (eventType) {
            AccessibilityEvent.TYPE_VIEW_CLICKED -> EVENT_TAP
            AccessibilityEvent.TYPE_VIEW_LONG_CLICKED -> EVENT_LONG_TAP
            AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED -> EVENT_TEXT_INPUT
            AccessibilityEvent.TYPE_VIEW_SCROLLED -> EVENT_SCROLL
            AccessibilityEvent.TYPE_VIEW_FOCUSED -> EVENT_FOCUS
            AccessibilityEvent.TYPE_GESTURE_DETECTION_START -> EVENT_GESTURE_START
            AccessibilityEvent.TYPE_GESTURE_DETECTION_END -> EVENT_GESTURE_END
            else -> null  // Ignore other event types
        }
    }

    /**
     * Extract element data from an AccessibilityNodeInfo.
     *
     * This extracts all properties needed for:
     * - Smart selector generation (resourceId > contentDescription > xpath > bounds)
     * - Step naming (text, contentDescription)
     * - Element state (clickable, editable, scrollable)
     *
     * @param node The AccessibilityNodeInfo to extract data from
     * @return ElementData containing all extracted properties
     */
    private fun extractElementData(node: AccessibilityNodeInfo): ElementData {
        // Get bounds
        val rect = Rect()
        node.getBoundsInScreen(rect)

        // Calculate center coordinates for gesture fallback
        val centerX = if (rect.width() > 0) (rect.left + rect.right) / 2 else null
        val centerY = if (rect.height() > 0) (rect.top + rect.bottom) / 2 else null

        return ElementData(
            resourceId = node.viewIdResourceName ?: "",
            contentDescription = node.contentDescription?.toString() ?: "",
            text = extractText(node),
            bounds = formatBounds(rect),
            isClickable = node.isClickable,
            isEditable = node.isEditable,
            isScrollable = node.isScrollable,
            isFocusable = node.isFocusable,
            isFocused = node.isFocused,
            isLongClickable = node.isLongClickable,
            isCheckable = node.isCheckable,
            isChecked = node.isChecked,
            className = node.className?.toString() ?: "",
            centerX = centerX,
            centerY = centerY
        )
    }

    /**
     * Extract text from a node, preferring the node's text but falling back to
     * content description if no text is available.
     */
    private fun extractText(node: AccessibilityNodeInfo): String {
        // First try the node's text
        val text = node.text?.toString()
        if (!text.isNullOrBlank()) {
            return text
        }

        // Fall back to content description
        val contentDesc = node.contentDescription?.toString()
        if (!contentDesc.isNullOrBlank()) {
            return contentDesc
        }

        return ""
    }

    /**
     * Format bounds as a string: "left,top,right,bottom"
     */
    private fun formatBounds(rect: Rect): String {
        return "${rect.left},${rect.top},${rect.right},${rect.bottom}"
    }

    /**
     * Extract action-specific data from the event.
     *
     * Different event types have different relevant data:
     * - text_input: The new text value and before/after change info
     * - scroll: Scroll deltas and direction
     * - focus: Source/destination of focus change
     */
    private fun extractActionData(event: AccessibilityEvent): Map<String, Any>? {
        return when (event.eventType) {
            AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED -> {
                mapOf(
                    "before_text" to (event.beforeText?.toString() ?: ""),
                    "added_count" to event.addedCount,
                    "removed_count" to event.removedCount,
                    "from_index" to event.fromIndex,
                    "current_text" to getTextFromEvent(event)
                )
            }
            AccessibilityEvent.TYPE_VIEW_SCROLLED -> {
                val fromX = event.scrollX
                val fromY = event.scrollY
                val deltaX = if (event.maxScrollX > 0) event.scrollDeltaX else 0
                val deltaY = if (event.maxScrollY > 0) event.scrollDeltaY else 0

                // Determine scroll direction
                val direction = when {
                    deltaY > 0 -> "down"
                    deltaY < 0 -> "up"
                    deltaX > 0 -> "right"
                    deltaX < 0 -> "left"
                    else -> "unknown"
                }

                // IMPORTANT: For scroll events outside app (home screen, launcher),
                // we also store swipe coordinates for replay reliability
                // Get screen dimensions for swipe coordinate calculation
                val screenWidth = android.content.res.Resources.getSystem().displayMetrics.widthPixels
                val screenHeight = android.content.res.Resources.getSystem().displayMetrics.heightPixels

                // Calculate swipe coordinates based on scroll direction
                val (startX, startY, endX, endY) = when (direction) {
                    "up" -> {
                        // Swipe from bottom to top (scroll content up)
                        val centerX = screenWidth / 2
                        val startY = (screenHeight * 0.7).toInt()
                        val endY = (screenHeight * 0.3).toInt()
                        listOf(centerX, startY, centerX, endY)
                    }
                    "down" -> {
                        // Swipe from top to bottom (scroll content down)
                        val centerX = screenWidth / 2
                        val startY = (screenHeight * 0.3).toInt()
                        val endY = (screenHeight * 0.7).toInt()
                        listOf(centerX, startY, centerX, endY)
                    }
                    "left" -> {
                        // Swipe from right to left
                        val centerY = screenHeight / 2
                        val startX = (screenWidth * 0.7).toInt()
                        val endX = (screenWidth * 0.3).toInt()
                        listOf(startX, centerY, endX, centerY)
                    }
                    "right" -> {
                        // Swipe from left to right
                        val centerY = screenHeight / 2
                        val startX = (screenWidth * 0.3).toInt()
                        val endX = (screenWidth * 0.7).toInt()
                        listOf(startX, centerY, endX, centerY)
                    }
                    else -> listOf(0, 0, 0, 0)
                }

                mapOf(
                    "scroll_x" to fromX,
                    "scroll_y" to fromY,
                    "delta_x" to deltaX,
                    "delta_y" to deltaY,
                    "max_scroll_x" to event.maxScrollX,
                    "max_scroll_y" to event.maxScrollY,
                    "direction" to direction,
                    // Add swipe coordinates for fallback replay
                    "start_x" to startX,
                    "start_y" to startY,
                    "end_x" to endX,
                    "end_y" to endY,
                    "duration" to 300
                )
            }
            AccessibilityEvent.TYPE_VIEW_FOCUSED -> {
                mapOf(
                    "item_count" to event.itemCount,
                    "current_item_index" to event.currentItemIndex
                )
            }
            else -> null
        }
    }

    /**
     * Extract the current text from a text change event.
     */
    private fun getTextFromEvent(event: AccessibilityEvent): String {
        return event.text?.joinToString("") ?: ""
    }

    /**
     * Check if an event type is one we want to record.
     * This can be used for quick filtering before calling captureEvent.
     *
     * @param eventType The Android event type constant
     * @return true if this event type should be recorded
     */
    fun isRecordableEvent(eventType: Int): Boolean {
        return when (eventType) {
            AccessibilityEvent.TYPE_VIEW_CLICKED,
            AccessibilityEvent.TYPE_VIEW_LONG_CLICKED,
            AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED,
            AccessibilityEvent.TYPE_VIEW_SCROLLED,
            AccessibilityEvent.TYPE_VIEW_FOCUSED,
            AccessibilityEvent.TYPE_GESTURE_DETECTION_START,
            AccessibilityEvent.TYPE_GESTURE_DETECTION_END -> true
            else -> false
        }
    }

    /**
     * Get a human-readable name for an event type.
     * Useful for logging and debugging.
     */
    fun getEventTypeName(eventType: Int): String {
        return when (eventType) {
            AccessibilityEvent.TYPE_VIEW_CLICKED -> "VIEW_CLICKED"
            AccessibilityEvent.TYPE_VIEW_LONG_CLICKED -> "VIEW_LONG_CLICKED"
            AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED -> "VIEW_TEXT_CHANGED"
            AccessibilityEvent.TYPE_VIEW_SCROLLED -> "VIEW_SCROLLED"
            AccessibilityEvent.TYPE_VIEW_FOCUSED -> "VIEW_FOCUSED"
            AccessibilityEvent.TYPE_GESTURE_DETECTION_START -> "GESTURE_DETECTION_START"
            AccessibilityEvent.TYPE_GESTURE_DETECTION_END -> "GESTURE_DETECTION_END"
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> "WINDOW_STATE_CHANGED"
            AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED -> "WINDOW_CONTENT_CHANGED"
            else -> "UNKNOWN($eventType)"
        }
    }

    /**
     * Capture event from a node directly (for cases where we have a node but not an event).
     * This is useful for programmatically recording actions.
     *
     * @param node The AccessibilityNodeInfo to capture
     * @param eventType The event type string (tap, long_tap, etc.)
     * @return RecordedEvent if capture was successful
     */
    fun captureFromNode(
        node: AccessibilityNodeInfo,
        eventType: String,
        packageName: String = "",
        actionData: Map<String, Any>? = null
    ): RecordedEvent? {
        return try {
            val elementData = extractElementData(node)

            RecordedEvent(
                eventType = eventType,
                timestamp = System.currentTimeMillis(),
                packageName = packageName,
                className = elementData.className,
                resourceId = elementData.resourceId,
                contentDescription = elementData.contentDescription,
                text = elementData.text,
                bounds = elementData.bounds,
                isClickable = elementData.isClickable,
                isEditable = elementData.isEditable,
                isScrollable = elementData.isScrollable,
                actionData = actionData,
                x = elementData.centerX,
                y = elementData.centerY,
                nodeIndex = null
            )
        } catch (e: Exception) {
            Log.e(TAG, "Error capturing from node", e)
            null
        }
        // Note: Caller is responsible for recycling the node
    }

    /**
     * Reset gesture detector state.
     * Call this when recording stops to clear gesture tracking.
     */
    fun resetGestureDetector() {
        gestureDetector.reset()
        Log.d(TAG, "Gesture detector reset")
    }
}

/**
 * Container for element data extracted from AccessibilityNodeInfo.
 * This provides a clean structure for passing around element properties.
 */
data class ElementData(
    val resourceId: String,
    val contentDescription: String,
    val text: String,
    val bounds: String,
    val isClickable: Boolean,
    val isEditable: Boolean,
    val isScrollable: Boolean,
    val isFocusable: Boolean,
    val isFocused: Boolean,
    val isLongClickable: Boolean,
    val isCheckable: Boolean,
    val isChecked: Boolean,
    val className: String,
    val centerX: Int?,
    val centerY: Int?
) {
    /**
     * Get the best available selector value, following priority:
     * 1. resource-id (most stable)
     * 2. content-description
     * 3. text
     * 4. bounds (fallback)
     */
    fun getBestSelector(): Pair<String, String> {
        return when {
            resourceId.isNotBlank() -> "resource-id" to resourceId
            contentDescription.isNotBlank() -> "content-desc" to contentDescription
            text.isNotBlank() -> "text" to text
            else -> "bounds" to bounds
        }
    }

    /**
     * Check if this element has enough data to generate a reliable selector.
     */
    fun hasReliableSelector(): Boolean {
        return resourceId.isNotBlank() || contentDescription.isNotBlank() || text.isNotBlank()
    }
}
