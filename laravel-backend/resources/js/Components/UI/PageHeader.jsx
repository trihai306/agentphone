import { useTheme } from '@/Contexts/ThemeContext';
import { Link } from '@inertiajs/react';

/**
 * PageHeader - Main page header with title, subtitle, breadcrumbs, and actions
 */
export default function PageHeader({
    title,
    subtitle,
    breadcrumbs = [],
    actions,
    backHref,
    className = '',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={`mb-8 ${className}`}>
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-2 text-sm mb-3">
                    {breadcrumbs.map((crumb, i) => (
                        <span key={i} className="flex items-center gap-2">
                            {i > 0 && (
                                <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>/</span>
                            )}
                            {crumb.href ? (
                                <Link
                                    href={crumb.href}
                                    className={`transition-colors ${isDark
                                        ? 'text-gray-500 hover:text-white'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                    {crumb.label}
                                </span>
                            )}
                        </span>
                    ))}
                </nav>
            )}

            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    {/* Back button */}
                    {backHref && (
                        <Link
                            href={backHref}
                            className={`
                                w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                                ${isDark
                                    ? 'bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                                    : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                                }
                            `}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                    )}
                    <div>
                        <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {title}
                        </h1>
                        {subtitle && (
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {actions && (
                    <div className="flex items-center gap-3">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
