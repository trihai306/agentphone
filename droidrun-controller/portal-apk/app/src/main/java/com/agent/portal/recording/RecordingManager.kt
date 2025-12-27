package com.agent.portal.recording

import android.util.Log
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong

/**
 * RecordingManager manages recording state and event buffering for workflow capture.
 *
 * This singleton class provides thread-safe access to recording state and captured events,
 * supporting the recording workflow: start → capture events → stop → retrieve events.
 */
object RecordingManager {

    private const val TAG = "RecordingManager"

    // Recording state
    private val isRecording = AtomicBoolean(false)
    private val isPaused = AtomicBoolean(false)
    private val recordingStartTime = AtomicLong(0)
    private var recordingId: String? = null

    // Thread-safe event buffer
    private val eventBuffer = CopyOnWriteArrayList<RecordedEvent>()

    // Event sequence counter for ordering
    private val eventSequence = AtomicLong(0)

    // Maximum buffer size to prevent memory issues
    private const val MAX_BUFFER_SIZE = 1000

    private val gson = Gson()

    /**
     * Recording state enum
     */
    enum class RecordingState {
        IDLE,
        RECORDING,
        PAUSED
    }

    /**
     * Start a new recording session
     * @return true if recording started successfully, false if already recording
     */
    @Synchronized
    fun startRecording(): Boolean {
        if (isRecording.get()) {
            Log.w(TAG, "Recording already in progress")
            return false
        }

        // Clear previous recording data
        eventBuffer.clear()
        eventSequence.set(0)

        // Generate new recording ID
        recordingId = "rec_${System.currentTimeMillis()}"
        recordingStartTime.set(System.currentTimeMillis())

        isRecording.set(true)
        isPaused.set(false)

        Log.i(TAG, "Recording started: $recordingId")
        return true
    }

    /**
     * Stop the current recording session
     * @return true if recording stopped successfully, false if not recording
     */
    @Synchronized
    fun stopRecording(): Boolean {
        if (!isRecording.get()) {
            Log.w(TAG, "No recording in progress")
            return false
        }

        isRecording.set(false)
        isPaused.set(false)

        Log.i(TAG, "Recording stopped: $recordingId with ${eventBuffer.size} events")
        return true
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
        Log.i(TAG, "Recording paused: $recordingId")
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
        Log.i(TAG, "Recording resumed: $recordingId")
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

        // Assign sequence number
        val eventWithSequence = event.copy(
            sequenceNumber = eventSequence.incrementAndGet(),
            relativeTimestamp = System.currentTimeMillis() - recordingStartTime.get()
        )

        eventBuffer.add(eventWithSequence)
        Log.d(TAG, "Event added: ${event.eventType} (${eventBuffer.size} total)")
        return true
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
    val nodeIndex: Int? = null
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
