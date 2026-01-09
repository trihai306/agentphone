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
 */
data class LoginResponse(
    val success: Boolean,
    val message: String?,
    val token: String?,
    val user: User?
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
