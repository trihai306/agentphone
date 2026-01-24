import React from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { LogIcon } from './FlowIcons';

/**
 * ExecutionLogPanel - Bottom panel showing execution log entries
 */
export default function ExecutionLogPanel({
    showLogPanel,
    setShowLogPanel,
    executionLog,
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (!showLogPanel || executionLog.length === 0) return null;

    return (
        <div className={`h-48 border-t flex flex-col ${isDark ? 'bg-[#0f0f0f] border-[#1e1e1e]' : 'bg-white border-gray-200'}`}>
            {/* Header */}
            <div className={`h-10 px-4 flex items-center justify-between flex-shrink-0 border-b ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Execution Log</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-[#1a1a1a] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                        {executionLog.length} entries
                    </span>
                </div>
                <button
                    onClick={() => setShowLogPanel(false)}
                    className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${isDark ? 'hover:bg-[#1a1a1a] text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Log Entries */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 flow-editor-sidebar">
                {executionLog.map((entry) => (
                    <div
                        key={entry.id}
                        className={`execution-log-entry flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isDark ? '' : ''}`}
                    >
                        <LogIcon type={entry.type} />
                        <span className={`text-xs font-mono ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`flex-1 ${entry.type === 'success' ? 'text-emerald-400' :
                                entry.type === 'error' ? 'text-red-400' :
                                    entry.type === 'warning' ? 'text-amber-400' :
                                        isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            {entry.message}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
