package com.agent.portal.streaming

import android.content.Context
import android.media.projection.MediaProjection
import android.util.Log
import com.agent.portal.auth.SessionManager
import com.agent.portal.utils.NetworkUtils
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import org.webrtc.*

/**
 * WebRTCManager handles WebRTC peer connection lifecycle for screen streaming.
 *
 * Flow:
 * 1. Browser requests stream → APK receives via Soketi
 * 2. APK creates PeerConnection + SDP Offer
 * 3. Sends SDP Offer to browser via Laravel API → Soketi
 * 4. Browser sends SDP Answer back
 * 5. ICE candidates exchanged
 * 6. P2P H.264 video stream established
 */
object WebRTCManager {
    private const val TAG = "CLICKAI:WebRTC"

    // WebRTC components
    private var peerConnectionFactory: PeerConnectionFactory? = null
    private var peerConnection: PeerConnection? = null
    private var localVideoTrack: VideoTrack? = null
    private var videoCapturer: ScreenCapturerAndroid? = null

    // State
    private var isStreaming = false
    private var viewerUserId: Int? = null
    private var contextRef: Context? = null

    // Coroutine scope
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    // STUN servers for NAT traversal
    private val iceServers = listOf(
        PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer(),
        PeerConnection.IceServer.builder("stun:stun1.l.google.com:19302").createIceServer(),
        PeerConnection.IceServer.builder("stun:stun2.l.google.com:19302").createIceServer()
    )

    /**
     * Initialize WebRTC factory (call once)
     */
    fun initialize(context: Context) {
        if (peerConnectionFactory != null) return
        contextRef = context.applicationContext

        // Initialize WebRTC
        val initOptions = PeerConnectionFactory.InitializationOptions.builder(context)
            .setEnableInternalTracer(false)
            .createInitializationOptions()
        PeerConnectionFactory.initialize(initOptions)

        // Create factory with H.264 codec
        val encoderFactory = DefaultVideoEncoderFactory(
            EglBase.create().eglBaseContext,
            true, // enableIntelVp8Encoder
            true  // enableH264HighProfile
        )
        val decoderFactory = DefaultVideoDecoderFactory(
            EglBase.create().eglBaseContext
        )

        peerConnectionFactory = PeerConnectionFactory.builder()
            .setVideoEncoderFactory(encoderFactory)
            .setVideoDecoderFactory(decoderFactory)
            .createPeerConnectionFactory()

        Log.d(TAG, "WebRTC initialized successfully")
    }

    /**
     * Start streaming - create peer connection and generate SDP offer
     */
    fun startStreaming(
        mediaProjectionPermissionResultData: android.content.Intent,
        viewerUserId: Int,
        screenWidth: Int = 720,
        screenHeight: Int = 1280,
        screenDpi: Int = 320
    ) {
        if (isStreaming) {
            Log.w(TAG, "Already streaming, ignoring start request")
            return
        }

        val factory = peerConnectionFactory ?: run {
            Log.e(TAG, "PeerConnectionFactory not initialized")
            return
        }

        this.viewerUserId = viewerUserId
        isStreaming = true
        Log.d(TAG, "Starting screen stream for viewer userId=$viewerUserId")

        // Create peer connection
        val rtcConfig = PeerConnection.RTCConfiguration(iceServers).apply {
            sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
            continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY
        }

        peerConnection = factory.createPeerConnection(rtcConfig, object : PeerConnection.Observer {
            override fun onIceCandidate(candidate: IceCandidate) {
                Log.d(TAG, "ICE candidate: ${candidate.sdpMid}")
                sendSignalingData("ice-candidate", JSONObject().apply {
                    put("sdpMid", candidate.sdpMid)
                    put("sdpMLineIndex", candidate.sdpMLineIndex)
                    put("candidate", candidate.sdp)
                })
            }

            override fun onIceConnectionChange(state: PeerConnection.IceConnectionState) {
                Log.d(TAG, "ICE connection state: $state")
                if (state == PeerConnection.IceConnectionState.DISCONNECTED ||
                    state == PeerConnection.IceConnectionState.FAILED) {
                    Log.w(TAG, "ICE connection lost, stopping stream")
                    stopStreaming()
                }
            }

            override fun onSignalingChange(state: PeerConnection.SignalingState) {
                Log.d(TAG, "Signaling state: $state")
            }

            override fun onIceConnectionReceivingChange(receiving: Boolean) {}
            override fun onIceGatheringChange(state: PeerConnection.IceGatheringState) {}
            override fun onIceCandidatesRemoved(candidates: Array<out IceCandidate>?) {}
            override fun onAddStream(stream: MediaStream) {}
            override fun onRemoveStream(stream: MediaStream) {}
            override fun onDataChannel(channel: DataChannel) {}
            override fun onRenegotiationNeeded() {}
            override fun onAddTrack(receiver: RtpReceiver, streams: Array<out MediaStream>) {}
        })

        // Create screen capturer
        videoCapturer = ScreenCapturerAndroid(
            mediaProjectionPermissionResultData,
            object : MediaProjection.Callback() {
                override fun onStop() {
                    Log.d(TAG, "MediaProjection stopped")
                    stopStreaming()
                }
            }
        )

        // Create video source and track
        val videoSource = factory.createVideoSource(videoCapturer!!.isScreencast)
        val surfaceTextureHelper = SurfaceTextureHelper.create(
            "ScreenCaptureThread",
            EglBase.create().eglBaseContext
        )
        videoCapturer?.initialize(surfaceTextureHelper, contextRef!!, videoSource.capturerObserver)
        videoCapturer?.startCapture(screenWidth, screenHeight, 30) // 30 FPS

        localVideoTrack = factory.createVideoTrack("screen_track", videoSource)
        localVideoTrack?.setEnabled(true)

        // Add track to peer connection
        peerConnection?.addTrack(localVideoTrack, listOf("screen_stream"))

        // Create SDP offer
        val mediaConstraints = MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "false"))
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "false"))
        }

        peerConnection?.createOffer(object : SdpObserver {
            override fun onCreateSuccess(sdp: SessionDescription) {
                Log.d(TAG, "SDP offer created")
                peerConnection?.setLocalDescription(object : SdpObserver {
                    override fun onSetSuccess() {
                        Log.d(TAG, "Local description set, sending offer to browser")
                        sendSignalingData("sdp-offer", JSONObject().apply {
                            put("type", sdp.type.canonicalForm())
                            put("sdp", sdp.description)
                        })
                    }
                    override fun onSetFailure(error: String) {
                        Log.e(TAG, "Failed to set local description: $error")
                    }
                    override fun onCreateSuccess(sdp: SessionDescription?) {}
                    override fun onCreateFailure(error: String?) {}
                }, sdp)
            }

            override fun onCreateFailure(error: String) {
                Log.e(TAG, "Failed to create SDP offer: $error")
            }
            override fun onSetSuccess() {}
            override fun onSetFailure(error: String?) {}
        }, mediaConstraints)

        Log.d(TAG, "Screen capture started at ${screenWidth}x${screenHeight}@30fps")
    }

    /**
     * Handle SDP answer from browser
     */
    fun handleSdpAnswer(sdpJson: JSONObject) {
        val sdp = SessionDescription(
            SessionDescription.Type.ANSWER,
            sdpJson.getString("sdp")
        )
        peerConnection?.setRemoteDescription(object : SdpObserver {
            override fun onSetSuccess() {
                Log.d(TAG, "Remote description set successfully - stream connected!")
            }
            override fun onSetFailure(error: String) {
                Log.e(TAG, "Failed to set remote description: $error")
            }
            override fun onCreateSuccess(sdp: SessionDescription?) {}
            override fun onCreateFailure(error: String?) {}
        }, sdp)
    }

    /**
     * Handle ICE candidate from browser
     */
    fun handleIceCandidate(candidateJson: JSONObject) {
        val candidate = IceCandidate(
            candidateJson.getString("sdpMid"),
            candidateJson.getInt("sdpMLineIndex"),
            candidateJson.getString("candidate")
        )
        peerConnection?.addIceCandidate(candidate)
        Log.d(TAG, "Added remote ICE candidate")
    }

    /**
     * Stop streaming and clean up
     */
    fun stopStreaming() {
        if (!isStreaming) return
        isStreaming = false
        Log.d(TAG, "Stopping screen stream")

        try {
            videoCapturer?.stopCapture()
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping capturer", e)
        }
        videoCapturer?.dispose()
        videoCapturer = null

        localVideoTrack?.dispose()
        localVideoTrack = null

        peerConnection?.close()
        peerConnection?.dispose()
        peerConnection = null

        viewerUserId = null
        Log.d(TAG, "Screen stream stopped and cleaned up")
    }

    /**
     * Send signaling data to browser via Laravel API
     */
    private fun sendSignalingData(type: String, data: JSONObject) {
        scope.launch {
            try {
                val context = contextRef ?: return@launch
                val baseUrl = NetworkUtils.getApiBaseUrl()
                val sessionManager = SessionManager(context)
                val token = sessionManager.getToken() ?: return@launch
                val userId = sessionManager.getUserId() ?: return@launch

                val payload = JSONObject().apply {
                    put("device_id", userId as Any)  // explicit cast to resolve overload
                    put("viewer_user_id", viewerUserId as Any)
                    put("signal_type", type)
                    put("signal_data", data)
                }

                val client = OkHttpClient()
                val request = Request.Builder()
                    .url("$baseUrl/webrtc/signal")
                    .addHeader("Authorization", "Bearer $token")
                    .addHeader("Content-Type", "application/json")
                    .addHeader("Accept", "application/json")
                    .post(payload.toString().toRequestBody("application/json".toMediaTypeOrNull()))
                    .build()

                val response = client.newCall(request).execute()
                if (response.isSuccessful) {
                    Log.d(TAG, "Signaling data sent: $type")
                } else {
                    Log.e(TAG, "Failed to send signaling: ${response.code} ${response.body?.string()}")
                }
                response.close()
            } catch (e: Exception) {
                Log.e(TAG, "Error sending signaling data", e)
            }
        }
    }

    fun isCurrentlyStreaming(): Boolean = isStreaming

    /**
     * Cleanup everything
     */
    fun shutdown() {
        stopStreaming()
        peerConnectionFactory?.dispose()
        peerConnectionFactory = null
        contextRef = null
        scope.cancel()
    }
}
