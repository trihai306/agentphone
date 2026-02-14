import { Link } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * Breadcrumb - Navigation breadcrumb trail
 * Integrates with Inertia.js Link for SPA navigation
 *
 * Usage:
 *   <Breadcrumb items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Devices', href: '/devices' },
 *     { label: 'My Phone' },
 *   ]} />
 */
export default function Breadcrumb({
    items = [],
    separator = 'chevron',
    maxItems,
    className = '',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const separators = {
        chevron: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
        ),
        slash: <span>/</span>,
        dot: <span>·</span>,
        arrow: <span>→</span>,
    };

    const separatorEl = typeof separator === 'string'
        ? separators[separator] || separators.chevron
        : separator;

    // Truncate middle items if maxItems is set
    let displayItems = items;
    if (maxItems && items.length > maxItems) {
        const start = items.slice(0, 1);
        const end = items.slice(-(maxItems - 2));
        displayItems = [
            ...start,
            { label: '...', isEllipsis: true },
            ...end,
        ];
    }

    return (
        <nav aria-label="Breadcrumb" className={className}>
            <ol className="flex items-center flex-wrap gap-1">
                {displayItems.map((item, index) => {
                    const isLast = index === displayItems.length - 1;

                    return (
                        <li key={index} className="flex items-center gap-1">
                            {index > 0 && (
                                <span className={`${isDark ? 'text-gray-600' : 'text-gray-300'}`}>
                                    {separatorEl}
                                </span>
                            )}

                            {item.isEllipsis ? (
                                <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {item.label}
                                </span>
                            ) : isLast || !item.href ? (
                                <span className={`
                                    text-sm font-medium truncate max-w-[200px]
                                    ${isDark ? 'text-white' : 'text-gray-900'}
                                `}>
                                    {item.icon && <span className="mr-1.5 inline-flex align-middle">{item.icon}</span>}
                                    {item.label}
                                </span>
                            ) : (
                                <Link
                                    href={item.href}
                                    className={`
                                        text-sm font-medium truncate max-w-[200px]
                                        transition-colors
                                        ${isDark
                                            ? 'text-gray-400 hover:text-white'
                                            : 'text-gray-500 hover:text-gray-900'
                                        }
                                    `}
                                >
                                    {item.icon && <span className="mr-1.5 inline-flex align-middle">{item.icon}</span>}
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

/**
 * BreadcrumbPage - Breadcrumb with page title integrated
 */
export function BreadcrumbPage({ items = [], title, className = '' }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={className}>
            <Breadcrumb items={items} className="mb-2" />
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {title}
            </h1>
        </div>
    );
}
