package com.agent.portal

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.MotionEvent
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.DecelerateInterpolator
import android.view.animation.LinearInterpolator
import android.view.animation.OvershootInterpolator
import android.view.inputmethod.InputMethodManager
import android.widget.CompoundButton
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.agent.portal.accessibility.PortalAccessibilityService
import com.agent.portal.databinding.ActivityMainBinding
import com.agent.portal.overlay.OverlayService
import com.agent.portal.server.HttpServerService

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    // Handler for delayed operations
    private val handler = Handler(Looper.getMainLooper())

    // Track refreshing state for loading animations
    private var isRefreshing = false
    private var refreshAnimator: ObjectAnimator? = null

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
        setupMicroAnimations()
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

    override fun onDestroy() {
        super.onDestroy()
        // Clean up handler callbacks to prevent memory leaks
        handler.removeCallbacksAndMessages(null)
        refreshAnimator?.cancel()
        refreshAnimator = null
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

        // Bounds toggle switch with bounce animation
        animateSwitchToggle(binding.switchBounds) { isChecked ->
            handleBoundsToggle(isChecked)
        }

        // Indexes toggle switch with bounce animation
        animateSwitchToggle(binding.switchIndexes) { isChecked ->
            handleIndexesToggle(isChecked)
        }

        // Refresh button with loading animation
        binding.btnRefresh.setOnClickListener {
            refreshStatusWithAnimation()
        }
    }

    /**
     * Performs a status refresh with visual loading feedback.
     * Shows rotation animation on the refresh button and "Checking..." text on status items
     * before revealing the actual status values.
     */
    private fun refreshStatusWithAnimation() {
        if (isRefreshing) return // Prevent double-refresh

        isRefreshing = true

        // Start refresh button rotation animation
        startRefreshButtonAnimation()

        // Show loading state on all status items
        showLoadingState()

        // Delay before showing actual status (gives visual feedback)
        handler.postDelayed({
            // Stop refresh animation
            stopRefreshButtonAnimation()

            // Update status with animations
            updateStatus()

            isRefreshing = false
        }, REFRESH_DELAY)
    }

    /**
     * Shows loading state on all status text views.
     * Displays "Checking..." to indicate status is being refreshed.
     */
    private fun showLoadingState() {
        val loadingText = "Checking..."

        binding.statusAccessibility.text = loadingText
        binding.statusServer.text = loadingText
        binding.statusKeyboard.text = loadingText
        binding.statusOverlay.text = loadingText

        // Animate indicators to a subtle pulsing state
        animateLoadingIndicators()
    }

    /**
     * Animates all status indicators with a subtle pulse during loading.
     */
    private fun animateLoadingIndicators() {
        val indicators = listOf(
            binding.indicatorAccessibility,
            binding.indicatorServer,
            binding.indicatorKeyboard,
            binding.indicatorOverlay
        )

        indicators.forEachIndexed { index, indicator ->
            // Stagger the animations slightly for a wave effect
            val startDelay = index * 50L

            indicator.animate()
                .alpha(0.5f)
                .setStartDelay(startDelay)
                .setDuration(ANIMATION_DURATION_SHORT)
                .setInterpolator(AccelerateDecelerateInterpolator())
                .start()
        }
    }

    /**
     * Starts a continuous rotation animation on the refresh button icon.
     */
    private fun startRefreshButtonAnimation() {
        // Disable the button during refresh
        binding.btnRefresh.isEnabled = false
        binding.btnRefresh.text = "Refreshing..."

        // Create rotation animation for the icon
        refreshAnimator = ObjectAnimator.ofFloat(binding.btnRefresh, View.ROTATION, 0f, 360f).apply {
            duration = ROTATION_DURATION
            repeatCount = ValueAnimator.INFINITE
            interpolator = LinearInterpolator()
            start()
        }
    }

    /**
     * Stops the refresh button rotation animation and resets state.
     */
    private fun stopRefreshButtonAnimation() {
        refreshAnimator?.cancel()
        refreshAnimator = null

        // Reset button rotation and state
        binding.btnRefresh.rotation = 0f
        binding.btnRefresh.isEnabled = true
        binding.btnRefresh.text = "Refresh Status"

        // Restore indicator alphas
        listOf(
            binding.indicatorAccessibility,
            binding.indicatorServer,
            binding.indicatorKeyboard,
            binding.indicatorOverlay
        ).forEach { indicator ->
            indicator.animate()
                .alpha(1f)
                .setDuration(ANIMATION_DURATION_SHORT)
                .setInterpolator(AccelerateDecelerateInterpolator())
                .start()
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
        updateStatusAnimated(animate = true)
    }

    /**
     * Updates all status indicators, text, and buttons with optional animations.
     *
     * @param animate Whether to apply smooth animations to changes (default: true)
     */
    private fun updateStatusAnimated(animate: Boolean) {
        // Accessibility status
        val a11yEnabled = PortalAccessibilityService.isRunning()
        val a11yStatusText = if (a11yEnabled) "Running" else "Disabled"
        val a11yButtonText = if (a11yEnabled) "Enabled" else "Enable"
        val a11yTextColor = if (a11yEnabled) R.color.status_on else R.color.status_off
        val shouldAnimateA11y = animate && prevA11yEnabled != null && prevA11yEnabled != a11yEnabled

        if (shouldAnimateA11y) {
            animateStatusText(binding.statusAccessibility, a11yStatusText, a11yTextColor)
            animateButtonText(binding.btnAccessibility, a11yButtonText)
        } else {
            binding.statusAccessibility.text = a11yStatusText
            binding.statusAccessibility.setTextColor(ContextCompat.getColor(this, a11yTextColor))
            binding.btnAccessibility.text = a11yButtonText
        }
        updateIndicatorState(binding.indicatorAccessibility, a11yEnabled, false, shouldAnimateA11y)
        prevA11yEnabled = a11yEnabled

        // Server status
        val serverRunning = HttpServerService.isRunning()
        val serverStatusText = if (serverRunning) "Running on port 8080" else "Stopped"
        val serverButtonText = if (serverRunning) "Stop" else "Start"
        val serverTextColor = if (serverRunning) R.color.status_on else R.color.status_off
        val shouldAnimateServer = animate && prevServerRunning != null && prevServerRunning != serverRunning

        if (shouldAnimateServer) {
            animateStatusText(binding.statusServer, serverStatusText, serverTextColor)
            animateButtonText(binding.btnServer, serverButtonText)
        } else {
            binding.statusServer.text = serverStatusText
            binding.statusServer.setTextColor(ContextCompat.getColor(this, serverTextColor))
            binding.btnServer.text = serverButtonText
        }
        updateIndicatorState(binding.indicatorServer, serverRunning, false, shouldAnimateServer)
        prevServerRunning = serverRunning

        // Keyboard status
        val keyboardEnabled = isKeyboardEnabled()
        val keyboardSelected = isKeyboardSelected()
        val keyboardStatusText = when {
            keyboardSelected -> "Active"
            keyboardEnabled -> "Enabled (not selected)"
            else -> "Disabled"
        }
        val keyboardButtonText = when {
            keyboardSelected -> "Active"
            keyboardEnabled -> "Select"
            else -> "Enable"
        }
        val keyboardTextColor = when {
            keyboardSelected -> R.color.status_on
            keyboardEnabled -> R.color.status_warning
            else -> R.color.status_off
        }
        val currentKeyboardState = when {
            keyboardSelected -> 2
            keyboardEnabled -> 1
            else -> 0
        }
        val shouldAnimateKeyboard = animate && prevKeyboardState != null && prevKeyboardState != currentKeyboardState

        if (shouldAnimateKeyboard) {
            animateStatusText(binding.statusKeyboard, keyboardStatusText, keyboardTextColor)
            animateButtonText(binding.btnKeyboard, keyboardButtonText)
        } else {
            binding.statusKeyboard.text = keyboardStatusText
            binding.statusKeyboard.setTextColor(ContextCompat.getColor(this, keyboardTextColor))
            binding.btnKeyboard.text = keyboardButtonText
        }
        // Keyboard uses warning state when enabled but not selected
        updateIndicatorState(
            binding.indicatorKeyboard,
            keyboardSelected,
            keyboardEnabled && !keyboardSelected,
            shouldAnimateKeyboard
        )
        prevKeyboardState = currentKeyboardState

        // Overlay status
        val overlayEnabled = Settings.canDrawOverlays(this)
        val overlayStatusText = if (overlayEnabled) "Granted" else "Required"
        val overlayButtonText = if (overlayEnabled) "Granted" else "Grant"
        val overlayTextColor = if (overlayEnabled) R.color.status_on else R.color.status_off
        val shouldAnimateOverlay = animate && prevOverlayEnabled != null && prevOverlayEnabled != overlayEnabled

        if (shouldAnimateOverlay) {
            animateStatusText(binding.statusOverlay, overlayStatusText, overlayTextColor)
            animateButtonText(binding.btnOverlay, overlayButtonText)
        } else {
            binding.statusOverlay.text = overlayStatusText
            binding.statusOverlay.setTextColor(ContextCompat.getColor(this, overlayTextColor))
            binding.btnOverlay.text = overlayButtonText
        }
        updateIndicatorState(binding.indicatorOverlay, overlayEnabled, false, shouldAnimateOverlay)
        prevOverlayEnabled = overlayEnabled

        // Update switch states
        binding.switchBounds.isChecked = OverlayService.showBounds
        binding.switchIndexes.isChecked = OverlayService.showIndexes

        // Disable switches if prerequisites not met
        val canUseOverlay = a11yEnabled && overlayEnabled
        binding.switchBounds.isEnabled = canUseOverlay
        binding.switchIndexes.isEnabled = canUseOverlay
    }

    companion object {
        /** Animation duration for status transitions (Material Design standard) */
        private const val ANIMATION_DURATION = 250L
        /** Short animation duration for quick feedback */
        private const val ANIMATION_DURATION_SHORT = 150L
        /** Very short animation for immediate touch feedback */
        private const val ANIMATION_DURATION_MICRO = 100L
        /** Scale factor for indicator pulse animation */
        private const val PULSE_SCALE = 1.15f
        /** Scale factor for button press animation (slightly shrinks) */
        private const val BUTTON_PRESS_SCALE = 0.96f
        /** Scale factor for switch toggle bounce animation */
        private const val SWITCH_BOUNCE_SCALE = 1.05f
        /** Delay before showing actual status after refresh animation starts */
        private const val REFRESH_DELAY = 500L
        /** Duration for one full rotation of the refresh button */
        private const val ROTATION_DURATION = 800L
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
     * Additionally, a scale pulse animation is applied when the state changes
     * to provide visual feedback and draw attention to the status change.
     *
     * @param indicator The indicator view to update
     * @param isActive Whether the indicator should show as active/on (green)
     * @param isWarning Whether the indicator should show as warning (yellow)
     * @param animate Whether to apply pulse animation (default: true)
     */
    private fun updateIndicatorState(
        indicator: View,
        isActive: Boolean,
        isWarning: Boolean,
        animate: Boolean = true
    ) {
        // Determine current state for change detection
        val wasActive = indicator.isActivated
        val wasFocused = indicator.isFocusable

        // Check if state is actually changing
        val stateChanged = (wasActive != (isActive && !isWarning)) || (wasFocused != isWarning)

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

        // Apply pulse animation on state change for visual feedback
        if (animate && stateChanged) {
            animateIndicatorPulse(indicator)
        }
    }

    /**
     * Applies a subtle scale pulse animation to an indicator view.
     * The animation scales up slightly then returns to normal size
     * with a smooth overshoot interpolator for a bouncy feel.
     */
    private fun animateIndicatorPulse(view: View) {
        // Cancel any existing animations
        view.animate().cancel()

        // Create scale up animation
        val scaleUpX = ObjectAnimator.ofFloat(view, View.SCALE_X, 1f, PULSE_SCALE)
        val scaleUpY = ObjectAnimator.ofFloat(view, View.SCALE_Y, 1f, PULSE_SCALE)

        // Create scale down animation with overshoot for bouncy feel
        val scaleDownX = ObjectAnimator.ofFloat(view, View.SCALE_X, PULSE_SCALE, 1f)
        val scaleDownY = ObjectAnimator.ofFloat(view, View.SCALE_Y, PULSE_SCALE, 1f)

        // Configure scale up
        val scaleUp = AnimatorSet().apply {
            playTogether(scaleUpX, scaleUpY)
            duration = ANIMATION_DURATION_SHORT
            interpolator = AccelerateDecelerateInterpolator()
        }

        // Configure scale down with overshoot
        val scaleDown = AnimatorSet().apply {
            playTogether(scaleDownX, scaleDownY)
            duration = ANIMATION_DURATION
            interpolator = OvershootInterpolator(1.5f)
        }

        // Play sequentially: scale up then down
        AnimatorSet().apply {
            playSequentially(scaleUp, scaleDown)
            start()
        }
    }

    /**
     * Animates a status text view when its content changes.
     * Uses a fade out -> change text -> fade in pattern for smooth transitions.
     *
     * @param textView The TextView to animate
     * @param newText The new text to set
     * @param newColorRes Optional new color resource to apply (null to keep current)
     */
    private fun animateStatusText(textView: TextView, newText: String, newColorRes: Int? = null) {
        // Skip animation if text hasn't changed
        if (textView.text.toString() == newText) {
            newColorRes?.let { textView.setTextColor(ContextCompat.getColor(this, it)) }
            return
        }

        // Fade out
        textView.animate()
            .alpha(0f)
            .setDuration(ANIMATION_DURATION_SHORT)
            .setInterpolator(AccelerateDecelerateInterpolator())
            .withEndAction {
                // Update text and color
                textView.text = newText
                newColorRes?.let { textView.setTextColor(ContextCompat.getColor(this, it)) }

                // Fade in
                textView.animate()
                    .alpha(1f)
                    .setDuration(ANIMATION_DURATION_SHORT)
                    .setInterpolator(AccelerateDecelerateInterpolator())
                    .start()
            }
            .start()
    }

    /**
     * Animates a button's text change with a subtle scale effect.
     *
     * @param view The button view to animate
     * @param newText The new text to set
     */
    private fun animateButtonText(view: View, newText: String) {
        if (view is com.google.android.material.button.MaterialButton) {
            if (view.text.toString() == newText) return

            view.animate()
                .scaleX(0.95f)
                .scaleY(0.95f)
                .alpha(0.7f)
                .setDuration(ANIMATION_DURATION_SHORT)
                .setInterpolator(AccelerateDecelerateInterpolator())
                .withEndAction {
                    view.text = newText
                    view.animate()
                        .scaleX(1f)
                        .scaleY(1f)
                        .alpha(1f)
                        .setDuration(ANIMATION_DURATION_SHORT)
                        .setInterpolator(OvershootInterpolator(1.2f))
                        .start()
                }
                .start()
        }
    }

    /**
     * Applies a touch listener to a button for press/release micro-animations.
     * Creates a subtle scale-down effect on press and scale-up on release
     * for immediate tactile feedback.
     *
     * @param view The button view to apply touch animations to
     */
    @SuppressLint("ClickableViewAccessibility")
    private fun applyButtonTouchAnimation(view: View) {
        view.setOnTouchListener { v, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    // Scale down on press for tactile feedback
                    v.animate()
                        .scaleX(BUTTON_PRESS_SCALE)
                        .scaleY(BUTTON_PRESS_SCALE)
                        .setDuration(ANIMATION_DURATION_MICRO)
                        .setInterpolator(DecelerateInterpolator())
                        .start()
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    // Scale back up with overshoot for bouncy feel
                    v.animate()
                        .scaleX(1f)
                        .scaleY(1f)
                        .setDuration(ANIMATION_DURATION_SHORT)
                        .setInterpolator(OvershootInterpolator(2f))
                        .start()
                }
            }
            // Return false to allow the click listener to still work
            false
        }
    }

    /**
     * Creates a custom OnCheckedChangeListener that adds bounce animation
     * to switch toggles for enhanced visual feedback.
     *
     * @param view The switch view to animate
     * @param originalAction The original action to perform on check change
     */
    private fun animateSwitchToggle(view: CompoundButton, originalAction: (Boolean) -> Unit) {
        view.setOnCheckedChangeListener { buttonView, isChecked ->
            // Apply bounce animation
            buttonView.animate()
                .scaleX(SWITCH_BOUNCE_SCALE)
                .scaleY(SWITCH_BOUNCE_SCALE)
                .setDuration(ANIMATION_DURATION_MICRO)
                .setInterpolator(DecelerateInterpolator())
                .withEndAction {
                    buttonView.animate()
                        .scaleX(1f)
                        .scaleY(1f)
                        .setDuration(ANIMATION_DURATION_SHORT)
                        .setInterpolator(OvershootInterpolator(2f))
                        .start()
                }
                .start()

            // Execute the original action
            originalAction(isChecked)
        }
    }

    /**
     * Sets up micro-animations for all interactive buttons and switches.
     * Applies touch feedback animations to buttons and bounce animations to switches.
     */
    private fun setupMicroAnimations() {
        // Apply touch animations to all action buttons
        applyButtonTouchAnimation(binding.btnAccessibility)
        applyButtonTouchAnimation(binding.btnServer)
        applyButtonTouchAnimation(binding.btnKeyboard)
        applyButtonTouchAnimation(binding.btnOverlay)
        applyButtonTouchAnimation(binding.btnRefresh)

        // Note: Switch animations are set up in setupUI() via animateSwitchToggle()
        // to preserve the original functionality while adding visual feedback
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
