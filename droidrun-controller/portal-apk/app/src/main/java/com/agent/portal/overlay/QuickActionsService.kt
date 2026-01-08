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
import com.agent.portal.recording.RecordingManager
import kotlin.math.abs

/**
 * Service that shows a floating Quick Actions panel for common shortcuts.
 * 
 * Features:
 * - Draggable floating panel
 * - Haptic feedback on button taps
 * - Button scale animations
 * - Swipe to dismiss gesture
 * - Pulse animation for recording state
 */
class QuickActionsService : Service() {

    companion object {
        private const val TAG = "QuickActionsService"
        private const val NOTIFICATION_ID = 3001
        private const val CHANNEL_ID = "quick_actions_channel"

        // Swipe threshold for dismissing panel
        private const val SWIPE_THRESHOLD = 150f
        private const val SWIPE_VELOCITY_THRESHOLD = 500f

        const val ACTION_SHOW = "com.agent.portal.SHOW_QUICK_ACTIONS"
        const val ACTION_HIDE = "com.agent.portal.HIDE_QUICK_ACTIONS"
        const val ACTION_TOGGLE = "com.agent.portal.TOGGLE_QUICK_ACTIONS"

        @Volatile
        private var instance: QuickActionsService? = null

        fun isRunning(): Boolean = instance != null
        fun isVisible(): Boolean = instance?.isQuickActionsVisible ?: false
    }

    private var windowManager: WindowManager? = null
    private var binding: LayoutQuickActionsBinding? = null
    private var isQuickActionsVisible = false

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

    override fun onCreate() {
        super.onCreate()
        instance = this
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        vibrator = getVibratorService()
        createNotificationChannel()
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
            .setContentText("Tap to open app")
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

    private fun showQuickActions() {
        if (isQuickActionsVisible) return

        if (!Settings.canDrawOverlays(this)) {
            Log.e(TAG, "Overlay permission not granted")
            return
        }

        startForeground(NOTIFICATION_ID, createNotification())

        try {
            binding = LayoutQuickActionsBinding.inflate(LayoutInflater.from(this))

            val params = WindowManager.LayoutParams(
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

            // Setup touch listener for dragging and swipe to dismiss
            setupTouchListener(params)

            // Setup action buttons
            setupActionButtons()

            windowManager?.addView(binding?.root, params)
            isQuickActionsVisible = true

            // Animate in
            binding?.root?.alpha = 0f
            binding?.root?.scaleX = 0.8f
            binding?.root?.scaleY = 0.8f
            binding?.root?.animate()
                ?.alpha(1f)
                ?.scaleX(1f)
                ?.scaleY(1f)
                ?.setDuration(200)
                ?.setInterpolator(OvershootInterpolator(1.2f))
                ?.start()

            Log.i(TAG, "Quick Actions shown")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to show quick actions", e)
        }
    }

    private fun hideQuickActions() {
        if (!isQuickActionsVisible) return

        try {
            stopPulseAnimation()
            
            // Animate out
            binding?.root?.animate()
                ?.alpha(0f)
                ?.scaleX(0.8f)
                ?.scaleY(0.8f)
                ?.setDuration(150)
                ?.withEndAction {
                    windowManager?.removeView(binding?.root)
                    binding = null
                    isQuickActionsVisible = false
                    stopForeground(true)
                    stopSelf()
                }
                ?.start()

            Log.i(TAG, "Quick Actions hidden")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to hide quick actions", e)
        }
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

        binding?.root?.animate()
            ?.translationX(translationX)
            ?.translationY(translationY)
            ?.alpha(0f)
            ?.setDuration(200)
            ?.setInterpolator(AccelerateDecelerateInterpolator())
            ?.withEndAction {
                windowManager?.removeView(binding?.root)
                binding = null
                isQuickActionsVisible = false
                stopForeground(true)
                stopSelf()
            }
            ?.start()

        Log.i(TAG, "Quick Actions dismissed with swipe")
    }

    private fun setupTouchListener(params: WindowManager.LayoutParams) {
        binding?.cardQuickActions?.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    isDragging = false
                    
                    // Initialize velocity tracker
                    velocityTracker?.recycle()
                    velocityTracker = VelocityTracker.obtain()
                    velocityTracker?.addMovement(event)
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    velocityTracker?.addMovement(event)
                    
                    val deltaX = event.rawX - initialTouchX
                    val deltaY = event.rawY - initialTouchY
                    
                    // Check if user is dragging
                    if (abs(deltaX) > 10 || abs(deltaY) > 10) {
                        isDragging = true
                    }
                    
                    params.x = initialX + deltaX.toInt()
                    params.y = initialY + deltaY.toInt()
                    windowManager?.updateViewLayout(binding?.root, params)
                    true
                }
                MotionEvent.ACTION_UP -> {
                    velocityTracker?.addMovement(event)
                    velocityTracker?.computeCurrentVelocity(1000)
                    
                    val velocityX = velocityTracker?.xVelocity ?: 0f
                    val velocityY = velocityTracker?.yVelocity ?: 0f
                    
                    val deltaX = event.rawX - initialTouchX
                    val deltaY = event.rawY - initialTouchY
                    
                    // Check for swipe to dismiss
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

    /**
     * Perform haptic feedback when button is tapped
     */
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

    /**
     * Animate button scale on click for visual feedback
     */
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

    /**
     * Start pulse animation for recording button
     */
    private fun startPulseAnimation() {
        try {
            pulseAnimation = AnimationUtils.loadAnimation(this, R.anim.anim_pulse)
            binding?.btnQuickRecord?.startAnimation(pulseAnimation)
        } catch (e: Exception) {
            Log.w(TAG, "Failed to start pulse animation", e)
        }
    }

    /**
     * Stop pulse animation
     */
    private fun stopPulseAnimation() {
        pulseAnimation?.cancel()
        pulseAnimation = null
        binding?.btnQuickRecord?.clearAnimation()
    }

    private fun setupActionButtons() {
        val a11yService = PortalAccessibilityService.instance

        // Close button
        binding?.btnCloseQuickActions?.setOnClickListener { view ->
            animateButtonClick(view) {
                hideQuickActions()
            }
        }

        // Back button
        binding?.btnQuickBack?.setOnClickListener { view ->
            animateButtonClick(view) {
                a11yService?.let { AccessibilityShortcutHelper.pressBack(it) }
            }
        }

        // Home button
        binding?.btnQuickHome?.setOnClickListener { view ->
            animateButtonClick(view) {
                a11yService?.let { AccessibilityShortcutHelper.pressHome(it) }
            }
        }

        // Recents button
        binding?.btnQuickRecents?.setOnClickListener { view ->
            animateButtonClick(view) {
                a11yService?.let { AccessibilityShortcutHelper.showRecents(it) }
            }
        }

        // Screenshot button
        binding?.btnQuickScreenshot?.setOnClickListener { view ->
            animateButtonClick(view) {
                a11yService?.let {
                    AccessibilityShortcutHelper.takeScreenshot(it)
                    // Hide panel after taking screenshot
                    handler.postDelayed({ hideQuickActions() }, 300)
                }
            }
        }

        // Notifications button
        binding?.btnQuickNotifications?.setOnClickListener { view ->
            animateButtonClick(view) {
                a11yService?.let {
                    AccessibilityShortcutHelper.showNotifications(it)
                    hideQuickActions()
                }
            }
        }

        // Settings button
        binding?.btnQuickSettings?.setOnClickListener { view ->
            animateButtonClick(view) {
                a11yService?.let {
                    AccessibilityShortcutHelper.showQuickSettings(it)
                    hideQuickActions()
                }
            }
        }

        // Toggle Recording button
        binding?.btnQuickRecord?.setOnClickListener { view ->
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
            binding?.ivQuickRecordIcon?.setImageResource(R.drawable.ic_stop_circle)
            binding?.tvQuickRecordLabel?.text = "Stop"
            binding?.btnQuickRecord?.setBackgroundResource(R.drawable.bg_quick_action_button_active)
            binding?.tvQuickRecordLabel?.setTextColor(0xFFFF4757.toInt())
            
            // Start pulse animation when recording
            startPulseAnimation()
        } else {
            binding?.ivQuickRecordIcon?.setImageResource(R.drawable.ic_record)
            binding?.tvQuickRecordLabel?.text = "Record"
            binding?.btnQuickRecord?.setBackgroundResource(R.drawable.bg_quick_action_button)
            binding?.tvQuickRecordLabel?.setTextColor(0x99FFFFFF.toInt())
            
            // Stop pulse animation when not recording
            stopPulseAnimation()
        }
    }
}
