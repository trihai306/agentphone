package com.agent.portal.recording

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.util.Base64
import android.util.Log
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.ByteArrayOutputStream
import java.io.File
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger

/**
 * RealTimeUploader handles real-time upload of events with screenshots to Python backend.
 *
 * Features:
 * - Upload events immediately when captured
 * - Include base64-encoded screenshot with each event
 * - Retry mechanism for failed uploads
 * - Offline queue with persistent storage
 * - Automatic retry when network becomes available
 * - Configurable screenshot quality
 */
object RealTimeUploader {

    private const val TAG = "RealTimeUploader"
    private const val UPLOAD_TIMEOUT_SECONDS = 10L
    private const val MAX_RETRY_ATTEMPTS = 5
    private const val RETRY_DELAY_MS = 2000L
    private const val MAX_QUEUE_SIZE = 100
    private const val OFFLINE_QUEUE_FILE = "offline_upload_queue.json"

    // OkHttp client for uploads
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(UPLOAD_TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .writeTimeout(UPLOAD_TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .readTimeout(UPLOAD_TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    // Backend URL - set via init()
    private var backendBaseUrl: String? = null
    private var isEnabled = false
    
    // Laravel backend for workflow automation
    private var laravelBackendUrl: String? = null
    private var workflowSessionId: String? = null
    private var workflowFlowId: Int? = null
    private var workflowEnabled = false

    // Context for network checks and file storage
    private var contextRef: Context? = null

    // Upload queue for retry (in-memory + persistent)
    private val uploadQueue = mutableListOf<PendingUpload>()
    private val isProcessingQueue = AtomicBoolean(false)
    private val pendingCount = AtomicInteger(0)

    // Screenshot quality (0-100, default 80)
    private var screenshotQuality = 80

    /**
     * Initialize uploader with backend URL
     */
    fun init(context: Context, backendUrl: String, enabled: Boolean = true) {
        contextRef = context.applicationContext
        backendBaseUrl = backendUrl.trimEnd('/')
        isEnabled = enabled

        // Load persisted queue
        loadPersistedQueue()

        Log.i(TAG, "RealTimeUploader initialized: $backendBaseUrl (enabled: $enabled)")
        Log.i(TAG, "Loaded ${uploadQueue.size} pending uploads from storage")

        // Start processing queue if there are pending items
        if (uploadQueue.isNotEmpty()) {
            processQueueAsync()
        }
    }

    /**
     * Set screenshot quality for uploads
     * @param quality 0-100 (lower = smaller file, worse quality)
     */
    fun setScreenshotQuality(quality: Int) {
        screenshotQuality = quality.coerceIn(10, 100)
        Log.i(TAG, "Screenshot quality set to $screenshotQuality%")
    }

    /**
     * Get current screenshot quality
     */
    fun getScreenshotQuality(): Int = screenshotQuality

    /**
     * Enable/disable real-time upload
     */
    fun setEnabled(enabled: Boolean) {
        isEnabled = enabled
        Log.i(TAG, "Real-time upload ${if (enabled) "enabled" else "disabled"}")

        if (enabled && uploadQueue.isNotEmpty()) {
            processQueueAsync()
        }
    }

    /**
     * Check if uploader is enabled and configured
     */
    fun isReady(): Boolean = isEnabled && backendBaseUrl != null

    /**
     * Check if device is online
     */
    private fun isOnline(): Boolean {
        val context = contextRef ?: return true // Assume online if no context

        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            ?: return true

        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false

        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }

    /**
     * Upload event with screenshot in real-time
     *
     * @param event The recorded event
     * @param screenshotPath Path to screenshot file (optional)
     */
    fun uploadEventRealTime(context: Context, event: RecordedEvent, screenshotPath: String?) {
        if (!isReady()) {
            Log.d(TAG, "Uploader not ready, skipping upload")
            return
        }

        scope.launch {
            try {
                // Prepare event data with screenshot
                val eventData = prepareEventData(context, event, screenshotPath)

                if (!isOnline()) {
                    // Device is offline - queue for later
                    Log.d(TAG, "Device offline, queueing event #${event.sequenceNumber}")
                    addToQueue(eventData, saveToStorage = true)
                    return@launch
                }

                // Upload to backend
                val success = uploadToBackend(eventData)

                if (success) {
                    Log.d(TAG, "✓ Event #${event.sequenceNumber} uploaded successfully")
                } else {
                    // Add to queue for retry
                    addToQueue(eventData)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error uploading event #${event.sequenceNumber}", e)
                // Don't crash, just log
            }
        }
    }

    /**
     * Prepare event data with screenshot for upload
     */
    private fun prepareEventData(
        context: Context,
        event: RecordedEvent,
        screenshotPath: String?
    ): EventUploadData {
        // Load and encode screenshot if available
        val screenshotBase64 = if (screenshotPath != null) {
            encodeScreenshotToBase64(screenshotPath)
        } else null

        return EventUploadData(
            eventType = event.eventType,
            timestamp = event.timestamp,
            sequenceNumber = event.sequenceNumber,
            relativeTimestamp = event.relativeTimestamp,
            packageName = event.packageName,
            className = event.className,
            appName = event.appName,
            resourceId = event.resourceId,
            contentDescription = event.contentDescription,
            text = event.text,
            x = event.x,
            y = event.y,
            bounds = event.bounds,
            isClickable = event.isClickable,
            isEditable = event.isEditable,
            isScrollable = event.isScrollable,
            actionData = event.actionData,
            screenshot = screenshotBase64,
            screenshotPath = screenshotPath
        )
    }

    /**
     * Encode screenshot file to base64 string with configurable quality
     */
    private fun encodeScreenshotToBase64(screenshotPath: String): String? {
        return try {
            val file = File(screenshotPath)
            if (!file.exists()) {
                Log.w(TAG, "Screenshot file not found: $screenshotPath")
                return null
            }

            // Load bitmap
            val bitmap = BitmapFactory.decodeFile(screenshotPath)
            if (bitmap == null) {
                Log.w(TAG, "Failed to decode screenshot: $screenshotPath")
                return null
            }

            // Compress to JPEG with configurable quality and encode to base64
            val outputStream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.JPEG, screenshotQuality, outputStream)
            val bytes = outputStream.toByteArray()
            bitmap.recycle()

            Base64.encodeToString(bytes, Base64.NO_WRAP)
        } catch (e: Exception) {
            Log.e(TAG, "Error encoding screenshot", e)
            null
        }
    }

    /**
     * Upload event data to Python backend
     */
    private suspend fun uploadToBackend(eventData: EventUploadData): Boolean {
        return withContext(Dispatchers.IO) {
            try {
                val url = "$backendBaseUrl/api/events/realtime"
                val json = gson.toJson(eventData)

                Log.d(TAG, "Uploading to: $url (size: ${json.length} bytes)")

                val requestBody = json.toRequestBody("application/json".toMediaType())
                val request = Request.Builder()
                    .url(url)
                    .post(requestBody)
                    .build()

                val response = httpClient.newCall(request).execute()
                val success = response.isSuccessful

                if (success) {
                    Log.d(TAG, "Upload successful: ${response.code}")
                } else {
                    Log.w(TAG, "Upload failed: ${response.code} - ${response.message}")
                }

                response.close()
                success
            } catch (e: Exception) {
                Log.e(TAG, "Upload request failed", e)
                false
            }
        }
    }

    /**
     * Add failed upload to retry queue
     */
    private fun addToQueue(eventData: EventUploadData, saveToStorage: Boolean = false) {
        synchronized(uploadQueue) {
            // Check queue size limit
            if (uploadQueue.size >= MAX_QUEUE_SIZE) {
                // Remove oldest item
                uploadQueue.removeAt(0)
                Log.w(TAG, "Queue full, removed oldest item")
            }

            uploadQueue.add(PendingUpload(eventData, attempts = 0))
            pendingCount.set(uploadQueue.size)
            Log.d(TAG, "Added to retry queue (${uploadQueue.size} pending)")

            if (saveToStorage) {
                persistQueue()
            }
        }

        // Start queue processing
        processQueueAsync()
    }

    /**
     * Process pending uploads asynchronously
     */
    private fun processQueueAsync() {
        if (isProcessingQueue.getAndSet(true)) {
            return // Already processing
        }

        scope.launch {
            try {
                processQueue()
            } finally {
                isProcessingQueue.set(false)
            }
        }
    }

    /**
     * Process pending uploads with exponential backoff
     */
    private suspend fun processQueue() {
        if (!isReady()) return

        while (true) {
            val pending = synchronized(uploadQueue) {
                if (uploadQueue.isEmpty()) null else uploadQueue.first()
            } ?: break

            // Check if we're online
            if (!isOnline()) {
                Log.d(TAG, "Device offline, pausing queue processing")
                delay(10000) // Wait 10 seconds before checking again
                continue
            }

            // Check max attempts
            if (pending.attempts >= MAX_RETRY_ATTEMPTS) {
                synchronized(uploadQueue) {
                    uploadQueue.remove(pending)
                    pendingCount.set(uploadQueue.size)
                    persistQueue()
                }
                Log.w(TAG, "Max retry attempts reached for event #${pending.data.sequenceNumber}, discarding")
                continue
            }

            // Exponential backoff delay
            val delayMs = RETRY_DELAY_MS * (1 shl pending.attempts.coerceAtMost(4))
            delay(delayMs)

            // Attempt upload
            val success = uploadToBackend(pending.data)

            if (success) {
                synchronized(uploadQueue) {
                    uploadQueue.remove(pending)
                    pendingCount.set(uploadQueue.size)
                    persistQueue()
                }
                Log.d(TAG, "✓ Retry successful for event #${pending.data.sequenceNumber}")
            } else {
                pending.attempts++
                Log.d(TAG, "Retry failed for event #${pending.data.sequenceNumber} (attempt ${pending.attempts})")
            }
        }

        Log.d(TAG, "Queue processing complete")
    }

    /**
     * Persist queue to file storage for offline resilience
     */
    private fun persistQueue() {
        val context = contextRef ?: return

        scope.launch(Dispatchers.IO) {
            try {
                val file = File(context.filesDir, OFFLINE_QUEUE_FILE)
                val json = gson.toJson(uploadQueue)
                file.writeText(json)
                Log.d(TAG, "Queue persisted: ${uploadQueue.size} items")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to persist queue", e)
            }
        }
    }

    /**
     * Load persisted queue from file storage
     */
    private fun loadPersistedQueue() {
        val context = contextRef ?: return

        try {
            val file = File(context.filesDir, OFFLINE_QUEUE_FILE)
            if (file.exists()) {
                val json = file.readText()
                val type = object : TypeToken<List<PendingUpload>>() {}.type
                val loaded: List<PendingUpload> = gson.fromJson(json, type) ?: emptyList()

                synchronized(uploadQueue) {
                    uploadQueue.clear()
                    uploadQueue.addAll(loaded)
                    pendingCount.set(uploadQueue.size)
                }

                Log.i(TAG, "Loaded ${loaded.size} pending uploads from storage")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load persisted queue", e)
        }
    }

    /**
     * Retry pending uploads (called manually or on network change)
     */
    fun retryPendingUploads() {
        if (!isReady() || uploadQueue.isEmpty()) return

        Log.i(TAG, "Retrying ${uploadQueue.size} pending uploads...")
        processQueueAsync()
    }

    /**
     * Get pending upload count
     */
    fun getPendingCount(): Int = pendingCount.get()

    /**
     * Clear all pending uploads
     */
    fun clearQueue() {
        synchronized(uploadQueue) {
            uploadQueue.clear()
            pendingCount.set(0)
        }

        // Delete persisted queue file
        val context = contextRef
        if (context != null) {
            val file = File(context.filesDir, OFFLINE_QUEUE_FILE)
            if (file.exists()) {
                file.delete()
            }
        }

        Log.i(TAG, "Upload queue cleared")
    }

    /**
     * Get queue statistics
     */
    fun getQueueStats(): Map<String, Any> {
        synchronized(uploadQueue) {
            val totalAttempts = uploadQueue.sumOf { it.attempts }
            return mapOf(
                "pending_count" to uploadQueue.size,
                "total_retry_attempts" to totalAttempts,
                "is_processing" to isProcessingQueue.get(),
                "is_online" to isOnline(),
                "screenshot_quality" to screenshotQuality
            )
        }
    }

    /**
     * Shutdown uploader and cancel pending uploads
     */
    fun shutdown() {
        // Persist queue before shutdown
        if (uploadQueue.isNotEmpty()) {
            persistQueue()
        }

        scope.cancel()
        httpClient.dispatcher.executorService.shutdown()
        Log.i(TAG, "RealTimeUploader shutdown")
    }
}

/**
 * Event data structure for upload (includes base64 screenshot)
 */
data class EventUploadData(
    val eventType: String,
    val timestamp: Long,
    val sequenceNumber: Long,
    val relativeTimestamp: Long?,
    val packageName: String,
    val className: String,
    val appName: String?,
    val resourceId: String,
    val contentDescription: String,
    val text: String,
    val x: Int?,
    val y: Int?,
    val bounds: String,
    val isClickable: Boolean,
    val isEditable: Boolean,
    val isScrollable: Boolean,
    val actionData: Map<String, Any>?,
    val screenshot: String?,  // Base64-encoded screenshot
    val screenshotPath: String?
)

/**
 * Pending upload for retry queue
 */
data class PendingUpload(
    val data: EventUploadData,
    var attempts: Int = 0
)
