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
    
    /**
     * Get the appropriate localhost URL for current environment
     * 
     * Returns:
     * - 10.0.2.2 for Android Emulator (localhost of host machine)
     * - localhost for physical devices (requires port forwarding or exposed server)
     */
    fun getLocalhostUrl(port: Int? = null): String {
        val host = if (isEmulator()) {
            "10.0.2.2" // Android Emulator special IP
        } else {
            "localhost" // Physical device - should use actual IP or domain
        }
        
        return if (port != null) "http://$host:$port" else "http://$host"
    }
    
    /**
     * Get appropriate API base URL
     * 
     * For Laravel Herd on emulator:
     * - Herd runs on HTTPS by default
     * - Use laravel-backend.test domain (DNS resolves on emulator via /etc/hosts)
     * - Or use IP 10.0.2.2 with HTTPS and trust self-signed cert
     * 
     * For physical devices in local development:
     * - Use DEV_HOST with HTTP (php artisan serve on port 8000)
     */
    fun getApiBaseUrl(): String {
        return if (isEmulator()) {
            // Emulator - point to host machine
            "http://10.0.2.2:8000/api"
        } else {
            // Physical device - use dev machine IP for local development
            "http://$DEV_HOST:8000/api"
        }
    }
    
    /**
     * Get appropriate Socket URL
     */
    fun getSocketUrl(): String {
        return if (isEmulator()) {
            // Emulator - point to host machine
            "http://10.0.2.2:6001"
        } else {
            // Physical device - use dev machine IP for local development
            "http://$DEV_HOST:6001"
        }
    }
    
    /**
     * Check if running on emulator
     * Enhanced detection for various emulator types
     */
    fun isEmulator(): Boolean {
        val result = (Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.FINGERPRINT.contains("sdk_gphone")  // NEW: Android Studio emulators
                || Build.FINGERPRINT.contains("/sdk/")
                || Build.FINGERPRINT.contains("emu64")  // NEW: 64-bit emulators
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MODEL.contains("sdk_gphone")  // NEW: Android Studio
                || Build.MANUFACTURER.contains("Genymotion")
                || Build.MANUFACTURER.equals("Google", ignoreCase = true) && Build.MODEL.contains("sdk")
                || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                || Build.PRODUCT.contains("sdk")
                || Build.PRODUCT.contains("emulator")
                || Build.HARDWARE.contains("goldfish")
                || Build.HARDWARE.contains("ranchu"))  // NEW: Ranchu is the new emulator
        
        android.util.Log.d("NetworkUtils", "Emulator detection - " +
            "Model: ${Build.MODEL}, " +
            "Fingerprint: ${Build.FINGERPRINT}, " +
            "Hardware: ${Build.HARDWARE}, " +
            "Result: $result")
        
        return result
    }
    
    /**
     * Get device type for logging
     */
    fun getDeviceType(): String {
        return if (isEmulator()) "Emulator" else "Physical Device"
    }
}
