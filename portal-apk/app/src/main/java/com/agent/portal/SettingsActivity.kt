package com.agent.portal

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.appcompat.app.AppCompatDelegate
import androidx.appcompat.app.AppCompatActivity
import com.agent.portal.accessibility.PortalAccessibilityService
import com.agent.portal.databinding.ActivitySettingsBinding
import com.agent.portal.overlay.OverlayService
import com.agent.portal.recording.RecordingManager
import com.agent.portal.recording.ScreenshotManager
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import java.io.File

/**
 * Settings Activity for configuring app preferences
 */
class SettingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySettingsBinding
    private lateinit var prefs: SharedPreferences

    companion object {
        private const val PREFS_NAME = "agent_portal_settings"

        // Preference keys
        const val KEY_AUTO_SCREENSHOT = "auto_screenshot"
        const val KEY_SCREENSHOT_QUALITY = "screenshot_quality"
        const val KEY_MAX_EVENTS = "max_events"
        const val KEY_VOLUME_SHORTCUTS = "volume_shortcuts"
        const val KEY_AUTO_UPLOAD = "auto_upload"
        const val KEY_DARK_MODE = "dark_mode"
        const val KEY_PYTHON_BACKEND_URL = "python_backend_url"

        // Default values
        const val DEFAULT_AUTO_SCREENSHOT = true
        const val DEFAULT_SCREENSHOT_QUALITY = 80
        const val DEFAULT_MAX_EVENTS = 1000
        const val DEFAULT_VOLUME_SHORTCUTS = true
        const val DEFAULT_AUTO_UPLOAD = false
        const val DEFAULT_DARK_MODE = true
        const val DEFAULT_PYTHON_BACKEND_URL = "http://localhost:5000"

        /**
         * Get shared preferences instance
         */
        fun getPreferences(context: Context): SharedPreferences {
            return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefs = getPreferences(this)

        setupToolbar()
        loadSettings()
        setupListeners()
        updateStorageInfo()
    }

    private fun setupToolbar() {
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
    }

    private fun loadSettings() {
        // Load Auto Screenshot
        val autoScreenshot = prefs.getBoolean(KEY_AUTO_SCREENSHOT, DEFAULT_AUTO_SCREENSHOT)
        binding.switchAutoScreenshot.isChecked = autoScreenshot

        // Load Screenshot Quality
        val quality = prefs.getInt(KEY_SCREENSHOT_QUALITY, DEFAULT_SCREENSHOT_QUALITY)
        binding.sliderQuality.value = quality.toFloat()
        binding.tvQualityValue.text = "$quality%"

        // Load Max Events
        val maxEvents = prefs.getInt(KEY_MAX_EVENTS, DEFAULT_MAX_EVENTS)
        binding.sliderMaxEvents.value = maxEvents.toFloat()
        binding.tvMaxEventsValue.text = maxEvents.toString()

        // Load Auto Upload
        val autoUpload = prefs.getBoolean(KEY_AUTO_UPLOAD, DEFAULT_AUTO_UPLOAD)
        binding.switchAutoUpload.isChecked = autoUpload

        // Load Backend URL
        val backendUrl = prefs.getString(KEY_PYTHON_BACKEND_URL, DEFAULT_PYTHON_BACKEND_URL)
        binding.etBackendUrl.setText(backendUrl)

        // Load Volume Shortcuts
        val volumeShortcuts = prefs.getBoolean(KEY_VOLUME_SHORTCUTS, DEFAULT_VOLUME_SHORTCUTS)
        binding.switchVolumeShortcuts.isChecked = volumeShortcuts

        // Load Dark Mode
        val darkMode = prefs.getBoolean(KEY_DARK_MODE, DEFAULT_DARK_MODE)
        binding.switchDarkMode.isChecked = darkMode
    }

    private fun setupListeners() {
        // Auto Screenshot Toggle
        binding.switchAutoScreenshot.setOnCheckedChangeListener { view, isChecked ->
            if (view.isPressed) {
                prefs.edit().putBoolean(KEY_AUTO_SCREENSHOT, isChecked).apply()
                RecordingManager.setScreenshotEnabled(isChecked)
                animateToggle(view)

                val message = if (isChecked) "Auto screenshot enabled" else "Auto screenshot disabled"
                Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
            }
        }

        // Screenshot Quality Slider
        binding.sliderQuality.addOnChangeListener { _, value, fromUser ->
            if (fromUser) {
                val quality = value.toInt()
                binding.tvQualityValue.text = "$quality%"
                prefs.edit().putInt(KEY_SCREENSHOT_QUALITY, quality).apply()
            }
        }

        // Max Events Slider
        binding.sliderMaxEvents.addOnChangeListener { _, value, fromUser ->
            if (fromUser) {
                val maxEvents = value.toInt()
                binding.tvMaxEventsValue.text = maxEvents.toString()
                prefs.edit().putInt(KEY_MAX_EVENTS, maxEvents).apply()
            }
        }

        // Auto Upload Toggle
        binding.switchAutoUpload.setOnCheckedChangeListener { view, isChecked ->
            if (view.isPressed) {
                prefs.edit().putBoolean(KEY_AUTO_UPLOAD, isChecked).apply()
                animateToggle(view)

                // Apply to RecordingManager
                val backendUrl = binding.etBackendUrl.text.toString().trim()
                if (isChecked && backendUrl.isNotEmpty()) {
                    RecordingManager.setAutoUploadEnabled(true, backendUrl)
                    val message = "Auto-upload enabled"
                    Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
                } else {
                    RecordingManager.setAutoUploadEnabled(false)
                    val message = "Auto-upload disabled"
                    Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
                }
            }
        }

        // Backend URL Input - Save on focus loss
        binding.etBackendUrl.setOnFocusChangeListener { _, hasFocus ->
            if (!hasFocus) {
                val url = binding.etBackendUrl.text.toString().trim()
                prefs.edit().putString(KEY_PYTHON_BACKEND_URL, url).apply()

                // Update RecordingManager if auto-upload is enabled
                if (binding.switchAutoUpload.isChecked && url.isNotEmpty()) {
                    RecordingManager.setAutoUploadEnabled(true, url)
                }
            }
        }

        // Test Connection Button
        binding.btnTestConnection.setOnClickListener {
            testPythonConnection()
        }

        // Volume Shortcuts Toggle
        binding.switchVolumeShortcuts.setOnCheckedChangeListener { view, isChecked ->
            if (view.isPressed) {
                prefs.edit().putBoolean(KEY_VOLUME_SHORTCUTS, isChecked).apply()
                animateToggle(view)

                val message = if (isChecked) "Volume shortcuts enabled" else "Volume shortcuts disabled"
                Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
            }
        }

        // Configure Shortcuts Button
        binding.btnConfigureShortcuts.setOnClickListener {
            Toast.makeText(this, "Shortcut configuration coming soon", Toast.LENGTH_SHORT).show()
        }

        // Dark Mode Toggle
        binding.switchDarkMode.setOnCheckedChangeListener { view, isChecked ->
            if (view.isPressed) {
                prefs.edit().putBoolean(KEY_DARK_MODE, isChecked).apply()
                animateToggle(view)

                // Apply theme immediately
                val nightMode = if (isChecked) {
                    AppCompatDelegate.MODE_NIGHT_YES
                } else {
                    AppCompatDelegate.MODE_NIGHT_NO
                }
                AppCompatDelegate.setDefaultNightMode(nightMode)

                val message = if (isChecked) "Dark mode enabled" else "Light mode enabled"
                Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
            }
        }

        // Clear Screenshots Button
        binding.btnClearScreenshots.setOnClickListener {
            confirmClearScreenshots()
        }

        // Export Settings Button
        binding.btnExportSettings.setOnClickListener {
            exportSettings()
        }

        // Import Settings Button
        binding.btnImportSettings.setOnClickListener {
            Toast.makeText(this, "Import feature coming soon", Toast.LENGTH_SHORT).show()
        }

        // Reset to Defaults Button
        binding.btnResetDefaults.setOnClickListener {
            confirmResetDefaults()
        }

        // Debug Tools - Show Element Bounds Toggle
        binding.switchBounds.isChecked = OverlayService.showBounds
        binding.switchBounds.setOnCheckedChangeListener { view, isChecked ->
            if (view.isPressed) {
                if (!checkOverlayPrerequisites()) {
                    binding.switchBounds.isChecked = false
                    return@setOnCheckedChangeListener
                }
                
                if (isChecked) {
                    startOverlayService(OverlayService.Actions.SHOW_BOUNDS)
                } else {
                    startOverlayService(OverlayService.Actions.HIDE_BOUNDS)
                }
                animateToggle(view)
            }
        }

        // Debug Tools - Show Element Indexes Toggle
        binding.switchIndexes.isChecked = OverlayService.showIndexes
        binding.switchIndexes.setOnCheckedChangeListener { view, isChecked ->
            if (view.isPressed) {
                if (!checkOverlayPrerequisites()) {
                    binding.switchIndexes.isChecked = false
                    return@setOnCheckedChangeListener
                }
                
                if (isChecked) {
                    startOverlayService(OverlayService.Actions.SHOW_INDEXES)
                } else {
                    startOverlayService(OverlayService.Actions.HIDE_INDEXES)
                }
                animateToggle(view)
            }
        }
    }

    private fun checkOverlayPrerequisites(): Boolean {
        if (!PortalAccessibilityService.isRunning()) {
            Toast.makeText(this, "Please enable Accessibility Service first", Toast.LENGTH_SHORT).show()
            return false
        }

        if (!Settings.canDrawOverlays(this)) {
            Toast.makeText(this, "Please grant Overlay permission first", Toast.LENGTH_SHORT).show()
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:$packageName")
            )
            startActivity(intent)
            return false
        }

        return true
    }

    private fun startOverlayService(action: String) {
        val intent = Intent(this, OverlayService::class.java).apply {
            this.action = action
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    private fun updateStorageInfo() {
        val screenshotDir = File(cacheDir, "event_screenshots")
        if (screenshotDir.exists()) {
            val files = screenshotDir.listFiles() ?: emptyArray()
            val fileCount = files.size
            val totalSize = files.sumOf { it.length() }
            val sizeMB = totalSize / (1024.0 * 1024.0)

            binding.tvScreenshotCount.text = String.format("%d files • %.1f MB", fileCount, sizeMB)
        } else {
            binding.tvScreenshotCount.text = "0 files • 0 MB"
        }
    }

    private fun confirmClearScreenshots() {
        val screenshotDir = File(cacheDir, "event_screenshots")
        val fileCount = screenshotDir.listFiles()?.size ?: 0

        MaterialAlertDialogBuilder(this)
            .setTitle("Clear Screenshots")
            .setMessage("Delete all $fileCount screenshots? This action cannot be undone.")
            .setNegativeButton("Cancel", null)
            .setPositiveButton("Clear") { _, _ ->
                ScreenshotManager.clearAllScreenshots(this)
                updateStorageInfo()
                Toast.makeText(this, "Screenshots cleared", Toast.LENGTH_SHORT).show()
            }
            .show()
    }

    private fun testPythonConnection() {
        val url = binding.etBackendUrl.text.toString().trim()

        if (url.isEmpty()) {
            Toast.makeText(this, "Please enter backend URL first", Toast.LENGTH_SHORT).show()
            return
        }

        binding.btnTestConnection.isEnabled = false
        binding.btnTestConnection.text = "Testing..."

        // Test connection in background thread
        Thread {
            try {
                val client = okhttp3.OkHttpClient.Builder()
                    .connectTimeout(5, java.util.concurrent.TimeUnit.SECONDS)
                    .build()

                val request = okhttp3.Request.Builder()
                    .url("$url/api/ping")
                    .get()
                    .build()

                val response = client.newCall(request).execute()

                runOnUiThread {
                    binding.btnTestConnection.isEnabled = true
                    binding.btnTestConnection.text = "Test Connection"

                    if (response.isSuccessful) {
                        Toast.makeText(this, "✓ Connection successful!", Toast.LENGTH_SHORT).show()
                    } else {
                        Toast.makeText(this, "✗ Connection failed: ${response.code}", Toast.LENGTH_LONG).show()
                    }
                }
            } catch (e: Exception) {
                runOnUiThread {
                    binding.btnTestConnection.isEnabled = true
                    binding.btnTestConnection.text = "Test Connection"
                    Toast.makeText(this, "✗ Connection error: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }.start()
    }

    private fun exportSettings() {
        val settings = mapOf(
            KEY_AUTO_SCREENSHOT to prefs.getBoolean(KEY_AUTO_SCREENSHOT, DEFAULT_AUTO_SCREENSHOT),
            KEY_SCREENSHOT_QUALITY to prefs.getInt(KEY_SCREENSHOT_QUALITY, DEFAULT_SCREENSHOT_QUALITY),
            KEY_MAX_EVENTS to prefs.getInt(KEY_MAX_EVENTS, DEFAULT_MAX_EVENTS),
            KEY_VOLUME_SHORTCUTS to prefs.getBoolean(KEY_VOLUME_SHORTCUTS, DEFAULT_VOLUME_SHORTCUTS),
            KEY_AUTO_UPLOAD to prefs.getBoolean(KEY_AUTO_UPLOAD, DEFAULT_AUTO_UPLOAD),
            KEY_PYTHON_BACKEND_URL to prefs.getString(KEY_PYTHON_BACKEND_URL, DEFAULT_PYTHON_BACKEND_URL)
        )

        val json = com.google.gson.Gson().toJson(settings)

        // Copy to clipboard
        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
        val clip = android.content.ClipData.newPlainText("Settings", json)
        clipboard.setPrimaryClip(clip)

        Toast.makeText(this, "Settings exported to clipboard", Toast.LENGTH_SHORT).show()
    }

    private fun confirmResetDefaults() {
        MaterialAlertDialogBuilder(this)
            .setTitle("Reset to Defaults")
            .setMessage("Reset all settings to default values?")
            .setNegativeButton("Cancel", null)
            .setPositiveButton("Reset") { _, _ ->
                resetToDefaults()
            }
            .show()
    }

    private fun resetToDefaults() {
        prefs.edit().clear().apply()

        // Reset UI
        loadSettings()

        // Apply to managers
        RecordingManager.setScreenshotEnabled(DEFAULT_AUTO_SCREENSHOT)

        Toast.makeText(this, "Settings reset to defaults", Toast.LENGTH_SHORT).show()
    }

    private fun animateToggle(view: android.view.View) {
        view.animate()
            .scaleX(1.05f)
            .scaleY(1.05f)
            .setDuration(100)
            .withEndAction {
                view.animate()
                    .scaleX(1f)
                    .scaleY(1f)
                    .setDuration(100)
                    .start()
            }
            .start()
    }
}
