package com.agent.portal.accessibility

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.accessibilityservice.GestureDescription
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Path
import android.graphics.Rect
import android.os.Build
import android.util.Log
import android.view.Display
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.view.accessibility.AccessibilityWindowInfo
import com.agent.portal.recording.EventCapture
import com.agent.portal.recording.RecordingManager
import com.agent.portal.server.HttpServerService
import com.agent.portal.utils.A11yNode
import com.agent.portal.utils.PhoneState
import kotlinx.coroutines.*
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * Accessibility Service for capturing UI tree and phone state
 */
class PortalAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "PortalA11yService"

        @Volatile
        var instance: PortalAccessibilityService? = null
            private set

        fun isRunning(): Boolean = instance != null
    }

    private var nodeIndex = 0
    private val screenshotExecutor = Executors.newSingleThreadExecutor()

    override fun onCreate() {
        super.onCreate()
        instance = this
        Log.i(TAG, "Accessibility Service created")
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this

        // Configure service
        serviceInfo = serviceInfo.apply {
            eventTypes = AccessibilityEvent.TYPES_ALL_MASK
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = flags or
                    AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                    AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS or
                    AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
            notificationTimeout = 100
        }

        Log.i(TAG, "Accessibility Service connected")

        // Start HTTP server
        startService(Intent(this, HttpServerService::class.java))
    }

    // ========================================================================
    // EVENT RECORDING - Capture user interactions for workflow generation
    // ========================================================================

    /**
     * Recording state - when true, events are captured and sent to listeners
     */
    @Volatile
    var isRecording: Boolean = false
        private set

    /**
     * List of captured events during recording session
     */
    private val capturedEvents = mutableListOf<CapturedEvent>()
    private val eventLock = Any()

    /**
     * Listeners for captured events
     */
    private val eventListeners = mutableListOf<(CapturedEvent) -> Unit>()

    /**
     * Data class representing a captured user interaction event
     */
    data class CapturedEvent(
        val eventType: String,
        val timestamp: Long,
        val packageName: String,
        val className: String,
        val text: String,
        val contentDescription: String,
        val resourceId: String,
        val bounds: String,
        val isClickable: Boolean,
        val isEditable: Boolean,
        val isScrollable: Boolean,
        val inputText: String = "",
        val additionalData: Map<String, Any> = emptyMap()
    )

    /**
     * Start recording user interactions
     */
    fun startRecording() {
        synchronized(eventLock) {
            capturedEvents.clear()
            isRecording = true
        }
        Log.i(TAG, "Recording started")
    }

    /**
     * Stop recording and return captured events
     */
    fun stopRecording(): List<CapturedEvent> {
        val events: List<CapturedEvent>
        synchronized(eventLock) {
            isRecording = false
            events = capturedEvents.toList()
        }
        Log.i(TAG, "Recording stopped. Captured ${events.size} events")
        return events
    }

    /**
     * Get currently captured events (without stopping recording)
     */
    fun getCapturedEvents(): List<CapturedEvent> {
        synchronized(eventLock) {
            return capturedEvents.toList()
        }
    }

    /**
     * Add listener for real-time event notifications
     */
    fun addEventListener(listener: (CapturedEvent) -> Unit) {
        synchronized(eventLock) {
            eventListeners.add(listener)
        }
    }

    /**
     * Remove event listener
     */
    fun removeEventListener(listener: (CapturedEvent) -> Unit) {
        synchronized(eventLock) {
            eventListeners.remove(listener)
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        // Only process events when RecordingManager is actively recording
        if (!RecordingManager.isActivelyRecording()) return

        // Use EventCapture to process the event and add to RecordingManager
        val recordedEvent = EventCapture.captureEvent(event)
        if (recordedEvent != null) {
            RecordingManager.addEvent(recordedEvent)
            Log.d(TAG, "Captured event: ${recordedEvent.eventType} - ${recordedEvent.resourceId.ifEmpty { recordedEvent.text.take(20) }}")
        }
    }

    /**
     * Handle TYPE_VIEW_CLICKED events - user taps on UI elements
     */
    private fun handleViewClickedEvent(event: AccessibilityEvent) {
        val node = event.source
        try {
            val capturedEvent = if (node != null) {
                val rect = Rect()
                node.getBoundsInScreen(rect)

                CapturedEvent(
                    eventType = "tap",
                    timestamp = System.currentTimeMillis(),
                    packageName = event.packageName?.toString() ?: "",
                    className = node.className?.toString() ?: "",
                    text = node.text?.toString() ?: event.text?.joinToString(" ") ?: "",
                    contentDescription = node.contentDescription?.toString() ?: "",
                    resourceId = node.viewIdResourceName ?: "",
                    bounds = "${rect.left},${rect.top},${rect.right},${rect.bottom}",
                    isClickable = node.isClickable,
                    isEditable = node.isEditable,
                    isScrollable = node.isScrollable
                )
            } else {
                // Fallback when source node is null
                CapturedEvent(
                    eventType = "tap",
                    timestamp = System.currentTimeMillis(),
                    packageName = event.packageName?.toString() ?: "",
                    className = event.className?.toString() ?: "",
                    text = event.text?.joinToString(" ") ?: "",
                    contentDescription = event.contentDescription?.toString() ?: "",
                    resourceId = "",
                    bounds = "",
                    isClickable = true,
                    isEditable = false,
                    isScrollable = false
                )
            }

            addCapturedEvent(capturedEvent)
            Log.d(TAG, "Captured tap event: ${capturedEvent.resourceId.ifEmpty { capturedEvent.text.take(20) }}")

        } finally {
            node?.recycle()
        }
    }

    /**
     * Handle TYPE_VIEW_TEXT_CHANGED events - user text input
     */
    private fun handleTextChangedEvent(event: AccessibilityEvent) {
        val node = event.source
        try {
            val inputText = event.text?.joinToString("") ?: ""

            // Skip empty text changes
            if (inputText.isEmpty()) return

            val capturedEvent = if (node != null) {
                val rect = Rect()
                node.getBoundsInScreen(rect)

                CapturedEvent(
                    eventType = "input_text",
                    timestamp = System.currentTimeMillis(),
                    packageName = event.packageName?.toString() ?: "",
                    className = node.className?.toString() ?: "",
                    text = node.text?.toString() ?: "",
                    contentDescription = node.contentDescription?.toString() ?: "",
                    resourceId = node.viewIdResourceName ?: "",
                    bounds = "${rect.left},${rect.top},${rect.right},${rect.bottom}",
                    isClickable = node.isClickable,
                    isEditable = node.isEditable,
                    isScrollable = node.isScrollable,
                    inputText = inputText,
                    additionalData = mapOf(
                        "fromIndex" to (event.fromIndex),
                        "addedCount" to (event.addedCount),
                        "removedCount" to (event.removedCount)
                    )
                )
            } else {
                CapturedEvent(
                    eventType = "input_text",
                    timestamp = System.currentTimeMillis(),
                    packageName = event.packageName?.toString() ?: "",
                    className = event.className?.toString() ?: "",
                    text = "",
                    contentDescription = event.contentDescription?.toString() ?: "",
                    resourceId = "",
                    bounds = "",
                    isClickable = false,
                    isEditable = true,
                    isScrollable = false,
                    inputText = inputText
                )
            }

            addCapturedEvent(capturedEvent)
            Log.d(TAG, "Captured text input event: ${inputText.take(20)}...")

        } finally {
            node?.recycle()
        }
    }

    /**
     * Handle TYPE_GESTURE_DETECTION_START events - gesture interactions
     */
    private fun handleGestureDetectionEvent(event: AccessibilityEvent) {
        val capturedEvent = CapturedEvent(
            eventType = "gesture_start",
            timestamp = System.currentTimeMillis(),
            packageName = event.packageName?.toString() ?: "",
            className = event.className?.toString() ?: "",
            text = event.text?.joinToString(" ") ?: "",
            contentDescription = event.contentDescription?.toString() ?: "",
            resourceId = "",
            bounds = "",
            isClickable = false,
            isEditable = false,
            isScrollable = false,
            additionalData = mapOf(
                "gestureId" to event.gestureId
            )
        )

        addCapturedEvent(capturedEvent)
        Log.d(TAG, "Captured gesture detection start event")
    }

    /**
     * Add event to the captured list and notify listeners
     */
    private fun addCapturedEvent(event: CapturedEvent) {
        val listeners: List<(CapturedEvent) -> Unit>
        synchronized(eventLock) {
            capturedEvents.add(event)
            listeners = eventListeners.toList()
        }

        // Notify listeners outside of the synchronized block to prevent deadlocks
        listeners.forEach { listener ->
            try {
                listener(event)
            } catch (e: Exception) {
                Log.e(TAG, "Error notifying event listener", e)
            }
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "Accessibility Service interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        screenshotExecutor.shutdown()
        Log.i(TAG, "Accessibility Service destroyed")
    }

    /**
     * Get the full accessibility tree
     */
    fun getA11yTree(): List<A11yNode> {
        nodeIndex = 0
        val nodes = mutableListOf<A11yNode>()

        try {
            // Get all windows
            val windows = windows
            if (windows.isNullOrEmpty()) {
                // Fallback to root node
                val rootNode = rootInActiveWindow
                rootNode?.let {
                    nodes.addAll(parseNodeRecursive(it))
                    it.recycle()
                }
            } else {
                // Parse all windows (sorted by layer)
                windows
                    .filter { it.type == AccessibilityWindowInfo.TYPE_APPLICATION }
                    .sortedByDescending { it.layer }
                    .forEach { window ->
                        window.root?.let { rootNode ->
                            nodes.addAll(parseNodeRecursive(rootNode))
                            rootNode.recycle()
                        }
                    }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error getting a11y tree", e)
        }

        return nodes
    }

    /**
     * Parse accessibility node recursively
     */
    private fun parseNodeRecursive(node: AccessibilityNodeInfo): List<A11yNode> {
        val nodes = mutableListOf<A11yNode>()

        try {
            // Get node bounds
            val rect = Rect()
            node.getBoundsInScreen(rect)

            // Skip nodes with invalid bounds
            if (rect.width() <= 0 || rect.height() <= 0) {
                // Still process children
                for (i in 0 until node.childCount) {
                    node.getChild(i)?.let { child ->
                        nodes.addAll(parseNodeRecursive(child))
                        child.recycle()
                    }
                }
                return nodes
            }

            // Create node data
            val a11yNode = A11yNode(
                index = nodeIndex++,
                text = node.text?.toString() ?: "",
                className = node.className?.toString() ?: "",
                bounds = "${rect.left},${rect.top},${rect.right},${rect.bottom}",
                clickable = node.isClickable,
                focusable = node.isFocusable,
                focused = node.isFocused,
                scrollable = node.isScrollable,
                longClickable = node.isLongClickable,
                editable = node.isEditable,
                contentDescription = node.contentDescription?.toString() ?: "",
                resourceId = node.viewIdResourceName ?: "",
                children = mutableListOf()
            )

            // Parse children
            for (i in 0 until node.childCount) {
                node.getChild(i)?.let { child ->
                    a11yNode.children.addAll(parseNodeRecursive(child))
                    child.recycle()
                }
            }

            nodes.add(a11yNode)

        } catch (e: Exception) {
            Log.e(TAG, "Error parsing node", e)
        }

        return nodes
    }

    /**
     * Get current phone state
     */
    fun getPhoneState(): PhoneState {
        try {
            val windowManager = getSystemService(WINDOW_SERVICE) as android.view.WindowManager
            val display = windowManager.defaultDisplay
            val metrics = android.util.DisplayMetrics()
            display.getRealMetrics(metrics)

            // Get current package and activity
            var currentPackage = ""
            var currentActivity = ""

            windows?.firstOrNull {
                it.type == AccessibilityWindowInfo.TYPE_APPLICATION
            }?.root?.let { root ->
                currentPackage = root.packageName?.toString() ?: ""
                // Try to get activity from window title
                currentActivity = root.className?.toString() ?: ""
                root.recycle()
            }

            val orientation = if (metrics.widthPixels < metrics.heightPixels) "portrait" else "landscape"

            return PhoneState(
                currentApp = currentPackage,
                currentActivity = currentActivity,
                screenWidth = metrics.widthPixels,
                screenHeight = metrics.heightPixels,
                isScreenOn = true,  // Accessibility service only runs when screen is on
                orientation = orientation
            )

        } catch (e: Exception) {
            Log.e(TAG, "Error getting phone state", e)
            return PhoneState()
        }
    }

    /**
     * Take screenshot using accessibility service
     */
    fun takeScreenshot(callback: (Bitmap?) -> Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            takeScreenshot(
                Display.DEFAULT_DISPLAY,
                screenshotExecutor,
                object : TakeScreenshotCallback {
                    override fun onSuccess(screenshot: ScreenshotResult) {
                        val bitmap = Bitmap.wrapHardwareBuffer(
                            screenshot.hardwareBuffer,
                            screenshot.colorSpace
                        )
                        screenshot.hardwareBuffer.close()
                        callback(bitmap)
                    }

                    override fun onFailure(errorCode: Int) {
                        Log.e(TAG, "Screenshot failed with error: $errorCode")
                        callback(null)
                    }
                }
            )
        } else {
            callback(null)
        }
    }

    // ========================================================================
    // NODE ACTIONS - Execute actions on specific accessibility nodes
    // ========================================================================

    /**
     * Find node by index from the current accessibility tree
     */
    fun findNodeByIndex(targetIndex: Int): AccessibilityNodeInfo? {
        var currentIndex = 0

        fun searchNode(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
            val rect = Rect()
            node.getBoundsInScreen(rect)

            // Skip nodes with invalid bounds
            if (rect.width() > 0 && rect.height() > 0) {
                if (currentIndex == targetIndex) {
                    return node
                }
                currentIndex++
            }

            // Search children
            for (i in 0 until node.childCount) {
                node.getChild(i)?.let { child ->
                    val found = searchNode(child)
                    if (found != null) {
                        return found
                    }
                    if (found == null) {
                        child.recycle()
                    }
                }
            }
            return null
        }

        // Search in all windows
        val windows = windows
        if (windows.isNullOrEmpty()) {
            rootInActiveWindow?.let { root ->
                val result = searchNode(root)
                if (result == null) root.recycle()
                return result
            }
        } else {
            windows
                .filter { it.type == AccessibilityWindowInfo.TYPE_APPLICATION }
                .sortedByDescending { it.layer }
                .forEach { window ->
                    window.root?.let { rootNode ->
                        val result = searchNode(rootNode)
                        if (result != null) {
                            return result
                        }
                        rootNode.recycle()
                    }
                }
        }
        return null
    }

    /**
     * Click on a node by its index
     */
    fun clickByIndex(index: Int): ActionResult {
        val node = findNodeByIndex(index)
            ?: return ActionResult(false, "Node with index $index not found")

        return try {
            // Try to click the node itself
            if (node.isClickable) {
                val success = node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                if (success) {
                    ActionResult(true, "Clicked node at index $index")
                } else {
                    ActionResult(false, "Failed to click node at index $index")
                }
            } else {
                // Try to find a clickable parent
                var parent = node.parent
                while (parent != null) {
                    if (parent.isClickable) {
                        val success = parent.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                        parent.recycle()
                        return if (success) {
                            ActionResult(true, "Clicked parent of node at index $index")
                        } else {
                            ActionResult(false, "Failed to click parent of node at index $index")
                        }
                    }
                    val nextParent = parent.parent
                    parent.recycle()
                    parent = nextParent
                }
                ActionResult(false, "Node at index $index is not clickable and has no clickable parent")
            }
        } finally {
            node.recycle()
        }
    }

    /**
     * Long click on a node by its index
     */
    fun longClickByIndex(index: Int): ActionResult {
        val node = findNodeByIndex(index)
            ?: return ActionResult(false, "Node with index $index not found")

        return try {
            if (node.isLongClickable) {
                val success = node.performAction(AccessibilityNodeInfo.ACTION_LONG_CLICK)
                if (success) {
                    ActionResult(true, "Long clicked node at index $index")
                } else {
                    ActionResult(false, "Failed to long click node at index $index")
                }
            } else {
                ActionResult(false, "Node at index $index is not long clickable")
            }
        } finally {
            node.recycle()
        }
    }

    /**
     * Set text on a node (EditText) by its index
     */
    fun setTextByIndex(index: Int, text: String): ActionResult {
        val node = findNodeByIndex(index)
            ?: return ActionResult(false, "Node with index $index not found")

        return try {
            if (node.isEditable) {
                // First focus the node
                node.performAction(AccessibilityNodeInfo.ACTION_FOCUS)

                // Clear existing text
                node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, android.os.Bundle().apply {
                    putInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_START_INT, 0)
                    putInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_END_INT, Int.MAX_VALUE)
                })

                // Set new text
                val arguments = android.os.Bundle()
                arguments.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text)
                val success = node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments)

                if (success) {
                    ActionResult(true, "Set text on node at index $index")
                } else {
                    ActionResult(false, "Failed to set text on node at index $index")
                }
            } else {
                ActionResult(false, "Node at index $index is not editable")
            }
        } finally {
            node.recycle()
        }
    }

    /**
     * Scroll a node by its index
     * @param direction: "forward" (down/right) or "backward" (up/left)
     */
    fun scrollByIndex(index: Int, direction: String): ActionResult {
        val node = findNodeByIndex(index)
            ?: return ActionResult(false, "Node with index $index not found")

        return try {
            if (node.isScrollable) {
                val action = if (direction == "forward" || direction == "down" || direction == "right") {
                    AccessibilityNodeInfo.ACTION_SCROLL_FORWARD
                } else {
                    AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD
                }
                val success = node.performAction(action)
                if (success) {
                    ActionResult(true, "Scrolled node at index $index $direction")
                } else {
                    ActionResult(false, "Failed to scroll node at index $index")
                }
            } else {
                // Try to find a scrollable parent
                var parent = node.parent
                while (parent != null) {
                    if (parent.isScrollable) {
                        val action = if (direction == "forward" || direction == "down" || direction == "right") {
                            AccessibilityNodeInfo.ACTION_SCROLL_FORWARD
                        } else {
                            AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD
                        }
                        val success = parent.performAction(action)
                        parent.recycle()
                        return if (success) {
                            ActionResult(true, "Scrolled parent of node at index $index $direction")
                        } else {
                            ActionResult(false, "Failed to scroll parent of node at index $index")
                        }
                    }
                    val nextParent = parent.parent
                    parent.recycle()
                    parent = nextParent
                }
                ActionResult(false, "Node at index $index is not scrollable and has no scrollable parent")
            }
        } finally {
            node.recycle()
        }
    }

    /**
     * Focus on a node by its index
     */
    fun focusByIndex(index: Int): ActionResult {
        val node = findNodeByIndex(index)
            ?: return ActionResult(false, "Node with index $index not found")

        return try {
            if (node.isFocusable) {
                val success = node.performAction(AccessibilityNodeInfo.ACTION_FOCUS)
                if (success) {
                    ActionResult(true, "Focused node at index $index")
                } else {
                    ActionResult(false, "Failed to focus node at index $index")
                }
            } else {
                ActionResult(false, "Node at index $index is not focusable")
            }
        } finally {
            node.recycle()
        }
    }

    /**
     * Get node info by index (for debugging)
     */
    fun getNodeInfo(index: Int): Map<String, Any>? {
        val node = findNodeByIndex(index) ?: return null

        return try {
            val rect = Rect()
            node.getBoundsInScreen(rect)

            mapOf(
                "index" to index,
                "text" to (node.text?.toString() ?: ""),
                "className" to (node.className?.toString() ?: ""),
                "bounds" to "${rect.left},${rect.top},${rect.right},${rect.bottom}",
                "clickable" to node.isClickable,
                "focusable" to node.isFocusable,
                "focused" to node.isFocused,
                "scrollable" to node.isScrollable,
                "editable" to node.isEditable,
                "contentDescription" to (node.contentDescription?.toString() ?: ""),
                "resourceId" to (node.viewIdResourceName ?: "")
            )
        } finally {
            node.recycle()
        }
    }

    /**
     * Result of an action
     */
    data class ActionResult(
        val success: Boolean,
        val message: String
    )

    // ========================================================================
    // GESTURE ACTIONS - Coordinate-based gestures via dispatchGesture
    // ========================================================================

    /**
     * Tap at specific coordinates using dispatchGesture
     * Requires Android 7.0+ (API 24)
     */
    fun tapAtCoordinates(x: Int, y: Int): ActionResult {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            return ActionResult(false, "Gesture API requires Android 7.0+")
        }

        val path = Path()
        path.moveTo(x.toFloat(), y.toFloat())

        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 100))
            .build()

        val latch = CountDownLatch(1)
        var success = false

        dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                success = true
                latch.countDown()
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                success = false
                latch.countDown()
            }
        }, null)

        latch.await(2, TimeUnit.SECONDS)

        return if (success) {
            ActionResult(true, "Tapped at ($x, $y)")
        } else {
            ActionResult(false, "Failed to tap at ($x, $y)")
        }
    }

    /**
     * Swipe gesture from start to end coordinates
     * Requires Android 7.0+ (API 24)
     */
    fun swipeGesture(startX: Int, startY: Int, endX: Int, endY: Int, durationMs: Long = 300): ActionResult {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            return ActionResult(false, "Gesture API requires Android 7.0+")
        }

        val path = Path()
        path.moveTo(startX.toFloat(), startY.toFloat())
        path.lineTo(endX.toFloat(), endY.toFloat())

        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, durationMs))
            .build()

        val latch = CountDownLatch(1)
        var success = false

        dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                success = true
                latch.countDown()
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                success = false
                latch.countDown()
            }
        }, null)

        latch.await(durationMs + 2000, TimeUnit.MILLISECONDS)

        return if (success) {
            ActionResult(true, "Swiped from ($startX, $startY) to ($endX, $endY)")
        } else {
            ActionResult(false, "Failed to swipe from ($startX, $startY) to ($endX, $endY)")
        }
    }

    /**
     * Drag gesture (same as swipe but typically longer duration)
     * Requires Android 7.0+ (API 24)
     */
    fun dragGesture(startX: Int, startY: Int, endX: Int, endY: Int, durationMs: Long = 500): ActionResult {
        return swipeGesture(startX, startY, endX, endY, durationMs)
    }

    /**
     * Long press at coordinates
     * Requires Android 7.0+ (API 24)
     */
    fun longPressAtCoordinates(x: Int, y: Int, durationMs: Long = 1000): ActionResult {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            return ActionResult(false, "Gesture API requires Android 7.0+")
        }

        val path = Path()
        path.moveTo(x.toFloat(), y.toFloat())

        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, durationMs))
            .build()

        val latch = CountDownLatch(1)
        var success = false

        dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                success = true
                latch.countDown()
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                success = false
                latch.countDown()
            }
        }, null)

        latch.await(durationMs + 2000, TimeUnit.MILLISECONDS)

        return if (success) {
            ActionResult(true, "Long pressed at ($x, $y)")
        } else {
            ActionResult(false, "Failed to long press at ($x, $y)")
        }
    }

    // ========================================================================
    // APP MANAGEMENT - Launch apps via Intent
    // ========================================================================

    /**
     * Start an app by package name
     */
    fun startApp(packageName: String, activityName: String? = null): ActionResult {
        return try {
            val intent = if (activityName != null) {
                Intent().apply {
                    component = ComponentName(packageName, activityName)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
            } else {
                // Get launch intent for package
                packageManager.getLaunchIntentForPackage(packageName)?.apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
            }

            if (intent != null) {
                startActivity(intent)
                ActionResult(true, "Started app: $packageName")
            } else {
                ActionResult(false, "Could not find launch intent for: $packageName")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start app: $packageName", e)
            ActionResult(false, "Failed to start app: ${e.message}")
        }
    }

    /**
     * Get list of installed packages
     */
    fun getInstalledPackages(includeSystem: Boolean = false): List<String> {
        return try {
            val flags = if (includeSystem) 0 else PackageManager.GET_META_DATA
            packageManager.getInstalledPackages(flags)
                .filter { includeSystem || (it.applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) == 0 }
                .map { it.packageName }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get installed packages", e)
            emptyList()
        }
    }

    /**
     * Press a key via global action (limited support)
     */
    fun pressKey(keyAction: String): ActionResult {
        val actionCode = when (keyAction.lowercase()) {
            "back" -> GLOBAL_ACTION_BACK
            "home" -> GLOBAL_ACTION_HOME
            "recents" -> GLOBAL_ACTION_RECENTS
            "notifications" -> GLOBAL_ACTION_NOTIFICATIONS
            "quick_settings" -> GLOBAL_ACTION_QUICK_SETTINGS
            "power_dialog" -> GLOBAL_ACTION_POWER_DIALOG
            "lock_screen" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) GLOBAL_ACTION_LOCK_SCREEN else -1
            "take_screenshot" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) GLOBAL_ACTION_TAKE_SCREENSHOT else -1
            else -> -1
        }

        return if (actionCode != -1) {
            val success = performGlobalAction(actionCode)
            if (success) {
                ActionResult(true, "Pressed key: $keyAction")
            } else {
                ActionResult(false, "Failed to press key: $keyAction")
            }
        } else {
            ActionResult(false, "Unknown key action: $keyAction. Supported: back, home, recents, notifications, quick_settings, power_dialog, lock_screen, take_screenshot")
        }
    }
}
