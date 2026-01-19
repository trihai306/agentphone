import { createContext, useContext, useState, useCallback } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

// Context for confirm modal
const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: 'Xác nhận',
        message: 'Bạn có chắc chắn?',
        confirmText: 'Xác nhận',
        cancelText: 'Hủy',
        type: 'danger',
        resolve: null,
    });

    const showConfirm = useCallback((options) => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                title: options.title || 'Xác nhận',
                message: options.message || 'Bạn có chắc chắn?',
                confirmText: options.confirmText || 'Xác nhận',
                cancelText: options.cancelText || 'Hủy',
                type: options.type || 'danger',
                resolve,
            });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        if (confirmState.resolve) {
            confirmState.resolve(true);
        }
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    }, [confirmState.resolve]);

    const handleCancel = useCallback(() => {
        if (confirmState.resolve) {
            confirmState.resolve(false);
        }
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    }, [confirmState.resolve]);

    return (
        <ConfirmContext.Provider value={{ showConfirm }}>
            {children}
            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={handleCancel}
                onConfirm={handleConfirm}
                title={confirmState.title}
                message={confirmState.message}
                confirmText={confirmState.confirmText}
                cancelText={confirmState.cancelText}
                type={confirmState.type}
            />
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
}

/**
 * Professional Confirm Modal
 * Thay thế window.confirm() với UI đẹp hơn
 */
export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Xác nhận',
    message = 'Bạn có chắc chắn?',
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    type = 'danger', // 'danger' | 'warning' | 'info' | 'success'
    icon = null,
    isLoading = false,
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (!isOpen) return null;

    const typeConfig = {
        danger: {
            bg: 'from-red-500 to-rose-600',
            iconBg: isDark ? 'bg-red-500/20' : 'bg-red-100',
            iconColor: 'text-red-500',
            buttonBg: 'from-red-500 to-rose-600',
            shadow: 'shadow-red-500/25',
            defaultIcon: '🗑️',
        },
        warning: {
            bg: 'from-amber-500 to-orange-600',
            iconBg: isDark ? 'bg-amber-500/20' : 'bg-amber-100',
            iconColor: 'text-amber-500',
            buttonBg: 'from-amber-500 to-orange-600',
            shadow: 'shadow-amber-500/25',
            defaultIcon: '⚠️',
        },
        info: {
            bg: 'from-blue-500 to-cyan-600',
            iconBg: isDark ? 'bg-blue-500/20' : 'bg-blue-100',
            iconColor: 'text-blue-500',
            buttonBg: 'from-blue-500 to-cyan-600',
            shadow: 'shadow-blue-500/25',
            defaultIcon: 'ℹ️',
        },
        success: {
            bg: 'from-emerald-500 to-teal-600',
            iconBg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-100',
            iconColor: 'text-emerald-500',
            buttonBg: 'from-emerald-500 to-teal-600',
            shadow: 'shadow-emerald-500/25',
            defaultIcon: '✓',
        },
    };

    const config = typeConfig[type] || typeConfig.danger;
    const displayIcon = icon || config.defaultIcon;

    const handleConfirm = () => {
        if (!isLoading) {
            onConfirm();
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div
                    className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl transform transition-all
                        ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`px-6 py-5 flex items-center gap-4 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${config.iconBg}`}>
                            {displayIcon}
                        </div>
                        <div className="flex-1">
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {title}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                                ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-5">
                        <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {message}
                        </p>
                    </div>

                    {/* Footer */}
                    <div className={`px-6 py-4 flex items-center justify-end gap-3 border-t ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all
                                ${isDark
                                    ? 'text-gray-400 hover:bg-white/10'
                                    : 'text-gray-500 hover:bg-gray-100'
                                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white 
                                bg-gradient-to-r ${config.buttonBg} shadow-lg ${config.shadow}
                                hover:scale-[1.02] active:scale-[0.98] transition-all
                                flex items-center gap-2
                                ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading && (
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            )}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
