package com.agent.portal

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.inputmethod.InputMethodManager
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.agent.portal.accessibility.PortalAccessibilityService
import com.agent.portal.databinding.ActivityMainBinding
import com.agent.portal.overlay.OverlayService
import com.agent.portal.server.HttpServerService

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
        updateStatus()
    }

    override fun onResume() {
        super.onResume()
        updateStatus()
    }

    private fun setupUI() {
        // Accessibility button
        binding.btnAccessibility.setOnClickListener {
            if (!PortalAccessibilityService.isRunning()) {
                openAccessibilitySettings()
            } else {
                Toast.makeText(this, "Accessibility is already enabled", Toast.LENGTH_SHORT).show()
            }
        }

        // Server button
        binding.btnServer.setOnClickListener {
            if (!HttpServerService.isRunning()) {
                startService(Intent(this, HttpServerService::class.java))
                Toast.makeText(this, "Server started on port 8080", Toast.LENGTH_SHORT).show()
            } else {
                stopService(Intent(this, HttpServerService::class.java))
                Toast.makeText(this, "Server stopped", Toast.LENGTH_SHORT).show()
            }
            updateStatus()
        }

        // Keyboard button
        binding.btnKeyboard.setOnClickListener {
            if (!isKeyboardEnabled()) {
                openKeyboardSettings()
            } else if (!isKeyboardSelected()) {
                showInputMethodPicker()
            } else {
                Toast.makeText(this, "Keyboard is already enabled", Toast.LENGTH_SHORT).show()
            }
        }

        // Overlay permission button
        binding.btnOverlay.setOnClickListener {
            if (!Settings.canDrawOverlays(this)) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:$packageName")
                )
                startActivity(intent)
            } else {
                Toast.makeText(this, "Overlay permission already granted", Toast.LENGTH_SHORT).show()
            }
        }

        // Bounds toggle switch
        binding.switchBounds.setOnCheckedChangeListener { _, isChecked ->
            handleBoundsToggle(isChecked)
        }

        // Indexes toggle switch
        binding.switchIndexes.setOnCheckedChangeListener { _, isChecked ->
            handleIndexesToggle(isChecked)
        }

        // Refresh button
        binding.btnRefresh.setOnClickListener {
            updateStatus()
            Toast.makeText(this, "Status refreshed", Toast.LENGTH_SHORT).show()
        }
    }

    private fun handleBoundsToggle(enabled: Boolean) {
        if (!checkOverlayPrerequisites()) {
            binding.switchBounds.isChecked = false
            return
        }

        if (enabled) {
            startOverlayService(OverlayService.Actions.SHOW_BOUNDS)
        } else {
            startOverlayService(OverlayService.Actions.HIDE_BOUNDS)
        }
    }

    private fun handleIndexesToggle(enabled: Boolean) {
        if (!checkOverlayPrerequisites()) {
            binding.switchIndexes.isChecked = false
            return
        }

        if (enabled) {
            startOverlayService(OverlayService.Actions.SHOW_INDEXES)
        } else {
            startOverlayService(OverlayService.Actions.HIDE_INDEXES)
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

    private fun updateStatus() {
        // Accessibility status
        val a11yEnabled = PortalAccessibilityService.isRunning()
        binding.statusAccessibility.text = if (a11yEnabled) "Running" else "Disabled"
        binding.indicatorAccessibility.setBackgroundResource(
            if (a11yEnabled) R.drawable.status_indicator_on else R.drawable.status_indicator_off
        )
        binding.btnAccessibility.text = if (a11yEnabled) "Enabled" else "Enable"

        // Server status
        val serverRunning = HttpServerService.isRunning()
        binding.statusServer.text = if (serverRunning) "Running on port 8080" else "Stopped"
        binding.indicatorServer.setBackgroundResource(
            if (serverRunning) R.drawable.status_indicator_on else R.drawable.status_indicator_off
        )
        binding.btnServer.text = if (serverRunning) "Stop" else "Start"

        // Keyboard status
        val keyboardEnabled = isKeyboardEnabled()
        val keyboardSelected = isKeyboardSelected()
        binding.statusKeyboard.text = when {
            keyboardSelected -> "Active"
            keyboardEnabled -> "Enabled (not selected)"
            else -> "Disabled"
        }
        binding.indicatorKeyboard.setBackgroundResource(
            when {
                keyboardSelected -> R.drawable.status_indicator_on
                keyboardEnabled -> R.drawable.status_indicator_warning
                else -> R.drawable.status_indicator_off
            }
        )
        binding.btnKeyboard.text = when {
            keyboardSelected -> "Active"
            keyboardEnabled -> "Select"
            else -> "Enable"
        }

        // Overlay status
        val overlayEnabled = Settings.canDrawOverlays(this)
        binding.statusOverlay.text = if (overlayEnabled) "Granted" else "Required"
        binding.indicatorOverlay.setBackgroundResource(
            if (overlayEnabled) R.drawable.status_indicator_on else R.drawable.status_indicator_off
        )
        binding.btnOverlay.text = if (overlayEnabled) "Granted" else "Grant"

        // Update switch states
        binding.switchBounds.isChecked = OverlayService.showBounds
        binding.switchIndexes.isChecked = OverlayService.showIndexes

        // Disable switches if prerequisites not met
        val canUseOverlay = a11yEnabled && overlayEnabled
        binding.switchBounds.isEnabled = canUseOverlay
        binding.switchIndexes.isEnabled = canUseOverlay
    }

    private fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        startActivity(intent)
        Toast.makeText(
            this,
            "Please enable 'Agent Portal' accessibility service",
            Toast.LENGTH_LONG
        ).show()
    }

    private fun openKeyboardSettings() {
        val intent = Intent(Settings.ACTION_INPUT_METHOD_SETTINGS)
        startActivity(intent)
        Toast.makeText(
            this,
            "Please enable 'Agent Portal Keyboard'",
            Toast.LENGTH_LONG
        ).show()
    }

    private fun showInputMethodPicker() {
        val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        imm.showInputMethodPicker()
    }

    private fun isKeyboardEnabled(): Boolean {
        val enabledMethods = Settings.Secure.getString(
            contentResolver,
            Settings.Secure.ENABLED_INPUT_METHODS
        ) ?: return false

        return enabledMethods.contains("com.agent.portal/.keyboard.PortalKeyboardIME")
    }

    private fun isKeyboardSelected(): Boolean {
        val selectedMethod = Settings.Secure.getString(
            contentResolver,
            Settings.Secure.DEFAULT_INPUT_METHOD
        ) ?: return false

        return selectedMethod.contains("com.agent.portal/.keyboard.PortalKeyboardIME")
    }
}
