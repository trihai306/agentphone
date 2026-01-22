package com.agent.portal.vision

import android.graphics.Bitmap
import android.graphics.Rect
import android.util.Log
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.Text
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import com.google.mlkit.vision.objects.ObjectDetection
import com.google.mlkit.vision.objects.ObjectDetector
import com.google.mlkit.vision.objects.defaults.ObjectDetectorOptions
import com.google.mlkit.vision.label.ImageLabeling
import com.google.mlkit.vision.label.ImageLabeler
import com.google.mlkit.vision.label.defaults.ImageLabelerOptions
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

/**
 * Visual Inspection Service using ML Kit
 * 
 * Features:
 * - OCR text detection with bounding boxes
 * - Object detection for icons/UI elements
 * - Image labeling for classification
 * - Returns coordinates for each detected element
 * - Supports Vietnamese and Latin characters
 */
object VisualInspectionService {

    private const val TAG = "VisualInspectionService"

    // ML Kit Text Recognizer (Latin/Vietnamese)
    private val textRecognizer by lazy {
        TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
    }
    
    // ML Kit Object Detector for UI elements/icons
    private val objectDetector: ObjectDetector by lazy {
        val options = ObjectDetectorOptions.Builder()
            .setDetectorMode(ObjectDetectorOptions.SINGLE_IMAGE_MODE)
            .enableMultipleObjects()
            .enableClassification()
            .build()
        ObjectDetection.getClient(options)
    }
    
    // ML Kit Image Labeler for classification
    private val imageLabeler: ImageLabeler by lazy {
        val options = ImageLabelerOptions.Builder()
            .setConfidenceThreshold(0.7f)
            .build()
        ImageLabeling.getClient(options)
    }
    
    /**
     * Crop a region from bitmap and encode to base64
     * Returns null if cropping fails
     */
    private fun cropAndEncode(bitmap: Bitmap, bounds: Rect, maxSize: Int = 100): String? {
        return try {
            // Ensure bounds are within bitmap
            val left = bounds.left.coerceIn(0, bitmap.width - 1)
            val top = bounds.top.coerceIn(0, bitmap.height - 1)
            val right = bounds.right.coerceIn(left + 1, bitmap.width)
            val bottom = bounds.bottom.coerceIn(top + 1, bitmap.height)
            val width = right - left
            val height = bottom - top
            
            if (width <= 0 || height <= 0) return null
            
            // Crop the region
            val cropped = Bitmap.createBitmap(bitmap, left, top, width, height)
            
            // Scale down if too large (for bandwidth)
            val scaledBitmap = if (width > maxSize || height > maxSize) {
                val scale = maxSize.toFloat() / maxOf(width, height)
                val newWidth = (width * scale).toInt().coerceAtLeast(1)
                val newHeight = (height * scale).toInt().coerceAtLeast(1)
                Bitmap.createScaledBitmap(cropped, newWidth, newHeight, true).also {
                    if (it != cropped) cropped.recycle()
                }
            } else {
                cropped
            }
            
            // Encode to base64
            val outputStream = java.io.ByteArrayOutputStream()
            scaledBitmap.compress(Bitmap.CompressFormat.PNG, 90, outputStream)
            val result = android.util.Base64.encodeToString(outputStream.toByteArray(), android.util.Base64.NO_WRAP)
            
            // Cleanup
            if (scaledBitmap != cropped) scaledBitmap.recycle()
            
            result
        } catch (e: Exception) {
            Log.e(TAG, "Failed to crop and encode image", e)
            null
        }
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
            "language" to language,
            "type" to "text"
        )
    }
    
    /**
     * Detected object/icon element with cropped image
     */
    data class DetectedObject(
        val label: String,
        val bounds: Rect,
        val centerX: Int,
        val centerY: Int,
        val confidence: Float,
        val trackingId: Int? = null,
        val imageBase64: String? = null  // Cropped icon image
    ) {
        fun toMap(): Map<String, Any?> = mapOf(
            "text" to label,
            "label" to label,
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
            "trackingId" to trackingId,
            "type" to "object",
            "image" to imageBase64
        )
    }

    /**
     * Result of visual inspection
     */
    data class InspectionResult(
        val success: Boolean,
        val textElements: List<TextElement>,
        val objectElements: List<DetectedObject> = emptyList(),
        val screenshotWidth: Int,
        val screenshotHeight: Int,
        val processingTimeMs: Long,
        val error: String? = null
    ) {
        fun toMap(): Map<String, Any?> = mapOf(
            "success" to success,
            "text_elements" to textElements.map { it.toMap() },
            "object_elements" to objectElements.map { it.toMap() },
            // Combined elements for unified frontend display
            "all_elements" to (textElements.map { it.toMap() } + objectElements.map { it.toMap() }),
            "screenshot_width" to screenshotWidth,
            "screenshot_height" to screenshotHeight,
            "processing_time_ms" to processingTimeMs,
            "error" to error,
            "total_elements" to (textElements.size + objectElements.size),
            "text_count" to textElements.size,
            "object_count" to objectElements.size
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
     * Detect objects/icons in bitmap using ML Kit Object Detection
     */
    suspend fun detectObjects(bitmap: Bitmap): List<DetectedObject> {
        return try {
            val inputImage = InputImage.fromBitmap(bitmap, 0)
            
            suspendCancellableCoroutine { continuation ->
                objectDetector.process(inputImage)
                    .addOnSuccessListener { detectedObjects ->
                        val objects = detectedObjects.mapNotNull { obj ->
                            val bounds = obj.boundingBox
                            // Get label with highest confidence or use "Object"
                            val label = obj.labels.maxByOrNull { it.confidence }?.text ?: "Object"
                            val confidence = obj.labels.maxByOrNull { it.confidence }?.confidence ?: 0.5f
                            
                            // Crop and encode icon image
                            val croppedImage = cropAndEncode(bitmap, bounds, maxSize = 80)
                            
                            DetectedObject(
                                label = label,
                                bounds = bounds,
                                centerX = bounds.centerX(),
                                centerY = bounds.centerY(),
                                confidence = confidence,
                                trackingId = obj.trackingId,
                                imageBase64 = croppedImage
                            )
                        }
                        Log.i(TAG, "✅ Object detection: ${objects.size} objects found")
                        continuation.resume(objects)
                    }
                    .addOnFailureListener { e ->
                        Log.e(TAG, "Object detection failed", e)
                        continuation.resume(emptyList())
                    }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Object detection exception", e)
            emptyList()
        }
    }
    
    /**
     * Combined detection: OCR text + Object detection
     * Best for unified element picker showing all interactive elements
     */
    suspend fun detectTextAndObjects(bitmap: Bitmap): InspectionResult {
        val startTime = System.currentTimeMillis()
        
        return try {
            val inputImage = InputImage.fromBitmap(bitmap, 0)
            
            // Run text and object detection in parallel using coroutines
            val textElements = mutableListOf<TextElement>()
            val objectElements = mutableListOf<DetectedObject>()
            
            // Text recognition
            val textResult = suspendCancellableCoroutine<Text?> { continuation ->
                textRecognizer.process(inputImage)
                    .addOnSuccessListener { text -> continuation.resume(text) }
                    .addOnFailureListener { e ->
                        Log.e(TAG, "Text recognition failed", e)
                        continuation.resume(null)
                    }
            }
            
            // Extract text elements - use LINES instead of individual word elements
            // This prevents fragmentation like "Admin" "•" being separate
            textResult?.let { text ->
                for (block in text.textBlocks) {
                    // Add full lines for complete text representation
                    for (line in block.lines) {
                        val lineBounds = line.boundingBox ?: continue
                        textElements.add(TextElement(
                            text = line.text,
                            bounds = lineBounds,
                            centerX = lineBounds.centerX(),
                            centerY = lineBounds.centerY(),
                            confidence = line.confidence ?: 0.9f,
                            language = line.recognizedLanguage
                        ))
                    }
                }
            }
            
            // Object detection with cropped images
            val detectedObjs = suspendCancellableCoroutine<List<DetectedObject>> { continuation ->
                objectDetector.process(inputImage)
                    .addOnSuccessListener { objects ->
                        val objList = objects.mapNotNull { obj ->
                            val bounds = obj.boundingBox
                            val label = obj.labels.maxByOrNull { it.confidence }?.text ?: "Object"
                            val confidence = obj.labels.maxByOrNull { it.confidence }?.confidence ?: 0.5f
                            
                            // Crop and encode icon image
                            val croppedImage = cropAndEncode(bitmap, bounds, maxSize = 80)
                            
                            DetectedObject(
                                label = label,
                                bounds = bounds,
                                centerX = bounds.centerX(),
                                centerY = bounds.centerY(),
                                confidence = confidence,
                                trackingId = obj.trackingId,
                                imageBase64 = croppedImage
                            )
                        }
                        continuation.resume(objList)
                    }
                    .addOnFailureListener { e ->
                        Log.e(TAG, "Object detection failed", e)
                        continuation.resume(emptyList())
                    }
            }
            objectElements.addAll(detectedObjs)
            
            val processingTime = System.currentTimeMillis() - startTime
            Log.i(TAG, "✅ Combined detection: ${textElements.size} texts, ${objectElements.size} objects in ${processingTime}ms")
            
            InspectionResult(
                success = true,
                textElements = textElements,
                objectElements = objectElements,
                screenshotWidth = bitmap.width,
                screenshotHeight = bitmap.height,
                processingTimeMs = processingTime
            )
            
        } catch (e: Exception) {
            Log.e(TAG, "Combined detection failed", e)
            InspectionResult(
                success = false,
                textElements = emptyList(),
                objectElements = emptyList(),
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
        objectDetector.close()
        imageLabeler.close()
    }
}
