import { useTheme } from '@/Contexts/ThemeContext';
import { Link } from '@inertiajs/react';

/**
 * EmptyState - Empty state placeholder with icon, title, description, and action
 */
export default function EmptyState({
    icon = '📭',
    title = 'No data',
    description,
    actionLabel,
    actionHref,
    onAction,
    className = '',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={`text-center py-12 px-6 ${className}`}>
            <div className={`
                w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4
                ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}
            `}>
                <span className="text-3xl">{icon}</span>
            </div>
            <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {title}
            </h3>
            {description && (
                <p className={`text-sm mt-2 max-w-sm mx-auto ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {description}
                </p>
            )}
            {(actionLabel && (actionHref || onAction)) && (
                <div className="mt-6">
                    {actionHref ? (
                        <Link
                            href={actionHref}
                            className={`
                                inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all
                                ${isDark
                                    ? 'bg-white text-black hover:bg-gray-100'
                                    : 'bg-gray-900 text-white hover:bg-gray-800'
                                }
                            `}
                        >
                            {actionLabel}
                        </Link>
                    ) : (
                        <button
                            onClick={onAction}
                            className={`
                                inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all
                                ${isDark
                                    ? 'bg-white text-black hover:bg-gray-100'
                                    : 'bg-gray-900 text-white hover:bg-gray-800'
                                }
                            `}
                        >
                            {actionLabel}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * EmptyStateCard - EmptyState wrapped in a card
 */
export function EmptyStateCard({ className = '', ...props }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={`
            rounded-xl
            ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}
            ${className}
        `}>
            <EmptyState {...props} />
        </div>
    );
}
