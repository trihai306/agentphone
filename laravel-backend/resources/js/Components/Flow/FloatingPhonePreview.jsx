import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import axios from 'axios';

/**
 * FloatingPhonePreview — Minimal floating screen preview
 * 
 * Shows ONLY the device screen, no phone frame/notch/home indicator.
 * Receives frames via Echo WebSocket relay.
 */
export default function FloatingPhonePreview({ device, userId }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Position & size
    const [position, setPosition] = useState({ x: window.innerWidth - 280, y: 80 });
    const [size, setSize] = useState({ w: 220, h: 420 });
    const [minimized, setMinimized] = useState(false);

    // Stream state
    const [frameData, setFrameData] = useState(null);
    const [connected, setConnected] = useState(false);
    const [status, setStatus] = useState('idle');
    const channelRef = useRef(null);
    const streamTimeoutRef = useRef(null);

    // Drag state
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const [showControls, setShowControls] = useState(false);

    // ─── Drag ─────────────────────────────────────────────────
    const handleMouseDown = useCallback((e) => {
        if (e.target.closest('[data-no-drag]')) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }, [position]);

    const handleResizeDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        dragOffset.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h };
    }, [size]);

    useEffect(() => {
        if (!isDragging && !isResizing) return;
        const move = (e) => {
            if (isDragging) {
                setPosition({
                    x: Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dragOffset.current.x)),
                    y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.current.y)),
                });
            }
            if (isResizing) {
                const dx = e.clientX - dragOffset.current.x;
                const dy = e.clientY - dragOffset.current.y;
                setSize({
                    w: Math.max(140, Math.min(400, dragOffset.current.w + dx)),
                    h: Math.max(250, Math.min(800, dragOffset.current.h + dy)),
                });
            }
        };
        const up = () => { setIsDragging(false); setIsResizing(false); };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    }, [isDragging, isResizing]);

    // ─── Echo stream ──────────────────────────────────────────
    const startStream = useCallback(() => {
        if (!device?.id || !userId || !window.Echo) {
            setStatus('error');
            return;
        }
        setStatus('connecting');

        axios.post(`/api/devices/${device.id}/stream/start`).catch(() => { });

        const channel = window.Echo.private(`devices.${userId}`);
        channelRef.current = channel;

        channel.listen('.screen.frame', (data) => {
            if (data.device_id === device.id || !data.device_id) {
                setFrameData(`data:image/jpeg;base64,${data.frame}`);
                setConnected(true);
                setStatus('live');

                if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
                streamTimeoutRef.current = setTimeout(() => {
                    setStatus('error');
                    setConnected(false);
                }, 5000);
            }
        });

        streamTimeoutRef.current = setTimeout(() => {
            if (status !== 'live') setStatus('error');
        }, 10000);
    }, [device?.id, userId]);

    const stopStream = useCallback(() => {
        channelRef.current?.stopListening('.screen.frame');
        channelRef.current = null;
        if (streamTimeoutRef.current) { clearTimeout(streamTimeoutRef.current); streamTimeoutRef.current = null; }
        if (device?.id) axios.post(`/api/devices/${device.id}/stream/stop`).catch(() => { });
    }, [device?.id]);

    useEffect(() => {
        if (!device?.id || minimized) return;
        startStream();
        return () => stopStream();
    }, [device?.id, minimized]);

    useEffect(() => () => stopStream(), []);

    const handleRetry = () => {
        stopStream();
        setConnected(false);
        setFrameData(null);
        setStatus('idle');
        setTimeout(() => startStream(), 200);
    };

    if (!device) return null;

    // ─── Minimized pill ───────────────────────────────────────
    if (minimized) {
        return (
            <div
                className="fixed z-50 cursor-pointer group"
                style={{ left: position.x, top: position.y }}
                onClick={() => setMinimized(false)}
            >
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-2xl border backdrop-blur-xl transition-all group-hover:scale-105 ${isDark ? 'bg-black/70 border-white/10' : 'bg-white/90 border-gray-200'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                    <span className={`text-[11px] font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                        {device?.name?.split('_').pop() || 'Screen'}
                    </span>
                </div>
            </div>
        );
    }

    // ─── Screen only ──────────────────────────────────────────
    return (
        <div
            className={`fixed z-50 select-none ${isDragging ? 'cursor-grabbing' : ''}`}
            style={{ left: position.x, top: position.y, width: size.w }}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => !isDragging && setShowControls(false)}
        >
            {/* Screen container */}
            <div
                className="rounded-2xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing relative"
                style={{ height: size.h }}
                onMouseDown={handleMouseDown}
            >
                {/* Live frame */}
                {frameData && status === 'live' && (
                    <img
                        src={frameData}
                        alt=""
                        className="w-full h-full object-cover"
                        draggable={false}
                    />
                )}

                {/* Status overlays */}
                {status !== 'live' && (
                    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center">
                        {status === 'connecting' ? (
                            <>
                                <div className="w-6 h-6 border-2 border-violet-500/60 border-t-transparent rounded-full animate-spin mb-2" />
                                <p className="text-white/30 text-[10px]">Connecting...</p>
                            </>
                        ) : status === 'error' ? (
                            <>
                                <p className="text-white/25 text-[10px] mb-2">No stream</p>
                                <button
                                    onClick={handleRetry}
                                    className="px-3 py-1 text-[10px] rounded-lg bg-white/10 text-white/50 hover:bg-white/20 transition-all"
                                    data-no-drag
                                >
                                    Retry
                                </button>
                            </>
                        ) : (
                            <p className="text-white/15 text-[10px]">Waiting...</p>
                        )}
                    </div>
                )}

                {/* Hover controls — top right */}
                <div
                    className={`absolute top-1.5 right-1.5 flex items-center gap-0.5 transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0'
                        }`}
                    data-no-drag
                >
                    {/* Live indicator */}
                    {status === 'live' && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold text-emerald-300/80 bg-black/50 backdrop-blur-sm uppercase tracking-wider mr-1">
                            live
                        </span>
                    )}
                    <button
                        onClick={handleRetry}
                        className="w-6 h-6 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur-sm text-white/50 hover:text-white hover:bg-black/70 transition-all"
                        title="Retry"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    <button
                        onClick={() => { stopStream(); setMinimized(true); }}
                        className="w-6 h-6 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur-sm text-white/50 hover:text-white hover:bg-black/70 transition-all"
                        title="Minimize"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Resize handle */}
            <div
                className={`absolute bottom-0 right-0 w-5 h-5 cursor-se-resize transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0'}`}
                onMouseDown={handleResizeDown}
            >
                <svg className="w-3 h-3 absolute bottom-0.5 right-0.5 text-white/30" viewBox="0 0 6 6" fill="currentColor">
                    <circle cx="5" cy="5" r="1" />
                    <circle cx="5" cy="2" r="1" />
                    <circle cx="2" cy="5" r="1" />
                </svg>
            </div>
        </div>
    );
}
