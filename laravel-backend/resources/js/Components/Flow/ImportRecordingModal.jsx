import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    DocumentArrowDownIcon,
    CursorArrowRaysIcon,
    ArrowPathIcon,
    PlusIcon,
    Squares2X2Icon,
    ListBulletIcon,
} from '@heroicons/react/24/outline';

/**
 * Import Recording Modal - Preview and import recorded events as workflow nodes
 */
export default function ImportRecordingModal({
    isOpen,
    onClose,
    session,
    onImport,
    isLoading = false,
}) {
    const [importMode, setImportMode] = useState('append'); // append | replace | sequence
    const [previewNodes, setPreviewNodes] = useState([]);
    const [isConverting, setIsConverting] = useState(false);

    // Fetch preview nodes
    const fetchPreview = useCallback(async () => {
        if (!session?.sessionId) return;

        setIsConverting(true);
        try {
            const response = await fetch('/api/recording/convert-to-nodes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: JSON.stringify({
                    session_id: session.sessionId,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setPreviewNodes(data.nodes);
            }
        } catch (error) {
            console.error('Failed to fetch preview:', error);
        } finally {
            setIsConverting(false);
        }
    }, [session]);

    // Handle import
    const handleImport = useCallback(() => {
        onImport?.(previewNodes, importMode);
        onClose();
    }, [previewNodes, importMode, onImport, onClose]);

    // Event type to icon mapping
    const getNodeIcon = (type) => {
        const icons = {
            TapNode: '👆',
            LongTapNode: '👇',
            ScrollNode: '📜',
            InputNode: '⌨️',
            SystemNode: '⚙️',
            GestureNode: '🖐️',
            ActionNode: '⚡',
        };
        return icons[type] || '📦';
    };

    React.useEffect(() => {
        if (isOpen && session) {
            fetchPreview();
        }
    }, [isOpen, session, fetchPreview]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-2xl mx-4 bg-surface-container rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20">
                                <DocumentArrowDownIcon className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Import Recording</h2>
                                <p className="text-sm text-gray-500">
                                    {session?.eventCount || 0} events captured
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Import Mode Selection */}
                    <div className="px-6 py-4 border-b border-white/5">
                        <label className="block text-sm font-medium text-gray-400 mb-3">
                            Import Mode
                        </label>
                        <div className="flex gap-2">
                            {[
                                { id: 'append', label: 'Append', icon: PlusIcon, desc: 'Add after existing nodes' },
                                { id: 'sequence', label: 'Sequence', icon: ListBulletIcon, desc: 'Create linked sequence' },
                                { id: 'replace', label: 'Replace', icon: ArrowPathIcon, desc: 'Replace all nodes' },
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setImportMode(mode.id)}
                                    className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${importMode === mode.id
                                            ? 'bg-violet-500/20 border-violet-500/50 text-violet-400'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    <mode.icon className="w-5 h-5" />
                                    <span className="text-sm font-medium">{mode.label}</span>
                                    <span className="text-xs text-gray-500">{mode.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Node Preview */}
                    <div className="px-6 py-4 max-h-80 overflow-y-auto">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-gray-400">
                                Generated Nodes ({previewNodes.length})
                            </label>
                            <button
                                onClick={fetchPreview}
                                disabled={isConverting}
                                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
                            >
                                <ArrowPathIcon className={`w-3 h-3 ${isConverting ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>

                        {isConverting ? (
                            <div className="flex items-center justify-center py-12">
                                <ArrowPathIcon className="w-8 h-8 text-violet-400 animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {previewNodes.map((node, index) => (
                                    <motion.div
                                        key={node.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                                    >
                                        <span className="text-lg">{getNodeIcon(node.type)}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-white truncate">
                                                {node.data?.label || node.type}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {node.type}
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-600">#{index + 1}</span>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {!isConverting && previewNodes.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <CursorArrowRaysIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No events to convert</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 bg-white/2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={isLoading || previewNodes.length === 0}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-medium hover:from-violet-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <DocumentArrowDownIcon className="w-4 h-4" />
                            Import {previewNodes.length} Nodes
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
