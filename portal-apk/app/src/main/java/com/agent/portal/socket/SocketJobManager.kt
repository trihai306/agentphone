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
    private val isInitialized = AtomicBoolean(false)
    private val channelsSubscribed = AtomicBoolean(false)
    
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
        // Prevent duplicate initialization
        if (isInitialized.get()) {
            Log.w(TAG, "SocketJobManager already initialized, skipping duplicate init")
            return
        }
        
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
        isInitialized.set(true)
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
                Log.i(TAG, "Connecting to Pusher: $host:$port (encrypted: $encrypted)")
                
                // Test HTTPS connectivity to production server first
                if (encrypted && host != "10.0.2.2") {
                    try {
                        val testUrl = "https://$host/"
                        Log.i(TAG, "Testing HTTPS connectivity to: $testUrl")
                        val client = okhttp3.OkHttpClient.Builder()
                            .connectTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
                            .build()
                        val request = okhttp3.Request.Builder().url(testUrl).head().build()
                        val response = client.newCall(request).execute()
                        Log.i(TAG, "✅ HTTPS test successful: ${response.code}")
                        response.close()
                    } catch (e: Exception) {
                        Log.e(TAG, "❌ HTTPS connectivity test failed: ${e.message}", e)
                    }
                }

                // Configure auth endpoint for presence channels - use production URL from NetworkUtils
                val authUrl = "${com.agent.portal.utils.NetworkUtils.getApiBaseUrl()}/pusher/auth"
                
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
        // Prevent duplicate channel subscriptions
        if (channelsSubscribed.get()) {
            Log.w(TAG, "Channels already subscribed, skipping duplicate subscription")
            return
        }
        
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
                    channelsSubscribed.set(true)
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
                        // Note: workflow:test, inspect:elements, check:accessibility are handled by global handler
                        "visual:inspect" -> {
                            // DEPRECATED: OCR now included in inspect:elements
                            Log.i(TAG, "⚠️ Ignoring visual:inspect - OCR in inspect:elements")
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

            // Note: inspect:elements is handled by global handler, no need for direct bind here

            // DEPRECATED: visual:inspect now handled by inspect:elements (unified API)
            presenceChannel?.bind("visual:inspect", object : PresenceChannelEventListener {
                override fun onEvent(event: PusherEvent) {
                    Log.i(TAG, "⚠️ Ignoring visual:inspect via presence - OCR now in inspect:elements")
                    // DO NOT call handleVisualInspect
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
                Log.w(TAG, "🔵 SUBSCRIPTION_SUCCEEDED callback fired for: $channelName")
                Log.w(TAG, "🔵 Socket ID: ${pusher?.connection?.socketId}")
                Log.i(TAG, "✅ Private channel subscribed successfully: $channelName")
            }
            override fun onAuthenticationFailure(message: String?, e: Exception?) {
                Log.e(TAG, "❌ Private channel auth FAILED: $message", e)
                Log.e(TAG, "❌ Auth failure details - Socket ID: ${pusher?.connection?.socketId}")
            }
            override fun onEvent(event: PusherEvent) {
                Log.w(TAG, "🔴 PRIVATE CHANNEL EVENT RECEIVED: ${event.eventName}")
                Log.i(TAG, "📥 Private channel event: ${event.eventName} - ${event.data?.take(200)}")
                // Route events to handlers
                when (event.eventName) {
                    "job:new" -> handleNewJob(event.data)
                    "job:cancel" -> handleCancelJob(event.data)
                    "job:pause" -> handlePauseJob(event.data)
                    "job:resume" -> handleResumeJob(event.data)
                    "config:update" -> handleConfigUpdate(event.data)
                    "recording.stop_requested" -> handleRecordingStopRequested(event.data)
                    // Note: workflow:test, inspect:elements, check:accessibility are handled by global handler
                    "visual:inspect" -> {
                        // DEPRECATED: OCR now included in inspect:elements
                        Log.i(TAG, "⚠️ Ignoring visual:inspect - OCR in inspect:elements")
                    }
                    "find:icon" -> {
                        Log.w(TAG, "🔍 Received find:icon via main handler!")
                        handleFindIcon(event.data)
                    }
                    "pusher_internal:subscription_succeeded" -> {
                        Log.w(TAG, "🟢 PUSHER INTERNAL: Subscription confirmed by server!")
                    }
                    else -> {
                        Log.w(TAG, "⚠️ Unhandled event: ${event.eventName}")
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

        // NOTE: workflow:test is handled by the global event handler in onEvent()
        // Note: workflow:test, inspect:elements, check:accessibility are handled by global handler
        // Do NOT bind separately here to avoid duplicate event processing


        // DEPRECATED: visual:inspect is now handled by inspect:elements (unified API)
        // Keep binding to avoid "unhandled event" warnings but do nothing
        deviceChannel?.bind("visual:inspect", object : com.pusher.client.channel.PrivateChannelEventListener {
            override fun onEvent(event: PusherEvent) {
                Log.i(TAG, "⚠️ Ignoring visual:inspect - OCR now included in inspect:elements")
                // DO NOT call handleVisualInspect - unified API handles this
            }
            override fun onSubscriptionSucceeded(channelName: String) {}
            override fun onAuthenticationFailure(message: String?, e: Exception?) {}
        })

        // Listen for icon finding request from web (Template matching)
        deviceChannel?.bind("find:icon", object : com.pusher.client.channel.PrivateChannelEventListener {
            override fun onEvent(event: PusherEvent) {
                Log.i(TAG, "🖼️ Received find:icon request (Template matching)")
                handleFindIcon(event.data)
            }
            override fun onSubscriptionSucceeded(channelName: String) {}
            override fun onAuthenticationFailure(message: String?, e: Exception?) {}
        })

        // Add global event listener to route events (individual binds may not fire reliably)
        deviceChannel?.bindGlobal { event ->
            // Route events silently - only log errors
            when (event?.eventName) {
                "workflow:test" -> handleWorkflowTest(event.data ?: "")
                "inspect:elements" -> handleInspectElements(event.data ?: "")
                "check:accessibility" -> handleCheckAccessibility(event.data ?: "")
                "job:new" -> handleNewJob(event.data ?: "")
                "recording.stop_requested" -> handleRecordingStopRequested(event.data ?: "")
            }
        }

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
                presenceChannel = null
                
                // Disconnect from Pusher
                pusher?.disconnect()
                pusher = null
                isConnected.set(false)
                channelsSubscribed.set(false)
                isInitialized.set(false)
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

                // Use production API URL from NetworkUtils
                val apiUrl = com.agent.portal.utils.NetworkUtils.getApiBaseUrl()

                // Send HTTP POST request with longer timeout for large payloads
                val client = okhttp3.OkHttpClient.Builder()
                    .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
                    .writeTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
                    .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
                    .build()
                    
                val json = gson.toJson(enrichedData)
                val payloadSizeKb = json.length / 1024
                
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

                Log.i(TAG, "📤 Sending $eventName (${payloadSizeKb}KB)...")
                val response = client.newCall(request).execute()
                
                if (response.isSuccessful) {
                    Log.i(TAG, "✅ Published $eventName (${payloadSizeKb}KB)")
                } else {
                    val body = response.body?.string()?.take(200) ?: "no body"
                    Log.e(TAG, "❌ Failed to publish $eventName: ${response.code} - $body")
                }
                
                response.close()
            } catch (e: Exception) {
                Log.e(TAG, "❌ Exception publishing '$eventName': ${e.message}", e)
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

                // Use production API URL from NetworkUtils
                val apiUrl = com.agent.portal.utils.NetworkUtils.getApiBaseUrl()

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

                val apiUrl = com.agent.portal.utils.NetworkUtils.getApiBaseUrl()

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
            
            val apiUrl = com.agent.portal.utils.NetworkUtils.getApiBaseUrl()
            
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
                
                // Get screen dimensions for bounds normalization - MUST be calculated BEFORE collectElements
                val ctx = contextRef?.get()
                val displayMetrics = ctx?.resources?.displayMetrics
                val screenWidth = displayMetrics?.widthPixels ?: 1080
                val screenHeight = displayMetrics?.heightPixels ?: 2400
                
                // Get status bar height - bounds are from screen top, but screenshot might start after status bar
                val statusBarHeight = ctx?.let { context ->
                    val resourceId = context.resources.getIdentifier("status_bar_height", "dimen", "android")
                    if (resourceId > 0) context.resources.getDimensionPixelSize(resourceId) else 0
                } ?: 0
                
                // Get navigation bar height for complete window metrics
                val navBarHeight = ctx?.let { context ->
                    val resourceId = context.resources.getIdentifier("navigation_bar_height", "dimen", "android")
                    if (resourceId > 0) context.resources.getDimensionPixelSize(resourceId) else 0
                } ?: 0
                
                // Collect all visible elements with screen dimensions for normalized bounds
                val elements = collectElements(rootNode, 0, screenWidth, screenHeight)
                
                // Recycle root node
                rootNode.recycle()
                
                Log.i(TAG, "✅ Found ${elements.size} elements in $packageName (screen=${screenWidth}x${screenHeight}, statusBar=$statusBarHeight, navBar=$navBarHeight)")
                
                // Take screenshot
                accessibilityService.takeScreenshot { bitmap ->
                    scope.launch {
                        var screenshotBase64: String? = null
                        var screenshotWidth = screenWidth
                        var screenshotHeight = screenHeight
                        var ocrElements: List<Map<String, Any?>> = emptyList()  // OCR text elements
                        
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
                                
                                Log.i(TAG, "📸 Screenshot captured: ${byteArray.size / 1024}KB (${scaledWidth}x${scaledHeight})")
                                
                                // Store scaled dimensions for response
                                screenshotWidth = scaledWidth
                                screenshotHeight = scaledHeight
                            } catch (e: Exception) {
                                Log.e(TAG, "Failed to encode screenshot", e)
                            }
                            
                            // Crop icons from small interactive elements
                            try {
                                val maxIconSize = 100 // Max 100px icons
                                val minElementSize = 16 // Min element size to consider
                                val maxElementSize = 500 // Max element size (increased for app icons)
                                var iconsCropped = 0
                                
                                for (element in elements) {
                                    if (element !is MutableMap<*, *>) continue
                                    @Suppress("UNCHECKED_CAST")
                                    val el = element as MutableMap<String, Any?>
                                    
                                    // Crop for interactive elements (clickable, checkable, editable) or elements with text/description
                                    val isClickable = el["isClickable"] as? Boolean ?: false
                                    val isCheckable = el["isCheckable"] as? Boolean ?: false
                                    val isEditable = el["isEditable"] as? Boolean ?: false
                                    val hasText = (el["text"] as? String)?.isNotEmpty() == true
                                    val hasDesc = (el["contentDescription"] as? String)?.isNotEmpty() == true
                                    
                                    val bounds = el["bounds"] as? Map<String, Any?> ?: continue
                                    val width = (bounds["width"] as? Number)?.toInt() ?: 0
                                    val height = (bounds["height"] as? Number)?.toInt() ?: 0
                                    val left = (bounds["left"] as? Number)?.toInt() ?: 0
                                    val top = (bounds["top"] as? Number)?.toInt() ?: 0
                                    
                                    // Skip if not interactive and no identifying info
                                    val isInteractive = isClickable || isCheckable || isEditable
                                    val hasIdentity = hasText || hasDesc
                                    
                                    // Always crop icons for ImageView/ImageButton/Button classes even without text
                                    val className = el["className"] as? String ?: ""
                                    val isIconElement = className.contains("ImageView", ignoreCase = true) ||
                                        className.contains("ImageButton", ignoreCase = true) ||
                                        className.contains("Button", ignoreCase = true) ||
                                        className.contains("Icon", ignoreCase = true) ||
                                        className.contains("Fab", ignoreCase = true)
                                    
                                    if (!isInteractive && !hasIdentity && !isIconElement) continue
                                    
                                    // Skip too small or too large elements
                                    if (width < minElementSize || height < minElementSize) continue
                                    if (width > maxElementSize || height > maxElementSize) continue
                                    if (iconsCropped >= 60) continue // Limit to avoid memory issues
                                    
                                    // For tall elements (like app icons with text below), crop just the top portion
                                    // Icon is usually in top part of element
                                    val cropHeight = if (height > width * 1.5) {
                                        // Tall element - icon is likely in top square portion
                                        minOf(width, height / 2)
                                    } else {
                                        height
                                    }
                                    
                                    // Crop icon from bitmap
                                    try {
                                        var iconBase64: String? = null
                                        
                                        // First try: Get app icon from PackageManager (for app launcher icons)
                                        // This gives clean, high-quality icons without background artifacts
                                        val className = el["className"] as? String ?: ""
                                        val resourceId = el["resourceId"] as? String ?: ""
                                        val contentDesc = el["contentDescription"] as? String ?: ""
                                        
                                        // Check if this is likely an app icon on home screen/launcher
                                        val isLauncherIcon = resourceId.contains("icon", ignoreCase = true) ||
                                            className.contains("AppWidget", ignoreCase = true) ||
                                            (className.contains("TextView") && hasDesc && height > width) ||
                                            resourceId.contains("launcher", ignoreCase = true)
                                        
                                        if (isLauncherIcon && contentDesc.isNotEmpty()) {
                                            iconBase64 = tryGetAppIcon(contentDesc, maxIconSize)
                                        }
                                        
                                        // Fallback: Crop from screenshot
                                        if (iconBase64 == null) {
                                            val safeLeft = left.coerceIn(0, bitmap.width - 1)
                                            val safeTop = top.coerceIn(0, bitmap.height - 1)
                                            val safeWidth = width.coerceIn(1, bitmap.width - safeLeft)
                                            val safeHeight = cropHeight.coerceIn(1, bitmap.height - safeTop)
                                            
                                            val cropped = android.graphics.Bitmap.createBitmap(
                                                bitmap, safeLeft, safeTop, safeWidth, safeHeight
                                            )
                                            
                                            // Scale if needed
                                            val scaledBitmap = if (safeWidth > maxIconSize || safeHeight > maxIconSize) {
                                                val scale = maxIconSize.toFloat() / maxOf(safeWidth, safeHeight)
                                                android.graphics.Bitmap.createScaledBitmap(
                                                    cropped,
                                                    (safeWidth * scale).toInt().coerceAtLeast(1),
                                                    (safeHeight * scale).toInt().coerceAtLeast(1),
                                                    true
                                                ).also { if (it != cropped) cropped.recycle() }
                                            } else {
                                                cropped
                                            }
                                            
                                            // Convert HARDWARE bitmap to SOFTWARE for pixel operations
                                            val softwareBitmap = scaledBitmap.copy(android.graphics.Bitmap.Config.ARGB_8888, false)
                                            if (softwareBitmap != scaledBitmap) {
                                                scaledBitmap.recycle()
                                            }
                                            
                                            if (softwareBitmap == null) {
                                                // Fallback: just use the scaled bitmap directly
                                                val iconStream = java.io.ByteArrayOutputStream()
                                                scaledBitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 90, iconStream)
                                                iconBase64 = android.util.Base64.encodeToString(
                                                    iconStream.toByteArray(), 
                                                    android.util.Base64.NO_WRAP
                                                )
                                            } else {
                                                // ✅ STORE RAW ICON (no preprocessing)
                                                // 
                                                // Why RAW is better:
                                                // 1. Background provides unique visual signature for template matching
                                                // 2. Gradient backgrounds are PART of the icon visual identity
                                                // 3. Tap uses HINT coordinates (x, y), not match center
                                                // 4. Template matching + proximity bias handles dynamic backgrounds
                                                //
                                                // Smart crop problems:
                                                // - Can't detect gradient backgrounds reliably
                                                // - May remove icon content (over-aggressive)
                                                // - Unnecessary complexity
                                                
                                                val iconBitmap = softwareBitmap
                                            
                                                // Encode to base64
                                                val iconStream = java.io.ByteArrayOutputStream()
                                                iconBitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 90, iconStream)
                                                iconBase64 = android.util.Base64.encodeToString(
                                                    iconStream.toByteArray(), 
                                                    android.util.Base64.NO_WRAP
                                                )
                                            
                                                iconBitmap.recycle()
                                            }
                                        } // End of if (iconBase64 == null) fallback
                                        
                                        if (iconBase64 != null) {
                                            el["image"] = iconBase64
                                            iconsCropped++
                                        }
                                    } catch (e: Exception) {
                                        Log.w(TAG, "Failed to crop icon at ($left,$top): ${e.message}")
                                    }
                                }
                                
                                if (iconsCropped > 0) {
                                    Log.i(TAG, "🖼️ Cropped $iconsCropped icons from screenshot")
                                }
                            } catch (e: Exception) {
                                Log.e(TAG, "Failed to crop icons", e)
                            }
                            
                            // ========== UNIFIED OCR TEXT DETECTION ==========
                            // Run OCR on the SAME screenshot (no additional screenshot needed)
                            try {
                                // Convert HARDWARE bitmap to ARGB_8888 for ML Kit
                                val ocrBitmap = bitmap.copy(android.graphics.Bitmap.Config.ARGB_8888, false)
                                if (ocrBitmap != null) {
                                    val ocrResult = com.agent.portal.vision.VisualInspectionService.detectText(ocrBitmap)
                                    ocrElements = ocrResult.textElements.map { it.toMap() }
                                    Log.i(TAG, "📝 OCR detected ${ocrElements.size} text elements in ${ocrResult.processingTimeMs}ms")
                                    ocrBitmap.recycle()
                                }
                            } catch (e: Exception) {
                                Log.e(TAG, "OCR detection failed (non-blocking)", e)
                            }
                            // ================================================
                            
                            bitmap.recycle()
                        }
                        
                        // ========== SINGLE EVENT - NO CHUNKING ==========
                        // Send all elements in one inspect:result event (socket limit increased)
                        val totalElements = elements.size
                        val totalOcr = ocrElements.size
                        
                        Log.i(TAG, "📦 Sending ${totalElements} elements + ${totalOcr} OCR in single event")
                        
                        val resultData = mutableMapOf<String, Any>(
                            "success" to true,
                            "package_name" to packageName,
                            "elements" to elements,
                            "text_elements" to ocrElements,
                            "element_count" to totalElements,
                            "ocr_count" to totalOcr,
                            "screen_width" to screenWidth,
                            "screen_height" to screenHeight,
                            "screenshot_width" to screenshotWidth,
                            "screenshot_height" to screenshotHeight,
                            "status_bar_height" to statusBarHeight,
                            "nav_bar_height" to navBarHeight
                        )
                        deviceId?.let { resultData["device_id"] = it }
                        screenshotBase64?.let { resultData["screenshot"] = it }
                        
                        publishEvent("inspect:result", resultData)
                        Log.i(TAG, "✅ inspect:result sent successfully")
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
     * EXPANDED: Collects more elements including focusable, scrollable, and common view types
     * Now includes normalized (0-1) percentage bounds for accurate cross-device positioning
     */
    private fun collectElements(
        node: android.view.accessibility.AccessibilityNodeInfo?, 
        depth: Int,
        screenWidth: Int = 1080,
        screenHeight: Int = 2400
    ): MutableList<MutableMap<String, Any?>> {
        // Increased depth limit to 25 for complex UIs
        if (node == null || depth > 25) return mutableListOf()
        
        val results = mutableListOf<MutableMap<String, Any?>>()
        
        // Skip invisible elements
        if (!node.isVisibleToUser) {
            // Still recurse children - some parents may be marked invisible but have visible children
            for (i in 0 until node.childCount) {
                val child = node.getChild(i)
                if (child != null) {
                    results.addAll(collectElements(child, depth + 1, screenWidth, screenHeight))
                    child.recycle()
                }
            }
            return results
        }
        
        // EXPANDED: Collect elements based on multiple criteria
        val hasText = !node.text.isNullOrBlank()
        val hasResourceId = !node.viewIdResourceName.isNullOrBlank()
        val hasContentDesc = !node.contentDescription.isNullOrBlank()
        
        // Expanded interactive checks
        val isClickable = node.isClickable
        val isLongClickable = node.isLongClickable
        val isCheckable = node.isCheckable
        val isEditable = node.isEditable
        val isScrollable = node.isScrollable
        val isFocusable = node.isFocusable
        val isSelected = node.isSelected
        
        // Check for common interactive view class names
        val className = node.className?.toString() ?: ""
        val isLikelyInteractive = className.contains("Button") ||
            className.contains("Image") ||
            className.contains("Icon") ||
            className.contains("Tab") ||
            className.contains("Chip") ||
            className.contains("Card") ||
            className.contains("Item") ||
            className.contains("Cell") ||
            className.contains("Radio") ||
            className.contains("Switch") ||
            className.contains("Slider") ||
            className.contains("SeekBar") ||
            className.contains("Spinner") ||
            className.contains("Menu") ||
            className.contains("Fab") ||
            className.endsWith("View") // Generic clickable views
        
        // Include element if it has any identifying info OR is interactive OR looks clickable
        val shouldInclude = hasText || 
            hasResourceId || 
            hasContentDesc || 
            isClickable || 
            isLongClickable || 
            isCheckable || 
            isEditable ||
            isScrollable ||
            (isFocusable && isLikelyInteractive) ||
            isSelected ||
            isLikelyInteractive
        
        if (shouldInclude) {
            val bounds = android.graphics.Rect()
            node.getBoundsInScreen(bounds)
            
            // Skip elements with invalid bounds
            if (bounds.width() > 0 && bounds.height() > 0) {
                // Calculate normalized (0-1) percentage values for cross-device compatibility
                val leftPercent = if (screenWidth > 0) bounds.left.toFloat() / screenWidth else 0f
                val topPercent = if (screenHeight > 0) bounds.top.toFloat() / screenHeight else 0f
                val widthPercent = if (screenWidth > 0) bounds.width().toFloat() / screenWidth else 0f
                val heightPercent = if (screenHeight > 0) bounds.height().toFloat() / screenHeight else 0f
                
                // Calculate center coordinates for tap actions
                val centerX = bounds.left + bounds.width() / 2
                val centerY = bounds.top + bounds.height() / 2
                val centerXPercent = if (screenWidth > 0) centerX.toFloat() / screenWidth else 0.5f
                val centerYPercent = if (screenHeight > 0) centerY.toFloat() / screenHeight else 0.5f
                
                results.add(mutableMapOf(
                    "resourceId" to node.viewIdResourceName,
                    "text" to node.text?.toString(),
                    "contentDescription" to node.contentDescription?.toString(),
                    "className" to node.className?.toString()?.substringAfterLast('.'),
                    "isClickable" to node.isClickable,
                    "isLongClickable" to node.isLongClickable,
                    "isEditable" to node.isEditable,
                    "isCheckable" to node.isCheckable,
                    "isChecked" to node.isChecked,
                    "isScrollable" to node.isScrollable,
                    "isFocusable" to node.isFocusable,
                    "isEnabled" to node.isEnabled,
                    
                    // TOP-LEVEL COORDINATES (for easy FE/BE access)
                    // Absolute coordinates (backward compatible)
                    "x" to centerX,
                    "y" to centerY,
                    // Percentage coordinates (cross-device compatible)  
                    "xPercent" to ("%.2f".format(centerXPercent * 100).toDouble()),  // 0-100 scale with 2 decimals
                    "yPercent" to ("%.2f".format(centerYPercent * 100).toDouble()),
                    // Screen resolution context
                    "screen_width" to screenWidth,
                    "screen_height" to screenHeight,
                    
                    "bounds" to mapOf(
                        // Absolute pixel values
                        "left" to bounds.left,
                        "top" to bounds.top,
                        "right" to bounds.right,
                        "bottom" to bounds.bottom,
                        "width" to bounds.width(),
                        "height" to bounds.height(),
                        // Normalized percentage values (0-1) for scaling
                        "leftPercent" to leftPercent,
                        "topPercent" to topPercent,
                        "widthPercent" to widthPercent,
                        "heightPercent" to heightPercent,
                        // Center point for easy tap targeting
                        "centerX" to centerX,
                        "centerY" to centerY,
                        "centerXPercent" to centerXPercent,
                        "centerYPercent" to centerYPercent
                    ),
                    "depth" to depth
                ))
            }
        }
        
        // Recurse children with same screen dimensions
        for (i in 0 until node.childCount) {
            val child = node.getChild(i)
            if (child != null) {
                results.addAll(collectElements(child, depth + 1, screenWidth, screenHeight))
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
                            // Perform combined OCR + Object detection using VisualInspectionService
                            val result = com.agent.portal.vision.VisualInspectionService.detectTextAndObjects(bitmap)
                            
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
     * Handle find icon request from web
     * Takes screenshot, matches template icon, returns coordinates
     */
    private fun handleFindIcon(data: String) {
        scope.launch {
            try {
                Log.i(TAG, "🔍 Starting icon template matching...")
                
                val eventData = gson.fromJson(data, Map::class.java) as? Map<String, Any>
                val templateBase64 = eventData?.get("template") as? String
                val minConfidence = (eventData?.get("min_confidence") as? Number)?.toDouble() ?: 0.65
                
                if (templateBase64.isNullOrEmpty()) {
                    Log.e(TAG, "❌ No template image provided")
                    publishEvent("find:icon:result", mapOf(
                        "success" to false,
                        "error" to "No template image provided"
                    ))
                    return@launch
                }
                
                val accessibilityService = com.agent.portal.accessibility.PortalAccessibilityService.instance
                if (accessibilityService == null) {
                    Log.e(TAG, "❌ Accessibility service not available for icon matching")
                    publishEvent("find:icon:result", mapOf(
                        "success" to false,
                        "error" to "Accessibility service not available"
                    ))
                    return@launch
                }
                
                // Decode template from base64
                val templateBytes = android.util.Base64.decode(templateBase64, android.util.Base64.DEFAULT)
                val templateBitmap = android.graphics.BitmapFactory.decodeByteArray(templateBytes, 0, templateBytes.size)
                
                if (templateBitmap == null) {
                    Log.e(TAG, "❌ Failed to decode template image")
                    publishEvent("find:icon:result", mapOf(
                        "success" to false,
                        "error" to "Failed to decode template image"
                    ))
                    return@launch
                }
                
                Log.i(TAG, "📸 Template decoded: ${templateBitmap.width}x${templateBitmap.height}")
                
                // Take screenshot
                accessibilityService.takeScreenshot { screenshot ->
                    scope.launch {
                        if (screenshot == null) {
                            Log.e(TAG, "❌ Failed to capture screenshot for icon matching")
                            templateBitmap.recycle()
                            publishEvent("find:icon:result", mapOf(
                                "success" to false,
                                "error" to "Screenshot capture failed"
                            ))
                            return@launch
                        }
                        
                        Log.i(TAG, "📸 Screenshot captured: ${screenshot.width}x${screenshot.height}")
                        
                        try {
                            // Convert HARDWARE bitmap to SOFTWARE bitmap for pixel access
                            val softwareScreenshot = screenshot.copy(android.graphics.Bitmap.Config.ARGB_8888, false)
                            val softwareTemplate = templateBitmap.copy(android.graphics.Bitmap.Config.ARGB_8888, false)
                            
                            // Recycle original bitmaps
                            screenshot.recycle()
                            templateBitmap.recycle()
                            
                            if (softwareScreenshot == null || softwareTemplate == null) {
                                Log.e(TAG, "❌ Failed to convert bitmaps to software format")
                                softwareScreenshot?.recycle()
                                softwareTemplate?.recycle()
                                publishEvent("find:icon:result", mapOf(
                                    "success" to false,
                                    "error" to "Bitmap conversion failed"
                                ))
                                return@launch
                            }
                            
                            Log.i(TAG, "🔄 Converted to software bitmaps: ${softwareScreenshot.width}x${softwareScreenshot.height}")
                            
                            // Use TemplateMatchingService to find template
                            val templateMatcher = com.agent.portal.vision.TemplateMatchingService()
                            val result = templateMatcher.findTemplate(softwareScreenshot, softwareTemplate)
                            
                            // Recycle software bitmaps after matching
                            softwareScreenshot.recycle()
                            softwareTemplate.recycle()
                            
                            if (result != null && result.score >= minConfidence) {
                                Log.i(TAG, "✅ Icon found at (${result.x}, ${result.y}) with confidence ${result.score}")
                                publishEvent("find:icon:result", mapOf(
                                    "success" to true,
                                    "found" to true,
                                    "x" to result.x,
                                    "y" to result.y,
                                    "confidence" to result.score,
                                    "width" to result.width,
                                    "height" to result.height,
                                    "device_id" to (deviceId ?: "unknown")
                                ))
                            } else {
                                Log.w(TAG, "⚠️ Icon not found or confidence too low: ${result?.score ?: 0}")
                                publishEvent("find:icon:result", mapOf(
                                    "success" to true,
                                    "found" to false,
                                    "confidence" to (result?.score ?: 0.0),
                                    "error" to "Icon not found on screen",
                                    "device_id" to (deviceId ?: "unknown")
                                ))
                            }
                        } catch (e: Exception) {
                            Log.e(TAG, "❌ Template matching failed", e)
                            screenshot.recycle()
                            templateBitmap.recycle()
                            publishEvent("find:icon:result", mapOf(
                                "success" to false,
                                "error" to (e.message ?: "Template matching failed")
                            ))
                        }
                    }
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "❌ Find icon failed", e)
                publishEvent("find:icon:result", mapOf(
                    "success" to false,
                    "error" to (e.message ?: "Unknown error")
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

    /**
     * Try to get app icon from PackageManager based on app name
     * Returns base64 encoded PNG or null if not found
     */
    private fun tryGetAppIcon(appName: String, maxSize: Int): String? {
        try {
            val context = contextRef?.get() ?: return null
            val pm = context.packageManager
            
            // Get all installed apps
            val apps = pm.getInstalledApplications(android.content.pm.PackageManager.GET_META_DATA)
            
            // Find app that matches the name (case insensitive)
            val normalizedName = appName.lowercase().trim()
            val matchingApp = apps.find { app ->
                try {
                    val label = pm.getApplicationLabel(app).toString().lowercase()
                    label == normalizedName || label.contains(normalizedName) || normalizedName.contains(label)
                } catch (e: Exception) {
                    false
                }
            }
            
            if (matchingApp == null) {
                Log.d(TAG, "No matching app found for: $appName")
                return null
            }
            
            // Get app icon
            val drawable = pm.getApplicationIcon(matchingApp)
            
            // Convert drawable to bitmap
            val iconBitmap = when (drawable) {
                is android.graphics.drawable.BitmapDrawable -> drawable.bitmap
                is android.graphics.drawable.AdaptiveIconDrawable -> {
                    // Handle adaptive icons (Android 8+)
                    val size = maxSize
                    val bitmap = android.graphics.Bitmap.createBitmap(size, size, android.graphics.Bitmap.Config.ARGB_8888)
                    val canvas = android.graphics.Canvas(bitmap)
                    drawable.setBounds(0, 0, size, size)
                    drawable.draw(canvas)
                    bitmap
                }
                else -> {
                    // Generic drawable
                    val size = maxSize
                    val bitmap = android.graphics.Bitmap.createBitmap(size, size, android.graphics.Bitmap.Config.ARGB_8888)
                    val canvas = android.graphics.Canvas(bitmap)
                    drawable.setBounds(0, 0, size, size)
                    drawable.draw(canvas)
                    bitmap
                }
            }
            
            // Scale if needed
            val scaledBitmap = if (iconBitmap.width > maxSize || iconBitmap.height > maxSize) {
                val scale = maxSize.toFloat() / maxOf(iconBitmap.width, iconBitmap.height)
                android.graphics.Bitmap.createScaledBitmap(
                    iconBitmap,
                    (iconBitmap.width * scale).toInt().coerceAtLeast(1),
                    (iconBitmap.height * scale).toInt().coerceAtLeast(1),
                    true
                )
            } else {
                iconBitmap
            }
            
            // Encode to base64
            val stream = java.io.ByteArrayOutputStream()
            scaledBitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, stream)
            val base64 = android.util.Base64.encodeToString(stream.toByteArray(), android.util.Base64.NO_WRAP)
            
            Log.i(TAG, "✅ Got app icon from PackageManager: $appName -> ${matchingApp.packageName}")
            
            if (scaledBitmap != iconBitmap) scaledBitmap.recycle()
            
            return base64
            
        } catch (e: Exception) {
            Log.w(TAG, "Failed to get app icon for $appName: ${e.message}")
            return null
        }
    }

    /**
     * Smart bounds crop with intelligent icon/text separation
     * 
     * Strategy:
     * 1. Find edges with UNIFORM color/transparency (padding)
     * 2. Use horizontal projection to detect gap between icon and text
     * 3. Crop to icon region only (before gap)
     * 
     * @param bitmap Input bitmap
     * @return Tightly cropped icon (no text)
     */
    private fun smartCropIconBounds(bitmap: android.graphics.Bitmap): android.graphics.Bitmap {
        try {
            val width = bitmap.width
            val height = bitmap.height
            
            Log.d(TAG, "   Smart bounds: Input ${width}x${height}")
            
            if (width < 10 || height < 10) return bitmap
            
            // ========== STEP 1: Detect Uniform Padding Edges ==========
            // Sample corner to detect padding color
            val corner = bitmap.getPixel(0, 0)
            val threshold = 50.0
            
            // Find top content edge
            var top = 0
            rowLoop@ for (y in 0 until height) {
                for (x in 0 until width) {
                    val pixel = bitmap.getPixel(x, y)
                    if (colorDistanceInt(pixel, corner) > threshold) {
                        top = y
                        break@rowLoop
                    }
                }
            }
            
            // Find bottom content edge  
            var bottom = height - 1
            rowLoop@ for (y in height - 1 downTo 0) {
                for (x in 0 until width) {
                    val pixel = bitmap.getPixel(x, y)
                    if (colorDistanceInt(pixel, corner) > threshold) {
                        bottom = y
                        break@rowLoop
                    }
                }
            }
            
            // Find left content edge
            var left = 0
            colLoop@ for (x in 0 until width) {
                for (y in 0 until height) {
                    val pixel = bitmap.getPixel(x, y)
                    if (colorDistanceInt(pixel, corner) > threshold) {
                        left = x
                        break@colLoop
                    }
                }
            }
            
            // Find right content edge
            var right = width - 1
            colLoop@ for (x in width - 1 downTo 0) {
                for (y in 0 until height) {
                    val pixel = bitmap.getPixel(x, y)
                    if (colorDistanceInt(pixel, corner) > threshold) {
                        right = x
                        break@colLoop
                    }
                }
            }
            
            Log.d(TAG, "   Content bounds: top=$top, bottom=$bottom, left=$left, right=$right")
            
            if (right <= left || bottom <= top) {
                Log.d(TAG, "   No content bounds found, keeping original")
                return bitmap
            }
            
            // ========== STEP 2: Intelligent Icon/Text Separation ==========
            // Use horizontal projection to detect gap between icon and text
            
            val contentHeight = bottom - top + 1
            val rowDensities = IntArray(contentHeight)
            
            // Calculate pixel density for each row in content region
            for (y in 0 until contentHeight) {
                val actualY = top + y
                var contentPixels = 0
                for (x in left..right) {
                    val pixel = bitmap.getPixel(x, actualY)
                    if (colorDistanceInt(pixel, corner) > threshold) {
                        contentPixels++
                    }
                }
                rowDensities[y] = contentPixels
            }
            
            // Find the largest gap (consecutive low-density rows)
            var maxGapStart = -1
            var maxGapLength = 0
            var currentGapStart = -1
            var currentGapLength = 0
            
            val lowDensityThreshold = (right - left + 1) * 0.2 // 20% of width
            
            for (y in 0 until contentHeight) {
                if (rowDensities[y] < lowDensityThreshold) {
                    // Low density row (gap)
                    if (currentGapStart == -1) {
                        currentGapStart = y
                        currentGapLength = 1
                    } else {
                        currentGapLength++
                    }
                } else {
                    // High density row (content)
                    if (currentGapLength > maxGapLength) {
                        maxGapStart = currentGapStart
                        maxGapLength = currentGapLength
                    }
                    currentGapStart = -1
                    currentGapLength = 0
                }
            }
            
            // Check final gap
            if (currentGapLength > maxGapLength) {
                maxGapStart = currentGapStart
                maxGapLength = currentGapLength
            }
            
            val originalBottom = bottom
            
            if (maxGapStart > 0 && maxGapLength >= 2) {
                // Found significant gap - crop before it
                bottom = top + maxGapStart - 1
                Log.d(TAG, "   Gap detected: rows $maxGapStart-${maxGapStart + maxGapLength - 1} (length=$maxGapLength)")
                Log.d(TAG, "   Cropping to icon region: bottom $originalBottom -> $bottom")
            } else {
                // No clear gap - use top 50% as fallback
                val iconHeight = (contentHeight * 0.5).toInt()
                bottom = top + iconHeight
                Log.d(TAG, "   No clear gap, using top 50%: bottom $originalBottom -> $bottom")
            }
            
            // Add minimal padding
            val padding = 1
            left = (left - padding).coerceAtLeast(0)
            top = (top - padding).coerceAtLeast(0)
            right = (right + padding).coerceAtMost(width - 1)
            bottom = (bottom + padding).coerceAtMost(height - 1)
            
            val finalWidth = right - left + 1
            val finalHeight = bottom - top + 1
            
            Log.d(TAG, "   Final dimensions: ${finalWidth}x${finalHeight}")
            
            // Verify sensible dimensions
            if (finalWidth < 8 || finalHeight < 8) {
                Log.d(TAG, "   Result too small, keeping original")
                return bitmap
            }
            
            // ========== STEP 3: Crop ==========
            val cropped = android.graphics.Bitmap.createBitmap(bitmap, left, top, finalWidth, finalHeight)
            
            val removedRatio = 1.0 - (finalWidth * finalHeight).toDouble() / (width * height)
            Log.i(TAG, "✅ Bounds cropped: ${width}x${height} -> ${finalWidth}x${finalHeight} (${"%.1f".format(removedRatio * 100)}% removed, icon only)")
            
            return cropped
            
        } catch (e: Exception) {
            Log.w(TAG, "⚠️ Bounds crop failed: ${e.message}")
            return bitmap
        }
    }
    
    /**
     * Color distance for Int pixel values
     */
    private fun colorDistanceInt(pixel1: Int, pixel2: Int): Double {
        val r1 = (pixel1 shr 16) and 0xFF
        val g1 = (pixel1 shr 8) and 0xFF
        val b1 = pixel1 and 0xFF
        
        val r2 = (pixel2 shr 16) and 0xFF
        val g2 = (pixel2 shr 8) and 0xFF
        val b2 = pixel2 and 0xFF
        
        return kotlin.math.sqrt(
            ((r1 - r2) * (r1 - r2) +
             (g1 - g2) * (g1 - g2) +
             (b1 - b2) * (b1 - b2)).toDouble()
        )
    }

    /**
     * Remove uniform background from bitmap (both dark and light backgrounds)
     * Detects edge color and removes similar colored pixels to make them transparent
     */
    private fun removeDarkBackground(bitmap: android.graphics.Bitmap): android.graphics.Bitmap {
        try {
            val width = bitmap.width
            val height = bitmap.height
            
            if (width < 10 || height < 10) return bitmap
            
            // Create mutable bitmap with alpha channel
            val result = android.graphics.Bitmap.createBitmap(width, height, android.graphics.Bitmap.Config.ARGB_8888)
            val canvas = android.graphics.Canvas(result)
            canvas.drawBitmap(bitmap, 0f, 0f, null)
            
            // Get all pixels
            val pixels = IntArray(width * height)
            result.getPixels(pixels, 0, width, 0, 0, width, height)
            
            // Sample corner pixels to detect background color
            val cornerSamples = mutableListOf<Int>()
            val sampleSize = 3
            
            // Top-left corner
            for (y in 0 until sampleSize) {
                for (x in 0 until sampleSize) {
                    cornerSamples.add(pixels[y * width + x])
                }
            }
            // Top-right corner
            for (y in 0 until sampleSize) {
                for (x in width - sampleSize until width) {
                    cornerSamples.add(pixels[y * width + x])
                }
            }
            // Bottom-left corner  
            for (y in height - sampleSize until height) {
                for (x in 0 until sampleSize) {
                    cornerSamples.add(pixels[y * width + x])
                }
            }
            // Bottom-right corner
            for (y in height - sampleSize until height) {
                for (x in width - sampleSize until width) {
                    cornerSamples.add(pixels[y * width + x])
                }
            }
            
            // Calculate average corner color
            var avgR = 0
            var avgG = 0
            var avgB = 0
            for (pixel in cornerSamples) {
                avgR += (pixel shr 16) and 0xFF
                avgG += (pixel shr 8) and 0xFF
                avgB += pixel and 0xFF
            }
            avgR /= cornerSamples.size
            avgG /= cornerSamples.size
            avgB /= cornerSamples.size
            
            // Check if corners are uniform (low variance)
            var variance = 0
            for (pixel in cornerSamples) {
                val r = (pixel shr 16) and 0xFF
                val g = (pixel shr 8) and 0xFF
                val b = pixel and 0xFF
                variance += kotlin.math.abs(r - avgR) + kotlin.math.abs(g - avgG) + kotlin.math.abs(b - avgB)
            }
            variance /= cornerSamples.size
            
            // If corners aren't uniform (variance > 30), don't remove background
            if (variance > 30) {
                Log.d(TAG, "Icon corners not uniform (variance=$variance), keeping original")
                return bitmap
            }
            
            // Tolerance for background color matching
            val tolerance = 35
            
            // Make background pixels transparent
            var pixelsRemoved = 0
            for (i in pixels.indices) {
                val pixel = pixels[i]
                val r = (pixel shr 16) and 0xFF
                val g = (pixel shr 8) and 0xFF
                val b = pixel and 0xFF
                
                // Check if similar to background color
                val diffR = kotlin.math.abs(r - avgR)
                val diffG = kotlin.math.abs(g - avgG)
                val diffB = kotlin.math.abs(b - avgB)
                
                if (diffR < tolerance && diffG < tolerance && diffB < tolerance) {
                    pixels[i] = 0x00000000 // Transparent
                    pixelsRemoved++
                }
            }
            
            // Only apply if we removed a reasonable amount (10-90%)
            val removalRatio = pixelsRemoved.toFloat() / pixels.size
            if (removalRatio < 0.1f || removalRatio > 0.9f) {
                Log.d(TAG, "Background removal ratio out of range (${"%.1f".format(removalRatio * 100)}%), keeping original")
                return bitmap
            }
            
            result.setPixels(pixels, 0, width, 0, 0, width, height)
            Log.d(TAG, "Removed background: ${pixelsRemoved} pixels (${"%.1f".format(removalRatio * 100)}%), bg color=($avgR,$avgG,$avgB)")
            return result
            
        } catch (e: Exception) {
            Log.w(TAG, "Failed to remove background: ${e.message}")
            return bitmap
        }
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

    @SerializedName("flow_id")
    val flowId: Int? = null,

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
