import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/Components/UI';
import { recordingApi } from '@/services/api';

// Inline SVG Icons
const XMarkIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const DocumentArrowDownIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

const CursorArrowRaysIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
    </svg>
);

const ArrowPathIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
);

const PlusIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const ListBulletIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

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
            const result = await recordingApi.convertToNodes({
                session_id: session.sessionId,
            });

            const data = result.data;
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

    const importModes = [
        { id: 'append', label: 'Append', Icon: PlusIcon, desc: 'Add after existing nodes' },
        { id: 'sequence', label: 'Sequence', Icon: ListBulletIcon, desc: 'Create linked sequence' },
        { id: 'replace', label: 'Replace', Icon: ArrowPathIcon, desc: 'Replace all nodes' },
    ];

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
                        <Button variant="ghost" size="icon-xs" onClick={onClose}>
                            <XMarkIcon className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Import Mode Selection */}
                    <div className="px-6 py-4 border-b border-white/5">
                        <label className="block text-sm font-medium text-gray-400 mb-3">
                            Import Mode
                        </label>
                        <div className="flex gap-2">
                            {importModes.map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setImportMode(mode.id)}
                                    className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${importMode === mode.id
                                        ? 'bg-violet-500/20 border-violet-500/50 text-violet-400'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    <mode.Icon className="w-5 h-5" />
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
                        <Button variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="gradient"
                            onClick={handleImport}
                            disabled={isLoading || previewNodes.length === 0}
                        >
                            <DocumentArrowDownIcon className="w-4 h-4" />
                            Import {previewNodes.length} Nodes
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
