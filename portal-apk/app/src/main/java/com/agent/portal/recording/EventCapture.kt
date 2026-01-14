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
    private const val EVENT_SCROLL_UP = "scroll_up"
    private const val EVENT_SCROLL_DOWN = "scroll_down"
    private const val EVENT_SCROLL_LEFT = "scroll_left"
    private const val EVENT_SCROLL_RIGHT = "scroll_right"
    private const val EVENT_FOCUS = "focus"
    private const val EVENT_GESTURE_START = "gesture_start"
    private const val EVENT_GESTURE_END = "gesture_end"
    private const val EVENT_UNKNOWN = "unknown"

    // ========== SMART FILTERING CONSTANTS ==========
    // Minimum scroll delta threshold (skip micro-scrolls < 50px)
    private const val MIN_SCROLL_DELTA_THRESHOLD = 50
    
    // Focus event suppression window (skip focus if tap/text within 500ms)
    private const val FOCUS_SUPPRESSION_WINDOW_MS = 500L
    
    // ========== TOUCH EXPLORATION MODE - RELIABLE USER DETECTION ==========
    // This is the PRIMARY method for detecting user-initiated events
    // TOUCH_INTERACTION_START/END events directly indicate when user is touching
    
    // Current touch state - TRUE when user is physically touching the screen
    @Volatile
    private var userIsTouching: Boolean = false
    
    // Current gesture state - TRUE when a gesture is being performed
    @Volatile
    private var gestureInProgress: Boolean = false
    
    // Timestamp when touch started (for timeout fallback)
    private var touchStartTimestamp: Long = 0L
    
    // Grace period after touch ends to capture final events (ms)
    // Some events (like scroll end) may arrive slightly after touch ends
    private const val TOUCH_GRACE_PERIOD_MS = 200L
    private var touchEndTimestamp: Long = 0L
    
    // ========== LEGACY FALLBACK (for devices without Touch Exploration) ==========
    // These are ONLY used if Touch Exploration Mode doesn't work
    private var lastUserTouchTimestamp: Long = 0L
    private var lastScrollTimestamp: Long = 0L
    private var lastActivityClassName: String = ""
    private var rapidScrollCounter: Int = 0
    private const val MAX_RAPID_SCROLLS_ALLOWED = 2
    private const val USER_TOUCH_TIMEOUT_MS = 1500L
    private const val MIN_USER_SCROLL_INTERVAL_MS = 100L
    
    // Track last focus event for suppression
    private var lastFocusResourceId: String = ""
    private var lastFocusTimestamp: Long = 0L

    // Advanced gesture detector instance
    private val gestureDetector = AdvancedGestureDetector()
    
    // ========== TOUCH EXPLORATION MODE CALLBACKS ==========
    
    /**
     * Called when TOUCH_INTERACTION_START event is received.
     * User has started touching the screen.
     */
    fun onUserTouchStart() {
        userIsTouching = true
        touchStartTimestamp = System.currentTimeMillis()
        lastUserTouchTimestamp = touchStartTimestamp
        rapidScrollCounter = 0
        Log.d(TAG, "✅ User touch started - events will be recorded")
    }
    
    /**
     * Called when TOUCH_INTERACTION_END event is received.
     * User has lifted finger from screen.
     */
    fun onUserTouchEnd() {
        userIsTouching = false
        touchEndTimestamp = System.currentTimeMillis()
        Log.d(TAG, "⏹️ User touch ended - grace period ${TOUCH_GRACE_PERIOD_MS}ms")
    }
    
    /**
     * Called when GESTURE_DETECTION_START event is received.
     * A gesture is being performed.
     */
    fun onGestureStart() {
        gestureInProgress = true
        // Also mark as user touching for safety
        if (!userIsTouching) {
            userIsTouching = true
            touchStartTimestamp = System.currentTimeMillis()
        }
        Log.d(TAG, "🔄 Gesture started")
    }
    
    /**
     * Called when GESTURE_DETECTION_END event is received.
     * Gesture has completed.
     */
    fun onGestureEnd() {
        gestureInProgress = false
        Log.d(TAG, "🔄 Gesture ended")
    }
    
    /**
     * Check if user is currently touching the screen.
     * Includes grace period after touch ends.
     */
    fun isUserTouching(): Boolean {
        if (userIsTouching) return true
        
        // Check grace period after touch ended
        val timeSinceTouchEnd = System.currentTimeMillis() - touchEndTimestamp
        if (timeSinceTouchEnd < TOUCH_GRACE_PERIOD_MS) {
            return true
        }
        
        return false
    }
    
    /**
     * Check if a gesture is in progress.
     */
    fun isGestureInProgress(): Boolean = gestureInProgress

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
            // Flush any pending text input before processing scroll
            val pendingText = flushPendingTextInput()
            if (pendingText != null) {
                // In this case, we want to record the text first
                // The scroll will be captured on the next call
                Log.d(TAG, "Flushed pending text before scroll")
                RecordingManager.addEvent(pendingText)
            }
            return captureScrollEvent(event)
        }
        
        // For tap events, flush any pending text input first
        // Also check if this tap follows a recent focus on same element (suppress the tap's implicit focus)
        if (eventType == EVENT_TAP || eventType == EVENT_LONG_TAP) {
            // Mark this as user interaction - update touch timestamp
            lastUserTouchTimestamp = System.currentTimeMillis()
            rapidScrollCounter = 0 // Reset rapid scroll counter on user touch
            
            val pendingText = flushPendingTextInput()
            if (pendingText != null) {
                Log.d(TAG, "Flushed pending text before tap")
                RecordingManager.addEvent(pendingText)
            }
        }
        
        // Handle focus events with suppression logic
        // Skip focus events that are likely to be followed by tap/text on same element
        if (eventType == EVENT_FOCUS) {
            val node = event.source
            val resourceId = node?.viewIdResourceName ?: ""
            node?.recycle()
            
            // Track this focus event
            lastFocusResourceId = resourceId
            lastFocusTimestamp = System.currentTimeMillis()
            
            // Skip focus events - they add noise without value
            // The actual action (tap, text input) will be recorded anyway
            Log.d(TAG, "Skipping focus event (resource: ${resourceId.takeLast(30)})")
            return null
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
                // TEXT_INPUT events are debounced - update pending text and return null
                if (eventType == EVENT_TEXT_INPUT) {
                    val beforeText = event.beforeText?.toString() ?: ""
                    
                    // CRITICAL: Get text from NODE (full field content), not from event (only fragment)
                    // node.text contains the complete current text in the input field
                    val currentText = node.text?.toString() ?: getTextFromEvent(event)
                    
                    Log.d(TAG, "Text change detected: before='${beforeText.take(20)}' current='${currentText.take(20)}' added=${event.addedCount} removed=${event.removedCount}")
                    
                    // ========== INLINE TIMEOUT CHECK ==========
                    // Check if there's pending text that's older than debounce timeout
                    // If so, flush it BEFORE updating with new text
                    // This ensures text is eventually recorded even without tap/scroll trigger
                    val currentResourceId = elementData.resourceId
                    if (pendingTextValue.isNotEmpty() && pendingTextTimestamp > 0) {
                        val elapsed = System.currentTimeMillis() - pendingTextTimestamp
                        val isDifferentField = currentResourceId != pendingTextResourceId
                        
                        if (elapsed >= TEXT_DEBOUNCE_TIMEOUT_MS || isDifferentField) {
                            // Flush the old pending text
                            val flushedEvent = flushPendingTextInput()
                            if (flushedEvent != null) {
                                Log.d(TAG, "✓ Auto-flushed pending text after ${elapsed}ms (different field: $isDifferentField)")
                                RecordingManager.addEvent(flushedEvent)
                            }
                        }
                    }
                    // ========== END INLINE TIMEOUT CHECK ==========
                    
                    val textOp = gestureDetector.processTextChange(
                        beforeText,
                        currentText,
                        event.addedCount,
                        event.removedCount
                    )

                    // If it's a deletion, we still debounce but with special handling
                    if (textOp == TextOperationType.DELETE) {
                        Log.d(TAG, "✓ Detected text deletion: ${event.removedCount} chars (debounced)")
                    }
                    
                    // Update pending text and return null (debouncing)
                    // The text will be emitted when user taps, scrolls, or timeout occurs
                    updatePendingTextInput(
                        event = event,
                        node = node,
                        text = currentText,
                        resourceId = elementData.resourceId,
                        packageName = event.packageName?.toString() ?: "",
                        className = event.className?.toString() ?: "",
                        bounds = elementData.bounds,
                        centerX = elementData.centerX,
                        centerY = elementData.centerY
                    )
                    
                    // Return null to indicate debouncing - event will be recorded later
                    return null
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
    // Track previous scroll position for direction detection
    private var lastScrollY: Int = -1
    private var lastScrollX: Int = -1
    
    // ========== TEXT INPUT DEBOUNCING ==========
    // Text input debounce timeout (700ms - wait for user to finish typing)
    private const val TEXT_DEBOUNCE_TIMEOUT_MS = 700L
    
    // Track pending text input for debouncing
    private var pendingTextEvent: AccessibilityEvent? = null
    private var pendingTextValue: String = ""
    private var pendingTextResourceId: String = ""
    private var pendingTextTimestamp: Long = 0
    private var pendingTextNode: AccessibilityNodeInfo? = null
    private var pendingTextPackage: String = ""
    private var pendingTextClassName: String = ""
    private var pendingTextBounds: String = ""
    private var pendingTextCenterX: Int? = null
    private var pendingTextCenterY: Int? = null
    
    /**
     * Check if there's pending text input that should be flushed.
     * Call this when a non-text event occurs (tap, scroll) or periodically.
     */
    fun checkPendingTextInput(): RecordedEvent? {
        if (pendingTextValue.isEmpty()) return null
        
        val elapsed = System.currentTimeMillis() - pendingTextTimestamp
        if (elapsed >= TEXT_DEBOUNCE_TIMEOUT_MS) {
            return flushPendingTextInput()
        }
        return null
    }
    
    /**
     * Force flush any pending text input.
     * Call when recording stops or when focus changes.
     */
    fun flushPendingTextInput(): RecordedEvent? {
        if (pendingTextValue.isEmpty()) return null
        
        Log.d(TAG, "✓ Flushing pending text input: '${pendingTextValue.take(20)}...'")
        
        val recordedEvent = RecordedEvent(
            eventType = EVENT_TEXT_INPUT,
            timestamp = pendingTextTimestamp,
            packageName = pendingTextPackage,
            className = pendingTextClassName,
            resourceId = pendingTextResourceId,
            contentDescription = "",
            text = pendingTextValue,
            bounds = pendingTextBounds,
            isClickable = false,
            isEditable = true,
            isScrollable = false,
            actionData = mapOf(
                "text" to pendingTextValue,
                "input_type" to "keyboard"
            ),
            x = pendingTextCenterX,
            y = pendingTextCenterY,
            nodeIndex = null
        )
        
        // Clear pending state
        pendingTextValue = ""
        pendingTextResourceId = ""
        pendingTextTimestamp = 0
        try { pendingTextNode?.recycle() } catch (_: Exception) {}
        pendingTextNode = null
        pendingTextPackage = ""
        pendingTextClassName = ""
        pendingTextBounds = ""
        pendingTextCenterX = null
        pendingTextCenterY = null
        
        return recordedEvent
    }
    
    /**
     * Update pending text input (called for each TEXT_CHANGED event).
     * Returns null to indicate the event is being debounced.
     */
    private fun updatePendingTextInput(
        event: AccessibilityEvent,
        node: AccessibilityNodeInfo?,
        text: String,
        resourceId: String,
        packageName: String,
        className: String,
        bounds: String,
        centerX: Int?,
        centerY: Int?
    ) {
        pendingTextValue = text
        pendingTextResourceId = resourceId
        pendingTextTimestamp = System.currentTimeMillis()
        pendingTextPackage = packageName
        pendingTextClassName = className
        pendingTextBounds = bounds
        pendingTextCenterX = centerX
        pendingTextCenterY = centerY
        
        // Keep reference to node (recycle old one first)
        try { pendingTextNode?.recycle() } catch (_: Exception) {}
        pendingTextNode = node?.let { 
            try { AccessibilityNodeInfo.obtain(it) } catch (_: Exception) { null }
        }
        
        Log.d(TAG, "Text debounced: '${text.take(20)}...' (waiting for more input)")
    }
    
    private fun captureScrollEvent(event: AccessibilityEvent): RecordedEvent? {
        val packageName = event.packageName?.toString() ?: ""
        val className = event.className?.toString() ?: ""
        val currentTime = System.currentTimeMillis()

        // ========== HYBRID USER-INITIATED SCROLL DETECTION ==========
        // Uses Touch Exploration Mode if available, falls back to timing heuristics
        
        // Check if we have touch exploration data (touchStartTimestamp > 0 means we've received touch events)
        val hasTouchExplorationData = touchStartTimestamp > 0 || touchEndTimestamp > 0
        
        if (hasTouchExplorationData) {
            // PRIMARY: Use Touch Exploration Mode (most accurate)
            if (!isUserTouching()) {
                Log.d(TAG, "Ignoring scroll: user NOT touching (Touch Exploration Mode)")
                return null
            }
            Log.d(TAG, "✓ Scroll allowed: user IS touching (Touch Exploration Mode)")
        } else {
            // FALLBACK: Use timing-based heuristics
            // This handles devices/apps where Touch Exploration events aren't available
            
            // Check 1: Time since last tap/click (which updates lastUserTouchTimestamp)
            val timeSinceUserTouch = currentTime - lastUserTouchTimestamp
            if (timeSinceUserTouch > USER_TOUCH_TIMEOUT_MS && lastUserTouchTimestamp > 0) {
                Log.d(TAG, "Ignoring scroll: no recent user touch (${timeSinceUserTouch}ms ago, fallback mode)")
                return null
            }
            
            // Check 2: Rapid consecutive scrolls (likely animation)
            val timeSinceLastScroll = currentTime - lastScrollTimestamp
            if (timeSinceLastScroll < MIN_USER_SCROLL_INTERVAL_MS && lastScrollTimestamp > 0) {
                rapidScrollCounter++
                if (rapidScrollCounter > MAX_RAPID_SCROLLS_ALLOWED) {
                    Log.d(TAG, "Ignoring rapid scroll: ${rapidScrollCounter} consecutive (likely animation)")
                    lastScrollTimestamp = currentTime
                    return null
                }
            } else {
                rapidScrollCounter = 0
            }
            lastScrollTimestamp = currentTime
        }
        
        // SECONDARY: Activity change detection - skip scroll during screen transitions
        if (className != lastActivityClassName && lastActivityClassName.isNotEmpty()) {
            lastActivityClassName = className
            Log.d(TAG, "Ignoring scroll: activity changed to $className (likely navigation)")
            return null
        }
        lastActivityClassName = className
        
        // ========== END USER-INITIATED DETECTION ==========

        // Extract scroll data - read deltas directly (don't depend on maxScroll check)
        var deltaX = event.scrollDeltaX
        var deltaY = event.scrollDeltaY
        
        val currentScrollY = event.scrollY
        val currentScrollX = event.scrollX

        // Determine direction - note: deltaY > 0 means finger swiped UP (content scrolled down)
        // But user intent is "scroll up" so we use UP direction
        
        // Check minimum scroll threshold - ignore micro-scrolls
        val absDeltaY = kotlin.math.abs(deltaY)
        val absDeltaX = kotlin.math.abs(deltaX)
        if (absDeltaY < MIN_SCROLL_DELTA_THRESHOLD && absDeltaX < MIN_SCROLL_DELTA_THRESHOLD) {
            // Also check position-based delta
            val positionDeltaY = kotlin.math.abs(currentScrollY - lastScrollY)
            val positionDeltaX = kotlin.math.abs(currentScrollX - lastScrollX)
            if (positionDeltaY < MIN_SCROLL_DELTA_THRESHOLD && positionDeltaX < MIN_SCROLL_DELTA_THRESHOLD) {
                Log.d(TAG, "Ignoring micro-scroll: deltaY=$deltaY, deltaX=$deltaX (threshold=$MIN_SCROLL_DELTA_THRESHOLD)")
                return null
            }
        }
        
        val direction: String
        when {
            deltaY > 0 -> direction = "up"   // Finger swiped up = scroll up
            deltaY < 0 -> direction = "down" // Finger swiped down = scroll down
            deltaX > 0 -> direction = "left" // Finger swiped left = scroll left
            deltaX < 0 -> direction = "right" // Finger swiped right = scroll right
            // If no delta provided, use scroll position comparison
            lastScrollY >= 0 && currentScrollY != lastScrollY -> {
                direction = if (currentScrollY > lastScrollY) "up" else "down"
                deltaY = if (currentScrollY > lastScrollY) 100 else -100
                Log.d(TAG, "Direction detected from position: lastY=$lastScrollY currentY=$currentScrollY -> $direction")
            }
            lastScrollX >= 0 && currentScrollX != lastScrollX -> {
                direction = if (currentScrollX > lastScrollX) "left" else "right"
                deltaX = if (currentScrollX > lastScrollX) 100 else -100
            }
            else -> {
                // No delta and no position change - this is NOT a real scroll, ignore it
                Log.d(TAG, "Ignoring scroll event: no delta and no position change (deltaY=$deltaY, deltaX=$deltaX, scrollY=$currentScrollY)")
                return null
            }
        }
        
        // Update last scroll position
        lastScrollY = currentScrollY
        lastScrollX = currentScrollX

        // Process with debouncing
        val scrollResult = gestureDetector.processScrollEvent(
            direction = direction,
            deltaX = deltaX,
            deltaY = if (deltaY == 0) 100 else deltaY, // Ensure non-zero for debounce logic
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

            // Get direction-specific event type for distinct Loop detection on FE
            val scrollEventType = when (scrollResult.direction) {
                "up" -> EVENT_SCROLL_UP
                "down" -> EVENT_SCROLL_DOWN
                "left" -> EVENT_SCROLL_LEFT
                "right" -> EVENT_SCROLL_RIGHT
                else -> EVENT_SCROLL
            }

            if (node != null) {
                val elementData = extractElementData(node)
                RecordedEvent(
                    eventType = scrollEventType,
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
                    eventType = scrollEventType,
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

        // Direction-specific event type
        val scrollEventType = when (scrollResult.direction) {
            "up" -> EVENT_SCROLL_UP
            "down" -> EVENT_SCROLL_DOWN
            "left" -> EVENT_SCROLL_LEFT
            "right" -> EVENT_SCROLL_RIGHT
            else -> EVENT_SCROLL
        }

        return RecordedEvent(
            eventType = scrollEventType,
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

        // Direction-specific event type
        val scrollEventType = when (scrollResult.direction) {
            "up" -> EVENT_SCROLL_UP
            "down" -> EVENT_SCROLL_DOWN
            "left" -> EVENT_SCROLL_LEFT
            "right" -> EVENT_SCROLL_RIGHT
            else -> EVENT_SCROLL
        }

        return RecordedEvent(
            eventType = scrollEventType,
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

                // Determine scroll direction - note: deltaY > 0 means finger swiped UP
                val direction = when {
                    deltaY > 0 -> "up"   // Finger swiped up = scroll up
                    deltaY < 0 -> "down" // Finger swiped down = scroll down
                    deltaX > 0 -> "left"
                    deltaX < 0 -> "right"
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
        lastScrollY = -1
        lastScrollX = -1
        
        // Reset Touch Exploration Mode state
        userIsTouching = false
        gestureInProgress = false
        touchStartTimestamp = 0L
        touchEndTimestamp = 0L
        
        // Reset legacy fallback tracking
        lastUserTouchTimestamp = 0L
        lastScrollTimestamp = 0L
        lastActivityClassName = ""
        rapidScrollCounter = 0
        
        Log.d(TAG, "Gesture detector and Touch Exploration state reset")
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
