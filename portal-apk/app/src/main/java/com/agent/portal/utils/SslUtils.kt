package com.agent.portal.utils

import android.util.Log
import java.net.InetAddress
import java.net.Socket
import javax.net.ssl.*

/**
 * Custom SSL Socket Factory that connects to an IP address but uses
 * a specified hostname for SSL/TLS verification (SNI).
 * 
 * This is needed for emulators that can't resolve external domain names
 * but need to validate SSL certificates against the domain.
 */
object SslUtils {
    private const val TAG = "SslUtils"
    
    /**
     * Create an SSLSocketFactory that connects to IP but verifies hostname
     */
    fun createSslSocketFactoryForIp(
        ipAddress: String,
        hostname: String
    ): SSLSocketFactory {
        val defaultFactory = SSLContext.getDefault().socketFactory
        
        return object : SSLSocketFactory() {
            override fun getDefaultCipherSuites(): Array<String> = defaultFactory.defaultCipherSuites
            override fun getSupportedCipherSuites(): Array<String> = defaultFactory.supportedCipherSuites
            
            override fun createSocket(socket: Socket?, host: String?, port: Int, autoClose: Boolean): Socket {
                Log.d(TAG, "createSocket: Connecting to $host:$port with hostname $hostname")
                val sslSocket = defaultFactory.createSocket(socket, hostname, port, autoClose) as SSLSocket
                enableSniHostname(sslSocket, hostname)
                return sslSocket
            }
            
            override fun createSocket(host: String?, port: Int): Socket {
                Log.d(TAG, "createSocket: Direct connect to $host:$port, using hostname $hostname")
                // Connect to IP but use hostname for SNI
                val socket = defaultFactory.createSocket(ipAddress, port) as SSLSocket
                enableSniHostname(socket, hostname)
                return socket
            }
            
            override fun createSocket(host: String?, port: Int, localHost: InetAddress?, localPort: Int): Socket {
                val socket = defaultFactory.createSocket(ipAddress, port, localHost, localPort) as SSLSocket
                enableSniHostname(socket, hostname)
                return socket
            }
            
            override fun createSocket(host: InetAddress?, port: Int): Socket {
                val socket = defaultFactory.createSocket(host, port) as SSLSocket
                enableSniHostname(socket, hostname)
                return socket
            }
            
            override fun createSocket(address: InetAddress?, port: Int, localAddress: InetAddress?, localPort: Int): Socket {
                val socket = defaultFactory.createSocket(address, port, localAddress, localPort) as SSLSocket
                enableSniHostname(socket, hostname)
                return socket
            }
        }
    }
    
    /**
     * Enable SNI hostname on SSL socket
     */
    private fun enableSniHostname(socket: SSLSocket, hostname: String) {
        try {
            val sslParams = socket.sslParameters
            val sniHostNames = listOf(SNIHostName(hostname))
            sslParams.serverNames = sniHostNames
            socket.sslParameters = sslParams
            Log.d(TAG, "SNI hostname set to: $hostname")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to set SNI hostname: ${e.message}")
        }
    }
    
    /**
     * Create a HostnameVerifier that accepts the IP but verifies against hostname
     */
    fun createHostnameVerifier(expectedHostname: String): HostnameVerifier {
        return HostnameVerifier { hostname, session ->
            Log.d(TAG, "HostnameVerifier: hostname=$hostname, expected=$expectedHostname")
            // Accept if it matches the expected hostname or the IP
            hostname == expectedHostname || 
            hostname == NetworkUtils.PROD_IP ||
            HttpsURLConnection.getDefaultHostnameVerifier().verify(expectedHostname, session)
        }
    }
}
