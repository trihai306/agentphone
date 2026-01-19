package com.agent.portal.socket

import android.content.Context
import android.util.Log
import com.agent.portal.overlay.FloatingJobProgressService
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
    
    // Auto-reconnect
    private var reconnectAttempts = 0
    private val maxReconnectAttempts = 10
    private var isIntentionalDisconnect = false
    private var reconnectJob: kotlinx.coroutines.Job? = null

    // Accessibility status check
    private var accessibilityCheckJob: kotlinx.coroutines.Job? = null
    private var lastAccessibilityStatus: Boolean? = null

    // Job management
    private val jobQueue = ConcurrentHashMap<String, Job>()
    private val executingJobs = ConcurrentHashMap<String, Job>()
    
    // Sequential execution - only one job at a time
    private val executionMutex = kotlinx.coroutines.sync.Mutex()
    private val pendingJobQueue = java.util.concurrent.LinkedBlockingQueue<Job>()

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
        
        // Get unique device ID from SharedPreferences (set during registration)
        // Falls back to ANDROID_ID + random suffix if not set
        val prefs = context.getSharedPreferences("portal_device", Context.MODE_PRIVATE)
        this.deviceId = prefs.getString("unique_device_id", null) ?: run {
            val androidId = android.provider.Settings.Secure.getString(
                context.contentResolver,
                android.provider.Settings.Secure.ANDROID_ID
            )
            val uniqueSuffix = java.util.UUID.randomUUID().toString().take(8)
            val newDeviceId = "${androidId}_$uniqueSuffix"
            prefs.edit().putString("unique_device_id", newDeviceId).apply()
            newDeviceId
        }
        
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
                
                // Refresh auth token from session (may have changed since init)
                val context = contextRef?.get()
                if (context != null) {
                    val sessionManager = com.agent.portal.auth.SessionManager(context)
                    val session = sessionManager.getSession()
                    this@SocketJobManager.authToken = session?.token
                    this@SocketJobManager.userId = session?.userId?.toString()
                    Log.d(TAG, "Auth token refreshed: ${authToken?.take(20) ?: "null"}...")
                }
                
                val authorizer = HttpChannelAuthorizer(authUrl)
                // Add auth headers
                if (authToken != null) {
                    authorizer.setHeaders(mapOf(
                        "Authorization" to "Bearer $authToken",
                        "Accept" to "application/json",
                        "Content-Type" to "application/x-www-form-urlencoded"
                    ))
                    Log.i(TAG, "✓ Auth header set for Pusher authorizer")
                } else {
                    Log.w(TAG, "⚠️ No auth token available for Pusher auth!")
                }

                val options = PusherOptions().apply {
                    setCluster("") // Empty for self-hosted
                    setHost(host)
                    setWsPort(port)
                    setWssPort(port)
                    isEncrypted = this@SocketJobManager.encrypted
                    setChannelAuthorizer(authorizer)
                    // Increase activity timeout to prevent frequent disconnections
                    setActivityTimeout(300000) // 5 minutes instead of default 2 minutes
                    setPongTimeout(30000) // 30 seconds for pong response
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
                    // Log ALL events received on presence channel for debugging
                    Log.d(TAG, "📥 Presence channel event: ${event.eventName}, data: ${event.data}")

                    // Handle events on presence channel
                    when (event.eventName) {
                        "job:new" -> handleNewJob(event.data)
                        "job:cancel" -> handleCancelJob(event.data)
                        "job:pause" -> handlePauseJob(event.data)
                        "job:resume" -> handleResumeJob(event.data)
                        "config:update" -> handleConfigUpdate(event.data)
                        "inspect:elements" -> {
                            Log.i(TAG, "🔍 Received inspect:elements request via presence channel")
                            handleInspectElements(event.data)
                        }
                        "visual:inspect" -> {
                            Log.i(TAG, "👁️ Received visual:inspect request via presence channel")
                            handleVisualInspect(event.data)
                        }
                        "command:quick_action" -> {
                            Log.i(TAG, "⚡ Received command:quick_action via presence channel")
                            handleQuickAction(event.data)
                        }
                        else -> {
                            Log.w(TAG, "⚠️ Unhandled event on presence channel: ${event.eventName}")
                        }
                    }
                }
            })

            // Bind specific events to presence channel
            presenceChannel?.bind("inspect:elements", object : PresenceChannelEventListener {
                override fun onEvent(event: PusherEvent) {
                    Log.i(TAG, "🔍 Received inspect:elements request via presence channel (direct bind)")
                    handleInspectElements(event.data)
                }
                override fun onSubscriptionSucceeded(channelName: String) {}
                override fun onAuthenticationFailure(message: String?, e: Exception?) {}
                override fun onUsersInformationReceived(channelName: String, users: MutableSet<User>?) {}
                override fun userSubscribed(channelName: String, user: User) {}
                override fun userUnsubscribed(channelName: String, user: User) {}
            })

            // Bind visual:inspect for OCR text detection
            presenceChannel?.bind("visual:inspect", object : PresenceChannelEventListener {
                override fun onEvent(event: PusherEvent) {
                    Log.i(TAG, "👁️ Received visual:inspect request via presence channel (direct bind)")
                    handleVisualInspect(event.data)
                }
                override fun onSubscriptionSucceeded(channelName: String) {}
                override fun onAuthenticationFailure(message: String?, e: Exception?) {}
                override fun onUsersInformationReceived(channelName: String, users: MutableSet<User>?) {}
                override fun userSubscribed(channelName: String, user: User) {}
                override fun userUnsubscribed(channelName: String, user: User) {}
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

        // Listen for element inspection request from web (Element Inspector feature)
        deviceChannel?.bind("inspect:elements", object : com.pusher.client.channel.PrivateChannelEventListener {
            override fun onEvent(event: PusherEvent) {
                Log.i(TAG, "🔍 Received inspect:elements request")
                handleInspectElements(event.data)
            }
            override fun onSubscriptionSucceeded(channelName: String) {}
            override fun onAuthenticationFailure(message: String?, e: Exception?) {}
        })

        // Listen for accessibility check request from web (when user selects device)
        deviceChannel?.bind("check:accessibility", object : com.pusher.client.channel.PrivateChannelEventListener {
            override fun onEvent(event: PusherEvent) {
                Log.i(TAG, "🔍 Received check:accessibility request")
                handleCheckAccessibility(event.data)
            }
            override fun onSubscriptionSucceeded(channelName: String) {}
            override fun onAuthenticationFailure(message: String?, e: Exception?) {}
        })

        // Listen for visual inspection request from web (OCR-based text detection)
        deviceChannel?.bind("visual:inspect", object : com.pusher.client.channel.PrivateChannelEventListener {
            override fun onEvent(event: PusherEvent) {
                Log.i(TAG, "👁️ Received visual:inspect request (OCR mode)")
                handleVisualInspect(event.data)
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
        isIntentionalDisconnect = true
        reconnectJob?.cancel()
        reconnectJob = null
        
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
                Log.i(TAG, "Disconnected from Pusher (intentional)")
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
     * Now includes screenshot capture for better visual debugging
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

                // Capture screenshot asynchronously
                val accessibilityService = com.agent.portal.accessibility.PortalAccessibilityService.instance
                
                // Create a suspend function to await screenshot
                val screenshotBase64 = kotlinx.coroutines.suspendCancellableCoroutine<String?> { continuation ->
                    if (accessibilityService != null) {
                        accessibilityService.takeScreenshot { bitmap ->
                            if (bitmap != null) {
                                try {
                                    val outputStream = java.io.ByteArrayOutputStream()
                                    // Scale down for smaller payload (25% of original)
                                    val scaledBitmap = android.graphics.Bitmap.createScaledBitmap(
                                        bitmap,
                                        (bitmap.width * 0.25).toInt(),
                                        (bitmap.height * 0.25).toInt(),
                                        true
                                    )
                                    scaledBitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 60, outputStream)
                                    val byteArray = outputStream.toByteArray()
                                    val base64 = android.util.Base64.encodeToString(byteArray, android.util.Base64.NO_WRAP)
                                    
                                    // Clean up
                                    if (scaledBitmap != bitmap) {
                                        scaledBitmap.recycle()
                                    }
                                    bitmap.recycle()
                                    
                                    continuation.resume(base64, null)
                                } catch (e: Exception) {
                                    Log.e(TAG, "Failed to encode screenshot", e)
                                    continuation.resume(null, null)
                                }
                            } else {
                                continuation.resume(null, null)
                            }
                        }
                    } else {
                        continuation.resume(null, null)
                    }
                }

                // Build action event data with ALL element details + screenshot
                val actionData = mutableMapOf<String, Any?>(
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
                    "is_scrollable" to event.isScrollable,
                    // Additional element details
                    "app_name" to event.appName,
                    "relative_timestamp" to event.relativeTimestamp,
                    "screenshot_path" to event.screenshotPath,
                    // Screenshot base64 data
                    "screenshot" to screenshotBase64,
                    // Action-specific data (scroll direction, deltas, text input, etc.)
                    "action_data" to event.actionData
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
                    val hasScreenshot = screenshotBase64 != null
                    Log.d(TAG, "📤 Published action: ${event.eventType} #${event.sequenceNumber} (screenshot: $hasScreenshot)")
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

        // Reset reconnect counter on successful connection
        reconnectAttempts = 0
        reconnectJob?.cancel()
        reconnectJob = null
        isIntentionalDisconnect = false

        // Notify backend that device is online
        notifyDeviceStatus("online")

        // Start periodic accessibility status check
        startAccessibilityStatusCheck()

        scope.launch(Dispatchers.Main) {
            jobListeners.forEach { it.onConnected() }
        }
    }

    private fun onDisconnected() {
        Log.w(TAG, "✗ Disconnected from Pusher server")

        // Notify backend that device is offline
        notifyDeviceStatus("offline")

        // Stop accessibility check when disconnected
        stopAccessibilityStatusCheck()

        scope.launch(Dispatchers.Main) {
            jobListeners.forEach { it.onDisconnected() }
        }

        // Auto-reconnect if not intentional disconnect
        if (!isIntentionalDisconnect) {
            scheduleReconnect()
        }
    }
    
    /**
     * Schedule reconnection with exponential backoff
     */
    private fun scheduleReconnect() {
        if (reconnectAttempts >= maxReconnectAttempts) {
            Log.e(TAG, "❌ Max reconnect attempts ($maxReconnectAttempts) reached. Giving up.")
            reconnectAttempts = 0
            return
        }
        
        reconnectAttempts++
        val delayMs = minOf(1000L * (1 shl (reconnectAttempts - 1)), 30000L) // Exponential backoff, max 30s
        
        Log.i(TAG, "⏳ Scheduling reconnect attempt $reconnectAttempts/$maxReconnectAttempts in ${delayMs}ms")
        
        reconnectJob?.cancel()
        reconnectJob = scope.launch {
            kotlinx.coroutines.delay(delayMs)
            
            if (!isConnected.get() && !isIntentionalDisconnect) {
                Log.i(TAG, "🔄 Attempting reconnect ($reconnectAttempts/$maxReconnectAttempts)...")
                reconnect()
            }
        }
    }
    
    /**
     * Reconnect to Pusher server
     */
    private fun reconnect() {
        // Disconnect existing connection first
        pusher?.disconnect()
        pusher = null
        deviceChannel = null
        presenceChannel = null
        
        // Reconnect
        connect()
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
                    "accessibility_enabled" to isAccessibilityServiceEnabled(context),
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
                    
                    // Show job progress overlay for test run
                    withContext(Dispatchers.Main) {
                        FloatingJobProgressService.show(
                            context = context,
                            currentJob = 1,
                            totalJobs = 1,
                            pendingJobs = 0,
                            workflowName = flowName,
                            currentAction = 0,
                            totalActions = actionsRaw.size
                        )
                    }
                    
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
                        
                        // Update overlay progress
                        withContext(Dispatchers.Main) {
                            FloatingJobProgressService.updateProgress(
                                context = context,
                                currentAction = index + 1,
                                totalActions = actionsRaw.size,
                                actionName = actionType
                            )
                        }
                        
                        // Report 'running' status to backend for node highlighting
                        reportTestRunProgress(
                            context = context,
                            flowId = flowId,
                            actionId = actionId,
                            status = "running",
                            sequence = index + 1,
                            totalActions = actionsRaw.size,
                            message = "Executing: $actionType"
                        )
                        
                        // Log params for debugging
                        val resourceId = params["resourceId"]
                        val contentDesc = params["contentDescription"]
                        val text = params["text"]
                        val x = params["x"]
                        val y = params["y"]
                        Log.d(TAG, "    Params: resourceId=$resourceId, contentDesc=$contentDesc, text=${text?.toString()?.take(30)}, x=$x, y=$y")
                        
                        // Get error handling settings
                        val onError = (actionMap["on_error"] as? String) ?: "stop"
                        val retryAttempts = (actionMap["retry_attempts"] as? Number)?.toInt() ?: 3
                        
                        var attemptCount = 0
                        var lastResult: ActionResult? = null
                        var lastException: Exception? = null
                        val maxAttempts = if (onError == "retry") retryAttempts else 1
                        
                        while (attemptCount < maxAttempts) {
                            attemptCount++
                            
                            if (onError == "retry" && attemptCount > 1) {
                                Log.i(TAG, "  🔄 Retry attempt $attemptCount/$maxAttempts for $actionType")
                                delay(500) // Brief delay before retry
                            }
                            
                            try {
                                val result = executor.executeTestAction(actionType, params)
                                lastResult = result
                                
                                if (result.success) {
                                    Log.i(TAG, "  ✓ Action $actionType completed via ${result.data?.get("method") ?: "unknown"}")
                                    successCount++
                                    
                                    // Report success to backend for node highlighting
                                    reportTestRunProgress(
                                        context = context,
                                        flowId = flowId,
                                        actionId = actionId,
                                        status = "success",
                                        sequence = index + 1,
                                        totalActions = actionsRaw.size,
                                        message = "Completed: $actionType"
                                    )
                                    
                                    break // Success, exit retry loop
                                } else {
                                    // Action failed, check if we should retry
                                    if (onError == "retry" && attemptCount < maxAttempts) {
                                        Log.w(TAG, "  ⚠️ Action $actionType failed, will retry (${attemptCount}/$maxAttempts)")
                                        continue // Try again
                                    }
                                    
                                    // Get error branch target if configured
                                    val errorBranchTarget = actionMap["error_branch_target"] as? String
                                    
                                    // No more retries or not retry mode
                                    when (onError) {
                                        "continue" -> {
                                            Log.w(TAG, "  ⚠️ Action $actionType FAILED but on_error=continue, skipping...")
                                            Log.w(TAG, "     Reason: ${result.message ?: result.error ?: "Unknown"}")
                                            
                                            // Report skipped status
                                            reportTestRunProgress(
                                                context = context,
                                                flowId = flowId,
                                                actionId = actionId,
                                                status = "skipped",
                                                sequence = index + 1,
                                                totalActions = actionsRaw.size,
                                                message = "Skipped: ${result.message ?: "Failed but continuing"}",
                                                errorBranchTarget = errorBranchTarget
                                            )
                                            
                                            break // Exit retry loop, continue to next action
                                        }
                                        "retry" -> {
                                            // All retries exhausted
                                            Log.e(TAG, "  ✗ Action $actionType FAILED after $attemptCount attempts")
                                            failedAction = actionType
                                            failReason = "Failed after $attemptCount retries: ${result.message ?: result.error ?: "Unknown"}"
                                            Log.e(TAG, "  ⛔ STOPPING workflow - all retries exhausted")
                                            
                                            // Report error status
                                            reportTestRunProgress(
                                                context = context,
                                                flowId = flowId,
                                                actionId = actionId,
                                                status = "error",
                                                sequence = index + 1,
                                                totalActions = actionsRaw.size,
                                                message = failReason,
                                                errorBranchTarget = errorBranchTarget
                                            )
                                        }
                                        else -> {
                                            // "stop" or default
                                            failedAction = actionType
                                            failReason = result.message ?: result.error ?: "Unknown error"
                                            Log.e(TAG, "  ✗ Action $actionType FAILED: $failReason")
                                            Log.e(TAG, "  ⛔ STOPPING workflow due to error")
                                            
                                            // Report error status
                                            reportTestRunProgress(
                                                context = context,
                                                flowId = flowId,
                                                actionId = actionId,
                                                status = "error",
                                                sequence = index + 1,
                                                totalActions = actionsRaw.size,
                                                message = failReason,
                                                errorBranchTarget = errorBranchTarget
                                            )
                                        }
                                    }
                                    break // Exit retry loop
                                }
                            } catch (e: Exception) {
                                lastException = e
                                
                                // Check if we should retry on exception
                                if (onError == "retry" && attemptCount < maxAttempts) {
                                    Log.w(TAG, "  ⚠️ Action $actionType exception, will retry (${attemptCount}/$maxAttempts): ${e.message}")
                                    continue // Try again
                                }
                                
                                // No more retries or not retry mode
                                when (onError) {
                                    "continue" -> {
                                        Log.w(TAG, "  ⚠️ Action $actionType EXCEPTION but on_error=continue, skipping...")
                                        Log.w(TAG, "     Exception: ${e.message}")
                                        break // Exit retry loop, continue to next action
                                    }
                                    "retry" -> {
                                        Log.e(TAG, "  ✗ Action $actionType EXCEPTION after $attemptCount attempts: ${e.message}")
                                        failedAction = actionType
                                        failReason = "Exception after $attemptCount retries: ${e.message ?: "Unknown"}"
                                        Log.e(TAG, "  ⛔ STOPPING workflow - all retries exhausted")
                                    }
                                    else -> {
                                        failedAction = actionType
                                        failReason = e.message ?: "Exception occurred"
                                        Log.e(TAG, "  ✗ Action $actionType EXCEPTION: ${e.message}")
                                        Log.e(TAG, "  ⛔ STOPPING workflow due to error")
                                    }
                                }
                                break // Exit retry loop
                            }
                        }
                        
                        // If workflow should stop, break out of main loop
                        if (failedAction != null) {
                            break
                        }
                        
                        // Wait between actions
                        if (waitAfter > 0) {
                            delay(waitAfter)
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
                    
                    // Hide job progress overlay
                    withContext(Dispatchers.Main) {
                        FloatingJobProgressService.hide(context)
                    }
                    
                } catch (e: Exception) {
                    Log.e(TAG, "Test run failed", e)
                    
                    // Hide overlay on error too
                    withContext(Dispatchers.Main) {
                        FloatingJobProgressService.hide(context)
                    }
                }
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error handling workflow test", e)
        }
    }

    /**
     * Report test run progress to backend for real-time node highlighting
     * Sends HTTP POST to /api/workflow/test-run/progress
     */
    private fun reportTestRunProgress(
        context: android.content.Context,
        flowId: Int,
        actionId: String,
        status: String,
        sequence: Int,
        totalActions: Int,
        message: String? = null,
        errorBranchTarget: String? = null
    ) {
        scope.launch {
            try {
                val sessionManager = com.agent.portal.auth.SessionManager(context)
                val session = sessionManager.getSession()
                val token = session?.token ?: return@launch

                val apiUrl = com.agent.portal.utils.NetworkUtils.getApiBaseUrl()

                val payload = mutableMapOf<String, Any>(
                    "flow_id" to flowId,
                    "action_id" to actionId,
                    "status" to status,
                    "sequence" to sequence,
                    "total_actions" to totalActions
                )
                message?.let { payload["message"] = it }
                errorBranchTarget?.let { payload["error_branch_target"] = it }

                val client = okhttp3.OkHttpClient()
                val json = gson.toJson(payload)
                val requestBody = okhttp3.RequestBody.create(
                    "application/json".toMediaTypeOrNull(),
                    json
                )

                val request = okhttp3.Request.Builder()
                    .url("$apiUrl/workflow/test-run/progress")
                    .post(requestBody)
                    .addHeader("Authorization", "Bearer $token")
                    .addHeader("Content-Type", "application/json")
                    .addHeader("Accept", "application/json")
                    .build()

                val response = client.newCall(request).execute()

                if (response.isSuccessful) {
                    Log.d(TAG, "📊 Progress reported: $actionId [$status]")
                } else {
                    Log.w(TAG, "Failed to report progress: ${response.code}")
                }

                response.close()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to report test run progress", e)
            }
        }
    }

    // ================================================================================
    // Job Execution (same as before)
    // ================================================================================

    /**
     * Execute job immediately - but still waits for current job to finish
     * Uses Mutex to ensure only one job runs at a time
     */
    private fun executeJobImmediately(job: Job) {
        Log.i(TAG, "📋 Adding job ${job.id} to execution queue (immediate priority)")
        pendingJobQueue.offer(job) // Add to front conceptually via higher priority
        processNextJob()
    }

    /**
     * Enqueue job for later execution
     * Job will wait for all current jobs to complete
     */
    private fun enqueueJob(job: Job) {
        Log.i(TAG, "📋 Adding job ${job.id} to execution queue")
        pendingJobQueue.offer(job)
        processNextJob()
    }
    
    /**
     * Process next job in queue - ensures sequential execution
     * Only one job runs at a time regardless of how many socket events arrive
     */
    private fun processNextJob() {
        scope.launch {
            // Try to acquire lock - if another job is running, this will wait
            if (executionMutex.tryLock()) {
                try {
                    // Process all queued jobs one by one
                    while (true) {
                        val job = pendingJobQueue.poll() ?: break
                        Log.i(TAG, "▶️ Starting job ${job.id} (${pendingJobQueue.size} jobs waiting)")
                        executeJob(job)
                        
                        // After completing, check if there are more jobs and poll API for new ones
                        if (pendingJobQueue.isEmpty()) {
                            fetchAndQueuePendingJobs()
                        }
                    }
                } finally {
                    executionMutex.unlock()
                }
            } else {
                // Another job is running, this job will be picked up when current finishes
                Log.d(TAG, "⏳ Job executor busy, job will be processed when current completes")
            }
        }
    }
    
    /**
     * Fetch pending jobs from API and add to queue
     * Called after completing a job to check for more work
     */
    private suspend fun fetchAndQueuePendingJobs() {
        try {
            val context = contextRef?.get() ?: return
            val token = authToken ?: return
            val devId = deviceId ?: return
            
            val apiUrl = if (com.agent.portal.utils.NetworkUtils.isEmulator()) {
                "http://10.0.2.2:8000/api"
            } else {
                "${com.agent.portal.utils.NetworkUtils.getApiBaseUrl()}"
            }
            
            val client = okhttp3.OkHttpClient()
            val request = okhttp3.Request.Builder()
                .url("$apiUrl/jobs/pending?device_id=$devId")
                .addHeader("Authorization", "Bearer $token")
                .addHeader("Accept", "application/json")
                .get()
                .build()
            
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val body = response.body?.string()
                if (body != null) {
                    val result = gson.fromJson(body, PendingJobsResponse::class.java)
                    if (result.success && result.jobs.isNotEmpty()) {
                        Log.i(TAG, "📥 Fetched ${result.jobs.size} pending jobs from API")
                        result.jobs.forEach { jobData ->
                            // Convert to Job and add to queue if not already queued
                            if (!jobQueue.containsKey(jobData.id.toString())) {
                                val job = Job(
                                    id = jobData.id.toString(),
                                    type = "workflow",
                                    priority = when {
                                        jobData.priority >= 9 -> JobPriority.IMMEDIATE
                                        jobData.priority >= 7 -> JobPriority.HIGH
                                        jobData.priority >= 4 -> JobPriority.NORMAL
                                        else -> JobPriority.LOW
                                    },
                                    actionConfigUrl = "$apiUrl/jobs/${jobData.id}/config"
                                )
                                jobQueue[job.id] = job
                                pendingJobQueue.offer(job)
                            }
                        }
                    }
                }
            }
            response.close()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to fetch pending jobs", e)
        }
    }

    private suspend fun executeJob(job: Job) {
        val context = contextRef?.get() ?: return

        try {
            Log.i(TAG, "🚀 Executing job: ${job.id}")

            job.status = JobStatus.EXECUTING
            executingJobs[job.id] = job

            // Calculate job position and pending count
            val currentJobIndex = executingJobs.size
            val totalJobsCount = jobQueue.size + executingJobs.size
            val pendingCount = jobQueue.size
            val workflowName = job.workflowName ?: "Workflow"

            // Show job progress overlay
            withContext(Dispatchers.Main) {
                FloatingJobProgressService.show(
                    context = context,
                    currentJob = currentJobIndex,
                    totalJobs = totalJobsCount,
                    pendingJobs = pendingCount,
                    workflowName = workflowName
                )
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
                
                // Hide overlay if no more jobs
                if (jobQueue.isEmpty() && executingJobs.isEmpty()) {
                    FloatingJobProgressService.hide(context)
                }
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
                
                // Hide overlay if no more jobs
                if (jobQueue.isEmpty() && executingJobs.isEmpty()) {
                    FloatingJobProgressService.hide(context)
                }
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

    /**
     * Handle element inspection request from web (Element Inspector feature)
     * Scans the current accessibility tree and sends back all visible elements with screenshot
     */
    private fun handleInspectElements(data: String) {
        scope.launch {
            try {
                Log.i(TAG, "🔍 Starting element inspection with screenshot...")
                
                val accessibilityService = com.agent.portal.accessibility.PortalAccessibilityService.instance
                if (accessibilityService == null) {
                    Log.e(TAG, "❌ Accessibility service not available")
                    publishEvent("inspect:result", mapOf(
                        "success" to false,
                        "error" to "Accessibility service not available",
                        "elements" to emptyList<Any>()
                    ))
                    return@launch
                }
                
                val rootNode = accessibilityService.rootInActiveWindow
                if (rootNode == null) {
                    Log.e(TAG, "❌ No root node available")
                    publishEvent("inspect:result", mapOf(
                        "success" to false,
                        "error" to "No active window found",
                        "elements" to emptyList<Any>()
                    ))
                    return@launch
                }
                
                // Get current package name
                val packageName = rootNode.packageName?.toString() ?: "unknown"
                
                // Collect all visible elements
                val elements = collectElements(rootNode, 0)
                
                // Get screen dimensions for bounds normalization
                val ctx = contextRef?.get()
                val displayMetrics = ctx?.resources?.displayMetrics
                val screenWidth = displayMetrics?.widthPixels ?: 1080
                val screenHeight = displayMetrics?.heightPixels ?: 2400
                
                // Get status bar height - bounds are from screen top, but screenshot might start after status bar
                val statusBarHeight = ctx?.let { context ->
                    val resourceId = context.resources.getIdentifier("status_bar_height", "dimen", "android")
                    if (resourceId > 0) context.resources.getDimensionPixelSize(resourceId) else 0
                } ?: 0
                
                // Recycle root node
                rootNode.recycle()
                
                Log.i(TAG, "✅ Found ${elements.size} elements in $packageName (statusBar=$statusBarHeight)")
                
                // Take screenshot
                accessibilityService.takeScreenshot { bitmap ->
                    scope.launch {
                        var screenshotBase64: String? = null
                        var screenshotWidth = screenWidth
                        var screenshotHeight = screenHeight
                        
                        if (bitmap != null) {
                            try {
                                // Convert bitmap to base64
                                val outputStream = java.io.ByteArrayOutputStream()
                                // Scale down for faster transfer
                                val scaledWidth = (bitmap.width * 0.5).toInt()
                                val scaledHeight = (bitmap.height * 0.5).toInt()
                                val scaledBitmap = android.graphics.Bitmap.createScaledBitmap(
                                    bitmap,
                                    scaledWidth,
                                    scaledHeight,
                                    true
                                )
                                scaledBitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 70, outputStream)
                                val byteArray = outputStream.toByteArray()
                                screenshotBase64 = android.util.Base64.encodeToString(byteArray, android.util.Base64.NO_WRAP)
                                
                                // Clean up
                                if (scaledBitmap != bitmap) {
                                    scaledBitmap.recycle()
                                }
                                bitmap.recycle()
                                
                                Log.i(TAG, "📸 Screenshot captured: ${byteArray.size / 1024}KB (${scaledWidth}x${scaledHeight})")
                                
                                // Store scaled dimensions for response
                                screenshotWidth = scaledWidth
                                screenshotHeight = scaledHeight
                            } catch (e: Exception) {
                                Log.e(TAG, "Failed to encode screenshot", e)
                            }
                        }
                        
                        // Send results back via API
                        val resultData = mutableMapOf<String, Any>(
                            "success" to true,
                            "package_name" to packageName,
                            "element_count" to elements.size,
                            "elements" to elements,
                            "screen_width" to screenWidth,
                            "screen_height" to screenHeight,
                            "screenshot_width" to screenshotWidth,
                            "screenshot_height" to screenshotHeight,
                            "status_bar_height" to statusBarHeight
                        )
                        // Add optional fields
                        deviceId?.let { resultData["device_id"] = it }
                        screenshotBase64?.let { resultData["screenshot"] = it }
                        
                        publishEvent("inspect:result", resultData)
                    }
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "❌ Element inspection failed", e)
                publishEvent("inspect:result", mapOf(
                    "success" to false,
                    "error" to (e.message ?: "Unknown error"),
                    "elements" to emptyList<Any>()
                ))
            }
        }
    }
    
    /**
     * Handle quick action command from Quick Action Bar
     * Quick actions are immediate commands like scroll, back, home
     */
    private fun handleQuickAction(data: String) {
        Log.i(TAG, "⚡ Processing quick action: $data")
        
        scope.launch {
            try {
                val eventData = gson.fromJson(data, Map::class.java) as? Map<String, Any>
                
                // Check if this action is for our device
                val targetDeviceId = eventData?.get("device_id") as? String
                if (targetDeviceId != null && targetDeviceId != deviceId) {
                    Log.d(TAG, "Quick action for different device: $targetDeviceId (we are $deviceId)")
                    return@launch
                }
                
                val action = eventData?.get("action") as? Map<String, Any> ?: run {
                    Log.w(TAG, "No action data in quick action event")
                    return@launch
                }
                
                val actionType = action["type"] as? String
                Log.i(TAG, "⚡ Executing quick action: $actionType")
                
                val accessibilityService = com.agent.portal.accessibility.PortalAccessibilityService.instance
                if (accessibilityService == null) {
                    Log.e(TAG, "Accessibility service not available for quick action")
                    return@launch
                }
                
                when (actionType) {
                    "scroll" -> {
                        val direction = action["direction"] as? String ?: "down"
                        val amount = (action["amount"] as? Number)?.toInt() ?: 500
                        
                        // Get screen dimensions for scroll bounds
                        val context = contextRef?.get()
                        val displayMetrics = context?.resources?.displayMetrics
                        val screenWidth = displayMetrics?.widthPixels ?: 1080
                        val screenHeight = displayMetrics?.heightPixels ?: 2400
                        
                        val centerX = screenWidth / 2f
                        val (startY, endY) = if (direction == "up") {
                            Pair(screenHeight * 0.3f, screenHeight * 0.7f) // Scroll up: swipe down
                        } else {
                            Pair(screenHeight * 0.7f, screenHeight * 0.3f) // Scroll down: swipe up
                        }
                        
                        accessibilityService.performSwipe(centerX.toInt(), startY.toInt(), centerX.toInt(), endY.toInt(), 300)
                        Log.i(TAG, "✅ Scroll $direction executed")
                    }
                    
                    "key_event" -> {
                        val keyCode = action["keyCode"] as? String ?: "KEYCODE_BACK"
                        when (keyCode) {
                            "KEYCODE_BACK" -> accessibilityService.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK)
                            "KEYCODE_HOME" -> accessibilityService.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_HOME)
                            "KEYCODE_APP_SWITCH" -> accessibilityService.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_RECENTS)
                        }
                        Log.i(TAG, "✅ Key event $keyCode executed")
                    }
                    
                    "tap" -> {
                        val x = (action["x"] as? Number)?.toFloat() ?: 540f
                        val y = (action["y"] as? Number)?.toFloat() ?: 960f
                        accessibilityService.performTap(x.toInt(), y.toInt())
                        Log.i(TAG, "✅ Tap at ($x, $y) executed")
                    }
                    
                    "swipe" -> {
                        val startX = (action["startX"] as? Number)?.toFloat() ?: 540f
                        val startY = (action["startY"] as? Number)?.toFloat() ?: 960f
                        val endX = (action["endX"] as? Number)?.toFloat() ?: 540f
                        val endY = (action["endY"] as? Number)?.toFloat() ?: 500f
                        val duration = (action["duration"] as? Number)?.toLong() ?: 300L
                        accessibilityService.performSwipe(startX.toInt(), startY.toInt(), endX.toInt(), endY.toInt(), duration)
                        Log.i(TAG, "✅ Swipe from ($startX,$startY) to ($endX,$endY) executed")
                    }
                    
                    else -> {
                        Log.w(TAG, "Unknown quick action type: $actionType")
                    }
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "❌ Quick action failed", e)
            }
        }
    }
    
    /**
     * Recursively collect elements from accessibility tree
     * Only includes visible, meaningful elements (clickable, has text/resourceId/contentDesc)
     */
    private fun collectElements(node: android.view.accessibility.AccessibilityNodeInfo?, depth: Int): List<Map<String, Any?>> {
        if (node == null || depth > 15) return emptyList()
        
        val results = mutableListOf<Map<String, Any?>>()
        
        // Skip invisible elements
        if (!node.isVisibleToUser) {
            return results
        }
        
        // Only collect meaningful elements
        val hasText = !node.text.isNullOrBlank()
        val hasResourceId = !node.viewIdResourceName.isNullOrBlank()
        val hasContentDesc = !node.contentDescription.isNullOrBlank()
        val isInteractive = node.isClickable || node.isLongClickable || node.isCheckable || node.isEditable
        
        if (hasText || hasResourceId || hasContentDesc || isInteractive) {
            val bounds = android.graphics.Rect()
            node.getBoundsInScreen(bounds)
            
            // Skip elements with invalid bounds
            if (bounds.width() > 0 && bounds.height() > 0) {
                results.add(mapOf(
                    "resourceId" to node.viewIdResourceName,
                    "text" to node.text?.toString(),
                    "contentDescription" to node.contentDescription?.toString(),
                    "className" to node.className?.toString()?.substringAfterLast('.'),
                    "isClickable" to node.isClickable,
                    "isEditable" to node.isEditable,
                    "isCheckable" to node.isCheckable,
                    "isChecked" to node.isChecked,
                    "isScrollable" to node.isScrollable,
                    "bounds" to mapOf(
                        "left" to bounds.left,
                        "top" to bounds.top,
                        "right" to bounds.right,
                        "bottom" to bounds.bottom,
                        "width" to bounds.width(),
                        "height" to bounds.height()
                    ),
                    "depth" to depth
                ))
            }
        }
        
        // Recurse children
        for (i in 0 until node.childCount) {
            val child = node.getChild(i)
            if (child != null) {
                results.addAll(collectElements(child, depth + 1))
                child.recycle()
            }
        }
        
        return results
    }

    /**
     * Handle accessibility check request from web
     * Immediately checks accessibility status and sends result back via HTTP API
     */
    private fun handleCheckAccessibility(data: String) {
        scope.launch {
            try {
                Log.i(TAG, "🔍 Checking accessibility status for web request...")
                
                val context = contextRef?.get() ?: run {
                    Log.e(TAG, "❌ Context not available")
                    return@launch
                }
                
                // Get current accessibility status
                val accessibilityEnabled = isAccessibilityServiceEnabled(context)
                
                Log.i(TAG, "✅ Accessibility status: ${if (accessibilityEnabled) "ENABLED" else "DISABLED"}")
                
                // Send result back to backend via HTTP
                val sessionManager = com.agent.portal.auth.SessionManager(context)
                val session = sessionManager.getSession()
                val token = session?.token ?: run {
                    Log.w(TAG, "No auth token, cannot send accessibility result")
                    return@launch
                }
                
                // Use NetworkUtils for proper host resolution
                val apiUrl = com.agent.portal.utils.NetworkUtils.getApiBaseUrl()
                
                val payload = mapOf(
                    "device_id" to (deviceId ?: "unknown"),
                    "accessibility_enabled" to accessibilityEnabled
                )
                
                val client = okhttp3.OkHttpClient()
                val json = gson.toJson(payload)
                val requestBody = okhttp3.RequestBody.create(
                    "application/json".toMediaTypeOrNull(),
                    json
                )
                
                val request = okhttp3.Request.Builder()
                    .url("$apiUrl/devices/check-accessibility-result")
                    .post(requestBody)
                    .addHeader("Authorization", "Bearer $token")
                    .addHeader("Content-Type", "application/json")
                    .addHeader("Accept", "application/json")
                    .build()
                
                val response = client.newCall(request).execute()
                
                if (response.isSuccessful) {
                    Log.i(TAG, "✅ Accessibility check result sent to backend")
                } else {
                    Log.w(TAG, "Failed to send accessibility result: ${response.code}")
                }
                
                response.close()
            } catch (e: Exception) {
                Log.e(TAG, "Error handling accessibility check", e)
            }
        }
    }

    /**
     * Check if Accessibility Service is enabled for this app
     */
    private fun isAccessibilityServiceEnabled(context: android.content.Context): Boolean {
        try {
            val serviceClass = "com.agent.portal.accessibility.PortalAccessibilityService"
            val service = "${context.packageName}/$serviceClass"
            val settingValue = android.provider.Settings.Secure.getString(
                context.contentResolver,
                android.provider.Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            )

            if (settingValue.isNullOrEmpty()) {
                return false
            }

            return settingValue.contains(service)
        } catch (e: Exception) {
            Log.e(TAG, "Error checking accessibility service status", e)
            return false
        }
    }

    /**
     * Handle visual inspection request from web (OCR-based text detection)
     * Takes screenshot, performs OCR to detect text elements, and sends results back
     */
    private fun handleVisualInspect(data: String) {
        scope.launch {
            try {
                Log.i(TAG, "👁️ Starting visual inspection (OCR mode)...")
                
                val accessibilityService = com.agent.portal.accessibility.PortalAccessibilityService.instance
                if (accessibilityService == null) {
                    Log.e(TAG, "❌ Accessibility service not available for visual inspection")
                    publishEvent("visual:result", mapOf(
                        "success" to false,
                        "error" to "Accessibility service not available",
                        "text_elements" to emptyList<Any>()
                    ))
                    return@launch
                }
                
                // Get screen dimensions
                val ctx = contextRef?.get()
                val displayMetrics = ctx?.resources?.displayMetrics
                val screenWidth = displayMetrics?.widthPixels ?: 1080
                val screenHeight = displayMetrics?.heightPixels ?: 2400
                
                // Get status bar height for coordinate adjustment
                val statusBarHeight = ctx?.let { context ->
                    val resourceId = context.resources.getIdentifier("status_bar_height", "dimen", "android")
                    if (resourceId > 0) context.resources.getDimensionPixelSize(resourceId) else 0
                } ?: 0
                
                // Take screenshot and perform OCR
                accessibilityService.takeScreenshot { bitmap ->
                    scope.launch {
                        if (bitmap == null) {
                            Log.e(TAG, "❌ Failed to capture screenshot for OCR")
                            publishEvent("visual:result", mapOf(
                                "success" to false,
                                "error" to "Screenshot capture failed",
                                "text_elements" to emptyList<Any>()
                            ))
                            return@launch
                        }
                        
                        try {
                            // Perform OCR using VisualInspectionService
                            val result = com.agent.portal.vision.VisualInspectionService.detectText(bitmap)
                            
                            // Convert bitmap to base64 for preview
                            var screenshotBase64: String? = null
                            var screenshotWidth = bitmap.width
                            var screenshotHeight = bitmap.height
                            
                            try {
                                val outputStream = java.io.ByteArrayOutputStream()
                                // Scale down for faster transfer
                                val scaledWidth = (bitmap.width * 0.5).toInt()
                                val scaledHeight = (bitmap.height * 0.5).toInt()
                                val scaledBitmap = android.graphics.Bitmap.createScaledBitmap(
                                    bitmap,
                                    scaledWidth,
                                    scaledHeight,
                                    true
                                )
                                scaledBitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 70, outputStream)
                                val byteArray = outputStream.toByteArray()
                                screenshotBase64 = android.util.Base64.encodeToString(byteArray, android.util.Base64.NO_WRAP)
                                
                                // Store scaled dimensions
                                screenshotWidth = scaledWidth
                                screenshotHeight = scaledHeight
                                
                                // Clean up
                                if (scaledBitmap != bitmap) {
                                    scaledBitmap.recycle()
                                }
                                Log.i(TAG, "📸 Screenshot for OCR: ${byteArray.size / 1024}KB (${scaledWidth}x${scaledHeight})")
                            } catch (e: Exception) {
                                Log.e(TAG, "Failed to encode screenshot for OCR", e)
                            }
                            
                            bitmap.recycle()
                            
                            // Build response
                            val resultData = mutableMapOf<String, Any>(
                                "success" to result.success,
                                "text_elements" to result.textElements.map { it.toMap() },
                                "total_elements" to result.textElements.size,
                                "processing_time_ms" to result.processingTimeMs,
                                "screen_width" to screenWidth,
                                "screen_height" to screenHeight,
                                "screenshot_width" to screenshotWidth,
                                "screenshot_height" to screenshotHeight,
                                "status_bar_height" to statusBarHeight
                            )
                            
                            // Add optional fields
                            deviceId?.let { resultData["device_id"] = it }
                            screenshotBase64?.let { resultData["screenshot"] = it }
                            result.error?.let { resultData["error"] = it }
                            
                            Log.i(TAG, "✅ Visual inspection complete: ${result.textElements.size} text elements detected in ${result.processingTimeMs}ms")
                            
                            publishEvent("visual:result", resultData)
                            
                        } catch (e: Exception) {
                            Log.e(TAG, "❌ OCR processing failed", e)
                            bitmap.recycle()
                            publishEvent("visual:result", mapOf(
                                "success" to false,
                                "error" to (e.message ?: "OCR processing failed"),
                                "text_elements" to emptyList<Any>()
                            ))
                        }
                    }
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "❌ Visual inspection failed", e)
                publishEvent("visual:result", mapOf(
                    "success" to false,
                    "error" to (e.message ?: "Unknown error"),
                    "text_elements" to emptyList<Any>()
                ))
            }
        }
    }

    /**
     * Start periodic accessibility status check (every 60 seconds)
     * Notifies backend when status changes
     */
    private fun startAccessibilityStatusCheck() {
        // Cancel existing job if any
        stopAccessibilityStatusCheck()

        accessibilityCheckJob = scope.launch {
            while (isActive && isConnected.get()) {
                try {
                    val context = contextRef?.get()
                    if (context != null) {
                        val currentStatus = isAccessibilityServiceEnabled(context)

                        // Check if status changed
                        if (lastAccessibilityStatus == null || lastAccessibilityStatus != currentStatus) {
                            Log.i(TAG, "Accessibility status changed: ${lastAccessibilityStatus} -> $currentStatus")
                            lastAccessibilityStatus = currentStatus

                            // Notify backend about the change
                            notifyDeviceStatus(if (isConnected.get()) "online" else "offline")
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error checking accessibility status", e)
                }

                // Check every 5 seconds for faster status updates
                delay(5000)
            }
        }

        Log.i(TAG, "Started periodic accessibility status check")
    }

    /**
     * Stop periodic accessibility status check
     */
    private fun stopAccessibilityStatusCheck() {
        accessibilityCheckJob?.cancel()
        accessibilityCheckJob = null
        Log.i(TAG, "Stopped periodic accessibility status check")
    }

    fun shutdown() {
        disconnect()
        stopAccessibilityStatusCheck()
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

    @SerializedName("workflow_name")
    val workflowName: String? = null,

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

/**
 * Response from GET /api/jobs/pending endpoint
 */
data class PendingJobsResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("device_id")
    val deviceId: String?,
    
    @SerializedName("jobs")
    val jobs: List<PendingJobData> = emptyList(),
    
    @SerializedName("count")
    val count: Int = 0
)

data class PendingJobData(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("name")
    val name: String?,
    
    @SerializedName("priority")
    val priority: Int = 5,
    
    @SerializedName("status")
    val status: String?,
    
    @SerializedName("scheduled_at")
    val scheduledAt: String?,
    
    @SerializedName("created_at")
    val createdAt: String?
)
