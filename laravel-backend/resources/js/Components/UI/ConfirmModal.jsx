import { createContext, useContext, useState, useCallback } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const ConfirmContext = createContext();

export function ConfirmProvider({ children }) {
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning', // 'warning' | 'danger' | 'info'
        confirmText: '',
        cancelText: '',
        onConfirm: null,
        onCancel: null,
    });

    const showConfirm = useCallback(({
        title = 'Xác nhận',
        message,
        type = 'warning',
        confirmText = 'Xác nhận',
        cancelText = 'Hủy',
        onConfirm,
        onCancel,
    }) => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                title,
                message,
                type,
                confirmText,
                cancelText,
                onConfirm: () => {
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                    onConfirm?.();
                    resolve(true);
                },
                onCancel: () => {
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                    onCancel?.();
                    resolve(false);
                },
            });
        });
    }, []);

    const hideConfirm = useCallback(() => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <ConfirmContext.Provider value={{ showConfirm, hideConfirm }}>
            {children}
            <ConfirmModal {...confirmState} />
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within ConfirmProvider');
    }
    return context;
}

function ConfirmModal({
    isOpen,
    title,
    message,
    type,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { t } = useTranslation();

    if (!isOpen) return null;

    const typeConfig = {
        warning: {
            icon: (
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            iconBg: 'bg-amber-100 dark:bg-amber-900/30',
            confirmBg: 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
            confirmShadow: 'shadow-amber-500/30',
        },
        danger: {
            icon: (
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            ),
            iconBg: 'bg-red-100 dark:bg-red-900/30',
            confirmBg: 'from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600',
            confirmShadow: 'shadow-red-500/30',
        },
        info: {
            icon: (
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            confirmBg: 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
            confirmShadow: 'shadow-blue-500/30',
        },
    };

    const config = typeConfig[type] || typeConfig.warning;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal */}
            <div
                className={`relative w-full max-w-md p-6 rounded-2xl shadow-2xl transform transition-all animate-scaleIn
                    ${isDark
                        ? 'bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a]'
                        : 'bg-white border border-gray-200'
                    }`}
            >
                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${config.iconBg}`}>
                        {config.icon}
                    </div>
                </div>

                {/* Title */}
                <h3 className={`text-xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {title}
                </h3>

                {/* Message */}
                <p className={`text-center mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {message}
                </p>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all
                            ${isDark
                                ? 'bg-[#252525] hover:bg-[#303030] text-gray-300'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                    >
                        {cancelText || t('common.cancel', { defaultValue: 'Hủy' })}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-white transition-all
                            bg-gradient-to-r ${config.confirmBg} shadow-lg ${config.confirmShadow}
                            hover:scale-[1.02] active:scale-[0.98]`}
                    >
                        {confirmText || t('common.confirm', { defaultValue: 'Xác nhận' })}
                    </button>
                </div>
            </div>
        </div>
    );
}
