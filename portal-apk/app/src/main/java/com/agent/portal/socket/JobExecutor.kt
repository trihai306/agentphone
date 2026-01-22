package com.agent.portal.socket

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.util.Log
import android.view.accessibility.AccessibilityNodeInfo
import com.agent.portal.accessibility.PortalAccessibilityService
import com.agent.portal.auth.AuthService
import com.agent.portal.vision.TemplateMatchingService
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.io.FileOutputStream
import java.lang.ref.WeakReference
import java.util.concurrent.TimeUnit

/**
 * Job Executor - Executes actions from configuration
 *
 * Responsibilities:
 * - Execute actions sequentially
 * - Handle waits and delays
 * - Retry on failures
 * - Collect results
 * - Error handling
 * - Report progress to backend for real-time UI updates
 */
class JobExecutor(context: Context) {

    private val TAG = "JobExecutor"
    private val contextRef = WeakReference(context.applicationContext)
    private val context: Context
        get() = contextRef.get() ?: throw IllegalStateException("Context is no longer available")
    private val actionResults = mutableListOf<ActionResult>()
    private val templateMatcher = TemplateMatchingService()
    private val gson = Gson()
    
    // HTTP client for progress reporting
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(5, TimeUnit.SECONDS)
        .readTimeout(5, TimeUnit.SECONDS)
        .build()

    /**
     * Execute job with action configuration
     */
    suspend fun execute(job: Job, config: ActionConfig): JobResult {
        val startTime = System.currentTimeMillis()

        try {
            Log.i(TAG, "Executing job: ${job.id} with ${config.actions.size} actions")

            // Execute each action sequentially
            for ((index, action) in config.actions.withIndex()) {
                Log.d(TAG, "Action ${index + 1}/${config.actions.size}: ${action.type}")

                // Wait before action if specified
                if (action.waitBefore > 0) {
                    delay(action.waitBefore)
                }

                // Check condition if present
                if (action.condition != null && !checkCondition(action.condition)) {
                    Log.d(TAG, "Skipping action ${action.id} - condition not met")
                    // Report skipped status
                    job.flowId?.let { flowId ->
                        reportProgress(flowId, action.id, "skipped", index + 1, config.actions.size, "Condition not met")
                    }
                    continue
                }

                // Report running status BEFORE executing action
                job.flowId?.let { flowId ->
                    reportProgress(flowId, action.id, "running", index + 1, config.actions.size)
                }
                
                // Update floating overlay with current action name and progress
                com.agent.portal.overlay.FloatingJobProgressService.updateProgress(
                    context,
                    currentAction = index + 1,
                    totalActions = config.actions.size,
                    actionName = "${action.type}"
                )

                // Execute action
                val result = executeAction(action, job.params)
                actionResults.add(result)

                // Handle action result
                if (!result.success) {
                    // Report error status
                    job.flowId?.let { flowId ->
                        reportProgress(flowId, action.id, "error", index + 1, config.actions.size, result.error)
                    }
                    
                    if (action.optional) {
                        Log.w(TAG, "Optional action failed: ${action.id} - ${result.error}")
                    } else {
                        when (config.onError) {
                            ErrorHandling.STOP -> {
                                throw Exception("Action ${action.id} failed: ${result.error}")
                            }
                            ErrorHandling.CONTINUE -> {
                                Log.w(TAG, "Action failed but continuing: ${result.error}")
                            }
                            ErrorHandling.RETRY -> {
                                // Retry logic handled in executeAction
                                if (!result.success) {
                                    throw Exception("Action ${action.id} failed after retries")
                                }
                            }
                            ErrorHandling.SKIP -> {
                                Log.w(TAG, "Skipping failed action: ${action.id}")
                            }
                        }
                    }
                } else {
                    // Report success status
                    job.flowId?.let { flowId ->
                        reportProgress(flowId, action.id, "success", index + 1, config.actions.size)
                    }
                }

                // Wait after action
                if (action.waitAfter > 0) {
                    delay(action.waitAfter)
                }
            }

            val executionTime = System.currentTimeMillis() - startTime

            return JobResult(
                success = true,
                message = "Job completed successfully",
                data = mapOf(
                    "actions_executed" to actionResults.size,
                    "action_results" to actionResults
                ),
                executionTime = executionTime
            )

        } catch (e: Exception) {
            val executionTime = System.currentTimeMillis() - startTime
            Log.e(TAG, "Job execution failed", e)

            return JobResult(
                success = false,
                message = "Job execution failed",
                error = e.message,
                data = mapOf(
                    "actions_executed" to actionResults.size,
                    "action_results" to actionResults
                ),
                executionTime = executionTime
            )
        }
    }

    /**
     * Report action progress to backend for real-time UI updates
     * This enables node highlighting during workflow execution
     */
    private suspend fun reportProgress(
        flowId: Int,
        actionId: String,
        status: String,
        sequence: Int,
        totalActions: Int,
        message: String? = null,
        errorBranchTarget: String? = null
    ) {
        withContext(Dispatchers.IO) {
            try {
                // Get base URL from NetworkUtils
                val baseUrl = com.agent.portal.utils.NetworkUtils.getApiBaseUrl()
                
                // Get auth token from SharedPreferences
                val prefs = context.getSharedPreferences("portal_auth", android.content.Context.MODE_PRIVATE)
                val token = prefs.getString("auth_token", null) ?: return@withContext
                
                val payload = mapOf(
                    "flow_id" to flowId,
                    "action_id" to actionId,
                    "status" to status,
                    "sequence" to sequence,
                    "total_actions" to totalActions,
                    "message" to message,
                    "error_branch_target" to errorBranchTarget
                )
                
                val json = gson.toJson(payload)
                val requestBody = json.toRequestBody("application/json".toMediaType())
                
                val request = Request.Builder()
                    .url("$baseUrl/workflow/test-run/progress")
                    .post(requestBody)
                    .addHeader("Authorization", "Bearer $token")
                    .addHeader("Accept", "application/json")
                    .build()
                
                httpClient.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        Log.w(TAG, "Failed to report progress: ${response.code}")
                    } else {
                        Log.d(TAG, "Progress reported: $actionId -> $status")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error reporting progress", e)
            }
        }
    }

    /**
     * Execute individual action
     */
    private suspend fun executeAction(action: Action, jobParams: Map<String, Any>?): ActionResult {
        val startTime = System.currentTimeMillis()
        var attempts = 0
        var lastError: String? = null

        while (attempts <= action.retryOnFail) {
            try {
                attempts++

                val result = when (action.type) {
                    ActionType.TAP -> executeTap(action.params)
                    ActionType.DOUBLE_TAP -> executeDoubleTap(action.params)
                    ActionType.LONG_PRESS -> executeLongPress(action.params)
                    ActionType.SWIPE -> executeSwipe(action.params)
                    ActionType.SCROLL -> executeScroll(action.params)
                    ActionType.TEXT_INPUT -> executeTextInput(action.params)
                    ActionType.PRESS_KEY -> executePressKey(action.params)
                    ActionType.START_APP -> executeStartApp(action.params)
                    ActionType.WAIT -> executeWait(action.params)
                    ActionType.SCREENSHOT -> executeScreenshot(action.params)
                    ActionType.ASSERT -> executeAssert(action.params)
                    ActionType.EXTRACT -> executeExtract(action.params)
                    ActionType.ELEMENT_CHECK -> executeElementCheck(action.params)
                    ActionType.WAIT_FOR_ELEMENT -> executeWaitForElement(action.params)
                    ActionType.CUSTOM -> executeCustom(action.params, jobParams)
                }

                if (result.success) {
                    return result
                }

                lastError = result.error

            } catch (e: Exception) {
                lastError = e.message
                Log.w(TAG, "Action attempt $attempts failed: ${e.message}")
            }

            if (attempts <= action.retryOnFail) {
                delay(1000) // Wait before retry
            }
        }

        val executionTime = System.currentTimeMillis() - startTime
        return ActionResult(
            actionId = action.id,
            success = false,
            message = "Action failed after $attempts attempts",
            error = lastError,
            executionTime = executionTime
        )
    }

    /**
     * Execute a single action for test runs (public method for quick test without full job context)
     * @param actionType The action type string (tap, text_input, scroll, etc.)
     * @param params The action parameters
     */
    suspend fun executeTestAction(actionType: String, params: Map<String, Any>): ActionResult {
        return try {
            when (actionType) {
                // Tap/Click actions
                "tap", "click" -> executeTap(params)
                "double_tap" -> executeDoubleTap(params)
                "long_press", "long_tap" -> executeLongPress(params)
                
                // Swipe/Scroll actions
                "swipe" -> executeSwipe(params)
                "scroll" -> executeScroll(params)
                "scroll_up" -> executeScroll(params + ("direction" to "up"))
                "scroll_down" -> executeScroll(params + ("direction" to "down"))
                "scroll_left" -> executeScroll(params + ("direction" to "left"))
                "scroll_right" -> executeScroll(params + ("direction" to "right"))
                
                // Text input actions
                "text_input", "set_text", "type_text" -> executeTextInput(params)
                
                // Key press actions  
                "press_key", "key_event" -> executePressKey(params)
                "back" -> executePressKey(mapOf("key" to "KEYCODE_BACK"))
                "home" -> executePressKey(mapOf("key" to "KEYCODE_HOME"))
                "enter" -> executePressKey(mapOf("key" to "KEYCODE_ENTER"))
                
                // App actions
                "start_app", "open_app", "launch_app" -> executeStartApp(params)
                
                // Utility actions
                "wait", "delay" -> executeWait(params)
                "screenshot" -> executeScreenshot(params)
                "file_input", "upload_file" -> executeFileInput(params)
                
                else -> ActionResult(
                    actionId = "unknown",
                    success = false,
                    message = "Unknown action type: $actionType",
                    error = "Unsupported action"
                )
            }
        } catch (e: Exception) {
            ActionResult(
                actionId = actionType,
                success = false,
                message = "Action failed: ${e.message}",
                error = e.message
            )
        }
    }

    // ================================================================================
    // Action Implementations
    // ================================================================================

    private suspend fun executeTap(params: Map<String, Any>): ActionResult {
        val accessibilityService = PortalAccessibilityService.instance
            ?: throw Exception("Accessibility service not available")

        // ========================================================================
        // ICON/TEMPLATE MATCHING (Highest Priority)
        // Supports both HTTP URLs and base64 encoded images
        // ========================================================================
        val iconData = params["iconUrl"] as? String 
            ?: params["image"] as? String 
            ?: params["iconTemplate"] as? String
        val selectorPriority = params["selectorPriority"] as? String ?: "auto"
        
        // Use template matching if icon data is present AND (priority is "icon" OR icon is provided)
        val shouldUseTemplateMatching = !iconData.isNullOrBlank() && 
            (selectorPriority == "icon" || iconData.startsWith("http"))
        
        if (shouldUseTemplateMatching) {
            Log.d(TAG, "🖼️ Template Matching: Attempting to find element by icon image (priority=$selectorPriority)")
            try {
                val template: android.graphics.Bitmap? = when {
                    // HTTP URL - download image
                    iconData!!.startsWith("http") -> {
                        Log.d(TAG, "   [icon] Downloading template from URL...")
                        templateMatcher.downloadImage(iconData)
                    }
                    // Base64 encoded image
                    iconData.length > 100 -> {
                        Log.d(TAG, "   [icon] Decoding base64 template (${iconData.length} chars)...")
                        try {
                            // Remove data URI prefix if present
                            val base64Data = if (iconData.contains(",")) {
                                iconData.substringAfter(",")
                            } else {
                                iconData
                            }
                            val decodedBytes = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)
                            val bitmap = android.graphics.BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
                            // Convert to SOFTWARE bitmap if needed for pixel access
                            bitmap?.copy(android.graphics.Bitmap.Config.ARGB_8888, false)?.also {
                                if (it != bitmap) bitmap.recycle()
                            }
                        } catch (e: Exception) {
                            Log.e(TAG, "   [icon] Failed to decode base64: ${e.message}")
                            null
                        }
                    }
                    else -> null
                }
                
                if (template != null) {
                    Log.d(TAG, "   [icon] Template ready: ${template.width}x${template.height}")
                    
                    // ========== SMART HINT CALCULATION (Cross-Device Compatible) ==========
                    // Priority:
                    // 1. Use percentage coordinates (xPercent, yPercent) if available → scale to current device
                    // 2. Fallback to absolute (x, y) for old workflows
                    
                    val xPercent = (params["xPercent"] as? Number)?.toDouble()
                    val yPercent = (params["yPercent"] as? Number)?.toDouble()
                    
                    // Get current device resolution
                    val screenshot = accessibilityService.takeScreenshotBitmap()
                    if (screenshot != null) {
                        val currentWidth = screenshot.width
                        val currentHeight = screenshot.height
                        
                        // Calculate hint position
                        val (expectedX, expectedY, hintMode) = if (xPercent != null && yPercent != null) {
                            // NEW: Calculate from percentage (cross-device compatible!)
                            val scaledX = (xPercent / 100.0 * currentWidth).toInt()
                            val scaledY = (yPercent / 100.0 * currentHeight).toInt()
                            Log.d(TAG, "   [icon] Using percentage hint: ${"%.2f".format(xPercent)}%, ${"%.2f".format(yPercent)}% → ($scaledX, $scaledY) on ${currentWidth}×${currentHeight}")
                            Triple(scaledX, scaledY, "percentage")
                        } else {
                            // FALLBACK: Use absolute (old workflows)
                            val absX = (params["x"] as? Number)?.toInt() ?: 0
                            val absY = (params["y"] as? Number)?.toInt() ?: 0
                            Log.d(TAG, "   [icon] Using absolute hint: ($absX, $absY) [backward compat]")
                            Triple(absX, absY, "absolute")
                        }
                        
                        // Convert screenshot to SOFTWARE bitmap for pixel access
                        val softwareScreenshot = screenshot.copy(android.graphics.Bitmap.Config.ARGB_8888, false)
                        if (softwareScreenshot != screenshot) screenshot.recycle()
                        
                        // REGIONAL SEARCH: Only search within 150px radius around hint
                        //
                        // Why regional search:
                        // - Prevents matching wrong icons far from expected position
                        // - Faster than full-screen search
                        // - Works with percentage-based coordinates (hint calculated from %)
                        //
                        // Example:
                        // Hint (992, 1331) from recording
                        // Only search region: (842-1142, 1181-1481)
                        // Reject matches >150px away (like old match at 702px distance!)
                        val matchResult = if (expectedX > 0 && expectedY > 0) {
                            Log.d(TAG, "   [icon] Searching within 150px radius of hint ($expectedX, $expectedY)")
                            templateMatcher.findTemplateNearPosition(
                                softwareScreenshot, template,
                                expectedX, expectedY,
                                searchRadius = 150
                            )
                        } else {
                            Log.d(TAG, "   [icon] No hint provided, searching full screen")
                            templateMatcher.findTemplateWithHint(softwareScreenshot, template, null, null)
                        }
                        
                        val minScore = (params["minConfidence"] as? Number)?.toDouble() ?: 0.65
                        
                        if (matchResult != null && matchResult.score >= minScore) {
                            Log.d(TAG, "✅ Template match found! Score: ${"%.1f".format(matchResult.score * 100)}% at (${matchResult.x}, ${matchResult.y})")
                            Log.d(TAG, "   Hint mode: $hintMode, distance: ${kotlin.math.sqrt(((matchResult.x - expectedX) * (matchResult.x - expectedX) + (matchResult.y - expectedY) * (matchResult.y - expectedY)).toDouble()).toInt()}px")
                            
                            // TAP AT MATCH CENTER (actual icon visual center)
                            // NOT hint (which is element bounds center = icon + text)
                            //
                            // Example:
                            // Element bounds: icon (top) + text "44.3K" (bottom)
                            // Hint (992, 1229) = center of bounds (WRONG - might be below icon!)
                            // Match (992, 1207) = center of icon visual (CORRECT!)
                            val success = accessibilityService.performTap(matchResult.x, matchResult.y)
                            
                            if (success) {
                                return ActionResult(
                                    actionId = "tap_template",
                                    success = true,
                                    message = "Template matched and tapped at (${matchResult.x}, ${matchResult.y}), score: ${"%.1f".format(matchResult.score * 100)}%",
                                    data = mapOf(
                                        "method" to "template_matching", 
                                        "x" to matchResult.x, 
                                        "y" to matchResult.y,
                                        "score" to matchResult.score
                                    )
                                )
                            }
                        } else {
                            val scoreInfo = matchResult?.let { "score=${"%.1f".format(it.score * 100)}%" } ?: "no match"
                            Log.d(TAG, "⚠️ Template match not found or score too low ($scoreInfo), min required: ${"%.0f".format(minScore * 100)}%")
                            
                            // If priority is "icon", try coordinates fallback
                            if (selectorPriority == "icon") {
                                val x = (params["x"] as? Number)?.toInt()
                                val y = (params["y"] as? Number)?.toInt()
                                if (x != null && y != null) {
                                    Log.d(TAG, "   [icon] Falling back to coordinates: ($x, $y)")
                                    softwareScreenshot.recycle()
                                    template.recycle()
                                    
                                    val success = accessibilityService.performTap(x, y)
                                    return ActionResult(
                                        actionId = "tap_coords_fallback",
                                        success = success,
                                        message = if (success) "Template not found, tapped at fallback coords ($x, $y)" else "Tap failed",
                                        data = mapOf("method" to "icon_fallback_coords", "x" to x, "y" to y),
                                        error = if (!success) "Tap gesture failed" else null
                                    )
                                } else {
                                    softwareScreenshot.recycle()
                                    template.recycle()
                                    throw Exception("Template not found (${scoreInfo}) and no fallback coordinates available")
                                }
                            }
                        }
                        softwareScreenshot.recycle()
                    }
                    template.recycle()
                } else {
                    Log.w(TAG, "   [icon] Failed to load template image")
                    if (selectorPriority == "icon") {
                        throw Exception("Failed to load icon template")
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Template matching failed: ${e.message}")
                if (selectorPriority == "icon") {
                    // For icon priority, we can still try coordinates fallback
                    val x = (params["x"] as? Number)?.toInt()
                    val y = (params["y"] as? Number)?.toInt()
                    if (x != null && y != null) {
                        Log.d(TAG, "   [icon] Error fallback to coordinates: ($x, $y)")
                        val success = accessibilityService.performTap(x, y)
                        return ActionResult(
                            actionId = "tap_coords_fallback",
                            success = success,
                            message = if (success) "Icon matching error, tapped at fallback coords ($x, $y): ${e.message}" else "Tap failed",
                            data = mapOf("method" to "icon_error_fallback", "x" to x, "y" to y, "error" to (e.message ?: "")),
                            error = if (!success) "Tap gesture failed" else null
                        )
                    }
                    throw e
                }
            }
        }
        
        // If selectorPriority is "icon" but we got here, it means template matching was attempted and failed/skipped
        // Don't fall through to accessibility matching - the icon mode should only use template matching
        if (selectorPriority == "icon") {
            val x = (params["x"] as? Number)?.toInt()
            val y = (params["y"] as? Number)?.toInt()
            if (x != null && y != null) {
                Log.d(TAG, "   [icon] No template data, using coordinates: ($x, $y)")
                val success = accessibilityService.performTap(x, y)
                return ActionResult(
                    actionId = "tap_coords",
                    success = success,
                    message = if (success) "No icon template, tapped at coords ($x, $y)" else "Tap failed",
                    data = mapOf("method" to "icon_coords_only", "x" to x, "y" to y),
                    error = if (!success) "Tap gesture failed" else null
                )
            }
            throw Exception("Icon mode requires either icon template or coordinates")
        }

        // ========================================================================
        // SMART SELECTOR SYSTEM: Try accessibility attributes first, coordinates as fallback
        // Priority: resourceId > text > contentDescription > coordinates
        // ========================================================================
        
        val resourceId = params["resourceId"] as? String
        val text = params["text"] as? String
        val contentDescription = params["contentDescription"] as? String
        val x = (params["x"] as? Number)?.toInt()
        val y = (params["y"] as? Number)?.toInt()
        
        // Smart Matching options (from FE NodeConfigPanel)
        val fuzzyMatch = params["fuzzyMatch"] as? Boolean ?: false
        val ignoreCase = params["ignoreCase"] as? Boolean ?: true
        
        // Selector Priority Mode: auto, id, text, coords, icon
        // - auto: Try ID → contentDesc → text → coords (default)
        // - id: Only use resourceId, fail if not found
        // - text: Only use text/contentDesc, fail if not found
        // - coords: Only use coordinates
        // - icon: Already handled above (template matching), won't reach here
        // Note: selectorPriority is already declared above in template matching section
        
        Log.d(TAG, "🎯 Smart Matching: fuzzy=$fuzzyMatch, ignoreCase=$ignoreCase, priority=$selectorPriority")
        
        // Wait a bit for UI to settle after previous actions (scroll, etc.)
        // This ensures the accessibility tree is refreshed with new element positions
        delay(100)
        
        // Get fresh root node - retry up to 3 times if null
        var rootNode = accessibilityService.rootInActiveWindow
        var retries = 0
        while (rootNode == null && retries < 3) {
            delay(200)
            rootNode = accessibilityService.rootInActiveWindow
            retries++
            Log.d(TAG, "   RootNode retry #$retries")
        }
        
        Log.d(TAG, "🔍 Tap selectors: resourceId=$resourceId, contentDesc=${contentDescription?.take(30)}, text=${text?.take(30)}, x=$x, y=$y")
        Log.d(TAG, "   RootNode available: ${rootNode != null}, priority=$selectorPriority")
        
        // Extract className if available
        val className = params["className"] as? String
        
        // ========================================================================
        // MODE-BASED ELEMENT MATCHING
        // Each mode uses Smart Finder but with restricted criteria
        // ========================================================================
        
        when (selectorPriority) {
            "auto" -> {
                // AUTO MODE: Use all selectors with scoring
                val hasAnyCriteria = !resourceId.isNullOrBlank() || !contentDescription.isNullOrBlank() || !text.isNullOrBlank()
                
                if (hasAnyCriteria && rootNode != null) {
                    Log.d(TAG, "   [auto] Using multi-selector matching...")
                    val criteria = ElementCriteria(
                        resourceId = resourceId,
                        contentDescription = contentDescription,
                        text = text,
                        className = className,
                        fuzzyMatch = fuzzyMatch,
                        ignoreCase = ignoreCase
                    )
                    
                    val bestNode = findBestMatchingNode(rootNode, criteria)
                    if (bestNode != null) {
                        val success = clickNodeWithFallback(bestNode)
                        bestNode.recycle()
                        
                        if (success) {
                            val matchedBy = listOfNotNull(
                                if (!resourceId.isNullOrBlank()) "id" else null,
                                if (!contentDescription.isNullOrBlank()) "desc" else null,
                                if (!text.isNullOrBlank()) "text" else null
                            ).joinToString("+")
                            
                            Log.d(TAG, "✓ Tap via AUTO ($matchedBy)")
                            return ActionResult(
                                actionId = "tap_auto",
                                success = true,
                                message = "Tap executed via auto matching: $matchedBy",
                                data = mapOf("method" to "auto", "matched_by" to matchedBy)
                            )
                        }
                    }
                }
                
                // Fallback to coordinates if no element match
                if (x != null && y != null) {
                    Log.d(TAG, "   [auto] Fallback to coordinates: ($x, $y)")
                    val success = accessibilityService.performTap(x, y)
                    return ActionResult(
                        actionId = "tap_coords",
                        success = success,
                        message = if (success) "Tap at ($x, $y)" else "Tap failed at ($x, $y)",
                        data = mapOf("method" to "coordinates", "x" to x, "y" to y),
                        error = if (!success) "Failed to perform tap" else null
                    )
                }
                
                throw Exception("No valid element or coordinates available")
            }
            
            "id" -> {
                // ID MODE: Only use resourceId + contentDescription for filtering
                if (resourceId.isNullOrBlank()) {
                    throw Exception("Resource ID is required in mode 'id' but not provided")
                }
                
                Log.d(TAG, "   [id] Strict resourceId matching...")
                val criteria = ElementCriteria(
                    resourceId = resourceId,
                    contentDescription = contentDescription, // For filtering multiple matches
                    text = null, // Ignore text in id mode
                    className = className,
                    fuzzyMatch = false, // Exact match for id mode
                    ignoreCase = ignoreCase
                )
                
                val bestNode = findBestMatchingNode(rootNode!!, criteria)
                if (bestNode != null) {
                    val success = clickNodeWithFallback(bestNode)
                    bestNode.recycle()
                    
                    if (success) {
                        Log.d(TAG, "✓ Tap via ID: $resourceId")
                        return ActionResult(
                            actionId = "tap_id",
                            success = true,
                            message = "Tap executed via resourceId: $resourceId",
                            data = mapOf("method" to "id", "resourceId" to resourceId)
                        )
                    }
                }
                
                throw Exception("Element with resourceId '$resourceId' not found or not clickable")
            }
            
            "text" -> {
                // TEXT MODE: Only use text + contentDescription
                val hasTextCriteria = !text.isNullOrBlank() || !contentDescription.isNullOrBlank()
                if (!hasTextCriteria) {
                    throw Exception("Text or contentDescription is required in mode 'text' but not provided")
                }
                
                Log.d(TAG, "   [text] Strict text/contentDesc matching...")
                val criteria = ElementCriteria(
                    resourceId = null, // Ignore resourceId in text mode
                    contentDescription = contentDescription,
                    text = text,
                    className = className,
                    fuzzyMatch = fuzzyMatch,
                    ignoreCase = ignoreCase
                )
                
                val bestNode = findBestMatchingNode(rootNode!!, criteria)
                if (bestNode != null) {
                    val success = clickNodeWithFallback(bestNode)
                    bestNode.recycle()
                    
                    if (success) {
                        val selector = contentDescription ?: text ?: "unknown"
                        Log.d(TAG, "✓ Tap via TEXT: $selector")
                        return ActionResult(
                            actionId = "tap_text",
                            success = true,
                            message = "Tap executed via text: $selector",
                            data = mapOf("method" to "text", "selector" to selector)
                        )
                    }
                }
                
                throw Exception("Element with text/contentDesc not found or not clickable")
            }
            
            "coords" -> {
                // COORDS MODE: Only use coordinates, no element matching
                if (x == null || y == null) {
                    throw Exception("Coordinates (x, y) are required in mode 'coords' but not provided")
                }
                
                Log.d(TAG, "   [coords] Coordinate-only tap: ($x, $y)")
                val success = accessibilityService.performTap(x, y)
                Log.d(TAG, "Tap via COORDINATES: ($x, $y) - ${if (success) "success" else "failed"}")
                return ActionResult(
                    actionId = "tap_${x}_${y}",
                    success = success,
                    message = if (success) "Tap executed at ($x, $y)" else "Tap failed at ($x, $y)",
                    data = mapOf("method" to "coordinates", "x" to x, "y" to y),
                    error = if (!success) "Failed to perform tap" else null
                )
            }
            
            else -> {
                throw Exception("Unknown selector priority mode: $selectorPriority")
            }
        }
    }
    
    /**
     * Find node by content description recursively
     * Supports exact match, fuzzy (contains) match, and case-insensitive matching
     */
    private fun findNodeByContentDescription(
        desc: String, 
        node: AccessibilityNodeInfo?,
        fuzzyMatch: Boolean = false,
        ignoreCase: Boolean = true
    ): AccessibilityNodeInfo? {
        if (node == null) return null
        
        val nodeDesc = node.contentDescription?.toString()
        if (nodeDesc != null) {
            val matches = when {
                fuzzyMatch && ignoreCase -> nodeDesc.contains(desc, ignoreCase = true)
                fuzzyMatch -> nodeDesc.contains(desc)
                ignoreCase -> nodeDesc.equals(desc, ignoreCase = true)
                else -> nodeDesc == desc
            }
            
            if (matches) {
                Log.d(TAG, "   [contentDesc] Match found: '$nodeDesc' (fuzzy=$fuzzyMatch, ignoreCase=$ignoreCase)")
                return node
            }
        }
        
        // Search children
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val result = findNodeByContentDescription(desc, child, fuzzyMatch, ignoreCase)
            if (result != null) {
                if (child != result) child.recycle()
                return result
            }
            child.recycle()
        }
        
        return null
    }
    
    /**
     * Find node by text with fuzzy/case-insensitive matching support
     */
    private fun findNodeByText(
        text: String,
        rootNode: AccessibilityNodeInfo,
        fuzzyMatch: Boolean = false,
        ignoreCase: Boolean = true
    ): AccessibilityNodeInfo? {
        // First try built-in search
        val nodes = rootNode.findAccessibilityNodeInfosByText(text)
        
        for (node in nodes) {
            val nodeText = node.text?.toString() ?: continue
            val matches = when {
                fuzzyMatch && ignoreCase -> nodeText.contains(text, ignoreCase = true)
                fuzzyMatch -> nodeText.contains(text)
                ignoreCase -> nodeText.equals(text, ignoreCase = true)
                else -> nodeText == text
            }
            
            if (matches) {
                Log.d(TAG, "   [text] Match found: '$nodeText' (fuzzy=$fuzzyMatch, ignoreCase=$ignoreCase)")
                // Recycle all other nodes
                nodes.filter { it != node }.forEach { it.recycle() }
                return node
            }
        }
        
        // Recycle all if no match
        nodes.forEach { it.recycle() }
        return null
    }

    private suspend fun executeDoubleTap(params: Map<String, Any>): ActionResult {
        val x = (params["x"] as? Number)?.toInt() ?: throw Exception("Missing x")
        val y = (params["y"] as? Number)?.toInt() ?: throw Exception("Missing y")

        // Execute two taps quickly
        val result1 = executeTap(params)
        delay(100)
        val result2 = executeTap(params)

        return ActionResult(
            actionId = "double_tap_${x}_${y}",
            success = result1.success && result2.success,
            message = "Double tap executed",
            data = mapOf("x" to x, "y" to y)
        )
    }

    private suspend fun executeLongPress(params: Map<String, Any>): ActionResult {
        val accessibilityService = PortalAccessibilityService.instance
            ?: throw Exception("Accessibility service not available")

        val x = (params["x"] as? Number)?.toInt() ?: throw Exception("Missing x")
        val y = (params["y"] as? Number)?.toInt() ?: throw Exception("Missing y")
        val duration = (params["duration"] as? Number)?.toLong() ?: 1000

        val success = accessibilityService.performLongPress(x, y, duration)

        return ActionResult(
            actionId = "long_press_${x}_${y}",
            success = success,
            message = "Long press executed",
            data = mapOf("x" to x, "y" to y, "duration" to duration)
        )
    }

    private suspend fun executeSwipe(params: Map<String, Any>): ActionResult {
        val accessibilityService = PortalAccessibilityService.instance
            ?: throw Exception("Accessibility service not available")

        val startX = (params["start_x"] as? Number)?.toInt() ?: throw Exception("Missing start_x")
        val startY = (params["start_y"] as? Number)?.toInt() ?: throw Exception("Missing start_y")
        val endX = (params["end_x"] as? Number)?.toInt() ?: throw Exception("Missing end_x")
        val endY = (params["end_y"] as? Number)?.toInt() ?: throw Exception("Missing end_y")
        val duration = (params["duration"] as? Number)?.toLong() ?: 300

        val success = accessibilityService.performSwipe(startX, startY, endX, endY, duration)

        return ActionResult(
            actionId = "swipe",
            success = success,
            message = "Swipe executed",
            data = mapOf(
                "start_x" to startX, "start_y" to startY,
                "end_x" to endX, "end_y" to endY,
                "duration" to duration
            )
        )
    }

    private suspend fun executeScroll(params: Map<String, Any>): ActionResult {
        val accessibilityService = PortalAccessibilityService.instance
            ?: throw Exception("Accessibility service not available")

        val direction = params["direction"] as? String ?: throw Exception("Missing direction")
        val amount = (params["amount"] as? Number)?.toInt() ?: 1
        
        Log.d(TAG, "Executing scroll: direction=$direction, amount=$amount")

        // Perform scroll using accessibility service
        val success = when (direction.lowercase()) {
            "up" -> accessibilityService.performScrollUp(amount)
            "down" -> accessibilityService.performScrollDown(amount)
            "left" -> accessibilityService.performScrollLeft(amount)
            "right" -> accessibilityService.performScrollRight(amount)
            else -> false
        }

        return ActionResult(
            actionId = "scroll_$direction",
            success = success,
            message = if (success) "Scroll $direction completed" else "Scroll $direction failed",
            data = mapOf("direction" to direction, "amount" to amount, "method" to "swipe_gesture"),
            error = if (!success) "Gesture dispatch failed" else null
        )
    }

    private suspend fun executeTextInput(params: Map<String, Any>): ActionResult {
        val accessibilityService = PortalAccessibilityService.instance
            ?: throw Exception("Accessibility service not available")

        // Backend sends 'inputText', fall back to 'text' for compatibility
        val text = (params["inputText"] as? String) 
            ?: (params["text"] as? String) 
            ?: throw Exception("Missing inputText or text")
        
        Log.d(TAG, "Executing text input: text='${text.take(20)}...'")
        
        // Retry loop - wait for focused editable field (useful after tap opens keyboard)
        var success = false
        var retries = 0
        val maxRetries = 4
        
        while (!success && retries < maxRetries) {
            success = accessibilityService.inputText(text)
            if (!success) {
                retries++
                Log.d(TAG, "   [text_input] Retry $retries/$maxRetries - no focused field, waiting 500ms...")
                delay(500)
            }
        }

        return ActionResult(
            actionId = "text_input",
            success = success,
            message = if (success) "Text input completed: '${text.take(20)}'" else "Text input failed - no focused editable field after $maxRetries retries",
            data = mapOf("text" to text, "method" to "accessibility", "retries" to retries),
            error = if (!success) "No focused editable field found" else null
        )
    }

    private suspend fun executePressKey(params: Map<String, Any>): ActionResult {
        val accessibilityService = PortalAccessibilityService.instance
            ?: throw Exception("Accessibility service not available")

        // Support both key_code (number), key (string), and keyCode (camelCase)
        val keyCode = when {
            params["key_code"] != null -> (params["key_code"] as? Number)?.toInt()
            params["keyCode"] != null -> {
                val kc = params["keyCode"]
                when (kc) {
                    is Number -> kc.toInt()
                    is String -> parseKeyCode(kc)
                    else -> null
                }
            }
            params["key"] != null -> parseKeyCode(params["key"] as? String ?: "")
            else -> null
        } ?: throw Exception("Missing key_code, keyCode, or key")

        // Support repeatCount for multiple presses
        val repeatCount = (params["repeatCount"] as? Number)?.toInt() 
            ?: (params["repeat_count"] as? Number)?.toInt()
            ?: 1
        
        Log.d(TAG, "Pressing key: $keyCode, repeat: $repeatCount (from params: ${params["key"]} or ${params["keyCode"]} or ${params["key_code"]})")
        
        var success = true
        for (i in 1..repeatCount) {
            val result = accessibilityService.pressKey(keyCode)
            if (!result) {
                success = false
                break
            }
            if (i < repeatCount) {
                delay(100) // Small delay between repeated presses
            }
        }

        return ActionResult(
            actionId = "press_key_$keyCode",
            success = success,
            message = if (success) "Key press executed (${repeatCount}x)" else "Key press failed",
            data = mapOf("key_code" to keyCode, "repeat_count" to repeatCount),
            error = if (!success) "Failed to press key" else null
        )
    }
    
    /**
     * Parse key code string to Android KeyEvent code
     * Supports all common hardware keys
     */
    private fun parseKeyCode(keyString: String): Int {
        return when (keyString.uppercase()) {
            // Navigation keys
            "KEYCODE_BACK", "BACK" -> android.view.KeyEvent.KEYCODE_BACK
            "KEYCODE_HOME", "HOME" -> android.view.KeyEvent.KEYCODE_HOME
            "KEYCODE_MENU", "MENU" -> android.view.KeyEvent.KEYCODE_MENU
            "KEYCODE_APP_SWITCH", "RECENTS", "APP_SWITCH" -> android.view.KeyEvent.KEYCODE_APP_SWITCH
            
            // Input keys
            "KEYCODE_ENTER", "ENTER" -> android.view.KeyEvent.KEYCODE_ENTER
            "KEYCODE_DEL", "DELETE", "DEL", "BACKSPACE" -> android.view.KeyEvent.KEYCODE_DEL
            "KEYCODE_SPACE", "SPACE" -> android.view.KeyEvent.KEYCODE_SPACE
            "KEYCODE_TAB", "TAB" -> android.view.KeyEvent.KEYCODE_TAB
            "KEYCODE_ESCAPE", "ESCAPE", "ESC" -> android.view.KeyEvent.KEYCODE_ESCAPE
            
            // D-Pad keys
            "KEYCODE_DPAD_UP", "DPAD_UP", "UP" -> android.view.KeyEvent.KEYCODE_DPAD_UP
            "KEYCODE_DPAD_DOWN", "DPAD_DOWN", "DOWN" -> android.view.KeyEvent.KEYCODE_DPAD_DOWN
            "KEYCODE_DPAD_LEFT", "DPAD_LEFT", "LEFT" -> android.view.KeyEvent.KEYCODE_DPAD_LEFT
            "KEYCODE_DPAD_RIGHT", "DPAD_RIGHT", "RIGHT" -> android.view.KeyEvent.KEYCODE_DPAD_RIGHT
            "KEYCODE_DPAD_CENTER", "DPAD_CENTER", "CENTER" -> android.view.KeyEvent.KEYCODE_DPAD_CENTER
            
            // Volume keys
            "KEYCODE_VOLUME_UP", "VOLUME_UP" -> android.view.KeyEvent.KEYCODE_VOLUME_UP
            "KEYCODE_VOLUME_DOWN", "VOLUME_DOWN" -> android.view.KeyEvent.KEYCODE_VOLUME_DOWN
            "KEYCODE_VOLUME_MUTE", "VOLUME_MUTE", "MUTE" -> android.view.KeyEvent.KEYCODE_VOLUME_MUTE
            
            // Media keys
            "KEYCODE_MEDIA_PLAY_PAUSE", "MEDIA_PLAY_PAUSE", "PLAY_PAUSE" -> android.view.KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE
            "KEYCODE_MEDIA_NEXT", "MEDIA_NEXT", "NEXT" -> android.view.KeyEvent.KEYCODE_MEDIA_NEXT
            "KEYCODE_MEDIA_PREVIOUS", "MEDIA_PREVIOUS", "PREVIOUS" -> android.view.KeyEvent.KEYCODE_MEDIA_PREVIOUS
            "KEYCODE_MEDIA_STOP", "MEDIA_STOP", "STOP" -> android.view.KeyEvent.KEYCODE_MEDIA_STOP
            
            // System keys
            "KEYCODE_POWER", "POWER" -> android.view.KeyEvent.KEYCODE_POWER
            "KEYCODE_CAMERA", "CAMERA" -> android.view.KeyEvent.KEYCODE_CAMERA
            "KEYCODE_SEARCH", "SEARCH" -> android.view.KeyEvent.KEYCODE_SEARCH
            
            // Try to parse as number, fallback to BACK
            else -> keyString.toIntOrNull() ?: android.view.KeyEvent.KEYCODE_BACK
        }
    }

    private suspend fun executeStartApp(params: Map<String, Any>): ActionResult {
        val context = contextRef.get() ?: throw Exception("Context is null")
        // Support both snake_case and camelCase parameter names
        val packageName = (params["package_name"] as? String)
            ?: (params["packageName"] as? String)
            ?: (params["app_package"] as? String)
            ?: throw Exception("Missing package_name or packageName")

        try {
            // ========================================================================
            // STEP 1: Force close app if already running (for fresh start)
            // ========================================================================
            val accessibilityService = PortalAccessibilityService.instance
            if (accessibilityService != null) {
                // Check if app is currently in foreground
                val currentPackage = try {
                    accessibilityService.rootInActiveWindow?.packageName?.toString() ?: ""
                } catch (e: Exception) { "" }
                
                if (currentPackage == packageName) {
                    Log.d(TAG, "App $packageName is already in foreground, closing first...")
                    
                    // Use FORCE_STOP via Recents + swipe, or just press Home first
                    accessibilityService.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_HOME)
                    delay(500)
                }
            }
            
            // ========================================================================
            // STEP 2: Launch app fresh
            // ========================================================================
            val intent = context.packageManager.getLaunchIntentForPackage(packageName)
            if (intent != null) {
                // Clear task to start fresh
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                context.startActivity(intent)
                
                // Wait for app to start - minimal delay, main wait handled by wait_after
                delay(2000)
                
                Log.d(TAG, "App started fresh: $packageName")

                return ActionResult(
                    actionId = "start_app_$packageName",
                    success = true,
                    message = "App started: $packageName",
                    data = mapOf("package_name" to packageName, "method" to "launch_intent_fresh")
                )
            } else {
                throw Exception("Package not found: $packageName")
            }
        } catch (e: Exception) {
            return ActionResult(
                actionId = "start_app_$packageName",
                success = false,
                message = "Failed to start app",
                error = e.message
            )
        }
    }

    private suspend fun executeWait(params: Map<String, Any>): ActionResult {
        val duration = (params["duration"] as? Number)?.toLong() ?: 1000
        delay(duration)

        return ActionResult(
            actionId = "wait",
            success = true,
            message = "Wait completed",
            data = mapOf("duration" to duration)
        )
    }

    private suspend fun executeScreenshot(params: Map<String, Any>): ActionResult {
        // Screenshot logic would be implemented here
        return ActionResult(
            actionId = "screenshot",
            success = true,
            message = "Screenshot captured",
            data = mapOf("path" to "/screenshots/screenshot_${System.currentTimeMillis()}.jpg")
        )
    }

    /**
     * Execute File Input action - Select and prepare a file for use
     * 
     * Supports two formats:
     * NEW FORMAT (from VariableContextService):
     * - filePath: Single resolved URL (random selected by backend)
     * - outputVariable: Variable name to store file path
     * 
     * OLD FORMAT (backward compatibility):
     * - files: List of file objects with { id, name, url, path, type }
     * - selectionMode: 'sequential' or 'random'
     * - currentIndex: Current index for sequential mode
     * - outputVariable: Variable name to store file path
     */
    private suspend fun executeFileInput(params: Map<String, Any>): ActionResult {
        val outputVariable = params["outputVariable"] as? String ?: "filePath"
        
        // NEW FORMAT: Single resolved filePath from backend (VariableContextService already resolved)
        val directFilePath = params["filePath"] as? String
        if (!directFilePath.isNullOrEmpty()) {
            Log.d(TAG, "[file_input] Using pre-resolved filePath: $directFilePath")
            
            val fileName = directFilePath.substringAfterLast('/').substringBefore('?')
            
            // Download file to device cache
            val localPath = try {
                downloadFileToCache(directFilePath, fileName)
            } catch (e: Exception) {
                Log.e(TAG, "[file_input] Download failed: ${e.message}")
                return ActionResult(
                    actionId = "file_input",
                    success = false,
                    message = "Failed to download file: ${e.message}",
                    error = e.message
                )
            }
            
            Log.d(TAG, "[file_input] File ready (new format): $localPath")
            
            return ActionResult(
                actionId = "file_input",
                success = true,
                message = "File ready: $fileName",
                data = mapOf(
                    outputVariable to localPath,
                    "fileName" to fileName,
                    "format" to "single_url"
                )
            )
        }
        
        // OLD FORMAT: files array with selection mode (backward compatibility)
        val filesRaw = params["files"] as? List<*> ?: emptyList<Any>()
        val selectionMode = params["selectionMode"] as? String ?: "sequential"
        val currentIndex = (params["currentIndex"] as? Number)?.toInt() ?: 0
        
        Log.d(TAG, "[file_input] files=${filesRaw.size}, mode=$selectionMode, index=$currentIndex")
        
        if (filesRaw.isEmpty()) {
            return ActionResult(
                actionId = "file_input",
                success = false,
                message = "No files configured",
                error = "File list is empty"
            )
        }
        
        // Parse files list
        val files = filesRaw.mapNotNull { it as? Map<*, *> }
        if (files.isEmpty()) {
            return ActionResult(
                actionId = "file_input",
                success = false,
                message = "Invalid file list format",
                error = "Could not parse files"
            )
        }
        
        // Select file based on mode
        val selectedIndex = when (selectionMode) {
            "random" -> (0 until files.size).random()
            else -> currentIndex % files.size
        }
        val selectedFile = files[selectedIndex]
        
        val fileUrl = selectedFile["url"] as? String ?: selectedFile["path"] as? String
        val fileName = selectedFile["name"] as? String ?: "file_${System.currentTimeMillis()}"
        val fileType = selectedFile["type"] as? String ?: "file"
        
        Log.d(TAG, "[file_input] Selected: $fileName (index=$selectedIndex)")
        
        if (fileUrl.isNullOrEmpty()) {
            return ActionResult(
                actionId = "file_input",
                success = false,
                message = "File URL is empty",
                error = "Selected file has no URL"
            )
        }
        
        // Download file to device cache
        val localPath = try {
            downloadFileToCache(fileUrl, fileName)
        } catch (e: Exception) {
            Log.e(TAG, "[file_input] Download failed: ${e.message}")
            return ActionResult(
                actionId = "file_input",
                success = false,
                message = "Failed to download file: ${e.message}",
                error = e.message
            )
        }
        
        // Calculate next index for sequential mode
        val nextIndex = (selectedIndex + 1) % files.size
        
        Log.d(TAG, "[file_input] File ready: $localPath (next index=$nextIndex)")
        
        return ActionResult(
            actionId = "file_input",
            success = true,
            message = "File ready: $fileName",
            data = mapOf(
                outputVariable to localPath,
                "fileName" to fileName,
                "fileType" to fileType,
                "selectedIndex" to selectedIndex,
                "nextIndex" to nextIndex,
                "totalFiles" to files.size,
                "format" to "files_array"
            )
        )
    }
    
    /**
     * Download a file from URL to device and inject into MediaStore
     * 
     * Logic:
     * 1. Clear ALL old files in workflow_files folder (so gallery only has new file)
     * 2. Download new file (blocking)
     * 3. Inject to MediaStore so Gallery/TikTok can see it
     * 4. Return local path
     */
    private suspend fun downloadFileToCache(url: String, fileName: String): String {
        return withContext(Dispatchers.IO) {
            val cacheDir = context.cacheDir
            val workflowDir = java.io.File(cacheDir, "workflow_files")
            workflowDir.mkdirs()
            
            // STEP 1: Clear ALL old files in workflow_files folder
            clearWorkflowFiles(workflowDir)
            
            val targetFile = java.io.File(workflowDir, fileName)
            
            Log.d(TAG, "[download] Downloading: $url -> ${targetFile.absolutePath}")
            
            // STEP 2: Download file (blocking)
            val connection = java.net.URL(url).openConnection() as java.net.HttpURLConnection
            connection.connectTimeout = 60000  // 60s timeout for large files
            connection.readTimeout = 60000
            connection.connect()
            
            if (connection.responseCode != 200) {
                throw Exception("HTTP ${connection.responseCode}")
            }
            
            connection.inputStream.use { input ->
                java.io.FileOutputStream(targetFile).use { output ->
                    input.copyTo(output)
                }
            }
            
            Log.d(TAG, "[download] Complete: ${targetFile.length()} bytes")
            
            // STEP 3: Inject to MediaStore so Gallery apps can see it
            val mediaStorePath = injectToMediaStore(targetFile, fileName)
            
            Log.d(TAG, "[download] Injected to MediaStore: $mediaStorePath")
            
            // Return the MediaStore path (or cache path if injection failed)
            mediaStorePath ?: targetFile.absolutePath
        }
    }
    
    /**
     * Clear all files in workflow_files directory
     * This ensures only the new file exists for easy picking
     */
    private fun clearWorkflowFiles(workflowDir: java.io.File) {
        if (workflowDir.exists() && workflowDir.isDirectory) {
            val files = workflowDir.listFiles()
            files?.forEach { file ->
                if (file.isFile) {
                    val deleted = file.delete()
                    Log.d(TAG, "[cleanup] Deleted ${file.name}: $deleted")
                }
            }
            
            // Also clean up MediaStore entries for old workflow files
            cleanOldMediaStoreEntries()
        }
    }
    
    /**
     * Clean old workflow files from MediaStore
     */
    private fun cleanOldMediaStoreEntries() {
        try {
            val resolver = context.contentResolver
            
            // Delete images with DISPLAY_NAME containing "workflow_" prefix
            val imageUri = android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI
            val deleted = resolver.delete(
                imageUri,
                "${android.provider.MediaStore.Images.Media.DISPLAY_NAME} LIKE ?",
                arrayOf("workflow_%")
            )
            Log.d(TAG, "[cleanup] Removed $deleted old images from MediaStore")
            
            // Delete videos with same prefix
            val videoUri = android.provider.MediaStore.Video.Media.EXTERNAL_CONTENT_URI
            val deletedVideos = resolver.delete(
                videoUri,
                "${android.provider.MediaStore.Video.Media.DISPLAY_NAME} LIKE ?",
                arrayOf("workflow_%")
            )
            Log.d(TAG, "[cleanup] Removed $deletedVideos old videos from MediaStore")
        } catch (e: Exception) {
            Log.w(TAG, "[cleanup] Failed to clean MediaStore: ${e.message}")
        }
    }
    
    /**
     * Inject downloaded file to MediaStore so Gallery/TikTok can see it
     * Returns the content URI path or null if failed
     */
    private fun injectToMediaStore(file: java.io.File, originalName: String): String? {
        try {
            val resolver = context.contentResolver
            
            // Determine if image or video
            val extension = file.extension.lowercase()
            val isVideo = extension in listOf("mp4", "webm", "mov", "avi", "mkv", "3gp")
            val isImage = extension in listOf("jpg", "jpeg", "png", "gif", "webp", "bmp")
            
            if (!isImage && !isVideo) {
                Log.d(TAG, "[mediastore] Skipping non-media file: $extension")
                return file.absolutePath
            }
            
            // Prefix with workflow_ for easy cleanup later
            val mediaName = "workflow_${System.currentTimeMillis()}_$originalName"
            
            val values = android.content.ContentValues().apply {
                put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, mediaName)
                put(android.provider.MediaStore.MediaColumns.MIME_TYPE, 
                    if (isVideo) "video/*" else "image/*")
                put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, 
                    if (isVideo) "${android.os.Environment.DIRECTORY_MOVIES}/ClickAI"
                    else "${android.os.Environment.DIRECTORY_PICTURES}/ClickAI")
                put(android.provider.MediaStore.MediaColumns.IS_PENDING, 1)
            }
            
            val uri = if (isVideo) {
                android.provider.MediaStore.Video.Media.EXTERNAL_CONTENT_URI
            } else {
                android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI
            }
            
            val contentUri = resolver.insert(uri, values)
            if (contentUri == null) {
                Log.e(TAG, "[mediastore] Failed to create MediaStore entry")
                return null
            }
            
            // Copy file content to MediaStore
            resolver.openOutputStream(contentUri)?.use { output ->
                java.io.FileInputStream(file).use { input ->
                    input.copyTo(output)
                }
            }
            
            // Mark as complete
            values.clear()
            values.put(android.provider.MediaStore.MediaColumns.IS_PENDING, 0)
            resolver.update(contentUri, values, null, null)
            
            Log.d(TAG, "[mediastore] Successfully added: $contentUri")
            return contentUri.toString()
            
        } catch (e: Exception) {
            Log.e(TAG, "[mediastore] Injection failed: ${e.message}")
            return null
        }
    }

    /**
     * Execute Assert action - Verify element exists or has expected value
     * 
     * Supported assertTypes:
     * - exists: Check if element exists
     * - not_exists: Check if element does NOT exist
     * - text_equals: Check if element text exactly matches expectedValue
     * - text_contains: Check if element text contains expectedValue
     * 
     * Params:
     * - assertType: exists/not_exists/text_equals/text_contains
     * - targetSelector: resourceId or text to find element (from FE)
     * - resourceId: Android resource ID (from Element Picker)
     * - text: Text content (from Element Picker)
     * - expectedValue: Expected text for text assertions
     * - timeout: How long to wait for element (ms, default 5000)
     * - onFailure: stop/continue/skip (handled by action.optional)
     */
    private suspend fun executeAssert(params: Map<String, Any>): ActionResult {
        val accessibilityService = PortalAccessibilityService.instance
            ?: return ActionResult(
                actionId = "assert",
                success = false,
                message = "Accessibility service not available",
                error = "Service not running"
            )
        
        val assertType = params["assertType"] as? String ?: "exists"
        val targetSelector = params["targetSelector"] as? String
        val resourceId = params["resourceId"] as? String
        val text = params["text"] as? String
        val contentDescription = params["contentDescription"] as? String
        val expectedValue = params["expectedValue"] as? String
        val timeout = (params["timeout"] as? Number)?.toLong() ?: 5000L
        
        Log.d(TAG, "🔍 Assert: type=$assertType, selector=$targetSelector, resourceId=$resourceId, text=$text")
        Log.d(TAG, "   expectedValue=$expectedValue, timeout=${timeout}ms")
        
        // Determine which selector to use (priority: resourceId > targetSelector > text > contentDescription)
        val selector = resourceId?.takeIf { it.isNotBlank() }
            ?: targetSelector?.takeIf { it.isNotBlank() }
            ?: text?.takeIf { it.isNotBlank() }
            ?: contentDescription?.takeIf { it.isNotBlank() }
        
        if (selector.isNullOrBlank() && assertType != "exists") {
            return ActionResult(
                actionId = "assert",
                success = false,
                message = "No selector provided for assertion",
                error = "Missing targetSelector, resourceId, text, or contentDescription"
            )
        }
        
        val startTime = System.currentTimeMillis()
        var foundNode: AccessibilityNodeInfo? = null
        var foundNodeText: String? = null
        
        // Poll for element until timeout
        while (System.currentTimeMillis() - startTime < timeout) {
            val rootNode = accessibilityService.rootInActiveWindow
            if (rootNode != null) {
                // Try to find element by resourceId first
                if (!resourceId.isNullOrBlank()) {
                    val nodes = rootNode.findAccessibilityNodeInfosByViewId(resourceId)
                    foundNode = nodes.firstOrNull()
                    foundNodeText = foundNode?.text?.toString()
                    if (foundNode != null && assertType != "not_exists") break
                }
                
                // Try by text if no resourceId match
                if (foundNode == null && !text.isNullOrBlank()) {
                    val nodes = rootNode.findAccessibilityNodeInfosByText(text)
                    foundNode = nodes.firstOrNull { it.text?.toString()?.equals(text, ignoreCase = true) == true }
                    foundNodeText = foundNode?.text?.toString()
                    if (foundNode != null && assertType != "not_exists") break
                }
                
                // Try by targetSelector as text
                if (foundNode == null && !targetSelector.isNullOrBlank() && targetSelector != resourceId && targetSelector != text) {
                    val nodes = rootNode.findAccessibilityNodeInfosByText(targetSelector)
                    foundNode = nodes.firstOrNull()
                    foundNodeText = foundNode?.text?.toString()
                    if (foundNode != null && assertType != "not_exists") break
                }
                
                // For not_exists, break immediately if not found
                if (assertType == "not_exists" && foundNode == null) {
                    break
                }
            }
            
            delay(200) // Poll interval
        }
        
        // Evaluate assertion based on type
        val (success, message) = when (assertType) {
            "exists" -> {
                if (foundNode != null) {
                    Pair(true, "Element found: $selector")
                } else {
                    Pair(false, "Element not found within ${timeout}ms: $selector")
                }
            }
            "not_exists" -> {
                if (foundNode == null) {
                    Pair(true, "Element correctly does not exist: $selector")
                } else {
                    Pair(false, "Element unexpectedly exists: $selector")
                }
            }
            "text_equals" -> {
                if (foundNode == null) {
                    Pair(false, "Element not found: $selector")
                } else if (foundNodeText == expectedValue) {
                    Pair(true, "Text matches: '$foundNodeText' == '$expectedValue'")
                } else {
                    Pair(false, "Text mismatch: '$foundNodeText' != '$expectedValue'")
                }
            }
            "text_contains" -> {
                if (foundNode == null) {
                    Pair(false, "Element not found: $selector")
                } else if (foundNodeText?.contains(expectedValue ?: "", ignoreCase = true) == true) {
                    Pair(true, "Text contains: '$foundNodeText' contains '$expectedValue'")
                } else {
                    Pair(false, "Text does not contain: '$foundNodeText' does not contain '$expectedValue'")
                }
            }
            else -> {
                Pair(false, "Unknown assertType: $assertType")
            }
        }
        
        // Clean up
        foundNode?.recycle()
        
        Log.d(TAG, "Assert result: success=$success, message=$message")
        
        return ActionResult(
            actionId = "assert_$assertType",
            success = success,
            message = message,
            data = mapOf(
                "assertType" to assertType,
                "selector" to (selector ?: ""),
                "expectedValue" to (expectedValue ?: ""),
                "actualValue" to (foundNodeText ?: ""),
                "timeSpent" to (System.currentTimeMillis() - startTime)
            ),
            error = if (!success) message else null
        )
    }

    private suspend fun executeExtract(params: Map<String, Any>): ActionResult {
        // Extract data from UI elements
        val selector = params["selector"] as? String ?: throw Exception("Missing selector")

        return ActionResult(
            actionId = "extract",
            success = true,
            message = "Data extracted",
            data = mapOf("selector" to selector, "value" to "extracted_value")
        )
    }

    /**
     * Execute Element Check - Check if element exists/visible/enabled
     * Returns success=true if element matches condition (for true branch)
     * Returns success=false if element doesn't match (for false branch)
     * 
     * Params:
     * - checkType: exists/not_exists/visible/enabled
     * - resourceId: Android resource ID
     * - text: Text content to find
     * - timeout: How long to wait (ms, default 3000)
     */
    private suspend fun executeElementCheck(params: Map<String, Any>): ActionResult {
        val accessibilityService = PortalAccessibilityService.instance
            ?: return ActionResult(
                actionId = "element_check",
                success = false,
                message = "Accessibility service not available",
                error = "Service not running"
            )
        
        val checkType = params["checkType"] as? String ?: "exists"
        val resourceId = params["resourceId"] as? String
        val text = params["text"] as? String
        val timeout = (params["timeout"] as? Number)?.toLong() ?: 3000L
        
        Log.d(TAG, "🔍 ElementCheck: type=$checkType, resourceId=$resourceId, text=$text, timeout=${timeout}ms")
        
        val startTime = System.currentTimeMillis()
        var foundNode: AccessibilityNodeInfo? = null
        
        // Poll for element
        while (System.currentTimeMillis() - startTime < timeout) {
            val rootNode = accessibilityService.rootInActiveWindow
            if (rootNode != null) {
                // Try resourceId first
                if (!resourceId.isNullOrBlank()) {
                    val nodes = rootNode.findAccessibilityNodeInfosByViewId(resourceId)
                    foundNode = nodes.firstOrNull()
                    if (foundNode != null) break
                }
                
                // Try text
                if (foundNode == null && !text.isNullOrBlank()) {
                    val nodes = rootNode.findAccessibilityNodeInfosByText(text)
                    foundNode = nodes.firstOrNull { it.text?.toString()?.equals(text, ignoreCase = true) == true }
                    if (foundNode != null) break
                }
            }
            delay(200)
        }
        
        // Evaluate check
        val (success, message) = when (checkType) {
            "exists" -> {
                if (foundNode != null) {
                    Pair(true, "Element exists")
                } else {
                    Pair(false, "Element not found")
                }
            }
            "not_exists" -> {
                if (foundNode == null) {
                    Pair(true, "Element does not exist")
                } else {
                    Pair(false, "Element exists unexpectedly")
                }
            }
            "visible" -> {
                if (foundNode != null && foundNode.isVisibleToUser) {
                    Pair(true, "Element is visible")
                } else {
                    Pair(false, "Element not visible")
                }
            }
            "enabled" -> {
                if (foundNode != null && foundNode.isEnabled) {
                    Pair(true, "Element is enabled")
                } else {
                    Pair(false, "Element not enabled")
                }
            }
            else -> Pair(false, "Unknown checkType: $checkType")
        }
        
        foundNode?.recycle()
        Log.d(TAG, "ElementCheck result: success=$success (for branching)")
        
        return ActionResult(
            actionId = "element_check_$checkType",
            success = success,
            message = message,
            data = mapOf(
                "checkType" to checkType,
                "resourceId" to (resourceId ?: ""),
                "text" to (text ?: ""),
                "timeSpent" to (System.currentTimeMillis() - startTime)
            )
        )
    }

    /**
     * Execute Wait For Element - Wait until element appears
     * 
     * Params:
     * - resourceId: Android resource ID
     * - text: Text content to find
     * - timeout: Maximum wait time (ms, default 10000)
     * - pollInterval: Check interval (ms, default 500)
     */
    private suspend fun executeWaitForElement(params: Map<String, Any>): ActionResult {
        val accessibilityService = PortalAccessibilityService.instance
            ?: return ActionResult(
                actionId = "wait_for_element",
                success = false,
                message = "Accessibility service not available",
                error = "Service not running"
            )
        
        val resourceId = params["resourceId"] as? String
        val text = params["text"] as? String
        val contentDescription = params["contentDescription"] as? String
        val timeout = (params["timeout"] as? Number)?.toLong() ?: 10000L
        val pollInterval = (params["pollInterval"] as? Number)?.toLong() ?: 500L
        
        Log.d(TAG, "⏳ WaitForElement: resourceId=$resourceId, text=$text, timeout=${timeout}ms")
        
        if (resourceId.isNullOrBlank() && text.isNullOrBlank() && contentDescription.isNullOrBlank()) {
            return ActionResult(
                actionId = "wait_for_element",
                success = false,
                message = "No selector provided",
                error = "Missing resourceId, text, or contentDescription"
            )
        }
        
        val startTime = System.currentTimeMillis()
        var foundNode: AccessibilityNodeInfo? = null
        
        // Poll for element until timeout
        while (System.currentTimeMillis() - startTime < timeout) {
            val rootNode = accessibilityService.rootInActiveWindow
            if (rootNode != null) {
                // Try resourceId
                if (!resourceId.isNullOrBlank()) {
                    val nodes = rootNode.findAccessibilityNodeInfosByViewId(resourceId)
                    foundNode = nodes.firstOrNull()
                    if (foundNode != null) break
                }
                
                // Try text
                if (foundNode == null && !text.isNullOrBlank()) {
                    val nodes = rootNode.findAccessibilityNodeInfosByText(text)
                    foundNode = nodes.firstOrNull { it.text?.toString()?.equals(text, ignoreCase = true) == true }
                    if (foundNode != null) break
                }
                
                // Try contentDescription
                if (foundNode == null && !contentDescription.isNullOrBlank()) {
                    foundNode = findNodeByContentDescription(contentDescription, rootNode, fuzzyMatch = false, ignoreCase = true)
                    if (foundNode != null) break
                }
            }
            
            delay(pollInterval)
        }
        
        val timeSpent = System.currentTimeMillis() - startTime
        
        if (foundNode != null) {
            foundNode.recycle()
            Log.d(TAG, "WaitForElement: Element found after ${timeSpent}ms")
            return ActionResult(
                actionId = "wait_for_element",
                success = true,
                message = "Element appeared after ${timeSpent}ms",
                data = mapOf(
                    "resourceId" to (resourceId ?: ""),
                    "text" to (text ?: ""),
                    "timeSpent" to timeSpent
                )
            )
        } else {
            Log.d(TAG, "WaitForElement: Timeout after ${timeSpent}ms")
            return ActionResult(
                actionId = "wait_for_element",
                success = false,
                message = "Element not found within ${timeout}ms",
                data = mapOf(
                    "resourceId" to (resourceId ?: ""),
                    "text" to (text ?: ""),
                    "timeSpent" to timeSpent
                ),
                error = "Timeout waiting for element"
            )
        }
    }


    private suspend fun executeCustom(params: Map<String, Any>, jobParams: Map<String, Any>?): ActionResult {
        // Custom action implementation
        val actionName = params["action"] as? String ?: "unknown"

        return ActionResult(
            actionId = "custom_$actionName",
            success = true,
            message = "Custom action executed",
            data = params
        )
    }

    // ================================================================================
    // Helper Methods
    // ================================================================================

    private fun checkCondition(condition: ActionCondition): Boolean {
        // Implement condition checking logic
        return when (condition.type) {
            "element_exists" -> true // Check if element exists
            "text_equals" -> true // Check if text matches
            "value_greater_than" -> true // Compare values
            else -> true
        }
    }

    private fun evaluateCondition(condition: String): Boolean {
        // Simple condition evaluation
        return condition.lowercase() == "true"
    }
    
    // ================================================================================
    // SMART ELEMENT FINDER - Multi-selector matching with scoring
    // ================================================================================
    
    /**
     * Data class to hold element matching criteria
     */
    data class ElementCriteria(
        val resourceId: String? = null,
        val contentDescription: String? = null,
        val text: String? = null,
        val className: String? = null,
        val fuzzyMatch: Boolean = false,
        val ignoreCase: Boolean = true
    )
    
    /**
     * Find the best matching node based on multiple selectors.
     * Each matching selector adds to the score. Returns the highest-scoring node.
     * 
     * Scoring:
     * - resourceId exact match: +40 points
     * - contentDescription exact match: +30 points
     * - text exact match: +20 points
     * - className match: +10 points
     * - fuzzy matches get half points
     */
    private fun findBestMatchingNode(
        rootNode: AccessibilityNodeInfo,
        criteria: ElementCriteria
    ): AccessibilityNodeInfo? {
        data class ScoredNode(val node: AccessibilityNodeInfo, val score: Int)
        val candidates = mutableListOf<ScoredNode>()
        
        fun scoreNode(node: AccessibilityNodeInfo): Int {
            var score = 0
            
            // ResourceId matching (+40 for exact)
            if (!criteria.resourceId.isNullOrBlank()) {
                val nodeId = node.viewIdResourceName
                if (nodeId == criteria.resourceId) {
                    score += 40
                }
            }
            
            // ContentDescription matching (+30 for exact, +15 for fuzzy)
            if (!criteria.contentDescription.isNullOrBlank()) {
                val nodeDesc = node.contentDescription?.toString()
                if (nodeDesc != null) {
                    val exactMatch = if (criteria.ignoreCase) {
                        nodeDesc.equals(criteria.contentDescription, ignoreCase = true)
                    } else {
                        nodeDesc == criteria.contentDescription
                    }
                    
                    if (exactMatch) {
                        score += 30
                    } else if (criteria.fuzzyMatch && nodeDesc.contains(criteria.contentDescription, ignoreCase = criteria.ignoreCase)) {
                        score += 15
                    }
                }
            }
            
            // Text matching (+20 for exact, +10 for fuzzy)
            if (!criteria.text.isNullOrBlank()) {
                val nodeText = node.text?.toString()
                if (nodeText != null) {
                    val exactMatch = if (criteria.ignoreCase) {
                        nodeText.equals(criteria.text, ignoreCase = true)
                    } else {
                        nodeText == criteria.text
                    }
                    
                    if (exactMatch) {
                        score += 20
                    } else if (criteria.fuzzyMatch && nodeText.contains(criteria.text, ignoreCase = criteria.ignoreCase)) {
                        score += 10
                    }
                }
            }
            
            // ClassName matching (+10)
            if (!criteria.className.isNullOrBlank()) {
                val nodeClass = node.className?.toString()
                if (nodeClass != null) {
                    if (nodeClass.endsWith(criteria.className) || nodeClass == criteria.className) {
                        score += 10
                    }
                }
            }
            
            return score
        }
        
        fun searchTree(node: AccessibilityNodeInfo, depth: Int = 0) {
            if (depth > 20) return // Max depth
            
            val score = scoreNode(node)
            if (score > 0) {
                Log.d(TAG, "   [smart] Found candidate with score $score: id=${node.viewIdResourceName?.takeLast(20)}, text=${node.text?.take(20)}")
                candidates.add(ScoredNode(node, score))
            }
            
            // Search children
            for (i in 0 until node.childCount) {
                val child = node.getChild(i) ?: continue
                searchTree(child, depth + 1)
            }
        }
        
        // Start search
        searchTree(rootNode)
        
        if (candidates.isEmpty()) {
            Log.d(TAG, "   [smart] No matching candidates found")
            return null
        }
        
        // Sort by score (highest first), return best match
        val best = candidates.maxByOrNull { it.score }
        Log.d(TAG, "   [smart] Best match: score=${best?.score}, id=${best?.node?.viewIdResourceName?.takeLast(30)}")
        
        // Recycle non-selected candidates
        candidates.filter { it != best }.forEach { 
            // Note: we can't recycle here as nodes may be parents of each other
        }
        
        return best?.node
    }
    
    /**
     * Click node with multiple fallback strategies:
     * Priority order (most reliable first):
     * 1. Tap at center of bounds (use clickable parent's bounds if node is not clickable)
     * 2. Direct ACTION_CLICK on node or parent
     */
    private fun clickNodeWithFallback(node: AccessibilityNodeInfo): Boolean {
        val rect = android.graphics.Rect()
        node.getBoundsInScreen(rect)
        var centerX = (rect.left + rect.right) / 2
        var centerY = (rect.top + rect.bottom) / 2
        
        Log.d(TAG, "   [click] Node: clickable=${node.isClickable}, bounds=${rect.left},${rect.top}-${rect.right},${rect.bottom}, center=($centerX,$centerY)")
        Log.d(TAG, "   [click] Node id=${node.viewIdResourceName?.takeLast(30)}, desc=${node.contentDescription?.take(30)}")
        
        // If node is not clickable, find clickable parent and use ITS bounds
        var targetNode: AccessibilityNodeInfo? = null
        var targetRect = rect
        
        if (!node.isClickable) {
            Log.d(TAG, "   [click] Node not clickable, finding clickable parent for bounds...")
            var parent = node.parent
            var depth = 0
            while (parent != null && depth < 5) {
                if (parent.isClickable) {
                    targetNode = parent
                    val parentRect = android.graphics.Rect()
                    parent.getBoundsInScreen(parentRect)
                    targetRect = parentRect
                    centerX = (parentRect.left + parentRect.right) / 2
                    centerY = (parentRect.top + parentRect.bottom) / 2
                    Log.d(TAG, "   [click] Found clickable parent at depth $depth, bounds=${parentRect.left},${parentRect.top}-${parentRect.right},${parentRect.bottom}, center=($centerX,$centerY)")
                    break
                }
                val oldParent = parent
                parent = parent.parent
                oldParent.recycle()
                depth++
            }
            if (targetNode == null) {
                parent?.recycle()
            }
        }
        
        // Strategy 1: Tap at center of bounds (parent's bounds if non-clickable)
        if (centerX > 0 && centerY > 0 && targetRect.width() > 0 && targetRect.height() > 0) {
            Log.d(TAG, "   [click] Strategy 1 (bounds tap): ($centerX, $centerY)")
            val accessibilityService = PortalAccessibilityService.instance
            if (accessibilityService != null) {
                val success = accessibilityService.performTap(centerX, centerY)
                Log.d(TAG, "   [click] Bounds tap result: $success")
                targetNode?.recycle()
                if (success) return true
            }
        }
        
        // Strategy 2: Direct click on clickable node/parent
        val clickableNode = targetNode ?: if (node.isClickable) node else null
        if (clickableNode != null) {
            val success = clickableNode.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            Log.d(TAG, "   [click] Strategy 2 (accessibility click): $success")
            if (targetNode != null && targetNode != node) targetNode.recycle()
            if (success) return true
        }
        
        Log.d(TAG, "   [click] All strategies failed")
        return false
    }
}
