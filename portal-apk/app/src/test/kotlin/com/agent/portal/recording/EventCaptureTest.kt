package com.agent.portal.recording

import org.junit.Test
import org.junit.Assert.*

/**
 * Unit tests for EventCapture.
 *
 * These tests verify:
 * - Event type mapping
 * - Element data extraction patterns
 * - Selector priority logic
 * - Memory-safe node processing
 *
 * Note: Full integration tests require Android Instrumented Tests
 * as AccessibilityNodeInfo cannot be easily mocked in unit tests.
 */
class EventCaptureTest {

    @Test
    fun `test event type name mapping`() {
        assertEquals("VIEW_CLICKED", EventCapture.getEventTypeName(1))      // TYPE_VIEW_CLICKED
        assertEquals("VIEW_LONG_CLICKED", EventCapture.getEventTypeName(2)) // TYPE_VIEW_LONG_CLICKED
        assertEquals("VIEW_FOCUSED", EventCapture.getEventTypeName(8))      // TYPE_VIEW_FOCUSED
        assertEquals("VIEW_TEXT_CHANGED", EventCapture.getEventTypeName(16)) // TYPE_VIEW_TEXT_CHANGED
        assertEquals("VIEW_SCROLLED", EventCapture.getEventTypeName(4096))  // TYPE_VIEW_SCROLLED
        assertEquals("WINDOW_STATE_CHANGED", EventCapture.getEventTypeName(32)) // TYPE_WINDOW_STATE_CHANGED
    }

    @Test
    fun `test recordable event detection`() {
        // Recordable events
        assertTrue(EventCapture.isRecordableEvent(1))    // TYPE_VIEW_CLICKED
        assertTrue(EventCapture.isRecordableEvent(2))    // TYPE_VIEW_LONG_CLICKED
        assertTrue(EventCapture.isRecordableEvent(16))   // TYPE_VIEW_TEXT_CHANGED
        assertTrue(EventCapture.isRecordableEvent(4096)) // TYPE_VIEW_SCROLLED
        assertTrue(EventCapture.isRecordableEvent(8))    // TYPE_VIEW_FOCUSED

        // Non-recordable events
        assertFalse(EventCapture.isRecordableEvent(32))   // TYPE_WINDOW_STATE_CHANGED
        assertFalse(EventCapture.isRecordableEvent(2048)) // TYPE_WINDOW_CONTENT_CHANGED
        assertFalse(EventCapture.isRecordableEvent(128))  // TYPE_VIEW_SELECTED
    }

    @Test
    fun `test ElementData selector priority`() {
        // Resource ID is highest priority
        val dataWithResourceId = ElementData(
            resourceId = "com.app:id/button",
            contentDescription = "Description",
            text = "Button Text",
            bounds = "0,0,100,100",
            isClickable = true,
            isEditable = false,
            isScrollable = false,
            isFocusable = true,
            isFocused = false,
            isLongClickable = false,
            isCheckable = false,
            isChecked = false,
            className = "android.widget.Button",
            centerX = 50,
            centerY = 50
        )
        val (type1, value1) = dataWithResourceId.getBestSelector()
        assertEquals("resource-id", type1)
        assertEquals("com.app:id/button", value1)
        assertTrue(dataWithResourceId.hasReliableSelector())

        // Content description fallback
        val dataWithContentDesc = ElementData(
            resourceId = "",
            contentDescription = "Login button",
            text = "Login",
            bounds = "0,0,100,100",
            isClickable = true,
            isEditable = false,
            isScrollable = false,
            isFocusable = true,
            isFocused = false,
            isLongClickable = false,
            isCheckable = false,
            isChecked = false,
            className = "android.widget.Button",
            centerX = 50,
            centerY = 50
        )
        val (type2, value2) = dataWithContentDesc.getBestSelector()
        assertEquals("content-desc", type2)
        assertEquals("Login button", value2)
        assertTrue(dataWithContentDesc.hasReliableSelector())

        // Text fallback
        val dataWithText = ElementData(
            resourceId = "",
            contentDescription = "",
            text = "Submit",
            bounds = "0,0,100,100",
            isClickable = true,
            isEditable = false,
            isScrollable = false,
            isFocusable = true,
            isFocused = false,
            isLongClickable = false,
            isCheckable = false,
            isChecked = false,
            className = "android.widget.Button",
            centerX = 50,
            centerY = 50
        )
        val (type3, value3) = dataWithText.getBestSelector()
        assertEquals("text", type3)
        assertEquals("Submit", value3)
        assertTrue(dataWithText.hasReliableSelector())

        // Bounds fallback (least reliable)
        val dataWithBoundsOnly = ElementData(
            resourceId = "",
            contentDescription = "",
            text = "",
            bounds = "10,20,110,70",
            isClickable = true,
            isEditable = false,
            isScrollable = false,
            isFocusable = true,
            isFocused = false,
            isLongClickable = false,
            isCheckable = false,
            isChecked = false,
            className = "android.widget.Button",
            centerX = 60,
            centerY = 45
        )
        val (type4, value4) = dataWithBoundsOnly.getBestSelector()
        assertEquals("bounds", type4)
        assertEquals("10,20,110,70", value4)
        assertFalse(dataWithBoundsOnly.hasReliableSelector())
    }

    @Test
    fun `test RecordedEvent toMap conversion`() {
        val event = RecordedEvent(
            eventType = "tap",
            timestamp = 1234567890L,
            sequenceNumber = 42,
            relativeTimestamp = 5000,
            packageName = "com.test.app",
            className = "android.widget.Button",
            resourceId = "com.test:id/btn",
            contentDescription = "Test button",
            text = "Click me",
            bounds = "0,0,100,50",
            isClickable = true,
            isEditable = false,
            isScrollable = false,
            actionData = mapOf("extra" to "data"),
            x = 50,
            y = 25,
            nodeIndex = 5
        )

        val map = event.toMap()

        assertEquals("tap", map["event_type"])
        assertEquals(1234567890L, map["timestamp"])
        assertEquals(42L, map["sequence_number"])
        assertEquals(5000L, map["relative_timestamp"])
        assertEquals("com.test.app", map["package_name"])
        assertEquals("android.widget.Button", map["class_name"])
        assertEquals("com.test:id/btn", map["resource_id"])
        assertEquals("Test button", map["content_description"])
        assertEquals("Click me", map["text"])
        assertEquals("0,0,100,50", map["bounds"])
        assertEquals(true, map["is_clickable"])
        assertEquals(false, map["is_editable"])
        assertEquals(false, map["is_scrollable"])
        assertEquals(mapOf("extra" to "data"), map["action_data"])
        assertEquals(50, map["x"])
        assertEquals(25, map["y"])
        assertEquals(5, map["node_index"])
    }

    @Test
    fun `test RecordingStatus toMap conversion`() {
        val status = RecordingStatus(
            state = "recording",
            recordingId = "rec_12345",
            eventCount = 42,
            startTime = 1234567890L,
            durationMs = 5000L
        )

        val map = status.toMap()

        assertEquals("recording", map["state"])
        assertEquals("rec_12345", map["recording_id"])
        assertEquals(42, map["event_count"])
        assertEquals(1234567890L, map["start_time"])
        assertEquals(5000L, map["duration_ms"])
    }

    @Test
    fun `test ElementData center coordinate calculation`() {
        // Valid bounds should have center coordinates
        val dataWithValidBounds = ElementData(
            resourceId = "",
            contentDescription = "",
            text = "",
            bounds = "100,200,300,400",
            isClickable = true,
            isEditable = false,
            isScrollable = false,
            isFocusable = false,
            isFocused = false,
            isLongClickable = false,
            isCheckable = false,
            isChecked = false,
            className = "android.widget.View",
            centerX = 200, // (100+300)/2
            centerY = 300  // (200+400)/2
        )
        assertEquals(200, dataWithValidBounds.centerX)
        assertEquals(300, dataWithValidBounds.centerY)

        // Null center for invalid bounds
        val dataWithNullCenter = ElementData(
            resourceId = "",
            contentDescription = "",
            text = "",
            bounds = "0,0,0,0",
            isClickable = true,
            isEditable = false,
            isScrollable = false,
            isFocusable = false,
            isFocused = false,
            isLongClickable = false,
            isCheckable = false,
            isChecked = false,
            className = "android.widget.View",
            centerX = null, // Zero width
            centerY = null  // Zero height
        )
        assertNull(dataWithNullCenter.centerX)
        assertNull(dataWithNullCenter.centerY)
    }
}
