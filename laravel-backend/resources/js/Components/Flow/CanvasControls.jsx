import React from 'react';
import { Panel } from 'reactflow';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/Components/UI';

/**
 * CanvasControls - Bottom-left panel with undo/redo and zoom controls
 */
export default function CanvasControls({
    undo,
    redo,
    canUndo,
    canRedo,
    zoomIn,
    zoomOut,
    fitView,
}) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const buttonClass = (enabled = true) => `w-10 h-10 flex items-center justify-center transition-all ${enabled
        ? isDark ? 'text-gray-400 hover:text-white hover:bg-[#252525]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
        : isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
        }`;

    const Divider = () => (
        <div className={`w-px h-6 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />
    );

    return (
        <Panel position="bottom-left" className="!m-4">
            <div className={`flex items-center rounded-xl overflow-hidden shadow-xl border ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
                {/* Undo Button */}
                <Button variant="ghost" size="icon-sm" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                </Button>

                {/* Redo Button */}
                <Button variant="ghost" size="icon-sm" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                    </svg>
                </Button>

                <Divider />

                {/* Zoom Out */}
                <Button variant="ghost" size="icon-sm" onClick={() => zoomOut()} title="Zoom out">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                </Button>

                <Divider />

                {/* Zoom In */}
                <Button variant="ghost" size="icon-sm" onClick={() => zoomIn()} title="Zoom in">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </Button>

                <Divider />

                {/* Fit View */}
                <Button variant="ghost" size="icon-sm" onClick={() => fitView({ padding: 0.2 })} title="Fit view">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </Button>
            </div>
        </Panel>
    );
}
