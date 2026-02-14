import { useEffect, useCallback } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * SlideOver - Slide-in panel from edge of screen
 * Like Modal but anchored to left/right edge
 *
 * Usage:
 *   <SlideOver isOpen={open} onClose={() => setOpen(false)} title="Settings">
 *     <p>Panel content...</p>
 *   </SlideOver>
 */
export default function SlideOver({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    position = 'right', // 'left' | 'right'
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
        full: 'max-w-full',
    };

    // Handle escape key
    const handleEscape = useCallback((e) => {
        if (e.key === 'Escape') onClose();
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

    const slideFrom = position === 'left'
        ? { open: 'translate-x-0', closed: '-translate-x-full', anchor: 'left-0' }
        : { open: 'translate-x-0', closed: 'translate-x-full', anchor: 'right-0' };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`
                    fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]
                    transition-opacity duration-300
                    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
                onClick={closeOnBackdrop ? onClose : undefined}
            />

            {/* Panel */}
            <div
                className={`
                    fixed inset-y-0 ${slideFrom.anchor} z-[100]
                    w-full ${sizeStyles[size]}
                    transform transition-transform duration-300 ease-out
                    ${isOpen ? slideFrom.open : slideFrom.closed}
                    ${className}
                `}
            >
                <div className={`
                    h-full flex flex-col shadow-2xl
                    ${isDark ? 'bg-[#111111]' : 'bg-white'}
                `}>
                    {/* Header */}
                    <div className={`
                        flex items-start justify-between px-6 py-5 border-b flex-shrink-0
                        ${isDark ? 'border-white/10' : 'border-gray-100'}
                    `}>
                        <div>
                            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {title}
                            </h2>
                            {subtitle && (
                                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {subtitle}
                                </p>
                            )}
                        </div>
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

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div className={`
                            flex items-center justify-end gap-3 px-6 py-4 border-t flex-shrink-0
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
