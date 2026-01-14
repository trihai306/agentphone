package com.agent.portal.socket

import android.content.Context
import android.util.Log
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import com.pusher.client.Pusher
import com.pusher.client.PusherOptions
import com.pusher.client.channel.Channel
import com.pusher.client.channel.PresenceChannel
import com.pusher.client.channel.PresenceChannelEventListener
import com.pusher.client.channel.PusherEvent
import com.pusher.client.channel.SubscriptionEventListener
import com.pusher.client.channel.User
import com.pusher.client.util.HttpChannelAuthorizer
import com.pusher.client.connection.ConnectionEventListener
import com.pusher.client.connection.ConnectionState
import com.pusher.client.connection.ConnectionStateChange
import kotlinx.coroutines.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import java.lang.ref.WeakReference
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicBoolean

/**
 * WebSocket Manager using Pusher for receiving and executing jobs from server
 *
 * Architecture:
 * Soketi (Pusher Protocol) → Pusher Client → JobQueue → JobExecutor → Device Actions
 *
 * Features:
 * - Real-time job receiving via Pusher WebSocket
 * - Job queue management with priorities
 * - Job execution with status reporting
 * - Auto-reconnect on disconnect
 * - Channel-based pub/sub model
 */
object SocketJobManager {

    private const val TAG = "SocketJobManager"

    // Pusher connection
    private var pusher: Pusher? = null
    private var deviceChannel: Channel? = null
    private var presenceChannel: PresenceChannel? = null
    private var appKey: String? = null
    private var host: String? = null
    private var port: Int = 6001
    private var encrypted: Boolean = false
    private val isConnected = AtomicBoolean(false)

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

    // Device ID for channel subscription
    private var deviceId: String? = null
    private var userId: String? = null
    private var deviceDbId: Int? = null
    private var authToken: String? = null

    /**
     * Initialize Pusher manager
     */
    fun init(context: Context, appKey: String, host: String, port: Int = 6001, encrypted: Boolean = false) {
        contextRef = WeakReference(context.applicationContext)
        this.appKey = appKey
        this.host = host
        this.port = port
        this.encrypted = encrypted
        
        // Get device ID for channel subscription
        this.deviceId = android.provider.Settings.Secure.getString(
            context.contentResolver,
            android.provider.Settings.Secure.ANDROID_ID
        )
        
        // Load user session for presence auth
        val sessionManager = com.agent.portal.auth.SessionManager(context)
        val session = sessionManager.getSession()
        this.userId = session?.userId?.toString()
        this.authToken = session?.token
        
        Log.i(TAG, "SocketJobManager initialized - Host: $host:$port, Device: $deviceId, User: $userId")
    }

    /**
     * Connect to Pusher server
     */
    fun connect() {
        if (appKey == null || host == null) {
            Log.e(TAG, "AppKey or Host not set. Call init() first.")
            return
        }

        if (isConnected.get()) {
            Log.w(TAG, "Already connected")
            return
        }

        scope.launch {
            try {
                Log.i(TAG, "Connecting to Pusher: $host:$port")

                // Configure auth endpoint for presence channels
                val authUrl = if (com.agent.portal.utils.NetworkUtils.isEmulator()) {
                    "http://10.0.2.2:8000/api/pusher/auth"
                } else {
                    // Use same base URL as API calls for physical devices
                    "${com.agent.portal.utils.NetworkUtils.getApiBaseUrl()}/pusher/auth"
                }
                
                val authorizer = HttpChannelAuthorizer(authUrl)
                // Add auth headers
                authToken?.let { token ->
                    authorizer.setHeaders(mapOf(
                        "Authorization" to "Bearer $token",
                        "Accept" to "application/json",
                        "Content-Type" to "application/x-www-form-urlencoded"
                    ))
                }

                val options = PusherOptions().apply {
                    setCluster("") // Empty for self-hosted
                    setHost(host)
                    setWsPort(port)
                    setWssPort(port)
                    isEncrypted = this@SocketJobManager.encrypted
                    setChannelAuthorizer(authorizer)
                }

                pusher = Pusher(appKey, options)

                // Set connection event listener
                pusher?.connection?.bind(ConnectionState.ALL, object : ConnectionEventListener {
                    override fun onConnectionStateChange(change: ConnectionStateChange) {
                        Log.d(TAG, "Connection state: ${change.previousState} → ${change.currentState}")
                        
                        when (change.currentState) {
                            ConnectionState.CONNECTED -> {
                                isConnected.set(true)
                                onConnected()
                            }
                            ConnectionState.DISCONNECTED -> {
                                isConnected.set(false)
                                onDisconnected()
                            }
                            else -> {}
                        }
                    }

                    override fun onError(message: String, code: String?, e: Exception?) {
                        Log.e(TAG, "Connection error: $message (code: $code)", e)
                        onConnectionError(message)
                    }
                })

                // Connect
                pusher?.connect()

                // Subscribe to device channel
                subscribeToDeviceChannel()

                Log.i(TAG, "✅ Pusher connection initiated")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to connect", e)
                notifyConnectionError(e.message ?: "Unknown error")
            }
        }
    }

    /**
     * Subscribe to presence channel for device tracking
     * This enables real-time online/offline status via Soketi webhooks
     */
    private fun subscribeToDeviceChannel() {
        if (deviceId == null || userId == null) {
            Log.w(TAG, "Device ID or User ID not set, cannot subscribe to presence channel")
            // Fall back to private channel
            subscribeToPrivateChannel()
            return
        }

        // Subscribe to presence channel: presence-devices.{user_id}
        val presenceChannelName = "presence-devices.$userId"
        Log.i(TAG, "Subscribing to presence channel: $presenceChannelName")

        try {
            presenceChannel = pusher?.subscribePresence(presenceChannelName, object : PresenceChannelEventListener {
                override fun onSubscriptionSucceeded(channelName: String) {
                    Log.i(TAG, "✅ Subscribed to presence channel: $channelName")
                }

                override fun onAuthenticationFailure(message: String, e: Exception?) {
                    Log.e(TAG, "❌ Presence auth failed: $message", e)
                    // Fall back to private channel
                    subscribeToPrivateChannel()
                }

                override fun onUsersInformationReceived(channelName: String, users: MutableSet<User>?) {
                    Log.i(TAG, "Users in channel $channelName: ${users?.size ?: 0}")
                }

                override fun userSubscribed(channelName: String, user: User) {
                    Log.i(TAG, "User joined: ${user.id} in $channelName")
                }

                override fun userUnsubscribed(channelName: String, user: User) {
                    Log.i(TAG, "User left: ${user.id} from $channelName")
                }

                override fun onEvent(event: PusherEvent) {
                    // Handle events on presence channel
                    when (event.eventName) {
                        "job:new" -> handleNewJob(event.data)
                        "job:cancel" -> handleCancelJob(event.data)
                        "job:pause" -> handlePauseJob(event.data)
                        "job:resume" -> handleResumeJob(event.data)
                        "config:update" -> handleConfigUpdate(event.data)
                    }
                }
            })

            Log.i(TAG, "Presence channel subscription initiated")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to subscribe to presence channel", e)
            subscribeToPrivateChannel()
        }

        // Also subscribe to device-specific private channel for direct commands
        subscribeToPrivateChannel()
    }

    /**
     * Subscribe to private device channel for direct commands
     */
    private fun subscribeToPrivateChannel() {
        if (deviceId == null) return

        // Use private-device.{id} format to match Laravel PrivateChannel('device.{id}')
        val channelName = "private-device.$deviceId"
        Log.i(TAG, "Subscribing to private channel: $channelName")

        deviceChannel = pusher?.subscribePrivate(channelName, object : com.pusher.client.channel.PrivateChannelEventListener {
            override fun onSubscriptionSucceeded(channelName: String) {
                Log.i(TAG, "✅ Private channel subscribed successfully: $channelName")
            }
            override fun onAuthenticationFailure(message: String?, e: Exception?) {
                Log.e(TAG, "❌ Private channel auth FAILED: $message", e)
            }
            override fun onEvent(event: PusherEvent) {
                Log.i(TAG, "📥 Private channel event: ${event.eventName} - ${event.data}")
                // Route events to handlers
                when (event.eventName) {
                    "job:new" -> handleNewJob(event.data)
                    "job:cancel" -> handleCancelJob(event.data)
                    "job:pause" -> handlePauseJob(event.data)
                    "job:resume" -> handleResumeJob(event.data)
                    "config:update" -> handleConfigUpdate(event.data)
                    "recording.stop_requested" -> handleRecordingStopRequested(event.data)
                    "workflow:test" -> {
                        Log.i(TAG, "🧪 Received workflow:test event!")
                        handleWorkflowTest(event.data)
                    }
                }
            }
        })

        // Bind to job events - use PrivateChannelEventListener for private channels
        deviceChannel?.bind("job:new", object : com.pusher.client.channel.PrivateChannelEventListener {
            override fun onEvent(event: PusherEvent) {
                handleNewJob(event.data)
            }
            override fun onSubscriptionSucceeded(channelName: String) {
                Log.i(TAG, "Private channel subscribed: $channelName")
            }
            override fun onAuthenticationFailure(message: String?, e: Exception?) {
                Log.e(TAG, "Auth failed for private channel: $message", e)
            }
        })

        deviceChannel?.bind("job:cancel", object : com.pusher.client.channel.PrivateChannelEventListener {
            override fun onEvent(event: PusherEvent) {
                handleCancelJob(event.data)
            }
            override fun onSubscriptionSucceeded(channelName: String) {}
            override fun onAuthenticationFailure(message: String?, e: Exception?) {}
        })

        deviceChannel?.bind("job:pause", object : com.pusher.client.channel.PrivateChannelEventListener {
            override fun onEvent(event: PusherEvent) {
                handlePauseJob(event.data)
            }
            override fun onSubscriptionSucceeded(channelName: String) {}
            override fun onAuthenticationFailure(message: String?, e: Exception?) {}
        })

        deviceChannel?.bind("job:resume", object : com.pusher.client.channel.PrivateChannelEventListener {
            override fun onEvent(event: PusherEvent) {
                handleResumeJob(event.data)
            }
            override fun onSubscriptionSucceeded(channelName: String) {}
            override fun onAuthenticationFailure(message: String?, e: Exception?) {}
        })

        deviceChannel?.bind("config:update", object : com.pusher.client.channel.PrivateChannelEventListener {
            override fun onEvent(event: PusherEvent) {
                handleConfigUpdate(event.data)
            }
            override fun onSubscriptionSucceeded(channelName: String) {}
            override fun onAuthenticationFailure(message: String?, e: Exception?) {}
        })

        // Listen for recording stop command from web
        deviceChannel?.bind("recording.stop_requested", object : com.pusher.client.channel.PrivateChannelEventListener {
            override fun onEvent(event: PusherEvent) {
                handleRecordingStopRequested(event.data)
            }
            override fun onSubscriptionSucceeded(channelName: String) {}
            override fun onAuthenticationFailure(message: String?, e: Exception?) {}
        })

        // Listen for workflow test run command from web (quick test without job creation)
        deviceChannel?.bind("workflow:test", object : com.pusher.client.channel.PrivateChannelEventListener {
            override fun onEvent(event: PusherEvent) {
                Log.i(TAG, "🧪 Received workflow:test event")
                handleWorkflowTest(event.data)
            }
            override fun onSubscriptionSucceeded(channelName: String) {}
            override fun onAuthenticationFailure(message: String?, e: Exception?) {}
        })

        Log.i(TAG, "Private channel subscription complete")
    }

    /**
     * Disconnect from Pusher server
     */
    fun disconnect() {
        scope.launch {
            try {
                // Unsubscribe from channel (automatically unbinds all events)
                if (deviceId != null) {
                    pusher?.unsubscribe("private-device.$deviceId")
                }
                deviceChannel = null
                
                // Disconnect from Pusher
                pusher?.disconnect()
                pusher = null
                isConnected.set(false)
                Log.i(TAG, "Disconnected from Pusher")
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

    /**
     * Publish custom event to Laravel backend via HTTP API
     * 
     * @param eventName Event name (e.g., "recording:started")
     * @param data Event data as Map
     */
    fun publishEvent(eventName: String, data: Map<String, Any>) {
        scope.launch {
            try {
                val context = contextRef?.get() ?: run {
                    Log.w(TAG, "Context not available, cannot publish event")
                    return@launch
                }
                
                // Add device context to event data
                val enrichedData = data.toMutableMap().apply {
                    put("device_id", deviceId ?: "unknown")
                    put("event", eventName)
                    put("timestamp", System.currentTimeMillis())
                }

                // Get auth token
                val sessionManager = com.agent.portal.auth.SessionManager(context)
                val session = sessionManager.getSession()
                val token = session?.token
                
                if (token == null) {
                    Log.w(TAG, "No auth token, cannot publish event")
                    return@launch
                }

                // Determine API URL
                val apiUrl = if (com.agent.portal.utils.NetworkUtils.isEmulator()) {
                    "http://10.0.2.2:8000/api"
                } else {
                    "https://laravel-backend.test/api"
                }

                // Send HTTP POST request
                val client = okhttp3.OkHttpClient()
                val json = gson.toJson(enrichedData)
                val requestBody = okhttp3.RequestBody.create(
                    "application/json".toMediaTypeOrNull(),
                    json
                )

                val request = okhttp3.Request.Builder()
                    .url("$apiUrl/notifications/recording-events")
                    .post(requestBody)
                    .addHeader("Authorization", "Bearer $token")
                    .addHeader("Content-Type", "application/json")
                    .addHeader("Accept", "application/json")
                    .build()

                val response = client.newCall(request).execute()
                
                if (response.isSuccessful) {
                    Log.i(TAG, "📤 Published event: $eventName")
                } else {
                    Log.w(TAG, "Failed to publish event: ${response.code}")
                }
                
                response.close()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to publish event '$eventName'", e)
            }
        }
    }

    /**
     * Publish individual action event during recording for real-time Flow Editor sync
     * 
     * @param sessionId Recording session ID
     * @param event The recorded event with all details
     */
    fun publishActionEvent(sessionId: String, event: com.agent.portal.recording.RecordedEvent) {
        scope.launch {
            try {
                val context = contextRef?.get() ?: run {
                    Log.w(TAG, "Context not available, cannot publish action event")
                    return@launch
                }

                // Get auth token
                val sessionManager = com.agent.portal.auth.SessionManager(context)
                val session = sessionManager.getSession()
                val token = session?.token

                if (token == null) {
                    Log.w(TAG, "No auth token, cannot publish action event")
                    return@launch
                }

                // Determine API URL
                val apiUrl = if (com.agent.portal.utils.NetworkUtils.isEmulator()) {
                    "http://10.0.2.2:8000/api"
                } else {
                    "https://laravel-backend.test/api"
                }

                // Build action event data
                val actionData = mapOf(
                    "device_id" to (deviceId ?: "unknown"),
                    "session_id" to sessionId,
                    "event_type" to event.eventType,
                    "sequence_number" to event.sequenceNumber,
                    "timestamp" to event.timestamp,
                    "package_name" to event.packageName,
                    "class_name" to event.className,
                    "resource_id" to event.resourceId,
                    "content_description" to event.contentDescription,
                    "text" to event.text,
                    "bounds" to event.bounds,
                    "x" to (event.x ?: 0),
                    "y" to (event.y ?: 0),
                    "is_clickable" to event.isClickable,
                    "is_editable" to event.isEditable,
                    "is_scrollable" to event.isScrollable
                )

                // Send HTTP POST request
                val client = okhttp3.OkHttpClient()
                val json = gson.toJson(actionData)
                val requestBody = okhttp3.RequestBody.create(
                    "application/json".toMediaTypeOrNull(),
                    json
                )

                val request = okhttp3.Request.Builder()
                    .url("$apiUrl/notifications/recording-actions")
                    .post(requestBody)
                    .addHeader("Authorization", "Bearer $token")
                    .addHeader("Content-Type", "application/json")
                    .addHeader("Accept", "application/json")
                    .build()

                val response = client.newCall(request).execute()

                if (response.isSuccessful) {
                    Log.d(TAG, "📤 Published action: ${event.eventType} #${event.sequenceNumber}")
                } else {
                    Log.w(TAG, "Failed to publish action: ${response.code}")
                }

                response.close()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to publish action event", e)
            }
        }
    }

    // ================================================================================
    // Event Handlers
    // ================================================================================

    private fun onConnected() {
        Log.i(TAG, "✓ Connected to Pusher server")

        // Notify backend that device is online
        notifyDeviceStatus("online")

        scope.launch(Dispatchers.Main) {
            jobListeners.forEach { it.onConnected() }
        }
    }

    private fun onDisconnected() {
        Log.w(TAG, "✗ Disconnected from Pusher server")

        // Notify backend that device is offline
        notifyDeviceStatus("offline")

        scope.launch(Dispatchers.Main) {
            jobListeners.forEach { it.onDisconnected() }
        }
    }

    private fun onConnectionError(error: String) {
        Log.e(TAG, "Connection error: $error")

        scope.launch(Dispatchers.Main) {
            jobListeners.forEach { it.onConnectionError(error) }
        }
    }

    /**
     * Notify Laravel backend about device online/offline status
     */
    private fun notifyDeviceStatus(status: String) {
        scope.launch {
            try {
                val context = contextRef?.get() ?: return@launch
                
                val sessionManager = com.agent.portal.auth.SessionManager(context)
                val session = sessionManager.getSession()
                val token = session?.token ?: return@launch

                val apiUrl = if (com.agent.portal.utils.NetworkUtils.isEmulator()) {
                    "http://10.0.2.2:8000/api"
                } else {
                    "https://laravel-backend.test/api"
                }

                val payload = mapOf(
                    "device_id" to (deviceId ?: "unknown"),
                    "status" to status,
                    "socket_connected" to (status == "online"),
                    "timestamp" to System.currentTimeMillis()
                )

                val client = okhttp3.OkHttpClient()
                val json = gson.toJson(payload)
                val requestBody = okhttp3.RequestBody.create(
                    "application/json".toMediaTypeOrNull(),
                    json
                )

                val request = okhttp3.Request.Builder()
                    .url("$apiUrl/devices/status")
                    .post(requestBody)
                    .addHeader("Authorization", "Bearer $token")
                    .addHeader("Content-Type", "application/json")
                    .addHeader("Accept", "application/json")
                    .build()

                val response = client.newCall(request).execute()
                
                if (response.isSuccessful) {
                    Log.i(TAG, "📡 Device status updated: $status")
                } else {
                    Log.w(TAG, "Failed to update device status: ${response.code}")
                }
                
                response.close()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to notify device status", e)
            }
        }
    }

    /**
     * Handle new job received from server
     */
    private fun handleNewJob(data: String) {
        try {
            val job = gson.fromJson(data, Job::class.java)

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
        }
    }

    /**
     * Handle job cancellation
     */
    private fun handleCancelJob(data: String) {
        try {
            val json = gson.fromJson(data, Map::class.java)
            val jobId = json["job_id"] as? String ?: return

            Log.i(TAG, "🚫 Cancel job: $jobId")

            // Remove from queue
            jobQueue.remove(jobId)

            // Cancel if executing
            executingJobs[jobId]?.let { job ->
                job.status = JobStatus.CANCELLED
                executingJobs.remove(jobId)
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
    private fun handlePauseJob(data: String) {
        try {
            val json = gson.fromJson(data, Map::class.java)
            val jobId = json["job_id"] as? String ?: return

            executingJobs[jobId]?.let { job ->
                job.status = JobStatus.PAUSED
                Log.i(TAG, "⏸ Paused job: $jobId")
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error pausing job", e)
        }
    }

    /**
     * Handle job resume
     */
    private fun handleResumeJob(data: String) {
        try {
            val json = gson.fromJson(data, Map::class.java)
            val jobId = json["job_id"] as? String ?: return

            executingJobs[jobId]?.let { job ->
                job.status = JobStatus.EXECUTING
                Log.i(TAG, "▶️ Resumed job: $jobId")
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error resuming job", e)
        }
    }

    /**
     * Handle config update from server
     */
    private fun handleConfigUpdate(data: String) {
        try {
            Log.i(TAG, "⚙️ Config update received")

            scope.launch(Dispatchers.Main) {
                jobListeners.forEach { it.onConfigUpdate(data) }
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error processing config update", e)
        }
    }

    /**
     * Handle recording stop request from web
     * This is triggered when user clicks Stop on Flow Editor
     */
    private fun handleRecordingStopRequested(data: String) {
        try {
            Log.i(TAG, "⏹️ Recording stop requested from web")
            
            // Parse session data
            val json = gson.fromJson(data, Map::class.java)
            val sessionId = json["session"]?.let { 
                (it as? Map<*, *>)?.get("session_id") as? String 
            }
            
            Log.i(TAG, "Stopping recording session: $sessionId")
            
            // Stop recording via RecordingManager
            val result = com.agent.portal.recording.RecordingManager.stopRecording()
            
            if (result.success) {
                Log.i(TAG, "✅ Recording stopped successfully from web command")
            } else {
                Log.w(TAG, "Recording stop failed: ${result.message}")
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error handling recording stop request", e)
        }
    }

    /**
     * Handle workflow test run from web Flow Editor
     * This executes actions directly without creating a formal WorkflowJob
     * STOPS on first error and reports progress back to frontend
     */
    private fun handleWorkflowTest(data: String) {
        try {
            Log.i(TAG, "🧪 Workflow test run received from web")
            
            // Parse test run payload
            val json = gson.fromJson(data, Map::class.java)
            val flowId = (json["flow_id"] as? Number)?.toInt() ?: 0
            val flowName = json["flow_name"] as? String ?: "Test Workflow"
            val actionsRaw = json["actions"] as? List<*> ?: emptyList<Any>()
            
            Log.i(TAG, "Test run: flowId=$flowId, flowName=$flowName, actions=${actionsRaw.size}")
            
            if (actionsRaw.isEmpty()) {
                Log.w(TAG, "No actions in test run payload")
                return
            }
            
            val context = contextRef?.get() ?: run {
                Log.e(TAG, "Context not available for test run")
                return
            }
            
            // Execute actions in background
            scope.launch {
                try {
                    val executor = JobExecutor(context)
                    
                    Log.i(TAG, "🚀 Starting test run with ${actionsRaw.size} actions")
                    var successCount = 0
                    var failedAction: String? = null
                    var failReason: String? = null
                    
                    for ((index, action) in actionsRaw.withIndex()) {
                        val actionMap = action as? Map<*, *> ?: continue
                        val actionType = actionMap["type"] as? String ?: continue
                        val actionId = actionMap["id"] as? String ?: "action_$index"
                        
                        // Extract params and convert to proper Map<String, Any>
                        @Suppress("UNCHECKED_CAST")
                        val params = (actionMap["params"] as? Map<String, Any>) ?: emptyMap()
                        val waitAfter = (actionMap["wait_after"] as? Number)?.toLong() ?: 500L
                        
                        Log.i(TAG, "  [${index + 1}/${actionsRaw.size}] Executing: $actionType (wait_after=${waitAfter}ms)")
                        
                        // Log params for debugging
                        val resourceId = params["resourceId"]
                        val contentDesc = params["contentDescription"]
                        val text = params["text"]
                        val x = params["x"]
                        val y = params["y"]
                        Log.d(TAG, "    Params: resourceId=$resourceId, contentDesc=$contentDesc, text=${text?.toString()?.take(30)}, x=$x, y=$y")
                        
                        try {
                            val result = executor.executeTestAction(actionType, params)
                            if (result.success) {
                                Log.i(TAG, "  ✓ Action $actionType completed via ${result.data?.get("method") ?: "unknown"}")
                                successCount++
                            } else {
                                // STOP on error
                                failedAction = actionType
                                failReason = result.message ?: result.error ?: "Unknown error"
                                Log.e(TAG, "  ✗ Action $actionType FAILED: $failReason")
                                Log.e(TAG, "  ⛔ STOPPING workflow due to error")
                                break
                            }
                            
                            // Wait between actions
                            if (waitAfter > 0) {
                                delay(waitAfter)
                            }
                        } catch (e: Exception) {
                            failedAction = actionType
                            failReason = e.message ?: "Exception occurred"
                            Log.e(TAG, "  ✗ Action $actionType EXCEPTION: ${e.message}")
                            Log.e(TAG, "  ⛔ STOPPING workflow due to error")
                            break
                        }
                    }
                    
                    // Final summary
                    if (failedAction != null) {
                        Log.e(TAG, "❌ Test run FAILED: $flowName")
                        Log.e(TAG, "   Completed: $successCount/${actionsRaw.size} actions")
                        Log.e(TAG, "   Failed at: $failedAction")
                        Log.e(TAG, "   Reason: $failReason")
                    } else {
                        Log.i(TAG, "✅ Test run completed: $flowName ($successCount/${actionsRaw.size} actions)")
                    }
                    
                } catch (e: Exception) {
                    Log.e(TAG, "Test run failed", e)
                }
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error handling workflow test", e)
        }
    }

    // ================================================================================
    // Job Execution (same as before)
    // ================================================================================

    private fun executeJobImmediately(job: Job) {
        scope.launch {
            executeJob(job)
        }
    }

    private fun enqueueJob(job: Job) {
        scope.launch {
            delay(100)
            executeJob(job)
        }
    }

    private suspend fun executeJob(job: Job) {
        val context = contextRef?.get() ?: return

        try {
            Log.i(TAG, "🚀 Executing job: ${job.id}")

            job.status = JobStatus.EXECUTING
            executingJobs[job.id] = job

            withContext(Dispatchers.Main) {
                jobListeners.forEach { it.onJobStarted(job) }
            }

            val actionConfig = JobActionAPI.fetchActionConfig(context, job.actionConfigUrl)

            if (actionConfig == null) {
                throw Exception("Failed to fetch action configuration")
            }

            val executor = JobExecutor(context)
            val result = executor.execute(job, actionConfig)

            job.status = if (result.success) JobStatus.COMPLETED else JobStatus.FAILED
            job.result = result

            executingJobs.remove(job.id)
            jobQueue.remove(job.id)

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

            withContext(Dispatchers.Main) {
                jobListeners.forEach { it.onJobFailed(job, e.message ?: "Unknown error") }
            }
        }
    }

    private fun notifyConnectionError(error: String) {
        scope.launch(Dispatchers.Main) {
            jobListeners.forEach { it.onConnectionError(error) }
        }
    }

    fun getStatus(): SocketStatus {
        return SocketStatus(
            connected = isConnected.get(),
            serverUrl = "$host:$port",
            queuedJobs = jobQueue.size,
            executingJobs = executingJobs.size
        )
    }

    fun shutdown() {
        disconnect()
        scope.cancel()
        jobListeners.clear()
        jobQueue.clear()
        executingJobs.clear()
        Log.i(TAG, "SocketJobManager shutdown")
    }
}

// Data models remain the same
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

enum class JobStatus(val value: String) {
    QUEUED("queued"),
    EXECUTING("executing"),
    PAUSED("paused"),
    COMPLETED("completed"),
    FAILED("failed"),
    CANCELLED("cancelled")
}

data class JobResult(
    val success: Boolean,
    val message: String,
    val data: Map<String, Any>? = null,
    val error: String? = null,
    val executionTime: Long = 0,
    val timestamp: Long = System.currentTimeMillis()
)

data class SocketStatus(
    val connected: Boolean,
    val serverUrl: String?,
    val queuedJobs: Int,
    val executingJobs: Int
)

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
