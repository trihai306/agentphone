package com.agent.portal.auth

import android.content.Context
import android.provider.Settings
import android.util.Log
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

/**
 * Device registration payload for Laravel Backend
 */
data class DeviceRegistrationRequest(
    @SerializedName("device_id")
    val deviceId: String,
    
    @SerializedName("device_name")
    val deviceName: String,
    
    val model: String,
    val manufacturer: String,
    
    @SerializedName("android_version")
    val androidVersion: String,
    
    @SerializedName("sdk_version")
    val sdkVersion: Int,
    
    @SerializedName("socket_url")
    val socketUrl: String? = null
)

/**
 * Device registration response
 */
data class DeviceRegistrationResponse(
    val success: Boolean,
    val message: String?,
    val device: RegisteredDevice?
)

/**
 * Registered device data
 */
data class RegisteredDevice(
    val id: Int,
    
    @SerializedName("device_id")
    val deviceId: String,
    
    val name: String,
    val status: String,
    
    @SerializedName("socket_url")
    val socketUrl: String?,
    
    @SerializedName("created_at")
    val createdAt: String?
)

/**
 * Device Registration Service
 * 
 * Handles device registration with Laravel Backend after successful authentication.
 */
class DeviceRegistrationService(private val context: Context) {
    
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()
    
    private val gson = Gson()
    
    companion object {
        private const val TAG = "DeviceRegistration"
        private const val DEFAULT_API_BASE_URL = "https://laravel-backend.test/api"
        private const val REGISTER_DEVICE_ENDPOINT = "/devices/register"
    }
    
    /**
     * Get API base URL from preferences
     */
    private fun getApiBaseUrl(): String {
        val prefs = context.getSharedPreferences("portal_settings", Context.MODE_PRIVATE)
        return prefs.getString("api_base_url", DEFAULT_API_BASE_URL) ?: DEFAULT_API_BASE_URL
    }
    
    /**
     * Get unique device ID
     */
    private fun getDeviceId(): String {
        return Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ANDROID_ID
        ) ?: "unknown"
    }
    
    /**
     * Register device with backend
     * 
     * @param authToken JWT authentication token
     * @return DeviceRegistrationResponse with device info if successful
     */
    suspend fun registerDevice(authToken: String): DeviceRegistrationResponse = withContext(Dispatchers.IO) {
        try {
            val baseUrl = getApiBaseUrl()
            val registerUrl = "$baseUrl$REGISTER_DEVICE_ENDPOINT"
            
            val deviceId = getDeviceId()
            val deviceName = "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}"
            
            val registrationRequest = DeviceRegistrationRequest(
                deviceId = deviceId,
                deviceName = deviceName,
                model = android.os.Build.MODEL,
                manufacturer = android.os.Build.MANUFACTURER,
                androidVersion = android.os.Build.VERSION.RELEASE,
                sdkVersion = android.os.Build.VERSION.SDK_INT,
                socketUrl = null // Backend will provide socket URL
            )
            
            val json = gson.toJson(registrationRequest)
            val body = json.toRequestBody("application/json".toMediaType())
            
            val request = Request.Builder()
                .url(registerUrl)
                .post(body)
                .addHeader("Accept", "application/json")
                .addHeader("Content-Type", "application/json")
                .addHeader("Authorization", "Bearer $authToken")
                .build()
            
            Log.d(TAG, "Registering device: $deviceName ($deviceId)")
            Log.d(TAG, "Request URL: $registerUrl")
            
            client.newCall(request).execute().use { response ->
                val responseBody = response.body?.string() ?: ""
                
                Log.d(TAG, "Registration response code: ${response.code}")
                Log.d(TAG, "Registration response body: $responseBody")
                
                if (response.isSuccessful) {
                    val registrationResponse = gson.fromJson(responseBody, DeviceRegistrationResponse::class.java)
                    
                    if (registrationResponse.success) {
                        Log.i(TAG, "✅ Device registered successfully: ${registrationResponse.device?.name}")
                        
                        // Save device info locally
                        saveDeviceInfo(registrationResponse.device)
                        
                        return@withContext registrationResponse
                    } else {
                        Log.w(TAG, "⚠️ Device registration failed: ${registrationResponse.message}")
                        return@withContext registrationResponse
                    }
                } else {
                    val errorMessage = when (response.code) {
                        401 -> "Unauthorized. Please login again."
                        409 -> "Device already registered"
                        422 -> "Invalid device information"
                        500 -> "Server error"
                        else -> "HTTP ${response.code}"
                    }
                    
                    Log.e(TAG, "❌ Registration failed: $errorMessage")
                    return@withContext DeviceRegistrationResponse(
                        success = false,
                        message = errorMessage,
                        device = null
                    )
                }
            }
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "❌ Cannot reach server: ${e.message}", e)
            return@withContext DeviceRegistrationResponse(
                success = false,
                message = "Cannot reach server",
                device = null
            )
        } catch (e: Exception) {
            Log.e(TAG, "❌ Registration exception: ${e.message}", e)
            return@withContext DeviceRegistrationResponse(
                success = false,
                message = "Error: ${e.message}",
                device = null
            )
        }
    }
    
    /**
     * Save device info to local storage
     */
    private fun saveDeviceInfo(device: RegisteredDevice?) {
        if (device == null) return
        
        try {
            val prefs = context.getSharedPreferences("portal_device", Context.MODE_PRIVATE)
            prefs.edit().apply {
                putInt("device_db_id", device.id)
                putString("device_id", device.deviceId)
                putString("device_name", device.name)
                putString("device_status", device.status)
                putString("socket_url", device.socketUrl)
                putLong("registered_at", System.currentTimeMillis())
                apply()
            }
            Log.i(TAG, "Device info saved locally")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save device info: ${e.message}", e)
        }
    }
    
    /**
     * Get saved device info
     */
    fun getSavedDeviceInfo(): RegisteredDevice? {
        try {
            val prefs = context.getSharedPreferences("portal_device", Context.MODE_PRIVATE)
            val deviceId = prefs.getString("device_id", null) ?: return null
            
            return RegisteredDevice(
                id = prefs.getInt("device_db_id", 0),
                deviceId = deviceId,
                name = prefs.getString("device_name", "") ?: "",
                status = prefs.getString("device_status", "offline") ?: "offline",
                socketUrl = prefs.getString("socket_url", null),
                createdAt = null
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get saved device info: ${e.message}", e)
            return null
        }
    }
    
    /**
     * Clear saved device info (on logout)
     */
    fun clearDeviceInfo() {
        try {
            val prefs = context.getSharedPreferences("portal_device", Context.MODE_PRIVATE)
            prefs.edit().clear().apply()
            Log.i(TAG, "Device info cleared")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to clear device info: ${e.message}", e)
        }
    }
}
