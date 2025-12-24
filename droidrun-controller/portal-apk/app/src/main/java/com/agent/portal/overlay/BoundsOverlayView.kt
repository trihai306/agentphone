package com.agent.portal.overlay

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.Typeface
import android.util.AttributeSet
import android.view.View
import com.agent.portal.R
import com.agent.portal.utils.A11yNode

/**
 * Custom view that draws bounds/borders around interactive elements
 */
class BoundsOverlayView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private var nodes: List<A11yNode> = emptyList()
    private var showBounds: Boolean = true
    private var showIndexes: Boolean = true

    // Paint for clickable elements (blue)
    private val clickablePaint = Paint().apply {
        color = context.getColor(R.color.bounds_clickable)
        style = Paint.Style.STROKE
        strokeWidth = 3f
        isAntiAlias = true
    }

    // Paint for editable elements (green)
    private val editablePaint = Paint().apply {
        color = context.getColor(R.color.bounds_editable)
        style = Paint.Style.STROKE
        strokeWidth = 3f
        isAntiAlias = true
    }

    // Paint for scrollable elements (purple)
    private val scrollablePaint = Paint().apply {
        color = context.getColor(R.color.bounds_scrollable)
        style = Paint.Style.STROKE
        strokeWidth = 3f
        isAntiAlias = true
    }

    // Paint for focusable elements (yellow/orange)
    private val focusablePaint = Paint().apply {
        color = context.getColor(R.color.bounds_focusable)
        style = Paint.Style.STROKE
        strokeWidth = 2f
        isAntiAlias = true
    }

    // Paint for default elements
    private val defaultPaint = Paint().apply {
        color = context.getColor(R.color.bounds_default)
        style = Paint.Style.STROKE
        strokeWidth = 1f
        isAntiAlias = true
    }

    // Paint for index background
    private val indexBgPaint = Paint().apply {
        color = Color.parseColor("#CC000000")
        style = Paint.Style.FILL
        isAntiAlias = true
    }

    // Paint for index text
    private val indexTextPaint = Paint().apply {
        color = Color.WHITE
        textSize = 24f
        typeface = Typeface.DEFAULT_BOLD
        isAntiAlias = true
        textAlign = Paint.Align.CENTER
    }

    // Corner radius for bounds
    private val cornerRadius = 8f

    private val rectF = RectF()
    private val textBounds = Rect()

    fun updateNodes(newNodes: List<A11yNode>) {
        nodes = newNodes
        invalidate()
    }

    fun setShowBounds(show: Boolean) {
        showBounds = show
        invalidate()
    }

    fun setShowIndexes(show: Boolean) {
        showIndexes = show
        invalidate()
    }

    fun setBoundsAndIndexes(bounds: Boolean, indexes: Boolean) {
        showBounds = bounds
        showIndexes = indexes
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        if (!showBounds && !showIndexes) return

        for (node in nodes) {
            drawNode(canvas, node)
        }
    }

    private fun drawNode(canvas: Canvas, node: A11yNode) {
        // Parse bounds string "left,top,right,bottom"
        val bounds = parseBounds(node.bounds) ?: return

        // Skip nodes with invalid/tiny bounds
        if (bounds.width() < 5 || bounds.height() < 5) return

        // Determine element type and select paint
        val paint = when {
            node.editable -> editablePaint
            node.clickable || node.longClickable -> clickablePaint
            node.scrollable -> scrollablePaint
            node.focusable -> focusablePaint
            else -> null // Only draw interactive elements
        }

        // Draw bounds if enabled and element is interactive
        if (showBounds && paint != null) {
            rectF.set(bounds)
            canvas.drawRoundRect(rectF, cornerRadius, cornerRadius, paint)
        }

        // Draw index label if enabled and element is interactive
        if (showIndexes && (node.clickable || node.editable || node.longClickable || node.scrollable)) {
            drawIndex(canvas, bounds, node.index, paint ?: clickablePaint)
        }

        // Recursively draw children
        for (child in node.children) {
            drawNode(canvas, child)
        }
    }

    private fun drawIndex(canvas: Canvas, bounds: RectF, index: Int, paint: Paint) {
        val indexText = index.toString()
        indexTextPaint.getTextBounds(indexText, 0, indexText.length, textBounds)

        val padding = 6f
        val bgWidth = textBounds.width() + padding * 2 + 4
        val bgHeight = textBounds.height() + padding * 2

        // Position at top-left corner of the element
        val bgLeft = bounds.left
        val bgTop = bounds.top
        val bgRight = bgLeft + bgWidth
        val bgBottom = bgTop + bgHeight

        // Draw background with same color as border (with transparency)
        indexBgPaint.color = Color.argb(
            200,
            Color.red(paint.color),
            Color.green(paint.color),
            Color.blue(paint.color)
        )

        rectF.set(bgLeft, bgTop, bgRight, bgBottom)
        canvas.drawRoundRect(rectF, 4f, 4f, indexBgPaint)

        // Draw index text
        val textX = bgLeft + bgWidth / 2
        val textY = bgTop + bgHeight / 2 + textBounds.height() / 2 - 2
        canvas.drawText(indexText, textX, textY, indexTextPaint)
    }

    private fun parseBounds(boundsStr: String): RectF? {
        return try {
            val parts = boundsStr.split(",")
            if (parts.size == 4) {
                RectF(
                    parts[0].toFloat(),
                    parts[1].toFloat(),
                    parts[2].toFloat(),
                    parts[3].toFloat()
                )
            } else null
        } catch (e: Exception) {
            null
        }
    }

    companion object {
        private const val TAG = "BoundsOverlayView"
    }
}
