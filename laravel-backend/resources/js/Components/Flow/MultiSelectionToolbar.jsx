import React from 'react';
import { Panel } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

/**
 * MultiSelectionToolbar - Floating toolbar when multiple nodes are selected
 * Shows wrap in loop, delete, and deselect actions
 */
export default function MultiSelectionToolbar({
    selectedNodes,
    wrapSelectedNodesInLoop,
    deleteSelectedNodes,
    clearSelection,
}) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (selectedNodes.length <= 1) return null;

    return (
        <Panel position="top-center" className="!m-4 !mt-20 animate-in fade-in slide-in-from-top-2 duration-200">
            <div
                className={`flex items-center gap-1.5 p-1.5 rounded-full shadow-2xl border backdrop-blur-xl ${isDark ? 'bg-[#0a0a0a]/95 border-[#2a2a2a]' : 'bg-white/95 border-gray-200/80'}`}
                style={{
                    boxShadow: isDark
                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.05)'
                        : '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)'
                }}
            >
                {/* Selection Badge - Animated */}
                <div className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                    <div className={`absolute inset-0 rounded-full ${isDark ? 'bg-purple-500/10' : 'bg-purple-200/50'} animate-pulse`} />
                    <div className={`relative w-2 h-2 rounded-full ${isDark ? 'bg-purple-400' : 'bg-purple-500'}`}>
                        <div className={`absolute inset-0 rounded-full ${isDark ? 'bg-purple-400' : 'bg-purple-500'} animate-ping`} />
                    </div>
                    <span className={`relative text-xs font-bold tabular-nums ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                        {selectedNodes.length}
                    </span>
                </div>

                {/* Primary Action: Wrap in Loop */}
                <button
                    onClick={wrapSelectedNodesInLoop}
                    className={`group relative flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${isDark
                        ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 text-white'
                        : 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 text-white'
                        }`}
                    style={{
                        boxShadow: isDark
                            ? '0 4px 20px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
                            : '0 4px 20px rgba(139, 92, 246, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)'
                    }}
                    title="Wrap in Loop (⌘L)"
                >
                    <svg className="w-4 h-4 transition-transform group-hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Loop</span>
                </button>

                {/* Divider */}
                <div className={`w-px h-6 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

                {/* Secondary Action: Delete */}
                <button
                    onClick={deleteSelectedNodes}
                    className={`group flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${isDark
                        ? 'hover:bg-red-500/20 text-gray-500 hover:text-red-400'
                        : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                        }`}
                    title="Delete (⌫)"
                >
                    <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>

                {/* Close/Deselect Button */}
                <button
                    onClick={clearSelection}
                    className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${isDark
                        ? 'hover:bg-white/10 text-gray-600 hover:text-gray-300'
                        : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                        }`}
                    title="Deselect all (Esc)"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </Panel>
    );
}
