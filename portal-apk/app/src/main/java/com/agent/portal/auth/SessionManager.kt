package com.agent.portal.auth

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.google.gson.Gson

/**
 * Manages authentication session storage using SharedPreferences
 * 
 * Provides methods to save, retrieve, and clear user authentication sessions.
 */
class SessionManager(context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences(
        PREFS_NAME,
        Context.MODE_PRIVATE
    )
    
    private val gson = Gson()
    
    companion object {
        private const val TAG = "SessionManager"
        private const val PREFS_NAME = "portal_auth"
        private const val KEY_SESSION = "auth_session"
        private const val KEY_TOKEN = "auth_token"  // Quick access cache
    }
    
    /**
     * Save authentication session
     * 
     * @param session AuthSession object containing user and token info
     */
    fun saveSession(session: AuthSession) {
        try {
            prefs.edit().apply {
                putString(KEY_SESSION, gson.toJson(session))
                putString(KEY_TOKEN, session.token)  // Cache for quick access
                apply()
            }
            Log.i(TAG, "Session saved for user: ${session.userEmail}")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save session: ${e.message}", e)
        }
    }
    
    /**
     * Get saved authentication session
     * 
     * @return AuthSession if exists, null otherwise
     */
    fun getSession(): AuthSession? {
        val json = prefs.getString(KEY_SESSION, null) ?: return null
        return try {
            val session = gson.fromJson(json, AuthSession::class.java)
            Log.d(TAG, "Session retrieved for user: ${session.userEmail}")
            session
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse session: ${e.message}", e)
            clearSession() // Clear corrupted session
            null
        }
    }
    
    /**
     * Get auth token (quick access without deserializing full session)
     * 
     * @return JWT token string if exists, null otherwise
     */
    fun getToken(): String? {
        return prefs.getString(KEY_TOKEN, null)
    }
    
    /**
     * Check if user is logged in
     * 
     * @return true if valid token exists, false otherwise
     */
    fun isLoggedIn(): Boolean {
        val token = getToken()
        val isLoggedIn = !token.isNullOrEmpty()
        Log.d(TAG, "Is logged in: $isLoggedIn")
        return isLoggedIn
    }
    
    /**
     * Clear authentication session (logout)
     */
    fun clearSession() {
        prefs.edit().clear().apply()
        Log.i(TAG, "Session cleared (logged out)")
    }
    
    /**
     * Get user ID from saved session
     * 
     * @return user ID or null
     */
    fun getUserId(): Int? {
        return getSession()?.userId
    }
    
    /**
     * Get user email from saved session
     * 
     * @return email or null
     */
    fun getUserEmail(): String? {
        return getSession()?.userEmail
    }
}
