package com.agent.portal.utils

import android.util.Log
import okhttp3.Dns
import java.net.InetAddress
import java.net.UnknownHostException

/**
 * Custom DNS resolver that manually resolves specific domains to their IP addresses.
 * This is useful for Android emulators that can't resolve external domain names.
 * 
 * Usage: Add to OkHttpClient.Builder().dns(CustomDns())
 */
object CustomDns : Dns {
    private const val TAG = "CustomDns"
    
    // Manual DNS entries for production domains
    private val dnsOverrides = mapOf(
        "clickai.lionsoftware.cloud" to "103.142.24.24"
    )
    
    override fun lookup(hostname: String): List<InetAddress> {
        Log.d(TAG, "DNS lookup: $hostname")
        
        // Check if we have a manual override
        val overrideIp = dnsOverrides[hostname]
        if (overrideIp != null) {
            Log.i(TAG, "Using DNS override: $hostname -> $overrideIp")
            return listOf(InetAddress.getByName(overrideIp))
        }
        
        // Try system DNS first
        return try {
            val addresses = Dns.SYSTEM.lookup(hostname)
            Log.d(TAG, "System DNS resolved $hostname to: ${addresses.map { it.hostAddress }}")
            addresses
        } catch (e: UnknownHostException) {
            Log.e(TAG, "System DNS failed for $hostname: ${e.message}")
            throw e
        }
    }
}

/**
 * OkHttpClient factory with custom DNS for emulators
 */
object HttpClientFactory {
    
    /**
     * Create an OkHttpClient with custom DNS resolver
     */
    fun create(): okhttp3.OkHttpClient {
        return okhttp3.OkHttpClient.Builder()
            .dns(CustomDns)
            .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .build()
    }
}
