package com.agent.portal.recording

import android.util.Log

/**
 * WorkflowAnalyzer provides intelligent analysis and optimization for recorded workflows.
 * 
 * Features:
 * - Event deduplication and optimization
 * - Automatic workflow categorization
 * - Smart name generation based on detected patterns
 * - Event merging (consecutive scrolls, text inputs)
 */
object WorkflowAnalyzer {

    private const val TAG = "WorkflowAnalyzer"

    // Timing thresholds for optimization
    private const val DUPLICATE_TAP_THRESHOLD_MS = 300L   // Same element tap within this time
    private const val SCROLL_MERGE_THRESHOLD_MS = 500L    // Consecutive scrolls within this time
    private const val FOCUS_ORPHAN_THRESHOLD_MS = 1000L   // Focus not followed by action

    /**
     * Workflow category enum
     */
    enum class WorkflowCategory(val displayName: String, val icon: String) {
        LOGIN("Login Flow", "🔐"),
        SEARCH("Search", "🔍"),
        FORM("Fill Form", "📝"),
        NAVIGATION("Navigation", "🧭"),
        CHECKOUT("Checkout", "🛒"),
        SETTINGS("Settings", "⚙️"),
        MEDIA("Media", "🎬"),
        SOCIAL("Social", "💬"),
        GENERAL("General", "📱")
    }

    /**
     * Analysis result containing workflow insights
     */
    data class WorkflowAnalysis(
        val category: WorkflowCategory,
        val suggestedName: String,
        val originalEventCount: Int,
        val optimizedEventCount: Int,
        val optimizedEvents: List<RecordedEvent>,
        val keyActions: List<String>,
        val detectedPatterns: List<String>,
        val confidence: Float
    )

    /**
     * Analyze a list of recorded events and return insights
     */
    fun analyzeWorkflow(events: List<RecordedEvent>, appName: String): WorkflowAnalysis {
        Log.i(TAG, "Analyzing workflow with ${events.size} events for app: $appName")

        val originalCount = events.size
        val optimizedEvents = optimizeEvents(events)
        val optimizedCount = optimizedEvents.size

        val category = detectCategory(optimizedEvents)
        val keyActions = extractKeyActions(optimizedEvents)
        val patterns = detectPatterns(optimizedEvents)
        val suggestedName = generateSmartName(category, keyActions, appName, optimizedEvents)
        val confidence = calculateConfidence(optimizedEvents, category)

        Log.i(TAG, "Analysis complete: category=$category, optimized $originalCount -> $optimizedCount events")

        return WorkflowAnalysis(
            category = category,
            suggestedName = suggestedName,
            originalEventCount = originalCount,
            optimizedEventCount = optimizedCount,
            optimizedEvents = optimizedEvents,
            keyActions = keyActions,
            detectedPatterns = patterns,
            confidence = confidence
        )
    }

    /**
     * Optimize events by removing duplicates and merging consecutive actions
     */
    fun optimizeEvents(events: List<RecordedEvent>): List<RecordedEvent> {
        if (events.isEmpty()) return events

        val optimized = mutableListOf<RecordedEvent>()
        var i = 0

        while (i < events.size) {
            val current = events[i]

            when {
                // Skip orphan focus events (focus not followed by meaningful action)
                current.eventType == "focus" && isOrphanFocus(events, i) -> {
                    Log.d(TAG, "Removing orphan focus event at index $i")
                    i++
                    continue
                }

                // Merge consecutive scrolls
                current.eventType == "scroll" -> {
                    val (mergedScroll, nextIndex) = mergeConsecutiveScrolls(events, i)
                    optimized.add(mergedScroll)
                    i = nextIndex
                    continue
                }

                // Remove duplicate taps on same element
                current.eventType == "tap" && isDuplicateTap(optimized, current) -> {
                    Log.d(TAG, "Removing duplicate tap at index $i")
                    i++
                    continue
                }

                // Consolidate text inputs on same field
                current.eventType == "text_input" -> {
                    val (finalInput, nextIndex) = consolidateTextInputs(events, i)
                    optimized.add(finalInput)
                    i = nextIndex
                    continue
                }

                // Filter out system UI events
                isSystemUIEvent(current) -> {
                    Log.d(TAG, "Filtering system UI event: ${current.packageName}")
                    i++
                    continue
                }

                else -> {
                    optimized.add(current)
                    i++
                }
            }
        }

        Log.i(TAG, "Optimized ${events.size} events to ${optimized.size}")
        return optimized
    }

    /**
     * Detect workflow category based on event patterns
     */
    private fun detectCategory(events: List<RecordedEvent>): WorkflowCategory {
        val inputEvents = events.filter { it.eventType == "text_input" }
        val tapEvents = events.filter { it.eventType == "tap" }
        val scrollEvents = events.filter { it.eventType == "scroll" }

        // Check for login pattern
        if (hasLoginPattern(events)) {
            return WorkflowCategory.LOGIN
        }

        // Check for search pattern
        if (hasSearchPattern(events)) {
            return WorkflowCategory.SEARCH
        }

        // Check for checkout pattern
        if (hasCheckoutPattern(events)) {
            return WorkflowCategory.CHECKOUT
        }

        // Check for settings pattern
        if (hasSettingsPattern(events)) {
            return WorkflowCategory.SETTINGS
        }

        // Check for form pattern (multiple inputs)
        if (inputEvents.size >= 3) {
            return WorkflowCategory.FORM
        }

        // Check for social/messaging pattern
        if (hasSocialPattern(events)) {
            return WorkflowCategory.SOCIAL
        }

        // Check for media pattern
        if (hasMediaPattern(events)) {
            return WorkflowCategory.MEDIA
        }

        // Default to navigation if mostly taps and scrolls
        if (scrollEvents.size + tapEvents.size > inputEvents.size * 2) {
            return WorkflowCategory.NAVIGATION
        }

        return WorkflowCategory.GENERAL
    }

    /**
     * Check if events match login pattern
     */
    private fun hasLoginPattern(events: List<RecordedEvent>): Boolean {
        val loginKeywords = listOf(
            "login", "sign_in", "signin", "email", "username", "password",
            "phone", "log_in", "user_name", "passwd", "credential"
        )

        val buttonKeywords = listOf(
            "login", "sign_in", "signin", "submit", "continue", "next", "log_in"
        )

        val hasLoginInput = events.any { event ->
            val resourceId = event.resourceId.lowercase()
            val contentDesc = event.contentDescription.lowercase()
            val text = event.text.lowercase()
            
            loginKeywords.any { keyword ->
                resourceId.contains(keyword) || contentDesc.contains(keyword)
            }
        }

        val hasLoginButton = events.any { event ->
            val resourceId = event.resourceId.lowercase()
            val contentDesc = event.contentDescription.lowercase()
            val text = event.text.lowercase()
            
            event.eventType == "tap" && buttonKeywords.any { keyword ->
                resourceId.contains(keyword) || contentDesc.contains(keyword) || text.contains(keyword)
            }
        }

        // Check for password field specifically
        val hasPasswordField = events.any { event ->
            event.resourceId.lowercase().contains("password") ||
            event.resourceId.lowercase().contains("passwd")
        }

        return (hasLoginInput && hasLoginButton) || hasPasswordField
    }

    /**
     * Check if events match search pattern
     */
    private fun hasSearchPattern(events: List<RecordedEvent>): Boolean {
        val searchKeywords = listOf("search", "query", "find", "lookup", "filter")

        return events.any { event ->
            val resourceId = event.resourceId.lowercase()
            val contentDesc = event.contentDescription.lowercase()
            
            searchKeywords.any { keyword ->
                resourceId.contains(keyword) || contentDesc.contains(keyword)
            }
        }
    }

    /**
     * Check if events match checkout pattern
     */
    private fun hasCheckoutPattern(events: List<RecordedEvent>): Boolean {
        val checkoutKeywords = listOf(
            "checkout", "cart", "payment", "pay", "order", "buy", "purchase",
            "add_to_cart", "shipping", "billing", "credit_card"
        )

        return events.any { event ->
            val resourceId = event.resourceId.lowercase()
            val contentDesc = event.contentDescription.lowercase()
            val text = event.text.lowercase()
            
            checkoutKeywords.any { keyword ->
                resourceId.contains(keyword) || contentDesc.contains(keyword) || text.contains(keyword)
            }
        }
    }

    /**
     * Check if events match settings pattern
     */
    private fun hasSettingsPattern(events: List<RecordedEvent>): Boolean {
        val firstEvent = events.firstOrNull() ?: return false
        return firstEvent.packageName.contains("settings") ||
               events.count { it.resourceId.lowercase().contains("setting") } >= 2
    }

    /**
     * Check if events match social/messaging pattern
     */
    private fun hasSocialPattern(events: List<RecordedEvent>): Boolean {
        val socialKeywords = listOf(
            "message", "chat", "send", "comment", "post", "share", "like",
            "reply", "compose", "text_input", "input_field"
        )
        
        val socialApps = listOf(
            "facebook", "instagram", "twitter", "whatsapp", "messenger",
            "telegram", "snapchat", "tiktok", "linkedin"
        )

        val packageName = events.firstOrNull()?.packageName?.lowercase() ?: ""
        
        return socialApps.any { packageName.contains(it) } ||
               events.count { event ->
                   socialKeywords.any { keyword ->
                       event.resourceId.lowercase().contains(keyword)
                   }
               } >= 2
    }

    /**
     * Check if events match media pattern
     */
    private fun hasMediaPattern(events: List<RecordedEvent>): Boolean {
        val mediaKeywords = listOf(
            "play", "pause", "video", "audio", "music", "player",
            "seek", "volume", "fullscreen", "media"
        )

        return events.count { event ->
            mediaKeywords.any { keyword ->
                event.resourceId.lowercase().contains(keyword) ||
                event.contentDescription.lowercase().contains(keyword)
            }
        } >= 2
    }

    /**
     * Extract key actions from events for summary
     */
    private fun extractKeyActions(events: List<RecordedEvent>): List<String> {
        val actions = mutableListOf<String>()

        for (event in events) {
            val actionName = when (event.eventType) {
                "tap" -> {
                    val target = event.text.takeIf { it.isNotEmpty() }
                        ?: event.contentDescription.takeIf { it.isNotEmpty() }
                        ?: event.resourceId.substringAfterLast("/").takeIf { it.isNotEmpty() }
                        ?: "button"
                    "Tap '$target'"
                }
                "text_input" -> {
                    val field = event.resourceId.substringAfterLast("/").takeIf { it.isNotEmpty() }
                        ?: "field"
                    "Enter text in '$field'"
                }
                "scroll" -> {
                    val direction = event.actionData?.get("direction")?.toString() ?: "down"
                    "Scroll $direction"
                }
                "long_tap" -> {
                    val target = event.text.takeIf { it.isNotEmpty() }
                        ?: event.contentDescription.takeIf { it.isNotEmpty() }
                        ?: "element"
                    "Long press '$target'"
                }
                else -> null
            }

            if (actionName != null && actions.size < 5) {
                actions.add(actionName)
            }
        }

        return actions
    }

    /**
     * Detect patterns in events
     */
    private fun detectPatterns(events: List<RecordedEvent>): List<String> {
        val patterns = mutableListOf<String>()

        val tapCount = events.count { it.eventType == "tap" }
        val inputCount = events.count { it.eventType == "text_input" }
        val scrollCount = events.count { it.eventType == "scroll" }

        if (tapCount > 5) patterns.add("Multiple taps ($tapCount)")
        if (inputCount > 0) patterns.add("Text input ($inputCount fields)")
        if (scrollCount > 3) patterns.add("Heavy scrolling ($scrollCount)")

        return patterns
    }

    /**
     * Generate smart name based on analysis
     */
    private fun generateSmartName(
        category: WorkflowCategory,
        keyActions: List<String>,
        appName: String,
        events: List<RecordedEvent>
    ): String {
        // Try to find specific identifiable action
        val mainAction = when (category) {
            WorkflowCategory.LOGIN -> "Login"
            WorkflowCategory.SEARCH -> {
                // Try to extract search query
                val searchInput = events.find { 
                    it.eventType == "text_input" && 
                    (it.resourceId.lowercase().contains("search") || 
                     it.resourceId.lowercase().contains("query"))
                }
                val query = searchInput?.text?.take(20) ?: ""
                if (query.isNotEmpty()) "Search '$query'" else "Search"
            }
            WorkflowCategory.CHECKOUT -> "Checkout"
            WorkflowCategory.FORM -> {
                // Count input fields
                val inputCount = events.count { it.eventType == "text_input" }
                "Fill Form ($inputCount fields)"
            }
            WorkflowCategory.SETTINGS -> "Configure Settings"
            WorkflowCategory.SOCIAL -> "Post/Message"
            WorkflowCategory.MEDIA -> "Media Playback"
            WorkflowCategory.NAVIGATION -> {
                // Try to get destination from last meaningful action
                val lastTap = events.lastOrNull { it.eventType == "tap" && it.text.isNotEmpty() }
                val destination = lastTap?.text?.take(15) ?: ""
                if (destination.isNotEmpty()) "Navigate to '$destination'" else "Navigation"
            }
            WorkflowCategory.GENERAL -> "Workflow"
        }

        return "$appName - $mainAction"
    }

    /**
     * Calculate confidence score for category detection
     */
    private fun calculateConfidence(events: List<RecordedEvent>, category: WorkflowCategory): Float {
        if (events.isEmpty()) return 0f

        val matchingPatterns = when (category) {
            WorkflowCategory.LOGIN -> if (hasLoginPattern(events)) 0.9f else 0.5f
            WorkflowCategory.SEARCH -> if (hasSearchPattern(events)) 0.85f else 0.5f
            WorkflowCategory.CHECKOUT -> if (hasCheckoutPattern(events)) 0.9f else 0.5f
            WorkflowCategory.FORM -> if (events.count { it.eventType == "text_input" } >= 3) 0.8f else 0.5f
            WorkflowCategory.SETTINGS -> if (hasSettingsPattern(events)) 0.85f else 0.5f
            else -> 0.6f
        }

        return matchingPatterns.coerceIn(0f, 1f)
    }

    // =========================================================================
    // Event Optimization Helpers
    // =========================================================================

    /**
     * Check if focus event is orphan (not followed by action)
     */
    private fun isOrphanFocus(events: List<RecordedEvent>, index: Int): Boolean {
        if (index >= events.size - 1) return true

        val focusEvent = events[index]
        val nextEvent = events[index + 1]
        
        val timeDiff = nextEvent.relativeTimestamp - focusEvent.relativeTimestamp
        
        // Focus followed by tap or text_input on same element is valid
        val sameElement = focusEvent.resourceId == nextEvent.resourceId ||
                         focusEvent.bounds == nextEvent.bounds
        
        val isFollowedByAction = (nextEvent.eventType == "tap" || nextEvent.eventType == "text_input") && sameElement

        return !isFollowedByAction || timeDiff > FOCUS_ORPHAN_THRESHOLD_MS
    }

    /**
     * Merge consecutive scroll events
     */
    private fun mergeConsecutiveScrolls(events: List<RecordedEvent>, startIndex: Int): Pair<RecordedEvent, Int> {
        val firstScroll = events[startIndex]
        var lastScroll = firstScroll
        var currentIndex = startIndex + 1
        var scrollCount = 1

        while (currentIndex < events.size) {
            val current = events[currentIndex]
            
            if (current.eventType != "scroll") break
            
            val timeDiff = current.relativeTimestamp - lastScroll.relativeTimestamp
            if (timeDiff > SCROLL_MERGE_THRESHOLD_MS) break

            lastScroll = current
            scrollCount++
            currentIndex++
        }

        if (scrollCount > 1) {
            Log.d(TAG, "Merged $scrollCount consecutive scrolls")
        }

        // Return merged scroll (using last scroll's data as it represents final state)
        val mergedActionData = lastScroll.actionData?.toMutableMap() ?: mutableMapOf()
        mergedActionData["merged_count"] = scrollCount

        val mergedScroll = lastScroll.copy(actionData = mergedActionData)
        return Pair(mergedScroll, currentIndex)
    }

    /**
     * Check if tap is duplicate of recent tap
     */
    private fun isDuplicateTap(optimizedEvents: List<RecordedEvent>, current: RecordedEvent): Boolean {
        if (optimizedEvents.isEmpty()) return false

        val lastEvent = optimizedEvents.lastOrNull { it.eventType == "tap" } ?: return false
        
        val timeDiff = current.relativeTimestamp - lastEvent.relativeTimestamp
        if (timeDiff > DUPLICATE_TAP_THRESHOLD_MS) return false

        // Same element check
        return (lastEvent.resourceId.isNotEmpty() && lastEvent.resourceId == current.resourceId) ||
               (lastEvent.bounds.isNotEmpty() && lastEvent.bounds == current.bounds)
    }

    /**
     * Consolidate consecutive text inputs on same field
     */
    private fun consolidateTextInputs(events: List<RecordedEvent>, startIndex: Int): Pair<RecordedEvent, Int> {
        val firstInput = events[startIndex]
        var lastInput = firstInput
        var currentIndex = startIndex + 1

        while (currentIndex < events.size) {
            val current = events[currentIndex]
            
            if (current.eventType != "text_input") break
            
            // Must be same field
            val sameField = (firstInput.resourceId.isNotEmpty() && firstInput.resourceId == current.resourceId) ||
                           (firstInput.bounds.isNotEmpty() && firstInput.bounds == current.bounds)
            
            if (!sameField) break

            lastInput = current
            currentIndex++
        }

        // Return last input (has final text value)
        return Pair(lastInput, currentIndex)
    }

    /**
     * Check if event is from system UI (should be filtered)
     */
    private fun isSystemUIEvent(event: RecordedEvent): Boolean {
        val systemPackages = listOf(
            "com.android.systemui",
            "com.android.launcher",
            "com.google.android.apps.nexuslauncher"
        )

        val systemClasses = listOf(
            "NavigationBarView",
            "StatusBarWindowView",
            "NotificationStackScrollLayout"
        )

        return systemPackages.any { event.packageName.startsWith(it) } ||
               systemClasses.any { event.className.contains(it) }
    }
}
