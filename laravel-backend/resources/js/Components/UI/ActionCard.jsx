import { useTheme } from '@/Contexts/ThemeContext';
import { Link } from '@inertiajs/react';

/**
 * ActionCard - Quick action card with icon, title, description
 */
export default function ActionCard({
    icon,
    title,
    description,
    href,
    onClick,
    badge,
    className = '',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const content = (
        <>
            <span className="text-2xl">{icon}</span>
            <div className="mt-3">
                <div className="flex items-center gap-2">
                    <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {title}
                    </h3>
                    {badge && (
                        <span className={`
                            px-2 py-0.5 rounded-full text-xs font-medium
                            ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}
                        `}>
                            {badge}
                        </span>
                    )}
                </div>
                {description && (
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {description}
                    </p>
                )}
            </div>
        </>
    );

    const baseStyles = `
        block p-4 rounded-xl transition-all
        ${isDark
            ? 'bg-[#1a1a1a] hover:bg-[#222]'
            : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }
        ${className}
    `;

    if (href) {
        return (
            <Link href={href} className={baseStyles}>
                {content}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={`${baseStyles} text-left w-full`}>
            {content}
        </button>
    );
}

/**
 * ActionCardGrid - Grid container for action cards
 */
export function ActionCardGrid({ children, columns = 2, className = '' }) {
    return (
        <div className={`grid grid-cols-${columns} gap-3 ${className}`}>
            {children}
        </div>
    );
}
