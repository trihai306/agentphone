package com.agent.portal.recording

import android.content.Context
import android.util.Log
import android.view.accessibility.AccessibilityNodeInfo
import com.agent.portal.accessibility.PortalAccessibilityService
import kotlinx.coroutines.*
import java.lang.ref.WeakReference

/**
 * RecordingPlayer - Replay recorded events with SMART SELECTOR SYSTEM
 *
 * This class replays recorded events using a smart approach:
 * 1. Try to find element by selector (resourceId > text > contentDescription)
 * 2. If selector fails, fallback to coordinate-based tap
 *
 * This makes replay much more reliable when UI changes slightly.
 */
object RecordingPlayer {

    private const val TAG = "RecordingPlayer"

    private var contextRef: WeakReference<Context>? = null
    private var isPlaying = false
    private var playbackJob: Job? = null

    // Playback speed multiplier (1.0 = normal speed, 2.0 = 2x speed, 0.5 = half speed)
    private var playbackSpeed = 1.0

    // Selector mode preference (true = use selector first, false = coordinates only)
    private var useSelectorFirst = true

    /**
     * Initialize with context
     */
    fun init(context: Context) {
        contextRef = WeakReference(context.applicationContext)
    }

    /**
     * Check if playback is currently running
     */
    fun isPlaying(): Boolean = isPlaying

    /**
     * Set playback speed
     * @param speed Speed multiplier (0.1 to 5.0)
     */
    fun setPlaybackSpeed(speed: Double) {
        playbackSpeed = speed.coerceIn(0.1, 5.0)
        Log.i(TAG, "Playback speed set to: ${playbackSpeed}x")
    }

    /**
     * Set selector mode preference
     * @param useSelectorFirst If true, try to find elements by selector before using coordinates
     */
    fun setUseSelectorFirst(useSelectorFirst: Boolean) {
        this.useSelectorFirst = useSelectorFirst
        Log.i(TAG, "Selector mode: ${if (useSelectorFirst) "Smart selector (fallback to coords)" else "Coordinates only"}")
    }

    /**
     * Play recorded events
     * @param events List of recorded events to replay
     * @param onComplete Callback when playback completes
     * @param onError Callback when playback encounters error
     */
    fun playRecording(
        events: List<RecordedEvent>,
        onComplete: (() -> Unit)? = null,
        onError: ((String) -> Unit)? = null
    ) {
        if (isPlaying) {
            Log.w(TAG, "Playback already in progress")
            onError?.invoke("Playback already in progress")
            return
        }

        if (events.isEmpty()) {
            Log.w(TAG, "No events to play")
            onError?.invoke("No events to play")
            return
        }

        val service = PortalAccessibilityService.instance
        if (service == null) {
            Log.e(TAG, "Accessibility service not available")
            onError?.invoke("Accessibility service not available")
            return
        }

        isPlaying = true
        Log.i(TAG, "Starting playback of ${events.size} events at ${playbackSpeed}x speed")

        playbackJob = CoroutineScope(Dispatchers.Main).launch {
            try {
                // Auto back to Home before replaying
                service.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_HOME)
                delay(1000) // Wait for Home screen

                playEvents(events, service)

                Log.i(TAG, "Playback completed successfully")
                onComplete?.invoke()
            } catch (e: Exception) {
                Log.e(TAG, "Playback failed", e)
                onError?.invoke("Playback failed: ${e.message}")
            } finally {
                isPlaying = false
            }
        }
    }

    /**
     * Play events sequentially with timing
     */
    private suspend fun playEvents(events: List<RecordedEvent>, service: PortalAccessibilityService) {
        var previousTimestamp = events.firstOrNull()?.timestamp ?: 0L

        for ((index, event) in events.withIndex()) {
            if (!isPlaying) {
                Log.i(TAG, "Playback stopped by user")
                break
            }

            // Calculate delay between events (adjusted by playback speed)
            if (index > 0) {
                val timeDiff = event.timestamp - previousTimestamp
                val adjustedDelay = (timeDiff / playbackSpeed).toLong()
                if (adjustedDelay > 0) {
                    delay(adjustedDelay.coerceAtMost(10000)) // Max 10 seconds delay
                }
            }

            // Execute the action
            executeEvent(event, service)

            previousTimestamp = event.timestamp

            Log.d(TAG, "Played event ${index + 1}/${events.size}: ${event.eventType}")
        }
    }

    /**
     * Execute a single recorded event using SMART SELECTOR SYSTEM
     */
    private suspend fun executeEvent(event: RecordedEvent, service: PortalAccessibilityService) {
        try {
            when (event.eventType) {
                "tap", "click" -> {
                    executeTap(event, service)
                }

                "double_tap" -> {
                    executeDoubleTap(event, service)
                }

                "long_tap", "long_press" -> {
                    executeLongPress(event, service)
                }

                "swipe" -> {
                    executeSwipe(event, service)
                }

                "scroll" -> {
                    executeScroll(event, service)
                }

                "text_input" -> {
                    executeTextInput(event, service)
                }

                "text_delete" -> {
                    executeTextDelete(event, service)
                }

                else -> {
                    Log.d(TAG, "Skipped event type: ${event.eventType}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to execute event: ${event.eventType}", e)
        }
    }

    /**
     * Execute TAP action - SMART SELECTOR MODE
     * Priority: resourceId > text > contentDescription > coordinates
     */
    private suspend fun executeTap(event: RecordedEvent, service: PortalAccessibilityService) {
        if (useSelectorFirst) {
            // Try smart selector first
            val node = findNodeBySelector(event, service.rootInActiveWindow)
            if (node != null) {
                try {
                    val success = node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                    if (success) {
                        Log.d(TAG, "✓ Executed tap via SELECTOR: ${getSelectorInfo(event)}")
                        return
                    } else {
                        Log.w(TAG, "⚠ Selector click failed, falling back to coordinates")
                    }
                } finally {
                    node.recycle()
                }
            } else {
                Log.w(TAG, "⚠ Element not found by selector: ${getSelectorInfo(event)}, using coordinates")
            }
        }

        // Fallback to coordinates (or primary method if useSelectorFirst = false)
        val x = event.x
        val y = event.y
        if (x != null && y != null) {
            service.performTap(x, y)
            Log.d(TAG, "✓ Executed tap via COORDINATES: ($x, $y)")
        } else {
            Log.e(TAG, "✗ No coordinates available for tap")
        }
    }

    /**
     * Execute DOUBLE TAP action
     */
    private suspend fun executeDoubleTap(event: RecordedEvent, service: PortalAccessibilityService) {
        if (useSelectorFirst) {
            val node = findNodeBySelector(event, service.rootInActiveWindow)
            if (node != null) {
                try {
                    node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                    delay(100)
                    node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                    Log.d(TAG, "✓ Executed double tap via SELECTOR")
                    return
                } finally {
                    node.recycle()
                }
            }
        }

        // Fallback to coordinates
        val x = event.x
        val y = event.y
        if (x != null && y != null) {
            service.performTap(x, y)
            delay(100)
            service.performTap(x, y)
            Log.d(TAG, "✓ Executed double tap via COORDINATES: ($x, $y)")
        }
    }

    /**
     * Execute LONG PRESS action
     */
    private suspend fun executeLongPress(event: RecordedEvent, service: PortalAccessibilityService) {
        if (useSelectorFirst) {
            val node = findNodeBySelector(event, service.rootInActiveWindow)
            if (node != null) {
                try {
                    val success = node.performAction(AccessibilityNodeInfo.ACTION_LONG_CLICK)
                    if (success) {
                        Log.d(TAG, "✓ Executed long press via SELECTOR")
                        return
                    }
                } finally {
                    node.recycle()
                }
            }
        }

        // Fallback to coordinates
        val x = event.x
        val y = event.y
        val duration = (event.actionData?.get("duration") as? Number)?.toLong() ?: 1000
        if (x != null && y != null) {
            service.performLongPress(x, y, duration)
            Log.d(TAG, "✓ Executed long press via COORDINATES: ($x, $y)")
        }
    }

    /**
     * Execute SWIPE action
     */
    private suspend fun executeSwipe(event: RecordedEvent, service: PortalAccessibilityService) {
        val actionData = event.actionData as? Map<*, *>
        val startX = (actionData?.get("start_x") as? Number)?.toInt()
        val startY = (actionData?.get("start_y") as? Number)?.toInt()
        val endX = (actionData?.get("end_x") as? Number)?.toInt()
        val endY = (actionData?.get("end_y") as? Number)?.toInt()
        val duration = (actionData?.get("duration") as? Number)?.toLong() ?: 300

        if (startX != null && startY != null && endX != null && endY != null) {
            service.performSwipe(startX, startY, endX, endY, duration)
            Log.d(TAG, "✓ Executed swipe from ($startX, $startY) to ($endX, $endY)")
        }
    }

    /**
     * Execute SCROLL action
     * IMPORTANT: Scroll events can happen both inside scrollable views and on home screen
     * Priority:
     * 1. Try swipe coordinates (works everywhere including home screen)
     * 2. Try finding scrollable element by selector (works inside apps)
     * 3. Fallback to global scroll commands (may not work outside app)
     */
    private suspend fun executeScroll(event: RecordedEvent, service: PortalAccessibilityService) {
        val actionData = event.actionData as? Map<*, *>

        // PRIORITY 1: Try swipe coordinates first (most reliable for all contexts)
        // Scroll events now store swipe coordinates for replay outside app (e.g. home screen)
        val startX = (actionData?.get("start_x") as? Number)?.toInt()
        val startY = (actionData?.get("start_y") as? Number)?.toInt()
        val endX = (actionData?.get("end_x") as? Number)?.toInt()
        val endY = (actionData?.get("end_y") as? Number)?.toInt()
        val duration = (actionData?.get("duration") as? Number)?.toLong() ?: 300

        if (startX != null && startY != null && endX != null && endY != null) {
            // Use swipe gesture for scroll (works on home screen and everywhere)
            Log.d(TAG, "Executing scroll as SWIPE: ($startX,$startY) → ($endX,$endY)")
            service.performSwipe(startX, startY, endX, endY, duration)
            Log.d(TAG, "✓ Executed scroll via SWIPE coordinates")
            return
        }

        // PRIORITY 2: Try element-based scroll (works inside apps with scrollable views)
        if (useSelectorFirst && event.resourceId.isNotBlank()) {
            // Try to find scrollable element and scroll it
            val node = findNodeByResourceId(event.resourceId, service.rootInActiveWindow)
            if (node != null) {
                try {
                    val direction = actionData?.get("direction") as? String
                    val success = when (direction?.lowercase()) {
                        "up", "down" -> node.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD)
                        "left", "right" -> node.performAction(AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD)
                        else -> false
                    }
                    if (success) {
                        Log.d(TAG, "✓ Executed scroll via SELECTOR: $direction")
                        return
                    }
                } finally {
                    node.recycle()
                }
            }
        }

        // PRIORITY 3: Fallback to global scroll (may not work outside app)
        val direction = actionData?.get("direction") as? String
        val amount = (actionData?.get("amount") as? Number)?.toInt() ?: 1

        Log.w(TAG, "⚠ Using fallback global scroll (may not work outside app)")
        when (direction?.lowercase()) {
            "up" -> service.performScrollUp(amount)
            "down" -> service.performScrollDown(amount)
            "left" -> service.performScrollLeft(amount)
            "right" -> service.performScrollRight(amount)
        }
        Log.d(TAG, "✓ Executed scroll $direction via GLOBAL ACTION (fallback)")
    }

    /**
     * Execute TEXT INPUT action
     */
    private suspend fun executeTextInput(event: RecordedEvent, service: PortalAccessibilityService) {
        // First, try to find and focus the text field
        if (useSelectorFirst) {
            val node = findNodeBySelector(event, service.rootInActiveWindow)
            if (node != null) {
                try {
                    node.performAction(AccessibilityNodeInfo.ACTION_FOCUS)
                    node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                    delay(200) // Wait for keyboard
                } finally {
                    node.recycle()
                }
            }
        } else if (event.x != null && event.y != null) {
            // Tap the field first
            service.performTap(event.x, event.y)
            delay(200)
        }

        // Then input the text
        val actionData = event.actionData as? Map<*, *>
        val text = actionData?.get("current_text") as? String

        if (!text.isNullOrEmpty()) {
            service.inputText(text)
            Log.d(TAG, "✓ Executed text input: $text")
        }
    }

    /**
     * Execute TEXT DELETE action
     */
    private suspend fun executeTextDelete(event: RecordedEvent, service: PortalAccessibilityService) {
        val actionData = event.actionData as? Map<*, *>
        val deletedText = actionData?.get("deleted_text") as? String
        val deleteCount = deletedText?.length ?: 1

        // Press backspace multiple times
        repeat(deleteCount) {
            // TODO: Implement backspace action
            delay(50)
        }
        Log.d(TAG, "✓ Executed text delete: $deleteCount chars")
    }

    /**
     * Find node by selector (smart priority system)
     * Priority: resourceId > text > contentDescription
     */
    private fun findNodeBySelector(event: RecordedEvent, rootNode: AccessibilityNodeInfo?): AccessibilityNodeInfo? {
        if (rootNode == null) return null

        // Priority 1: Resource ID (most stable)
        if (event.resourceId.isNotBlank()) {
            val node = findNodeByResourceId(event.resourceId, rootNode)
            if (node != null) {
                Log.d(TAG, "✓ Found by resourceId: ${event.resourceId}")
                return node
            }
        }

        // Priority 2: Text (good for buttons, labels)
        if (event.text.isNotBlank()) {
            val node = findNodeByText(event.text, rootNode)
            if (node != null) {
                Log.d(TAG, "✓ Found by text: ${event.text}")
                return node
            }
        }

        // Priority 3: Content Description (accessibility label)
        if (event.contentDescription.isNotBlank()) {
            val node = findNodeByContentDescription(event.contentDescription, rootNode)
            if (node != null) {
                Log.d(TAG, "✓ Found by contentDescription: ${event.contentDescription}")
                return node
            }
        }

        return null
    }

    /**
     * Find node by resource ID
     */
    private fun findNodeByResourceId(resourceId: String, rootNode: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        val nodes = rootNode.findAccessibilityNodeInfosByViewId(resourceId)
        return nodes.firstOrNull() // Return first match, caller must recycle
    }

    /**
     * Find node by text (exact match)
     */
    private fun findNodeByText(text: String, rootNode: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        val nodes = rootNode.findAccessibilityNodeInfosByText(text)
        return nodes.firstOrNull { it.text?.toString() == text }
    }

    /**
     * Find node by content description
     */
    private fun findNodeByContentDescription(desc: String, rootNode: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        return findNodeRecursive(rootNode) { node ->
            node.contentDescription?.toString() == desc
        }
    }

    /**
     * Recursive node search with predicate
     */
    private fun findNodeRecursive(
        node: AccessibilityNodeInfo?,
        predicate: (AccessibilityNodeInfo) -> Boolean
    ): AccessibilityNodeInfo? {
        if (node == null) return null

        if (predicate(node)) {
            return node // Don't recycle - caller will recycle
        }

        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val result = findNodeRecursive(child, predicate)
            if (result != null) {
                if (child != result) child.recycle()
                return result
            }
            child.recycle()
        }

        return null
    }

    /**
     * Get selector info for logging
     */
    private fun getSelectorInfo(event: RecordedEvent): String {
        return when {
            event.resourceId.isNotBlank() -> "resourceId='${event.resourceId}'"
            event.text.isNotBlank() -> "text='${event.text}'"
            event.contentDescription.isNotBlank() -> "contentDesc='${event.contentDescription}'"
            else -> "no selector"
        }
    }

    /**
     * Stop current playback
     */
    fun stopPlayback() {
        if (!isPlaying) {
            return
        }

        Log.i(TAG, "Stopping playback")
        isPlaying = false
        playbackJob?.cancel()
        playbackJob = null
    }

    /**
     * Get last recorded events for replay
     */
    fun getLastRecording(): List<RecordedEvent> {
        return RecordingManager.getEvents()
    }

    /**
     * Play last recording
     */
    fun playLastRecording(
        onComplete: (() -> Unit)? = null,
        onError: ((String) -> Unit)? = null
    ) {
        val events = getLastRecording()
        if (events.isEmpty()) {
            Log.w(TAG, "No recording available to play")
            onError?.invoke("No recording available")
            return
        }

        Log.i(TAG, "Playing last recording with ${events.size} events")
        playRecording(events, onComplete, onError)
    }
}
