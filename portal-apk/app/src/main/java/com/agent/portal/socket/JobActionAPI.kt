package com.agent.portal.socket

import android.content.Context
import android.util.Log
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

/**
 * API client for fetching action configurations
 *
 * Flow:
 * 1. Job received with action_config_url
 * 2. Fetch action config from URL
 * 3. Parse actions and parameters
 * 4. Execute actions sequentially
 */
object JobActionAPI {

    private const val TAG = "JobActionAPI"
    private const val REQUEST_TIMEOUT = 10L

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(REQUEST_TIMEOUT, TimeUnit.SECONDS)
        .readTimeout(REQUEST_TIMEOUT, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()

    /**
     * Fetch action configuration from API
     */
    suspend fun fetchActionConfig(context: Context, configUrl: String): ActionConfig? {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Fetching action config from: $configUrl")

                val request = Request.Builder()
                    .url(configUrl)
                    .get()
                    .build()

                val response = httpClient.newCall(request).execute()

                if (!response.isSuccessful) {
                    Log.e(TAG, "Failed to fetch config: ${response.code}")
                    return@withContext null
                }

                val body = response.body?.string()
                if (body == null) {
                    Log.e(TAG, "Empty response body")
                    return@withContext null
                }

                val config = gson.fromJson(body, ActionConfig::class.java)
                Log.d(TAG, "Action config fetched: ${config.actions.size} actions")

                config

            } catch (e: Exception) {
                Log.e(TAG, "Error fetching action config", e)
                null
            }
        }
    }
}

/**
 * Action configuration from API
 */
data class ActionConfig(
    @SerializedName("job_id")
    val jobId: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("description")
    val description: String? = null,

    @SerializedName("actions")
    val actions: List<Action>,

    @SerializedName("on_error")
    val onError: ErrorHandling = ErrorHandling.STOP,

    @SerializedName("timeout")
    val timeout: Long = 30000,

    @SerializedName("metadata")
    val metadata: Map<String, Any>? = null
)

/**
 * Individual action
 */
data class Action(
    @SerializedName("id")
    val id: String,

    @SerializedName("type")
    val type: ActionType,

    @SerializedName("params")
    val params: Map<String, Any>,

    @SerializedName("wait_before")
    val waitBefore: Long = 0,

    @SerializedName("wait_after")
    val waitAfter: Long = 500,

    @SerializedName("retry_on_fail")
    val retryOnFail: Int = 0,

    @SerializedName("optional")
    val optional: Boolean = false,

    @SerializedName("condition")
    val condition: ActionCondition? = null
)

/**
 * Action types supported
 */
enum class ActionType(val value: String) {
    @SerializedName("tap")
    TAP("tap"),

    @SerializedName("double_tap")
    DOUBLE_TAP("double_tap"),

    @SerializedName("long_press")
    LONG_PRESS("long_press"),

    @SerializedName("swipe")
    SWIPE("swipe"),

    @SerializedName("scroll")
    SCROLL("scroll"),

    @SerializedName("text_input")
    TEXT_INPUT("text_input"),

    @SerializedName("press_key")
    PRESS_KEY("press_key"),

    @SerializedName("start_app")
    START_APP("start_app"),

    @SerializedName("wait")
    WAIT("wait"),

    @SerializedName("screenshot")
    SCREENSHOT("screenshot"),

    @SerializedName("assert")
    ASSERT("assert"),

    @SerializedName("extract")
    EXTRACT("extract"),

    @SerializedName("element_check")
    ELEMENT_CHECK("element_check"),

    @SerializedName("wait_for_element")
    WAIT_FOR_ELEMENT("wait_for_element"),

    @SerializedName("custom")
    CUSTOM("custom")
}

/**
 * Error handling strategy
 */
enum class ErrorHandling(val value: String) {
    @SerializedName("stop")
    STOP("stop"),

    @SerializedName("continue")
    CONTINUE("continue"),

    @SerializedName("retry")
    RETRY("retry"),

    @SerializedName("skip")
    SKIP("skip")
}

/**
 * Action condition for conditional execution
 */
data class ActionCondition(
    @SerializedName("type")
    val type: String,

    @SerializedName("params")
    val params: Map<String, Any>
)

/**
 * Action execution result
 */
data class ActionResult(
    val actionId: String,
    val success: Boolean,
    val message: String,
    val data: Map<String, Any>? = null,
    val error: String? = null,
    val executionTime: Long = 0
)
