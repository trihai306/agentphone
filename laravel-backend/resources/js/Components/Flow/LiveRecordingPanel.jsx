import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecordingSync } from '@/hooks/useRecordingSync';

// Inline SVG Icons
const VideoCameraIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
    </svg>
);

const XMarkIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const DevicePhoneMobileIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    </svg>
);

const ClockIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CursorArrowRaysIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
    </svg>
);

const ArrowsPointingInIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
    </svg>
);

const ArrowsPointingOutIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
    </svg>
);

const DocumentArrowDownIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

/**
 * Live Recording Panel - Shows real-time recording events in Flow Editor
 * Glassmorphic, draggable, minimizable panel
 */
export default function LiveRecordingPanel({
    userId,
    onImportNodes,
    onClose,
    className = ''
}) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [duration, setDuration] = useState('00:00');

    const {
        isConnected,
        activeSession,
        events,
        eventCount,
        isRecording,
        clearSession,
        getDuration,
    } = useRecordingSync(userId, {
        onSessionStopped: (data) => {
            // Session completed, can import nodes
        },
    });

    // Update duration timer
    useEffect(() => {
        if (!isRecording) return;

        const interval = setInterval(() => {
            setDuration(getDuration());
        }, 1000);

        return () => clearInterval(interval);
    }, [isRecording, getDuration]);

    // Handle import nodes
    const handleImport = useCallback(async () => {
        if (!activeSession?.sessionId) return;

        try {
            const response = await fetch('/api/recording/convert-to-nodes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: JSON.stringify({
                    session_id: activeSession.sessionId,
                }),
            });

            const data = await response.json();
            if (data.success) {
                onImportNodes?.(data.nodes, data.edges);
                clearSession();
            }
        } catch (error) {
            console.error('Failed to convert to nodes:', error);
        }
    }, [activeSession, onImportNodes, clearSession]);

    // Event type icons
    const getEventIcon = (eventType) => {
        switch (eventType) {
            case 'tap':
            case 'click':
                return '👆';
            case 'long_tap':
            case 'long_click':
                return '👇';
            case 'scroll':
            case 'swipe':
                return '📜';
            case 'input_text':
            case 'type':
                return '⌨️';
            case 'back':
                return '◀️';
            case 'home':
                return '🏠';
            default:
                return '⚡';
        }
    };

    // Don't render if no active session and not connected
    if (!activeSession && !isRecording) {
        if (!isConnected) return null;

        // Show idle state
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`fixed bottom-4 right-4 z-[45] ${className}`}
            >
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container/80 backdrop-blur-xl border border-white/10 text-sm text-gray-400">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Recording sync ready
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`fixed bottom-4 right-4 z-[45] ${className}`}
        >
            <div className="w-80 rounded-2xl bg-surface-container/90 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <VideoCameraIcon className="w-5 h-5 text-red-500" />
                            {isRecording && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            )}
                        </div>
                        <span className="font-medium text-white">
                            {isRecording ? 'LIVE RECORDING' : 'Recording Complete'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            {isMinimized ? (
                                <ArrowsPointingOutIcon className="w-4 h-4 text-gray-400" />
                            ) : (
                                <ArrowsPointingInIcon className="w-4 h-4 text-gray-400" />
                            )}
                        </button>
                        <button
                            onClick={() => {
                                clearSession();
                                onClose?.();
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {!isMinimized && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                        >
                            {/* Device Info */}
                            <div className="px-4 py-3 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-violet-500/20">
                                        <DevicePhoneMobileIcon className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-white truncate">
                                            {activeSession?.deviceName || 'Unknown Device'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {activeSession?.deviceModel}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3 p-4 border-b border-white/5">
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
                                    <ClockIcon className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm font-mono text-white">{duration}</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
                                    <CursorArrowRaysIcon className="w-4 h-4 text-green-400" />
                                    <span className="text-sm font-medium text-white">{eventCount} events</span>
                                </div>
                            </div>

                            {/* Event Stream */}
                            <div className="max-h-40 overflow-y-auto p-3">
                                <div className="flex flex-wrap gap-1.5">
                                    <AnimatePresence mode="popLayout">
                                        {events.slice(-20).map((event, index) => (
                                            <motion.div
                                                key={`${event.sequence_number}-${index}`}
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0, opacity: 0 }}
                                                className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs"
                                                title={event.event_type}
                                            >
                                                <span className="mr-1">{getEventIcon(event.event_type)}</span>
                                                <span className="text-gray-400 capitalize">
                                                    {event.event_type?.replace('_', ' ')}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Actions */}
                            {!isRecording && eventCount > 0 && (
                                <div className="p-4 border-t border-white/5">
                                    <button
                                        onClick={handleImport}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-medium hover:from-violet-500 hover:to-blue-500 transition-all"
                                    >
                                        <DocumentArrowDownIcon className="w-5 h-5" />
                                        Import as Nodes
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
