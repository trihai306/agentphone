package com.agent.portal.accessibility

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.KeyEvent
import android.view.accessibility.AccessibilityEvent
import com.agent.portal.recording.RecordingManager

/**
 * Manager for handling volume button shortcuts in AccessibilityService
 *
 * Features:
 * - Double-press Volume Up: Toggle recording
 * - Double-press Volume Down: Show Quick Actions
 * - Triple-press Volume Up: Take screenshot
 * - Long-press Volume Up: Press Back
 * - Long-press Volume Down: Press Home
 */
class VolumeButtonShortcutManager(private val service: AccessibilityService) {

    companion object {
        private const val TAG = "VolumeButtonShortcut"
        private const val DOUBLE_PRESS_TIMEOUT = 500L // ms
        private const val LONG_PRESS_TIMEOUT = 1000L // ms
        private const val TRIPLE_PRESS_TIMEOUT = 800L // ms
    }

    private val handler = Handler(Looper.getMainLooper())

    // Volume Up tracking
    private var volumeUpPressCount = 0
    private var volumeUpFirstPressTime = 0L
    private var volumeUpLongPressDetected = false
    private val volumeUpResetRunnable = Runnable {
        handleVolumeUpGesture()
        volumeUpPressCount = 0
        volumeUpLongPressDetected = false
    }

    // Volume Down tracking
    private var volumeDownPressCount = 0
    private var volumeDownFirstPressTime = 0L
    private var volumeDownLongPressDetected = false
    private val volumeDownResetRunnable = Runnable {
        handleVolumeDownGesture()
        volumeDownPressCount = 0
        volumeDownLongPressDetected = false
    }

    /**
     * Enable volume button shortcuts
     * Should be called when accessibility service connects
     */
    fun enable() {
        Log.i(TAG, "Volume button shortcuts enabled")
    }

    /**
     * Disable volume button shortcuts
     */
    fun disable() {
        handler.removeCallbacks(volumeUpResetRunnable)
        handler.removeCallbacks(volumeDownResetRunnable)
        volumeUpPressCount = 0
        volumeDownPressCount = 0
        Log.i(TAG, "Volume button shortcuts disabled")
    }

    /**
     * Handle key events from accessibility service
     *
     * Note: AccessibilityService can only intercept key events on Android 9+ (API 28)
     * with FLAG_REQUEST_FILTER_KEY_EVENTS flag
     *
     * @return true if event was consumed, false to pass through
     */
    fun handleKeyEvent(event: KeyEvent): Boolean {
        // Only handle volume keys
        if (event.keyCode != KeyEvent.KEYCODE_VOLUME_UP &&
            event.keyCode != KeyEvent.KEYCODE_VOLUME_DOWN) {
            return false
        }

        when (event.action) {
            KeyEvent.ACTION_DOWN -> {
                return handleKeyDown(event)
            }
            KeyEvent.ACTION_UP -> {
                return handleKeyUp(event)
            }
        }

        return false
    }

    /**
     * Handle key down event
     */
    private fun handleKeyDown(event: KeyEvent): Boolean {
        val currentTime = System.currentTimeMillis()

        when (event.keyCode) {
            KeyEvent.KEYCODE_VOLUME_UP -> {
                // Detect long press
                handler.postDelayed({
                    if (!volumeUpLongPressDetected) {
                        volumeUpLongPressDetected = true
                        handleVolumeUpLongPress()
                        // Reset after handling long press
                        handler.removeCallbacks(volumeUpResetRunnable)
                        volumeUpPressCount = 0
                    }
                }, LONG_PRESS_TIMEOUT)

                // Count press
                if (volumeUpPressCount == 0) {
                    volumeUpFirstPressTime = currentTime
                    volumeUpPressCount = 1
                } else if (currentTime - volumeUpFirstPressTime < TRIPLE_PRESS_TIMEOUT) {
                    volumeUpPressCount++
                }

                return true // Consume event
            }

            KeyEvent.KEYCODE_VOLUME_DOWN -> {
                // Detect long press
                handler.postDelayed({
                    if (!volumeDownLongPressDetected) {
                        volumeDownLongPressDetected = true
                        handleVolumeDownLongPress()
                        // Reset after handling long press
                        handler.removeCallbacks(volumeDownResetRunnable)
                        volumeDownPressCount = 0
                    }
                }, LONG_PRESS_TIMEOUT)

                // Count press
                if (volumeDownPressCount == 0) {
                    volumeDownFirstPressTime = currentTime
                    volumeDownPressCount = 1
                } else if (currentTime - volumeDownFirstPressTime < DOUBLE_PRESS_TIMEOUT) {
                    volumeDownPressCount++
                }

                return true // Consume event
            }
        }

        return false
    }

    /**
     * Handle key up event
     */
    private fun handleKeyUp(event: KeyEvent): Boolean {
        when (event.keyCode) {
            KeyEvent.KEYCODE_VOLUME_UP -> {
                // If not a long press, schedule gesture detection
                if (!volumeUpLongPressDetected) {
                    handler.removeCallbacks(volumeUpResetRunnable)

                    // Wait for potential additional presses
                    val timeout = if (volumeUpPressCount >= 2) TRIPLE_PRESS_TIMEOUT else DOUBLE_PRESS_TIMEOUT
                    handler.postDelayed(volumeUpResetRunnable, timeout)
                }
                return true
            }

            KeyEvent.KEYCODE_VOLUME_DOWN -> {
                // If not a long press, schedule gesture detection
                if (!volumeDownLongPressDetected) {
                    handler.removeCallbacks(volumeDownResetRunnable)
                    handler.postDelayed(volumeDownResetRunnable, DOUBLE_PRESS_TIMEOUT)
                }
                return true
            }
        }

        return false
    }

    /**
     * Handle Volume Up gesture based on press count
     */
    private fun handleVolumeUpGesture() {
        Log.d(TAG, "Volume Up gesture: $volumeUpPressCount presses")

        when (volumeUpPressCount) {
            1 -> {
                // Single press - do nothing (allow normal volume control)
                Log.d(TAG, "Volume Up single press - allowing default behavior")
            }
            2 -> {
                // Double press - Toggle Recording
                Log.i(TAG, "Volume Up double-press detected - Toggling Recording")
                AccessibilityShortcutHelper.toggleRecording(service)
            }
            3 -> {
                // Triple press - Take Screenshot
                Log.i(TAG, "Volume Up triple-press detected - Taking Screenshot")
                AccessibilityShortcutHelper.takeScreenshot(service)
            }
            else -> {
                Log.d(TAG, "Volume Up $volumeUpPressCount presses - no action")
            }
        }
    }

    /**
     * Handle Volume Down gesture based on press count
     */
    private fun handleVolumeDownGesture() {
        Log.d(TAG, "Volume Down gesture: $volumeDownPressCount presses")

        when (volumeDownPressCount) {
            1 -> {
                // Single press - do nothing (allow normal volume control)
                Log.d(TAG, "Volume Down single press - allowing default behavior")
            }
            2 -> {
                // Double press - Show Quick Actions
                Log.i(TAG, "Volume Down double-press detected - Showing Quick Actions")
                AccessibilityShortcutHelper.showQuickActionsPanel(service)
            }
            else -> {
                Log.d(TAG, "Volume Down $volumeDownPressCount presses - no action")
            }
        }
    }

    /**
     * Handle Volume Up long press
     */
    private fun handleVolumeUpLongPress() {
        Log.i(TAG, "Volume Up long-press detected - Pressing Back")
        AccessibilityShortcutHelper.pressBack(service)
    }

    /**
     * Handle Volume Down long press
     */
    private fun handleVolumeDownLongPress() {
        Log.i(TAG, "Volume Down long-press detected - Pressing Home")
        AccessibilityShortcutHelper.pressHome(service)
    }
}
