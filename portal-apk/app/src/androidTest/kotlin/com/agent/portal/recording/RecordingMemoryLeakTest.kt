package com.agent.portal.recording

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.Assert.*
import org.junit.Before

/**
 * Instrumented tests for memory leak verification.
 *
 * These tests run on an Android device/emulator and verify that:
 * - RecordingManager properly cleans up resources
 * - Event buffer doesn't grow unbounded
 * - Recording cycles don't accumulate memory
 *
 * To run:
 *   ./gradlew connectedAndroidTest
 *
 * Or from Android Studio:
 *   Right-click on test class > Run
 */
@RunWith(AndroidJUnit4::class)
class RecordingMemoryLeakTest {

    @Before
    fun setUp() {
        // Ensure clean state
        RecordingManager.stopRecording()
        RecordingManager.clearEvents()
    }

    @Test
    fun testMemoryStabilityOver100Cycles() {
        // Get initial memory usage
        Runtime.getRuntime().gc()
        Thread.sleep(100)
        val initialMemory = Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()

        // Run 100 recording cycles
        for (cycle in 1..100) {
            // Start recording
            RecordingManager.startRecording()

            // Add events
            for (i in 1..20) {
                val event = RecordedEvent(
                    eventType = "tap",
                    timestamp = System.currentTimeMillis(),
                    packageName = "com.test.app",
                    className = "android.widget.Button",
                    resourceId = "com.test:id/btn_${cycle}_$i",
                    text = "Button $i",
                    bounds = "0,0,100,50",
                    isClickable = true
                )
                RecordingManager.addEvent(event)
            }

            // Verify events added
            assertEquals(20, RecordingManager.getEventCount())

            // Stop recording
            RecordingManager.stopRecording()

            // Clear events (simulating workflow save)
            RecordingManager.clearEvents()

            // Force GC every 10 cycles
            if (cycle % 10 == 0) {
                System.gc()
                Thread.sleep(50)
            }
        }

        // Final cleanup and GC
        Runtime.getRuntime().gc()
        Thread.sleep(200)
        val finalMemory = Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()

        // Memory growth should be bounded (allow up to 10MB growth)
        val memoryGrowth = finalMemory - initialMemory
        val maxAllowedGrowth = 10 * 1024 * 1024L // 10MB

        assertTrue(
            "Memory grew by ${memoryGrowth / 1024}KB, exceeds ${maxAllowedGrowth / 1024}KB limit",
            memoryGrowth < maxAllowedGrowth
        )
    }

    @Test
    fun testEventBufferClearedAfterStop() {
        RecordingManager.startRecording()

        // Add many events
        for (i in 1..500) {
            val event = RecordedEvent(
                eventType = "tap",
                timestamp = System.currentTimeMillis(),
                packageName = "com.test.app",
                resourceId = "com.test:id/btn_$i",
                bounds = "0,0,100,50"
            )
            RecordingManager.addEvent(event)
        }

        assertEquals(500, RecordingManager.getEventCount())

        RecordingManager.stopRecording()
        RecordingManager.clearEvents()

        assertEquals(0, RecordingManager.getEventCount())
    }

    @Test
    fun testBufferSizeLimitPreventsOOM() {
        RecordingManager.startRecording()

        // Try to add way more than buffer limit (1000)
        var addedCount = 0
        for (i in 1..2000) {
            val event = RecordedEvent(
                eventType = "tap",
                timestamp = System.currentTimeMillis(),
                packageName = "com.test.app",
                resourceId = "com.test:id/btn_$i",
                bounds = "0,0,100,50"
            )
            if (RecordingManager.addEvent(event)) {
                addedCount++
            }
        }

        // Should be capped at MAX_BUFFER_SIZE
        assertTrue("Buffer should be capped", RecordingManager.getEventCount() <= 1000)
        assertEquals(RecordingManager.getEventCount(), addedCount)

        RecordingManager.stopRecording()
        RecordingManager.clearEvents()
    }

    @Test
    fun testRapidStartStopCycles() {
        // Stress test rapid start/stop without adding events
        for (i in 1..500) {
            RecordingManager.startRecording()
            RecordingManager.stopRecording()
        }

        // Should end in clean state
        assertEquals(RecordingManager.RecordingState.IDLE, RecordingManager.getState())
        assertEquals(0, RecordingManager.getEventCount())
    }

    @Test
    fun testConcurrentEventAddition() {
        RecordingManager.startRecording()

        // Simulate concurrent event additions from multiple threads
        val threads = mutableListOf<Thread>()
        val eventsPerThread = 50
        val threadCount = 10

        for (t in 1..threadCount) {
            val thread = Thread {
                for (i in 1..eventsPerThread) {
                    val event = RecordedEvent(
                        eventType = "tap",
                        timestamp = System.currentTimeMillis(),
                        packageName = "com.test.app",
                        resourceId = "com.test:id/btn_t${t}_$i",
                        bounds = "0,0,100,50"
                    )
                    RecordingManager.addEvent(event)
                }
            }
            threads.add(thread)
        }

        // Start all threads
        threads.forEach { it.start() }

        // Wait for completion
        threads.forEach { it.join() }

        // Verify events were added (some may be dropped if buffer fills)
        assertTrue(RecordingManager.getEventCount() > 0)
        assertTrue(RecordingManager.getEventCount() <= threadCount * eventsPerThread)

        RecordingManager.stopRecording()
        RecordingManager.clearEvents()
    }

    @Test
    fun testPauseResumeDoesNotLeak() {
        for (cycle in 1..50) {
            RecordingManager.startRecording()

            // Add some events
            for (i in 1..5) {
                RecordingManager.addEvent(
                    RecordedEvent(
                        eventType = "tap",
                        timestamp = System.currentTimeMillis(),
                        packageName = "com.test",
                        resourceId = "id$i",
                        bounds = "0,0,100,50"
                    )
                )
            }

            // Pause
            RecordingManager.pauseRecording()
            assertEquals(RecordingManager.RecordingState.PAUSED, RecordingManager.getState())

            // Events during pause should be dropped
            RecordingManager.addEvent(
                RecordedEvent(
                    eventType = "tap",
                    timestamp = System.currentTimeMillis(),
                    packageName = "com.test",
                    resourceId = "paused_event",
                    bounds = "0,0,100,50"
                )
            )

            // Resume
            RecordingManager.resumeRecording()
            assertEquals(RecordingManager.RecordingState.RECORDING, RecordingManager.getState())

            // Add more events
            for (i in 1..5) {
                RecordingManager.addEvent(
                    RecordedEvent(
                        eventType = "tap",
                        timestamp = System.currentTimeMillis(),
                        packageName = "com.test",
                        resourceId = "resumed_$i",
                        bounds = "0,0,100,50"
                    )
                )
            }

            // Should have 10 events (5 before pause + 5 after resume, not the paused one)
            assertEquals(10, RecordingManager.getEventCount())

            RecordingManager.stopRecording()
            RecordingManager.clearEvents()
        }
    }
}
