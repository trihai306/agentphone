import { memo, useState } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { Button } from '@/Components/UI';
import RecordingPreview from './RecordingPreview';

/**
 * WorkflowPreviewModal - Modal to preview recorded workflow as slideshow
 * Enhanced to show ALL action nodes with fallback for missing screenshots
 */
function WorkflowPreviewModal({ isOpen, onClose, nodes = [], workflowName = 'Workflow' }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (!isOpen) return null;

    // Filter action nodes (exclude start/end/control nodes) - RecordingPreview handles screenshot fallback
    const actionNodes = nodes.filter(n => {
        const type = n.type || n.data?.eventType;
        const excludeTypes = ['input', 'output', 'start', 'end', 'condition', 'loop', 'data_source'];
        return !excludeTypes.includes(type);
    });

    // Count nodes with screenshots for stats
    const nodesWithScreenshots = actionNodes.filter(n => n.data?.screenshotUrl).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`relative w-full max-w-lg mx-4 rounded-3xl overflow-hidden ${isDark ? 'bg-[#0f0f0f]' : 'bg-white'}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                    boxShadow: isDark
                        ? '0 0 60px rgba(99, 102, 241, 0.15), 0 25px 80px rgba(0, 0, 0, 0.7)'
                        : '0 25px 80px rgba(0, 0, 0, 0.25)',
                    border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                }}
            >
                {/* Gradient Header */}
                <div
                    className="absolute top-0 left-0 right-0 h-24 pointer-events-none"
                    style={{
                        background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.15) 0%, transparent 100%)',
                    }}
                />

                {/* Header */}
                <div className={`relative flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            }}
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Workflow Preview
                            </h2>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {workflowName} • {actionNodes.length} steps {nodesWithScreenshots > 0 && `(${nodesWithScreenshots} with screenshots)`}
                            </p>
                        </div>
                    </div>

                    <Button variant="ghost" size="icon-xs" onClick={onClose}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {actionNodes.length > 0 ? (
                        <RecordingPreview
                            nodes={actionNodes}
                            autoPlay={true}
                            loop={true}
                            interval={2000}
                        />
                    ) : (
                        <div className={`flex flex-col items-center justify-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm font-medium mb-1">No Actions Found</p>
                            <p className="text-xs text-center max-w-xs">
                                Add action nodes to your workflow to preview them here
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`px-6 py-4 border-t flex items-center justify-between ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            Tap
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-cyan-500" />
                            Swipe
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                            Type
                        </span>
                    </div>

                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default memo(WorkflowPreviewModal);
