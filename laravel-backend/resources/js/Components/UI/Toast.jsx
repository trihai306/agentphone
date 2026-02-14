import { useState, useCallback, createContext, useContext, useEffect, useRef } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

const ToastContext = createContext(null);

/**
 * useToast - Hook to show toast notifications
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success('Saved successfully!');
 *   toast.error('Something went wrong');
 *   toast.info('Processing...');
 *   toast.warning('Are you sure?');
 */
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

/**
 * ToastProvider - Wrap your app to enable toast notifications
 */
export function ToastProvider({ children, position = 'top-right', maxToasts = 5 }) {
    const [toasts, setToasts] = useState([]);
    const toastIdRef = useRef(0);

    const addToast = useCallback((message, options = {}) => {
        const id = ++toastIdRef.current;
        const toast = {
            id,
            message,
            type: options.type || 'info',
            duration: options.duration ?? 4000,
            title: options.title,
            action: options.action,
        };

        setToasts((prev) => {
            const next = [...prev, toast];
            return next.slice(-maxToasts);
        });

        if (toast.duration > 0) {
            setTimeout(() => {
                dismissToast(id);
            }, toast.duration);
        }

        return id;
    }, [maxToasts]);

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const api = {
        show: (message, options) => addToast(message, options),
        success: (message, options) => addToast(message, { ...options, type: 'success' }),
        error: (message, options) => addToast(message, { ...options, type: 'error' }),
        warning: (message, options) => addToast(message, { ...options, type: 'warning' }),
        info: (message, options) => addToast(message, { ...options, type: 'info' }),
        dismiss: dismissToast,
        dismissAll: () => setToasts([]),
    };

    const positionStyles = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'top-center': 'top-4 left-1/2 -translate-x-1/2',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    };

    return (
        <ToastContext.Provider value={api}>
            {children}
            {/* Toast Container */}
            <div className={`fixed z-[200] flex flex-col gap-2 ${positionStyles[position]} pointer-events-none`}>
                {toasts.map((toast) => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onDismiss={() => dismissToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

/**
 * ToastItem - Individual toast notification
 */
function ToastItem({ toast, onDismiss }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(onDismiss, 200);
    };

    const typeConfig = {
        success: {
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'text-emerald-400',
            bg: isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200',
            accent: 'bg-emerald-500',
        },
        error: {
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'text-red-400',
            bg: isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200',
            accent: 'bg-red-500',
        },
        warning: {
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            color: 'text-amber-400',
            bg: isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200',
            accent: 'bg-amber-500',
        },
        info: {
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'text-blue-400',
            bg: isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200',
            accent: 'bg-blue-500',
        },
    };

    const config = typeConfig[toast.type] || typeConfig.info;

    return (
        <div
            className={`
                pointer-events-auto w-80 rounded-2xl border shadow-2xl overflow-hidden
                transform transition-all duration-200
                ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}
                ${isDark ? 'bg-[#1a1a1a]/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl'}
                ${isDark ? 'border-white/10' : 'border-gray-200'}
            `}
        >
            {/* Accent bar */}
            <div className={`h-1 ${config.accent}`} />

            <div className="p-4 flex gap-3">
                <span className={`flex-shrink-0 mt-0.5 ${config.color}`}>
                    {config.icon}
                </span>
                <div className="flex-1 min-w-0">
                    {toast.title && (
                        <p className={`text-sm font-semibold mb-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {toast.title}
                        </p>
                    )}
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {toast.message}
                    </p>
                    {toast.action && (
                        <button
                            onClick={() => { toast.action.onClick?.(); handleDismiss(); }}
                            className={`mt-2 text-xs font-semibold ${config.color} hover:underline`}
                        >
                            {toast.action.label}
                        </button>
                    )}
                </div>
                <button
                    onClick={handleDismiss}
                    className={`
                        flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-colors
                        ${isDark ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}
                    `}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default ToastItem;
