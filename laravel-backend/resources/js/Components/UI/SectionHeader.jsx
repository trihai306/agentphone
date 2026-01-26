import { useTheme } from '@/Contexts/ThemeContext';
import { Link } from '@inertiajs/react';

/**
 * SectionHeader - Section title with optional action link
 */
export default function SectionHeader({
    title,
    action,
    actionHref,
    onAction,
    className = '',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={`flex items-center justify-between mb-4 ${className}`}>
            <h2 className={`text-sm font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {title}
            </h2>
            {action && (
                actionHref ? (
                    <Link
                        href={actionHref}
                        className={`text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        {action} →
                    </Link>
                ) : onAction ? (
                    <button
                        onClick={onAction}
                        className={`text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        {action} →
                    </button>
                ) : null
            )}
        </div>
    );
}

/**
 * SectionTitle - Larger section title for main content areas
 */
export function SectionTitle({ children, subtitle, className = '' }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={`mb-6 ${className}`}>
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {children}
            </h2>
            {subtitle && (
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {subtitle}
                </p>
            )}
        </div>
    );
}
