import React from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/Components/UI';

/**
 * RecordingPanel - Floating overlay that shows during recording mode
 * Displays recording status, timer, captured actions, and controls
 */

// Helper: Format duration from seconds to MM:SS
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function RecordingPanel({
    isRecording,
    showRecordingPanel,
    setShowRecordingPanel,
    isRecordingPaused,
    recordingDuration,
    recordedActions,
    recordedNodeCount,
    selectedDevice,
    togglePauseRecording,
    undoLastAction,
    stopRecording,
}) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (!isRecording) return null;

    // Minimized recording indicator
    if (!showRecordingPanel) {
        return (
            <Button
                variant="secondary"
                onClick={() => setShowRecordingPanel(true)}
                className={`absolute top-4 right-4 z-50 ${isDark ? 'border-red-500/30' : 'border-red-200'}`}
            >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className={`text-xs font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    {formatDuration(recordingDuration)}
                </span>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    • {recordedNodeCount} actions
                </span>
            </Button>
        );
    }

    // Full recording panel
    return (
        <div className={`absolute top-4 right-4 z-50 w-80 rounded-2xl shadow-2xl border overflow-hidden ${isDark ? 'bg-[#1a1a1a]/95 border-red-500/30 backdrop-blur-lg' : 'bg-white/95 border-red-200 backdrop-blur-lg'
            }`}>
            {/* Header */}
            <div className={`px-4 py-3 border-b ${isDark ? 'border-[#2a2a2a] bg-red-500/10' : 'border-red-100 bg-red-50'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                        <span className={`text-sm font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                            Recording
                        </span>
                        <span className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {formatDuration(recordingDuration)}
                        </span>
                    </div>
                    <Button variant="ghost" size="icon-xs" onClick={() => setShowRecordingPanel(false)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </Button>
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {selectedDevice?.name} • {recordedNodeCount} actions
                </p>
            </div>

            {/* Action List */}
            <div className="max-h-48 overflow-y-auto">
                {recordedActions.length === 0 ? (
                    <div className={`p-4 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                        </svg>
                        <p className="text-xs">Waiting for actions...</p>
                        <p className="text-[10px] mt-1 opacity-70">Interact with the app on your device</p>
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {recordedActions.slice(-5).map((action, idx) => (
                            <div
                                key={action.nodeId}
                                className={`flex items-center gap-2 p-2 rounded-lg ${isDark ? 'bg-[#252525]' : 'bg-gray-50'
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                                    }`}>
                                    {recordedActions.length - 4 + idx}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {action.label}
                                    </p>
                                </div>
                                {action.screenshotUrl && (
                                    <img
                                        src={action.screenshotUrl}
                                        alt=""
                                        className="w-8 h-8 rounded object-cover border border-gray-500/20"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className={`p-3 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={togglePauseRecording}
                        className="flex-1"
                    >
                        {isRecordingPaused ? (
                            <>
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                Resume
                            </>
                        ) : (
                            <>
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                Pause
                            </>
                        )}
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={undoLastAction}
                        disabled={recordedActions.length === 0}
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        Undo
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={stopRecording}
                    >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                        Stop
                    </Button>
                </div>
            </div>
        </div>
    );
}
