package com.agent.portal.utils

import com.google.gson.annotations.SerializedName

/**
 * Accessibility node representation
 */
data class A11yNode(
    val index: Int,
    val text: String,
    val className: String,
    val bounds: String,
    val clickable: Boolean,
    val focusable: Boolean,
    val focused: Boolean = false,
    val scrollable: Boolean = false,
    val longClickable: Boolean = false,
    val editable: Boolean = false,
    val contentDescription: String = "",
    val resourceId: String = "",
    val children: MutableList<A11yNode> = mutableListOf()
) {
    fun toMap(): Map<String, Any?> {
        return mapOf(
            "index" to index,
            "text" to text,
            "className" to className,
            "bounds" to bounds,
            "clickable" to clickable,
            "focusable" to focusable,
            "focused" to focused,
            "scrollable" to scrollable,
            "longClickable" to longClickable,
            "editable" to editable,
            "contentDescription" to contentDescription,
            "resourceId" to resourceId,
            "children" to children.map { it.toMap() }
        )
    }
}

/**
 * Phone state information
 */
data class PhoneState(
    @SerializedName("currentApp")
    val currentApp: String = "",

    @SerializedName("currentActivity")
    val currentActivity: String = "",

    @SerializedName("screenWidth")
    val screenWidth: Int = 0,

    @SerializedName("screenHeight")
    val screenHeight: Int = 0,

    @SerializedName("isScreenOn")
    val isScreenOn: Boolean = true,

    @SerializedName("orientation")
    val orientation: String = "portrait"
) {
    fun toMap(): Map<String, Any> {
        return mapOf(
            "currentApp" to currentApp,
            "currentActivity" to currentActivity,
            "screenWidth" to screenWidth,
            "screenHeight" to screenHeight,
            "isScreenOn" to isScreenOn,
            "orientation" to orientation
        )
    }
}

/**
 * Combined state response
 */
data class StateResponse(
    @SerializedName("a11y_tree")
    val a11yTree: List<Map<String, Any?>>,

    @SerializedName("phone_state")
    val phoneState: Map<String, Any>
)

/**
 * Recorded action event from accessibility service
 */
data class ActionEvent(
    @SerializedName("type")
    val type: String,                    // "tap", "long_press", "text_input", "scroll"

    @SerializedName("timestamp")
    val timestamp: Long,                 // System time when action occurred

    @SerializedName("x")
    val x: Int,                          // Center X coordinate of the element

    @SerializedName("y")
    val y: Int,                          // Center Y coordinate of the element

    @SerializedName("bounds")
    val bounds: String,                  // Element bounds "left,top,right,bottom"

    @SerializedName("text")
    val text: String = "",               // Element text content

    @SerializedName("contentDescription")
    val contentDescription: String = "", // Element content description

    @SerializedName("resourceId")
    val resourceId: String = "",         // Element resource-id for selector

    @SerializedName("className")
    val className: String = "",          // Element class name

    @SerializedName("packageName")
    val packageName: String = "",        // Package name of the app

    @SerializedName("inputText")
    val inputText: String = ""           // Text entered (for text_input type)
) {
    fun toMap(): Map<String, Any> {
        return mapOf(
            "type" to type,
            "timestamp" to timestamp,
            "x" to x,
            "y" to y,
            "bounds" to bounds,
            "text" to text,
            "contentDescription" to contentDescription,
            "resourceId" to resourceId,
            "className" to className,
            "packageName" to packageName,
            "inputText" to inputText
        )
    }
}

/**
 * Selector strategy for element matching during workflow replay.
 * Prioritized from most specific to most generic.
 */
enum class SelectorType {
    RESOURCE_ID,       // Most reliable: android:id/resource_name
    CONTENT_DESC,      // Accessibility content description
    TEXT,              // Element text content
    CLASS_WITH_TEXT,   // Class name combined with text
    XPATH,             // XPath-style traversal path
    BOUNDS             // Fallback: absolute screen coordinates
}

/**
 * Smart selector with strategy type and value for element matching
 */
data class SmartSelector(
    @SerializedName("type")
    val type: SelectorType,              // Selector strategy type

    @SerializedName("value")
    val value: String,                   // Selector value (e.g., resource-id string)

    @SerializedName("confidence")
    val confidence: Float = 1.0f         // Confidence score (1.0 = highest)
) {
    fun toMap(): Map<String, Any> {
        return mapOf(
            "type" to type.name,
            "value" to value,
            "confidence" to confidence
        )
    }
}

/**
 * Element snapshot capturing UI element state for workflow generation.
 * Contains element properties and multiple selector strategies for replay.
 */
data class ElementSnapshot(
    @SerializedName("text")
    val text: String = "",               // Element text content

    @SerializedName("contentDescription")
    val contentDescription: String = "", // Accessibility content description

    @SerializedName("resourceId")
    val resourceId: String = "",         // Resource ID (e.g., com.app:id/button)

    @SerializedName("className")
    val className: String = "",          // UI class name (e.g., android.widget.Button)

    @SerializedName("packageName")
    val packageName: String = "",        // Package name of the app

    @SerializedName("bounds")
    val bounds: String = "",             // Element bounds "left,top,right,bottom"

    @SerializedName("centerX")
    val centerX: Int = 0,                // Center X coordinate

    @SerializedName("centerY")
    val centerY: Int = 0,                // Center Y coordinate

    @SerializedName("clickable")
    val clickable: Boolean = false,      // Is element clickable

    @SerializedName("focusable")
    val focusable: Boolean = false,      // Is element focusable

    @SerializedName("editable")
    val editable: Boolean = false,       // Is element editable (text field)

    @SerializedName("scrollable")
    val scrollable: Boolean = false,     // Is element scrollable

    @SerializedName("selectors")
    val selectors: List<SmartSelector> = emptyList()  // Prioritized selector list
) {
    /**
     * Generate prioritized selectors based on element properties.
     * Order: resource-id > content-desc > class+text > xpath > bounds
     */
    fun generateSelectors(): List<SmartSelector> {
        val result = mutableListOf<SmartSelector>()

        // Priority 1: Resource ID (most stable)
        if (resourceId.isNotEmpty()) {
            result.add(SmartSelector(
                type = SelectorType.RESOURCE_ID,
                value = resourceId,
                confidence = 1.0f
            ))
        }

        // Priority 2: Content description (accessibility)
        if (contentDescription.isNotEmpty()) {
            result.add(SmartSelector(
                type = SelectorType.CONTENT_DESC,
                value = contentDescription,
                confidence = 0.9f
            ))
        }

        // Priority 3: Text content
        if (text.isNotEmpty()) {
            result.add(SmartSelector(
                type = SelectorType.TEXT,
                value = text,
                confidence = 0.8f
            ))
        }

        // Priority 4: Class with text combination
        if (className.isNotEmpty() && text.isNotEmpty()) {
            result.add(SmartSelector(
                type = SelectorType.CLASS_WITH_TEXT,
                value = "$className:$text",
                confidence = 0.7f
            ))
        }

        // Priority 5: Bounds as fallback (least reliable due to screen variations)
        if (bounds.isNotEmpty()) {
            result.add(SmartSelector(
                type = SelectorType.BOUNDS,
                value = bounds,
                confidence = 0.3f
            ))
        }

        return result
    }

    /**
     * Get the best display name for this element (for step naming)
     */
    fun getDisplayName(): String {
        return when {
            text.isNotEmpty() -> text
            contentDescription.isNotEmpty() -> contentDescription
            resourceId.isNotEmpty() -> resourceId.substringAfterLast("/")
            className.isNotEmpty() -> className.substringAfterLast(".")
            else -> "element"
        }
    }

    fun toMap(): Map<String, Any?> {
        return mapOf(
            "text" to text,
            "contentDescription" to contentDescription,
            "resourceId" to resourceId,
            "className" to className,
            "packageName" to packageName,
            "bounds" to bounds,
            "centerX" to centerX,
            "centerY" to centerY,
            "clickable" to clickable,
            "focusable" to focusable,
            "editable" to editable,
            "scrollable" to scrollable,
            "selectors" to selectors.map { it.toMap() }
        )
    }

    companion object {
        /**
         * Create ElementSnapshot from accessibility node data
         */
        fun fromNodeData(
            text: String = "",
            contentDescription: String = "",
            resourceId: String = "",
            className: String = "",
            packageName: String = "",
            bounds: String = "",
            centerX: Int = 0,
            centerY: Int = 0,
            clickable: Boolean = false,
            focusable: Boolean = false,
            editable: Boolean = false,
            scrollable: Boolean = false
        ): ElementSnapshot {
            val snapshot = ElementSnapshot(
                text = text,
                contentDescription = contentDescription,
                resourceId = resourceId,
                className = className,
                packageName = packageName,
                bounds = bounds,
                centerX = centerX,
                centerY = centerY,
                clickable = clickable,
                focusable = focusable,
                editable = editable,
                scrollable = scrollable
            )
            // Generate selectors based on element properties
            return snapshot.copy(selectors = snapshot.generateSelectors())
        }
    }
}
