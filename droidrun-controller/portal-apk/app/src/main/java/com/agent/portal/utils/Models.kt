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
