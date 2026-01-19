package com.agent.portal.utils

import android.os.Build

/**
 * Network utilities for handling localhost connections
 */
object NetworkUtils {
    
    /**
     * Development host IP - Change this to your dev machine's IP
     * Run `ifconfig | grep inet` to find your IP
     */
    private const val DEV_HOST = "192.168.50.117"
    private const val API_PORT = 8000
    private const val SOCKET_PORT = 6001
    
    // Cached emulator detection result (computed once)
    private val isEmulatorCached: Boolean by lazy {
        detectEmulator()
    }
    
    /**
     * Get the appropriate host for current environment
     */
    private fun getHost(): String {
        return if (isEmulator()) "10.0.2.2" else DEV_HOST
    }
    
    /**
     * Get appropriate API base URL
     */
    fun getApiBaseUrl(): String {
        return "http://${getHost()}:$API_PORT/api"
    }
    
    /**
     * Get appropriate Socket URL
     */
    fun getSocketUrl(): String {
        return "http://${getHost()}:$SOCKET_PORT"
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
