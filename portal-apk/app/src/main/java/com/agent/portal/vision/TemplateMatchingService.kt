package com.agent.portal.vision

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.URL
import kotlin.math.abs
import kotlin.math.sqrt

/**
 * Template Matching Service
 * 
 * Finds a template image within a screenshot using pixel-based comparison.
 * Used for visual element detection when accessibility matching fails.
 */
class TemplateMatchingService {
    
    companion object {
        private const val TAG = "TemplateMatching"
        
        // Matching thresholds
        private const val MIN_MATCH_THRESHOLD = 0.70 // Minimum similarity to consider a match (70%)
        private const val SAMPLE_STEP = 4 // Sample every 4th pixel for speed
        private const val MAX_TEMPLATE_SIZE = 150 // Max template dimension to process
    }
    
    /**
     * Download image from URL
     */
    suspend fun downloadImage(url: String): Bitmap? = withContext(Dispatchers.IO) {
        try {
            val connection = URL(url).openConnection()
            connection.connectTimeout = 5000
            connection.readTimeout = 5000
            connection.inputStream.use { stream ->
                BitmapFactory.decodeStream(stream)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to download image from $url: ${e.message}")
            null
        }
    }
    
    /**
     * Find template position in screenshot
     * Returns center coordinates of best match, or null if no good match found
     * Uses multi-scale matching for better accuracy
     */
    fun findTemplate(screenshot: Bitmap, template: Bitmap): MatchResult? {
        return findTemplateWithHint(screenshot, template, null, null)
    }
    
    /**
     * Find template with expected position hint for smarter matching
     * Searches entire screen but gives bonus to matches near expected position
     */
    fun findTemplateWithHint(
        screenshot: Bitmap, 
        template: Bitmap,
        expectedX: Int?,
        expectedY: Int?
    ): MatchResult? {
        val hasHint = expectedX != null && expectedY != null
        Log.i(TAG, "🔍 Starting template matching${if (hasHint) " with hint ($expectedX, $expectedY)" else ""}...")
        Log.i(TAG, "   Template: ${template.width}x${template.height}")
        Log.i(TAG, "   Screenshot: ${screenshot.width}x${screenshot.height}")
        
        val tWidth = template.width
        val tHeight = template.height
        val sWidth = screenshot.width
        val sHeight = screenshot.height
        
        if (tWidth >= sWidth || tHeight >= sHeight) {
            Log.w(TAG, "Template is larger than screenshot, cannot match")
            return null
        }
        
        // PHASE 1: If hint given, search region around expected position first (FAST)
        if (hasHint) {
            val regionResult = searchRegion(screenshot, template, expectedX!!, expectedY!!, 200)
            if (regionResult != null && regionResult.score >= MIN_MATCH_THRESHOLD) {
                val distance = kotlin.math.sqrt(
                    ((regionResult.x - expectedX) * (regionResult.x - expectedX) + 
                     (regionResult.y - expectedY) * (regionResult.y - expectedY)).toDouble()
                )
                if (distance < 100) {
                    Log.i(TAG, "   ⚡ Region match found! Score ${(regionResult.score*100).toInt()}% at ${distance.toInt()}px from hint")
                    return regionResult
                }
            }
        }
        
        // PHASE 2: Multi-scale full screen search (slower, only if region search failed)
        Log.d(TAG, "   Region search failed, trying full screen...")
        val scales = listOf(1.0f, 0.9f, 0.8f, 1.1f, 1.2f)
        var bestResult: Triple<Double, Int, Int>? = null  // score, x, y
        var bestScale = 1.0f
        var bestTemplateSize = Pair(tWidth, tHeight)
        
        for (scale in scales) {
            val scaledWidth = (tWidth * scale).toInt().coerceAtLeast(10)
            val scaledHeight = (tHeight * scale).toInt().coerceAtLeast(10)
            
            // Skip if scaled template is too large for screenshot
            if (scaledWidth >= sWidth || scaledHeight >= sHeight) continue
            if (scaledWidth > MAX_TEMPLATE_SIZE * 1.5 || scaledHeight > MAX_TEMPLATE_SIZE * 1.5) continue
            
            val scaledTemplate = if (scale != 1.0f) {
                Bitmap.createScaledBitmap(template, scaledWidth, scaledHeight, true)
            } else {
                template
            }
            
            // Use smart matching with expected position hint
            val result = findBestMatchWithExpectedPosition(screenshot, scaledTemplate, expectedX, expectedY)
            
            if (result != null && (bestResult == null || result.first > bestResult!!.first)) {
                bestResult = result
                bestScale = scale
                bestTemplateSize = Pair(scaledWidth, scaledHeight)
                
                // EARLY EXIT: If we found excellent match near expected position, stop searching
                if (hasHint && result.first >= 0.95) {
                    val centerX = result.second + scaledWidth / 2
                    val centerY = result.third + scaledHeight / 2
                    val distance = kotlin.math.sqrt(
                        ((centerX - expectedX!!) * (centerX - expectedX) + 
                         (centerY - expectedY!!) * (centerY - expectedY)).toDouble()
                    )
                    if (distance < 100) {
                        Log.i(TAG, "   ⚡ Early exit: excellent match (${(result.first*100).toInt()}%) near hint (${distance.toInt()}px)")
                        if (scaledTemplate != template) scaledTemplate.recycle()
                        break
                    }
                }
            }
            
            // Clean up scaled template
            if (scaledTemplate != template) {
                scaledTemplate.recycle()
            }
        }
        
        if (bestResult != null && bestResult.first >= MIN_MATCH_THRESHOLD) {
            val (score, bestX, bestY) = bestResult
            
            // Return center of matched region
            val centerX = bestX + bestTemplateSize.first / 2
            val centerY = bestY + bestTemplateSize.second / 2
            
            Log.i(TAG, "✅ Template found!")
            Log.i(TAG, "   Score: ${"%.2f".format(score * 100)}%")
            Log.i(TAG, "   Center: ($centerX, $centerY)")
            Log.i(TAG, "   Scale: ${"%.1f".format(bestScale * 100)}%")
            Log.i(TAG, "   Bounds: $bestX,$bestY - ${bestX + bestTemplateSize.first},${bestY + bestTemplateSize.second}")
            if (hasHint) {
                val distance = kotlin.math.sqrt(
                    ((centerX - expectedX!!) * (centerX - expectedX) + 
                     (centerY - expectedY!!) * (centerY - expectedY)).toDouble()
                ).toInt()
                Log.i(TAG, "   Distance from hint: ${distance}px")
            }
            
            return MatchResult(
                x = centerX,
                y = centerY,
                score = score,
                width = bestTemplateSize.first,
                height = bestTemplateSize.second
            )
        }
        
        Log.w(TAG, "❌ Template not found. Best score: ${"%.2f".format((bestResult?.first ?: 0.0) * 100)}%")
        return null
    }
    /**
     * Fast local search in region around expected position
     * Much faster than full screen search for verification
     */
    private fun searchRegion(
        screenshot: Bitmap,
        template: Bitmap, 
        expectedX: Int,
        expectedY: Int,
        radius: Int
    ): MatchResult? {
        val tWidth = template.width
        val tHeight = template.height
        val sWidth = screenshot.width
        val sHeight = screenshot.height
        
        // Calculate search bounds
        val minX = (expectedX - radius - tWidth / 2).coerceIn(0, sWidth - tWidth)
        val maxX = (expectedX + radius - tWidth / 2).coerceIn(0, sWidth - tWidth)
        val minY = (expectedY - radius - tHeight / 2).coerceIn(0, sHeight - tHeight)
        val maxY = (expectedY + radius - tHeight / 2).coerceIn(0, sHeight - tHeight)
        
        if (maxX <= minX || maxY <= minY) return null
        
        var bestScore = 0.0
        var bestX = 0
        var bestY = 0
        
        // Finer step for local search
        val step = 8
        for (y in minY..maxY step step) {
            for (x in minX..maxX step step) {
                val score = calculateSimilarity(screenshot, template, x, y)
                if (score > bestScore) {
                    bestScore = score
                    bestX = x
                    bestY = y
                }
            }
        }
        
        // Refine best position
        if (bestScore >= MIN_MATCH_THRESHOLD * 0.9) {
            val refined = refineMatch(screenshot, template, bestX, bestY, bestScore)
            bestScore = refined.first
            bestX = refined.second
            bestY = refined.third
        }
        
        if (bestScore >= MIN_MATCH_THRESHOLD) {
            val centerX = bestX + tWidth / 2
            val centerY = bestY + tHeight / 2
            return MatchResult(
                x = centerX,
                y = centerY,
                score = bestScore,
                width = tWidth,
                height = tHeight
            )
        }
        
        return null
    }
    
    /**
     * Find best match position for a single template
     * Returns best match considering expected position if provided
     */
    private fun findBestMatch(screenshot: Bitmap, template: Bitmap): Triple<Double, Int, Int>? {
        return findBestMatchWithExpectedPosition(screenshot, template, null, null)
    }
    
    /**
     * Find best match with preference for positions near expected coordinates
     * Finds ALL candidates above threshold, then picks best one (considering proximity)
     */
    fun findBestMatchWithExpectedPosition(
        screenshot: Bitmap, 
        template: Bitmap,
        expectedX: Int?,
        expectedY: Int?
    ): Triple<Double, Int, Int>? {
        val tWidth = template.width
        val tHeight = template.height
        val sWidth = screenshot.width
        val sHeight = screenshot.height
        
        // Collect ALL candidates above threshold
        val candidates = mutableListOf<Triple<Double, Int, Int>>()
        val candidateThreshold = 0.60  // Collect candidates with 60%+ similarity
        
        // Coarse scan with larger step
        val coarseStep = 16 // Larger step for faster scanning
        for (y in 0 until (sHeight - tHeight) step coarseStep) {
            for (x in 0 until (sWidth - tWidth) step coarseStep) {
                val score = calculateSimilarity(screenshot, template, x, y)
                if (score >= candidateThreshold) {
                    candidates.add(Triple(score, x, y))
                }
            }
        }
        
        if (candidates.isEmpty()) {
            Log.d(TAG, "   No candidates found above ${(candidateThreshold * 100).toInt()}% threshold")
            return null
        }
        
        // Sort by score first, then take top candidates for processing
        val maxCandidates = 20 // Reduced for speed
        val sortedCandidates = if (expectedX != null && expectedY != null) {
            // Sort by combined score (visual + proximity bonus estimate) 
            candidates.sortedByDescending { (score, x, y) ->
                val centerX = x + tWidth / 2
                val centerY = y + tHeight / 2
                val distance = kotlin.math.sqrt(
                    ((centerX - expectedX) * (centerX - expectedX) + 
                     (centerY - expectedY) * (centerY - expectedY)).toDouble()
                )
                // Quick estimate of combined score
                score + (0.15 * (1.0 - (distance / 400.0).coerceIn(0.0, 1.0)))
            }.take(maxCandidates)
        } else {
            candidates.sortedByDescending { it.first }.take(maxCandidates)
        }
        
        Log.d(TAG, "   Found ${candidates.size} candidate(s), processing top ${sortedCandidates.size}")
        
        // Refine top candidates to get precise position and score
        val refinedCandidates = sortedCandidates.map { (score, x, y) ->
            refineMatch(screenshot, template, x, y, score)
        }
        
        // If expected position given, score by: visual similarity + proximity bonus
        val finalCandidates = if (expectedX != null && expectedY != null) {
            refinedCandidates.map { (score, x, y) ->
                val centerX = x + tWidth / 2
                val centerY = y + tHeight / 2
                val distance = kotlin.math.sqrt(
                    ((centerX - expectedX) * (centerX - expectedX) + 
                     (centerY - expectedY) * (centerY - expectedY)).toDouble()
                )
                // Proximity bonus: max 0.15 bonus for being very close (0-50px)
                // Decays with distance, becomes 0 at 400px
                val proximityBonus = (0.15 * (1.0 - (distance / 400.0).coerceIn(0.0, 1.0))).coerceAtLeast(0.0)
                val combinedScore = score + proximityBonus
                
                Log.d(TAG, "   Candidate at ($centerX,$centerY): visual=${(score*100).toInt()}%, dist=${distance.toInt()}px, bonus=${(proximityBonus*100).toInt()}%, combined=${(combinedScore*100).toInt()}%")
                
                Triple(combinedScore, x, y)
            }
        } else {
            refinedCandidates
        }
        
        // Pick best combined score
        val best = finalCandidates.maxByOrNull { it.first }
        
        if (best != null) {
            val (score, x, y) = best
            Log.d(TAG, "   Best candidate: score=${(score*100).toInt()}% at ($x,$y)")
        }
        
        return best
    }
    
    /**
     * Refine a coarse match to get precise position
     */
    private fun refineMatch(
        screenshot: Bitmap, 
        template: Bitmap, 
        startX: Int, 
        startY: Int,
        initialScore: Double
    ): Triple<Double, Int, Int> {
        val tWidth = template.width
        val tHeight = template.height
        val sWidth = screenshot.width
        val sHeight = screenshot.height
        
        var bestScore = initialScore
        var bestX = startX
        var bestY = startY
        
        // Medium refinement (step 2)
        if (bestScore > 0.4) {
            for (dy in -8..8 step 2) {
                for (dx in -8..8 step 2) {
                    val rx = startX + dx
                    val ry = startY + dy
                    if (rx >= 0 && ry >= 0 && rx + tWidth < sWidth && ry + tHeight < sHeight) {
                        val score = calculateSimilarity(screenshot, template, rx, ry)
                        if (score > bestScore) {
                            bestScore = score
                            bestX = rx
                            bestY = ry
                        }
                    }
                }
            }
        }
        
        // Fine refinement (pixel level)
        if (bestScore > 0.5) {
            for (dy in -2..2) {
                for (dx in -2..2) {
                    val rx = bestX + dx
                    val ry = bestY + dy
                    if (rx >= 0 && ry >= 0 && rx + tWidth < sWidth && ry + tHeight < sHeight) {
                        val score = calculateSimilarity(screenshot, template, rx, ry)
                        if (score > bestScore) {
                            bestScore = score
                            bestX = rx
                            bestY = ry
                        }
                    }
                }
            }
        }
        
        return Triple(bestScore, bestX, bestY)
    }
    
    /**
     * Calculate similarity between template and region of screenshot
     * Uses normalized RGB distance
     */
    private fun calculateSimilarity(
        screenshot: Bitmap,
        template: Bitmap,
        offsetX: Int,
        offsetY: Int
    ): Double {
        val tWidth = template.width
        val tHeight = template.height
        
        var totalDistance = 0.0
        var pixelCount = 0
        
        // Sample pixels for efficiency
        for (ty in 0 until tHeight step SAMPLE_STEP) {
            for (tx in 0 until tWidth step SAMPLE_STEP) {
                val tPixel = template.getPixel(tx, ty)
                val sPixel = screenshot.getPixel(offsetX + tx, offsetY + ty)
                
                // Skip fully transparent pixels in template
                if (Color.alpha(tPixel) < 128) continue
                
                // Calculate RGB distance
                val rDiff = abs(Color.red(tPixel) - Color.red(sPixel))
                val gDiff = abs(Color.green(tPixel) - Color.green(sPixel))
                val bDiff = abs(Color.blue(tPixel) - Color.blue(sPixel))
                
                // Normalized distance (0-1)
                val distance = (rDiff + gDiff + bDiff) / (255.0 * 3)
                totalDistance += distance
                pixelCount++
            }
        }
        
        if (pixelCount == 0) return 0.0
        
        // Return similarity (1 - average distance)
        return 1.0 - (totalDistance / pixelCount)
    }
    
    /**
     * Find template position near expected coordinates
     * Searches within a region around (expectedX, expectedY) first,
     * falls back to full screen search if not found
     * 
     * @param screenshot The screenshot bitmap
     * @param template The template bitmap to find
     * @param expectedX Expected X coordinate (center)
     * @param expectedY Expected Y coordinate (center)
     * @param searchRadius Radius around expected position to search (default 200px)
     */
    fun findTemplateNearPosition(
        screenshot: Bitmap, 
        template: Bitmap,
        expectedX: Int,
        expectedY: Int,
        searchRadius: Int = 200
    ): MatchResult? {
        Log.i(TAG, "🔍 Starting localized template matching near ($expectedX, $expectedY)...")
        Log.i(TAG, "   Template: ${template.width}x${template.height}")
        Log.i(TAG, "   Screenshot: ${screenshot.width}x${screenshot.height}")
        Log.i(TAG, "   Search radius: ${searchRadius}px")
        
        val tWidth = template.width
        val tHeight = template.height
        val sWidth = screenshot.width
        val sHeight = screenshot.height
        
        if (tWidth >= sWidth || tHeight >= sHeight) {
            Log.w(TAG, "Template is larger than screenshot, cannot match")
            return null
        }
        
        // Define search region centered on expected position
        val searchLeft = (expectedX - searchRadius).coerceAtLeast(0)
        val searchTop = (expectedY - searchRadius).coerceAtLeast(0)
        val searchRight = (expectedX + searchRadius).coerceAtMost(sWidth - tWidth)
        val searchBottom = (expectedY + searchRadius).coerceAtMost(sHeight - tHeight)
        
        Log.i(TAG, "   Search region: ($searchLeft,$searchTop) - ($searchRight,$searchBottom)")
        
        // Multi-scale matching within region
        val scales = listOf(1.0f, 0.9f, 0.8f, 1.1f, 1.2f)
        var bestResult: Triple<Double, Int, Int>? = null
        var bestScale = 1.0f
        var bestTemplateSize = Pair(tWidth, tHeight)
        
        for (scale in scales) {
            val scaledWidth = (tWidth * scale).toInt().coerceAtLeast(10)
            val scaledHeight = (tHeight * scale).toInt().coerceAtLeast(10)
            
            if (scaledWidth >= sWidth || scaledHeight >= sHeight) continue
            
            val scaledTemplate = if (scale != 1.0f) {
                Bitmap.createScaledBitmap(template, scaledWidth, scaledHeight, true)
            } else {
                template
            }
            
            // Search within region
            val result = findBestMatchInRegion(
                screenshot, scaledTemplate, 
                searchLeft, searchTop, searchRight, searchBottom
            )
            
            if (result != null && (bestResult == null || result.first > bestResult!!.first)) {
                bestResult = result
                bestScale = scale
                bestTemplateSize = Pair(scaledWidth, scaledHeight)
            }
            
            if (scaledTemplate != template) {
                scaledTemplate.recycle()
            }
        }
        
        if (bestResult != null && bestResult.first >= MIN_MATCH_THRESHOLD) {
            val (score, bestX, bestY) = bestResult
            val centerX = bestX + bestTemplateSize.first / 2
            val centerY = bestY + bestTemplateSize.second / 2
            
            Log.i(TAG, "✅ Template found near expected position!")
            Log.i(TAG, "   Score: ${"%.2f".format(score * 100)}%")
            Log.i(TAG, "   Found at: ($centerX, $centerY)")
            Log.i(TAG, "   Expected: ($expectedX, $expectedY)")
            Log.i(TAG, "   Distance: ${kotlin.math.sqrt(((centerX - expectedX) * (centerX - expectedX) + (centerY - expectedY) * (centerY - expectedY)).toDouble()).toInt()}px")
            Log.i(TAG, "   Scale: ${"%.1f".format(bestScale * 100)}%")
            
            return MatchResult(
                x = centerX,
                y = centerY,
                score = score,
                width = bestTemplateSize.first,
                height = bestTemplateSize.second
            )
        }
        
        // Fallback to full screen search
        Log.i(TAG, "   Not found in local region, trying full screen...")
        return findTemplate(screenshot, template)
    }
    
    /**
     * Find best match within a specific region
     */
    private fun findBestMatchInRegion(
        screenshot: Bitmap, 
        template: Bitmap,
        left: Int, top: Int, right: Int, bottom: Int
    ): Triple<Double, Int, Int>? {
        val tWidth = template.width
        val tHeight = template.height
        
        var bestScore = 0.0
        var bestX = -1
        var bestY = -1
        
        // Coarse scan with step 4 (finer than full screen scan)
        val coarseStep = 4
        for (y in top until bottom step coarseStep) {
            for (x in left until right step coarseStep) {
                if (x + tWidth > screenshot.width || y + tHeight > screenshot.height) continue
                val score = calculateSimilarity(screenshot, template, x, y)
                if (score > bestScore) {
                    bestScore = score
                    bestX = x
                    bestY = y
                }
            }
        }
        
        // Fine refinement
        if (bestScore > 0.4 && bestX >= 0) {
            for (dy in -coarseStep..coarseStep) {
                for (dx in -coarseStep..coarseStep) {
                    val rx = bestX + dx
                    val ry = bestY + dy
                    if (rx >= left && ry >= top && rx + tWidth <= screenshot.width && ry + tHeight <= screenshot.height) {
                        val score = calculateSimilarity(screenshot, template, rx, ry)
                        if (score > bestScore) {
                            bestScore = score
                            bestX = rx
                            bestY = ry
                        }
                    }
                }
            }
        }
        
        return if (bestX >= 0) Triple(bestScore, bestX, bestY) else null
    }
    
    /**
     * Match result data class
     */
    data class MatchResult(
        val x: Int,
        val y: Int,
        val score: Double,
        val width: Int,
        val height: Int
    )
    
    // ============ DEBUG FUNCTIONS FOR TEMPLATE MATCHING ANALYSIS ============
    
    /**
     * DEBUG: Analyze template image properties (color distribution, brightness)
     */
    fun analyzeTemplate(template: Bitmap, name: String) {
        var totalR = 0L; var totalG = 0L; var totalB = 0L
        var pixelCount = 0; var minBrightness = 255; var maxBrightness = 0
        
        for (y in 0 until template.height step 2) {
            for (x in 0 until template.width step 2) {
                val pixel = template.getPixel(x, y)
                if (Color.alpha(pixel) < 128) continue
                val r = Color.red(pixel); val g = Color.green(pixel); val b = Color.blue(pixel)
                totalR += r; totalG += g; totalB += b
                val brightness = (r + g + b) / 3
                minBrightness = minOf(minBrightness, brightness)
                maxBrightness = maxOf(maxBrightness, brightness)
                pixelCount++
            }
        }
        
        if (pixelCount > 0) {
            Log.i(TAG, "📊 DEBUG $name: ${template.width}x${template.height}, avgRGB=(${(totalR/pixelCount).toInt()},${(totalG/pixelCount).toInt()},${(totalB/pixelCount).toInt()}), brightness=$minBrightness-$maxBrightness")
        }
    }
    
    /**
     * DEBUG: Compare template vs screenshot pixels at specific position
     */
    fun debugPixelComparison(screenshot: Bitmap, template: Bitmap, offsetX: Int, offsetY: Int, label: String) {
        val samplePoints = listOf("TL" to Pair(2, 2), "TR" to Pair(template.width - 3, 2), "C" to Pair(template.width / 2, template.height / 2))
        val sb = StringBuilder("🔬 $label: ")
        var totalDiff = 0
        
        for ((name, pos) in samplePoints) {
            val (tx, ty) = pos
            if (tx >= template.width || ty >= template.height || tx < 0 || ty < 0) continue
            val tPixel = template.getPixel(tx, ty)
            val sx = offsetX + tx; val sy = offsetY + ty
            if (sx >= screenshot.width || sy >= screenshot.height) continue
            val sPixel = screenshot.getPixel(sx, sy)
            val diff = abs(Color.red(tPixel) - Color.red(sPixel)) + abs(Color.green(tPixel) - Color.green(sPixel)) + abs(Color.blue(tPixel) - Color.blue(sPixel))
            totalDiff += diff
            sb.append("$name=Δ$diff ")
        }
        Log.i(TAG, "$sb TotalΔ=$totalDiff")
    }
    
    /**
     * DEBUG: Enhanced template search with detailed logging
     */
    fun findTemplateWithDebug(screenshot: Bitmap, template: Bitmap, expectedX: Int?, expectedY: Int?): MatchResult? {
        Log.i(TAG, "═══════════════════════════════════════════════════")
        Log.i(TAG, "🔍 DEBUG TEMPLATE MATCHING - Template: ${template.width}x${template.height}, Screenshot: ${screenshot.width}x${screenshot.height}, Expected: ($expectedX, $expectedY)")
        analyzeTemplate(template, "Template")
        
        if (expectedX != null && expectedY != null) {
            val exactX = (expectedX - template.width / 2).coerceIn(0, screenshot.width - template.width)
            val exactY = (expectedY - template.height / 2).coerceIn(0, screenshot.height - template.height)
            val exactScore = calculateSimilarity(screenshot, template, exactX, exactY)
            Log.i(TAG, "📍 Score at expected ($exactX,$exactY): ${(exactScore * 100).toInt()}%")
            debugPixelComparison(screenshot, template, exactX, exactY, "ExpectedPos")
        }
        
        val result = findTemplateWithHint(screenshot, template, expectedX, expectedY)
        if (result != null) {
            Log.i(TAG, "✅ MATCH: (${result.x}, ${result.y}) Score=${(result.score * 100).toInt()}%")
        } else {
            Log.w(TAG, "❌ NO MATCH above ${(MIN_MATCH_THRESHOLD * 100).toInt()}%")
        }
        Log.i(TAG, "═══════════════════════════════════════════════════")
        return result
    }
}

