package com.agent.portal.socket

import android.content.Context
import android.util.Log
import com.agent.portal.recording.RecordingManager
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import io.socket.client.IO
import io.socket.client.Socket
import io.socket.emitter.Emitter
import kotlinx.coroutines.*
import org.json.JSONObject
import java.lang.ref.WeakReference
import java.net.URI
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicBoolean

/**
 * WebSocket Manager for receiving and executing jobs from server
 *
 * Architecture:
 * Server → Socket → JobQueue → JobExecutor → ActionAPI → Device Actions
 *
 * Features:
 * - Real-time job receiving via WebSocket
 * - Job queue management with priorities
 * - Action configuration from API
 * - Job execution with status reporting
 * - Auto-reconnect on disconnect
 * - Concurrent job handling
 */
object SocketJobManager {

    private const val TAG = "SocketJobManager"

    // Socket connection
    private var socket: Socket? = null
    private var serverUrl: String? = null
    private val isConnected = AtomicBoolean(false)
    private val isConnecting = AtomicBoolean(false)

    // Job management
    private val jobQueue = ConcurrentHashMap<String, Job>()
    private val executingJobs = ConcurrentHashMap<String, Job>()

    // Coroutine scope
    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())

    // Context reference
    private var contextRef: WeakReference<Context>? = null

    // Callbacks
    private val jobListeners = mutableListOf<JobListener>()

    // Gson for JSON parsing
    private val gson = Gson()

    /**
     * Initialize socket manager
     */
    fun init(context: Context, socketUrl: String) {
        contextRef = WeakReference(context.applicationContext)
        serverUrl = socketUrl
        Log.i(TAG, "SocketJobManager initialized with URL: $socketUrl")
    }

    /**
     * Connect to WebSocket server
     */
    fun connect() {
        if (serverUrl == null) {
            Log.e(TAG, "Server URL not set. Call init() first.")
            return
        }

        if (isConnected.get() || isConnecting.get()) {
            Log.w(TAG, "Already connected or connecting")
            return
        }

        isConnecting.set(true)

        scope.launch {
            try {
                Log.i(TAG, "Connecting to WebSocket: $serverUrl")

                val opts = IO.Options().apply {
                    reconnection = true
                    reconnectionDelay = 1000
                    reconnectionDelayMax = 5000
                    timeout = 10000
                }

                socket = IO.socket(URI.create(serverUrl), opts).apply {
                    // Connection events
                    on(Socket.EVENT_CONNECT, onConnect)
                    on(Socket.EVENT_DISCONNECT, onDisconnect)
                    on(Socket.EVENT_CONNECT_ERROR, onConnectError)

                    // Job events
                    on("job:new", onNewJob)
                    on("job:cancel", onCancelJob)
                    on("job:pause", onPauseJob)
                    on("job:resume", onResumeJob)

                    // Config events
                    on("config:update", onConfigUpdate)
                }

                socket?.connect()

            } catch (e: Exception) {
                Log.e(TAG, "Failed to connect", e)
                isConnecting.set(false)
                notifyConnectionError(e.message ?: "Unknown error")
            }
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    fun disconnect() {
        scope.launch {
            try {
                socket?.disconnect()
                socket?.off()
                socket = null
                isConnected.set(false)
                isConnecting.set(false)
                Log.i(TAG, "Disconnected from WebSocket")
            } catch (e: Exception) {
                Log.e(TAG, "Error disconnecting", e)
            }
        }
    }

    /**
     * Check if connected
     */
    fun isConnected(): Boolean = isConnected.get()

    /**
     * Add job listener
     */
    fun addJobListener(listener: JobListener) {
        jobListeners.add(listener)
    }

    /**
     * Remove job listener
     */
    fun removeJobListener(listener: JobListener) {
        jobListeners.remove(listener)
    }

    // ================================================================================
    // Socket Event Handlers
    // ================================================================================

    private val onConnect = Emitter.Listener {
        Log.i(TAG, "✓ Connected to WebSocket server")
        isConnected.set(true)
        isConnecting.set(false)

        scope.launch(Dispatchers.Main) {
            jobListeners.forEach { it.onConnected() }
        }

        // Send device info to server
        sendDeviceInfo()
    }

    private val onDisconnect = Emitter.Listener {
        Log.w(TAG, "✗ Disconnected from WebSocket server")
        isConnected.set(false)

        scope.launch(Dispatchers.Main) {
            jobListeners.forEach { it.onDisconnected() }
        }
    }

    private val onConnectError = Emitter.Listener { args ->
        val error = args.getOrNull(0)?.toString() ?: "Unknown error"
        Log.e(TAG, "Connection error: $error")
        isConnecting.set(false)

        scope.launch(Dispatchers.Main) {
            jobListeners.forEach { it.onConnectionError(error) }
        }
    }

    /**
     * Handle new job received from server
     */
    private val onNewJob = Emitter.Listener { args ->
        try {
            val data = args[0] as JSONObject
            val job = gson.fromJson(data.toString(), Job::class.java)

            Log.i(TAG, "📥 Received new job: ${job.id} - ${job.type}")

            // Add to queue
            jobQueue[job.id] = job

            // Notify listeners
            scope.launch(Dispatchers.Main) {
                jobListeners.forEach { it.onJobReceived(job) }
            }

            // Execute job based on priority
            if (job.priority == JobPriority.IMMEDIATE) {
                executeJobImmediately(job)
            } else {
                enqueueJob(job)
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error processing new job", e)
            sendJobError("unknown", "Failed to parse job: ${e.message}")
        }
    }

    /**
     * Handle job cancellation
     */
    private val onCancelJob = Emitter.Listener { args ->
        try {
            val data = args[0] as JSONObject
            val jobId = data.getString("job_id")

            Log.i(TAG, "🚫 Cancel job: $jobId")

            // Remove from queue
            jobQueue.remove(jobId)

            // Cancel if executing
            executingJobs[jobId]?.let { job ->
                job.status = JobStatus.CANCELLED
                executingJobs.remove(jobId)
                sendJobStatus(jobId, JobStatus.CANCELLED)
            }

            scope.launch(Dispatchers.Main) {
                jobListeners.forEach { it.onJobCancelled(jobId) }
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error cancelling job", e)
        }
    }

    /**
     * Handle job pause
     */
    private val onPauseJob = Emitter.Listener { args ->
        try {
            val data = args[0] as JSONObject
            val jobId = data.getString("job_id")

            executingJobs[jobId]?.let { job ->
                job.status = JobStatus.PAUSED
                sendJobStatus(jobId, JobStatus.PAUSED)
                Log.i(TAG, "⏸ Paused job: $jobId")
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error pausing job", e)
        }
    }

    /**
     * Handle job resume
     */
    private val onResumeJob = Emitter.Listener { args ->
        try {
            val data = args[0] as JSONObject
            val jobId = data.getString("job_id")

            executingJobs[jobId]?.let { job ->
                job.status = JobStatus.EXECUTING
                sendJobStatus(jobId, JobStatus.EXECUTING)
                Log.i(TAG, "▶️ Resumed job: $jobId")
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error resuming job", e)
        }
    }

    /**
     * Handle config update from server
     */
    private val onConfigUpdate = Emitter.Listener { args ->
        try {
            val data = args[0] as JSONObject
            Log.i(TAG, "⚙️ Config update received")

            scope.launch(Dispatchers.Main) {
                jobListeners.forEach { it.onConfigUpdate(data.toString()) }
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error processing config update", e)
        }
    }

    // ================================================================================
    // Job Execution
    // ================================================================================

    /**
     * Execute job immediately (high priority)
     */
    private fun executeJobImmediately(job: Job) {
        scope.launch {
            executeJob(job)
        }
    }

    /**
     * Enqueue job for execution
     */
    private fun enqueueJob(job: Job) {
        scope.launch {
            // Wait for current jobs to finish if needed
            delay(100)
            executeJob(job)
        }
    }

    /**
     * Execute a job
     */
    private suspend fun executeJob(job: Job) {
        val context = contextRef?.get() ?: return

        try {
            Log.i(TAG, "🚀 Executing job: ${job.id}")

            // Mark as executing
            job.status = JobStatus.EXECUTING
            executingJobs[job.id] = job
            sendJobStatus(job.id, JobStatus.EXECUTING)

            // Notify listeners
            withContext(Dispatchers.Main) {
                jobListeners.forEach { it.onJobStarted(job) }
            }

            // Fetch action configuration from API
            val actionConfig = JobActionAPI.fetchActionConfig(context, job.actionConfigUrl)

            if (actionConfig == null) {
                throw Exception("Failed to fetch action configuration")
            }

            // Execute actions
            val executor = JobExecutor(context)
            val result = executor.execute(job, actionConfig)

            // Update status
            job.status = if (result.success) JobStatus.COMPLETED else JobStatus.FAILED
            job.result = result

            executingJobs.remove(job.id)
            jobQueue.remove(job.id)

            // Send result to server
            sendJobResult(job)

            // Notify listeners
            withContext(Dispatchers.Main) {
                jobListeners.forEach { it.onJobCompleted(job, result) }
            }

            Log.i(TAG, "✓ Job ${job.id} completed: ${result.message}")

        } catch (e: Exception) {
            Log.e(TAG, "✗ Job ${job.id} failed", e)

            job.status = JobStatus.FAILED
            job.result = JobResult(
                success = false,
                message = "Job execution failed: ${e.message}",
                error = e.message
            )

            executingJobs.remove(job.id)
            jobQueue.remove(job.id)

            sendJobError(job.id, e.message ?: "Unknown error")

            withContext(Dispatchers.Main) {
                jobListeners.forEach { it.onJobFailed(job, e.message ?: "Unknown error") }
            }
        }
    }

    // ================================================================================
    // Socket Communication
    // ================================================================================

    /**
     * Send device info to server
     */
    private fun sendDeviceInfo() {
        val context = contextRef?.get() ?: return

        try {
            val deviceInfo = JSONObject().apply {
                put("device_id", android.provider.Settings.Secure.getString(
                    context.contentResolver,
                    android.provider.Settings.Secure.ANDROID_ID
                ))
                put("model", android.os.Build.MODEL)
                put("manufacturer", android.os.Build.MANUFACTURER)
                put("android_version", android.os.Build.VERSION.RELEASE)
                put("sdk_version", android.os.Build.VERSION.SDK_INT)
                put("timestamp", System.currentTimeMillis())
            }

            socket?.emit("device:info", deviceInfo)
            Log.d(TAG, "Device info sent")

        } catch (e: Exception) {
            Log.e(TAG, "Error sending device info", e)
        }
    }

    /**
     * Send job status update
     */
    private fun sendJobStatus(jobId: String, status: JobStatus) {
        try {
            val statusData = JSONObject().apply {
                put("job_id", jobId)
                put("status", status.value)
                put("timestamp", System.currentTimeMillis())
            }

            socket?.emit("job:status", statusData)
            Log.d(TAG, "Job status sent: $jobId -> $status")

        } catch (e: Exception) {
            Log.e(TAG, "Error sending job status", e)
        }
    }

    /**
     * Send job result
     */
    private fun sendJobResult(job: Job) {
        try {
            val resultData = JSONObject().apply {
                put("job_id", job.id)
                put("status", job.status.value)
                put("result", gson.toJson(job.result))
                put("timestamp", System.currentTimeMillis())
            }

            socket?.emit("job:result", resultData)
            Log.d(TAG, "Job result sent: ${job.id}")

        } catch (e: Exception) {
            Log.e(TAG, "Error sending job result", e)
        }
    }

    /**
     * Send job error
     */
    private fun sendJobError(jobId: String, error: String) {
        try {
            val errorData = JSONObject().apply {
                put("job_id", jobId)
                put("error", error)
                put("timestamp", System.currentTimeMillis())
            }

            socket?.emit("job:error", errorData)
            Log.d(TAG, "Job error sent: $jobId")

        } catch (e: Exception) {
            Log.e(TAG, "Error sending job error", e)
        }
    }

    /**
     * Notify connection error
     */
    private fun notifyConnectionError(error: String) {
        scope.launch(Dispatchers.Main) {
            jobListeners.forEach { it.onConnectionError(error) }
        }
    }

    /**
     * Get current status
     */
    fun getStatus(): SocketStatus {
        return SocketStatus(
            connected = isConnected.get(),
            serverUrl = serverUrl,
            queuedJobs = jobQueue.size,
            executingJobs = executingJobs.size
        )
    }

    /**
     * Shutdown manager
     */
    fun shutdown() {
        disconnect()
        scope.cancel()
        jobListeners.clear()
        jobQueue.clear()
        executingJobs.clear()
        Log.i(TAG, "SocketJobManager shutdown")
    }
}

/**
 * Job data model
 */
data class Job(
    @SerializedName("id")
    val id: String,

    @SerializedName("type")
    val type: String,

    @SerializedName("priority")
    val priority: JobPriority = JobPriority.NORMAL,

    @SerializedName("action_config_url")
    val actionConfigUrl: String,

    @SerializedName("params")
    val params: Map<String, Any>? = null,

    @SerializedName("timeout")
    val timeout: Long = 30000,

    @SerializedName("retry")
    val retry: Int = 0,

    @SerializedName("created_at")
    val createdAt: Long = System.currentTimeMillis(),

    var status: JobStatus = JobStatus.QUEUED,
    var result: JobResult? = null
)

/**
 * Job priority
 */
enum class JobPriority(val value: String) {
    @SerializedName("immediate")
    IMMEDIATE("immediate"),

    @SerializedName("high")
    HIGH("high"),

    @SerializedName("normal")
    NORMAL("normal"),

    @SerializedName("low")
    LOW("low")
}

/**
 * Job status
 */
enum class JobStatus(val value: String) {
    QUEUED("queued"),
    EXECUTING("executing"),
    PAUSED("paused"),
    COMPLETED("completed"),
    FAILED("failed"),
    CANCELLED("cancelled")
}

/**
 * Job result
 */
data class JobResult(
    val success: Boolean,
    val message: String,
    val data: Map<String, Any>? = null,
    val error: String? = null,
    val executionTime: Long = 0,
    val timestamp: Long = System.currentTimeMillis()
)

/**
 * Socket status
 */
data class SocketStatus(
    val connected: Boolean,
    val serverUrl: String?,
    val queuedJobs: Int,
    val executingJobs: Int
)

/**
 * Job listener interface
 */
interface JobListener {
    fun onConnected()
    fun onDisconnected()
    fun onConnectionError(error: String)
    fun onJobReceived(job: Job)
    fun onJobStarted(job: Job)
    fun onJobCompleted(job: Job, result: JobResult)
    fun onJobFailed(job: Job, error: String)
    fun onJobCancelled(jobId: String)
    fun onConfigUpdate(config: String)
}
