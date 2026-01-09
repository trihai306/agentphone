package com.agent.portal.auth

import android.content.Context
import android.util.Log
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

/**
 * Authentication service for Laravel Backend API
 * 
 * Handles login, token verification, and API communication.
 */
class AuthService(private val context: Context) {
    
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()
    
    private val gson = Gson()
    
    companion object {
        private const val TAG = "AuthService"
        
        // Laravel Backend API URL - configurable via SharedPreferences
        private const val DEFAULT_API_BASE_URL = "https://laravel-backend.test/api"
        private const val LOGIN_ENDPOINT = "/login"
        private const val USER_ENDPOINT = "/user"
    }
    
    /**
     * Get API base URL from preferences or use default
     */
    private fun getApiBaseUrl(): String {
        val prefs = context.getSharedPreferences("portal_settings", Context.MODE_PRIVATE)
        return prefs.getString("api_base_url", DEFAULT_API_BASE_URL) ?: DEFAULT_API_BASE_URL
    }
    
    /**
     * Login with email and password
     * 
     * @param email User email address
     * @param password User password
     * @return LoginResponse with token if successful
     */
    suspend fun login(email: String, password: String): LoginResponse = withContext(Dispatchers.IO) {
        try {
            val baseUrl = getApiBaseUrl()
            val loginUrl = "$baseUrl$LOGIN_ENDPOINT"
            
            val loginRequest = LoginRequest(
                email = email,
                password = password,
                deviceName = "${android.os.Build.MODEL} - Portal"
            )
            
            val json = gson.toJson(loginRequest)
            val body = json.toRequestBody("application/json".toMediaType())
            
            val request = Request.Builder()
                .url(loginUrl)
                .post(body)
                .addHeader("Accept", "application/json")
                .addHeader("Content-Type", "application/json")
                .build()
            
            Log.d(TAG, "Sending login request to: $loginUrl")
            Log.d(TAG, "Request body: $json")
            
            client.newCall(request).execute().use { response ->
                val responseBody = response.body?.string() ?: ""
                
                Log.d(TAG, "Login response code: ${response.code}")
                Log.d(TAG, "Login response body: $responseBody")
                
                if (response.isSuccessful) {
                    val loginResponse = gson.fromJson(responseBody, LoginResponse::class.java)
                    
                    if (loginResponse.success && loginResponse.token != null) {
                        Log.i(TAG, "✅ Login successful for user: ${loginResponse.user?.email}")
                        return@withContext loginResponse
                    } else {
                        Log.w(TAG, "⚠️ Login failed: ${loginResponse.message}")
                        return@withContext LoginResponse(
                            success = false,
                            message = loginResponse.message ?: "Login failed",
                            token = null,
                            user = null
                        )
                    }
                } else {
                    // Parse error response if available
                    val errorMessage = try {
                        val errorResponse = gson.fromJson(responseBody, LoginResponse::class.java)
                        errorResponse.message ?: getDefaultErrorMessage(response.code)
                    } catch (e: Exception) {
                        getDefaultErrorMessage(response.code)
                    }
                    
                    Log.e(TAG, "❌ Login failed with code ${response.code}: $errorMessage")
                    return@withContext LoginResponse(
                        success = false,
                        message = errorMessage,
                        token = null,
                        user = null
                    )
                }
            }
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "❌ Cannot reach server: ${e.message}", e)
            return@withContext LoginResponse(
                success = false,
                message = "Cannot reach server. Please check your internet connection.",
                token = null,
                user = null
            )
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "❌ Connection timeout: ${e.message}", e)
            return@withContext LoginResponse(
                success = false,
                message = "Connection timeout. Please try again.",
                token = null,
                user = null
            )
        } catch (e: Exception) {
            Log.e(TAG, "❌ Login exception: ${e.message}", e)
            return@withContext LoginResponse(
                success = false,
                message = "Error: ${e.message}",
                token = null,
                user = null
            )
        }
    }
    
    /**
     * Verify if token is still valid
     * 
     * @param token JWT token to verify
     * @return true if token is valid, false otherwise
     */
    suspend fun verifyToken(token: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val baseUrl = getApiBaseUrl()
            val userUrl = "$baseUrl$USER_ENDPOINT"
            
            val request = Request.Builder()
                .url(userUrl)
                .get()
                .addHeader("Authorization", "Bearer $token")
                .addHeader("Accept", "application/json")
                .build()
            
            Log.d(TAG, "Verifying token...")
            
            client.newCall(request).execute().use { response ->
                val isValid = response.isSuccessful
                Log.d(TAG, "Token verification result: $isValid (code: ${response.code})")
                return@withContext isValid
            }
        } catch (e: Exception) {
            Log.e(TAG, "Token verification failed: ${e.message}", e)
            return@withContext false
        }
    }
    
    /**
     * Get default error message based on HTTP status code
     */
    private fun getDefaultErrorMessage(code: Int): String {
        return when (code) {
            401 -> "Invalid email or password"
            422 -> "Validation error. Please check your input."
            429 -> "Too many login attempts. Please try again later."
            500 -> "Server error. Please try again later."
            503 -> "Service unavailable. Please try again later."
            else -> "HTTP error $code"
        }
    }
}
