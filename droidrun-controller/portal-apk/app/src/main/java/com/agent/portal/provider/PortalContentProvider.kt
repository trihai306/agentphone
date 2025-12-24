package com.agent.portal.provider

import android.content.ContentProvider
import android.content.ContentValues
import android.content.Intent
import android.content.UriMatcher
import android.database.Cursor
import android.database.MatrixCursor
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Base64
import android.util.Log
import com.agent.portal.accessibility.PortalAccessibilityService
import com.agent.portal.keyboard.PortalKeyboardIME
import com.agent.portal.overlay.OverlayService
import com.google.gson.Gson
import java.io.ByteArrayOutputStream
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/**
 * Content Provider for ADB shell communication
 *
 * Usage:
 *   adb shell content query --uri content://com.agent.portal/state
 *   adb shell content query --uri content://com.agent.portal/screenshot
 *   adb shell content insert --uri content://com.agent.portal/keyboard/input --bind base64_text:s:"SGVsbG8="
 *   adb shell content call --uri content://com.agent.portal --method overlay --arg show_bounds
 */
class PortalContentProvider : ContentProvider() {

    companion object {
        private const val TAG = "PortalContentProvider"
        private const val AUTHORITY = "com.agent.portal"

        private const val CODE_STATE = 1
        private const val CODE_SCREENSHOT = 2
        private const val CODE_KEYBOARD_INPUT = 3
        private const val CODE_PING = 4
        private const val CODE_OVERLAY = 5

        private val uriMatcher = UriMatcher(UriMatcher.NO_MATCH).apply {
            addURI(AUTHORITY, "state", CODE_STATE)
            addURI(AUTHORITY, "screenshot", CODE_SCREENSHOT)
            addURI(AUTHORITY, "keyboard/input", CODE_KEYBOARD_INPUT)
            addURI(AUTHORITY, "ping", CODE_PING)
            addURI(AUTHORITY, "overlay", CODE_OVERLAY)
        }
    }

    private val gson = Gson()

    override fun onCreate(): Boolean {
        Log.i(TAG, "Content Provider created")
        return true
    }

    override fun query(
        uri: Uri,
        projection: Array<out String>?,
        selection: String?,
        selectionArgs: Array<out String>?,
        sortOrder: String?
    ): Cursor? {
        Log.d(TAG, "Query: $uri")

        return when (uriMatcher.match(uri)) {
            CODE_PING -> handlePing()
            CODE_STATE -> handleGetState()
            CODE_SCREENSHOT -> handleScreenshot()
            else -> {
                Log.w(TAG, "Unknown URI: $uri")
                null
            }
        }
    }

    override fun insert(uri: Uri, values: ContentValues?): Uri? {
        Log.d(TAG, "Insert: $uri")

        when (uriMatcher.match(uri)) {
            CODE_KEYBOARD_INPUT -> {
                val base64Text = values?.getAsString("base64_text")
                if (base64Text != null) {
                    handleKeyboardInput(base64Text)
                }
            }
        }

        return null
    }

    override fun update(
        uri: Uri,
        values: ContentValues?,
        selection: String?,
        selectionArgs: Array<out String>?
    ): Int = 0

    override fun delete(
        uri: Uri,
        selection: String?,
        selectionArgs: Array<out String>?
    ): Int = 0

    override fun getType(uri: Uri): String = "application/json"

    /**
     * Handle overlay commands via content call
     * Usage: adb shell content call --uri content://com.agent.portal --method overlay --arg show_bounds
     */
    override fun call(method: String, arg: String?, extras: Bundle?): Bundle? {
        Log.d(TAG, "Call: method=$method, arg=$arg")

        val result = Bundle()

        when (method) {
            "overlay" -> {
                val action = when (arg) {
                    "show_bounds" -> OverlayService.Actions.SHOW_BOUNDS
                    "hide_bounds" -> OverlayService.Actions.HIDE_BOUNDS
                    "show_indexes" -> OverlayService.Actions.SHOW_INDEXES
                    "hide_indexes" -> OverlayService.Actions.HIDE_INDEXES
                    "toggle_bounds" -> OverlayService.Actions.TOGGLE_BOUNDS
                    "toggle_indexes" -> OverlayService.Actions.TOGGLE_INDEXES
                    "refresh" -> OverlayService.Actions.REFRESH
                    "stop" -> OverlayService.Actions.STOP
                    else -> null
                }

                if (action != null) {
                    startOverlayService(action)
                    result.putString("status", "success")
                    result.putString("action", arg)
                } else {
                    result.putString("status", "error")
                    result.putString("error", "Invalid action: $arg. Valid: show_bounds, hide_bounds, show_indexes, hide_indexes, toggle_bounds, toggle_indexes, refresh, stop")
                }
            }
            "overlay_status" -> {
                result.putString("status", "success")
                result.putBoolean("showBounds", OverlayService.showBounds)
                result.putBoolean("showIndexes", OverlayService.showIndexes)
                result.putBoolean("isRunning", OverlayService.isRunning())
            }
            else -> {
                result.putString("status", "error")
                result.putString("error", "Unknown method: $method")
            }
        }

        return result
    }

    private fun startOverlayService(action: String) {
        val ctx = context ?: return
        val intent = Intent(ctx, OverlayService::class.java).apply {
            this.action = action
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ctx.startForegroundService(intent)
        } else {
            ctx.startService(intent)
        }
    }

    /**
     * Create cursor with single result column
     */
    private fun createResultCursor(result: String): Cursor {
        val cursor = MatrixCursor(arrayOf("result"))
        cursor.addRow(arrayOf(result))
        return cursor
    }

    private fun handlePing(): Cursor {
        val response = mapOf(
            "status" to "success",
            "message" to "pong",
            "timestamp" to System.currentTimeMillis()
        )
        return createResultCursor(gson.toJson(response))
    }

    private fun handleGetState(): Cursor {
        val a11yService = PortalAccessibilityService.instance

        if (a11yService == null) {
            val error = mapOf(
                "status" to "error",
                "error" to "Accessibility service not running"
            )
            return createResultCursor(gson.toJson(error))
        }

        try {
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

            return createResultCursor(gson.toJson(response))

        } catch (e: Exception) {
            Log.e(TAG, "Error getting state", e)
            val error = mapOf(
                "status" to "error",
                "error" to e.message
            )
            return createResultCursor(gson.toJson(error))
        }
    }

    private fun handleScreenshot(): Cursor {
        val a11yService = PortalAccessibilityService.instance

        if (a11yService == null) {
            val error = mapOf(
                "status" to "error",
                "error" to "Accessibility service not running"
            )
            return createResultCursor(gson.toJson(error))
        }

        try {
            var resultBitmap: Bitmap? = null
            val latch = CountDownLatch(1)

            a11yService.takeScreenshot { bitmap ->
                resultBitmap = bitmap
                latch.countDown()
            }

            // Wait for screenshot
            latch.await(5, TimeUnit.SECONDS)

            if (resultBitmap != null) {
                val outputStream = ByteArrayOutputStream()
                resultBitmap!!.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
                val base64 = Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)

                val response = mapOf(
                    "status" to "success",
                    "data" to base64
                )
                return createResultCursor(gson.toJson(response))
            } else {
                val error = mapOf(
                    "status" to "error",
                    "error" to "Failed to take screenshot"
                )
                return createResultCursor(gson.toJson(error))
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error taking screenshot", e)
            val error = mapOf(
                "status" to "error",
                "error" to e.message
            )
            return createResultCursor(gson.toJson(error))
        }
    }

    private fun handleKeyboardInput(base64Text: String) {
        try {
            val text = String(Base64.decode(base64Text, Base64.DEFAULT))

            val keyboard = PortalKeyboardIME.instance
            if (keyboard != null) {
                keyboard.inputText(text)
                Log.d(TAG, "Text input: ${text.take(20)}...")
            } else {
                Log.w(TAG, "Keyboard service not running")
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error handling keyboard input", e)
        }
    }
}
