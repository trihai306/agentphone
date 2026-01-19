package com.agent.portal.server

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.graphics.Bitmap
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Base64
import android.util.Log
import androidx.core.app.NotificationCompat
import com.agent.portal.MainActivity
import com.agent.portal.R
import com.agent.portal.accessibility.PortalAccessibilityService
import com.agent.portal.keyboard.PortalKeyboardIME
import com.agent.portal.overlay.OverlayService
import com.agent.portal.recording.RecordingManager
import com.agent.portal.recording.RealTimeUploader
import com.google.gson.Gson
import fi.iki.elonen.NanoHTTPD
import java.io.ByteArrayOutputStream
import kotlin.concurrent.thread

/**
 * HTTP Server Service for agent communication
 * With API Key authentication for security
 */
class HttpServerService : Service() {

    companion object {
        private const val TAG = "HttpServerService"
        private const val PORT = 8080
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "agent_portal_channel"

        // API Key settings
        private const val PREFS_NAME = "http_server_settings"
        private const val KEY_API_KEY = "api_key"
        private const val KEY_API_KEY_ENABLED = "api_key_enabled"
        private const val HEADER_API_KEY = "X-API-Key"
        private const val HEADER_AUTHORIZATION = "Authorization"

        @Volatile
        var instance: HttpServerService? = null
            private set

        fun isRunning(): Boolean = instance?.server?.isAlive == true

        /**
         * Generate a new random API key
         */
        fun generateApiKey(): String {
            val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
            return (1..32).map { chars.random() }.joinToString("")
        }
    }

    private var server: PortalHttpServer? = null
    private val gson = Gson()
    private val mainHandler = Handler(Looper.getMainLooper())

    // API Key settings
    private var apiKey: String? = null
    private var apiKeyEnabled: Boolean = false

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannel()
        loadApiKeySettings()
    }

    /**
     * Load API key settings from SharedPreferences
     */
    private fun loadApiKeySettings() {
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        apiKeyEnabled = prefs.getBoolean(KEY_API_KEY_ENABLED, false)
        apiKey = prefs.getString(KEY_API_KEY, null)

        if (apiKeyEnabled && apiKey == null) {
            // Generate a new API key if enabled but not set
            apiKey = generateApiKey()
            prefs.edit().putString(KEY_API_KEY, apiKey).apply()
            Log.i(TAG, "Generated new API key")
        }

        Log.i(TAG, "API Key authentication: ${if (apiKeyEnabled) "enabled" else "disabled"}")
    }

    /**
     * Enable or disable API key authentication
     */
    fun setApiKeyEnabled(enabled: Boolean) {
        apiKeyEnabled = enabled
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        prefs.edit().putBoolean(KEY_API_KEY_ENABLED, enabled).apply()

        if (enabled && apiKey == null) {
            apiKey = generateApiKey()
            prefs.edit().putString(KEY_API_KEY, apiKey).apply()
        }

        Log.i(TAG, "API Key authentication ${if (enabled) "enabled" else "disabled"}")
    }

    /**
     * Get the current API key
     */
    fun getApiKey(): String? = apiKey

    /**
     * Regenerate the API key
     */
    fun regenerateApiKey(): String {
        apiKey = generateApiKey()
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        prefs.edit().putString(KEY_API_KEY, apiKey).apply()
        Log.i(TAG, "API key regenerated")
        return apiKey!!
    }

    /**
     * Check if API key authentication is enabled
     */
    fun isApiKeyEnabled(): Boolean = apiKeyEnabled

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, createNotification())

        if (server == null || !server!!.isAlive) {
            startServer()
        }
        
        // Initialize and connect SocketJobManager in foreground service
        // This ensures socket stays connected even when app is in background
        initSocketConnection()

        return START_STICKY
    }
    
    /**
     * Initialize Socket connection in foreground service context
     * This keeps the socket alive when app goes to background
     */
    private fun initSocketConnection() {
        try {
            val sessionManager = com.agent.portal.auth.SessionManager(this)
            val session = sessionManager.getSession()
            
            if (session != null && !com.agent.portal.socket.SocketJobManager.isConnected()) {
                // Get Soketi config
                val soketiHost = if (com.agent.portal.utils.NetworkUtils.isEmulator()) {
                    "10.0.2.2"
                } else {
                    "192.168.1.11" // Your local machine IP
                }
                val soketiPort = 6001
                val soketiKey = "app-key"
                
                // Initialize and connect
                com.agent.portal.socket.SocketJobManager.init(
                    this,
                    soketiKey,
                    soketiHost,
                    soketiPort,
                    false
                )
                com.agent.portal.socket.SocketJobManager.connect()
                
                Log.i(TAG, "✅ Socket connection initialized in foreground service")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to init socket in foreground service", e)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        
        // Disconnect socket when service is stopped
        try {
            com.agent.portal.socket.SocketJobManager.disconnect()
            Log.i(TAG, "Socket disconnected on service destroy")
        } catch (e: Exception) {
            Log.e(TAG, "Error disconnecting socket", e)
        }
        
        stopServer()
        instance = null
    }

    private fun startServer() {
        thread {
            try {
                // Stop any existing server first
                server?.let {
                    try {
                        it.stop()
                    } catch (e: Exception) {
                        Log.w(TAG, "Error stopping existing server", e)
                    }
                }
                server = null

                // Small delay to allow port to be released
                Thread.sleep(100)

                server = PortalHttpServer(PORT)
                server?.start(NanoHTTPD.SOCKET_READ_TIMEOUT, false)
                Log.i(TAG, "HTTP Server started on port $PORT")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start HTTP server", e)
                // If port is in use, try to clean up and notify user
                if (e is java.net.BindException) {
                    mainHandler.post {
                        stopSelf()
                    }
                }
            }
        }
    }

    private fun stopServer() {
        try {
            server?.stop()
        } catch (e: Exception) {
            Log.w(TAG, "Error stopping server", e)
        }
        server = null
        Log.i(TAG, "HTTP Server stopped")
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                getString(R.string.notification_channel_name),
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.notification_title))
            .setContentText(getString(R.string.notification_text))
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    /**
     * NanoHTTPD Server implementation
     */
    inner class PortalHttpServer(port: Int) : NanoHTTPD(port) {

        override fun serve(session: IHTTPSession): Response {
            val uri = session.uri
            val method = session.method

            Log.d(TAG, "Request: $method $uri")

            // Check API key authentication (skip for /ping and /api/key endpoints)
            if (apiKeyEnabled && uri != "/ping" && !uri.startsWith("/api/key")) {
                val authResult = checkApiKeyAuth(session)
                if (authResult != null) {
                    return authResult
                }
            }

            return try {
                when {
                    uri == "/ping" -> handlePing()
                    // API Key management endpoints
                    uri == "/api/key/status" && method == Method.GET -> handleGetApiKeyStatus()
                    uri == "/api/key/enable" && method == Method.POST -> handleEnableApiKey(session)
                    uri == "/api/key/regenerate" && method == Method.POST -> handleRegenerateApiKey()
                    uri == "/state" -> handleGetState()
                    uri == "/screenshot" -> handleScreenshot(session)
                    uri == "/keyboard/input" && method == Method.POST -> handleKeyboardInput(session)
                    uri == "/overlay" && method == Method.POST -> handleOverlay(session)
                    uri == "/overlay" && method == Method.GET -> handleGetOverlayStatus()
                    // Action endpoints
                    uri == "/action/click" && method == Method.POST -> handleClick(session)
                    uri == "/action/longclick" && method == Method.POST -> handleLongClick(session)
                    uri == "/action/setText" && method == Method.POST -> handleSetText(session)
                    uri == "/action/scroll" && method == Method.POST -> handleScroll(session)
                    uri == "/action/focus" && method == Method.POST -> handleFocus(session)
                    uri == "/action/global" && method == Method.POST -> handleGlobalAction(session)
                    uri == "/action/node" && method == Method.GET -> handleGetNodeInfo(session)
                    // Gesture endpoints (coordinate-based)
                    uri == "/action/tap" && method == Method.POST -> handleTapCoordinates(session)
                    uri == "/action/swipe" && method == Method.POST -> handleSwipe(session)
                    uri == "/action/drag" && method == Method.POST -> handleDrag(session)
                    uri == "/action/longpress" && method == Method.POST -> handleLongPress(session)
                    uri == "/action/pressKey" && method == Method.POST -> handlePressKey(session)
                    // App management endpoints
                    uri == "/app/start" && method == Method.POST -> handleStartApp(session)
                    uri == "/app/packages" && method == Method.GET -> handleGetPackages(session)
                    // Recording endpoints
                    uri == "/recording/start" && method == Method.POST -> handleStartRecording(session)
                    uri == "/recording/stop" && method == Method.POST -> handleStopRecording(session)
                    uri == "/recording/pause" && method == Method.POST -> handlePauseRecording(session)
                    uri == "/recording/resume" && method == Method.POST -> handleResumeRecording(session)
                    uri == "/recording/events" && method == Method.GET -> handleGetRecordingEvents(session)
                    uri == "/recording/status" && method == Method.GET -> handleGetRecordingStatus()
                    uri == "/recording/config/realtime" && method == Method.POST -> handleConfigRealTimeUpload(session)
                    uri == "/recording/config/realtime" && method == Method.GET -> handleGetRealTimeUploadStatus()
                    else -> newFixedLengthResponse(
                        Response.Status.NOT_FOUND,
                        MIME_PLAINTEXT,
                        "Not Found"
                    )
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error handling request", e)
                newFixedLengthResponse(
                    Response.Status.INTERNAL_ERROR,
                    "application/json",
                    gson.toJson(mapOf("status" to "error", "error" to e.message))
                )
            }
        }

        // ====================================================================
        // API KEY AUTHENTICATION
        // ====================================================================

        /**
         * Check API key authentication
         * @return null if authenticated, Response with error if not
         */
        private fun checkApiKeyAuth(session: IHTTPSession): Response? {
            // Get API key from headers
            val providedKey = session.headers[HEADER_API_KEY.lowercase()]
                ?: session.headers[HEADER_AUTHORIZATION.lowercase()]?.removePrefix("Bearer ")

            if (providedKey == null) {
                Log.w(TAG, "API key missing in request")
                return newFixedLengthResponse(
                    Response.Status.UNAUTHORIZED,
                    "application/json",
                    gson.toJson(mapOf(
                        "status" to "error",
                        "error" to "API key required. Include '$HEADER_API_KEY' header."
                    ))
                )
            }

            if (providedKey != apiKey) {
                Log.w(TAG, "Invalid API key provided")
                return newFixedLengthResponse(
                    Response.Status.FORBIDDEN,
                    "application/json",
                    gson.toJson(mapOf(
                        "status" to "error",
                        "error" to "Invalid API key"
                    ))
                )
            }

            // Authentication successful
            return null
        }

        /**
         * Get API key status
         */
        private fun handleGetApiKeyStatus(): Response {
            return newFixedLengthResponse(
                Response.Status.OK,
                "application/json",
                gson.toJson(mapOf(
                    "status" to "success",
                    "data" to mapOf(
                        "enabled" to apiKeyEnabled,
                        "key" to if (apiKeyEnabled) apiKey else null
                    )
                ))
            )
        }

        /**
         * Enable/disable API key authentication
         */
        private fun handleEnableApiKey(session: IHTTPSession): Response {
            val requestData = parseRequestBody(session)
                ?: return badRequestResponse("Invalid JSON")

            val enabled = requestData["enabled"] as? Boolean
                ?: return badRequestResponse("Missing 'enabled' parameter")

            setApiKeyEnabled(enabled)

            return newFixedLengthResponse(
                Response.Status.OK,
                "application/json",
                gson.toJson(mapOf(
                    "status" to "success",
                    "message" to "API key authentication ${if (enabled) "enabled" else "disabled"}",
                    "data" to mapOf(
                        "enabled" to apiKeyEnabled,
                        "key" to if (apiKeyEnabled) apiKey else null
                    )
                ))
            )
        }

        /**
         * Regenerate API key
         */
        private fun handleRegenerateApiKey(): Response {
            val newKey = regenerateApiKey()

            return newFixedLengthResponse(
                Response.Status.OK,
                "application/json",
                gson.toJson(mapOf(
                    "status" to "success",
                    "message" to "API key regenerated",
                    "data" to mapOf(
                        "key" to newKey
                    )
                ))
            )
        }

        private fun handlePing(): Response {
            val response = mapOf(
                "status" to "success",
                "message" to "pong",
                "timestamp" to System.currentTimeMillis()
            )
            return newFixedLengthResponse(
                Response.Status.OK,
                "application/json",
                gson.toJson(response)
            )
        }

        private fun handleGetState(): Response {
            val a11yService = PortalAccessibilityService.instance
                ?: return newFixedLengthResponse(
                    Response.Status.SERVICE_UNAVAILABLE,
                    "application/json",
                    gson.toJson(mapOf(
                        "status" to "error",
                        "error" to "Accessibility service not running"
                    ))
                )

            val a11yTree = a11yService.getA11yTree().map { it.toMap() }
            val phoneState = a11yService.getPhoneState().toMap()

            val stateData = mapOf(
                "a11y_tree" to a11yTree,
                "phone_state" to phoneState
            )

            val response = mapOf(
                "status" to "success",
                "data" to gson.toJson(stateData)
            )

            return newFixedLengthResponse(
                Response.Status.OK,
                "application/json",
                gson.toJson(response)
            )
        }

        private fun handleScreenshot(session: IHTTPSession): Response {
            val a11yService = PortalAccessibilityService.instance
                ?: return newFixedLengthResponse(
                    Response.Status.SERVICE_UNAVAILABLE,
                    "application/json",
                    gson.toJson(mapOf(
                        "status" to "error",
                        "error" to "Accessibility service not running"
                    ))
                )

            // Check for hideOverlay parameter
            val params = session.parameters
            val hideOverlay = params["hideOverlay"]?.firstOrNull()?.toBoolean() ?: true

            var resultBitmap: Bitmap? = null
            val latch = java.util.concurrent.CountDownLatch(1)

            a11yService.takeScreenshot { bitmap ->
                resultBitmap = bitmap
                latch.countDown()
            }

            // Wait for screenshot (max 5 seconds)
            latch.await(5, java.util.concurrent.TimeUnit.SECONDS)

            return if (resultBitmap != null) {
                val outputStream = ByteArrayOutputStream()
                resultBitmap!!.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
                val base64 = Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)

                val response = mapOf(
                    "status" to "success",
                    "data" to base64
                )
                newFixedLengthResponse(
                    Response.Status.OK,
                    "application/json",
                    gson.toJson(response)
                )
            } else {
                newFixedLengthResponse(
                    Response.Status.INTERNAL_ERROR,
                    "application/json",
                    gson.toJson(mapOf(
                        "status" to "error",
                        "error" to "Failed to take screenshot"
                    ))
                )
            }
        }

        private fun handleKeyboardInput(session: IHTTPSession): Response {
            // Parse request body
            val files = HashMap<String, String>()
            session.parseBody(files)

            val body = files["postData"] ?: session.queryParameterString ?: ""
            val requestData = try {
                gson.fromJson(body, Map::class.java) as Map<String, Any>
            } catch (e: Exception) {
                return newFixedLengthResponse(
                    Response.Status.BAD_REQUEST,
                    "application/json",
                    gson.toJson(mapOf("status" to "error", "error" to "Invalid JSON"))
                )
            }

            val base64Text = requestData["base64_text"] as? String
                ?: return newFixedLengthResponse(
                    Response.Status.BAD_REQUEST,
                    "application/json",
                    gson.toJson(mapOf("status" to "error", "error" to "Missing base64_text"))
                )

            // Decode and send to keyboard
            val text = String(Base64.decode(base64Text, Base64.DEFAULT))

            val keyboard = PortalKeyboardIME.instance
            if (keyboard != null) {
                keyboard.inputText(text)
                return newFixedLengthResponse(
                    Response.Status.OK,
                    "application/json",
                    gson.toJson(mapOf("status" to "success"))
                )
            } else {
                return newFixedLengthResponse(
                    Response.Status.SERVICE_UNAVAILABLE,
                    "application/json",
                    gson.toJson(mapOf(
                        "status" to "error",
                        "error" to "Keyboard service not running"
                    ))
                )
            }
        }

        private fun handleGetOverlayStatus(): Response {
            val response = mapOf(
                "status" to "success",
                "data" to mapOf(
                    "showBounds" to OverlayService.showBounds,
                    "showIndexes" to OverlayService.showIndexes,
                    "isRunning" to OverlayService.isRunning()
                )
            )
            return newFixedLengthResponse(
                Response.Status.OK,
                "application/json",
                gson.toJson(response)
            )
        }

        private fun handleOverlay(session: IHTTPSession): Response {
            // Parse request body
            val files = HashMap<String, String>()
            session.parseBody(files)

            val body = files["postData"] ?: session.queryParameterString ?: ""
            val requestData = try {
                gson.fromJson(body, Map::class.java) as Map<String, Any>
            } catch (e: Exception) {
                return newFixedLengthResponse(
                    Response.Status.BAD_REQUEST,
                    "application/json",
                    gson.toJson(mapOf("status" to "error", "error" to "Invalid JSON"))
                )
            }

            val action = requestData["action"] as? String
            val showBounds = requestData["showBounds"] as? Boolean
            val showIndexes = requestData["showIndexes"] as? Boolean

            // Handle different actions
            when (action) {
                "show_bounds" -> {
                    startOverlayService(OverlayService.Actions.SHOW_BOUNDS)
                }
                "hide_bounds" -> {
                    startOverlayService(OverlayService.Actions.HIDE_BOUNDS)
                }
                "show_indexes" -> {
                    startOverlayService(OverlayService.Actions.SHOW_INDEXES)
                }
                "hide_indexes" -> {
                    startOverlayService(OverlayService.Actions.HIDE_INDEXES)
                }
                "toggle_bounds" -> {
                    startOverlayService(OverlayService.Actions.TOGGLE_BOUNDS)
                }
                "toggle_indexes" -> {
                    startOverlayService(OverlayService.Actions.TOGGLE_INDEXES)
                }
                "refresh" -> {
                    startOverlayService(OverlayService.Actions.REFRESH)
                }
                "stop" -> {
                    startOverlayService(OverlayService.Actions.STOP)
                }
                "set" -> {
                    // Set specific states
                    if (showBounds != null) {
                        if (showBounds) {
                            startOverlayService(OverlayService.Actions.SHOW_BOUNDS)
                        } else {
                            startOverlayService(OverlayService.Actions.HIDE_BOUNDS)
                        }
                    }
                    if (showIndexes != null) {
                        if (showIndexes) {
                            startOverlayService(OverlayService.Actions.SHOW_INDEXES)
                        } else {
                            startOverlayService(OverlayService.Actions.HIDE_INDEXES)
                        }
                    }
                }
                else -> {
                    return newFixedLengthResponse(
                        Response.Status.BAD_REQUEST,
                        "application/json",
                        gson.toJson(mapOf(
                            "status" to "error",
                            "error" to "Invalid action. Valid actions: show_bounds, hide_bounds, show_indexes, hide_indexes, toggle_bounds, toggle_indexes, refresh, stop, set"
                        ))
                    )
                }
            }

            return newFixedLengthResponse(
                Response.Status.OK,
                "application/json",
                gson.toJson(mapOf(
                    "status" to "success",
                    "showBounds" to OverlayService.showBounds,
                    "showIndexes" to OverlayService.showIndexes
                ))
            )
        }

        private fun startOverlayService(action: String) {
            mainHandler.post {
                val intent = Intent(this@HttpServerService, OverlayService::class.java).apply {
                    this.action = action
                }
                // For STOP action, use stopService to avoid ForegroundServiceDidNotStartInTimeException
                if (action == OverlayService.Actions.STOP) {
                    stopService(intent)
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(intent)
                } else {
                    startService(intent)
                }
            }
        }

        // ====================================================================
        // ACTION HANDLERS - Execute actions via Accessibility Service
        // ====================================================================

        private fun handleClick(session: IHTTPSession): Response {
            val a11yService = PortalAccessibilityService.instance
                ?: return serviceUnavailableResponse()

            val requestData = parseRequestBody(session)
                ?: return badRequestResponse("Invalid JSON")

            val index = (requestData["index"] as? Number)?.toInt()
                ?: return badRequestResponse("Missing 'index' parameter")

            val result = a11yService.clickByIndex(index)
            return actionResultResponse(result)
        }

        private fun handleLongClick(session: IHTTPSession): Response {
            val a11yService = PortalAccessibilityService.instance
                ?: return serviceUnavailableResponse()

            val requestData = parseRequestBody(session)
                ?: return badRequestResponse("Invalid JSON")

            val index = (requestData["index"] as? Number)?.toInt()
                ?: return badRequestResponse("Missing 'index' parameter")

            val result = a11yService.longClickByIndex(index)
            return actionResultResponse(result)
        }

        private fun handleSetText(session: IHTTPSession): Response {
            val a11yService = PortalAccessibilityService.instance
                ?: return serviceUnavailableResponse()

            val requestData = parseRequestBody(session)
                ?: return badRequestResponse("Invalid JSON")

            val index = (requestData["index"] as? Number)?.toInt()
                ?: return badRequestResponse("Missing 'index' parameter")

            val text = requestData["text"] as? String
                ?: return badRequestResponse("Missing 'text' parameter")

            val result = a11yService.setTextByIndex(index, text)
            return actionResultResponse(result)
        }

        private fun handleScroll(session: IHTTPSession): Response {
            val a11yService = PortalAccessibilityService.instance
                ?: return serviceUnavailableResponse()

            val requestData = parseRequestBody(session)
                ?: return badRequestResponse("Invalid JSON")

            val index = (requestData["index"] as? Number)?.toInt()
                ?: return badRequestResponse("Missing 'index' parameter")

            val direction = requestData["direction"] as? String ?: "forward"

            val result = a11yService.scrollByIndex(index, direction)
            return actionResultResponse(result)
        }

        private fun handleFocus(session: IHTTPSession): Response {
            val a11yService = PortalAccessibilityService.instance
                ?: return serviceUnavailableResponse()

            val requestData = parseRequestBody(session)
                ?: return badRequestResponse("Invalid JSON")

            val index = (requestData["index"] as? Number)?.toInt()
                ?: return badRequestResponse("Missing 'index' parameter")

            val result = a11yService.focusByIndex(index)
            return actionResultResponse(result)
        }

        private fun handleGlobalAction(session: IHTTPSession): Response {
            val a11yService = PortalAccessibilityService.instance
                ?: return serviceUnavailableResponse()

            val requestData = parseRequestBody(session)
                ?: return badRequestResponse("Invalid JSON")

            val actionName = requestData["action"] as? String
                ?: return badRequestResponse("Missing 'action' parameter")

            // Map action names to Android global action constants
            val actionCode = when (actionName.lowercase()) {
                "back" -> android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK
                "home" -> android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_HOME
                "recents" -> android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_RECENTS
                "notifications" -> android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_NOTIFICATIONS
                "quick_settings" -> android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_QUICK_SETTINGS
                "power_dialog" -> android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_POWER_DIALOG
                "lock_screen" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_LOCK_SCREEN
                } else -1
                "take_screenshot" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_TAKE_SCREENSHOT
                } else -1
                else -> return badRequestResponse("Unknown action: $actionName. Valid: back, home, recents, notifications, quick_settings, power_dialog, lock_screen, take_screenshot")
            }

            if (actionCode == -1) {
                return badRequestResponse("Action '$actionName' not supported on this Android version")
            }

            val success = a11yService.performGlobalAction(actionCode)
            return newFixedLengthResponse(
                if (success) Response.Status.OK else Response.Status.INTERNAL_ERROR,
                "application/json",
                gson.toJson(mapOf(
                    "status" to if (success) "success" else "error",
                    "message" to if (success) "Global action '$actionName' executed" else "Failed to execute global action '$actionName'"
                ))
            )
        }

        private fun handleGetNodeInfo(session: IHTTPSession): Response {
            val a11yService = PortalAccessibilityService.instance
                ?: return serviceUnavailableResponse()

            val params = session.parameters
            val indexStr = params["index"]?.firstOrNull()
                ?: return badRequestResponse("Missing 'index' query parameter")

            val index = indexStr.toIntOrNull()
                ?: return badRequestResponse("Invalid 'index' parameter")

            val nodeInfo = a11yService.getNodeInfo(index)
                ?: return newFixedLengthResponse(
                    Response.Status.NOT_FOUND,
                    "application/json",
                    gson.toJson(mapOf("status" to "error", "error" to "Node with index $index not found"))
                )

            return newFixedLengthResponse(
                Response.Status.OK,
                "application/json",
                gson.toJson(mapOf("status" to "success", "data" to nodeInfo))
            )
        }

        // ====================================================================
        // HELPER METHODS
        // ====================================================================

        private fun parseRequestBody(session: IHTTPSession): Map<String, Any>? {
            return try {
                val files = HashMap<String, String>()
                session.parseBody(files)
                val body = files["postData"] ?: session.queryParameterString ?: ""
                gson.fromJson(body, Map::class.java) as? Map<String, Any>
            } catch (e: Exception) {
                null
            }
        }

        private fun serviceUnavailableResponse(): Response {
            return newFixedLengthResponse(
                Response.Status.SERVICE_UNAVAILABLE,
                "application/json",
                gson.toJson(mapOf("status" to "error", "error" to "Accessibility service not running"))
            )
        }

        private fun badRequestResponse(message: String): Response {
            return newFixedLengthResponse(
                Response.Status.BAD_REQUEST,
                "application/json",
                gson.toJson(mapOf("status" to "error", "error" to message))
            )
        }

        private fun actionResultResponse(result: PortalAccessibilityService.ActionResult): Response {
            return newFixedLengthResponse(
                if (result.success) Response.Status.OK else Response.Status.INTERNAL_ERROR,
                "application/json",
                gson.toJson(mapOf(
                    "status" to if (result.success) "success" else "error",
                    "message" to result.message
                ))
            )
        }

        // ====================================================================
        // GESTURE HANDLERS - Coordinate-based actions
        // ====================================================================

        private fun handleTapCoordinates(session: IHTTPSession): Response {
            val a11yService = PortalAccessibilityService.instance
                ?: return serviceUnavailableResponse()

            val requestData = parseRequestBody(session)
                ?: return badRequestResponse("Invalid JSON")

            val x = (requestData["x"] as? Number)?.toInt()
                ?: return badRequestResponse("Missing 'x' parameter")
            val y = (requestData["y"] as? Number)?.toInt()
                ?: return badRequestResponse("Missing 'y' parameter")

            val result = a11yService.tapAtCoordinates(x, y)
            return actionResultResponse(result)
        }

        private fun handleSwipe(session: IHTTPSession): Response {
            val a11yService = PortalAccessibilityService.instance
                ?: return serviceUnavailableResponse()

            val requestData = parseRequestBody(session)
                ?: return badRequestResponse("Invalid JSON")

            val startX = (requestData["startX"] as? Number)?.toInt()
                ?: return badRequestResponse("Missing 'startX' parameter")
            val startY = (requestData["startY"] as? Number)?.toInt()
                ?: return badRequestResponse("Missing 'startY' parameter")
            val endX = (requestData["endX"] as? Number)?.toInt()
                ?: return badRequestResponse("Missing 'endX' parameter")
            val endY = (requestData["endY"] as? Number)?.toInt()
                ?: return badRequestResponse("Missing 'endY' parameter")
            val duration = (requestData["duration"] as? Number)?.toLong() ?: 300L

            val result = a11yService.swipeGesture(startX, startY, endX, endY, duration)
            return actionResultResponse(result)
        }

        private fun handleDrag(session: IHTTPSession): Response {
            val a11yService = PortalAccessibilityService.instance
                ?: return serviceUnavailableResponse()

            val requestData = parseRequestBody(session)
                ?: return badRequestResponse("Invalid JSON")

            val startX = (requestData["startX"] as? Number)?.toInt()
                ?: return badRequestResponse("Missing 'startX' parameter")
            val startY = (requestData["startY"] as? Number)?.toInt()
                ?: return badRequestResponse("Missing 'startY' parameter")
            val endX = (requestData["endX"] as? Number)?.toInt()
                ?: return badRequestResponse("Missing 'endX' parameter")
            val endY = (requestData["endY"] as? Number)?.toInt()
                ?: return badRequestResponse("Missing 'endY' parameter")
            val duration = (requestData["duration"] as? Number)?.toLong() ?: 500L

            val result = a11yService.dragGesture(startX, startY, endX, endY, duration)
            return actionResultResponse(result)
        }

        private fun handleLongPress(session: IHTTPSession): Response {
            val a11yService = PortalAccessibilityService.instance
                ?: return serviceUnavailableResponse()

            val requestData = parseRequestBody(session)
                ?: return badRequestResponse("Invalid JSON")

            val x = (requestData["x"] as? Number)?.toInt()
                ?: return badRequestResponse("Missing 'x' parameter")
            val y = (requestData["y"] as? Number)?.toInt()
                ?: return badRequestResponse("Missing 'y' parameter")
            val duration = (requestData["duration"] as? Number)?.toLong() ?: 1000L

            val result = a11yService.longPressAtCoordinates(x, y, duration)
            return actionResultResponse(result)
        }

        private fun handlePressKey(session: IHTTPSession): Response {
            val a11yService = PortalAccessibilityService.instance
                ?: return serviceUnavailableResponse()

            val requestData = parseRequestBody(session)
                ?: return badRequestResponse("Invalid JSON")

            val key = requestData["key"] as? String
                ?: return badRequestResponse("Missing 'key' parameter")

            val result = a11yService.pressKey(key)
            return actionResultResponse(result)
        }

        // ====================================================================
        // APP MANAGEMENT HANDLERS
        // ====================================================================

        private fun handleStartApp(session: IHTTPSession): Response {
            val a11yService = PortalAccessibilityService.instance
                ?: return serviceUnavailableResponse()

            val requestData = parseRequestBody(session)
                ?: return badRequestResponse("Invalid JSON")

            val packageName = requestData["package"] as? String
                ?: return badRequestResponse("Missing 'package' parameter")
            val activityName = requestData["activity"] as? String

            val result = a11yService.startApp(packageName, activityName)
            return actionResultResponse(result)
        }

        private fun handleGetPackages(session: IHTTPSession): Response {
            val a11yService = PortalAccessibilityService.instance
                ?: return serviceUnavailableResponse()

            val params = session.parameters
            val includeSystem = params["includeSystem"]?.firstOrNull()?.toBoolean() ?: false

            val packages = a11yService.getInstalledPackages(includeSystem)

            return newFixedLengthResponse(
                Response.Status.OK,
                "application/json",
                gson.toJson(mapOf(
                    "status" to "success",
                    "packages" to packages
                ))
            )
        }

        // ====================================================================
        // RECORDING HANDLERS - Workflow recording control
        // ====================================================================

        private fun handleStartRecording(session: IHTTPSession): Response {
            val result = RecordingManager.startRecording()

            return if (result.success) {
                val status = RecordingManager.getStatus()
                newFixedLengthResponse(
                    Response.Status.OK,
                    "application/json",
                    gson.toJson(mapOf(
                        "status" to "success",
                        "message" to result.message,
                        "data" to status.toMap()
                    ))
                )
            } else {
                newFixedLengthResponse(
                    Response.Status.CONFLICT,
                    "application/json",
                    gson.toJson(mapOf(
                        "status" to "error",
                        "error" to result.message
                    ))
                )
            }
        }

        private fun handleStopRecording(session: IHTTPSession): Response {
            val result = RecordingManager.stopRecording()

            return if (result.success) {
                val events = RecordingManager.getEvents()
                val status = RecordingManager.getStatus()
                newFixedLengthResponse(
                    Response.Status.OK,
                    "application/json",
                    gson.toJson(mapOf(
                        "status" to "success",
                        "message" to result.message,
                        "data" to mapOf(
                            "event_count" to result.eventCount,
                            "duration_ms" to result.duration,
                            "events" to events.map { it.toMap() },
                            "recording_status" to status.toMap()
                        )
                    ))
                )
            } else {
                newFixedLengthResponse(
                    Response.Status.CONFLICT,
                    "application/json",
                    gson.toJson(mapOf(
                        "status" to "error",
                        "error" to result.message
                    ))
                )
            }
        }

        private fun handlePauseRecording(session: IHTTPSession): Response {
            val success = RecordingManager.pauseRecording()

            return if (success) {
                val status = RecordingManager.getStatus()
                newFixedLengthResponse(
                    Response.Status.OK,
                    "application/json",
                    gson.toJson(mapOf(
                        "status" to "success",
                        "message" to "Recording paused",
                        "data" to status.toMap()
                    ))
                )
            } else {
                val state = RecordingManager.getState()
                val error = when (state) {
                    RecordingManager.RecordingState.IDLE -> "No recording in progress"
                    RecordingManager.RecordingState.PAUSED -> "Recording already paused"
                    else -> "Cannot pause recording"
                }
                newFixedLengthResponse(
                    Response.Status.CONFLICT,
                    "application/json",
                    gson.toJson(mapOf(
                        "status" to "error",
                        "error" to error
                    ))
                )
            }
        }

        private fun handleResumeRecording(session: IHTTPSession): Response {
            val success = RecordingManager.resumeRecording()

            return if (success) {
                val status = RecordingManager.getStatus()
                newFixedLengthResponse(
                    Response.Status.OK,
                    "application/json",
                    gson.toJson(mapOf(
                        "status" to "success",
                        "message" to "Recording resumed",
                        "data" to status.toMap()
                    ))
                )
            } else {
                val state = RecordingManager.getState()
                val error = when (state) {
                    RecordingManager.RecordingState.IDLE -> "No recording in progress"
                    RecordingManager.RecordingState.RECORDING -> "Recording is not paused"
                    else -> "Cannot resume recording"
                }
                newFixedLengthResponse(
                    Response.Status.CONFLICT,
                    "application/json",
                    gson.toJson(mapOf(
                        "status" to "error",
                        "error" to error
                    ))
                )
            }
        }

        private fun handleGetRecordingEvents(session: IHTTPSession): Response {
            val params = session.parameters

            // Optional pagination parameters
            val offset = params["offset"]?.firstOrNull()?.toIntOrNull() ?: 0
            val limit = params["limit"]?.firstOrNull()?.toIntOrNull()

            val allEvents = RecordingManager.getEvents()

            // Apply pagination if specified
            val events = if (limit != null) {
                allEvents.drop(offset).take(limit)
            } else {
                allEvents.drop(offset)
            }

            return newFixedLengthResponse(
                Response.Status.OK,
                "application/json",
                gson.toJson(mapOf(
                    "status" to "success",
                    "data" to mapOf(
                        "total_count" to allEvents.size,
                        "offset" to offset,
                        "count" to events.size,
                        "events" to events.map { it.toMap() }
                    )
                ))
            )
        }

        private fun handleGetRecordingStatus(): Response {
            val status = RecordingManager.getStatus()

            return newFixedLengthResponse(
                Response.Status.OK,
                "application/json",
                gson.toJson(mapOf(
                    "status" to "success",
                    "data" to status.toMap()
                ))
            )
        }

        /**
         * Configure real-time upload settings
         * POST /recording/config/realtime
         * Body: { "enabled": true/false, "backend_url": "http://..." }
         */
        private fun handleConfigRealTimeUpload(session: IHTTPSession): Response {
            val body = mutableMapOf<String, String>()
            session.parseBody(body)
            val json = body["postData"] ?: return newFixedLengthResponse(
                Response.Status.BAD_REQUEST,
                "application/json",
                gson.toJson(mapOf("status" to "error", "error" to "Missing body"))
            )

            val data = try {
                gson.fromJson(json, Map::class.java) as Map<*, *>
            } catch (e: Exception) {
                return newFixedLengthResponse(
                    Response.Status.BAD_REQUEST,
                    "application/json",
                    gson.toJson(mapOf("status" to "error", "error" to "Invalid JSON"))
                )
            }

            val enabled = data["enabled"] as? Boolean ?: false
            val backendUrl = data["backend_url"] as? String

            return if (enabled && backendUrl != null) {
                RecordingManager.setRealTimeUploadEnabled(true, backendUrl)
                newFixedLengthResponse(
                    Response.Status.OK,
                    "application/json",
                    gson.toJson(mapOf(
                        "status" to "success",
                        "message" to "Real-time upload enabled",
                        "data" to mapOf(
                            "enabled" to true,
                            "backend_url" to backendUrl
                        )
                    ))
                )
            } else if (!enabled) {
                RecordingManager.setRealTimeUploadEnabled(false)
                newFixedLengthResponse(
                    Response.Status.OK,
                    "application/json",
                    gson.toJson(mapOf(
                        "status" to "success",
                        "message" to "Real-time upload disabled",
                        "data" to mapOf("enabled" to false)
                    ))
                )
            } else {
                newFixedLengthResponse(
                    Response.Status.BAD_REQUEST,
                    "application/json",
                    gson.toJson(mapOf(
                        "status" to "error",
                        "error" to "backend_url is required when enabled=true"
                    ))
                )
            }
        }

        /**
         * Get real-time upload status
         * GET /recording/config/realtime
         */
        private fun handleGetRealTimeUploadStatus(): Response {
            return newFixedLengthResponse(
                Response.Status.OK,
                "application/json",
                gson.toJson(mapOf(
                    "status" to "success",
                    "data" to mapOf(
                        "enabled" to RecordingManager.isRealTimeUploadEnabled(),
                        "pending_uploads" to RealTimeUploader.getPendingCount()
                    )
                ))
            )
        }
    }
}
