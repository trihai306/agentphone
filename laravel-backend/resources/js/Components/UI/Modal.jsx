import { useTheme } from '@/Contexts/ThemeContext';
import { useEffect, useCallback } from 'react';

/**
 * Modal - Generic modal/dialog component
 */
export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    closeOnBackdrop = true,
    showCloseButton = true,
    footer,
    className = '',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const sizeStyles = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        full: 'max-w-[90vw]',
    };

    // Handle escape key
    const handleEscape = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleEscape]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity"
                onClick={closeOnBackdrop ? onClose : undefined}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div
                    className={`
                        w-full ${sizeStyles[size]} rounded-2xl overflow-hidden shadow-2xl
                        transform transition-all
                        ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}
                        ${className}
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    {title && (
                        <div className={`
                            px-6 py-4 flex items-center justify-between border-b
                            ${isDark ? 'border-white/10' : 'border-gray-100'}
                        `}>
                            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {title}
                            </h3>
                            {showCloseButton && (
                                <button
                                    onClick={onClose}
                                    className={`
                                        w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                                        ${isDark
                                            ? 'text-gray-400 hover:text-white hover:bg-white/10'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                        }
                                    `}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div className={`
                            px-6 py-4 flex items-center justify-end gap-3 border-t
                            ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}
                        `}>
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

/**
 * ModalFooter - Pre-styled footer with cancel/confirm buttons
 */
export function ModalFooter({
    cancelText = 'Cancel',
    confirmText = 'Confirm',
    onCancel,
    onConfirm,
    isLoading = false,
    variant = 'primary', // primary, danger
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const variantStyles = {
        primary: isDark
            ? 'bg-white text-black hover:bg-gray-100'
            : 'bg-gray-900 text-white hover:bg-gray-800',
        danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25',
    };

    return (
        <>
            <button
                onClick={onCancel}
                disabled={isLoading}
                className={`
                    px-5 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${isDark
                        ? 'text-gray-400 hover:bg-white/10'
                        : 'text-gray-500 hover:bg-gray-100'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                {cancelText}
            </button>
            <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`
                    px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
                    flex items-center gap-2
                    ${variantStyles[variant]}
                    ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
                `}
            >
                {isLoading && (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                )}
                {confirmText}
            </button>
        </>
    );
}
