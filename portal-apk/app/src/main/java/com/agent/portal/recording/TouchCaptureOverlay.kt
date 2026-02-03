package com.agent.portal.recording

import android.annotation.SuppressLint
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.util.Log
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import kotlin.math.abs

/**
 * TouchCaptureOverlay - Transparent overlay service to capture swipe gestures
 *
 * This service creates an invisible overlay that captures touch events for recording.
 * It detects swipe gestures (up, down, left, right) and adds them to RecordingManager.
 *
 * Why needed: AccessibilityService doesn't receive touch events on home screen/launcher,
 * so we need this overlay to capture those gestures.
 */
class TouchCaptureOverlay : Service() {

    companion object {
        private const val TAG = "TouchCaptureOverlay"

        // Gesture detection thresholds
        private const val SWIPE_THRESHOLD = 100  // Minimum distance for swipe (pixels)
        private const val SWIPE_VELOCITY_THRESHOLD = 100  // Minimum velocity (pixels/ms)

        const val ACTION_START_CAPTURE = "com.agent.portal.START_TOUCH_CAPTURE"
        const val ACTION_STOP_CAPTURE = "com.agent.portal.STOP_TOUCH_CAPTURE"

        @Volatile
        var isRunning = false
            private set
        
        // ========== LAST TAP COORDINATES ==========
        // Stores the last tap position captured via MotionEvent
        // EventCapture reads these to get accurate tap coordinates
        @Volatile
        var lastTapX: Float = 0f
            private set
        
        @Volatile
        var lastTapY: Float = 0f
            private set
        
        @Volatile
        var lastTapTimestamp: Long = 0L
            private set
        
        /**
         * Get last tap coordinates if they are recent (within 500ms)
         * Returns null if no recent tap or coordinates are stale
         */
        fun getRecentTapCoordinates(): Pair<Int, Int>? {
            val age = System.currentTimeMillis() - lastTapTimestamp
            return if (age < 500 && lastTapTimestamp > 0) {
                Pair(lastTapX.toInt(), lastTapY.toInt())
            } else {
                null
            }
        }
        
        /**
         * Clear last tap coordinates (called after EventCapture uses them)
         */
        fun clearLastTap() {
            lastTapTimestamp = 0L
        }
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var isOverlayAdded = false

    // Touch tracking
    private var touchStartX = 0f
    private var touchStartY = 0f
    private var touchStartTime = 0L
    private var isSwiping = false

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        Log.i(TAG, "TouchCaptureOverlay created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_CAPTURE -> startCapture()
            ACTION_STOP_CAPTURE -> stopCapture()
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startCapture() {
        if (isOverlayAdded) {
            Log.d(TAG, "Touch capture already running")
            return
        }

        try {
            // Create invisible 1x1 overlay in corner
            overlayView = createOverlayView()

            val params = WindowManager.LayoutParams(
                1, // 1 pixel wide - NOT full screen!
                1, // 1 pixel tall - NOT full screen!
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                else
                    WindowManager.LayoutParams.TYPE_PHONE,
                // STRATEGY: Tiny overlay (1x1) that observes touches without blocking
                // Use FLAG_WATCH_OUTSIDE_TOUCH to receive ACTION_OUTSIDE events for ALL touches
                // Since overlay is only 1x1, ALL touches are "outside" → we observe without blocking!
                // NOTE: Do NOT use FLAG_NOT_TOUCHABLE - it blocks ALL touch events including ACTION_OUTSIDE
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                        WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.TOP or Gravity.START // Place in top-left corner
                x = 0
                y = 0
            }

            windowManager?.addView(overlayView, params)
            isOverlayAdded = true
            isRunning = true

            Log.i(TAG, "Touch capture overlay started (1x1 invisible, non-blocking)")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start touch capture", e)
        }
    }

    private fun stopCapture() {
        if (!isOverlayAdded) return

        try {
            overlayView?.let {
                windowManager?.removeView(it)
            }
            overlayView = null
            isOverlayAdded = false
            isRunning = false

            Log.i(TAG, "Touch capture overlay stopped")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop touch capture", e)
        }

        stopSelf()
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun createOverlayView(): View {
        // Tiny 1x1 pixel view that won't block touches
        return View(this).apply {
            setBackgroundColor(0x00000000) // Transparent

            // Handle ACTION_OUTSIDE events (all touches outside our 1x1 overlay)
            setOnTouchListener { _, event ->
                if (event.action == MotionEvent.ACTION_OUTSIDE) {
                    handleTouchEvent(event)
                }
                // Always return false to not consume events
                false
            }
        }
    }

    private fun handleTouchEvent(event: MotionEvent): Boolean {
        // Only capture when actively recording
        if (!RecordingManager.isActivelyRecording()) {
            return false
        }

        // For ACTION_OUTSIDE, we get coordinates in rawX/rawY
        val x = event.rawX
        val y = event.rawY

        when (event.action) {
            MotionEvent.ACTION_OUTSIDE -> {
                // This fires for EVERY touch on the screen (outside our 1x1 overlay)
                // We need to track the gesture sequence ourselves

                val currentTime = System.currentTimeMillis()
                
                // ========== ALWAYS STORE TAP COORDINATES ==========
                // Store EVERY touch for EventCapture to use for accurate tap position
                // Do this BEFORE any other logic so we never miss a tap
                lastTapX = x
                lastTapY = y
                lastTapTimestamp = currentTime
                Log.d(TAG, "👆 Touch at (${x.toInt()}, ${y.toInt()}) - stored for EventCapture")
                
                // Auto-reset gesture tracking if too much time passed (stale state protection)
                // This prevents getting stuck in "subsequent touch" branch forever
                val GESTURE_TIMEOUT_MS = 300L
                if (touchStartTime != 0L && (currentTime - touchStartTime) > GESTURE_TIMEOUT_MS) {
                    Log.d(TAG, "Gesture timeout - resetting tracking")
                    touchStartTime = 0L
                }

                if (touchStartTime == 0L) {
                    // First touch in sequence
                    touchStartX = x
                    touchStartY = y
                    touchStartTime = currentTime
                    isSwiping = false
                } else {
                    // Subsequent touch or end of gesture
                    val deltaX = x - touchStartX
                    val deltaY = y - touchStartY
                    val deltaTime = currentTime - touchStartTime
                    val distance = Math.sqrt((deltaX * deltaX + deltaY * deltaY).toDouble()).toFloat()

                    // If significant movement detected, it's a swipe
                    if (distance > SWIPE_THRESHOLD && deltaTime > 50 && deltaTime < 2000) {
                        val direction = determineSwipeDirection(deltaX, deltaY)

                        if (direction != null) {
                            Log.i(TAG, "Swipe detected: $direction from (${touchStartX.toInt()},${touchStartY.toInt()}) to (${x.toInt()},${y.toInt()})")

                            // Create swipe event
                            val swipeEvent = RecordedEvent(
                                eventType = "swipe",
                                timestamp = System.currentTimeMillis(),
                                packageName = getCurrentPackageName(),
                                className = "",
                                resourceId = "",
                                contentDescription = "",
                                text = "",
                                bounds = "",
                                isClickable = false,
                                isEditable = false,
                                isScrollable = false,
                                actionData = mapOf(
                                    "start_x" to touchStartX.toInt(),
                                    "start_y" to touchStartY.toInt(),
                                    "end_x" to x.toInt(),
                                    "end_y" to y.toInt(),
                                    "duration" to deltaTime,
                                    "direction" to direction
                                ),
                                x = touchStartX.toInt(),
                                y = touchStartY.toInt()
                            )

                            // Add to RecordingManager
                            RecordingManager.addEvent(swipeEvent)
                        }
                    }

                    // Reset for next gesture
                    touchStartTime = 0L
                    isSwiping = false
                }
            }
        }

        return false
    }

    private fun determineSwipeDirection(deltaX: Float, deltaY: Float): String? {
        val absDeltaX = abs(deltaX)
        val absDeltaY = abs(deltaY)

        // Check if movement is significant enough
        if (absDeltaX < SWIPE_THRESHOLD && absDeltaY < SWIPE_THRESHOLD) {
            return null
        }

        // Determine primary direction
        return if (absDeltaX > absDeltaY) {
            // Horizontal swipe
            if (deltaX > 0) "right" else "left"
        } else {
            // Vertical swipe
            if (deltaY > 0) "down" else "up"
        }
    }

    private fun getCurrentPackageName(): String {
        return try {
            val service = com.agent.portal.accessibility.PortalAccessibilityService.instance
            service?.rootInActiveWindow?.packageName?.toString() ?: ""
        } catch (e: Exception) {
            ""
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        stopCapture()
        isRunning = false
        Log.i(TAG, "TouchCaptureOverlay destroyed")
    }
}
