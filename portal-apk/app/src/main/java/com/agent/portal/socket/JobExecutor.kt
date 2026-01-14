package com.agent.portal.socket

import android.content.Context
import android.content.Intent
import android.util.Log
import android.view.accessibility.AccessibilityNodeInfo
import com.agent.portal.accessibility.PortalAccessibilityService
import kotlinx.coroutines.delay
import java.lang.ref.WeakReference

/**
 * Job Executor - Executes actions from configuration
 *
 * Responsibilities:
 * - Execute actions sequentially
 * - Handle waits and delays
 * - Retry on failures
 * - Collect results
 * - Error handling
 */
class JobExecutor(context: Context) {

    private val TAG = "JobExecutor"
    private val contextRef = WeakReference(context.applicationContext)
    private val actionResults = mutableListOf<ActionResult>()

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
                    continue
                }

                // Execute action
                val result = executeAction(action, job.params)
                actionResults.add(result)

                // Handle action result
                if (!result.success) {
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
                "tap", "click" -> executeTap(params)
                "double_tap" -> executeDoubleTap(params)
                "long_press" -> executeLongPress(params)
                "swipe" -> executeSwipe(params)
                "scroll" -> executeScroll(params)
                "text_input" -> executeTextInput(params)
                "press_key" -> executePressKey(params)
                "start_app" -> executeStartApp(params)
                "wait" -> executeWait(params)
                "screenshot" -> executeScreenshot(params)
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
        // SMART SELECTOR SYSTEM: Try accessibility attributes first, coordinates as fallback
        // Priority: resourceId > text > contentDescription > coordinates
        // ========================================================================
        
        val resourceId = params["resourceId"] as? String
        val text = params["text"] as? String
        val contentDescription = params["contentDescription"] as? String
        val x = (params["x"] as? Number)?.toInt()
        val y = (params["y"] as? Number)?.toInt()
        
        val rootNode = accessibilityService.rootInActiveWindow
        
        Log.d(TAG, "🔍 Tap selectors: resourceId=$resourceId, contentDesc=${contentDescription?.take(30)}, text=${text?.take(30)}, x=$x, y=$y")
        Log.d(TAG, "   RootNode available: ${rootNode != null}")
        
        // Priority 1: Try resourceId (most stable)
        if (!resourceId.isNullOrBlank() && rootNode != null) {
            val nodes = rootNode.findAccessibilityNodeInfosByViewId(resourceId)
            Log.d(TAG, "   [resourceId] Found ${nodes.size} nodes")
            val node = nodes.firstOrNull()
            if (node != null) {
                try {
                    val success = node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                    if (success) {
                        Log.d(TAG, "✓ Tap via RESOURCE_ID: $resourceId")
                        return ActionResult(
                            actionId = "tap_resourceId",
                            success = true,
                            message = "Tap executed via resourceId: $resourceId",
                            data = mapOf("method" to "resourceId", "selector" to resourceId)
                        )
                    } else {
                        Log.d(TAG, "   [resourceId] Node found but click failed")
                    }
                } finally {
                    node.recycle()
                }
            }
        } else if (resourceId.isNullOrBlank()) {
            Log.d(TAG, "   [resourceId] SKIPPED - empty/null")
        }
        
        // Priority 2: Try contentDescription (good for accessibility labels like "Share", "Like")
        if (!contentDescription.isNullOrBlank() && rootNode != null) {
            Log.d(TAG, "   [contentDesc] Searching for: ${contentDescription.take(40)}")
            val node = findNodeByContentDescription(contentDescription, rootNode)
            if (node != null) {
                Log.d(TAG, "   [contentDesc] Node FOUND, attempting click")
                try {
                    val success = node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                    if (success) {
                        Log.d(TAG, "✓ Tap via CONTENT_DESC: $contentDescription")
                        return ActionResult(
                            actionId = "tap_contentDesc",
                            success = true,
                            message = "Tap executed via contentDescription: $contentDescription",
                            data = mapOf("method" to "contentDescription", "selector" to contentDescription)
                        )
                    } else {
                        Log.d(TAG, "   [contentDesc] Node found but click FAILED")
                    }
                } finally {
                    node.recycle()
                }
            } else {
                Log.d(TAG, "   [contentDesc] Node NOT found in tree")
            }
        } else if (contentDescription.isNullOrBlank()) {
            Log.d(TAG, "   [contentDesc] SKIPPED - empty/null")
        }
        
        // Priority 3: Try text (good for buttons, labels)
        if (!text.isNullOrBlank() && rootNode != null) {
            Log.d(TAG, "   [text] Searching for: ${text.take(40)}")
            val nodes = rootNode.findAccessibilityNodeInfosByText(text)
            Log.d(TAG, "   [text] Found ${nodes.size} nodes containing text")
            val node = nodes.firstOrNull { it.text?.toString() == text }
            if (node != null) {
                Log.d(TAG, "   [text] Exact match found, attempting click")
                try {
                    val success = node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                    if (success) {
                        Log.d(TAG, "✓ Tap via TEXT: $text")
                        return ActionResult(
                            actionId = "tap_text",
                            success = true,
                            message = "Tap executed via text: $text",
                            data = mapOf("method" to "text", "selector" to text)
                        )
                    } else {
                        Log.d(TAG, "   [text] Node found but click FAILED")
                    }
                } finally {
                    node.recycle()
                }
            } else {
                Log.d(TAG, "   [text] No exact match found")
            }
        } else if (text.isNullOrBlank()) {
            Log.d(TAG, "   [text] SKIPPED - empty/null")
        }
        
        // Fallback: Use coordinates
        if (x != null && y != null) {
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
        
        // No method available
        throw Exception("No valid selector (resourceId/text/contentDescription) or coordinates available")
    }
    
    /**
     * Find node by content description recursively
     */
    private fun findNodeByContentDescription(desc: String, node: AccessibilityNodeInfo?): AccessibilityNodeInfo? {
        if (node == null) return null
        
        if (node.contentDescription?.toString() == desc) {
            return node
        }
        
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val result = findNodeByContentDescription(desc, child)
            if (result != null) {
                if (child != result) child.recycle()
                return result
            }
            child.recycle()
        }
        
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
        
        val success = accessibilityService.inputText(text)

        return ActionResult(
            actionId = "text_input",
            success = success,
            message = if (success) "Text input completed: '${text.take(20)}'" else "Text input failed - no focused editable field",
            data = mapOf("text" to text, "method" to "accessibility"),
            error = if (!success) "No focused editable field found" else null
        )
    }

    private suspend fun executePressKey(params: Map<String, Any>): ActionResult {
        val accessibilityService = PortalAccessibilityService.instance
            ?: throw Exception("Accessibility service not available")

        val keyCode = (params["key_code"] as? Number)?.toInt() ?: throw Exception("Missing key_code")
        val success = accessibilityService.pressKey(keyCode)

        return ActionResult(
            actionId = "press_key_$keyCode",
            success = success,
            message = "Key press executed",
            data = mapOf("key_code" to keyCode)
        )
    }

    private suspend fun executeStartApp(params: Map<String, Any>): ActionResult {
        val context = contextRef.get() ?: throw Exception("Context is null")
        val packageName = params["package_name"] as? String ?: throw Exception("Missing package_name")

        try {
            val intent = context.packageManager.getLaunchIntentForPackage(packageName)
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
                
                // Wait for app to start - minimal delay, main wait handled by wait_after
                delay(2000)
                
                Log.d(TAG, "App started: $packageName")

                return ActionResult(
                    actionId = "start_app_$packageName",
                    success = true,
                    message = "App started: $packageName",
                    data = mapOf("package_name" to packageName, "method" to "launch_intent")
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

    private suspend fun executeAssert(params: Map<String, Any>): ActionResult {
        // Assertion logic - check if condition is true
        val condition = params["condition"] as? String ?: "true"
        val success = evaluateCondition(condition)

        return ActionResult(
            actionId = "assert",
            success = success,
            message = if (success) "Assertion passed" else "Assertion failed",
            data = params,
            error = if (!success) "Condition not met: $condition" else null
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
}
