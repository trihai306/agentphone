import React from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

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
            <button
                onClick={() => setShowRecordingPanel(true)}
                className={`absolute top-4 right-4 z-50 px-4 py-2 rounded-xl shadow-lg border flex items-center gap-2 ${isDark ? 'bg-[#1a1a1a]/95 border-red-500/30' : 'bg-white border-red-200'
                    }`}
            >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className={`text-xs font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    {formatDuration(recordingDuration)}
                </span>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    • {recordedNodeCount} actions
                </span>
            </button>
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
                    <button
                        onClick={() => setShowRecordingPanel(false)}
                        className={`p-1 rounded hover:bg-gray-500/20 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
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
                    <button
                        onClick={togglePauseRecording}
                        className={`flex-1 h-8 flex items-center justify-center gap-1 text-xs font-medium rounded-lg transition-colors ${isRecordingPaused
                            ? isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-600'
                            : isDark ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-600'
                            }`}
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
                    </button>
                    <button
                        onClick={undoLastAction}
                        disabled={recordedActions.length === 0}
                        className={`h-8 px-3 flex items-center gap-1 text-xs font-medium rounded-lg transition-colors ${recordedActions.length === 0
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                            } ${isDark ? 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        Undo
                    </button>
                    <button
                        onClick={stopRecording}
                        className={`h-8 px-4 flex items-center gap-1 text-xs font-medium rounded-lg transition-colors ${isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                    >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                        Stop
                    </button>
                </div>
            </div>
        </div>
    );
}
