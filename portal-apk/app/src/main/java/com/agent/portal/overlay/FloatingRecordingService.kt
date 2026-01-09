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
import android.provider.Settings
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.LinearInterpolator
import android.widget.FrameLayout
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.NotificationCompat
import com.agent.portal.MainActivity
import com.agent.portal.R
import com.agent.portal.recording.RecordingManager
import com.agent.portal.recording.WorkflowManager
import java.util.Locale

/**
 * Floating bubble service that shows recording status and event count.
 * The bubble can be dragged around and tapped to stop recording.
 */
class FloatingRecordingService : Service() {

    companion object {
        private const val TAG = "FloatingRecordingService"
        private const val NOTIFICATION_ID = 2002
        private const val CHANNEL_ID = "recording_bubble_channel"
        private const val UPDATE_INTERVAL_MS = 300L

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

    private var windowManager: WindowManager? = null
    private var bubbleView: View? = null
    private var isBubbleAdded = false

    private val handler = Handler(Looper.getMainLooper())
    private var pulseAnimator: AnimatorSet? = null
    private var recordingStartTime: Long = 0L

    // For dragging
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var isDragging = false
    private var lastClickTime = 0L

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

    override fun onCreate() {
        super.onCreate()
        instance = this
        Log.i(TAG, "FloatingRecordingService created")

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

        // Quick Actions action
        val quickActionsIntent = Intent(this, FloatingRecordingService::class.java).apply {
            action = ACTION_QUICK_ACTIONS
        }
        val quickActionsPendingIntent = PendingIntent.getService(
            this,
            2,
            quickActionsIntent,
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

        // Determine pause/resume label
        val isPaused = RecordingManager.getState() == RecordingManager.RecordingState.PAUSED
        val pauseLabel = if (isPaused) "Resume" else "Pause"
        val pauseIcon = if (isPaused) R.drawable.ic_play else R.drawable.ic_pause

        // Build notification with expanded actions
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
            .addAction(R.drawable.ic_grid_actions, "Actions", quickActionsPendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setStyle(NotificationCompat.BigTextStyle()
                .bigText("$statusText\nTap to open app • Swipe for more actions"))
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

            // Get screen dimensions for initial position
            val displayMetrics = resources.displayMetrics
            screenWidth = displayMetrics.widthPixels
            screenHeight = displayMetrics.heightPixels

            // Create bubble view with themed context
            // Services don't inherit app theme, so we need to wrap the context with the app theme
            val themedContext = android.view.ContextThemeWrapper(this, R.style.Theme_AgentPortal)
            val inflater = themedContext.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
            bubbleView = inflater.inflate(R.layout.layout_recording_bubble, null)

            // Setup layout params - position at bottom-right corner
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
                gravity = Gravity.TOP or Gravity.START
                // Position at bottom-right corner
                x = screenWidth - dpToPx(280)  // Bubble width + margin
                y = screenHeight - dpToPx(180) // From bottom
            }

            // Setup touch listener for drag and click
            setupTouchListener(params)

            // Setup stop button click listener (for new layout)
            setupStopButton()

            // Add view
            windowManager?.addView(bubbleView, params)
            isBubbleAdded = true

            // Track recording start time
            recordingStartTime = System.currentTimeMillis()

            // Start pulse animation
            startPulseAnimation()

            // Start updating event count
            handler.post(updateRunnable)

            Log.i(TAG, "Recording bubble shown")

        } catch (e: Exception) {
            Log.e(TAG, "Failed to show bubble", e)
        }
    }

    private fun hideBubble() {
        if (!isBubbleAdded) return

        try {
            handler.removeCallbacks(updateRunnable)
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
                    // Get bubble size on first touch
                    bubbleWidth = view.width
                    bubbleHeight = view.height

                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    isDragging = false
                    lastClickTime = System.currentTimeMillis()
                    // Return false to allow child views to handle click
                    false
                }

                MotionEvent.ACTION_MOVE -> {
                    val deltaX = (event.rawX - initialTouchX).toInt()
                    val deltaY = (event.rawY - initialTouchY).toInt()

                    // Only consider it dragging if moved more than 10 pixels
                    if (kotlin.math.abs(deltaX) > 10 || kotlin.math.abs(deltaY) > 10) {
                        isDragging = true
                    }

                    if (isDragging) {
                        params.x = initialX + deltaX
                        params.y = initialY + deltaY
                        windowManager?.updateViewLayout(bubbleView, params)
                        // Return true only when actually dragging
                        true
                    } else {
                        // Not dragging yet, allow children to receive event
                        false
                    }
                }

                MotionEvent.ACTION_UP -> {
                    if (isDragging) {
                        // Snap to nearest edge when released
                        snapToEdge(params)
                    }
                    // If we were dragging, consume the event
                    // Otherwise, let children handle the click
                    isDragging
                }

                else -> false
            }
        }
    }

    /**
     * Snap bubble to the nearest screen edge with smooth animation
     */
    private fun snapToEdge(params: WindowManager.LayoutParams) {
        val currentX = params.x
        val currentY = params.y
        val centerX = currentX + bubbleWidth / 2

        // Determine target X: snap to left or right edge
        val marginPx = (EDGE_MARGIN * resources.displayMetrics.density).toInt()
        val targetX = if (centerX < screenWidth / 2) {
            // Snap to left edge
            marginPx
        } else {
            // Snap to right edge
            screenWidth - bubbleWidth - marginPx
        }

        // Clamp Y position to keep bubble on screen
        val targetY = currentY.coerceIn(marginPx, screenHeight - bubbleHeight - marginPx)

        // Animate to target position
        val animator = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 200
            interpolator = AccelerateDecelerateInterpolator()
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

        Log.d(TAG, "Snap to edge: ($currentX, $currentY) -> ($targetX, $targetY)")
    }

    // Remove onBubbleTapped() - no longer needed since buttons handle their own clicks

    private fun setupStopButton() {
        bubbleView?.let { view ->
            // Try to find stop button by resource name (for new layout)
            val btnStopId = resources.getIdentifier("btnStop", "id", packageName)
            Log.d(TAG, "btnStopId lookup: $btnStopId (0 means not found)")
            if (btnStopId != 0) {
                val btnStop = view.findViewById<View>(btnStopId)
                Log.d(TAG, "btnStop view: $btnStop (null means not found in layout)")
                btnStop?.setOnClickListener {
                    Log.i(TAG, "=== STOP BUTTON CLICKED IN BUBBLE ===")
                    Log.i(TAG, "Recording state BEFORE stop: ${RecordingManager.getState()}")
                    Log.i(TAG, "Event count BEFORE stop: ${RecordingManager.getEventCount()}")
                    stopRecording()
                }
            } else {
                Log.w(TAG, "btnStop ID not found in resources - button won't work!")
            }

            // Setup Quick Actions button
            val btnQuickActionsId = resources.getIdentifier("btnQuickActions", "id", packageName)
            if (btnQuickActionsId != 0) {
                val btnQuickActions = view.findViewById<View>(btnQuickActionsId)
                btnQuickActions?.setOnClickListener {
                    Log.i(TAG, "Quick actions button clicked")
                    toggleQuickActionsPanel()
                }
            }
        }
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

        // Get app package BEFORE stopping (it will be cleared after stop)
        val appPackage = RecordingManager.getTargetAppPackage()

        Log.i(TAG, "App package: $appPackage")

        // Stop the recording (this will flush pending scroll events)
        val result = RecordingManager.stopRecording()

        // Get events AFTER stopping (to include flushed scroll events)
        val events = RecordingManager.getEvents()
        val eventCount = events.size
        val newState = RecordingManager.getState()

        Log.i(TAG, "RecordingManager.stopRecording() result: success=${result.success}, message=${result.message}")
        Log.i(TAG, "Recording state AFTER stop: $newState")
        Log.i(TAG, "Event count AFTER stop: $eventCount")

        // Show feedback to user
        Handler(Looper.getMainLooper()).post {
            if (result.success) {
                val durationSec = result.duration / 1000
                val message = "Recording stopped\n${result.eventCount} events • ${durationSec}s"
                Toast.makeText(this, message, Toast.LENGTH_LONG).show()
            } else {
                Toast.makeText(this, "Failed to stop: ${result.message}", Toast.LENGTH_SHORT).show()
            }
        }

        // Auto-save workflow if there are events
        if (events.isNotEmpty() && appPackage != null) {
            Log.i(TAG, "Auto-saving workflow...")
            WorkflowManager.init(this)

            // Get app name from package manager
            val appName = try {
                val pm = packageManager
                val appInfo = pm.getApplicationInfo(appPackage, 0)
                pm.getApplicationLabel(appInfo).toString()
            } catch (e: Exception) {
                appPackage.substringAfterLast(".")
            }

            // Generate default workflow name with timestamp
            val timestamp = java.text.SimpleDateFormat("HH:mm", Locale.getDefault()).format(java.util.Date())
            val workflowName = "$appName - $timestamp"

            val workflowId = WorkflowManager.saveWorkflow(
                name = workflowName,
                appPackage = appPackage,
                appName = appName,
                events = events
            )

            if (workflowId != null) {
                Log.i(TAG, "Workflow saved: $workflowName ($workflowId)")
                Handler(Looper.getMainLooper()).post {
                    Toast.makeText(this, "Workflow saved: $workflowName", Toast.LENGTH_SHORT).show()
                }
            } else {
                Log.e(TAG, "Failed to save workflow")
            }
        } else {
            Log.w(TAG, "No events or app package, workflow not saved")
        }

        // Hide the bubble
        Log.i(TAG, "Calling hideBubble()...")
        hideBubble()

        // Send broadcast to update MainActivity
        Log.i(TAG, "Sending RECORDING_STOPPED broadcast...")
        val intent = Intent("com.agent.portal.RECORDING_STOPPED")
        sendBroadcast(intent)

        // Stop service
        Log.i(TAG, "Calling stopSelf()...")
        stopSelf()

        Log.i(TAG, "=== stopRecording() completed ===")
    }

    private fun togglePauseRecording() {
        val state = RecordingManager.getState()
        when (state) {
            RecordingManager.RecordingState.RECORDING -> {
                RecordingManager.pauseRecording()
                updateNotification()
            }
            RecordingManager.RecordingState.PAUSED -> {
                RecordingManager.resumeRecording()
                updateNotification()
            }
            else -> { /* Do nothing */ }
        }
    }

    private fun updateNotification() {
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, createNotification())
    }

    private fun updateEventCount() {
        bubbleView?.let { view ->
            val tvEventCount = view.findViewById<TextView>(R.id.tvEventCount)
            tvEventCount?.text = RecordingManager.getEventCount().toString()

            // Update duration display if available
            val tvDurationId = resources.getIdentifier("tvDuration", "id", packageName)
            if (tvDurationId != 0) {
                val tvDuration = view.findViewById<TextView>(tvDurationId)
                tvDuration?.text = formatDuration(System.currentTimeMillis() - recordingStartTime)
            }

            // Update notification as well
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.notify(NOTIFICATION_ID, createNotification())
        }
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

            // Try to find pulse ring by resource name (for new layout compatibility)
            val pulseRingId = resources.getIdentifier("pulseRing", "id", packageName)
            val pulseRing: View? = if (pulseRingId != 0) view.findViewById(pulseRingId) else null

            // Dot pulse animation
            val dotAlphaAnimator = ObjectAnimator.ofFloat(recordingDot, "alpha", 1f, 0.5f).apply {
                duration = 800
                repeatCount = ValueAnimator.INFINITE
                repeatMode = ValueAnimator.REVERSE
                interpolator = AccelerateDecelerateInterpolator()
            }

            val animators = mutableListOf<android.animation.Animator>(dotAlphaAnimator)

            // Add pulse ring animations if available
            pulseRing?.let { ring ->
                val ringScaleX = ObjectAnimator.ofFloat(ring, "scaleX", 1f, 1.4f).apply {
                    duration = 1200
                    repeatCount = ValueAnimator.INFINITE
                    repeatMode = ValueAnimator.RESTART
                    interpolator = LinearInterpolator()
                }

                val ringScaleY = ObjectAnimator.ofFloat(ring, "scaleY", 1f, 1.4f).apply {
                    duration = 1200
                    repeatCount = ValueAnimator.INFINITE
                    repeatMode = ValueAnimator.RESTART
                    interpolator = LinearInterpolator()
                }

                val ringAlpha = ObjectAnimator.ofFloat(ring, "alpha", 0.6f, 0f).apply {
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

    private fun dpToPx(dp: Int): Int {
        val density = resources.displayMetrics.density
        return (dp * density).toInt()
    }
}
