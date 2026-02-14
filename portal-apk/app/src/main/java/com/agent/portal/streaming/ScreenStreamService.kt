package com.agent.portal.streaming

import android.app.Activity
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.IBinder
import android.util.DisplayMetrics
import android.util.Log
import android.view.WindowManager
import androidx.core.app.NotificationCompat
import com.agent.portal.MainActivity
import com.agent.portal.R
import okhttp3.MediaType.Companion.toMediaType

/**
 * Foreground service for screen streaming (dual mode).
 *
 * Supports two modes:
 * 1. MJPEG — Runs HTTP server for direct browser access (same network)
 * 2. WebRTC — P2P stream via signaling relay (over internet)
 *
 * Usage:
 * - Start with EXTRA_RESULT_CODE, EXTRA_RESULT_DATA, and EXTRA_STREAM_MODE
 * - Stop by calling stopSelf() or sending ACTION_STOP_STREAM intent
 */
class ScreenStreamService : Service() {

    companion object {
        private const val TAG = "CLICKAI:ScreenStream"
        private const val NOTIFICATION_ID = 9001
        private const val CHANNEL_ID = "screen_stream_channel"

        const val ACTION_START_STREAM = "com.agent.portal.START_STREAM"
        const val ACTION_STOP_STREAM = "com.agent.portal.STOP_STREAM"
        const val EXTRA_RESULT_CODE = "result_code"
        const val EXTRA_RESULT_DATA = "result_data"
        const val EXTRA_VIEWER_USER_ID = "viewer_user_id"
        const val EXTRA_STREAM_MODE = "stream_mode"

        const val MODE_MJPEG = "mjpeg"
        const val MODE_WEBRTC = "webrtc"

        private var isRunning = false
        private var currentMode: String? = null

        fun isStreaming(): Boolean = isRunning
        fun getStreamMode(): String? = currentMode

        /**
         * Start MJPEG streaming (direct HTTP server)
         */
        fun startMjpegStreaming(context: Context, resultCode: Int, resultData: Intent) {
            val intent = Intent(context, ScreenStreamService::class.java).apply {
                action = ACTION_START_STREAM
                putExtra(EXTRA_RESULT_CODE, resultCode)
                putExtra(EXTRA_RESULT_DATA, resultData)
                putExtra(EXTRA_STREAM_MODE, MODE_MJPEG)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        /**
         * Start WebRTC streaming (P2P via signaling)
         */
        fun startWebRTCStreaming(context: Context, resultCode: Int, resultData: Intent, viewerUserId: Int) {
            val intent = Intent(context, ScreenStreamService::class.java).apply {
                action = ACTION_START_STREAM
                putExtra(EXTRA_RESULT_CODE, resultCode)
                putExtra(EXTRA_RESULT_DATA, resultData)
                putExtra(EXTRA_STREAM_MODE, MODE_WEBRTC)
                putExtra(EXTRA_VIEWER_USER_ID, viewerUserId)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        /**
         * Stop streaming service
         */
        fun stopStreaming(context: Context) {
            val intent = Intent(context, ScreenStreamService::class.java).apply {
                action = ACTION_STOP_STREAM
            }
            context.startService(intent)
        }
    }

    private var mjpegServer: MjpegStreamServer? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        Log.d(TAG, "ScreenStreamService created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_STREAM -> {
                val resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, Activity.RESULT_CANCELED)
                val resultData = intent.getParcelableExtra<Intent>(EXTRA_RESULT_DATA)
                val mode = intent.getStringExtra(EXTRA_STREAM_MODE) ?: MODE_MJPEG

                if (resultCode == Activity.RESULT_OK && resultData != null) {
                    startForeground(NOTIFICATION_ID, createNotification(mode))
                    isRunning = true
                    currentMode = mode

                    // Get screen dimensions
                    val wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager
                    val metrics = DisplayMetrics()
                    @Suppress("DEPRECATION")
                    wm.defaultDisplay.getMetrics(metrics)

                    // Stream at reduced resolution for performance
                    val scale = minOf(540f / metrics.widthPixels, 960f / metrics.heightPixels, 1f)
                    val streamWidth = (metrics.widthPixels * scale).toInt()
                    val streamHeight = (metrics.heightPixels * scale).toInt()

                    when (mode) {
                        MODE_MJPEG -> startMjpeg(resultCode, resultData, streamWidth, streamHeight, metrics.densityDpi)
                        MODE_WEBRTC -> startWebRTC(intent, resultData, streamWidth, streamHeight, metrics.densityDpi)
                    }

                    Log.d(TAG, "Stream started: mode=$mode, ${streamWidth}x${streamHeight}")
                } else {
                    Log.e(TAG, "Invalid start params: resultCode=$resultCode, data=$resultData")
                    stopSelf()
                }
            }

            ACTION_STOP_STREAM -> {
                Log.d(TAG, "Stop stream requested")
                stopStreamingInternal()
            }
        }

        return START_NOT_STICKY
    }

    private fun startMjpeg(resultCode: Int, resultData: Intent, width: Int, height: Int, dpi: Int) {
        try {
            val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            val projection = projectionManager.getMediaProjection(resultCode, resultData)

            // Create and start MJPEG server
            mjpegServer = MjpegStreamServer(this).apply {
                start()
                startCapture(projection, width, height, dpi, quality = 60, fps = 15)
            }

            val ips = MjpegStreamServer.getLocalIpAddresses()
            val urls = ips.map { "http://$it:${MjpegStreamServer.DEFAULT_PORT}/stream" }
            Log.d(TAG, "MJPEG server started. URLs: $urls")

            // Report MJPEG URLs back via socket
            reportMjpegUrls(urls)

        } catch (e: Exception) {
            Log.e(TAG, "Failed to start MJPEG server", e)
            stopStreamingInternal()
        }
    }

    private fun startWebRTC(intent: Intent, resultData: Intent, width: Int, height: Int, dpi: Int) {
        val viewerUserId = intent.getIntExtra(EXTRA_VIEWER_USER_ID, 0)
        if (viewerUserId <= 0) {
            Log.e(TAG, "Invalid viewer user ID for WebRTC: $viewerUserId")
            stopStreamingInternal()
            return
        }

        WebRTCManager.initialize(this)
        WebRTCManager.startStreaming(
            mediaProjectionPermissionResultData = resultData,
            viewerUserId = viewerUserId,
            screenWidth = width,
            screenHeight = height,
            screenDpi = dpi
        )

        Log.d(TAG, "WebRTC stream started for viewer $viewerUserId")
    }

    /**
     * Report MJPEG server URLs to backend so FE can discover them
     */
    private fun reportMjpegUrls(urls: List<String>) {
        try {
            val sessionManager = com.agent.portal.auth.SessionManager(this)
            val token = sessionManager.getToken() ?: return
            val baseUrl = com.agent.portal.utils.NetworkUtils.getApiBaseUrl()

            val json = org.json.JSONObject().apply {
                put("mode", MODE_MJPEG)
                put("urls", org.json.JSONArray(urls))
                put("port", MjpegStreamServer.DEFAULT_PORT)
            }

            val body = okhttp3.RequestBody.create(
                "application/json".toMediaType(),
                json.toString()
            )

            val request = okhttp3.Request.Builder()
                .url("$baseUrl/api/devices/stream/mjpeg-info")
                .addHeader("Authorization", "Bearer $token")
                .post(body)
                .build()

            okhttp3.OkHttpClient().newCall(request).enqueue(object : okhttp3.Callback {
                override fun onFailure(call: okhttp3.Call, e: java.io.IOException) {
                    Log.e(TAG, "Failed to report MJPEG URLs: ${e.message}")
                }
                override fun onResponse(call: okhttp3.Call, response: okhttp3.Response) {
                    Log.d(TAG, "MJPEG URLs reported: ${response.code}")
                    response.close()
                }
            })
        } catch (e: Exception) {
            Log.e(TAG, "Failed to report MJPEG URLs", e)
        }
    }

    override fun onDestroy() {
        stopStreamingInternal()
        super.onDestroy()
        Log.d(TAG, "ScreenStreamService destroyed")
    }

    private fun stopStreamingInternal() {
        isRunning = false
        currentMode = null

        // Stop MJPEG server
        mjpegServer?.stop()
        mjpegServer = null

        // Stop WebRTC
        WebRTCManager.stopStreaming()

        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Screen Streaming",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows when screen is being streamed"
                setShowBadge(false)
            }
            val nm = getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(channel)
        }
    }

    private fun createNotification(mode: String = MODE_MJPEG): Notification {
        val stopIntent = Intent(this, ScreenStreamService::class.java).apply {
            action = ACTION_STOP_STREAM
        }
        val stopPendingIntent = PendingIntent.getService(
            this, 0, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val openIntent = Intent(this, MainActivity::class.java)
        val openPendingIntent = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val modeText = if (mode == MODE_MJPEG) "MJPEG (Direct)" else "WebRTC (P2P)"

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Screen Streaming")
            .setContentText("$modeText — Your screen is being shared")
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setOngoing(true)
            .setContentIntent(openPendingIntent)
            .addAction(0, "Stop", stopPendingIntent)
            .build()
    }
}
