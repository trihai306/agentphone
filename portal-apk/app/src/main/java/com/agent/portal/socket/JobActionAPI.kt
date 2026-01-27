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

    /**
     * Fetch data collection from API (for Data Iteration feature)
     * 
     * @param context Application context
     * @param collectionId ID of the collection to fetch
     * @return DataCollection object or null on error
     */
    suspend fun fetchDataCollection(context: Context, collectionId: Int): DataCollection? {
        return withContext(Dispatchers.IO) {
            try {
                val authToken = getAuthToken(context)
                if (authToken == null) {
                    Log.e(TAG, "No auth token available")
                    return@withContext null
                }

                val apiBaseUrl = com.agent.portal.utils.NetworkUtils.getApiBaseUrl()
                val url = "$apiBaseUrl/api/data-collections/$collectionId"
                
                Log.d(TAG, "Fetching data collection from: $url")

                val request = Request.Builder()
                    .url(url)
                    .header("Authorization", "Bearer $authToken")
                    .header("Accept", "application/json")
                    .get()
                    .build()

                val response = httpClient.newCall(request).execute()

                if (!response.isSuccessful) {
                    Log.e(TAG, "Failed to fetch collection: ${response.code}")
                    return@withContext null
                }

                val body = response.body?.string()
                if (body == null) {
                    Log.e(TAG, "Empty response body")
                    return@withContext null
                }

                val collection = gson.fromJson(body, DataCollection::class.java)
                Log.d(TAG, "Data collection fetched: ${collection.records.size} records")

                collection

            } catch (e: Exception) {
                Log.e(TAG, "Error fetching data collection", e)
                null
            }
        }
    }

    /**
     * Fetch variable data from secondary collection (Data Iteration feature)
     * 
     * @param context Application context
     * @param collectionId ID of the variable source collection (nullable)
     * @param iterationIndex Index of the record to fetch (nullable, 0-based)
     * @return Map of variable data, or emptyMap() if not available
     */
    suspend fun fetchVariableData(
        context: Context,
        collectionId: Int?,
        iterationIndex: Int?
    ): Map<String, Any> {
        // Null checks - return empty if either is null
        if (collectionId == null || iterationIndex == null) {
            Log.d(TAG, "No variable source collection, skipping variable data fetch")
            return emptyMap()
        }

        return try {
            // Fetch collection from API
            val collection = fetchDataCollection(context, collectionId)
            if (collection == null) {
                Log.w(TAG, "Failed to fetch collection $collectionId, using primary data only")
                return emptyMap()
            }

            val records = collection.records
            
            // Validate collection not empty
            if (records.isEmpty()) {
                Log.w(TAG, "Collection $collectionId is empty, falling back to primary data")
                return emptyMap()
            }

            // Calculate effective index with wraparound
            // Ensure positive result even if iterationIndex is negative (edge case)
            val effectiveIndex = ((iterationIndex % records.size) + records.size) % records.size
            
            // Get record at index
            val record = records[effectiveIndex]
            
            Log.i(
                TAG,
                "Using variable record #${record.id} from collection $collectionId " +
                "(iteration $iterationIndex → index $effectiveIndex of ${records.size} records)"
            )

            // Return record data
            record.data

        } catch (e: Exception) {
            Log.e(TAG, "Failed to fetch variable data from collection $collectionId: ${e.message}", e)
            emptyMap() // Fallback: empty map allows job to continue with primary data
        }
    }

    /**
     * Merge primary data and variable data contexts
     * Variable data OVERRIDES primary data if keys conflict
     * 
     * @param primaryData Data from primary collection (e.g., account credentials)
     * @param variableData Data from variable collection (e.g., unique comments)
     * @return Merged map with all keys from both sources
     */
    fun mergeDataContexts(
        primaryData: Map<String, Any>,
        variableData: Map<String, Any>
    ): Map<String, Any> {
        Log.d(
            TAG,
            "Merging data contexts: Primary keys = [${primaryData.keys.joinToString()}], " + 
            "Variable keys = [${variableData.keys.joinToString()}]"
        )
        
        // Variable data overrides primary data (Kotlin map + operator behavior)
        return primaryData + variableData
    }

    /**
     * Get authentication token from session
     */
    private fun getAuthToken(context: Context): String? {
        val sessionManager = com.agent.portal.auth.SessionManager(context)
        val session = sessionManager.getSession()
        return session?.token
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
    val condition: ActionCondition? = null,

    // Execution probability (0-100%, default 100 = always execute)
    // When < 100, action has X% chance to execute, (100-X)% chance to skip
    @SerializedName("probability")
    val probability: Int = 100
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

    @SerializedName("repeat_click")
    REPEAT_CLICK("repeat_click"),

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

/**
 * Data Collection response model (for Data Iteration feature)
 */
data class DataCollection(
    @SerializedName("id")
    val id: Int,

    @SerializedName("name")
    val name: String,

    @SerializedName("records")
    val records: List<DataRecord>
)

/**
 * Data Record model (individual record in a collection)
 */
data class DataRecord(
    @SerializedName("id")
    val id: Int,

    @SerializedName("data")
    val data: Map<String, Any>
)
