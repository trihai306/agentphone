package com.agent.portal.auth

import com.google.gson.annotations.SerializedName

/**
 * Login request payload for Laravel Backend API
 */
data class LoginRequest(
    val email: String,
    val password: String,
    
    @SerializedName("device_name")
    val deviceName: String = "Portal APK"
)

/**
 * Login response from Laravel Backend
 * Laravel returns: {"token": "...", "user": {...}}
 * Success field may not be present, so check token instead
 */
data class LoginResponse(
    val success: Boolean? = null,  // Optional field
    val message: String? = null,
    val token: String? = null,
    val user: User? = null
)

/**
 * User model from backend
 */
data class User(
    val id: Int,
    val email: String,
    val name: String?,
    
    @SerializedName("created_at")
    val createdAt: String?
)

/**
 * Auth session stored locally in SharedPreferences
 */
data class AuthSession(
    val token: String,
    val userId: Int,
    val userEmail: String,
    val userName: String?,
    val loginTime: Long = System.currentTimeMillis()
)
