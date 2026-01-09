package com.agent.portal.recording

import android.content.Context
import android.util.Log
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.io.IOException

/**
 * EventUploader handles uploading recorded events and screenshots to Python backend
 *
 * Features:
 * - Auto-upload when recording stops
 * - Batch upload events + screenshots
 * - Retry mechanism for failed uploads
 * - Progress callback
 */
object EventUploader {

    private const val TAG = "EventUploader"

    // Python backend URL (configurable)
    private var backendUrl = "http://localhost:5000"  // Default Python Flask port

    // OkHttp client for uploads
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
        .writeTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
        .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
        .build()

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    /**
     * Upload callback interface
     */
    interface UploadCallback {
        fun onProgress(current: Int, total: Int)
        fun onSuccess(recordingId: String, eventCount: Int)
        fun onError(error: String)
    }

    /**
     * Configure backend URL
     */
    fun setBackendUrl(url: String) {
        backendUrl = url.trimEnd('/')
        Log.i(TAG, "Backend URL set to: $backendUrl")
    }

    /**
     * Auto-upload recording data when recording stops
     *
     * @param context Application context
     * @param recordingId Recording session ID
     * @param events List of recorded events
     * @param callback Upload progress callback
     */
    fun uploadRecording(
        context: Context,
        recordingId: String,
        events: List<RecordedEvent>,
        callback: UploadCallback? = null
    ) {
        scope.launch {
            try {
                Log.i(TAG, "Starting upload for recording: $recordingId with ${events.size} events")

                // Step 1: Upload events metadata
                val eventsJson = com.google.gson.Gson().toJson(mapOf(
                    "recording_id" to recordingId,
                    "event_count" to events.size,
                    "events" to events.map { it.toUploadFormat() }
                ))

                val uploaded = uploadEvents(eventsJson)
                if (!uploaded) {
                    withContext(Dispatchers.Main) {
                        callback?.onError("Failed to upload events")
                    }
                    return@launch
                }

                // Step 2: Upload screenshots (if any)
                val screenshotsToUpload = events.mapNotNull { it.screenshotPath }
                if (screenshotsToUpload.isNotEmpty()) {
                    uploadScreenshots(context, recordingId, screenshotsToUpload, callback)
                }

                // Success
                withContext(Dispatchers.Main) {
                    callback?.onSuccess(recordingId, events.size)
                }

                Log.i(TAG, "Upload completed successfully for $recordingId")

            } catch (e: Exception) {
                Log.e(TAG, "Upload failed", e)
                withContext(Dispatchers.Main) {
                    callback?.onError(e.message ?: "Unknown error")
                }
            }
        }
    }

    /**
     * Upload events JSON to Python backend
     */
    private suspend fun uploadEvents(eventsJson: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val requestBody = eventsJson.toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$backendUrl/api/interactions")
                .post(requestBody)
                .addHeader("Content-Type", "application/json")
                .build()

            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    Log.d(TAG, "Events uploaded successfully: ${response.code}")
                    true
                } else {
                    Log.e(TAG, "Events upload failed: ${response.code} - ${response.message}")
                    false
                }
            }
        } catch (e: IOException) {
            Log.e(TAG, "Network error uploading events", e)
            false
        }
    }

    /**
     * Upload screenshots to Python backend
     */
    private suspend fun uploadScreenshots(
        context: Context,
        recordingId: String,
        screenshotPaths: List<String>,
        callback: UploadCallback?
    ) = withContext(Dispatchers.IO) {
        try {
            val total = screenshotPaths.size
            var uploaded = 0

            screenshotPaths.forEach { path ->
                val file = ScreenshotManager.getScreenshotFile(path)
                if (file != null && file.exists()) {
                    val success = uploadScreenshotFile(recordingId, file)
                    if (success) {
                        uploaded++
                        withContext(Dispatchers.Main) {
                            callback?.onProgress(uploaded, total)
                        }
                    }
                }
            }

            Log.i(TAG, "Uploaded $uploaded/$total screenshots")
        } catch (e: Exception) {
            Log.e(TAG, "Error uploading screenshots", e)
        }
    }

    /**
     * Upload single screenshot file
     */
    private fun uploadScreenshotFile(recordingId: String, file: File): Boolean {
        try {
            val requestBody = MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("recording_id", recordingId)
                .addFormDataPart(
                    "screenshot",
                    file.name,
                    RequestBody.create("image/jpeg".toMediaType(), file)
                )
                .build()

            val request = Request.Builder()
                .url("$backendUrl/api/screenshots/upload")
                .post(requestBody)
                .build()

            client.newCall(request).execute().use { response ->
                return response.isSuccessful
            }
        } catch (e: IOException) {
            Log.e(TAG, "Failed to upload screenshot: ${file.name}", e)
            return false
        }
    }

    /**
     * Test connection to Python backend
     */
    suspend fun testConnection(): Boolean = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("$backendUrl/health")
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                response.isSuccessful
            }
        } catch (e: IOException) {
            Log.e(TAG, "Connection test failed", e)
            false
        }
    }

    /**
     * Cancel all pending uploads
     */
    fun cancelAll() {
        scope.cancel()
    }

    /**
     * Convert RecordedEvent to upload format
     * (removes screenshot bitmap, keeps only metadata)
     */
    private fun RecordedEvent.toUploadFormat(): Map<String, Any?> {
        return mapOf(
            "event_type" to eventType,
            "timestamp" to timestamp,
            "sequence_number" to sequenceNumber,
            "relative_timestamp" to relativeTimestamp,
            "package_name" to packageName,
            "class_name" to className,
            "resource_id" to resourceId,
            "content_description" to contentDescription,
            "text" to text,
            "bounds" to bounds,
            "is_clickable" to isClickable,
            "is_editable" to isEditable,
            "is_scrollable" to isScrollable,
            "action_data" to actionData,
            "x" to x,
            "y" to y,
            "node_index" to nodeIndex,
            "screenshot_filename" to screenshotPath?.substringAfterLast("/"),
            "app_name" to appName
        )
    }
}
