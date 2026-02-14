package com.agent.portal.streaming

import android.content.Context
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.Image
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.os.Handler
import android.os.HandlerThread
import android.util.Log
import fi.iki.elonen.NanoHTTPD
import java.io.ByteArrayOutputStream
import java.io.PipedInputStream
import java.io.PipedOutputStream
import java.net.Inet4Address
import java.net.NetworkInterface
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference

/**
 * MJPEG Stream Server using NanoHTTPD.
 *
 * Serves live screen capture as MJPEG stream at:
 * - /stream  — MJPEG video stream (multipart/x-mixed-replace)
 * - /screenshot — Single JPEG frame
 * - /info — Device/stream info JSON
 *
 * Uses MediaProjection + ImageReader for efficient screen capture.
 */
class MjpegStreamServer(
    private val context: Context,
    port: Int = DEFAULT_PORT
) : NanoHTTPD(port) {

    companion object {
        private const val TAG = "CLICKAI:MjpegServer"
        const val DEFAULT_PORT = 8080
        const val BOUNDARY = "mjpeg_boundary"

        private var instance: MjpegStreamServer? = null

        fun getInstance(): MjpegStreamServer? = instance

        /**
         * Get all local IP addresses for this device
         */
        fun getLocalIpAddresses(): List<String> {
            val addresses = mutableListOf<String>()
            try {
                NetworkInterface.getNetworkInterfaces()?.let { interfaces ->
                    for (intf in interfaces) {
                        for (addr in intf.inetAddresses) {
                            if (!addr.isLoopbackAddress && addr is Inet4Address) {
                                addresses.add(addr.hostAddress ?: continue)
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error getting IP addresses", e)
            }
            return addresses
        }
    }

    // Screen capture
    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private var captureThread: HandlerThread? = null
    private var captureHandler: Handler? = null

    // Current frame
    private val currentFrame = AtomicReference<ByteArray?>(null)
    private val isCapturing = AtomicBoolean(false)

    // Connected clients tracking
    private val activeClients = CopyOnWriteArrayList<PipedOutputStream>()

    // Stream settings
    private var streamWidth = 540
    private var streamHeight = 960
    private var streamDpi = 160
    private var jpegQuality = 60 // 0-100
    private var targetFps = 15
    private var frameInterval = 1000L / targetFps

    /**
     * Start screen capture with MediaProjection
     */
    fun startCapture(
        projection: MediaProjection,
        width: Int,
        height: Int,
        dpi: Int,
        quality: Int = 60,
        fps: Int = 15
    ) {
        if (isCapturing.get()) {
            Log.w(TAG, "Already capturing")
            return
        }

        mediaProjection = projection
        streamWidth = width
        streamHeight = height
        streamDpi = dpi
        jpegQuality = quality
        targetFps = fps
        frameInterval = 1000L / targetFps

        // Create capture thread
        captureThread = HandlerThread("MjpegCapture").apply { start() }
        captureHandler = Handler(captureThread!!.looper)

        // Create ImageReader
        imageReader = ImageReader.newInstance(streamWidth, streamHeight, PixelFormat.RGBA_8888, 2)
        imageReader?.setOnImageAvailableListener({ reader ->
            processFrame(reader)
        }, captureHandler)

        // Create VirtualDisplay
        virtualDisplay = projection.createVirtualDisplay(
            "MjpegStream",
            streamWidth, streamHeight, streamDpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader?.surface,
            null, null
        )

        isCapturing.set(true)
        instance = this
        Log.d(TAG, "Capture started: ${streamWidth}x${streamHeight} @ ${targetFps}fps, quality=$jpegQuality")
    }

    /**
     * Process a captured frame from ImageReader
     */
    private var lastFrameTime = 0L

    private fun processFrame(reader: ImageReader) {
        val now = System.currentTimeMillis()
        if (now - lastFrameTime < frameInterval) {
            // Skip frame to maintain target FPS
            reader.acquireLatestImage()?.close()
            return
        }

        var image: Image? = null
        try {
            image = reader.acquireLatestImage() ?: return
            lastFrameTime = now

            val planes = image.planes
            val buffer = planes[0].buffer
            val pixelStride = planes[0].pixelStride
            val rowStride = planes[0].rowStride
            val rowPadding = rowStride - pixelStride * streamWidth

            // Create bitmap from image
            val bitmap = Bitmap.createBitmap(
                streamWidth + rowPadding / pixelStride,
                streamHeight,
                Bitmap.Config.ARGB_8888
            )
            bitmap.copyPixelsFromBuffer(buffer)

            // Crop to exact size (remove padding)
            val croppedBitmap = if (rowPadding > 0) {
                Bitmap.createBitmap(bitmap, 0, 0, streamWidth, streamHeight).also {
                    bitmap.recycle()
                }
            } else {
                bitmap
            }

            // Compress to JPEG
            val outputStream = ByteArrayOutputStream()
            croppedBitmap.compress(Bitmap.CompressFormat.JPEG, jpegQuality, outputStream)
            croppedBitmap.recycle()

            val jpegBytes = outputStream.toByteArray()
            currentFrame.set(jpegBytes)

        } catch (e: Exception) {
            Log.e(TAG, "Error processing frame", e)
        } finally {
            image?.close()
        }
    }

    /**
     * Stop screen capture
     */
    fun stopCapture() {
        isCapturing.set(false)
        instance = null

        virtualDisplay?.release()
        virtualDisplay = null

        imageReader?.close()
        imageReader = null

        captureThread?.quitSafely()
        captureThread = null
        captureHandler = null

        mediaProjection?.stop()
        mediaProjection = null

        currentFrame.set(null)

        Log.d(TAG, "Capture stopped")
    }

    /**
     * Handle HTTP requests
     */
    override fun serve(session: IHTTPSession): Response {
        val uri = session.uri
        Log.d(TAG, "Request: ${session.method} $uri from ${session.remoteIpAddress}")

        // CORS headers
        val corsHeaders = mapOf(
            "Access-Control-Allow-Origin" to "*",
            "Access-Control-Allow-Methods" to "GET, OPTIONS",
            "Access-Control-Allow-Headers" to "*"
        )

        if (session.method == Method.OPTIONS) {
            return newFixedLengthResponse(Response.Status.OK, "text/plain", "OK").apply {
                corsHeaders.forEach { (k, v) -> addHeader(k, v) }
            }
        }

        return when {
            uri == "/stream" || uri == "/stream/" -> serveMjpegStream(corsHeaders)
            uri == "/screenshot" || uri == "/screenshot/" -> serveScreenshot(corsHeaders)
            uri == "/info" || uri == "/info/" -> serveInfo(corsHeaders)
            else -> newFixedLengthResponse(
                Response.Status.NOT_FOUND, "text/plain",
                "Available endpoints: /stream, /screenshot, /info"
            ).apply { corsHeaders.forEach { (k, v) -> addHeader(k, v) } }
        }
    }

    /**
     * Serve MJPEG stream — continuous multipart/x-mixed-replace response
     */
    private fun serveMjpegStream(corsHeaders: Map<String, String>): Response {
        if (!isCapturing.get()) {
            return newFixedLengthResponse(
                Response.Status.SERVICE_UNAVAILABLE,
                "text/plain",
                "Screen capture not active"
            )
        }

        val pipedOut = PipedOutputStream()
        val pipedIn = PipedInputStream(pipedOut, 512 * 1024) // 512KB buffer

        activeClients.add(pipedOut)

        // Start a thread to push frames to this client
        Thread({
            try {
                while (isCapturing.get()) {
                    val frame = currentFrame.get()
                    if (frame != null) {
                        val header = "--$BOUNDARY\r\n" +
                                "Content-Type: image/jpeg\r\n" +
                                "Content-Length: ${frame.size}\r\n\r\n"
                        pipedOut.write(header.toByteArray())
                        pipedOut.write(frame)
                        pipedOut.write("\r\n".toByteArray())
                        pipedOut.flush()
                    }
                    Thread.sleep(frameInterval)
                }
            } catch (e: Exception) {
                Log.d(TAG, "Client disconnected: ${e.message}")
            } finally {
                activeClients.remove(pipedOut)
                try { pipedOut.close() } catch (_: Exception) {}
            }
        }, "MjpegClient-${activeClients.size}").start()

        return newChunkedResponse(
            Response.Status.OK,
            "multipart/x-mixed-replace; boundary=$BOUNDARY",
            pipedIn
        ).apply {
            addHeader("Cache-Control", "no-cache, no-store, must-revalidate")
            addHeader("Pragma", "no-cache")
            addHeader("Connection", "keep-alive")
            corsHeaders.forEach { (k, v) -> addHeader(k, v) }
        }
    }

    /**
     * Serve single screenshot
     */
    private fun serveScreenshot(corsHeaders: Map<String, String>): Response {
        val frame = currentFrame.get()
        return if (frame != null) {
            newFixedLengthResponse(
                Response.Status.OK,
                "image/jpeg",
                java.io.ByteArrayInputStream(frame),
                frame.size.toLong()
            ).apply {
                addHeader("Cache-Control", "no-cache")
                corsHeaders.forEach { (k, v) -> addHeader(k, v) }
            }
        } else {
            newFixedLengthResponse(
                Response.Status.SERVICE_UNAVAILABLE,
                "text/plain",
                "No frame available"
            ).apply { corsHeaders.forEach { (k, v) -> addHeader(k, v) } }
        }
    }

    /**
     * Serve device/stream info
     */
    private fun serveInfo(corsHeaders: Map<String, String>): Response {
        val ips = getLocalIpAddresses()
        val info = """
        {
            "status": "${if (isCapturing.get()) "streaming" else "idle"}",
            "width": $streamWidth,
            "height": $streamHeight,
            "fps": $targetFps,
            "quality": $jpegQuality,
            "clients": ${activeClients.size},
            "addresses": [${ips.joinToString(",") { "\"http://$it:${listeningPort}/stream\"" }}]
        }
        """.trimIndent()

        return newFixedLengthResponse(
            Response.Status.OK, "application/json", info
        ).apply {
            corsHeaders.forEach { (k, v) -> addHeader(k, v) }
        }
    }

    /**
     * Stop server and release resources
     */
    override fun stop() {
        // Close all client connections
        activeClients.forEach { client ->
            try { client.close() } catch (_: Exception) {}
        }
        activeClients.clear()

        stopCapture()
        super.stop()
        Log.d(TAG, "MJPEG server stopped")
    }
}
