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
import com.google.gson.Gson
import fi.iki.elonen.NanoHTTPD
import java.io.ByteArrayOutputStream
import kotlin.concurrent.thread

/**
 * HTTP Server Service for agent communication
 */
class HttpServerService : Service() {

    companion object {
        private const val TAG = "HttpServerService"
        private const val PORT = 8080
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "agent_portal_channel"

        @Volatile
        var instance: HttpServerService? = null
            private set

        fun isRunning(): Boolean = instance?.server?.isAlive == true
    }

    private var server: PortalHttpServer? = null
    private val gson = Gson()
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, createNotification())

        if (server == null || !server!!.isAlive) {
            startServer()
        }

        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        stopServer()
        instance = null
    }

    private fun startServer() {
        thread {
            try {
                server = PortalHttpServer(PORT)
                server?.start(NanoHTTPD.SOCKET_READ_TIMEOUT, false)
                Log.i(TAG, "HTTP Server started on port $PORT")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start HTTP server", e)
            }
        }
    }

    private fun stopServer() {
        server?.stop()
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

            return try {
                when {
                    uri == "/ping" -> handlePing()
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
    }
}
