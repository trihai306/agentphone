package com.agent.portal.recording

import org.junit.Before
import org.junit.Test
import org.junit.Assert.*

/**
 * Unit tests for RecordingManager.
 *
 * These tests verify:
 * - Thread-safe recording state management
 * - Event buffering and sequence numbering
 * - Memory constraints (MAX_BUFFER_SIZE)
 * - High-volume event processing without memory leaks
 */
class RecordingManagerTest {

    @Before
    fun setUp() {
        // Ensure clean state before each test
        RecordingManager.stopRecording()
        RecordingManager.clearEvents()
    }

    @Test
    fun `test start and stop recording`() {
        // Initially should be IDLE
        assertEquals(RecordingManager.RecordingState.IDLE, RecordingManager.getState())

        // Start recording
        val result = RecordingManager.startRecording()
        assertTrue(result.success)
        assertEquals(RecordingManager.RecordingState.RECORDING, RecordingManager.getState())
        assertTrue(RecordingManager.isActivelyRecording())

        // Stop recording
        val stopResult = RecordingManager.stopRecording()
        assertTrue(stopResult.success)
        assertEquals(RecordingManager.RecordingState.IDLE, RecordingManager.getState())
        assertFalse(RecordingManager.isActivelyRecording())
    }

    @Test
    fun `test pause and resume recording`() {
        RecordingManager.startRecording()

        // Pause
        val paused = RecordingManager.pauseRecording()
        assertTrue(paused)
        assertEquals(RecordingManager.RecordingState.PAUSED, RecordingManager.getState())
        assertFalse(RecordingManager.isActivelyRecording())

        // Resume
        val resumed = RecordingManager.resumeRecording()
        assertTrue(resumed)
        assertEquals(RecordingManager.RecordingState.RECORDING, RecordingManager.getState())
        assertTrue(RecordingManager.isActivelyRecording())

        RecordingManager.stopRecording()
    }

    @Test
    fun `test add event during recording`() {
        RecordingManager.startRecording()

        val event = createTestEvent("tap", "com.test:id/button")
        val added = RecordingManager.addEvent(event)

        assertTrue(added)
        assertEquals(1, RecordingManager.getEventCount())

        val events = RecordingManager.getEvents()
        assertEquals(1, events.size)
        assertEquals("tap", events[0].eventType)

        RecordingManager.stopRecording()
    }

    @Test
    fun `test events not added when not recording`() {
        val event = createTestEvent("tap", "com.test:id/button")
        val added = RecordingManager.addEvent(event)

        assertFalse(added)
        assertEquals(0, RecordingManager.getEventCount())
    }

    @Test
    fun `test events not added when paused`() {
        RecordingManager.startRecording()
        RecordingManager.pauseRecording()

        val event = createTestEvent("tap", "com.test:id/button")
        val added = RecordingManager.addEvent(event)

        assertFalse(added)
        assertEquals(0, RecordingManager.getEventCount())

        RecordingManager.stopRecording()
    }

    @Test
    fun `test event sequence numbering`() {
        RecordingManager.startRecording()

        for (i in 1..5) {
            val event = createTestEvent("tap", "com.test:id/button_$i")
            RecordingManager.addEvent(event)
        }

        val events = RecordingManager.getEvents()
        assertEquals(5, events.size)

        // Verify sequence numbers are consecutive
        for (i in 0..4) {
            assertEquals((i + 1).toLong(), events[i].sequenceNumber)
        }

        RecordingManager.stopRecording()
    }

    @Test
    fun `test relative timestamps are calculated`() {
        RecordingManager.startRecording()

        Thread.sleep(10) // Small delay

        val event = createTestEvent("tap", "com.test:id/button")
        RecordingManager.addEvent(event)

        val events = RecordingManager.getEvents()
        assertTrue(events[0].relativeTimestamp > 0)

        RecordingManager.stopRecording()
    }

    @Test
    fun `test clear events`() {
        RecordingManager.startRecording()

        for (i in 1..10) {
            val event = createTestEvent("tap", "com.test:id/button_$i")
            RecordingManager.addEvent(event)
        }

        assertEquals(10, RecordingManager.getEventCount())

        RecordingManager.clearEvents()

        assertEquals(0, RecordingManager.getEventCount())

        RecordingManager.stopRecording()
    }

    @Test
    fun `test status reporting`() {
        val status1 = RecordingManager.getStatus()
        assertEquals("idle", status1.state)
        assertEquals(0, status1.eventCount)
        assertNull(status1.startTime)
        assertNull(status1.durationMs)

        RecordingManager.startRecording()

        val event = createTestEvent("tap", "com.test:id/button")
        RecordingManager.addEvent(event)

        val status2 = RecordingManager.getStatus()
        assertEquals("recording", status2.state)
        assertEquals(1, status2.eventCount)
        assertNotNull(status2.startTime)
        assertNotNull(status2.durationMs)
        assertNotNull(status2.recordingId)

        RecordingManager.stopRecording()
    }

    @Test
    fun `test high volume event processing - memory leak verification`() {
        // This test simulates 100+ recording/replay cycles to verify
        // no memory leaks occur (buffer stays bounded)

        for (cycle in 1..100) {
            // Start recording
            RecordingManager.startRecording()

            // Add several events per cycle
            for (i in 1..10) {
                val event = createTestEvent(
                    eventType = "tap",
                    resourceId = "com.test:id/button_${cycle}_$i",
                    text = "Button $i in cycle $cycle"
                )
                RecordingManager.addEvent(event)
            }

            // Verify events were added
            assertEquals(10, RecordingManager.getEventCount())

            // Stop and clear (simulating workflow save)
            RecordingManager.stopRecording()

            // Verify buffer is cleared for next cycle
            RecordingManager.clearEvents()
            assertEquals(0, RecordingManager.getEventCount())
        }

        // Final verification - state should be clean
        assertEquals(RecordingManager.RecordingState.IDLE, RecordingManager.getState())
        assertEquals(0, RecordingManager.getEventCount())
    }

    @Test
    fun `test recording cycle stress test - 200 cycles`() {
        // Extended stress test for memory leak detection
        val cycleCount = 200
        val eventsPerCycle = 20

        for (cycle in 1..cycleCount) {
            RecordingManager.startRecording()

            for (i in 1..eventsPerCycle) {
                val event = RecordedEvent(
                    eventType = listOf("tap", "text_input", "scroll", "long_tap").random(),
                    timestamp = System.currentTimeMillis(),
                    packageName = "com.test.app",
                    className = "android.widget.Button",
                    resourceId = "com.test:id/element_$i",
                    text = "Element $i",
                    bounds = "0,0,100,100",
                    isClickable = true,
                    actionData = mapOf("cycle" to cycle, "index" to i)
                )
                RecordingManager.addEvent(event)
            }

            // Verify correct count
            assertEquals(eventsPerCycle, RecordingManager.getEventCount())

            // Stop and retrieve events (like workflow generation would)
            RecordingManager.stopRecording()
            val events = RecordingManager.getEvents()
            assertEquals(eventsPerCycle, events.size)

            // Clear for next cycle
            RecordingManager.clearEvents()
        }

        // Verify clean state after stress test
        assertEquals(RecordingManager.RecordingState.IDLE, RecordingManager.getState())
        assertEquals(0, RecordingManager.getEventCount())
    }

    @Test
    fun `test buffer size limit enforcement`() {
        RecordingManager.startRecording()

        // Try to add more than MAX_BUFFER_SIZE events (1000)
        for (i in 1..1100) {
            val event = createTestEvent("tap", "com.test:id/button_$i")
            RecordingManager.addEvent(event)
        }

        // Should be capped at MAX_BUFFER_SIZE
        assertTrue(RecordingManager.getEventCount() <= 1000)

        RecordingManager.stopRecording()
        RecordingManager.clearEvents()
    }

    @Test
    fun `test JSON serialization of events`() {
        RecordingManager.startRecording()

        val event = RecordedEvent(
            eventType = "tap",
            timestamp = 1234567890L,
            packageName = "com.test.app",
            className = "android.widget.Button",
            resourceId = "com.test:id/login_button",
            contentDescription = "Login",
            text = "Sign In",
            bounds = "10,20,100,80",
            isClickable = true,
            isEditable = false,
            isScrollable = false,
            actionData = mapOf("key" to "value"),
            x = 55,
            y = 50
        )
        RecordingManager.addEvent(event)

        val json = RecordingManager.getEventsAsJson()
        assertNotNull(json)
        assertTrue(json.contains("\"event_type\":\"tap\""))
        assertTrue(json.contains("\"resource_id\":\"com.test:id/login_button\""))
        assertTrue(json.contains("\"is_clickable\":true"))

        RecordingManager.stopRecording()
    }

    /**
     * Helper to create test events
     */
    private fun createTestEvent(
        eventType: String,
        resourceId: String,
        text: String = ""
    ): RecordedEvent {
        return RecordedEvent(
            eventType = eventType,
            timestamp = System.currentTimeMillis(),
            packageName = "com.test.app",
            className = "android.widget.Button",
            resourceId = resourceId,
            text = text,
            bounds = "0,0,100,100",
            isClickable = true
        )
    }
}
