package com.agent.portal.overlay

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
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
import android.view.View
import android.view.WindowManager
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.LinearInterpolator
import android.view.animation.OvershootInterpolator
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.NotificationCompat
import com.agent.portal.MainActivity
import com.agent.portal.R
import com.agent.portal.recording.RecordingManager
import com.agent.portal.recording.WorkflowManager
import java.util.Locale

/**
 * Smart Pill Floating Recording Service v2
 * 
 * Features:
 * - Minimized dot state (just pulsing red dot)
 * - Expanded pill state (full controls)
 * - Auto-collapse after inactivity
 * - Double-tap to stop
 * - Smooth edge snapping
 * - Modern glassmorphic design
 */
class FloatingRecordingService : Service() {

    companion object {
        private const val TAG = "FloatingRecordingService"
        private const val NOTIFICATION_ID = 2002
        private const val CHANNEL_ID = "recording_bubble_channel"
        private const val UPDATE_INTERVAL_MS = 300L
        
        // Auto-collapse timers
        private const val COLLAPSE_TO_MINI_MS = 5000L  // 5 seconds
        private const val COLLAPSE_TO_DOT_MS = 10000L // 10 seconds total

        const val ACTION_SHOW = "com.agent.portal.SHOW_RECORDING_BUBBLE"
        const val ACTION_HIDE = "com.agent.portal.HIDE_RECORDING_BUBBLE"
        const val ACTION_STOP_RECORDING = "com.agent.portal.STOP_RECORDING_FROM_BUBBLE"
        const val ACTION_PAUSE_RECORDING = "com.agent.portal.PAUSE_RECORDING"
        const val ACTION_QUICK_ACTIONS = "com.agent.portal.OPEN_QUICK_ACTIONS"

        @Volatile
        var instance: FloatingRecordingService? = null
            private set

        fun isRunning(): Boolean = instance != null
    }

    // Bubble states
    enum class BubbleState {
        EXPANDED,   // Full pill with all controls
        MINIMIZED   // Just the recording dot
    }

    private var currentState = BubbleState.EXPANDED
    private var windowManager: WindowManager? = null
    private var bubbleView: View? = null
    private var isBubbleAdded = false

    // View references
    private var minimizedContainer: View? = null
    private var expandedContainer: View? = null
    private var tvEventCount: TextView? = null
    private var tvDuration: TextView? = null
    private var btnPause: View? = null
    private var btnStop: View? = null
    private var ivPause: ImageView? = null

    private val handler = Handler(Looper.getMainLooper())
    private var pulseAnimator: AnimatorSet? = null
    private var recordingStartTime: Long = 0L
    private var lastInteractionTime: Long = 0L

    // For dragging
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var isDragging = false
    
    // For double-tap detection
    private var lastTapTime = 0L
    private val DOUBLE_TAP_THRESHOLD_MS = 300L

    // For snap-to-edge animation
    private var screenWidth = 0
    private var screenHeight = 0
    private var bubbleWidth = 0
    private var bubbleHeight = 0
    private val EDGE_MARGIN = 16 // dp margin from screen edge

    private val updateRunnable = object : Runnable {
        override fun run() {
            if (RecordingManager.isActivelyRecording()) {
                updateEventCount()
                handler.postDelayed(this, UPDATE_INTERVAL_MS)
            }
        }
    }
    
    private val autoCollapseRunnable = Runnable {
        if (currentState == BubbleState.EXPANDED) {
            collapseToMinimized()
        }
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        Log.i(TAG, "FloatingRecordingService created (v2 Smart Pill)")

        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_SHOW -> {
                showBubble()
            }
            ACTION_HIDE -> {
                hideBubble()
                stopSelf()
            }
            ACTION_STOP_RECORDING -> {
                stopRecording()
            }
            ACTION_PAUSE_RECORDING -> {
                togglePauseRecording()
            }
            ACTION_QUICK_ACTIONS -> {
                toggleQuickActionsPanel()
            }
        }

        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        hideBubble()
        handler.removeCallbacks(updateRunnable)
        handler.removeCallbacks(autoCollapseRunnable)
        pulseAnimator?.cancel()
        instance = null
        Log.i(TAG, "FloatingRecordingService destroyed")
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Recording Bubble",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows recording status bubble"
                setShowBadge(false)
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        // Stop action
        val stopIntent = Intent(this, FloatingRecordingService::class.java).apply {
            action = ACTION_STOP_RECORDING
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            0,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Pause/Resume action
        val pauseIntent = Intent(this, FloatingRecordingService::class.java).apply {
            action = ACTION_PAUSE_RECORDING
        }
        val pausePendingIntent = PendingIntent.getService(
            this,
            1,
            pauseIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Open app action
        val openIntent = Intent(this, MainActivity::class.java)
        val openPendingIntent = PendingIntent.getActivity(
            this,
            3,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val isPaused = RecordingManager.getState() == RecordingManager.RecordingState.PAUSED
        val pauseLabel = if (isPaused) "Resume" else "Pause"
        val pauseIcon = if (isPaused) R.drawable.ic_play else R.drawable.ic_pause

        val eventCount = RecordingManager.getEventCount()
        val duration = formatDuration(System.currentTimeMillis() - recordingStartTime)
        val statusText = if (isPaused) "Paused • $eventCount events" else "$eventCount events • $duration"

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(if (isPaused) "Recording Paused" else "Recording Interactions")
            .setContentText(statusText)
            .setSmallIcon(R.drawable.ic_record)
            .setOngoing(true)
            .setContentIntent(openPendingIntent)
            .addAction(pauseIcon, pauseLabel, pausePendingIntent)
            .addAction(R.drawable.ic_stop_circle, "Stop", stopPendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }

    private fun showBubble() {
        if (!Settings.canDrawOverlays(this)) {
            Log.w(TAG, "Cannot show bubble - no overlay permission")
            return
        }

        if (isBubbleAdded) {
            Log.d(TAG, "Bubble already shown")
            return
        }

        try {
            // Start foreground service
            startForeground(NOTIFICATION_ID, createNotification())

            // Get screen dimensions
            val displayMetrics = resources.displayMetrics
            screenWidth = displayMetrics.widthPixels
            screenHeight = displayMetrics.heightPixels

            // Create bubble view with v2 layout
            val themedContext = android.view.ContextThemeWrapper(this, R.style.Theme_AgentPortal)
            val inflater = themedContext.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
            bubbleView = inflater.inflate(R.layout.layout_recording_bubble, null)

            // Cache view references
            cacheViewReferences()

            // Setup layout params - position at right side
            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                else
                    @Suppress("DEPRECATION")
                    WindowManager.LayoutParams.TYPE_PHONE,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.TOP or Gravity.START
                // Position at right side, middle of screen
                x = screenWidth - dpToPx(240)
                y = screenHeight / 3
            }

            // Setup drag touch listener (with button detection to not block clicks)
            setupTouchListener(params)
            
            // Setup button click listeners
            setupButtonListeners()

            // Add view
            windowManager?.addView(bubbleView, params)
            isBubbleAdded = true

            // Track recording start time
            recordingStartTime = System.currentTimeMillis()
            lastInteractionTime = System.currentTimeMillis()

            // Start in expanded state
            currentState = BubbleState.EXPANDED
            showExpandedState()

            // Start pulse animation
            startPulseAnimation()

            // Start updating event count
            handler.post(updateRunnable)
            
            // Schedule auto-collapse
            scheduleAutoCollapse()

            Log.i(TAG, "Recording bubble v2 shown")

        } catch (e: Exception) {
            Log.e(TAG, "Failed to show bubble", e)
        }
    }
    
    private fun cacheViewReferences() {
        bubbleView?.let { view ->
            // For v2 layout 
            minimizedContainer = view.findViewById(R.id.minimizedContainer)
            expandedContainer = view.findViewById(R.id.expandedContainer)
            
            // Common elements (both layouts)
            tvEventCount = view.findViewById(R.id.tvEventCount)
            tvDuration = view.findViewById(R.id.tvDuration)
            btnStop = view.findViewById(R.id.btnStop)
            
            // v2 layout has btnPause, original has btnQuickActions
            btnPause = view.findViewById(R.id.btnPause)
            ivPause = view.findViewById(R.id.ivPause)
            
            Log.d(TAG, "View references cached: btnStop=${btnStop != null}, tvEventCount=${tvEventCount != null}")
        }
    }
    
    private fun setupButtonListeners() {
        // Set direct click listeners on buttons (required because FLAG_NOT_FOCUSABLE)
        // With FLAG_NOT_FOCUSABLE, parent touch listener doesn't receive events from clickable children
        
        Log.i(TAG, "Setting up button listeners - btnStop: ${btnStop != null}, btnQuickActions: ${bubbleView?.findViewById<View>(R.id.btnQuickActions) != null}")
        
        // Stop button - direct click listener
        btnStop?.setOnClickListener { v ->
            Log.i(TAG, "=== STOP BUTTON CLICKED via OnClickListener ===")
            hapticFeedback()
            stopRecording()
        }
        
        // Also set touch listener to ensure we get the event
        btnStop?.setOnTouchListener { v, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    Log.d(TAG, "btnStop: ACTION_DOWN")
                    recordInteraction()
                    false // Let click listener handle it
                }
                MotionEvent.ACTION_UP -> {
                    Log.i(TAG, "=== STOP BUTTON: ACTION_UP via touch listener ===")
                    // Perform click manually if click listener wasn't triggered
                    val deltaX = kotlin.math.abs(event.rawX - initialTouchX)
                    val deltaY = kotlin.math.abs(event.rawY - initialTouchY)
                    if (deltaX < 20 && deltaY < 20) {
                        Log.i(TAG, "Manually triggering stopRecording()")
                        hapticFeedback()
                        stopRecording()
                        true
                    } else {
                        false
                    }
                }
                else -> false
            }
        }
        
        // QuickActions button - direct click listener  
        bubbleView?.findViewById<View>(R.id.btnQuickActions)?.let { btn ->
            btn.setOnClickListener { v ->
                Log.i(TAG, "QuickActions button clicked via OnClickListener")
                hapticFeedback()
                toggleQuickActionsPanel()
            }
            
            btn.setOnTouchListener { v, event ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        recordInteraction()
                        false
                    }
                    else -> false
                }
            }
        }
        
        // Pause button if exists (v2 layout)
        btnPause?.let { btn ->
            btn.setOnClickListener { v ->
                Log.i(TAG, "Pause button clicked via OnClickListener")
                hapticFeedback()
                togglePauseRecording()
            }
        }
        
        // Minimized container - for expanding
        minimizedContainer?.setOnClickListener { v ->
            Log.i(TAG, "Minimized dot clicked - expanding")
            hapticFeedback()
            expandToPill()
        }
        
        // Recording indicator (pulseRing parent) - tap to minimize
        bubbleView?.findViewById<View>(R.id.pulseRing)?.parent?.let { parent ->
            if (parent is View) {
                parent.setOnClickListener {
                    Log.i(TAG, "Recording indicator tapped - minimizing")
                    hapticFeedback()
                    collapseToMinimized()
                }
            }
        }
        
        Log.i(TAG, "Button listeners set up successfully")
    }

    private fun hideBubble() {
        if (!isBubbleAdded) return

        try {
            handler.removeCallbacks(updateRunnable)
            handler.removeCallbacks(autoCollapseRunnable)
            pulseAnimator?.cancel()

            bubbleView?.let {
                windowManager?.removeView(it)
            }
            bubbleView = null
            isBubbleAdded = false

            stopForeground(STOP_FOREGROUND_REMOVE)

            Log.i(TAG, "Recording bubble hidden")

        } catch (e: Exception) {
            Log.e(TAG, "Failed to hide bubble", e)
        }
    }

    private fun setupTouchListener(params: WindowManager.LayoutParams) {
        bubbleView?.setOnTouchListener { view, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    bubbleWidth = view.width
                    bubbleHeight = view.height
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    isDragging = false
                    
                    // Reset auto-collapse timer on interaction
                    recordInteraction()
                    
                    // Check if touch is on a button - if so, let button handle it
                    if (isTouchOnButton(event.x, event.y)) {
                        Log.d(TAG, "Touch on button - letting button handle")
                        false // Let child button handle
                    } else {
                        false // Allow child views to handle initially
                    }
                }

                MotionEvent.ACTION_MOVE -> {
                    val deltaX = (event.rawX - initialTouchX).toInt()
                    val deltaY = (event.rawY - initialTouchY).toInt()

                    // Only start dragging if moved significantly AND not on buttons
                    if (!isDragging && (kotlin.math.abs(deltaX) > 15 || kotlin.math.abs(deltaY) > 15)) {
                        isDragging = true
                    }

                    if (isDragging) {
                        params.x = initialX + deltaX
                        params.y = initialY + deltaY
                        windowManager?.updateViewLayout(bubbleView, params)
                        true // Consume during drag
                    } else {
                        false // Let children handle
                    }
                }

                MotionEvent.ACTION_UP -> {
                    if (isDragging) {
                        snapToEdge(params)
                        true
                    } else {
                        // Check for double-tap to stop
                        val now = System.currentTimeMillis()
                        if (now - lastTapTime < DOUBLE_TAP_THRESHOLD_MS) {
                            Log.i(TAG, "Double-tap detected - stopping recording")
                            hapticFeedback()
                            stopRecording()
                            true
                        } else {
                            lastTapTime = now
                            false // Let button handle click
                        }
                    }
                }

                else -> false
            }
        }
    }
    
    /**
     * Check if touch coordinates are within button bounds
     */
    private fun isTouchOnButton(x: Float, y: Float): Boolean {
        // Check btnStop
        btnStop?.let { btn ->
            val location = IntArray(2)
            btn.getLocationInWindow(location)
            bubbleView?.let { bubble ->
                val bubbleLocation = IntArray(2)
                bubble.getLocationInWindow(bubbleLocation)
                
                val relativeX = location[0] - bubbleLocation[0]
                val relativeY = location[1] - bubbleLocation[1]
                
                if (x >= relativeX && x <= relativeX + btn.width &&
                    y >= relativeY && y <= relativeY + btn.height) {
                    Log.d(TAG, "Touch is on Stop button")
                    return true
                }
            }
        }
        
        // Check btnQuickActions / btnPause
        val quickActionsBtn = bubbleView?.findViewById<View>(R.id.btnQuickActions) ?: btnPause
        quickActionsBtn?.let { btn ->
            val location = IntArray(2)
            btn.getLocationInWindow(location)
            bubbleView?.let { bubble ->
                val bubbleLocation = IntArray(2)
                bubble.getLocationInWindow(bubbleLocation)
                
                val relativeX = location[0] - bubbleLocation[0]
                val relativeY = location[1] - bubbleLocation[1]
                
                if (x >= relativeX && x <= relativeX + btn.width &&
                    y >= relativeY && y <= relativeY + btn.height) {
                    Log.d(TAG, "Touch is on QuickActions/Pause button")
                    return true
                }
            }
        }
        
        return false
    }
    
    private fun recordInteraction() {
        lastInteractionTime = System.currentTimeMillis()
        // Only schedule auto-collapse if layout supports it
        if (minimizedContainer != null && expandedContainer != null) {
            scheduleAutoCollapse()
        }
    }
    
    private fun scheduleAutoCollapse() {
        // Only collapse if containers exist
        if (minimizedContainer == null || expandedContainer == null) {
            return
        }
        handler.removeCallbacks(autoCollapseRunnable)
        handler.postDelayed(autoCollapseRunnable, COLLAPSE_TO_MINI_MS)
    }
    
    private fun collapseToMinimized() {
        // Skip if layout doesn't support minimized state
        if (minimizedContainer == null || expandedContainer == null) {
            Log.d(TAG, "Layout doesn't support minimized state - skipping collapse")
            return
        }
        if (currentState == BubbleState.MINIMIZED) return
        
        Log.i(TAG, "Collapsing to minimized state")
        currentState = BubbleState.MINIMIZED
        
        // Animate transition
        expandedContainer?.animate()
            ?.alpha(0f)
            ?.scaleX(0.5f)
            ?.scaleY(0.5f)
            ?.setDuration(200)
            ?.withEndAction {
                expandedContainer?.visibility = View.GONE
                minimizedContainer?.visibility = View.VISIBLE
                minimizedContainer?.alpha = 0f
                minimizedContainer?.scaleX = 0.5f
                minimizedContainer?.scaleY = 0.5f
                minimizedContainer?.animate()
                    ?.alpha(1f)
                    ?.scaleX(1f)
                    ?.scaleY(1f)
                    ?.setDuration(200)
                    ?.setInterpolator(OvershootInterpolator())
                    ?.start()
            }
            ?.start()
    }
    
    private fun expandToPill() {
        if (currentState == BubbleState.EXPANDED) return
        
        Log.i(TAG, "Expanding to pill state")
        currentState = BubbleState.EXPANDED
        recordInteraction()
        
        // Animate transition
        minimizedContainer?.animate()
            ?.alpha(0f)
            ?.scaleX(0.5f)
            ?.scaleY(0.5f)
            ?.setDuration(200)
            ?.withEndAction {
                minimizedContainer?.visibility = View.GONE
                expandedContainer?.visibility = View.VISIBLE
                expandedContainer?.alpha = 0f
                expandedContainer?.scaleX = 0.8f
                expandedContainer?.scaleY = 0.8f
                expandedContainer?.animate()
                    ?.alpha(1f)
                    ?.scaleX(1f)
                    ?.scaleY(1f)
                    ?.setDuration(250)
                    ?.setInterpolator(OvershootInterpolator())
                    ?.start()
            }
            ?.start()
    }
    
    private fun showExpandedState() {
        minimizedContainer?.visibility = View.GONE
        expandedContainer?.visibility = View.VISIBLE
        expandedContainer?.alpha = 1f
        expandedContainer?.scaleX = 1f
        expandedContainer?.scaleY = 1f
    }

    private fun snapToEdge(params: WindowManager.LayoutParams) {
        val currentX = params.x
        val currentY = params.y
        val centerX = currentX + bubbleWidth / 2

        val marginPx = (EDGE_MARGIN * resources.displayMetrics.density).toInt()
        val targetX = if (centerX < screenWidth / 2) {
            marginPx
        } else {
            screenWidth - bubbleWidth - marginPx
        }

        val targetY = currentY.coerceIn(marginPx, screenHeight - bubbleHeight - marginPx)

        val animator = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 250
            interpolator = OvershootInterpolator(0.8f)
            addUpdateListener { animation ->
                val fraction = animation.animatedValue as Float
                params.x = (currentX + (targetX - currentX) * fraction).toInt()
                params.y = (currentY + (targetY - currentY) * fraction).toInt()
                try {
                    windowManager?.updateViewLayout(bubbleView, params)
                } catch (e: Exception) {
                    // View might have been removed
                }
            }
        }
        animator.start()
    }

    private fun toggleQuickActionsPanel() {
        try {
            val intent = Intent(this, QuickActionsService::class.java).apply {
                action = QuickActionsService.ACTION_TOGGLE
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent)
            } else {
                startService(intent)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to toggle quick actions", e)
        }
    }

    private fun stopRecording() {
        Log.i(TAG, "=== stopRecording() called ===")

        val appPackage = RecordingManager.getTargetAppPackage()
        Log.i(TAG, "App package: $appPackage")

        val result = RecordingManager.stopRecording()
        val events = RecordingManager.getEvents()
        val eventCount = events.size

        Log.i(TAG, "stopRecording result: success=${result.success}, events=$eventCount")

        // Show feedback
        Handler(Looper.getMainLooper()).post {
            if (result.success) {
                val durationSec = result.duration / 1000
                Toast.makeText(this, "✓ Recording stopped • ${result.eventCount} events • ${durationSec}s", Toast.LENGTH_LONG).show()
            } else {
                Toast.makeText(this, "Failed: ${result.message}", Toast.LENGTH_SHORT).show()
            }
        }

        // Auto-save workflow
        if (events.isNotEmpty() && appPackage != null) {
            WorkflowManager.init(this)
            val appName = try {
                val pm = packageManager
                val appInfo = pm.getApplicationInfo(appPackage, 0)
                pm.getApplicationLabel(appInfo).toString()
            } catch (e: Exception) {
                appPackage.substringAfterLast(".")
            }

            val timestamp = java.text.SimpleDateFormat("HH:mm", Locale.getDefault()).format(java.util.Date())
            val workflowName = "$appName - $timestamp"

            val workflowId = WorkflowManager.saveWorkflow(
                name = workflowName,
                appPackage = appPackage,
                appName = appName,
                events = events
            )

            if (workflowId != null) {
                Log.i(TAG, "Workflow saved: $workflowName")
            }
        }

        hideBubble()
        sendBroadcast(Intent("com.agent.portal.RECORDING_STOPPED"))
        stopSelf()
    }

    private fun togglePauseRecording() {
        val state = RecordingManager.getState()
        when (state) {
            RecordingManager.RecordingState.RECORDING -> {
                RecordingManager.pauseRecording()
                ivPause?.setImageResource(R.drawable.ic_play)
                updateNotification()
            }
            RecordingManager.RecordingState.PAUSED -> {
                RecordingManager.resumeRecording()
                ivPause?.setImageResource(R.drawable.ic_pause)
                updateNotification()
            }
            else -> { }
        }
        recordInteraction()
    }

    private fun updateNotification() {
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, createNotification())
    }

    private fun updateEventCount() {
        tvEventCount?.text = RecordingManager.getEventCount().toString()
        tvDuration?.text = formatDuration(System.currentTimeMillis() - recordingStartTime)
        
        // Update notification periodically
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, createNotification())
    }

    private fun formatDuration(millis: Long): String {
        val seconds = (millis / 1000) % 60
        val minutes = (millis / (1000 * 60)) % 60
        val hours = millis / (1000 * 60 * 60)
        return if (hours > 0) {
            String.format(Locale.US, "%02d:%02d:%02d", hours, minutes, seconds)
        } else {
            String.format(Locale.US, "%02d:%02d", minutes, seconds)
        }
    }

    private fun startPulseAnimation() {
        bubbleView?.let { view ->
            val recordingDot = view.findViewById<View>(R.id.recordingDot)
            val pulseRing = view.findViewById<View>(R.id.pulseRing)

            val dotAlpha = ObjectAnimator.ofFloat(recordingDot, "alpha", 1f, 0.6f).apply {
                duration = 800
                repeatCount = ValueAnimator.INFINITE
                repeatMode = ValueAnimator.REVERSE
                interpolator = AccelerateDecelerateInterpolator()
            }

            val animators = mutableListOf<android.animation.Animator>(dotAlpha)

            pulseRing?.let { ring ->
                val ringScaleX = ObjectAnimator.ofFloat(ring, "scaleX", 1f, 1.5f).apply {
                    duration = 1200
                    repeatCount = ValueAnimator.INFINITE
                    repeatMode = ValueAnimator.RESTART
                    interpolator = LinearInterpolator()
                }
                val ringScaleY = ObjectAnimator.ofFloat(ring, "scaleY", 1f, 1.5f).apply {
                    duration = 1200
                    repeatCount = ValueAnimator.INFINITE
                    repeatMode = ValueAnimator.RESTART
                    interpolator = LinearInterpolator()
                }
                val ringAlpha = ObjectAnimator.ofFloat(ring, "alpha", 0.5f, 0f).apply {
                    duration = 1200
                    repeatCount = ValueAnimator.INFINITE
                    repeatMode = ValueAnimator.RESTART
                    interpolator = LinearInterpolator()
                }
                animators.addAll(listOf(ringScaleX, ringScaleY, ringAlpha))
            }

            pulseAnimator = AnimatorSet().apply {
                playTogether(animators)
                start()
            }
        }
    }
    
    private fun hapticFeedback() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vibratorManager.defaultVibrator.vibrate(
                    VibrationEffect.createOneShot(30, VibrationEffect.DEFAULT_AMPLITUDE)
                )
            } else {
                @Suppress("DEPRECATION")
                val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createOneShot(30, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(30)
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Haptic feedback failed", e)
        }
    }

    private fun dpToPx(dp: Int): Int {
        val density = resources.displayMetrics.density
        return (dp * density).toInt()
    }
}
