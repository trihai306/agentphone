import { useTheme } from '@/Contexts/ThemeContext';

/**
 * Alert - Notification/message component
 */
export default function Alert({
    type = 'info',
    title,
    children,
    icon,
    onClose,
    className = '',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const config = {
        info: {
            bg: isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200',
            icon: 'ℹ️',
            title: isDark ? 'text-blue-400' : 'text-blue-700',
            text: isDark ? 'text-blue-300' : 'text-blue-600',
        },
        success: {
            bg: isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200',
            icon: '✅',
            title: isDark ? 'text-emerald-400' : 'text-emerald-700',
            text: isDark ? 'text-emerald-300' : 'text-emerald-600',
        },
        warning: {
            bg: isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200',
            icon: '⚠️',
            title: isDark ? 'text-amber-400' : 'text-amber-700',
            text: isDark ? 'text-amber-300' : 'text-amber-600',
        },
        error: {
            bg: isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200',
            icon: '❌',
            title: isDark ? 'text-red-400' : 'text-red-700',
            text: isDark ? 'text-red-300' : 'text-red-600',
        },
    };

    const c = config[type] || config.info;

    return (
        <div className={`p-4 rounded-xl border ${c.bg} ${className}`}>
            <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{icon || c.icon}</span>
                <div className="flex-1 min-w-0">
                    {title && (
                        <h4 className={`font-semibold ${c.title}`}>{title}</h4>
                    )}
                    <div className={`text-sm ${c.text} ${title ? 'mt-1' : ''}`}>
                        {children}
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className={`flex-shrink-0 p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
