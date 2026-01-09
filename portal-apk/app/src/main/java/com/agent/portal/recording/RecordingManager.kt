package com.agent.portal.recording

import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import java.lang.ref.WeakReference
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong

/**
 * RecordingManager manages recording state and event buffering for workflow capture.
 *
 * This singleton class provides thread-safe access to recording state and captured events,
 * supporting the recording workflow: start → capture events → stop → retrieve events.
 *
 * NEW: Automatic screenshot capture with interaction highlights
 * ENHANCED: RecordingListener callbacks, detailed error handling, metrics tracking
 */
object RecordingManager {

    private const val TAG = "RecordingManager"

    // Recording state
    private val isRecording = AtomicBoolean(false)
    private val isPaused = AtomicBoolean(false)
    private val recordingStartTime = AtomicLong(0)
    private var recordingId: String? = null

    // Target app being recorded
    private var targetAppPackage: String? = null

    // Thread-safe event buffer
    private val eventBuffer = CopyOnWriteArrayList<RecordedEvent>()

    // Event sequence counter for ordering
    private val eventSequence = AtomicLong(0)

    // Maximum buffer size to prevent memory issues
    private const val MAX_BUFFER_SIZE = 1000

    private val gson = Gson()

    // Context reference for screenshot capture
    private var contextRef: WeakReference<Context>? = null

    // Screenshot capture enabled flag
    private var screenshotEnabled = true

    // Auto-upload to Python backend enabled flag
    private var autoUploadEnabled = false

    // Real-time upload enabled flag (upload each event immediately)
    private var realTimeUploadEnabled = false

    // Python backend URL for uploads
    private var pythonBackendUrl: String? = null

    // Recording listeners for UI callbacks
    private val listeners = CopyOnWriteArrayList<RecordingListener>()
    private val mainHandler = Handler(Looper.getMainLooper())

    // Metrics tracking
    private var metricsStartTime = 0L
    private var totalEventsProcessed = 0
    private var screenshotSuccessCount = 0
    private var screenshotFailureCount = 0
    private val eventTypeCountMap = mutableMapOf<String, Int>()

    /**
     * Recording state enum
     */
    enum class RecordingState {
        IDLE,
        RECORDING,
        PAUSED
    }

    /**
     * Recording result with detailed information
     */
    data class RecordingResult(
        val success: Boolean,
        val recordingId: String? = null,
        val message: String = "",
        val eventCount: Int = 0,
        val duration: Long = 0,
        val error: Throwable? = null
    )

    /**
     * Listener interface for recording events
     */
    interface RecordingListener {
        fun onRecordingStarted(recordingId: String, targetApp: String?)
        fun onRecordingStopped(result: RecordingResult)
        fun onRecordingError(error: String, exception: Throwable?)
        fun onEventAdded(event: RecordedEvent, totalCount: Int)
        fun onRecordingPaused(recordingId: String)
        fun onRecordingResumed(recordingId: String)
    }

    /**
     * Initialize with context (call once from Application or MainActivity)
     */
    fun init(context: Context) {
        contextRef = WeakReference(context.applicationContext)
        Log.i(TAG, "RecordingManager initialized")
    }

    /**
     * Add a recording listener
     */
    fun addListener(listener: RecordingListener) {
        if (!listeners.contains(listener)) {
            listeners.add(listener)
            Log.d(TAG, "Listener added: ${listener.javaClass.simpleName}")
        }
    }

    /**
     * Remove a recording listener
     */
    fun removeListener(listener: RecordingListener) {
        listeners.remove(listener)
        Log.d(TAG, "Listener removed: ${listener.javaClass.simpleName}")
    }

    /**
     * Clear all listeners
     */
    fun clearListeners() {
        listeners.clear()
        Log.d(TAG, "All listeners cleared")
    }

    /**
     * Enable/disable real-time upload to Python backend
     * When enabled, each event + screenshot will be sent immediately to backend
     */
    fun setRealTimeUploadEnabled(enabled: Boolean, backendUrl: String? = null) {
        realTimeUploadEnabled = enabled
        if (enabled && backendUrl != null) {
            pythonBackendUrl = backendUrl
            val context = contextRef?.get()
            if (context != null) {
                RealTimeUploader.init(context, backendUrl, enabled = true)
            }
            Log.i(TAG, "Real-time upload enabled to: $backendUrl")
        } else if (!enabled) {
            RealTimeUploader.setEnabled(false)
            Log.i(TAG, "Real-time upload disabled")
        }
    }

    /**
     * Check if real-time upload is enabled
     */
    fun isRealTimeUploadEnabled(): Boolean = realTimeUploadEnabled

    /**
     * Enable/disable screenshot capture during recording
     */
    fun setScreenshotEnabled(enabled: Boolean) {
        screenshotEnabled = enabled
        Log.i(TAG, "Screenshot capture ${if (enabled) "enabled" else "disabled"}")
    }

    /**
     * Check if screenshot capture is enabled
     */
    fun isScreenshotEnabled(): Boolean = screenshotEnabled

    /**
     * Enable/disable auto-upload to Python backend when recording stops
     */
    fun setAutoUploadEnabled(enabled: Boolean, backendUrl: String? = null) {
        autoUploadEnabled = enabled
        if (enabled && backendUrl != null) {
            pythonBackendUrl = backendUrl
            EventUploader.setBackendUrl(backendUrl)
            Log.i(TAG, "Auto-upload enabled to: $backendUrl")
        } else if (!enabled) {
            Log.i(TAG, "Auto-upload disabled")
        }
    }

    /**
     * Check if auto-upload is enabled
     */
    fun isAutoUploadEnabled(): Boolean = autoUploadEnabled

    /**
     * Start a new recording session
     * @param targetAppPackage Optional package name of app to launch (null = go to home)
     * @return RecordingResult with detailed information
     */
    @Synchronized
    fun startRecording(appPackage: String? = null): RecordingResult {
        val startTime = System.currentTimeMillis()
        Log.i(TAG, "[${formatTimestamp()}] === startRecording() called ===")
        Log.i(TAG, "Target app: ${appPackage ?: "manual navigation"}")

        try {
            // Check if already recording
            if (isRecording.get()) {
                val msg = "Recording already in progress: $recordingId"
                Log.w(TAG, msg)
                notifyError(msg, null)
                return RecordingResult(success = false, message = msg)
            }

            // Validate context
            val context = contextRef?.get()
            if (context == null) {
                val msg = "Context not available, cannot start recording"
                Log.e(TAG, msg)
                notifyError(msg, null)
                return RecordingResult(success = false, message = msg)
            }

            // Clear previous recording data
            eventBuffer.clear()
            eventSequence.set(0)
            resetMetrics()

            // Store target app package
            targetAppPackage = appPackage

            // Generate new recording ID
            recordingId = "rec_${System.currentTimeMillis()}"
            recordingStartTime.set(System.currentTimeMillis())
            metricsStartTime = System.currentTimeMillis()

            isRecording.set(true)
            isPaused.set(false)

            // Start touch capture overlay (OPTIMIZED: 1x1 pixel, non-blocking)
            try {
                val intent = Intent(context, TouchCaptureOverlay::class.java).apply {
                    action = TouchCaptureOverlay.ACTION_START_CAPTURE
                }
                context.startService(intent)
                Log.i(TAG, "TouchCaptureOverlay service started (optimized flags)")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start TouchCaptureOverlay", e)
                // Continue anyway, recording can work without overlay
            }

            val duration = System.currentTimeMillis() - startTime
            Log.i(TAG, "[${formatTimestamp()}] Recording started successfully: $recordingId (took ${duration}ms)")
            
            // Notify listeners
            notifyRecordingStarted(recordingId!!, appPackage)

            return RecordingResult(
                success = true,
                recordingId = recordingId,
                message = "Recording started successfully",
                duration = duration
            )
        } catch (e: Exception) {
            Log.e(TAG, "Exception in startRecording", e)
            notifyError("Failed to start recording: ${e.message}", e)
            return RecordingResult(
                success = false,
                message = "Exception: ${e.message}",
                error = e
            )
        }
    }

    /**
     * Stop the current recording session
     * @return RecordingResult with detailed information
     */
    @Synchronized
    fun stopRecording(): RecordingResult {
        val stopTime = System.currentTimeMillis()
        Log.i(TAG, "[${formatTimestamp()}] === stopRecording() called ===")
        Log.i(TAG, "Current isRecording: ${isRecording.get()}")
        Log.i(TAG, "Current isPaused: ${isPaused.get()}")
        Log.i(TAG, "Current event count: ${eventBuffer.size}")

        try {
            if (!isRecording.get()) {
                val msg = "No recording in progress"
                Log.w(TAG, msg)
                return RecordingResult(success = false, message = msg)
            }

            val currentRecordingId = recordingId ?: "unknown"
            val duration = stopTime - recordingStartTime.get()

            Log.i(TAG, "Setting isRecording = false...")
            isRecording.set(false)
            isPaused.set(false)

            // Flush any pending scroll event before stopping
            try {
                val pendingScroll = EventCapture.flushPendingScroll(targetAppPackage ?: "")
                if (pendingScroll != null) {
                    eventBuffer.add(pendingScroll.copy(
                        sequenceNumber = eventSequence.incrementAndGet(),
                        relativeTimestamp = System.currentTimeMillis() - recordingStartTime.get()
                    ))
                    Log.i(TAG, "Flushed pending scroll event, now ${eventBuffer.size} events")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error flushing pending scroll", e)
            }

            val eventCount = eventBuffer.size
            Log.i(TAG, "Recording stopped: $currentRecordingId with $eventCount events")
            Log.i(TAG, "Duration: ${duration}ms (${duration / 1000}s)")
            logMetrics()

            // Reset gesture detector to clear state
            try {
                Log.i(TAG, "Resetting EventCapture gesture detector...")
                EventCapture.resetGestureDetector()
            } catch (e: Exception) {
                Log.e(TAG, "Error resetting gesture detector", e)
            }

            // Stop touch capture overlay
            val context = contextRef?.get()
            if (context != null) {
                try {
                    val intent = Intent(context, TouchCaptureOverlay::class.java).apply {
                        action = TouchCaptureOverlay.ACTION_STOP_CAPTURE
                    }
                    context.startService(intent)
                    Log.i(TAG, "TouchCaptureOverlay service stopped")
                } catch (e: Exception) {
                    Log.e(TAG, "Error stopping TouchCaptureOverlay", e)
                }
            } else {
                Log.w(TAG, "Context not available, TouchCaptureOverlay not stopped")
            }

            // Auto-upload to Python backend if enabled
            if (autoUploadEnabled && eventCount > 0) {
                Log.i(TAG, "Auto-upload enabled, uploading recording...")
                if (context != null) {
                    uploadRecordingAsync(context, currentRecordingId, eventBuffer.toList())
                } else {
                    Log.w(TAG, "Context not available for upload")
                }
            }

            val result = RecordingResult(
                success = true,
                recordingId = currentRecordingId,
                message = "Recording stopped successfully",
                eventCount = eventCount,
                duration = duration
            )

            Log.i(TAG, "[${formatTimestamp()}] === stopRecording() completed successfully ===")
            
            // Notify listeners
            notifyRecordingStopped(result)

            return result
        } catch (e: Exception) {
            Log.e(TAG, "Exception in stopRecording", e)
            val result = RecordingResult(
                success = false,
                message = "Exception: ${e.message}",
                error = e
            )
            notifyRecordingStopped(result)
            return result
        }
    }

    /**
     * Upload recording to Python backend asynchronously
     */
    private fun uploadRecordingAsync(
        context: Context,
        recordingId: String,
        events: List<RecordedEvent>
    ) {
        EventUploader.uploadRecording(
            context = context,
            recordingId = recordingId,
            events = events,
            callback = object : EventUploader.UploadCallback {
                override fun onProgress(current: Int, total: Int) {
                    Log.d(TAG, "Upload progress: $current/$total screenshots")
                }

                override fun onSuccess(recordingId: String, eventCount: Int) {
                    Log.i(TAG, "Upload completed: $recordingId ($eventCount events)")
                    // Broadcast success (MainActivity can listen)
                    context.sendBroadcast(
                        android.content.Intent("com.agent.portal.UPLOAD_COMPLETED").apply {
                            putExtra("recording_id", recordingId)
                            putExtra("event_count", eventCount)
                        }
                    )
                }

                override fun onError(error: String) {
                    Log.e(TAG, "Upload failed: $error")
                    // Broadcast error
                    context.sendBroadcast(
                        android.content.Intent("com.agent.portal.UPLOAD_FAILED").apply {
                            putExtra("recording_id", recordingId)
                            putExtra("error", error)
                        }
                    )
                }
            }
        )
    }

    /**
     * Pause the current recording session
     * Events received while paused are discarded
     * @return true if paused successfully, false if not recording or already paused
     */
    @Synchronized
    fun pauseRecording(): Boolean {
        if (!isRecording.get()) {
            Log.w(TAG, "No recording in progress to pause")
            return false
        }

        if (isPaused.get()) {
            Log.w(TAG, "Recording already paused")
            return false
        }

        isPaused.set(true)
        Log.i(TAG, "[${formatTimestamp()}] Recording paused: $recordingId")
        
        // Notify listeners
        recordingId?.let { notifyRecordingPaused(it) }
        
        return true
    }

    /**
     * Resume a paused recording session
     * @return true if resumed successfully, false if not paused
     */
    @Synchronized
    fun resumeRecording(): Boolean {
        if (!isRecording.get()) {
            Log.w(TAG, "No recording in progress to resume")
            return false
        }

        if (!isPaused.get()) {
            Log.w(TAG, "Recording is not paused")
            return false
        }

        isPaused.set(false)
        Log.i(TAG, "[${formatTimestamp()}] Recording resumed: $recordingId")
        
        // Notify listeners
        recordingId?.let { notifyRecordingResumed(it) }
        
        return true
    }

    /**
     * Get current recording state
     */
    fun getState(): RecordingState {
        return when {
            !isRecording.get() -> RecordingState.IDLE
            isPaused.get() -> RecordingState.PAUSED
            else -> RecordingState.RECORDING
        }
    }

    /**
     * Get the target app package being recorded
     */
    fun getTargetAppPackage(): String? = targetAppPackage

    /**
     * Check if recording is active (and not paused)
     */
    fun isActivelyRecording(): Boolean {
        return isRecording.get() && !isPaused.get()
    }

    /**
     * Add an event to the buffer
     * @param event The recorded event to add
     * @return true if event was added, false if not recording or buffer full
     */
    fun addEvent(event: RecordedEvent): Boolean {
        if (!isActivelyRecording()) {
            return false
        }

        if (eventBuffer.size >= MAX_BUFFER_SIZE) {
            Log.w(TAG, "Event buffer full, discarding event")
            return false
        }

        // Get app name for better display
        val context = contextRef?.get()
        val appName = if (context != null && event.packageName.isNotEmpty()) {
            ScreenshotManager.getAppInfo(context, event.packageName).appName
        } else null

        // Assign sequence number and app name
        val eventWithSequence = event.copy(
            sequenceNumber = eventSequence.incrementAndGet(),
            relativeTimestamp = System.currentTimeMillis() - recordingStartTime.get(),
            appName = appName
        )

        // Add event to buffer first (fast)
        eventBuffer.add(eventWithSequence)
        
        // Update metrics
        totalEventsProcessed++
        eventTypeCountMap[event.eventType] = (eventTypeCountMap[event.eventType] ?: 0) + 1
        
        Log.d(TAG, "Event added: ${event.eventType} (${eventBuffer.size} total)")

        // Notify listeners
        notifyEventAdded(eventWithSequence, eventBuffer.size)

        // Capture screenshot asynchronously (slow, non-blocking)
        if (screenshotEnabled && context != null) {
            captureScreenshotAsync(context, eventWithSequence)
        }

        return true
    }

    /**
     * Capture screenshot asynchronously and update event
     */
    private fun captureScreenshotAsync(context: Context, event: RecordedEvent) {
        ScreenshotManager.captureScreenshotForEvent(context, event) { screenshotPath ->
            if (screenshotPath != null) {
                // Update event with screenshot path
                updateEventScreenshot(event.sequenceNumber, screenshotPath)
                screenshotSuccessCount++
                Log.d(TAG, "Screenshot captured for event #${event.sequenceNumber}")

                // Upload to backend in real-time if enabled
                if (realTimeUploadEnabled && RealTimeUploader.isReady()) {
                    RealTimeUploader.uploadEventRealTime(context, event, screenshotPath)
                    Log.d(TAG, "Real-time upload triggered for event #${event.sequenceNumber}")
                }
            } else {
                screenshotFailureCount++
                Log.w(TAG, "Screenshot capture failed for event #${event.sequenceNumber}")
            }
        }
    }

    /**
     * Update an event's screenshot path
     */
    private fun updateEventScreenshot(sequenceNumber: Long, screenshotPath: String) {
        val index = eventBuffer.indexOfFirst { it.sequenceNumber == sequenceNumber }
        if (index >= 0) {
            val oldEvent = eventBuffer[index]
            eventBuffer[index] = oldEvent.copy(screenshotPath = screenshotPath)
        }
    }

    /**
     * Get all recorded events
     * @return List of recorded events (copy to prevent modification)
     */
    fun getEvents(): List<RecordedEvent> {
        return eventBuffer.toList()
    }

    /**
     * Get events as JSON string
     */
    fun getEventsAsJson(): String {
        return gson.toJson(getEvents())
    }

    /**
     * Get recording status information
     */
    fun getStatus(): RecordingStatus {
        return RecordingStatus(
            state = getState().name.lowercase(),
            recordingId = recordingId,
            eventCount = eventBuffer.size,
            startTime = if (isRecording.get()) recordingStartTime.get() else null,
            durationMs = if (isRecording.get()) System.currentTimeMillis() - recordingStartTime.get() else null
        )
    }

    /**
     * Clear all recorded events without stopping
     * Useful for discarding events during active recording
     */
    fun clearEvents() {
        eventBuffer.clear()
        eventSequence.set(0)
        Log.i(TAG, "Events cleared")
    }

    /**
     * Get event count
     */
    fun getEventCount(): Int {
        return eventBuffer.size
    }

    /**
     * Get unique action type count
     */
    fun getUniqueActionCount(): Int {
        return eventBuffer.map { it.eventType }.distinct().size
    }

    /**
     * Get recording metrics
     */
    fun getMetrics(): RecordingMetrics {
        val duration = if (isRecording.get()) {
            System.currentTimeMillis() - metricsStartTime
        } else 0L
        
        return RecordingMetrics(
            totalEvents = totalEventsProcessed,
            screenshotSuccessCount = screenshotSuccessCount,
            screenshotFailureCount = screenshotFailureCount,
            eventTypeBreakdown = eventTypeCountMap.toMap(),
            durationMs = duration,
            eventsPerSecond = if (duration > 0) (totalEventsProcessed * 1000.0 / duration) else 0.0
        )
    }

    // ========== Private Helper Methods ==========

    private fun resetMetrics() {
        totalEventsProcessed = 0
        screenshotSuccessCount = 0
        screenshotFailureCount = 0
        eventTypeCountMap.clear()
    }

    private fun logMetrics() {
        val metrics = getMetrics()
        Log.i(TAG, "=== Recording Metrics ===")
        Log.i(TAG, "Total events: ${metrics.totalEvents}")
        Log.i(TAG, "Screenshots: ${metrics.screenshotSuccessCount} success, ${metrics.screenshotFailureCount} failed")
        Log.i(TAG, "Duration: ${metrics.durationMs}ms")
        Log.i(TAG, "Events/sec: ${String.format("%.2f", metrics.eventsPerSecond)}")
        Log.i(TAG, "Event types: ${metrics.eventTypeBreakdown}")
        Log.i(TAG, "========================")
    }

    private fun formatTimestamp(): String {
        return java.text.SimpleDateFormat("HH:mm:ss.SSS", java.util.Locale.US)
            .format(java.util.Date())
    }

    private fun notifyRecordingStarted(recordingId: String, targetApp: String?) {
        mainHandler.post {
            listeners.forEach { listener ->
                try {
                    listener.onRecordingStarted(recordingId, targetApp)
                } catch (e: Exception) {
                    Log.e(TAG, "Error notifying listener", e)
                }
            }
        }
    }

    private fun notifyRecordingStopped(result: RecordingResult) {
        mainHandler.post {
            listeners.forEach { listener ->
                try {
                    listener.onRecordingStopped(result)
                } catch (e: Exception) {
                    Log.e(TAG, "Error notifying listener", e)
                }
            }
        }
    }

    private fun notifyError(error: String, exception: Throwable?) {
        mainHandler.post {
            listeners.forEach { listener ->
                try {
                    listener.onRecordingError(error, exception)
                } catch (e: Exception) {
                    Log.e(TAG, "Error notifying listener", e)
                }
            }
        }
    }

    private fun notifyEventAdded(event: RecordedEvent, totalCount: Int) {
        mainHandler.post {
            listeners.forEach { listener ->
                try {
                    listener.onEventAdded(event, totalCount)
                } catch (e: Exception) {
                    Log.e(TAG, "Error notifying listener", e)
                }
            }
        }
    }

    private fun notifyRecordingPaused(recordingId: String) {
        mainHandler.post {
            listeners.forEach { listener ->
                try {
                    listener.onRecordingPaused(recordingId)
                } catch (e: Exception) {
                    Log.e(TAG, "Error notifying listener", e)
                }
            }
        }
    }

    private fun notifyRecordingResumed(recordingId: String) {
        mainHandler.post {
            listeners.forEach { listener ->
                try {
                    listener.onRecordingResumed(recordingId)
                } catch (e: Exception) {
                    Log.e(TAG, "Error notifying listener", e)
                }
            }
        }
    }
}

/**
 * Represents a captured event during recording
 */
data class RecordedEvent(
    @SerializedName("event_type")
    val eventType: String,

    @SerializedName("timestamp")
    val timestamp: Long = System.currentTimeMillis(),

    @SerializedName("sequence_number")
    val sequenceNumber: Long = 0,

    @SerializedName("relative_timestamp")
    val relativeTimestamp: Long = 0,

    @SerializedName("package_name")
    val packageName: String = "",

    @SerializedName("class_name")
    val className: String = "",

    // Element selector information
    @SerializedName("resource_id")
    val resourceId: String = "",

    @SerializedName("content_description")
    val contentDescription: String = "",

    @SerializedName("text")
    val text: String = "",

    @SerializedName("bounds")
    val bounds: String = "",

    // Additional element properties
    @SerializedName("is_clickable")
    val isClickable: Boolean = false,

    @SerializedName("is_editable")
    val isEditable: Boolean = false,

    @SerializedName("is_scrollable")
    val isScrollable: Boolean = false,

    // Action-specific data
    @SerializedName("action_data")
    val actionData: Map<String, Any>? = null,

    // Coordinates for gesture events
    @SerializedName("x")
    val x: Int? = null,

    @SerializedName("y")
    val y: Int? = null,

    // Node index in accessibility tree
    @SerializedName("node_index")
    val nodeIndex: Int? = null,

    // Screenshot captured at interaction time
    @SerializedName("screenshot_path")
    val screenshotPath: String? = null,

    // App name for better display
    @SerializedName("app_name")
    val appName: String? = null
) {
    fun toMap(): Map<String, Any?> {
        return mapOf(
            "event_type" to eventType,
            "timestamp" to timestamp,
            "sequence_number" to sequenceNumber,
            "relative_timestamp" to relativeTimestamp,
            "package_name" to packageName,
            "class_name" to className,
            "resource_id" to resourceId,
            "content_description" to contentDescription,
            "text" to text,
            "bounds" to bounds,
            "is_clickable" to isClickable,
            "is_editable" to isEditable,
            "is_scrollable" to isScrollable,
            "action_data" to actionData,
            "x" to x,
            "y" to y,
            "node_index" to nodeIndex
        )
    }
}

/**
 * Recording status information for API responses
 */
data class RecordingStatus(
    @SerializedName("state")
    val state: String,

    @SerializedName("recording_id")
    val recordingId: String?,

    @SerializedName("event_count")
    val eventCount: Int,

    @SerializedName("start_time")
    val startTime: Long?,

    @SerializedName("duration_ms")
    val durationMs: Long?
) {
    fun toMap(): Map<String, Any?> {
        return mapOf(
            "state" to state,
            "recording_id" to recordingId,
            "event_count" to eventCount,
            "start_time" to startTime,
            "duration_ms" to durationMs
        )
    }
}

/**
 * Recording metrics for performance tracking
 */
data class RecordingMetrics(
    val totalEvents: Int,
    val screenshotSuccessCount: Int,
    val screenshotFailureCount: Int,
    val eventTypeBreakdown: Map<String, Int>,
    val durationMs: Long,
    val eventsPerSecond: Double
)
