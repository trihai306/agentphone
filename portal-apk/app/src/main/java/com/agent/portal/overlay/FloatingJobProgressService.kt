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
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import androidx.core.app.NotificationCompat
import com.agent.portal.MainActivity
import com.agent.portal.R

/**
 * Floating overlay service that shows job execution progress.
 * Non-intrusive bubble that doesn't block user interaction.
 * Shows: current job / total jobs, workflow name, action progress, pending count.
 */
class FloatingJobProgressService : Service() {

    companion object {
        private const val TAG = "FloatingJobProgress"
        private const val NOTIFICATION_ID = 2003
        private const val CHANNEL_ID = "job_progress_channel"

        const val ACTION_SHOW = "com.agent.portal.SHOW_JOB_PROGRESS"
        const val ACTION_HIDE = "com.agent.portal.HIDE_JOB_PROGRESS"
        const val ACTION_UPDATE = "com.agent.portal.UPDATE_JOB_PROGRESS"
        const val ACTION_MINIMIZE = "com.agent.portal.MINIMIZE_JOB_PROGRESS"

        const val EXTRA_CURRENT_JOB = "current_job"
        const val EXTRA_TOTAL_JOBS = "total_jobs"
        const val EXTRA_PENDING_JOBS = "pending_jobs"
        const val EXTRA_WORKFLOW_NAME = "workflow_name"
        const val EXTRA_CURRENT_ACTION = "current_action"
        const val EXTRA_TOTAL_ACTIONS = "total_actions"
        const val EXTRA_ACTION_NAME = "action_name"

        @Volatile
        var instance: FloatingJobProgressService? = null
            private set

        fun isRunning(): Boolean = instance != null

        /**
         * Show or update job progress overlay
         */
        fun show(
            context: Context,
            currentJob: Int,
            totalJobs: Int,
            pendingJobs: Int,
            workflowName: String,
            currentAction: Int = 0,
            totalActions: Int = 0
        ) {
            val intent = Intent(context, FloatingJobProgressService::class.java).apply {
                action = ACTION_SHOW
                putExtra(EXTRA_CURRENT_JOB, currentJob)
                putExtra(EXTRA_TOTAL_JOBS, totalJobs)
                putExtra(EXTRA_PENDING_JOBS, pendingJobs)
                putExtra(EXTRA_WORKFLOW_NAME, workflowName)
                putExtra(EXTRA_CURRENT_ACTION, currentAction)
                putExtra(EXTRA_TOTAL_ACTIONS, totalActions)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        /**
         * Update action progress without changing job info
         */
        fun updateProgress(
            context: Context,
            currentAction: Int,
            totalActions: Int,
            actionName: String = ""
        ) {
            val intent = Intent(context, FloatingJobProgressService::class.java).apply {
                action = ACTION_UPDATE
                putExtra(EXTRA_CURRENT_ACTION, currentAction)
                putExtra(EXTRA_TOTAL_ACTIONS, totalActions)
                putExtra(EXTRA_ACTION_NAME, actionName)
            }
            context.startService(intent)
        }

        /**
         * Hide the overlay
         */
        fun hide(context: Context) {
            val intent = Intent(context, FloatingJobProgressService::class.java).apply {
                action = ACTION_HIDE
            }
            context.startService(intent)
        }
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var isOverlayAdded = false
    private var isMinimized = false

    private val handler = Handler(Looper.getMainLooper())
    private var pulseAnimator: AnimatorSet? = null

    // Current state
    private var currentJob = 0
    private var totalJobs = 0
    private var pendingJobs = 0
    private var workflowName = ""
    private var currentAction = 0
    private var totalActions = 0

    // For dragging
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var isDragging = false
    private var screenWidth = 0
    private var screenHeight = 0
    private var overlayWidth = 0
    private var overlayHeight = 0
    private val EDGE_MARGIN = 16

    override fun onCreate() {
        super.onCreate()
        instance = this
        Log.i(TAG, "FloatingJobProgressService created")
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_SHOW -> {
                currentJob = intent.getIntExtra(EXTRA_CURRENT_JOB, 1)
                totalJobs = intent.getIntExtra(EXTRA_TOTAL_JOBS, 1)
                pendingJobs = intent.getIntExtra(EXTRA_PENDING_JOBS, 0)
                workflowName = intent.getStringExtra(EXTRA_WORKFLOW_NAME) ?: "Workflow"
                currentAction = intent.getIntExtra(EXTRA_CURRENT_ACTION, 0)
                totalActions = intent.getIntExtra(EXTRA_TOTAL_ACTIONS, 0)

                if (!isOverlayAdded) {
                    showOverlay()
                }
                updateUI()
            }
            ACTION_UPDATE -> {
                currentAction = intent.getIntExtra(EXTRA_CURRENT_ACTION, currentAction)
                totalActions = intent.getIntExtra(EXTRA_TOTAL_ACTIONS, totalActions)
                updateUI()
            }
            ACTION_HIDE -> {
                hideOverlay()
                stopSelf()
            }
            ACTION_MINIMIZE -> {
                toggleMinimize()
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        hideOverlay()
        pulseAnimator?.cancel()
        instance = null
        Log.i(TAG, "FloatingJobProgressService destroyed")
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Job Progress",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows job execution progress"
                setShowBadge(false)
            }
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val openIntent = Intent(this, MainActivity::class.java)
        val openPendingIntent = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val progress = if (totalActions > 0) (currentAction * 100 / totalActions) else 0

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Running: $workflowName")
            .setContentText("Job $currentJob/$totalJobs • Action $currentAction/$totalActions")
            .setSmallIcon(R.drawable.ic_play)
            .setOngoing(true)
            .setContentIntent(openPendingIntent)
            .setProgress(100, progress, false)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .build()
    }

    private fun showOverlay() {
        if (!Settings.canDrawOverlays(this)) {
            Log.w(TAG, "Cannot show overlay - no overlay permission")
            return
        }

        if (isOverlayAdded) {
            Log.d(TAG, "Overlay already shown")
            return
        }

        try {
            startForeground(NOTIFICATION_ID, createNotification())

            val displayMetrics = resources.displayMetrics
            screenWidth = displayMetrics.widthPixels
            screenHeight = displayMetrics.heightPixels

            val themedContext = android.view.ContextThemeWrapper(this, R.style.Theme_AgentPortal)
            val inflater = themedContext.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
            overlayView = inflater.inflate(R.layout.layout_job_progress, null)

            // CRITICAL: Use FLAG_NOT_TOUCHABLE to allow taps to pass through to underlying apps
            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                else
                    WindowManager.LayoutParams.TYPE_PHONE,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or  // Pass through taps!
                        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.TOP or Gravity.START
                x = screenWidth - dpToPx(300)
                y = dpToPx(100)
            }

            // No touch listener - overlay is non-interactive during workflow execution
            setupMinimizeButton()

            windowManager?.addView(overlayView, params)
            isOverlayAdded = true

            startPulseAnimation()

            Log.i(TAG, "Job progress overlay shown (touch pass-through enabled)")

        } catch (e: Exception) {
            Log.e(TAG, "Failed to show overlay", e)
        }
    }

    private fun hideOverlay() {
        if (!isOverlayAdded) return

        try {
            pulseAnimator?.cancel()
            overlayView?.let { windowManager?.removeView(it) }
            overlayView = null
            isOverlayAdded = false
            stopForeground(STOP_FOREGROUND_REMOVE)
            Log.i(TAG, "Job progress overlay hidden")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to hide overlay", e)
        }
    }

    private fun updateUI() {
        overlayView?.let { view ->
            // Job progress
            view.findViewById<TextView>(R.id.tvJobProgress)?.text = "Job $currentJob/$totalJobs"

            // Workflow name
            view.findViewById<TextView>(R.id.tvWorkflowName)?.text = workflowName

            // Action progress
            view.findViewById<TextView>(R.id.tvActionProgress)?.text = "$currentAction/$totalActions"

            // Progress bar
            val progress = if (totalActions > 0) (currentAction * 100 / totalActions) else 0
            view.findViewById<ProgressBar>(R.id.progressBar)?.progress = progress

            // Pending count
            val pendingContainer = view.findViewById<FrameLayout>(R.id.pendingContainer)
            val tvPendingCount = view.findViewById<TextView>(R.id.tvPendingCount)
            if (pendingJobs > 0) {
                pendingContainer?.visibility = View.VISIBLE
                tvPendingCount?.text = pendingJobs.toString()
            } else {
                pendingContainer?.visibility = View.GONE
            }

            // Update notification
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.notify(NOTIFICATION_ID, createNotification())
        }
    }

    private fun setupTouchListener(params: WindowManager.LayoutParams) {
        overlayView?.setOnTouchListener { view, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    overlayWidth = view.width
                    overlayHeight = view.height
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    isDragging = false
                    false
                }
                MotionEvent.ACTION_MOVE -> {
                    val deltaX = (event.rawX - initialTouchX).toInt()
                    val deltaY = (event.rawY - initialTouchY).toInt()

                    if (kotlin.math.abs(deltaX) > 10 || kotlin.math.abs(deltaY) > 10) {
                        isDragging = true
                    }

                    if (isDragging) {
                        params.x = initialX + deltaX
                        params.y = initialY + deltaY
                        windowManager?.updateViewLayout(overlayView, params)
                        true
                    } else {
                        false
                    }
                }
                MotionEvent.ACTION_UP -> {
                    if (isDragging) {
                        snapToEdge(params)
                    }
                    isDragging
                }
                else -> false
            }
        }
    }

    private fun snapToEdge(params: WindowManager.LayoutParams) {
        val currentX = params.x
        val currentY = params.y
        val centerX = currentX + overlayWidth / 2

        val marginPx = (EDGE_MARGIN * resources.displayMetrics.density).toInt()
        val targetX = if (centerX < screenWidth / 2) {
            marginPx
        } else {
            screenWidth - overlayWidth - marginPx
        }

        val targetY = currentY.coerceIn(marginPx, screenHeight - overlayHeight - marginPx)

        val animator = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 200
            interpolator = AccelerateDecelerateInterpolator()
            addUpdateListener { animation ->
                val fraction = animation.animatedValue as Float
                params.x = (currentX + (targetX - currentX) * fraction).toInt()
                params.y = (currentY + (targetY - currentY) * fraction).toInt()
                try {
                    windowManager?.updateViewLayout(overlayView, params)
                } catch (e: Exception) { }
            }
        }
        animator.start()
    }

    private fun setupMinimizeButton() {
        overlayView?.findViewById<View>(R.id.btnMinimize)?.setOnClickListener {
            toggleMinimize()
        }
    }

    private fun toggleMinimize() {
        isMinimized = !isMinimized
        overlayView?.let { view ->
            val card = view.findViewById<View>(R.id.cardJobProgress)
            if (isMinimized) {
                // Collapse to small bubble
                card?.animate()?.scaleX(0.5f)?.scaleY(0.5f)?.alpha(0.7f)?.setDuration(200)?.start()
            } else {
                // Expand to full
                card?.animate()?.scaleX(1f)?.scaleY(1f)?.alpha(1f)?.setDuration(200)?.start()
            }
        }
    }

    private fun startPulseAnimation() {
        overlayView?.let { view ->
            val pulseRing = view.findViewById<View>(R.id.pulseRing) ?: return

            val scaleX = ObjectAnimator.ofFloat(pulseRing, "scaleX", 1f, 1.3f).apply {
                duration = 1000
                repeatCount = ValueAnimator.INFINITE
                repeatMode = ValueAnimator.RESTART
                interpolator = LinearInterpolator()
            }

            val scaleY = ObjectAnimator.ofFloat(pulseRing, "scaleY", 1f, 1.3f).apply {
                duration = 1000
                repeatCount = ValueAnimator.INFINITE
                repeatMode = ValueAnimator.RESTART
                interpolator = LinearInterpolator()
            }

            val alpha = ObjectAnimator.ofFloat(pulseRing, "alpha", 0.6f, 0f).apply {
                duration = 1000
                repeatCount = ValueAnimator.INFINITE
                repeatMode = ValueAnimator.RESTART
                interpolator = LinearInterpolator()
            }

            pulseAnimator = AnimatorSet().apply {
                playTogether(scaleX, scaleY, alpha)
                start()
            }
        }
    }

    private fun dpToPx(dp: Int): Int {
        return (dp * resources.displayMetrics.density).toInt()
    }
}
