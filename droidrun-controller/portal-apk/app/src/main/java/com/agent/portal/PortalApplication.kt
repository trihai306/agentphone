package com.agent.portal

import android.app.Application
import android.content.Context
import androidx.appcompat.app.AppCompatDelegate

/**
 * Application class for Portal app.
 * Handles global initialization including theme setup.
 */
class PortalApplication : Application() {

    companion object {
        private const val PREFS_NAME = "agent_portal_settings"
        private const val KEY_DARK_MODE = "dark_mode"
        private const val DEFAULT_DARK_MODE = true
    }

    override fun onCreate() {
        super.onCreate()
        applyTheme()
    }

    /**
     * Apply the saved theme preference on app startup
     */
    private fun applyTheme() {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val isDarkMode = prefs.getBoolean(KEY_DARK_MODE, DEFAULT_DARK_MODE)
        
        val nightMode = if (isDarkMode) {
            AppCompatDelegate.MODE_NIGHT_YES
        } else {
            AppCompatDelegate.MODE_NIGHT_NO
        }
        
        AppCompatDelegate.setDefaultNightMode(nightMode)
    }
}
