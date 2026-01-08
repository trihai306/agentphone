package com.agent.portal.accessibility

import android.content.Context
import android.content.SharedPreferences

/**
 * Manager for storing and retrieving accessibility shortcut configurations
 */
class ShortcutConfigManager(context: Context) {

    companion object {
        private const val PREFS_NAME = "accessibility_shortcuts"

        // Volume button shortcuts
        private const val KEY_VOLUME_SHORTCUTS_ENABLED = "volume_shortcuts_enabled"
        private const val KEY_VOLUME_UP_DOUBLE = "volume_up_double"
        private const val KEY_VOLUME_UP_TRIPLE = "volume_up_triple"
        private const val KEY_VOLUME_UP_LONG = "volume_up_long"
        private const val KEY_VOLUME_DOWN_DOUBLE = "volume_down_double"
        private const val KEY_VOLUME_DOWN_LONG = "volume_down_long"

        // Gesture shortcuts
        private const val KEY_GESTURE_SHORTCUTS_ENABLED = "gesture_shortcuts_enabled"
        private const val KEY_DOUBLE_TAP_ACTION = "double_tap_action"
        private const val KEY_TRIPLE_TAP_ACTION = "triple_tap_action"
        private const val KEY_LONG_PRESS_ACTION = "long_press_action"

        // Accessibility button
        private const val KEY_ACCESSIBILITY_BUTTON_ACTION = "accessibility_button_action"

        // Shortcut actions
        const val ACTION_TOGGLE_RECORDING = "toggle_recording"
        const val ACTION_STOP_RECORDING = "stop_recording"
        const val ACTION_REPLAY_RECORDING = "replay_recording"
        const val ACTION_SHOW_QUICK_ACTIONS = "show_quick_actions"
        const val ACTION_TAKE_SCREENSHOT = "take_screenshot"
        const val ACTION_PRESS_BACK = "press_back"
        const val ACTION_PRESS_HOME = "press_home"
        const val ACTION_SHOW_RECENTS = "show_recents"
        const val ACTION_LOCK_SCREEN = "lock_screen"
        const val ACTION_SHOW_NOTIFICATIONS = "show_notifications"
        const val ACTION_SHOW_QUICK_SETTINGS = "show_quick_settings"
        const val ACTION_SHOW_POWER_DIALOG = "show_power_dialog"
        const val ACTION_NONE = "none"
    }

    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    // ========================================================================
    // Volume Button Shortcuts
    // ========================================================================

    var volumeShortcutsEnabled: Boolean
        get() = prefs.getBoolean(KEY_VOLUME_SHORTCUTS_ENABLED, true)
        set(value) = prefs.edit().putBoolean(KEY_VOLUME_SHORTCUTS_ENABLED, value).apply()

    var volumeUpDoubleAction: String
        get() = prefs.getString(KEY_VOLUME_UP_DOUBLE, ACTION_TOGGLE_RECORDING) ?: ACTION_TOGGLE_RECORDING
        set(value) = prefs.edit().putString(KEY_VOLUME_UP_DOUBLE, value).apply()

    var volumeUpTripleAction: String
        get() = prefs.getString(KEY_VOLUME_UP_TRIPLE, ACTION_TAKE_SCREENSHOT) ?: ACTION_TAKE_SCREENSHOT
        set(value) = prefs.edit().putString(KEY_VOLUME_UP_TRIPLE, value).apply()

    var volumeUpLongAction: String
        get() = prefs.getString(KEY_VOLUME_UP_LONG, ACTION_PRESS_BACK) ?: ACTION_PRESS_BACK
        set(value) = prefs.edit().putString(KEY_VOLUME_UP_LONG, value).apply()

    var volumeDownDoubleAction: String
        get() = prefs.getString(KEY_VOLUME_DOWN_DOUBLE, ACTION_SHOW_QUICK_ACTIONS) ?: ACTION_SHOW_QUICK_ACTIONS
        set(value) = prefs.edit().putString(KEY_VOLUME_DOWN_DOUBLE, value).apply()

    var volumeDownLongAction: String
        get() = prefs.getString(KEY_VOLUME_DOWN_LONG, ACTION_PRESS_HOME) ?: ACTION_PRESS_HOME
        set(value) = prefs.edit().putString(KEY_VOLUME_DOWN_LONG, value).apply()

    // ========================================================================
    // Gesture Shortcuts
    // ========================================================================

    var gestureShortcutsEnabled: Boolean
        get() = prefs.getBoolean(KEY_GESTURE_SHORTCUTS_ENABLED, false)
        set(value) = prefs.edit().putBoolean(KEY_GESTURE_SHORTCUTS_ENABLED, value).apply()

    var doubleTapAction: String
        get() = prefs.getString(KEY_DOUBLE_TAP_ACTION, ACTION_NONE) ?: ACTION_NONE
        set(value) = prefs.edit().putString(KEY_DOUBLE_TAP_ACTION, value).apply()

    var tripleTapAction: String
        get() = prefs.getString(KEY_TRIPLE_TAP_ACTION, ACTION_NONE) ?: ACTION_NONE
        set(value) = prefs.edit().putString(KEY_TRIPLE_TAP_ACTION, value).apply()

    var longPressAction: String
        get() = prefs.getString(KEY_LONG_PRESS_ACTION, ACTION_NONE) ?: ACTION_NONE
        set(value) = prefs.edit().putString(KEY_LONG_PRESS_ACTION, value).apply()

    // ========================================================================
    // Accessibility Button
    // ========================================================================

    var accessibilityButtonAction: String
        get() = prefs.getString(KEY_ACCESSIBILITY_BUTTON_ACTION, ACTION_TOGGLE_RECORDING) ?: ACTION_TOGGLE_RECORDING
        set(value) = prefs.edit().putString(KEY_ACCESSIBILITY_BUTTON_ACTION, value).apply()

    // ========================================================================
    // Helper Methods
    // ========================================================================

    /**
     * Get human-readable name for action
     */
    fun getActionName(action: String): String {
        return when (action) {
            ACTION_TOGGLE_RECORDING -> "Toggle Recording"
            ACTION_SHOW_QUICK_ACTIONS -> "Show Quick Actions"
            ACTION_TAKE_SCREENSHOT -> "Take Screenshot"
            ACTION_PRESS_BACK -> "Press Back"
            ACTION_PRESS_HOME -> "Press Home"
            ACTION_SHOW_RECENTS -> "Show Recents"
            ACTION_LOCK_SCREEN -> "Lock Screen"
            ACTION_SHOW_NOTIFICATIONS -> "Show Notifications"
            ACTION_SHOW_QUICK_SETTINGS -> "Show Quick Settings"
            ACTION_SHOW_POWER_DIALOG -> "Show Power Dialog"
            ACTION_NONE -> "None"
            else -> "Unknown"
        }
    }

    /**
     * Get all available actions
     */
    fun getAllActions(): List<String> {
        return listOf(
            ACTION_TOGGLE_RECORDING,
            ACTION_SHOW_QUICK_ACTIONS,
            ACTION_TAKE_SCREENSHOT,
            ACTION_PRESS_BACK,
            ACTION_PRESS_HOME,
            ACTION_SHOW_RECENTS,
            ACTION_LOCK_SCREEN,
            ACTION_SHOW_NOTIFICATIONS,
            ACTION_SHOW_QUICK_SETTINGS,
            ACTION_SHOW_POWER_DIALOG,
            ACTION_NONE
        )
    }

    /**
     * Reset to default settings
     */
    fun resetToDefaults() {
        prefs.edit().clear().apply()
    }

    /**
     * Export settings as JSON string
     */
    fun exportSettings(): String {
        val settings = mutableMapOf<String, Any>()
        prefs.all.forEach { (key, value) ->
            value?.let { settings[key] = it }
        }
        // Simple JSON serialization (use Gson/Moshi in production)
        return settings.entries.joinToString(",", "{", "}") { (k, v) ->
            val valueStr = when (v) {
                is String -> "\"$v\""
                is Boolean -> v.toString()
                else -> "\"$v\""
            }
            "\"$k\":$valueStr"
        }
    }

    /**
     * Import settings from JSON string (basic implementation)
     */
    fun importSettings(json: String) {
        // Basic JSON parsing (use Gson/Moshi in production)
        // This is a simplified version
        try {
            prefs.edit().apply {
                // Reset first
                clear()
                // Parse and apply
                // Note: This is a placeholder - implement proper JSON parsing
                apply()
            }
        } catch (e: Exception) {
            // Handle error
        }
    }
}
