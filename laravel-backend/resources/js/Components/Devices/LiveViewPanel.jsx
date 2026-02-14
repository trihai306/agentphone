import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/Contexts/ThemeContext';
import axios from 'axios';

/**
 * LiveViewPanel - WebRTC screen streaming viewer component
 *
 * Displays real-time screen stream from an Android device via WebRTC.
 * Uses Echo (Soketi/Pusher) for signaling and STUN for NAT traversal.
 *
 * Props:
 * - device: Device object { id, device_id, name, status }
 * - isOpen: Boolean to show/hide the panel
 * - onClose: Callback when panel is closed
 */
export default function LiveViewPanel({ device, isOpen, onClose }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const videoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const channelRef = useRef(null);

    const [connectionState, setConnectionState] = useState('idle'); // idle, connecting, connected, disconnected, failed
    const [streamInfo, setStreamInfo] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef(null);

    // STUN servers for NAT traversal
    const ICE_SERVERS = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ];

    /**
     * Start the WebRTC connection
     */
    const startStream = useCallback(async () => {
        if (!device?.id || connectionState === 'connecting' || connectionState === 'connected') return;

        setConnectionState('connecting');

        try {
            // 1. Create RTCPeerConnection
            const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
            peerConnectionRef.current = pc;

            // Handle incoming tracks (video stream from APK)
            pc.ontrack = (event) => {
                console.log('[WebRTC] Track received:', event.track.kind);
                if (videoRef.current && event.streams[0]) {
                    videoRef.current.srcObject = event.streams[0];
                    setConnectionState('connected');
                    setStreamInfo({
                        track: event.track,
                        stream: event.streams[0],
                    });
                }
            };

            // Handle ICE candidates - send to APK via API
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('[WebRTC] Sending ICE candidate');
                    axios.post('/api/webrtc/signal', {
                        device_id: device.id,
                        signal_type: 'ice-candidate',
                        signal_data: {
                            sdpMid: event.candidate.sdpMid,
                            sdpMLineIndex: event.candidate.sdpMLineIndex,
                            candidate: event.candidate.candidate,
                        },
                    }).catch(err => console.error('[WebRTC] Failed to send ICE:', err));
                }
            };

            // Handle connection state changes
            pc.oniceconnectionstatechange = () => {
                console.log('[WebRTC] ICE state:', pc.iceConnectionState);
                switch (pc.iceConnectionState) {
                    case 'connected':
                    case 'completed':
                        setConnectionState('connected');
                        break;
                    case 'disconnected':
                        setConnectionState('disconnected');
                        break;
                    case 'failed':
                        setConnectionState('failed');
                        break;
                    case 'closed':
                        setConnectionState('idle');
                        break;
                }
            };

            // 2. Listen for signaling events from APK via Echo
            if (window.Echo) {
                const userId = document.querySelector('meta[name="user-id"]')?.content;
                const channelName = userId ? `presence-devices.${userId}` : null;

                if (channelName) {
                    const channel = window.Echo.private(`devices.${userId}`);
                    channelRef.current = channel;

                    channel.listen('.webrtc.signal', (data) => {
                        console.log('[WebRTC] Signal received:', data.signal_type);

                        if (data.device_id !== device.id) return; // Ignore signals from other devices

                        switch (data.signal_type) {
                            case 'sdp-offer':
                                handleSdpOffer(pc, data.signal_data);
                                break;
                            case 'ice-candidate':
                                handleIceCandidate(pc, data.signal_data);
                                break;
                        }
                    });
                }
            }

            // 3. Tell the device to start streaming
            await axios.post(`/api/devices/${device.id}/stream/start`);
            console.log('[WebRTC] Stream start request sent to device');

        } catch (err) {
            console.error('[WebRTC] Failed to start stream:', err);
            setConnectionState('failed');
        }
    }, [device?.id, connectionState]);

    /**
     * Handle SDP offer from APK
     */
    const handleSdpOffer = async (pc, offerData) => {
        try {
            console.log('[WebRTC] Setting remote description (SDP offer)');
            await pc.setRemoteDescription(new RTCSessionDescription({
                type: 'offer',
                sdp: offerData.sdp,
            }));

            // Create and set SDP answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            console.log('[WebRTC] Sending SDP answer');
            await axios.post('/api/webrtc/signal', {
                device_id: device.id,
                signal_type: 'sdp-answer',
                signal_data: {
                    type: answer.type,
                    sdp: answer.sdp,
                },
            });
        } catch (err) {
            console.error('[WebRTC] SDP offer handling failed:', err);
            setConnectionState('failed');
        }
    };

    /**
     * Handle ICE candidate from APK
     */
    const handleIceCandidate = async (pc, candidateData) => {
        try {
            await pc.addIceCandidate(new RTCIceCandidate({
                sdpMid: candidateData.sdpMid,
                sdpMLineIndex: candidateData.sdpMLineIndex,
                candidate: candidateData.candidate,
            }));
            console.log('[WebRTC] Added remote ICE candidate');
        } catch (err) {
            console.error('[WebRTC] Failed to add ICE candidate:', err);
        }
    };

    /**
     * Stop the WebRTC connection
     */
    const stopStream = useCallback(async () => {
        // Tell device to stop
        if (device?.id) {
            try {
                await axios.post(`/api/devices/${device.id}/stream/stop`);
            } catch (err) {
                console.error('[WebRTC] Failed to send stop:', err);
            }
        }

        // Cleanup peer connection
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        // Cleanup Echo channel
        if (channelRef.current) {
            channelRef.current.stopListening('.webrtc.signal');
            channelRef.current = null;
        }

        // Cleanup video
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setConnectionState('idle');
        setStreamInfo(null);
    }, [device?.id]);

    /**
     * Toggle fullscreen
     */
    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen?.();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen?.();
            setIsFullscreen(false);
        }
    };

    // Auto-start when panel opens, auto-stop when panel closes
    useEffect(() => {
        if (isOpen && device?.status === 'active') {
            startStream();
        }
        return () => {
            if (!isOpen) stopStream();
        };
    }, [isOpen]);

    // Cleanup on unmount
    useEffect(() => {
        return () => { stopStream(); };
    }, []);

    // Listen for fullscreen exit
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    if (!isOpen) return null;

    const statusConfig = {
        idle: { label: t('devices.stream.idle', 'Ready'), color: 'text-gray-400', bg: 'bg-gray-500/20' },
        connecting: { label: t('devices.stream.connecting', 'Connecting...'), color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
        connected: { label: t('devices.stream.connected', 'Live'), color: 'text-green-400', bg: 'bg-green-500/20' },
        disconnected: { label: t('devices.stream.disconnected', 'Disconnected'), color: 'text-orange-400', bg: 'bg-orange-500/20' },
        failed: { label: t('devices.stream.failed', 'Connection Failed'), color: 'text-red-400', bg: 'bg-red-500/20' },
    };

    const status = statusConfig[connectionState] || statusConfig.idle;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div
                ref={containerRef}
                className={`relative w-full max-w-2xl mx-4 rounded-3xl overflow-hidden border ${
                    isDark ? 'bg-[#111113] border-white/10' : 'bg-white border-gray-200'
                } ${isFullscreen ? 'max-w-none mx-0 rounded-none h-full' : 'shadow-2xl'}`}
            >
                {/* Header */}
                <div className={`flex items-center justify-between px-5 py-3 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                        {/* Live status dot */}
                        <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                            {connectionState === 'connected' && (
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            )}
                            {connectionState === 'connecting' && (
                                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                                </svg>
                            )}
                            {status.label}
                        </span>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {device?.name || 'Device'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Fullscreen button */}
                        <button
                            onClick={toggleFullscreen}
                            className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                            title="Fullscreen"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d={isFullscreen
                                        ? "M9 9L4 4m0 0h4m-4 0v4m11-4l-5 5m5-5h-4m4 0v4m-11 6l5-5m-5 5h4m-4 0v-4m11 4l-5-5m5 5h-4m4 0v-4"
                                        : "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                                    }
                                />
                            </svg>
                        </button>

                        {/* Close button */}
                        <button
                            onClick={() => { stopStream(); onClose(); }}
                            className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-500 hover:text-red-500'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Video Area */}
                <div className="relative bg-black" style={{ aspectRatio: '9/16', maxHeight: isFullscreen ? '100vh' : '70vh' }}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-contain"
                    />

                    {/* Overlay when not connected */}
                    {connectionState !== 'connected' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80">
                            {connectionState === 'connecting' ? (
                                <>
                                    <div className="w-12 h-12 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-white/70 text-sm">{t('devices.stream.connecting', 'Connecting to device...')}</p>
                                </>
                            ) : connectionState === 'failed' || connectionState === 'disconnected' ? (
                                <>
                                    <svg className="w-16 h-16 text-red-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                    <p className="text-white/70 text-sm">{status.label}</p>
                                    <button
                                        onClick={() => { stopStream().then(() => startStream()); }}
                                        className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
                                    >
                                        {t('devices.stream.retry', 'Retry Connection')}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <svg className="w-16 h-16 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-white/50 text-sm">{t('devices.stream.waiting', 'Waiting for device...')}</p>
                                    {device?.status !== 'active' && (
                                        <p className="text-orange-400/70 text-xs">{t('devices.stream.device_offline', 'Device is offline')}</p>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer controls */}
                <div className={`flex items-center justify-between px-5 py-3 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {connectionState === 'connected' ? 'WebRTC P2P • Low latency' : 'WebRTC Screen Stream'}
                    </div>
                    <div className="flex items-center gap-2">
                        {connectionState === 'connected' ? (
                            <button
                                onClick={stopStream}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                </svg>
                                {t('devices.stream.stop', 'Stop')}
                            </button>
                        ) : connectionState === 'idle' ? (
                            <button
                                onClick={startStream}
                                disabled={device?.status !== 'active'}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {t('devices.stream.start', 'Start')}
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
