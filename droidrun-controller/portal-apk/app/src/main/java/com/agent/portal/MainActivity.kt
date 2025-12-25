package com.agent.portal

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.agent.portal.accessibility.PortalAccessibilityService
import com.agent.portal.databinding.ActivityMainBinding
import com.agent.portal.overlay.OverlayService
import com.agent.portal.server.HttpServerService

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    // Track previous states for animation optimization
    private var prevA11yEnabled: Boolean? = null
    private var prevServerRunning: Boolean? = null
    private var prevKeyboardState: Int? = null // 0=disabled, 1=enabled, 2=selected
    private var prevOverlayEnabled: Boolean? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupStatusIndicators()
        setupUI()
        updateStatus()
    }

    /**
     * Initialize status indicators with the animated drawable.
     * This uses a StateListDrawable with enterFadeDuration/exitFadeDuration
     * for smooth 200ms cross-fade transitions between states.
     */
    private fun setupStatusIndicators() {
        // Set the animated drawable on all status indicators
        binding.indicatorAccessibility.setBackgroundResource(R.drawable.status_indicator_animated)
        binding.indicatorServer.setBackgroundResource(R.drawable.status_indicator_animated)
        binding.indicatorKeyboard.setBackgroundResource(R.drawable.status_indicator_animated)
        binding.indicatorOverlay.setBackgroundResource(R.drawable.status_indicator_animated)
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
        updateIndicatorState(binding.indicatorAccessibility, a11yEnabled, false)
        binding.btnAccessibility.text = if (a11yEnabled) "Enabled" else "Enable"
        prevA11yEnabled = a11yEnabled

        // Server status
        val serverRunning = HttpServerService.isRunning()
        binding.statusServer.text = if (serverRunning) "Running on port 8080" else "Stopped"
        updateIndicatorState(binding.indicatorServer, serverRunning, false)
        binding.btnServer.text = if (serverRunning) "Stop" else "Start"
        prevServerRunning = serverRunning

        // Keyboard status
        val keyboardEnabled = isKeyboardEnabled()
        val keyboardSelected = isKeyboardSelected()
        binding.statusKeyboard.text = when {
            keyboardSelected -> "Active"
            keyboardEnabled -> "Enabled (not selected)"
            else -> "Disabled"
        }
        // Keyboard uses warning state when enabled but not selected
        updateIndicatorState(binding.indicatorKeyboard, keyboardSelected, keyboardEnabled && !keyboardSelected)
        binding.btnKeyboard.text = when {
            keyboardSelected -> "Active"
            keyboardEnabled -> "Select"
            else -> "Enable"
        }
        prevKeyboardState = when {
            keyboardSelected -> 2
            keyboardEnabled -> 1
            else -> 0
        }

        // Overlay status
        val overlayEnabled = Settings.canDrawOverlays(this)
        binding.statusOverlay.text = if (overlayEnabled) "Granted" else "Required"
        updateIndicatorState(binding.indicatorOverlay, overlayEnabled, false)
        binding.btnOverlay.text = if (overlayEnabled) "Granted" else "Grant"
        prevOverlayEnabled = overlayEnabled

        // Update switch states
        binding.switchBounds.isChecked = OverlayService.showBounds
        binding.switchIndexes.isChecked = OverlayService.showIndexes

        // Disable switches if prerequisites not met
        val canUseOverlay = a11yEnabled && overlayEnabled
        binding.switchBounds.isEnabled = canUseOverlay
        binding.switchIndexes.isEnabled = canUseOverlay
    }

    /**
     * Updates the state of a status indicator view to trigger animated transitions.
     *
     * The status_indicator_animated.xml StateListDrawable uses these view states:
     * - state_enabled=true + state_activated=true: On/Active (green)
     * - state_focused=true: Warning (yellow)
     * - default: Off/Inactive (red)
     *
     * The StateListDrawable has 200ms enter/exit fade durations for smooth cross-fade
     * transitions between states following Material Design guidelines.
     *
     * @param indicator The indicator view to update
     * @param isActive Whether the indicator should show as active/on (green)
     * @param isWarning Whether the indicator should show as warning (yellow)
     */
    private fun updateIndicatorState(indicator: View, isActive: Boolean, isWarning: Boolean) {
        // Update view states to trigger the StateListDrawable transition
        indicator.isEnabled = true
        indicator.isActivated = isActive && !isWarning
        indicator.isFocusable = isWarning

        // For warning state, we need to set focusable AND trigger focus state
        // The StateListDrawable checks state_focused for warning display
        if (isWarning) {
            indicator.isFocusableInTouchMode = true
            indicator.requestFocus()
        } else {
            indicator.isFocusableInTouchMode = false
            indicator.clearFocus()
        }

        // Force drawable state refresh to trigger animation
        indicator.refreshDrawableState()
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
