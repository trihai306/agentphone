package com.agent.portal.recording

import android.content.Context
import android.content.pm.PackageManager
import android.graphics.*
import android.os.Build
import android.util.Log
import com.agent.portal.accessibility.PortalAccessibilityService
import kotlinx.coroutines.*
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.ConcurrentHashMap

/**
 * Data class for scroll path coordinates
 */
data class ScrollPath(
    val startX: Float,
    val startY: Float,
    val endX: Float,
    val endY: Float
)

/**
 * ScreenshotManager handles capturing and saving screenshots during recording.
 *
 * Features:
 * - Automatic screenshot capture when events are recorded
 * - Draws interaction highlight (circle/box) at touch point
 * - Saves screenshots to app's cache directory
 * - Manages screenshot lifecycle (auto-cleanup old screenshots)
 * - Provides app icon and name lookup
 */
object ScreenshotManager {

    private const val TAG = "ScreenshotManager"
    private const val SCREENSHOT_DIR = "event_screenshots"
    private const val MAX_SCREENSHOTS = 500 // Prevent storage overflow
    private const val SCREENSHOT_QUALITY = 80 // JPEG quality

    // Cache for app info lookup
    private val appInfoCache = ConcurrentHashMap<String, AppInfo>()

    // Coroutine scope for async operations
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    data class AppInfo(
        val appName: String,
        val packageName: String
    )

    /**
     * Capture screenshot and save with interaction highlight
     *
     * @param context Application context
     * @param event The recorded event (contains bounds, coordinates)
     * @param callback Called with screenshot path when done
     */
    fun captureScreenshotForEvent(
        context: Context,
        event: RecordedEvent,
        callback: (String?) -> Unit
    ) {
        // Only capture for important event types
        if (!shouldCaptureScreenshot(event.eventType)) {
            callback(null)
            return
        }

        scope.launch {
            try {
                val service = PortalAccessibilityService.instance
                if (service == null) {
                    Log.w(TAG, "Accessibility service not available for screenshot")
                    withContext(Dispatchers.Main) { callback(null) }
                    return@launch
                }

                // Capture screenshot using accessibility service
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    service.takeScreenshot { bitmap ->
                        if (bitmap != null) {
                            scope.launch {
                                val path = processAndSaveScreenshot(context, bitmap, event)
                                withContext(Dispatchers.Main) { callback(path) }
                            }
                        } else {
                            Log.w(TAG, "Screenshot capture returned null")
                            scope.launch(Dispatchers.Main) { callback(null) }
                        }
                    }
                } else {
                    Log.w(TAG, "Screenshot requires Android 11+")
                    withContext(Dispatchers.Main) { callback(null) }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error capturing screenshot", e)
                withContext(Dispatchers.Main) { callback(null) }
            }
        }
    }

    /**
     * Process screenshot: draw interaction highlight and save to file
     */
    private suspend fun processAndSaveScreenshot(
        context: Context,
        originalBitmap: Bitmap,
        event: RecordedEvent
    ): String? = withContext(Dispatchers.IO) {
        try {
            // Create mutable copy to draw on
            val bitmap = originalBitmap.copy(Bitmap.Config.ARGB_8888, true)
            val canvas = Canvas(bitmap)

            // Draw interaction highlight
            drawInteractionHighlight(canvas, event)

            // Save to file
            val screenshotPath = saveScreenshot(context, bitmap, event)

            // Recycle bitmaps
            if (!originalBitmap.isRecycled) originalBitmap.recycle()
            if (!bitmap.isRecycled) bitmap.recycle()

            // Cleanup old screenshots if needed
            cleanupOldScreenshots(context)

            screenshotPath
        } catch (e: Exception) {
            Log.e(TAG, "Error processing screenshot", e)
            null
        }
    }

    /**
     * Draw highlight at interaction point
     */
    private fun drawInteractionHighlight(canvas: Canvas, event: RecordedEvent) {
        val paint = Paint().apply {
            isAntiAlias = true
            style = Paint.Style.STROKE
            strokeWidth = 8f
        }

        // Get interaction coordinates
        val centerX = event.x?.toFloat()
        val centerY = event.y?.toFloat()

        // Parse bounds if coordinates not available
        val bounds = parseBounds(event.bounds)

        when (event.eventType) {
            "tap" -> {
                // Draw circle at tap point - Green
                paint.color = Color.parseColor("#4CAF50")

                if (centerX != null && centerY != null) {
                    // Draw outer circle
                    canvas.drawCircle(centerX, centerY, 60f, paint)
                    // Draw inner filled circle
                    paint.style = Paint.Style.FILL
                    paint.alpha = 80
                    canvas.drawCircle(centerX, centerY, 40f, paint)

                    // Draw crosshair
                    paint.style = Paint.Style.STROKE
                    paint.alpha = 255
                    paint.strokeWidth = 4f
                    canvas.drawLine(centerX - 80f, centerY, centerX + 80f, centerY, paint)
                    canvas.drawLine(centerX, centerY - 80f, centerX, centerY + 80f, paint)
                } else if (bounds != null) {
                    // Draw rectangle around element
                    val rect = RectF(bounds)
                    rect.inset(-10f, -10f)
                    canvas.drawRoundRect(rect, 12f, 12f, paint)

                    paint.style = Paint.Style.FILL
                    paint.alpha = 40
                    canvas.drawRoundRect(rect, 12f, 12f, paint)
                }
            }

            "double_tap" -> {
                // Draw double circle for double tap - Cyan
                paint.color = Color.parseColor("#00BCD4")

                if (centerX != null && centerY != null) {
                    // Draw outer double circle
                    canvas.drawCircle(centerX, centerY, 70f, paint)
                    canvas.drawCircle(centerX, centerY, 50f, paint)

                    // Draw inner filled circle
                    paint.style = Paint.Style.FILL
                    paint.alpha = 100
                    canvas.drawCircle(centerX, centerY, 35f, paint)

                    // Draw "2x" text indicator
                    paint.style = Paint.Style.FILL
                    paint.alpha = 255
                    paint.textSize = 32f
                    paint.textAlign = Paint.Align.CENTER
                    canvas.drawText("2x", centerX, centerY - 90f, paint)
                } else if (bounds != null) {
                    val rect = RectF(bounds)
                    rect.inset(-12f, -12f)
                    canvas.drawRoundRect(rect, 12f, 12f, paint)
                }
            }

            "long_tap" -> {
                // Draw circle at long tap point - Orange
                paint.color = Color.parseColor("#FF9800")

                if (centerX != null && centerY != null) {
                    // Draw pulsing circles
                    canvas.drawCircle(centerX, centerY, 70f, paint)
                    paint.alpha = 150
                    canvas.drawCircle(centerX, centerY, 55f, paint)

                    // Draw inner filled circle
                    paint.style = Paint.Style.FILL
                    paint.alpha = 80
                    canvas.drawCircle(centerX, centerY, 40f, paint)

                    // Draw long press indicator
                    paint.style = Paint.Style.STROKE
                    paint.alpha = 255
                    paint.strokeWidth = 6f
                    val arcRect = RectF(centerX - 50f, centerY - 50f, centerX + 50f, centerY + 50f)
                    canvas.drawArc(arcRect, -90f, 270f, false, paint)
                } else if (bounds != null) {
                    val rect = RectF(bounds)
                    rect.inset(-10f, -10f)
                    canvas.drawRoundRect(rect, 12f, 12f, paint)

                    paint.style = Paint.Style.FILL
                    paint.alpha = 40
                    canvas.drawRoundRect(rect, 12f, 12f, paint)
                }
            }

            "scroll" -> {
                // Draw scroll indicator - Blue
                paint.color = Color.parseColor("#2196F3")

                if (bounds != null) {
                    val rect = RectF(bounds)

                    // Draw container border
                    paint.pathEffect = DashPathEffect(floatArrayOf(20f, 10f), 0f)
                    paint.style = Paint.Style.STROKE
                    paint.strokeWidth = 4f
                    canvas.drawRoundRect(rect, 8f, 8f, paint)

                    // Get scroll data
                    val direction = event.actionData?.get("direction") as? String
                    val deltaX = (event.actionData?.get("delta_x") as? Number)?.toFloat() ?: 0f
                    val deltaY = (event.actionData?.get("delta_y") as? Number)?.toFloat() ?: 0f

                    // Calculate start and end points for scroll path
                    val rectCenterX = rect.centerX()
                    val rectCenterY = rect.centerY()

                    // Determine scroll path based on direction
                    val scrollPath = when (direction) {
                        "up" -> {
                            // Scroll up: finger moves from bottom to top
                            ScrollPath(rectCenterX, rect.bottom - 50f, rectCenterX, rect.top + 50f)
                        }
                        "down" -> {
                            // Scroll down: finger moves from top to bottom
                            ScrollPath(rectCenterX, rect.top + 50f, rectCenterX, rect.bottom - 50f)
                        }
                        "left" -> {
                            // Scroll left: finger moves from right to left
                            ScrollPath(rect.right - 50f, rectCenterY, rect.left + 50f, rectCenterY)
                        }
                        "right" -> {
                            // Scroll right: finger moves from left to right
                            ScrollPath(rect.left + 50f, rectCenterY, rect.right - 50f, rectCenterY)
                        }
                        else -> {
                            // Default: use deltaX/deltaY if available
                            if (kotlin.math.abs(deltaY) > kotlin.math.abs(deltaX)) {
                                // Vertical scroll
                                if (deltaY > 0) {
                                    ScrollPath(rectCenterX, rect.top + 50f, rectCenterX, rect.bottom - 50f)
                                } else {
                                    ScrollPath(rectCenterX, rect.bottom - 50f, rectCenterX, rect.top + 50f)
                                }
                            } else {
                                // Horizontal scroll
                                if (deltaX > 0) {
                                    ScrollPath(rect.left + 50f, rectCenterY, rect.right - 50f, rectCenterY)
                                } else {
                                    ScrollPath(rect.right - 50f, rectCenterY, rect.left + 50f, rectCenterY)
                                }
                            }
                        }
                    }

                    // Draw scroll path (swipe line)
                    paint.pathEffect = null
                    paint.style = Paint.Style.STROKE
                    paint.strokeWidth = 12f
                    paint.strokeCap = Paint.Cap.ROUND
                    paint.alpha = 180
                    canvas.drawLine(scrollPath.startX, scrollPath.startY, scrollPath.endX, scrollPath.endY, paint)

                    // Draw start point (circle)
                    paint.style = Paint.Style.FILL
                    paint.alpha = 120
                    canvas.drawCircle(scrollPath.startX, scrollPath.startY, 20f, paint)

                    // Draw end point (circle with white border)
                    paint.alpha = 200
                    canvas.drawCircle(scrollPath.endX, scrollPath.endY, 25f, paint)
                    paint.color = Color.WHITE
                    paint.style = Paint.Style.STROKE
                    paint.strokeWidth = 4f
                    canvas.drawCircle(scrollPath.endX, scrollPath.endY, 25f, paint)

                    // Draw arrow at end point
                    paint.color = Color.parseColor("#2196F3")
                    paint.style = Paint.Style.FILL
                    paint.alpha = 255
                    drawScrollArrowAtPoint(canvas, scrollPath.startX, scrollPath.startY, scrollPath.endX, scrollPath.endY, paint)

                    // Draw motion lines (trail effect)
                    paint.color = Color.parseColor("#2196F3")
                    paint.style = Paint.Style.STROKE
                    paint.strokeWidth = 3f
                    paint.alpha = 100
                    val steps = 5
                    for (i in 1..steps) {
                        val t = i.toFloat() / (steps + 1)
                        val mx = scrollPath.startX + (scrollPath.endX - scrollPath.startX) * t
                        val my = scrollPath.startY + (scrollPath.endY - scrollPath.startY) * t
                        val offset = 15f

                        if (kotlin.math.abs(scrollPath.endY - scrollPath.startY) > kotlin.math.abs(scrollPath.endX - scrollPath.startX)) {
                            // Vertical scroll - draw horizontal lines
                            canvas.drawLine(mx - offset, my, mx + offset, my, paint)
                        } else {
                            // Horizontal scroll - draw vertical lines
                            canvas.drawLine(mx, my - offset, mx, my + offset, paint)
                        }
                    }
                }
            }

            "text_input" -> {
                // Draw text input indicator - Purple
                paint.color = Color.parseColor("#9C27B0")

                if (bounds != null) {
                    val rect = RectF(bounds)
                    rect.inset(-6f, -6f)
                    canvas.drawRoundRect(rect, 8f, 8f, paint)

                    // Draw keyboard icon indicator
                    paint.style = Paint.Style.FILL
                    paint.alpha = 60
                    canvas.drawRoundRect(rect, 8f, 8f, paint)
                }
            }

            "text_delete" -> {
                // Draw text delete indicator - Red
                paint.color = Color.parseColor("#F44336")

                if (bounds != null) {
                    val rect = RectF(bounds)
                    rect.inset(-6f, -6f)
                    canvas.drawRoundRect(rect, 8f, 8f, paint)

                    // Draw X mark for delete
                    paint.style = Paint.Style.STROKE
                    paint.strokeWidth = 6f
                    paint.alpha = 200
                    val padding = 20f
                    canvas.drawLine(
                        rect.left + padding, rect.top + padding,
                        rect.right - padding, rect.bottom - padding,
                        paint
                    )
                    canvas.drawLine(
                        rect.right - padding, rect.top + padding,
                        rect.left + padding, rect.bottom - padding,
                        paint
                    )

                    // Draw backspace icon
                    paint.style = Paint.Style.FILL
                    paint.alpha = 60
                    canvas.drawRoundRect(rect, 8f, 8f, paint)
                }
            }

            else -> {
                // Default highlight - Gray
                paint.color = Color.parseColor("#607D8B")
                if (bounds != null) {
                    canvas.drawRect(RectF(bounds), paint)
                }
            }
        }

        // Draw event type badge
        drawEventBadge(canvas, event)
    }

    /**
     * Draw scroll direction arrow (old method - kept for compatibility)
     */
    private fun drawScrollArrow(canvas: Canvas, bounds: RectF, direction: String?, paint: Paint) {
        val arrowPaint = Paint(paint).apply {
            style = Paint.Style.FILL
            pathEffect = null
            alpha = 200
        }

        val centerX = bounds.centerX()
        val centerY = bounds.centerY()
        val arrowSize = 40f

        val path = Path()
        when (direction) {
            "up" -> {
                path.moveTo(centerX, centerY - arrowSize)
                path.lineTo(centerX - arrowSize/2, centerY)
                path.lineTo(centerX + arrowSize/2, centerY)
                path.close()
            }
            "down" -> {
                path.moveTo(centerX, centerY + arrowSize)
                path.lineTo(centerX - arrowSize/2, centerY)
                path.lineTo(centerX + arrowSize/2, centerY)
                path.close()
            }
            "left" -> {
                path.moveTo(centerX - arrowSize, centerY)
                path.lineTo(centerX, centerY - arrowSize/2)
                path.lineTo(centerX, centerY + arrowSize/2)
                path.close()
            }
            "right" -> {
                path.moveTo(centerX + arrowSize, centerY)
                path.lineTo(centerX, centerY - arrowSize/2)
                path.lineTo(centerX, centerY + arrowSize/2)
                path.close()
            }
        }
        canvas.drawPath(path, arrowPaint)
    }

    /**
     * Draw arrow pointing from start to end point
     */
    private fun drawScrollArrowAtPoint(
        canvas: Canvas,
        startX: Float,
        startY: Float,
        endX: Float,
        endY: Float,
        paint: Paint
    ) {
        val arrowPaint = Paint(paint).apply {
            style = Paint.Style.FILL
            pathEffect = null
        }

        // Calculate angle
        val angle = kotlin.math.atan2((endY - startY).toDouble(), (endX - startX).toDouble()).toFloat()
        val arrowSize = 30f

        // Draw triangle arrow at end point
        val path = Path()

        // Arrow tip at end point
        path.moveTo(endX, endY)

        // Arrow base points
        val baseAngle1 = angle + Math.PI.toFloat() * 0.75f
        val baseAngle2 = angle - Math.PI.toFloat() * 0.75f

        path.lineTo(
            endX + arrowSize * kotlin.math.cos(baseAngle1),
            endY + arrowSize * kotlin.math.sin(baseAngle1)
        )
        path.lineTo(
            endX + arrowSize * kotlin.math.cos(baseAngle2),
            endY + arrowSize * kotlin.math.sin(baseAngle2)
        )
        path.close()

        canvas.drawPath(path, arrowPaint)
    }

    /**
     * Draw event type badge in corner
     */
    private fun drawEventBadge(canvas: Canvas, event: RecordedEvent) {
        val badgePaint = Paint().apply {
            isAntiAlias = true
            color = getEventColor(event.eventType)
            style = Paint.Style.FILL
        }

        val textPaint = Paint().apply {
            isAntiAlias = true
            color = Color.WHITE
            textSize = 36f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }

        val eventLabel = getEventLabel(event.eventType)
        val textBounds = Rect()
        textPaint.getTextBounds(eventLabel, 0, eventLabel.length, textBounds)

        val padding = 20f
        val badgeWidth = textBounds.width() + padding * 2
        val badgeHeight = textBounds.height() + padding * 2

        // Draw badge in top-left corner
        val badgeRect = RectF(20f, 20f, 20f + badgeWidth, 20f + badgeHeight)
        canvas.drawRoundRect(badgeRect, 12f, 12f, badgePaint)

        // Draw text
        canvas.drawText(
            eventLabel,
            badgeRect.left + padding,
            badgeRect.bottom - padding + 4f,
            textPaint
        )

        // Draw timestamp
        val timePaint = Paint(textPaint).apply {
            textSize = 28f
            typeface = Typeface.DEFAULT
        }
        val timeText = "+${event.relativeTimestamp / 1000.0}s"
        canvas.drawText(
            timeText,
            badgeRect.right + 16f,
            badgeRect.centerY() + 10f,
            timePaint
        )
    }

    /**
     * Save screenshot to file
     */
    private fun saveScreenshot(context: Context, bitmap: Bitmap, event: RecordedEvent): String? {
        return try {
            val screenshotDir = File(context.cacheDir, SCREENSHOT_DIR)
            if (!screenshotDir.exists()) {
                screenshotDir.mkdirs()
            }

            val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss_SSS", Locale.US).format(Date())
            val filename = "event_${event.sequenceNumber}_${event.eventType}_$timestamp.jpg"
            val file = File(screenshotDir, filename)

            FileOutputStream(file).use { out ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, SCREENSHOT_QUALITY, out)
            }

            Log.d(TAG, "Screenshot saved: ${file.absolutePath}")
            file.absolutePath
        } catch (e: Exception) {
            Log.e(TAG, "Error saving screenshot", e)
            null
        }
    }

    /**
     * Check if we should capture screenshot for this event type
     */
    private fun shouldCaptureScreenshot(eventType: String): Boolean {
        return eventType in listOf("tap", "long_tap", "text_input", "scroll")
    }

    /**
     * Parse bounds string "left,top,right,bottom" to RectF
     */
    private fun parseBounds(bounds: String): RectF? {
        if (bounds.isBlank()) return null
        return try {
            val parts = bounds.split(",").map { it.trim().toFloat() }
            if (parts.size == 4) {
                RectF(parts[0], parts[1], parts[2], parts[3])
            } else null
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Get color for event type
     */
    private fun getEventColor(eventType: String): Int {
        return when (eventType) {
            "tap" -> Color.parseColor("#4CAF50")
            "long_tap" -> Color.parseColor("#FF9800")
            "scroll" -> Color.parseColor("#2196F3")
            "text_input" -> Color.parseColor("#9C27B0")
            "focus" -> Color.parseColor("#00BCD4")
            else -> Color.parseColor("#607D8B")
        }
    }

    /**
     * Get label for event type
     */
    private fun getEventLabel(eventType: String): String {
        return when (eventType) {
            "tap" -> "TAP"
            "long_tap" -> "LONG TAP"
            "scroll" -> "SCROLL"
            "text_input" -> "INPUT"
            "focus" -> "FOCUS"
            else -> eventType.uppercase()
        }
    }

    /**
     * Get app info (name and icon) for a package
     */
    fun getAppInfo(context: Context, packageName: String): AppInfo {
        // Check cache first
        appInfoCache[packageName]?.let { return it }

        return try {
            val pm = context.packageManager
            val appInfo = pm.getApplicationInfo(packageName, 0)
            val appName = pm.getApplicationLabel(appInfo).toString()

            val info = AppInfo(appName, packageName)
            appInfoCache[packageName] = info
            info
        } catch (e: PackageManager.NameNotFoundException) {
            val info = AppInfo(packageName.substringAfterLast("."), packageName)
            appInfoCache[packageName] = info
            info
        }
    }

    /**
     * Cleanup old screenshots to prevent storage overflow
     */
    private fun cleanupOldScreenshots(context: Context) {
        try {
            val screenshotDir = File(context.cacheDir, SCREENSHOT_DIR)
            if (!screenshotDir.exists()) return

            val files = screenshotDir.listFiles()?.sortedByDescending { it.lastModified() } ?: return

            if (files.size > MAX_SCREENSHOTS) {
                files.drop(MAX_SCREENSHOTS).forEach { file ->
                    file.delete()
                    Log.d(TAG, "Deleted old screenshot: ${file.name}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error cleaning up screenshots", e)
        }
    }

    /**
     * Delete all screenshots
     */
    fun clearAllScreenshots(context: Context) {
        try {
            val screenshotDir = File(context.cacheDir, SCREENSHOT_DIR)
            if (screenshotDir.exists()) {
                screenshotDir.listFiles()?.forEach { it.delete() }
                Log.i(TAG, "All screenshots cleared")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error clearing screenshots", e)
        }
    }

    /**
     * Get screenshot file if exists
     */
    fun getScreenshotFile(path: String?): File? {
        if (path.isNullOrBlank()) return null
        val file = File(path)
        return if (file.exists()) file else null
    }

    /**
     * Cancel all pending operations
     */
    fun shutdown() {
        scope.cancel()
    }
}
