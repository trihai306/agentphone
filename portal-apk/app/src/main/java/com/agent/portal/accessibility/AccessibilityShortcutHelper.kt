package com.agent.portal.accessibility

import android.accessibilityservice.AccessibilityButtonController
import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import android.widget.Toast
import com.agent.portal.overlay.FloatingRecordingService
import com.agent.portal.recording.RecordingManager
import com.agent.portal.recording.RecordingPlayer

/**
 * Helper class for managing Accessibility shortcuts and quick actions.
 * Provides shortcuts for common actions like:
 * - Toggle recording
 * - Go home
 * - Go back
 * - Take screenshot
 * - Quick actions menu
 */
object AccessibilityShortcutHelper {

    private const val TAG = "A11yShortcutHelper"

    // Vibration patterns
    private const val VIBRATE_SHORT = 50L
    private const val VIBRATE_DOUBLE = 100L
    private const val VIBRATE_LONG = 200L

    /**
     * Toggle recording state (start/stop)
     */
    fun toggleRecording(context: Context) {
        val state = RecordingManager.getState()

        when (state) {
            RecordingManager.RecordingState.IDLE -> {
                // Check if accessibility service is running
                if (!PortalAccessibilityService.isRunning()) {
                    Toast.makeText(context, "Accessibility Service not running", Toast.LENGTH_SHORT).show()
                    return
                }

                RecordingManager.startRecording()
                vibratePattern(context, longArrayOf(0, VIBRATE_SHORT, 100, VIBRATE_SHORT))
                Toast.makeText(context, "Recording started", Toast.LENGTH_SHORT).show()

                // Start floating bubble
                val intent = Intent(context, FloatingRecordingService::class.java).apply {
                    action = FloatingRecordingService.ACTION_SHOW
                }
                context.startService(intent)
            }
            RecordingManager.RecordingState.RECORDING -> {
                RecordingManager.stopRecording()
                vibratePattern(context, longArrayOf(0, VIBRATE_LONG))
                Toast.makeText(context, "Recording stopped - ${RecordingManager.getEventCount()} events", Toast.LENGTH_SHORT).show()

                // Stop floating bubble
                val intent = Intent(context, FloatingRecordingService::class.java).apply {
                    action = FloatingRecordingService.ACTION_HIDE
                }
                context.startService(intent)
            }
            RecordingManager.RecordingState.PAUSED -> {
                RecordingManager.resumeRecording()
                vibratePattern(context, longArrayOf(0, VIBRATE_SHORT, 100, VIBRATE_SHORT))
                Toast.makeText(context, "Recording resumed", Toast.LENGTH_SHORT).show()
            }
        }

        Log.i(TAG, "Recording toggled: ${RecordingManager.getState()}")
    }

    /**
     * Pause/Resume recording
     */
    fun togglePause(context: Context) {
        val state = RecordingManager.getState()

        when (state) {
            RecordingManager.RecordingState.RECORDING -> {
                RecordingManager.pauseRecording()
                vibrate(context, VIBRATE_SHORT)
                Toast.makeText(context, "Recording paused", Toast.LENGTH_SHORT).show()
            }
            RecordingManager.RecordingState.PAUSED -> {
                RecordingManager.resumeRecording()
                vibratePattern(context, longArrayOf(0, VIBRATE_SHORT, 50, VIBRATE_SHORT))
                Toast.makeText(context, "Recording resumed", Toast.LENGTH_SHORT).show()
            }
            else -> {
                Toast.makeText(context, "Not recording", Toast.LENGTH_SHORT).show()
            }
        }
    }

    /**
     * Press Back button
     */
    fun pressBack(service: AccessibilityService) {
        val success = service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_BACK)
        if (success) {
            vibrate(service, VIBRATE_SHORT)
        }
        Log.i(TAG, "Back pressed: $success")
    }

    /**
     * Press Home button
     */
    fun pressHome(service: AccessibilityService) {
        val success = service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_HOME)
        if (success) {
            vibrate(service, VIBRATE_SHORT)
        }
        Log.i(TAG, "Home pressed: $success")
    }

    /**
     * Show Recents/App Switcher
     */
    fun showRecents(service: AccessibilityService) {
        val success = service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_RECENTS)
        if (success) {
            vibrate(service, VIBRATE_SHORT)
        }
        Log.i(TAG, "Recents shown: $success")
    }

    /**
     * Show Notifications panel
     */
    fun showNotifications(service: AccessibilityService) {
        val success = service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_NOTIFICATIONS)
        if (success) {
            vibrate(service, VIBRATE_SHORT)
        }
        Log.i(TAG, "Notifications shown: $success")
    }

    /**
     * Show Quick Settings panel
     */
    fun showQuickSettings(service: AccessibilityService) {
        val success = service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_QUICK_SETTINGS)
        if (success) {
            vibrate(service, VIBRATE_SHORT)
        }
        Log.i(TAG, "Quick Settings shown: $success")
    }

    /**
     * Take Screenshot (Android 9+)
     */
    fun takeScreenshot(service: AccessibilityService): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            val success = service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_TAKE_SCREENSHOT)
            if (success) {
                vibrate(service, VIBRATE_DOUBLE)
            }
            Log.i(TAG, "Screenshot taken: $success")
            return success
        }
        return false
    }

    /**
     * Lock Screen (Android 9+)
     */
    fun lockScreen(service: AccessibilityService): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            val success = service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_LOCK_SCREEN)
            if (success) {
                vibrate(service, VIBRATE_LONG)
            }
            Log.i(TAG, "Screen locked: $success")
            return success
        }
        return false
    }

    /**
     * Show Power Dialog
     */
    fun showPowerDialog(service: AccessibilityService) {
        val success = service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_POWER_DIALOG)
        if (success) {
            vibrate(service, VIBRATE_SHORT)
        }
        Log.i(TAG, "Power dialog shown: $success")
    }

    /**
     * Show Quick Actions Panel (floating overlay)
     */
    fun showQuickActionsPanel(context: Context) {
        try {
            val intent = Intent(context, com.agent.portal.overlay.QuickActionsService::class.java).apply {
                action = com.agent.portal.overlay.QuickActionsService.ACTION_TOGGLE
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
            vibrate(context, VIBRATE_SHORT)
            Log.i(TAG, "Quick Actions panel toggled")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to show Quick Actions panel", e)
        }
    }

    /**
     * Setup Accessibility Button callback (for devices with software nav bar)
     */
    fun setupAccessibilityButton(service: AccessibilityService, callback: () -> Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val controller = service.accessibilityButtonController
            val isAvailable = controller.isAccessibilityButtonAvailable

            if (isAvailable) {
                controller.registerAccessibilityButtonCallback(
                    object : AccessibilityButtonController.AccessibilityButtonCallback() {
                        override fun onClicked(controller: AccessibilityButtonController) {
                            Log.i(TAG, "Accessibility button clicked")
                            callback()
                        }

                        override fun onAvailabilityChanged(
                            controller: AccessibilityButtonController,
                            available: Boolean
                        ) {
                            Log.i(TAG, "Accessibility button availability changed: $available")
                        }
                    }
                )
                Log.i(TAG, "Accessibility button callback registered")
            } else {
                Log.w(TAG, "Accessibility button not available")
            }
        }
    }

    /**
     * Vibrate device
     */
    @Suppress("DEPRECATION")
    private fun vibrate(context: Context, durationMs: Long) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                val vibrator = vibratorManager.defaultVibrator
                vibrator.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                vibrator.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                vibrator.vibrate(durationMs)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to vibrate", e)
        }
    }

    /**
     * Vibrate with pattern
     */
    @Suppress("DEPRECATION")
    private fun vibratePattern(context: Context, pattern: LongArray) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                val vibrator = vibratorManager.defaultVibrator
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
            } else {
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                vibrator.vibrate(pattern, -1)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to vibrate pattern", e)
        }
    }

    /**
     * Stop recording (without toggle - just stop)
     */
    fun stopRecording(context: Context) {
        val state = RecordingManager.getState()

        if (state == RecordingManager.RecordingState.RECORDING || state == RecordingManager.RecordingState.PAUSED) {
            RecordingManager.stopRecording()
            vibratePattern(context, longArrayOf(0, VIBRATE_LONG))
            Toast.makeText(context, "Recording stopped - ${RecordingManager.getEventCount()} events", Toast.LENGTH_SHORT).show()

            // Stop floating bubble
            val intent = Intent(context, FloatingRecordingService::class.java).apply {
                action = FloatingRecordingService.ACTION_HIDE
            }
            context.startService(intent)

            Log.i(TAG, "Recording stopped via shortcut")
        } else {
            Toast.makeText(context, "Not recording", Toast.LENGTH_SHORT).show()
        }
    }

    /**
     * Replay last recording
     */
    fun replayRecording(context: Context) {
        // Check if already playing
        if (RecordingPlayer.isPlaying()) {
            Toast.makeText(context, "Playback already in progress", Toast.LENGTH_SHORT).show()
            return
        }

        // Check if there's a recording to play
        val events = RecordingManager.getEvents()
        if (events.isEmpty()) {
            Toast.makeText(context, "No recording to replay", Toast.LENGTH_SHORT).show()
            vibrate(context, VIBRATE_LONG)
            return
        }

        Toast.makeText(context, "Replaying ${events.size} events...", Toast.LENGTH_SHORT).show()
        vibratePattern(context, longArrayOf(0, VIBRATE_SHORT, 100, VIBRATE_SHORT, 100, VIBRATE_SHORT))

        // Start playback
        RecordingPlayer.playLastRecording(
            onComplete = {
                // Run on main thread
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    Toast.makeText(context, "Replay completed", Toast.LENGTH_SHORT).show()
                    vibrate(context, VIBRATE_DOUBLE)
                }
            },
            onError = { error: String ->
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    Toast.makeText(context, "Replay failed: $error", Toast.LENGTH_SHORT).show()
                    vibratePattern(context, longArrayOf(0, VIBRATE_LONG, 100, VIBRATE_LONG))
                }
            }
        )

        Log.i(TAG, "Replay started")
    }

    /**
     * Execute action by action constant
     */
    fun executeAction(context: Context, action: String, service: AccessibilityService? = null) {
        Log.i(TAG, "Executing action: $action")

        when (action) {
            ShortcutConfigManager.ACTION_TOGGLE_RECORDING -> toggleRecording(context)
            ShortcutConfigManager.ACTION_STOP_RECORDING -> stopRecording(context)
            ShortcutConfigManager.ACTION_REPLAY_RECORDING -> replayRecording(context)
            ShortcutConfigManager.ACTION_SHOW_QUICK_ACTIONS -> showQuickActionsPanel(context)
            ShortcutConfigManager.ACTION_TAKE_SCREENSHOT -> {
                if (service != null) {
                    takeScreenshot(service)
                    vibrate(context, VIBRATE_SHORT)
                }
            }
            ShortcutConfigManager.ACTION_PRESS_BACK -> {
                service?.performGlobalAction(AccessibilityService.GLOBAL_ACTION_BACK)
                vibrate(context, VIBRATE_SHORT)
            }
            ShortcutConfigManager.ACTION_PRESS_HOME -> {
                service?.performGlobalAction(AccessibilityService.GLOBAL_ACTION_HOME)
                vibrate(context, VIBRATE_SHORT)
            }
            ShortcutConfigManager.ACTION_SHOW_RECENTS -> {
                service?.performGlobalAction(AccessibilityService.GLOBAL_ACTION_RECENTS)
                vibrate(context, VIBRATE_SHORT)
            }
            ShortcutConfigManager.ACTION_LOCK_SCREEN -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    service?.performGlobalAction(AccessibilityService.GLOBAL_ACTION_LOCK_SCREEN)
                    vibrate(context, VIBRATE_SHORT)
                }
            }
            ShortcutConfigManager.ACTION_SHOW_NOTIFICATIONS -> {
                service?.performGlobalAction(AccessibilityService.GLOBAL_ACTION_NOTIFICATIONS)
                vibrate(context, VIBRATE_SHORT)
            }
            ShortcutConfigManager.ACTION_SHOW_QUICK_SETTINGS -> {
                service?.performGlobalAction(AccessibilityService.GLOBAL_ACTION_QUICK_SETTINGS)
                vibrate(context, VIBRATE_SHORT)
            }
            ShortcutConfigManager.ACTION_SHOW_POWER_DIALOG -> {
                service?.performGlobalAction(AccessibilityService.GLOBAL_ACTION_POWER_DIALOG)
                vibrate(context, VIBRATE_SHORT)
            }
            ShortcutConfigManager.ACTION_NONE -> {
                // Do nothing
            }
        }
    }
}
