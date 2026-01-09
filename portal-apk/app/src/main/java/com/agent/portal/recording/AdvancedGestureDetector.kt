package com.agent.portal.recording

import android.util.Log
import android.view.accessibility.AccessibilityEvent

/**
 * Advanced Gesture Detector for detecting complex gestures from AccessibilityEvents.
 *
 * Detects:
 * - Double Tap: Two taps on same element within 300ms
 * - Long Press: Already handled by TYPE_VIEW_LONG_CLICKED
 * - Text Deletion: Tracks backspace/delete operations
 * - Swipe Gestures: Direction and velocity
 * - Pinch Gestures: Pinch-in (zoom out) and Pinch-out (zoom in)
 * - Two-Finger Scroll: Pan gestures with two fingers
 */
class AdvancedGestureDetector {

    companion object {
        private const val TAG = "AdvancedGestureDetector"

        // Timing thresholds
        private const val DOUBLE_TAP_TIMEOUT = 300L  // 300ms between taps
        private const val LONG_PRESS_TIMEOUT = 500L  // 500ms for long press (handled by system)
        private const val SCROLL_DEBOUNCE_TIMEOUT = 400L  // 400ms to debounce scroll events

        // Distance threshold for considering same target
        private const val TAP_DISTANCE_THRESHOLD = 50  // 50 pixels

        // Pinch detection thresholds
        private const val PINCH_SCALE_THRESHOLD = 0.1f  // 10% scale change to trigger pinch
        private const val MIN_PINCH_DISTANCE = 50f  // Minimum finger distance for pinch
    }

    // Track last tap for double-tap detection
    private var lastTapTimestamp: Long = 0
    private var lastTapX: Int? = null
    private var lastTapY: Int? = null
    private var lastTapResourceId: String? = null

    // Track text changes for deletion detection
    private var lastTextValue: String = ""
    private var lastTextLength: Int = 0

    // Scroll debouncing - accumulate scroll events
    private var lastScrollTimestamp: Long = 0
    private var lastScrollDirection: String? = null
    private var accumulatedScrollDeltaX: Int = 0
    private var accumulatedScrollDeltaY: Int = 0
    private var lastScrollPackage: String? = null
    private var lastScrollClassName: String? = null

    // Multi-touch tracking for pinch detection
    private var isMultiTouchActive = false
    private var initialPinchDistance: Float = 0f
    private var lastPinchDistance: Float = 0f
    private var pinchStartTime: Long = 0
    private var finger1X: Float = 0f
    private var finger1Y: Float = 0f
    private var finger2X: Float = 0f
    private var finger2Y: Float = 0f

    /**
     * Process a scroll event with debouncing.
     * Returns ScrollEventResult indicating whether to record this event.
     *
     * @param direction Scroll direction (up, down, left, right)
     * @param deltaX Scroll delta X
     * @param deltaY Scroll delta Y
     * @param packageName Package name of the scrolled view
     * @param className Class name of the scrolled view
     * @return ScrollEventResult with accumulated deltas if ready to record
     */
    fun processScrollEvent(
        direction: String,
        deltaX: Int,
        deltaY: Int,
        packageName: String,
        className: String
    ): ScrollEventResult {
        val currentTime = System.currentTimeMillis()
        val timeSinceLastScroll = currentTime - lastScrollTimestamp

        // Check if this is a continuation of the same scroll gesture
        val isSameGesture = timeSinceLastScroll < SCROLL_DEBOUNCE_TIMEOUT &&
                lastScrollDirection == direction &&
                lastScrollPackage == packageName

        if (isSameGesture) {
            // Accumulate scroll deltas, don't record yet
            accumulatedScrollDeltaX += deltaX
            accumulatedScrollDeltaY += deltaY
            lastScrollTimestamp = currentTime

            Log.d(TAG, "Scroll debounced: accumulated deltaX=$accumulatedScrollDeltaX, deltaY=$accumulatedScrollDeltaY")
            return ScrollEventResult(
                shouldRecord = false,
                accumulatedDeltaX = accumulatedScrollDeltaX,
                accumulatedDeltaY = accumulatedScrollDeltaY,
                direction = direction
            )
        } else {
            // New scroll gesture - return accumulated values from previous gesture if any
            val previousResult = if (lastScrollDirection != null && (accumulatedScrollDeltaX != 0 || accumulatedScrollDeltaY != 0)) {
                ScrollEventResult(
                    shouldRecord = true,
                    accumulatedDeltaX = accumulatedScrollDeltaX,
                    accumulatedDeltaY = accumulatedScrollDeltaY,
                    direction = lastScrollDirection!!
                )
            } else {
                null
            }

            // Start tracking new scroll gesture
            lastScrollTimestamp = currentTime
            lastScrollDirection = direction
            lastScrollPackage = packageName
            lastScrollClassName = className
            accumulatedScrollDeltaX = deltaX
            accumulatedScrollDeltaY = deltaY

            Log.d(TAG, "New scroll gesture started: direction=$direction")

            // If there was a previous gesture, return it; otherwise this is the first event
            return previousResult ?: ScrollEventResult(
                shouldRecord = false, // Wait for more events or timeout
                accumulatedDeltaX = deltaX,
                accumulatedDeltaY = deltaY,
                direction = direction
            )
        }
    }

    /**
     * Force flush any pending scroll event.
     * Call this when recording stops to ensure the last scroll is captured.
     *
     * @return ScrollEventResult if there's a pending scroll, null otherwise
     */
    fun flushPendingScroll(): ScrollEventResult? {
        if (lastScrollDirection != null && (accumulatedScrollDeltaX != 0 || accumulatedScrollDeltaY != 0)) {
            val result = ScrollEventResult(
                shouldRecord = true,
                accumulatedDeltaX = accumulatedScrollDeltaX,
                accumulatedDeltaY = accumulatedScrollDeltaY,
                direction = lastScrollDirection!!
            )
            resetScrollState()
            Log.d(TAG, "Flushed pending scroll: deltaX=${result.accumulatedDeltaX}, deltaY=${result.accumulatedDeltaY}")
            return result
        }
        return null
    }

    /**
     * Check if there's a pending scroll that should be recorded due to timeout.
     *
     * @return ScrollEventResult if scroll timeout exceeded, null otherwise
     */
    fun checkScrollTimeout(): ScrollEventResult? {
        if (lastScrollTimestamp > 0 && lastScrollDirection != null) {
            val timeSinceLastScroll = System.currentTimeMillis() - lastScrollTimestamp
            if (timeSinceLastScroll >= SCROLL_DEBOUNCE_TIMEOUT && (accumulatedScrollDeltaX != 0 || accumulatedScrollDeltaY != 0)) {
                val result = ScrollEventResult(
                    shouldRecord = true,
                    accumulatedDeltaX = accumulatedScrollDeltaX,
                    accumulatedDeltaY = accumulatedScrollDeltaY,
                    direction = lastScrollDirection!!
                )
                resetScrollState()
                Log.d(TAG, "Scroll timeout - recording: deltaX=${result.accumulatedDeltaX}, deltaY=${result.accumulatedDeltaY}")
                return result
            }
        }
        return null
    }

    /**
     * Reset scroll tracking state
     */
    private fun resetScrollState() {
        lastScrollTimestamp = 0
        lastScrollDirection = null
        accumulatedScrollDeltaX = 0
        accumulatedScrollDeltaY = 0
        lastScrollPackage = null
        lastScrollClassName = null
    }

    /**
     * Process a tap event and determine if it's a double tap.
     *
     * @param event The tap event
     * @param x X coordinate of tap
     * @param y Y coordinate of tap
     * @param resourceId Resource ID of tapped element
     * @return GestureType.DOUBLE_TAP if double tap detected, GestureType.SINGLE_TAP otherwise
     */
    fun processTapEvent(
        event: AccessibilityEvent,
        x: Int?,
        y: Int?,
        resourceId: String
    ): GestureType {
        val currentTime = System.currentTimeMillis()

        // Check if this could be a double tap
        val isDoubleTap = isDoubleTapCandidate(currentTime, x, y, resourceId)

        // Update last tap tracking
        lastTapTimestamp = currentTime
        lastTapX = x
        lastTapY = y
        lastTapResourceId = resourceId

        return if (isDoubleTap) {
            Log.d(TAG, "✓ Double tap detected on $resourceId")
            GestureType.DOUBLE_TAP
        } else {
            GestureType.SINGLE_TAP
        }
    }

    /**
     * Check if current tap could be a double tap of the previous tap.
     */
    private fun isDoubleTapCandidate(
        currentTime: Long,
        x: Int?,
        y: Int?,
        resourceId: String
    ): Boolean {
        // Check timing
        val timeDelta = currentTime - lastTapTimestamp
        if (timeDelta > DOUBLE_TAP_TIMEOUT) {
            return false
        }

        // Must be same element (by resource ID)
        if (resourceId.isNotBlank() && resourceId == lastTapResourceId) {
            return true
        }

        // Fallback: Check if coordinates are close enough
        if (x != null && y != null && lastTapX != null && lastTapY != null) {
            val distance = calculateDistance(x, y, lastTapX!!, lastTapY!!)
            if (distance <= TAP_DISTANCE_THRESHOLD) {
                return true
            }
        }

        return false
    }

    /**
     * Process text change event to detect text operations.
     *
     * @param beforeText Text before change
     * @param currentText Text after change
     * @param addedCount Number of characters added
     * @param removedCount Number of characters removed
     * @return TextOperationType indicating the type of text operation
     */
    fun processTextChange(
        beforeText: String,
        currentText: String,
        addedCount: Int,
        removedCount: Int
    ): TextOperationType {
        val operation = when {
            // Text was deleted (removed > added)
            removedCount > 0 && addedCount == 0 -> {
                Log.d(TAG, "✓ Text deletion detected: removed $removedCount chars")
                TextOperationType.DELETE
            }

            // Text was added (added > removed)
            addedCount > 0 && removedCount == 0 -> {
                TextOperationType.INSERT
            }

            // Text was replaced (both added and removed)
            addedCount > 0 && removedCount > 0 -> {
                Log.d(TAG, "✓ Text replacement: removed $removedCount, added $addedCount")
                TextOperationType.REPLACE
            }

            // Selection changed or other operations
            else -> {
                TextOperationType.OTHER
            }
        }

        // Update tracking
        lastTextValue = currentText
        lastTextLength = currentText.length

        return operation
    }

    /**
     * Reset gesture tracking state.
     * Call this when recording stops to clear state.
     */
    fun reset() {
        lastTapTimestamp = 0
        lastTapX = null
        lastTapY = null
        lastTapResourceId = null
        lastTextValue = ""
        lastTextLength = 0
        resetPinchState()
        resetScrollState()
        Log.d(TAG, "Gesture detector reset")
    }

    /**
     * Reset pinch tracking state
     */
    private fun resetPinchState() {
        isMultiTouchActive = false
        initialPinchDistance = 0f
        lastPinchDistance = 0f
        pinchStartTime = 0
        finger1X = 0f
        finger1Y = 0f
        finger2X = 0f
        finger2Y = 0f
    }

    /**
     * Start tracking a pinch gesture with two touch points.
     *
     * @param x1 X coordinate of first finger
     * @param y1 Y coordinate of first finger
     * @param x2 X coordinate of second finger
     * @param y2 Y coordinate of second finger
     */
    fun startPinchTracking(x1: Float, y1: Float, x2: Float, y2: Float) {
        finger1X = x1
        finger1Y = y1
        finger2X = x2
        finger2Y = y2

        val distance = calculateDistance(x1, y1, x2, y2)
        if (distance >= MIN_PINCH_DISTANCE) {
            isMultiTouchActive = true
            initialPinchDistance = distance
            lastPinchDistance = distance
            pinchStartTime = System.currentTimeMillis()
            Log.d(TAG, "Pinch tracking started: distance = $distance")
        }
    }

    /**
     * Update pinch gesture with new touch points.
     *
     * @param x1 X coordinate of first finger
     * @param y1 Y coordinate of first finger
     * @param x2 X coordinate of second finger
     * @param y2 Y coordinate of second finger
     * @return PinchResult containing gesture type and scale factor
     */
    fun updatePinchTracking(x1: Float, y1: Float, x2: Float, y2: Float): PinchResult {
        if (!isMultiTouchActive) {
            return PinchResult(GestureType.SINGLE_TAP, 1.0f, 0f, 0f)
        }

        finger1X = x1
        finger1Y = y1
        finger2X = x2
        finger2Y = y2

        val currentDistance = calculateDistance(x1, y1, x2, y2)
        val scaleFactor = if (initialPinchDistance > 0) currentDistance / initialPinchDistance else 1.0f

        // Calculate center point of pinch
        val centerX = (x1 + x2) / 2
        val centerY = (y1 + y2) / 2

        lastPinchDistance = currentDistance

        return PinchResult(
            gestureType = when {
                scaleFactor > 1.0f + PINCH_SCALE_THRESHOLD -> GestureType.PINCH_OUT
                scaleFactor < 1.0f - PINCH_SCALE_THRESHOLD -> GestureType.PINCH_IN
                else -> GestureType.SINGLE_TAP // Not enough scale change yet
            },
            scaleFactor = scaleFactor,
            centerX = centerX,
            centerY = centerY
        )
    }

    /**
     * End pinch tracking and determine final gesture.
     *
     * @return PinchResult with final gesture type and scale
     */
    fun endPinchTracking(): PinchResult {
        if (!isMultiTouchActive) {
            return PinchResult(GestureType.SINGLE_TAP, 1.0f, 0f, 0f)
        }

        val scaleFactor = if (initialPinchDistance > 0) lastPinchDistance / initialPinchDistance else 1.0f
        val centerX = (finger1X + finger2X) / 2
        val centerY = (finger1Y + finger2Y) / 2

        val gestureType = when {
            scaleFactor > 1.0f + PINCH_SCALE_THRESHOLD -> {
                Log.d(TAG, "✓ Pinch OUT (zoom in) detected: scale = $scaleFactor")
                GestureType.PINCH_OUT
            }
            scaleFactor < 1.0f - PINCH_SCALE_THRESHOLD -> {
                Log.d(TAG, "✓ Pinch IN (zoom out) detected: scale = $scaleFactor")
                GestureType.PINCH_IN
            }
            else -> {
                Log.d(TAG, "Pinch ended without significant scale change")
                GestureType.SINGLE_TAP
            }
        }

        resetPinchState()

        return PinchResult(
            gestureType = gestureType,
            scaleFactor = scaleFactor,
            centerX = centerX,
            centerY = centerY
        )
    }

    /**
     * Detect two-finger scroll (pan) gesture.
     *
     * @param startX1 Starting X of first finger
     * @param startY1 Starting Y of first finger
     * @param startX2 Starting X of second finger
     * @param startY2 Starting Y of second finger
     * @param endX1 Ending X of first finger
     * @param endY1 Ending Y of first finger
     * @param endX2 Ending X of second finger
     * @param endY2 Ending Y of second finger
     * @return TwoFingerScrollResult with direction and distance
     */
    fun detectTwoFingerScroll(
        startX1: Float, startY1: Float, startX2: Float, startY2: Float,
        endX1: Float, endY1: Float, endX2: Float, endY2: Float
    ): TwoFingerScrollResult {
        // Calculate center movement
        val startCenterX = (startX1 + startX2) / 2
        val startCenterY = (startY1 + startY2) / 2
        val endCenterX = (endX1 + endX2) / 2
        val endCenterY = (endY1 + endY2) / 2

        val deltaX = endCenterX - startCenterX
        val deltaY = endCenterY - startCenterY
        val distance = kotlin.math.sqrt(deltaX * deltaX + deltaY * deltaY)

        // Determine direction
        val direction = when {
            kotlin.math.abs(deltaX) > kotlin.math.abs(deltaY) -> {
                if (deltaX > 0) GestureType.SWIPE_RIGHT else GestureType.SWIPE_LEFT
            }
            else -> {
                if (deltaY > 0) GestureType.SWIPE_DOWN else GestureType.SWIPE_UP
            }
        }

        Log.d(TAG, "Two-finger scroll detected: direction=$direction, distance=$distance")

        return TwoFingerScrollResult(
            direction = direction,
            deltaX = deltaX,
            deltaY = deltaY,
            distance = distance
        )
    }

    /**
     * Check if multi-touch is currently active
     */
    fun isMultiTouchActive(): Boolean = isMultiTouchActive

    /**
     * Calculate Euclidean distance between two points.
     */
    private fun calculateDistance(x1: Int, y1: Int, x2: Int, y2: Int): Float {
        val dx = (x1 - x2).toFloat()
        val dy = (y1 - y2).toFloat()
        return kotlin.math.sqrt(dx * dx + dy * dy)
    }

    /**
     * Calculate Euclidean distance between two points (Float version).
     */
    private fun calculateDistance(x1: Float, y1: Float, x2: Float, y2: Float): Float {
        val dx = x1 - x2
        val dy = y1 - y2
        return kotlin.math.sqrt(dx * dx + dy * dy)
    }

    /**
     * Check if a long press is happening based on timing.
     * Note: Long press is usually detected by system via TYPE_VIEW_LONG_CLICKED,
     * but this can be used for custom detection.
     */
    fun isLongPressInProgress(startTime: Long): Boolean {
        val duration = System.currentTimeMillis() - startTime
        return duration >= LONG_PRESS_TIMEOUT
    }
}

/**
 * Gesture types detected by the advanced detector.
 */
enum class GestureType {
    SINGLE_TAP,
    DOUBLE_TAP,
    LONG_PRESS,
    SWIPE_UP,
    SWIPE_DOWN,
    SWIPE_LEFT,
    SWIPE_RIGHT,
    PINCH_IN,
    PINCH_OUT
}

/**
 * Text operation types detected from text change events.
 */
enum class TextOperationType {
    INSERT,     // Adding new text
    DELETE,     // Removing text (backspace/delete)
    REPLACE,    // Replacing text (auto-correct, paste over selection)
    SELECT,     // Selection changed
    CLEAR,      // Clear all text
    OTHER       // Other operations
}

/**
 * Data class for detailed text operation info.
 */
data class TextOperation(
    val type: TextOperationType,
    val beforeText: String,
    val afterText: String,
    val addedCount: Int,
    val removedCount: Int,
    val fromIndex: Int,
    val deletedText: String? = null,  // Text that was deleted
    val insertedText: String? = null  // Text that was inserted
) {
    /**
     * Get a human-readable description of the operation.
     */
    fun getDescription(): String {
        return when (type) {
            TextOperationType.DELETE -> {
                if (deletedText != null) {
                    "Deleted \"$deletedText\" ($removedCount chars)"
                } else {
                    "Deleted $removedCount characters"
                }
            }
            TextOperationType.INSERT -> {
                if (insertedText != null) {
                    "Typed \"$insertedText\""
                } else {
                    "Added $addedCount characters"
                }
            }
            TextOperationType.REPLACE -> {
                "Replaced $removedCount chars with $addedCount chars"
            }
            TextOperationType.CLEAR -> {
                "Cleared all text"
            }
            else -> "Text changed"
        }
    }

    /**
     * Check if this was a backspace/delete key press.
     */
    fun isBackspace(): Boolean {
        return type == TextOperationType.DELETE && removedCount == 1
    }

    /**
     * Check if this was a clear all operation.
     */
    fun isClearAll(): Boolean {
        return type == TextOperationType.DELETE && beforeText.isNotEmpty() && afterText.isEmpty()
    }
}

/**
 * Result of pinch gesture detection.
 */
data class PinchResult(
    val gestureType: GestureType,
    val scaleFactor: Float,
    val centerX: Float,
    val centerY: Float
) {
    /**
     * Check if this is a zoom-in gesture (pinch out)
     */
    fun isZoomIn(): Boolean = gestureType == GestureType.PINCH_OUT

    /**
     * Check if this is a zoom-out gesture (pinch in)
     */
    fun isZoomOut(): Boolean = gestureType == GestureType.PINCH_IN

    /**
     * Get scale percentage (100% = no change)
     */
    fun getScalePercent(): Int = (scaleFactor * 100).toInt()
}

/**
 * Result of two-finger scroll detection.
 */
data class TwoFingerScrollResult(
    val direction: GestureType,
    val deltaX: Float,
    val deltaY: Float,
    val distance: Float
) {
    /**
     * Get a human-readable description
     */
    fun getDescription(): String {
        return when (direction) {
            GestureType.SWIPE_UP -> "Pan up ${distance.toInt()}px"
            GestureType.SWIPE_DOWN -> "Pan down ${distance.toInt()}px"
            GestureType.SWIPE_LEFT -> "Pan left ${distance.toInt()}px"
            GestureType.SWIPE_RIGHT -> "Pan right ${distance.toInt()}px"
            else -> "Two-finger scroll"
        }
    }
}

/**
 * Result of scroll event debouncing.
 */
data class ScrollEventResult(
    val shouldRecord: Boolean,        // True if this scroll should be recorded now
    val accumulatedDeltaX: Int,       // Accumulated scroll delta X
    val accumulatedDeltaY: Int,       // Accumulated scroll delta Y
    val direction: String             // Scroll direction
) {
    /**
     * Get a human-readable description
     */
    fun getDescription(): String {
        return "Scroll $direction (deltaX=$accumulatedDeltaX, deltaY=$accumulatedDeltaY)"
    }
}
