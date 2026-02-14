import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/Contexts/ThemeContext';
import axios from 'axios';

/**
 * LiveViewPanel - Dual-mode screen streaming viewer
 *
 * Mode 1: MJPEG Direct — Browser connects to phone's HTTP server (same network/USB)
 * Mode 2: WebRTC P2P — Stream via signaling relay (over internet)
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

    // Stream mode: 'mjpeg' or 'webrtc'
    const [streamMode, setStreamMode] = useState('mjpeg');
    const [connectionState, setConnectionState] = useState('idle');
    const [streamInfo, setStreamInfo] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mjpegUrl, setMjpegUrl] = useState('');
    const [mjpegConnected, setMjpegConnected] = useState(false);

    const videoRef = useRef(null);
    const imgRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const channelRef = useRef(null);
    const containerRef = useRef(null);

    // STUN servers for WebRTC NAT traversal
    const ICE_SERVERS = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ];

    // ============================================================
    // MJPEG MODE — Direct connection to phone's HTTP server
    // ============================================================

    const startMjpegStream = useCallback(() => {
        if (!mjpegUrl) return;
        setConnectionState('connecting');

        // For MJPEG, the browser natively handles multipart/x-mixed-replace
        // Simply set the <img> src to the MJPEG URL
        if (imgRef.current) {
            imgRef.current.onerror = () => {
                console.error('[MJPEG] Connection failed');
                setConnectionState('failed');
                setMjpegConnected(false);
            };
            imgRef.current.onload = () => {
                if (!mjpegConnected) {
                    console.log('[MJPEG] Connected — stream active');
                    setConnectionState('connected');
                    setMjpegConnected(true);
                }
            };
            imgRef.current.src = mjpegUrl;
        }
    }, [mjpegUrl, mjpegConnected]);

    const stopMjpegStream = useCallback(() => {
        if (imgRef.current) {
            imgRef.current.src = '';
        }
        setMjpegConnected(false);
        setConnectionState('idle');
    }, []);

    // ============================================================
    // WEBRTC MODE — P2P stream via signaling
    // ============================================================

    const startWebRTCStream = useCallback(async () => {
        if (!device?.id || connectionState === 'connecting' || connectionState === 'connected') return;
        setConnectionState('connecting');

        try {
            const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
            peerConnectionRef.current = pc;

            pc.ontrack = (event) => {
                console.log('[WebRTC] Track received:', event.track.kind);
                if (videoRef.current && event.streams[0]) {
                    videoRef.current.srcObject = event.streams[0];
                    setConnectionState('connected');
                    setStreamInfo({ track: event.track, stream: event.streams[0] });
                }
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
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

            pc.oniceconnectionstatechange = () => {
                switch (pc.iceConnectionState) {
                    case 'connected': case 'completed': setConnectionState('connected'); break;
                    case 'disconnected': setConnectionState('disconnected'); break;
                    case 'failed': setConnectionState('failed'); break;
                    case 'closed': setConnectionState('idle'); break;
                }
            };

            // Echo signaling
            if (window.Echo) {
                const userId = document.querySelector('meta[name="user-id"]')?.content;
                if (userId) {
                    const channel = window.Echo.private(`devices.${userId}`);
                    channelRef.current = channel;
                    channel.listen('.webrtc.signal', (data) => {
                        if (data.device_id !== device.id) return;
                        if (data.signal_type === 'sdp-offer') handleSdpOffer(pc, data.signal_data);
                        else if (data.signal_type === 'ice-candidate') handleIceCandidate(pc, data.signal_data);
                    });
                }
            }

            await axios.post(`/api/devices/${device.id}/stream/start`);
        } catch (err) {
            console.error('[WebRTC] Failed to start:', err);
            setConnectionState('failed');
        }
    }, [device?.id, connectionState]);

    const handleSdpOffer = async (pc, offerData) => {
        try {
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: offerData.sdp }));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await axios.post('/api/webrtc/signal', {
                device_id: device.id,
                signal_type: 'sdp-answer',
                signal_data: { type: answer.type, sdp: answer.sdp },
            });
        } catch (err) {
            console.error('[WebRTC] SDP offer handling failed:', err);
            setConnectionState('failed');
        }
    };

    const handleIceCandidate = async (pc, candidateData) => {
        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidateData));
        } catch (err) {
            console.error('[WebRTC] Failed to add ICE:', err);
        }
    };

    const stopWebRTCStream = useCallback(async () => {
        if (device?.id) {
            try { await axios.post(`/api/devices/${device.id}/stream/stop`); } catch (_) { }
        }
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;
        channelRef.current?.stopListening('.webrtc.signal');
        channelRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        setConnectionState('idle');
        setStreamInfo(null);
    }, [device?.id]);

    // ============================================================
    // Unified controls
    // ============================================================

    const startStream = useCallback(() => {
        if (streamMode === 'mjpeg') startMjpegStream();
        else startWebRTCStream();
    }, [streamMode, startMjpegStream, startWebRTCStream]);

    const stopStream = useCallback(async () => {
        if (streamMode === 'mjpeg') stopMjpegStream();
        else await stopWebRTCStream();
    }, [streamMode, stopMjpegStream, stopWebRTCStream]);

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

    // Auto cleanup on close
    useEffect(() => {
        return () => { stopStream(); };
    }, []);

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // When switching mode, stop current stream
    const handleModeSwitch = (newMode) => {
        if (newMode === streamMode) return;
        stopStream();
        setStreamMode(newMode);
    };

    if (!isOpen) return null;

    const statusConfig = {
        idle: { label: 'Ready', color: 'text-gray-400', bg: 'bg-gray-500/20' },
        connecting: { label: 'Connecting...', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
        connected: { label: 'Live', color: 'text-green-400', bg: 'bg-green-500/20' },
        disconnected: { label: 'Disconnected', color: 'text-orange-400', bg: 'bg-orange-500/20' },
        failed: { label: 'Connection Failed', color: 'text-red-400', bg: 'bg-red-500/20' },
    };

    const status = statusConfig[connectionState] || statusConfig.idle;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div
                ref={containerRef}
                className={`relative w-full max-w-2xl mx-4 rounded-3xl overflow-hidden border ${isDark ? 'bg-[#111113] border-white/10' : 'bg-white border-gray-200'
                    } ${isFullscreen ? 'max-w-none mx-0 rounded-none h-full' : 'shadow-2xl'}`}
            >
                {/* Header */}
                <div className={`flex items-center justify-between px-5 py-3 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
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
                        <button onClick={toggleFullscreen}
                            className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                            title="Fullscreen"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d={isFullscreen
                                        ? "M9 9L4 4m0 0h4m-4 0v4m11-4l-5 5m5-5h-4m4 0v4m-11 6l5-5m-5 5h4m-4 0v-4m11 4l-5-5m5 5h-4m4 0v-4"
                                        : "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"}
                                />
                            </svg>
                        </button>
                        <button onClick={() => { stopStream(); onClose(); }}
                            className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-500 hover:text-red-500'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mode Selector */}
                <div className={`flex items-center gap-2 px-5 py-2.5 border-b ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>
                    <div className={`flex rounded-xl p-0.5 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                        <button
                            onClick={() => handleModeSwitch('mjpeg')}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${streamMode === 'mjpeg'
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm'
                                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Direct (MJPEG)
                        </button>
                        <button
                            onClick={() => handleModeSwitch('webrtc')}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${streamMode === 'webrtc'
                                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm'
                                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            WebRTC (P2P)
                        </button>
                    </div>
                    <span className={`text-[11px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {streamMode === 'mjpeg' ? 'Same network / USB' : 'Over internet'}
                    </span>
                </div>

                {/* MJPEG URL Input (only for MJPEG mode) */}
                {streamMode === 'mjpeg' && connectionState !== 'connected' && (
                    <div className={`px-5 py-3 border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                        <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Phone stream URL
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={mjpegUrl}
                                onChange={(e) => setMjpegUrl(e.target.value)}
                                placeholder="http://192.168.1.x:8080/stream"
                                className={`flex-1 px-3 py-2 text-sm rounded-xl border ${isDark
                                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-600'
                                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                    } focus:outline-none focus:ring-2 focus:ring-emerald-500/40`}
                            />
                            <button
                                onClick={startMjpegStream}
                                disabled={!mjpegUrl}
                                className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Connect
                            </button>
                        </div>
                        <p className={`mt-1.5 text-[11px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            Open the Portal APK → Start MJPEG Stream → enter the URL shown
                        </p>
                    </div>
                )}

                {/* Video/Image Area */}
                <div className="relative bg-black" style={{ aspectRatio: '9/16', maxHeight: isFullscreen ? '100vh' : '60vh' }}>
                    {/* MJPEG mode — <img> tag */}
                    {streamMode === 'mjpeg' && (
                        <img
                            ref={imgRef}
                            alt="Live Stream"
                            className={`w-full h-full object-contain ${connectionState !== 'connected' ? 'hidden' : ''}`}
                        />
                    )}

                    {/* WebRTC mode — <video> tag */}
                    {streamMode === 'webrtc' && (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-contain ${connectionState !== 'connected' ? 'hidden' : ''}`}
                        />
                    )}

                    {/* Overlay when not connected */}
                    {connectionState !== 'connected' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80">
                            {connectionState === 'connecting' ? (
                                <>
                                    <div className="w-12 h-12 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-white/70 text-sm">Connecting to device...</p>
                                </>
                            ) : connectionState === 'failed' || connectionState === 'disconnected' ? (
                                <>
                                    <svg className="w-16 h-16 text-red-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                    <p className="text-white/70 text-sm">{status.label}</p>
                                    <button
                                        onClick={() => { stopStream(); setTimeout(startStream, 300); }}
                                        className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
                                    >
                                        Retry Connection
                                    </button>
                                </>
                            ) : (
                                <>
                                    <svg className="w-16 h-16 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-white/50 text-sm">
                                        {streamMode === 'mjpeg'
                                            ? 'Enter phone IP to connect'
                                            : 'Waiting for device...'}
                                    </p>
                                    {device?.status !== 'active' && streamMode === 'webrtc' && (
                                        <p className="text-orange-400/70 text-xs">Device is offline</p>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer controls */}
                <div className={`flex items-center justify-between px-5 py-3 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {connectionState === 'connected'
                            ? streamMode === 'mjpeg'
                                ? 'MJPEG Direct • ~15 FPS'
                                : 'WebRTC P2P • Low latency'
                            : streamMode === 'mjpeg'
                                ? 'Direct connection (same network)'
                                : 'WebRTC Screen Stream'}
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
                                Stop
                            </button>
                        ) : connectionState === 'idle' && streamMode === 'webrtc' ? (
                            <button
                                onClick={startWebRTCStream}
                                disabled={device?.status !== 'active'}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Start Stream
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
