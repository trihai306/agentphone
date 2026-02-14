/**
 * ClearConfirmModal - Confirmation dialog for clearing all nodes
 * 
 * Extracted from Editor.jsx Phase 15 refactor.
 * Displays a warning modal before clearing all workflow nodes.
 */
import React from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/Components/UI';

export default function ClearConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    nodeCount,
}) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            {/* Modal */}
            <div className={`relative z-10 w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
                {/* Header */}
                <div className={`px-6 py-4 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Clear All Nodes</h3>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>This action cannot be undone</p>
                        </div>
                    </div>
                </div>
                {/* Content */}
                <div className="px-6 py-4">
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Are you sure you want to delete <span className="font-bold text-red-500">{nodeCount}</span> node{nodeCount !== 1 ? 's' : ''}?
                        All workflow data will be permanently removed.
                    </p>
                </div>
                {/* Actions */}
                <div className={`px-6 py-4 flex gap-3 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                    <Button variant="secondary" className="flex-1" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="danger" className="flex-1" onClick={onConfirm}>
                        Delete All
                    </Button>
                </div>
            </div>
        </div>
    );
}
