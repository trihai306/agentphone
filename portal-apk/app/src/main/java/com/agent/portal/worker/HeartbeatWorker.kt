package com.agent.portal.worker

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody

/**
 * Background worker to send periodic heartbeats to Laravel backend
 * Updates device last_active_at timestamp for online status tracking
 */
class HeartbeatWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    companion object {
        private const val TAG = "HeartbeatWorker"
    }

    override suspend fun doWork(): Result {
        return try {
            Log.i(TAG, "Sending heartbeat...")
            sendHeartbeat()
            Log.i(TAG, "✅ Heartbeat sent successfully")
            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "❌ Heartbeat failed: ${e.message}", e)
            Result.retry()
        }
    }

    private fun sendHeartbeat() {
        // Get session token
        val sessionManager = com.agent.portal.auth.SessionManager(applicationContext)
        val session = sessionManager.getSession()
        
        if (session == null) {
            Log.w(TAG, "No session, skipping heartbeat")
            return
        }
        
        // Get device ID
        val deviceId = android.provider.Settings.Secure.getString(
            applicationContext.contentResolver,
            android.provider.Settings.Secure.ANDROID_ID
        )
        
        // Determine API URL
        val apiUrl = if (com.agent.portal.utils.NetworkUtils.isEmulator()) {
            "http://10.0.2.2:8000/api"
        } else {
            "https://laravel-backend.test/api"
        }
        
        // Build request payload
        val isRecording = try {
            com.agent.portal.recording.RecordingManager.getState() == 
                com.agent.portal.recording.RecordingManager.RecordingState.RECORDING
        } catch (e: Exception) {
            false
        }
        
        val payload = mapOf(
            "device_id" to deviceId,
            "is_recording" to isRecording,
            "socket_connected" to com.agent.portal.socket.SocketJobManager.isConnected(),
        )
        
        val json = com.google.gson.Gson().toJson(payload)
        val requestBody = RequestBody.create(
            "application/json".toMediaTypeOrNull(),
            json
        )
        
        // Send HTTP POST request
        val client = OkHttpClient()
        val request = Request.Builder()
            .url("$apiUrl/heartbeat")
            .post(requestBody)
            .addHeader("Authorization", "Bearer ${session.token}")
            .addHeader("Content-Type", "application/json")
            .addHeader("Accept", "application/json")
            .build()
        
        val response = client.newCall(request).execute()
        
        if (response.isSuccessful) {
            Log.d(TAG, "Heartbeat response: ${response.code}")
        } else {
            Log.w(TAG, "Heartbeat failed: ${response.code}")
        }
        
        response.close()
    }
}
