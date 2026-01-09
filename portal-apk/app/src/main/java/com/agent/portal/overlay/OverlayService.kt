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
import android.provider.Settings
import android.util.Log
import android.view.Gravity
import android.view.WindowManager
import androidx.core.app.NotificationCompat
import com.agent.portal.MainActivity
import com.agent.portal.R
import com.agent.portal.accessibility.PortalAccessibilityService
import com.agent.portal.utils.A11yNode

/**
 * Overlay service for displaying element bounds on screen
 */
class OverlayService : Service() {

    companion object {
        private const val TAG = "OverlayService"
        private const val NOTIFICATION_ID = 2001
        private const val CHANNEL_ID = "overlay_service_channel"
        private const val UPDATE_INTERVAL_MS = 500L

        @Volatile
        var instance: OverlayService? = null
            private set

        fun isRunning(): Boolean = instance != null

        // Settings
        @Volatile
        var showBounds: Boolean = false
            private set

        @Volatile
        var showIndexes: Boolean = false
            private set

        fun updateSettings(bounds: Boolean, indexes: Boolean) {
            showBounds = bounds
            showIndexes = indexes
            instance?.updateOverlay()
        }
    }

    private var windowManager: WindowManager? = null
    private var overlayView: BoundsOverlayView? = null
    private var isOverlayAdded = false

    private val handler = Handler(Looper.getMainLooper())
    private val updateRunnable = object : Runnable {
        override fun run() {
            if (showBounds || showIndexes) {
                refreshOverlay()
            }
            handler.postDelayed(this, UPDATE_INTERVAL_MS)
        }
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        Log.i(TAG, "OverlayService created")

        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action

        when (action) {
            ACTION_SHOW_BOUNDS -> {
                showBounds = true
                showOverlay()
            }
            ACTION_HIDE_BOUNDS -> {
                showBounds = false
                if (!showIndexes) hideOverlay() else updateOverlay()
            }
            ACTION_SHOW_INDEXES -> {
                showIndexes = true
                showOverlay()
            }
            ACTION_HIDE_INDEXES -> {
                showIndexes = false
                if (!showBounds) hideOverlay() else updateOverlay()
            }
            ACTION_TOGGLE_BOUNDS -> {
                showBounds = !showBounds
                if (showBounds || showIndexes) showOverlay() else hideOverlay()
            }
            ACTION_TOGGLE_INDEXES -> {
                showIndexes = !showIndexes
                if (showBounds || showIndexes) showOverlay() else hideOverlay()
            }
            ACTION_REFRESH -> {
                refreshOverlay()
            }
            ACTION_STOP -> {
                hideOverlay()
                stopSelf()
            }
            else -> {
                // Default: just start the service
                startForeground(NOTIFICATION_ID, createNotification())
            }
        }

        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        hideOverlay()
        handler.removeCallbacks(updateRunnable)
        instance = null
        Log.i(TAG, "OverlayService destroyed")
    }

    private fun showOverlay() {
        if (!Settings.canDrawOverlays(this)) {
            Log.w(TAG, "No overlay permission")
            return
        }

        startForeground(NOTIFICATION_ID, createNotification())

        if (!isOverlayAdded) {
            addOverlayView()
        }

        updateOverlay()
        handler.removeCallbacks(updateRunnable)
        handler.post(updateRunnable)
    }

    private fun hideOverlay() {
        handler.removeCallbacks(updateRunnable)
        removeOverlayView()
    }

    private fun addOverlayView() {
        if (isOverlayAdded) return

        try {
            overlayView = BoundsOverlayView(this)

            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                else
                    WindowManager.LayoutParams.TYPE_PHONE,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.TOP or Gravity.START
                x = 0
                y = 0
            }

            windowManager?.addView(overlayView, params)
            isOverlayAdded = true
            Log.i(TAG, "Overlay view added")

        } catch (e: Exception) {
            Log.e(TAG, "Failed to add overlay view", e)
        }
    }

    private fun removeOverlayView() {
        if (!isOverlayAdded) return

        try {
            overlayView?.let { view ->
                windowManager?.removeView(view)
            }
            overlayView = null
            isOverlayAdded = false
            Log.i(TAG, "Overlay view removed")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to remove overlay view", e)
        }
    }

    private fun updateOverlay() {
        overlayView?.setBoundsAndIndexes(showBounds, showIndexes)
    }

    private fun refreshOverlay() {
        val a11yService = PortalAccessibilityService.instance
        if (a11yService == null) {
            Log.w(TAG, "Accessibility service not running")
            return
        }

        try {
            val nodes = a11yService.getA11yTree()
            overlayView?.updateNodes(nodes)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to refresh overlay", e)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Overlay Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows element bounds overlay"
                setShowBadge(false)
            }

            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Element Overlay Active")
            .setContentText("Showing interactive element bounds")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    object Actions {
        const val SHOW_BOUNDS = "com.agent.portal.SHOW_BOUNDS"
        const val HIDE_BOUNDS = "com.agent.portal.HIDE_BOUNDS"
        const val SHOW_INDEXES = "com.agent.portal.SHOW_INDEXES"
        const val HIDE_INDEXES = "com.agent.portal.HIDE_INDEXES"
        const val TOGGLE_BOUNDS = "com.agent.portal.TOGGLE_BOUNDS"
        const val TOGGLE_INDEXES = "com.agent.portal.TOGGLE_INDEXES"
        const val REFRESH = "com.agent.portal.REFRESH_OVERLAY"
        const val STOP = "com.agent.portal.STOP_OVERLAY"
    }
}

// Action constants
private const val ACTION_SHOW_BOUNDS = OverlayService.Actions.SHOW_BOUNDS
private const val ACTION_HIDE_BOUNDS = OverlayService.Actions.HIDE_BOUNDS
private const val ACTION_SHOW_INDEXES = OverlayService.Actions.SHOW_INDEXES
private const val ACTION_HIDE_INDEXES = OverlayService.Actions.HIDE_INDEXES
private const val ACTION_TOGGLE_BOUNDS = OverlayService.Actions.TOGGLE_BOUNDS
private const val ACTION_TOGGLE_INDEXES = OverlayService.Actions.TOGGLE_INDEXES
private const val ACTION_REFRESH = OverlayService.Actions.REFRESH
private const val ACTION_STOP = OverlayService.Actions.STOP
