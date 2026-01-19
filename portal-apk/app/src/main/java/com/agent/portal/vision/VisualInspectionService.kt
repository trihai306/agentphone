package com.agent.portal.vision

import android.graphics.Bitmap
import android.graphics.Rect
import android.util.Log
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.Text
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

/**
 * Visual Inspection Service using ML Kit Text Recognition
 * 
 * Features:
 * - OCR text detection with bounding boxes
 * - Returns coordinates for each detected text element
 * - Supports Vietnamese and Latin characters
 */
object VisualInspectionService {

    private const val TAG = "VisualInspectionService"

    // ML Kit Text Recognizer (Latin/Vietnamese)
    private val textRecognizer by lazy {
        TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
    }

    /**
     * Detected text element with coordinates
     */
    data class TextElement(
        val text: String,
        val bounds: Rect,
        val centerX: Int,
        val centerY: Int,
        val confidence: Float,
        val language: String? = null
    ) {
        fun toMap(): Map<String, Any?> = mapOf(
            "text" to text,
            "bounds" to mapOf(
                "left" to bounds.left,
                "top" to bounds.top,
                "right" to bounds.right,
                "bottom" to bounds.bottom,
                "width" to bounds.width(),
                "height" to bounds.height()
            ),
            "center" to mapOf("x" to centerX, "y" to centerY),
            "confidence" to confidence,
            "language" to language
        )
    }

    /**
     * Result of visual inspection
     */
    data class InspectionResult(
        val success: Boolean,
        val textElements: List<TextElement>,
        val screenshotWidth: Int,
        val screenshotHeight: Int,
        val processingTimeMs: Long,
        val error: String? = null
    ) {
        fun toMap(): Map<String, Any?> = mapOf(
            "success" to success,
            "text_elements" to textElements.map { it.toMap() },
            "screenshot_width" to screenshotWidth,
            "screenshot_height" to screenshotHeight,
            "processing_time_ms" to processingTimeMs,
            "error" to error,
            "total_elements" to textElements.size
        )
    }

    /**
     * Perform OCR text detection on a bitmap
     * Returns all detected text elements with their bounding boxes
     */
    suspend fun detectText(bitmap: Bitmap): InspectionResult {
        val startTime = System.currentTimeMillis()
        
        return try {
            val inputImage = InputImage.fromBitmap(bitmap, 0)
            
            val textResult = suspendCancellableCoroutine<Text?> { continuation ->
                textRecognizer.process(inputImage)
                    .addOnSuccessListener { text ->
                        continuation.resume(text)
                    }
                    .addOnFailureListener { e ->
                        Log.e(TAG, "Text recognition failed", e)
                        continuation.resume(null)
                    }
            }

            if (textResult == null) {
                return InspectionResult(
                    success = false,
                    textElements = emptyList(),
                    screenshotWidth = bitmap.width,
                    screenshotHeight = bitmap.height,
                    processingTimeMs = System.currentTimeMillis() - startTime,
                    error = "OCR processing failed"
                )
            }

            // Extract text elements from all blocks -> lines -> elements
            val elements = mutableListOf<TextElement>()
            
            for (block in textResult.textBlocks) {
                for (line in block.lines) {
                    for (element in line.elements) {
                        val bounds = element.boundingBox ?: continue
                        
                        elements.add(TextElement(
                            text = element.text,
                            bounds = bounds,
                            centerX = bounds.centerX(),
                            centerY = bounds.centerY(),
                            confidence = element.confidence ?: 0.9f,
                            language = element.recognizedLanguage
                        ))
                    }
                }
                
                // Also add full lines for better matching
                for (line in block.lines) {
                    val lineBounds = line.boundingBox ?: continue
                    elements.add(TextElement(
                        text = line.text,
                        bounds = lineBounds,
                        centerX = lineBounds.centerX(),
                        centerY = lineBounds.centerY(),
                        confidence = line.confidence ?: 0.9f,
                        language = line.recognizedLanguage
                    ))
                }
            }

            val processingTime = System.currentTimeMillis() - startTime
            Log.i(TAG, "✅ OCR completed: ${elements.size} elements in ${processingTime}ms")
            
            InspectionResult(
                success = true,
                textElements = elements,
                screenshotWidth = bitmap.width,
                screenshotHeight = bitmap.height,
                processingTimeMs = processingTime
            )

        } catch (e: Exception) {
            Log.e(TAG, "Visual inspection failed", e)
            InspectionResult(
                success = false,
                textElements = emptyList(),
                screenshotWidth = bitmap.width,
                screenshotHeight = bitmap.height,
                processingTimeMs = System.currentTimeMillis() - startTime,
                error = e.message
            )
        }
    }

    /**
     * Find text element matching a query
     */
    fun findTextElement(
        elements: List<TextElement>,
        query: String,
        matchType: MatchType = MatchType.CONTAINS,
        caseSensitive: Boolean = false
    ): TextElement? {
        val normalizedQuery = if (caseSensitive) query else query.lowercase()
        
        return elements.find { element ->
            val normalizedText = if (caseSensitive) element.text else element.text.lowercase()
            
            when (matchType) {
                MatchType.EXACT -> normalizedText == normalizedQuery
                MatchType.CONTAINS -> normalizedText.contains(normalizedQuery)
                MatchType.STARTS_WITH -> normalizedText.startsWith(normalizedQuery)
                MatchType.ENDS_WITH -> normalizedText.endsWith(normalizedQuery)
                MatchType.REGEX -> try {
                    Regex(query, if (caseSensitive) setOf() else setOf(RegexOption.IGNORE_CASE))
                        .containsMatchIn(element.text)
                } catch (e: Exception) {
                    false
                }
            }
        }
    }

    /**
     * Match types for text search
     */
    enum class MatchType {
        EXACT,
        CONTAINS,
        STARTS_WITH,
        ENDS_WITH,
        REGEX
    }
    
    /**
     * Release resources
     */
    fun close() {
        textRecognizer.close()
    }
}
