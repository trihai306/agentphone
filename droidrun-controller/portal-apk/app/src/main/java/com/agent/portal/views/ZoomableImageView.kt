package com.agent.portal.views

import android.content.Context
import android.graphics.Matrix
import android.graphics.PointF
import android.util.AttributeSet
import android.view.GestureDetector
import android.view.MotionEvent
import android.view.ScaleGestureDetector
import androidx.appcompat.widget.AppCompatImageView
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

/**
 * Custom ImageView with pinch-to-zoom and pan support
 */
class ZoomableImageView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : AppCompatImageView(context, attrs, defStyleAttr) {

    private val matrix = Matrix()
    private val savedMatrix = Matrix()

    // Scale detection
    private var scaleDetector: ScaleGestureDetector
    private var gestureDetector: GestureDetector

    // Current transformation state
    private var currentScale = 1f
    private val minScale = 1f
    private val maxScale = 5f

    // Touch state
    private val lastTouch = PointF()
    private val start = PointF()

    private enum class Mode {
        NONE, DRAG, ZOOM
    }

    private var mode = Mode.NONE

    init {
        scaleType = ScaleType.MATRIX
        imageMatrix = matrix

        scaleDetector = ScaleGestureDetector(context, ScaleListener())
        gestureDetector = GestureDetector(context, GestureListener())

        setOnTouchListener { _, event ->
            scaleDetector.onTouchEvent(event)
            gestureDetector.onTouchEvent(event)

            when (event.action and MotionEvent.ACTION_MASK) {
                MotionEvent.ACTION_DOWN -> {
                    savedMatrix.set(matrix)
                    start.set(event.x, event.y)
                    lastTouch.set(start)
                    mode = Mode.DRAG
                }

                MotionEvent.ACTION_POINTER_DOWN -> {
                    savedMatrix.set(matrix)
                    mode = Mode.ZOOM
                }

                MotionEvent.ACTION_MOVE -> {
                    if (mode == Mode.DRAG && currentScale > 1f) {
                        matrix.set(savedMatrix)
                        val dx = event.x - start.x
                        val dy = event.y - start.y
                        matrix.postTranslate(dx, dy)
                    }
                }

                MotionEvent.ACTION_UP, MotionEvent.ACTION_POINTER_UP -> {
                    mode = Mode.NONE
                }
            }

            // Limit translation to keep image in bounds
            fixTranslation()
            imageMatrix = matrix
            true
        }
    }

    /**
     * Scale gesture listener
     */
    private inner class ScaleListener : ScaleGestureDetector.SimpleOnScaleGestureListener() {
        override fun onScale(detector: ScaleGestureDetector): Boolean {
            val scaleFactor = detector.scaleFactor
            val newScale = currentScale * scaleFactor

            if (newScale in minScale..maxScale) {
                currentScale = newScale
                matrix.postScale(
                    scaleFactor,
                    scaleFactor,
                    detector.focusX,
                    detector.focusY
                )
                fixTranslation()
                imageMatrix = matrix
            }

            return true
        }
    }

    /**
     * Gesture listener for double-tap to zoom
     */
    private inner class GestureListener : GestureDetector.SimpleOnGestureListener() {
        override fun onDoubleTap(e: MotionEvent): Boolean {
            // Toggle between fit and zoomed
            if (currentScale > minScale + 0.1f) {
                // Zoom out to fit
                resetZoom()
            } else {
                // Zoom in to 2x
                val targetScale = 2f
                val scaleFactor = targetScale / currentScale
                currentScale = targetScale
                matrix.postScale(scaleFactor, scaleFactor, e.x, e.y)
                fixTranslation()
                imageMatrix = matrix
            }
            return true
        }
    }

    /**
     * Reset zoom to fit screen
     */
    private fun resetZoom() {
        currentScale = minScale
        matrix.reset()
        imageMatrix = matrix
    }

    /**
     * Keep image within bounds when panning
     */
    private fun fixTranslation() {
        val values = FloatArray(9)
        matrix.getValues(values)

        val transX = values[Matrix.MTRANS_X]
        val transY = values[Matrix.MTRANS_Y]

        val fixTransX = getFixTranslation(transX, width.toFloat(), getImageWidth() * currentScale)
        val fixTransY = getFixTranslation(transY, height.toFloat(), getImageHeight() * currentScale)

        if (fixTransX != 0f || fixTransY != 0f) {
            matrix.postTranslate(fixTransX, fixTransY)
        }
    }

    /**
     * Calculate translation adjustment to keep image in bounds
     */
    private fun getFixTranslation(trans: Float, viewSize: Float, contentSize: Float): Float {
        val minTrans: Float
        val maxTrans: Float

        if (contentSize <= viewSize) {
            minTrans = 0f
            maxTrans = viewSize - contentSize
        } else {
            minTrans = viewSize - contentSize
            maxTrans = 0f
        }

        return when {
            trans < minTrans -> -trans + minTrans
            trans > maxTrans -> -trans + maxTrans
            else -> 0f
        }
    }

    /**
     * Get current image width
     */
    private fun getImageWidth(): Float {
        return drawable?.intrinsicWidth?.toFloat() ?: 0f
    }

    /**
     * Get current image height
     */
    private fun getImageHeight(): Float {
        return drawable?.intrinsicHeight?.toFloat() ?: 0f
    }

    /**
     * Reset view when new image is set
     */
    override fun setImageDrawable(drawable: android.graphics.drawable.Drawable?) {
        super.setImageDrawable(drawable)
        resetZoom()
    }

    override fun setImageBitmap(bm: android.graphics.Bitmap?) {
        super.setImageBitmap(bm)
        resetZoom()
    }
}
