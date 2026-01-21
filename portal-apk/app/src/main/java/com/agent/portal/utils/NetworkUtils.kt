package com.agent.portal.utils

import android.os.Build

/**
 * Network utilities for handling localhost connections
 */
object NetworkUtils {
    
    /**
     * Production host - deployed server
     */
    const val PROD_HOST = "clickai.lionsoftware.cloud"
    internal const val PROD_IP = "103.142.24.24"  // IP for emulator (DNS issue workaround)
    
    /**
     * Development host IP - Change this to your dev machine's IP
     * Run `ifconfig | grep inet` to find your IP
     */
    private const val DEV_HOST = "192.168.50.117"
    private const val API_PORT = 8000
    private const val SOCKET_PORT = 6001
    
    // API uses production, Socket uses production
    private const val USE_PRODUCTION_API = true       // API → Production
    private const val USE_PRODUCTION_SOCKET = true    // Socket → Production
    
    // Cached emulator detection result (computed once)
    private val isEmulatorCached: Boolean by lazy {
        detectEmulator()
    }
    
    /**
     * Get appropriate API base URL
     * Uses local server for API calls
     */
    fun getApiBaseUrl(): String {
        return if (USE_PRODUCTION_API) {
            "https://$PROD_HOST/api"
        } else if (isEmulator()) {
            "http://10.0.2.2:$API_PORT/api"
        } else {
            "http://$DEV_HOST:$API_PORT/api"
        }
    }
    
    /**
     * Get appropriate Socket URL
     * Uses production server for WebSocket - always use domain for SSL
     */
    fun getSocketUrl(): String {
        return if (USE_PRODUCTION_SOCKET) {
            // Always use domain for SSL certificate validation
            "https://$PROD_HOST"  // Through Nginx proxy on port 443
        } else if (isEmulator()) {
            "http://10.0.2.2:$SOCKET_PORT"
        } else {
            "http://$DEV_HOST:$SOCKET_PORT"
        }
    }
    
    /**
     * Get socket host for Pusher
     * Always use domain for SSL certificate validation
     */
    fun getSocketHost(): String {
        return if (USE_PRODUCTION_SOCKET) {
            // Always use domain for SSL cert validation
            PROD_HOST
        } else if (isEmulator()) {
            "10.0.2.2"
        } else {
            DEV_HOST
        }
    }
    
    /**
     * Get socket port for Pusher
     */
    fun getSocketPort(): Int {
        return if (USE_PRODUCTION_SOCKET) 443 else SOCKET_PORT
    }
    
    /**
     * Check if using encrypted connection (WSS)
     */
    fun isSocketEncrypted(): Boolean {
        return USE_PRODUCTION_SOCKET
    }
    
    /**
     * Check if running on emulator (cached for performance)
     */
    fun isEmulator(): Boolean = isEmulatorCached
    
    /**
     * Detect emulator - called once and cached
     */
    private fun detectEmulator(): Boolean {
        val result = Build.FINGERPRINT.startsWith("generic") ||
                Build.FINGERPRINT.startsWith("unknown") ||
                Build.FINGERPRINT.contains("sdk_gphone") ||
                Build.FINGERPRINT.contains("emu64") ||
                Build.MODEL.contains("Emulator") ||
                Build.MODEL.contains("sdk_gphone") ||
                Build.MANUFACTURER.contains("Genymotion") ||
                Build.PRODUCT.contains("sdk") ||
                Build.PRODUCT.contains("emulator") ||
                Build.HARDWARE.contains("goldfish") ||
                Build.HARDWARE.contains("ranchu")
        
        android.util.Log.i("NetworkUtils", "Device type: ${if (result) "Emulator" else "Physical"} " +
            "(Model: ${Build.MODEL}, Hardware: ${Build.HARDWARE})")
        
        return result
    }
    
    /**
     * Get device type for logging
     */
    fun getDeviceType(): String {
        return if (isEmulator()) "Emulator" else "Physical Device"
    }
}
