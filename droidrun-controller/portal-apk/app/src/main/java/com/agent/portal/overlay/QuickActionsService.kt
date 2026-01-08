package com.agent.portal.overlay

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.Settings
import android.util.DisplayMetrics
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.VelocityTracker
import android.view.View
import android.view.WindowManager
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.Animation
import android.view.animation.AnimationUtils
import android.view.animation.OvershootInterpolator
import androidx.core.app.NotificationCompat
import com.agent.portal.MainActivity
import com.agent.portal.R
import com.agent.portal.accessibility.AccessibilityShortcutHelper
import com.agent.portal.accessibility.PortalAccessibilityService
import com.agent.portal.databinding.LayoutQuickActionsBinding
import com.agent.portal.databinding.LayoutQuickActionsBubbleBinding
import com.agent.portal.recording.RecordingManager
import kotlin.math.abs

/**
 * Service that shows a floating Quick Actions panel for common shortcuts.
 * 
 * Features:
 * - Starts as a small bubble in corner (collapsed mode)
 * - Tap bubble to expand full panel
 * - Draggable floating panel and bubble
 * - Haptic feedback on button taps
 * - Button scale animations
 * - Swipe to dismiss gesture
 * - Pulse animation for recording state
 * - Auto-collapse after action (optional)
 */
class QuickActionsService : Service() {

    companion object {
        private const val TAG = "QuickActionsService"
        private const val NOTIFICATION_ID = 3001
        private const val CHANNEL_ID = "quick_actions_channel"

        // Swipe threshold for dismissing panel
        private const val SWIPE_THRESHOLD = 150f
        private const val SWIPE_VELOCITY_THRESHOLD = 500f

        // Bubble margin from screen edge
        private const val BUBBLE_MARGIN = 16

        const val ACTION_SHOW = "com.agent.portal.SHOW_QUICK_ACTIONS"
        const val ACTION_HIDE = "com.agent.portal.HIDE_QUICK_ACTIONS"
        const val ACTION_TOGGLE = "com.agent.portal.TOGGLE_QUICK_ACTIONS"

        @Volatile
        private var instance: QuickActionsService? = null

        fun isRunning(): Boolean = instance != null
        fun isVisible(): Boolean = instance?.isQuickActionsVisible ?: false
    }

    private var windowManager: WindowManager? = null
    
    // Bubble (collapsed state)
    private var bubbleBinding: LayoutQuickActionsBubbleBinding? = null
    private var bubbleParams: WindowManager.LayoutParams? = null
    
    // Full panel (expanded state)
    private var panelBinding: LayoutQuickActionsBinding? = null
    private var panelParams: WindowManager.LayoutParams? = null
    
    private var isQuickActionsVisible = false
    private var isExpanded = false  // Track if panel is expanded or collapsed (bubble)

    private val handler = Handler(Looper.getMainLooper())
    private var vibrator: Vibrator? = null
    private var pulseAnimation: Animation? = null

    // For dragging and swipe detection
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var velocityTracker: VelocityTracker? = null
    private var isDragging = false
    private var lastClickTime = 0L

    // Screen dimensions
    private var screenWidth = 0
    private var screenHeight = 0

    override fun onCreate() {
        super.onCreate()
        instance = this
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        vibrator = getVibratorService()
        createNotificationChannel()
        getScreenDimensions()
    }

    private fun getScreenDimensions() {
        val displayMetrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        windowManager?.defaultDisplay?.getMetrics(displayMetrics)
        screenWidth = displayMetrics.widthPixels
        screenHeight = displayMetrics.heightPixels
    }

    private fun getVibratorService(): Vibrator {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_SHOW -> showQuickActions()
            ACTION_HIDE -> hideQuickActions()
            ACTION_TOGGLE -> toggleQuickActions()
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        stopPulseAnimation()
        hideQuickActions()
        instance = null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Quick Actions",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Quick actions overlay"
                setShowBadge(false)
            }
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Quick Actions")
            .setContentText("Tap bubble to expand")
            .setSmallIcon(R.drawable.ic_record)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun toggleQuickActions() {
        if (isQuickActionsVisible) {
            hideQuickActions()
        } else {
            showQuickActions()
        }
    }

    /**
     * Show the Quick Actions - starts in collapsed (bubble) mode
     */
    private fun showQuickActions() {
        if (isQuickActionsVisible) return

        if (!Settings.canDrawOverlays(this)) {
            Log.e(TAG, "Overlay permission not granted")
            return
        }

        startForeground(NOTIFICATION_ID, createNotification())

        try {
            showBubble()
            isQuickActionsVisible = true
            isExpanded = false
            Log.i(TAG, "Quick Actions shown (bubble mode)")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to show quick actions", e)
        }
    }

    /**
     * Show the collapsed bubble
     */
    private fun showBubble() {
        bubbleBinding = LayoutQuickActionsBubbleBinding.inflate(LayoutInflater.from(this))

        bubbleParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else
                WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            // Position at bottom-right corner
            x = screenWidth - dpToPx(70)
            y = screenHeight / 2
        }

        setupBubbleTouchListener()
        updateBubbleRecordingState()

        windowManager?.addView(bubbleBinding?.root, bubbleParams)

        // Animate in
        bubbleBinding?.root?.alpha = 0f
        bubbleBinding?.root?.scaleX = 0.5f
        bubbleBinding?.root?.scaleY = 0.5f
        bubbleBinding?.root?.animate()
            ?.alpha(1f)
            ?.scaleX(1f)
            ?.scaleY(1f)
            ?.setDuration(200)
            ?.setInterpolator(OvershootInterpolator(1.5f))
            ?.start()
    }

    /**
     * Update bubble appearance based on recording state
     */
    private fun updateBubbleRecordingState() {
        val isRecording = RecordingManager.getState() == RecordingManager.RecordingState.RECORDING
        
        if (isRecording) {
            bubbleBinding?.ivBubbleIcon?.setImageResource(R.drawable.ic_stop_circle)
            bubbleBinding?.bubbleContainer?.setBackgroundResource(R.drawable.bg_quick_action_bubble_recording)
        } else {
            bubbleBinding?.ivBubbleIcon?.setImageResource(R.drawable.ic_grid_actions)
            bubbleBinding?.bubbleContainer?.setBackgroundResource(R.drawable.bg_quick_action_bubble_button)
        }
    }

    /**
     * Setup touch listener for bubble - drag and tap to expand
     */
    private fun setupBubbleTouchListener() {
        bubbleBinding?.bubbleContainer?.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = bubbleParams?.x ?: 0
                    initialY = bubbleParams?.y ?: 0
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    isDragging = false
                    lastClickTime = System.currentTimeMillis()
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val deltaX = event.rawX - initialTouchX
                    val deltaY = event.rawY - initialTouchY
                    
                    if (abs(deltaX) > 10 || abs(deltaY) > 10) {
                        isDragging = true
                    }
                    
                    bubbleParams?.x = initialX + deltaX.toInt()
                    bubbleParams?.y = initialY + deltaY.toInt()
                    windowManager?.updateViewLayout(bubbleBinding?.root, bubbleParams)
                    true
                }
                MotionEvent.ACTION_UP -> {
                    val clickDuration = System.currentTimeMillis() - lastClickTime
                    val deltaX = abs(event.rawX - initialTouchX)
                    val deltaY = abs(event.rawY - initialTouchY)
                    
                    // If it was a tap (short duration, minimal movement)
                    if (clickDuration < 200 && deltaX < 20 && deltaY < 20) {
                        performHapticFeedback()
                        expandPanel()
                    } else {
                        // Snap to edge after drag
                        snapBubbleToEdge()
                    }
                    isDragging = false
                    true
                }
                else -> false
            }
        }
    }

    /**
     * Snap bubble to nearest screen edge
     */
    private fun snapBubbleToEdge() {
        val currentX = bubbleParams?.x ?: 0
        val targetX = if (currentX < screenWidth / 2) {
            dpToPx(BUBBLE_MARGIN)
        } else {
            screenWidth - dpToPx(70)
        }

        bubbleBinding?.root?.animate()
            ?.translationX(0f)
            ?.setDuration(200)
            ?.setInterpolator(OvershootInterpolator(1.2f))
            ?.withEndAction {
                bubbleParams?.x = targetX
                try {
                    windowManager?.updateViewLayout(bubbleBinding?.root, bubbleParams)
                } catch (e: Exception) {
                    Log.w(TAG, "Failed to update bubble position", e)
                }
            }
            ?.start()
    }

    /**
     * Expand from bubble to full panel
     */
    private fun expandPanel() {
        if (isExpanded) return

        try {
            // Hide bubble with animation
            bubbleBinding?.root?.animate()
                ?.alpha(0f)
                ?.scaleX(0.5f)
                ?.scaleY(0.5f)
                ?.setDuration(150)
                ?.withEndAction {
                    try {
                        windowManager?.removeView(bubbleBinding?.root)
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed to remove bubble", e)
                    }
                    bubbleBinding = null
                    
                    // Show full panel
                    showFullPanel()
                }
                ?.start()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to expand panel", e)
        }
    }

    /**
     * Show the full expanded panel
     */
    private fun showFullPanel() {
        panelBinding = LayoutQuickActionsBinding.inflate(LayoutInflater.from(this))

        panelParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else
                WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.CENTER
        }

        setupPanelTouchListener()
        setupActionButtons()

        windowManager?.addView(panelBinding?.root, panelParams)
        isExpanded = true

        // Animate in
        panelBinding?.root?.alpha = 0f
        panelBinding?.root?.scaleX = 0.8f
        panelBinding?.root?.scaleY = 0.8f
        panelBinding?.root?.animate()
            ?.alpha(1f)
            ?.scaleX(1f)
            ?.scaleY(1f)
            ?.setDuration(200)
            ?.setInterpolator(OvershootInterpolator(1.2f))
            ?.start()

        Log.i(TAG, "Quick Actions panel expanded")
    }

    /**
     * Collapse panel back to bubble
     */
    private fun collapseToButton() {
        if (!isExpanded) return

        try {
            stopPulseAnimation()
            
            // Animate panel out
            panelBinding?.root?.animate()
                ?.alpha(0f)
                ?.scaleX(0.8f)
                ?.scaleY(0.8f)
                ?.setDuration(150)
                ?.withEndAction {
                    try {
                        windowManager?.removeView(panelBinding?.root)
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed to remove panel", e)
                    }
                    panelBinding = null
                    isExpanded = false
                    
                    // Show bubble again
                    showBubble()
                }
                ?.start()
                
            Log.i(TAG, "Quick Actions collapsed to bubble")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to collapse panel", e)
        }
    }

    private fun hideQuickActions() {
        if (!isQuickActionsVisible) return

        try {
            stopPulseAnimation()
            
            // Hide whichever view is currently shown
            if (isExpanded && panelBinding != null) {
                panelBinding?.root?.animate()
                    ?.alpha(0f)
                    ?.scaleX(0.8f)
                    ?.scaleY(0.8f)
                    ?.setDuration(150)
                    ?.withEndAction {
                        try {
                            windowManager?.removeView(panelBinding?.root)
                        } catch (e: Exception) { }
                        panelBinding = null
                        finishHide()
                    }
                    ?.start()
            } else if (bubbleBinding != null) {
                bubbleBinding?.root?.animate()
                    ?.alpha(0f)
                    ?.scaleX(0.5f)
                    ?.scaleY(0.5f)
                    ?.setDuration(150)
                    ?.withEndAction {
                        try {
                            windowManager?.removeView(bubbleBinding?.root)
                        } catch (e: Exception) { }
                        bubbleBinding = null
                        finishHide()
                    }
                    ?.start()
            } else {
                finishHide()
            }

            Log.i(TAG, "Quick Actions hidden")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to hide quick actions", e)
        }
    }

    private fun finishHide() {
        isQuickActionsVisible = false
        isExpanded = false
        stopForeground(true)
        stopSelf()
    }

    /**
     * Dismiss with swipe animation
     */
    private fun dismissWithSwipe(velocityX: Float, velocityY: Float) {
        val translationX = if (abs(velocityX) > abs(velocityY)) {
            if (velocityX > 0) 500f else -500f
        } else 0f
        
        val translationY = if (abs(velocityY) >= abs(velocityX)) {
            if (velocityY > 0) 500f else -500f
        } else 0f

        panelBinding?.root?.animate()
            ?.translationX(translationX)
            ?.translationY(translationY)
            ?.alpha(0f)
            ?.setDuration(200)
            ?.setInterpolator(AccelerateDecelerateInterpolator())
            ?.withEndAction {
                try {
                    windowManager?.removeView(panelBinding?.root)
                } catch (e: Exception) { }
                panelBinding = null
                isExpanded = false
                
                // Show bubble instead of closing completely
                showBubble()
            }
            ?.start()

        Log.i(TAG, "Quick Actions dismissed with swipe - collapsed to bubble")
    }

    private fun setupPanelTouchListener() {
        panelBinding?.cardQuickActions?.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = panelParams?.x ?: 0
                    initialY = panelParams?.y ?: 0
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    isDragging = false
                    
                    velocityTracker?.recycle()
                    velocityTracker = VelocityTracker.obtain()
                    velocityTracker?.addMovement(event)
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    velocityTracker?.addMovement(event)
                    
                    val deltaX = event.rawX - initialTouchX
                    val deltaY = event.rawY - initialTouchY
                    
                    if (abs(deltaX) > 10 || abs(deltaY) > 10) {
                        isDragging = true
                    }
                    
                    panelParams?.x = initialX + deltaX.toInt()
                    panelParams?.y = initialY + deltaY.toInt()
                    windowManager?.updateViewLayout(panelBinding?.root, panelParams)
                    true
                }
                MotionEvent.ACTION_UP -> {
                    velocityTracker?.addMovement(event)
                    velocityTracker?.computeCurrentVelocity(1000)
                    
                    val velocityX = velocityTracker?.xVelocity ?: 0f
                    val velocityY = velocityTracker?.yVelocity ?: 0f
                    
                    val deltaX = event.rawX - initialTouchX
                    val deltaY = event.rawY - initialTouchY
                    
                    val isSwipeX = abs(deltaX) > SWIPE_THRESHOLD && abs(velocityX) > SWIPE_VELOCITY_THRESHOLD
                    val isSwipeY = abs(deltaY) > SWIPE_THRESHOLD && abs(velocityY) > SWIPE_VELOCITY_THRESHOLD
                    
                    if (isSwipeX || isSwipeY) {
                        dismissWithSwipe(velocityX, velocityY)
                    }
                    
                    velocityTracker?.recycle()
                    velocityTracker = null
                    isDragging = false
                    true
                }
                MotionEvent.ACTION_CANCEL -> {
                    velocityTracker?.recycle()
                    velocityTracker = null
                    isDragging = false
                    true
                }
                else -> false
            }
        }
    }

    private fun performHapticFeedback() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createOneShot(30, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(30)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Haptic feedback failed", e)
        }
    }

    private fun animateButtonClick(view: View, action: () -> Unit) {
        performHapticFeedback()
        
        view.animate()
            .scaleX(0.9f)
            .scaleY(0.9f)
            .setDuration(50)
            .setInterpolator(AccelerateDecelerateInterpolator())
            .withEndAction {
                view.animate()
                    .scaleX(1f)
                    .scaleY(1f)
                    .setDuration(100)
                    .setInterpolator(OvershootInterpolator(1.5f))
                    .withEndAction {
                        action()
                    }
                    .start()
            }
            .start()
    }

    private fun startPulseAnimation() {
        try {
            pulseAnimation = AnimationUtils.loadAnimation(this, R.anim.anim_pulse)
            panelBinding?.btnQuickRecord?.startAnimation(pulseAnimation)
        } catch (e: Exception) {
            Log.w(TAG, "Failed to start pulse animation", e)
        }
    }

    private fun stopPulseAnimation() {
        pulseAnimation?.cancel()
        pulseAnimation = null
        panelBinding?.btnQuickRecord?.clearAnimation()
    }

    private fun setupActionButtons() {
        val a11yService = PortalAccessibilityService.instance

        // Close button - collapse to bubble instead of full hide
        panelBinding?.btnCloseQuickActions?.setOnClickListener { view ->
            animateButtonClick(view) {
                collapseToButton()
            }
        }

        // Back button
        panelBinding?.btnQuickBack?.setOnClickListener { view ->
            animateButtonClick(view) {
                a11yService?.let { AccessibilityShortcutHelper.pressBack(it) }
            }
        }

        // Home button
        panelBinding?.btnQuickHome?.setOnClickListener { view ->
            animateButtonClick(view) {
                a11yService?.let { AccessibilityShortcutHelper.pressHome(it) }
            }
        }

        // Recents button
        panelBinding?.btnQuickRecents?.setOnClickListener { view ->
            animateButtonClick(view) {
                a11yService?.let { AccessibilityShortcutHelper.showRecents(it) }
            }
        }

        // Screenshot button
        panelBinding?.btnQuickScreenshot?.setOnClickListener { view ->
            animateButtonClick(view) {
                a11yService?.let {
                    AccessibilityShortcutHelper.takeScreenshot(it)
                    handler.postDelayed({ collapseToButton() }, 300)
                }
            }
        }

        // Notifications button
        panelBinding?.btnQuickNotifications?.setOnClickListener { view ->
            animateButtonClick(view) {
                a11yService?.let {
                    AccessibilityShortcutHelper.showNotifications(it)
                    collapseToButton()
                }
            }
        }

        // Settings button
        panelBinding?.btnQuickSettings?.setOnClickListener { view ->
            animateButtonClick(view) {
                a11yService?.let {
                    AccessibilityShortcutHelper.showQuickSettings(it)
                    collapseToButton()
                }
            }
        }

        // Toggle Recording button
        panelBinding?.btnQuickRecord?.setOnClickListener { view ->
            animateButtonClick(view) {
                AccessibilityShortcutHelper.toggleRecording(this)
                updateRecordingButton()
            }
        }

        updateRecordingButton()
    }

    private fun updateRecordingButton() {
        val isRecording = RecordingManager.getState() == RecordingManager.RecordingState.RECORDING

        if (isRecording) {
            panelBinding?.ivQuickRecordIcon?.setImageResource(R.drawable.ic_stop_circle)
            panelBinding?.tvQuickRecordLabel?.text = "Stop"
            panelBinding?.btnQuickRecord?.setBackgroundResource(R.drawable.bg_quick_action_button_active)
            panelBinding?.tvQuickRecordLabel?.setTextColor(0xFFFF4757.toInt())
            
            startPulseAnimation()
        } else {
            panelBinding?.ivQuickRecordIcon?.setImageResource(R.drawable.ic_record)
            panelBinding?.tvQuickRecordLabel?.text = "Record"
            panelBinding?.btnQuickRecord?.setBackgroundResource(R.drawable.bg_quick_action_button)
            panelBinding?.tvQuickRecordLabel?.setTextColor(0x99FFFFFF.toInt())
            
            stopPulseAnimation()
        }
    }

    private fun dpToPx(dp: Int): Int {
        val density = resources.displayMetrics.density
        return (dp * density).toInt()
    }
}
