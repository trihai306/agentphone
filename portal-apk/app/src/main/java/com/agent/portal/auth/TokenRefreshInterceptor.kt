package com.agent.portal.auth

import android.content.Context
import android.util.Log
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response

/**
 * OkHttp Interceptor to automatically refresh expired tokens
 * 
 * When a request receives 401 Unauthorized:
 * 1. Attempts to refresh the token
 * 2. Retries the original request with new token
 * 3. If refresh fails, logs out the user
 */
class TokenRefreshInterceptor(private val context: Context) : Interceptor {
    
    companion object {
        private const val TAG = "TokenRefreshInterceptor"
        private const val MAX_RETRY_COUNT = 1
    }
    
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        
        // Try original request first
        val response = chain.proceed(originalRequest)
        
        // If 401 Unauthorized and has Authorization header, try to refresh token
        if (response.code == 401 && originalRequest.header("Authorization") != null) {
            Log.w(TAG, "Received 401, attempting token refresh...")
            
            response.close() // Close the original response
            
            // Get new token
            val sessionManager = SessionManager(context)
            val oldToken = sessionManager.getToken()
            
            if (oldToken.isNullOrEmpty()) {
                Log.e(TAG, "No token to refresh")
                return response
            }
            
            // Attempt to refresh token
            val newToken = try {
                runBlocking {
                    refreshToken(oldToken)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Token refresh failed: ${e.message}", e)
                null
            }
            
            if (newToken != null) {
                // Update session with new token
                val session = sessionManager.getSession()
                session?.let {
                    sessionManager.saveSession(it.copy(token = newToken))
                    Log.i(TAG, "✅ Token refreshed successfully")
                }
                
                // Retry original request with new token
                val newRequest = originalRequest.newBuilder()
                    .header("Authorization", "Bearer $newToken")
                    .build()
                
                return chain.proceed(newRequest)
            } else {
                Log.e(TAG, "❌ Token refresh failed, user needs to re-login")
                // Clear session and return 401
                sessionManager.clearSession()
            }
        }
        
        return response
    }
    
    /**
     * Refresh the access token
     * 
     * Note: This is a simplified implementation.
     * In a real app, you would call a refresh endpoint like:
     * POST /api/auth/refresh with the old token
     * 
     * For Laravel Sanctum, tokens don't have refresh mechanism by default
     * So we'll implement a manual refresh by re-authenticating if needed
     */
    private suspend fun refreshToken(oldToken: String): String? {
        // Option 1: Call refresh endpoint (if your Laravel backend has one)
        // val authService = AuthService(context)
        // return authService.refreshToken(oldToken)
        
        // Option 2: For now, return null to indicate refresh not supported
        // User will need to re-login when token expires
        Log.w(TAG, "Token refresh not implemented, user will need to re-login")
        return null
    }
}
