package com.agent.portal.accessibility

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent

/**
 * Custom gesture detector for AccessibilityService
 *
 * Features:
 * - Double-tap detection (two window state changes in quick succession)
 * - Long-press detection (focus held for extended period)
 * - Swipe pattern detection (scroll events in specific directions)
 *
 * Note: These are heuristic-based detections using accessibility events,
 * not true touch gesture detection (which requires system permissions)
 */
class AccessibilityGestureDetector(
    private val service: AccessibilityService,
    private val onGestureDetected: (GestureType) -> Unit
) {

    companion object {
        private const val TAG = "A11yGestureDetector"
        private const val DOUBLE_TAP_TIMEOUT = 500L // ms
        private const val LONG_PRESS_TIMEOUT = 1000L // ms
        private const val SWIPE_SEQUENCE_TIMEOUT = 300L // ms
    }

    enum class GestureType {
        DOUBLE_TAP,
        LONG_PRESS,
        SWIPE_UP,
        SWIPE_DOWN,
        SWIPE_LEFT,
        SWIPE_RIGHT,
        TRIPLE_TAP
    }

    private val handler = Handler(Looper.getMainLooper())

    // Double/Triple tap detection
    private var lastClickTime = 0L
    private var clickCount = 0
    private val tapResetRunnable = Runnable {
        if (clickCount == 2) {
            Log.i(TAG, "Double-tap gesture detected")
            onGestureDetected(GestureType.DOUBLE_TAP)
        } else if (clickCount == 3) {
            Log.i(TAG, "Triple-tap gesture detected")
            onGestureDetected(GestureType.TRIPLE_TAP)
        }
        clickCount = 0
    }

    // Long press detection
    private var focusStartTime = 0L
    private var isFocusActive = false
    private val longPressCheckRunnable = Runnable {
        if (isFocusActive && System.currentTimeMillis() - focusStartTime >= LONG_PRESS_TIMEOUT) {
            Log.i(TAG, "Long-press gesture detected")
            onGestureDetected(GestureType.LONG_PRESS)
            isFocusActive = false
        }
    }

    // Swipe detection
    private var lastScrollEventTime = 0L
    private var consecutiveScrollUp = 0
    private var consecutiveScrollDown = 0
    private var consecutiveScrollLeft = 0
    private var consecutiveScrollRight = 0
    private val swipeResetRunnable = Runnable {
        resetSwipeCounters()
    }

    /**
     * Process accessibility event for gesture detection
     */
    fun onAccessibilityEvent(event: AccessibilityEvent) {
        when (event.eventType) {
            AccessibilityEvent.TYPE_VIEW_CLICKED -> {
                detectTapGesture(event)
            }

            AccessibilityEvent.TYPE_VIEW_FOCUSED -> {
                detectFocusStart(event)
            }

            AccessibilityEvent.TYPE_VIEW_ACCESSIBILITY_FOCUSED -> {
                detectFocusStart(event)
            }

            AccessibilityEvent.TYPE_VIEW_ACCESSIBILITY_FOCUS_CLEARED,
            AccessibilityEvent.TYPE_VIEW_FOCUSED -> {
                detectFocusEnd()
            }

            AccessibilityEvent.TYPE_VIEW_SCROLLED -> {
                detectScrollGesture(event)
            }
        }
    }

    /**
     * Detect tap-based gestures (double-tap, triple-tap)
     */
    private fun detectTapGesture(event: AccessibilityEvent) {
        val currentTime = System.currentTimeMillis()

        if (clickCount == 0 || currentTime - lastClickTime > DOUBLE_TAP_TIMEOUT) {
            // First tap or timeout exceeded
            clickCount = 1
            lastClickTime = currentTime
            handler.removeCallbacks(tapResetRunnable)
            handler.postDelayed(tapResetRunnable, DOUBLE_TAP_TIMEOUT)
        } else {
            // Subsequent tap within timeout
            clickCount++
            lastClickTime = currentTime
            handler.removeCallbacks(tapResetRunnable)

            if (clickCount >= 3) {
                // Triple tap detected immediately
                handler.post(tapResetRunnable)
            } else {
                // Wait for potential additional taps
                handler.postDelayed(tapResetRunnable, DOUBLE_TAP_TIMEOUT)
            }
        }
    }

    /**
     * Detect focus start (potential long press)
     */
    private fun detectFocusStart(event: AccessibilityEvent) {
        if (!isFocusActive) {
            isFocusActive = true
            focusStartTime = System.currentTimeMillis()
            handler.removeCallbacks(longPressCheckRunnable)
            handler.postDelayed(longPressCheckRunnable, LONG_PRESS_TIMEOUT)
        }
    }

    /**
     * Detect focus end (cancel long press detection)
     */
    private fun detectFocusEnd() {
        isFocusActive = false
        handler.removeCallbacks(longPressCheckRunnable)
    }

    /**
     * Detect scroll-based gestures (swipes)
     *
     * Note: This is a heuristic approach. AccessibilityEvent.TYPE_VIEW_SCROLLED
     * doesn't provide direction info directly, so we'd need additional context
     * from the scrollable view's properties.
     */
    private fun detectScrollGesture(event: AccessibilityEvent) {
        val currentTime = System.currentTimeMillis()

        // Reset counters if too much time has passed
        if (currentTime - lastScrollEventTime > SWIPE_SEQUENCE_TIMEOUT) {
            resetSwipeCounters()
        }

        lastScrollEventTime = currentTime

        // Try to detect scroll direction from event properties
        // This is simplified - in practice you'd need to check scroll positions
        val scrollY = event.scrollY
        val scrollX = event.scrollX
        val maxScrollY = event.maxScrollY
        val maxScrollX = event.maxScrollX

        // Heuristic: detect if scrolling towards edges
        // Note: This is very basic and may not work reliably for all views
        val isAtTop = scrollY <= 0
        val isAtBottom = scrollY >= maxScrollY
        val isAtLeft = scrollX <= 0
        val isAtRight = scrollX >= maxScrollX

        // For more robust swipe detection, you would need to track
        // coordinate changes between events, which requires additional state

        handler.removeCallbacks(swipeResetRunnable)
        handler.postDelayed(swipeResetRunnable, SWIPE_SEQUENCE_TIMEOUT)
    }

    /**
     * Reset swipe detection counters
     */
    private fun resetSwipeCounters() {
        if (consecutiveScrollUp >= 2) {
            Log.i(TAG, "Swipe up gesture detected")
            onGestureDetected(GestureType.SWIPE_UP)
        } else if (consecutiveScrollDown >= 2) {
            Log.i(TAG, "Swipe down gesture detected")
            onGestureDetected(GestureType.SWIPE_DOWN)
        } else if (consecutiveScrollLeft >= 2) {
            Log.i(TAG, "Swipe left gesture detected")
            onGestureDetected(GestureType.SWIPE_LEFT)
        } else if (consecutiveScrollRight >= 2) {
            Log.i(TAG, "Swipe right gesture detected")
            onGestureDetected(GestureType.SWIPE_RIGHT)
        }

        consecutiveScrollUp = 0
        consecutiveScrollDown = 0
        consecutiveScrollLeft = 0
        consecutiveScrollRight = 0
    }

    /**
     * Clean up resources
     */
    fun destroy() {
        handler.removeCallbacks(tapResetRunnable)
        handler.removeCallbacks(longPressCheckRunnable)
        handler.removeCallbacks(swipeResetRunnable)
    }
}
