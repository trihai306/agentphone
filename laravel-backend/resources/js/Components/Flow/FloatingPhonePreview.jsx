import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import axios from 'axios';

/**
 * FloatingPhonePreview — Draggable phone-shaped panel showing MJPEG live stream
 * 
 * Features:
 * - Drag to move anywhere on canvas
 * - Resize by dragging bottom-right corner
 * - Minimize to floating icon
 * - Auto-starts MJPEG stream on device via API
 * - Auto-discovers MJPEG via Echo + localhost probe
 * - Phone-shaped bezel with notch
 */

const PROBE_URLS = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://10.0.2.2:8080',
];

export default function FloatingPhonePreview({ device, userId }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Position & size
    const [position, setPosition] = useState({ x: window.innerWidth - 300, y: 80 });
    const [size, setSize] = useState({ w: 240, h: 480 });
    const [minimized, setMinimized] = useState(false);

    // MJPEG
    const [mjpegUrl, setMjpegUrl] = useState('');
    const [connected, setConnected] = useState(false);
    const [probeStatus, setProbeStatus] = useState('idle'); // idle, starting, probing, found, not_found
    const imgRef = useRef(null);
    const probeAbortRef = useRef(null);
    const streamStartedRef = useRef(false);

    // Drag state
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const panelRef = useRef(null);

    // ─── Drag logic ───────────────────────────────────────────
    const handleMouseDown = useCallback((e) => {
        if (e.target.closest('[data-no-drag]')) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
    }, [position]);

    const handleResizeDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        dragOffset.current = {
            x: e.clientX,
            y: e.clientY,
            w: size.w,
            h: size.h,
        };
    }, [size]);

    useEffect(() => {
        if (!isDragging && !isResizing) return;

        const handleMouseMove = (e) => {
            if (isDragging) {
                setPosition({
                    x: Math.max(0, Math.min(window.innerWidth - 100, e.clientX - dragOffset.current.x)),
                    y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.current.y)),
                });
            }
            if (isResizing) {
                const dx = e.clientX - dragOffset.current.x;
                const dy = e.clientY - dragOffset.current.y;
                setSize({
                    w: Math.max(180, Math.min(400, dragOffset.current.w + dx)),
                    h: Math.max(320, Math.min(800, dragOffset.current.h + dy)),
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing]);

    // ─── MJPEG: Start stream + auto-discovery ──────────────────
    const startStream = useCallback(async () => {
        if (!device?.id || connected) return;
        setProbeStatus('starting');

        try {
            // Tell APK to start MJPEG server
            await axios.post(`/api/devices/${device.id}/stream/start`);
            streamStartedRef.current = true;
        } catch (err) {
            console.warn('FloatingPhonePreview: stream/start failed', err);
        }

        // Give the APK time to boot the MJPEG server
        await new Promise(r => setTimeout(r, 2000));

        // Now probe
        probeForStream();
    }, [device?.id, connected]);

    const probeForStream = useCallback(async () => {
        if (connected) return;
        setProbeStatus('probing');

        // Use Image() to probe — browsers allow <img> mixed content (http on https page)
        // Unlike fetch(), Image() can load http:// from https:// pages
        for (const baseUrl of PROBE_URLS) {
            const streamUrl = `${baseUrl}/stream`;
            try {
                const works = await new Promise((resolve) => {
                    const testImg = new Image();
                    const timeout = setTimeout(() => { testImg.src = ''; resolve(false); }, 3000);
                    testImg.onload = () => { clearTimeout(timeout); resolve(true); };
                    testImg.onerror = () => { clearTimeout(timeout); resolve(false); };
                    testImg.src = `${baseUrl}/screenshot?t=${Date.now()}`; // single frame endpoint
                });

                if (works) {
                    setMjpegUrl(streamUrl);
                    setProbeStatus('found');
                    connectMjpeg(streamUrl);
                    return;
                }
            } catch (_) { }
        }

        // Fallback: try directly connecting img to first URL
        const fallbackUrl = `${PROBE_URLS[0]}/stream`;
        setMjpegUrl(fallbackUrl);
        connectMjpeg(fallbackUrl);
    }, [connected]);

    const connectMjpeg = useCallback((url) => {
        if (!url || !imgRef.current) return;
        imgRef.current.onerror = () => { setConnected(false); setProbeStatus('not_found'); };
        imgRef.current.onload = () => { setConnected(true); setProbeStatus('found'); };
        imgRef.current.src = url;
    }, []);

    // Echo listener for MJPEG URLs from device
    useEffect(() => {
        if (!device?.id || !userId || !window.Echo) return;

        const channel = window.Echo.private(`devices.${userId}`);
        channel.listen('.webrtc.signal', (data) => {
            if (data.signal_type === 'mjpeg-info' && data.device_id === device.id) {
                const urls = (data.signal_data?.urls || []);
                if (urls.length > 0) {
                    const streamUrl = urls[0].endsWith('/stream') ? urls[0] : urls[0] + '/stream';
                    setMjpegUrl(streamUrl);
                    setProbeStatus('found');
                    connectMjpeg(streamUrl);
                }
            }
        });
        return () => channel.stopListening('.webrtc.signal');
    }, [device?.id, userId, connectMjpeg]);

    // On mount / device change → auto-start stream
    useEffect(() => {
        if (!device?.id || minimized) return;
        streamStartedRef.current = false;
        startStream();
        return () => probeAbortRef.current?.abort();
    }, [device?.id, minimized]);

    // Retry connection — restart stream + re-probe
    const handleRetry = () => {
        setConnected(false);
        setProbeStatus('idle');
        if (imgRef.current) imgRef.current.src = '';
        streamStartedRef.current = false;
        startStream();
    };

    if (!device) return null;

    // ─── Minimized state ──────────────────────────────────────
    if (minimized) {
        return (
            <div
                className="fixed z-50 cursor-pointer group"
                style={{ left: position.x, top: position.y }}
                onClick={() => setMinimized(false)}
                title="Show device preview"
            >
                <div className={`relative w-12 h-12 rounded-2xl shadow-2xl border-2 flex items-center justify-center transition-all group-hover:scale-110 ${isDark
                    ? 'bg-[#1a1a1d] border-white/20 group-hover:border-violet-500/50'
                    : 'bg-white border-gray-300 group-hover:border-violet-500'
                    }`}>
                    <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {connected && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white dark:border-[#1a1a1d] animate-pulse" />
                    )}
                </div>
            </div>
        );
    }

    // ─── Full phone preview ───────────────────────────────────
    const screenW = size.w - 16; // Bezels
    const screenH = size.h - 60; // Top bezel + bottom
    const aspectRatio = 9 / 19.5; // Modern phone aspect

    return (
        <div
            ref={panelRef}
            className={`fixed z-50 select-none ${isDragging ? 'cursor-grabbing' : ''}`}
            style={{
                left: position.x,
                top: position.y,
                width: size.w,
                filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.4))',
            }}
        >
            {/* Phone Body */}
            <div className={`rounded-[28px] overflow-hidden border-2 ${isDark
                ? 'bg-[#0f0f12] border-white/10'
                : 'bg-[#1c1c1e] border-gray-700'
                }`}>
                {/* Top Bar — Drag handle */}
                <div
                    className="flex items-center justify-between px-3 py-1.5 cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                >
                    {/* Status badges */}
                    <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : probeStatus === 'probing' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-600'}`} />
                        <span className="text-[10px] text-white/50 font-medium truncate max-w-[100px]">
                            {device?.name?.split('_').pop() || 'Device'}
                        </span>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-0.5" data-no-drag>
                        <button
                            onClick={handleRetry}
                            className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-white/10 transition-all"
                            title="Retry connection"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setMinimized(true)}
                            className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-white/10 transition-all"
                            title="Minimize"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Notch */}
                <div className="flex justify-center -mt-0.5 mb-0.5">
                    <div className="w-16 h-4 bg-black rounded-b-xl flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-800" />
                        <div className="w-6 h-1 rounded-full bg-gray-800" />
                    </div>
                </div>

                {/* Screen Area */}
                <div
                    className="mx-2 mb-2 rounded-xl overflow-hidden bg-black relative"
                    style={{ height: screenH }}
                >
                    {/* MJPEG Stream */}
                    <img
                        ref={imgRef}
                        alt="Device Screen"
                        className={`w-full h-full object-contain ${!connected ? 'hidden' : ''}`}
                    />

                    {/* Connection States */}
                    {!connected && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {(probeStatus === 'probing' || probeStatus === 'starting') ? (
                                <>
                                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-3" />
                                    <p className="text-white/40 text-[10px]">
                                        {probeStatus === 'starting' ? 'Starting stream...' : 'Connecting...'}
                                    </p>
                                </>
                            ) : probeStatus === 'not_found' ? (
                                <>
                                    <svg className="w-8 h-8 text-white/15 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-white/30 text-[10px] mb-2">No stream found</p>
                                    <button
                                        onClick={handleRetry}
                                        className="px-3 py-1 text-[10px] rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-all"
                                        data-no-drag
                                    >
                                        Start Stream
                                    </button>
                                </>
                            ) : (
                                <>
                                    <svg className="w-10 h-10 text-white/10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-white/20 text-[10px]">Waiting for device...</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Home indicator */}
                <div className="flex justify-center pb-2">
                    <div className="w-12 h-1 rounded-full bg-gray-700" />
                </div>
            </div>

            {/* Resize Handle */}
            <div
                className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize group"
                onMouseDown={handleResizeDown}
            >
                <svg className="w-3 h-3 absolute bottom-1 right-1 text-white/20 group-hover:text-white/50 transition-colors" viewBox="0 0 6 6" fill="currentColor">
                    <circle cx="5" cy="5" r="1" />
                    <circle cx="5" cy="2" r="1" />
                    <circle cx="2" cy="5" r="1" />
                </svg>
            </div>
        </div>
    );
}
