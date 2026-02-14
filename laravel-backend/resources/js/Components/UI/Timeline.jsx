import { useTheme } from '@/Contexts/ThemeContext';

/**
 * Timeline - Vertical timeline for activity feeds and history
 * Supports icons, status colors, and connector lines
 */
export default function Timeline({ children, className = '' }) {
    return (
        <div className={`relative ${className}`}>
            {children}
        </div>
    );
}

/**
 * TimelineItem - Individual timeline entry
 */
export function TimelineItem({
    children,
    icon,
    color = 'purple',
    dotSize = 'md',
    isLast = false,
    className = '',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const dotSizes = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-10 h-10',
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    const colorStyles = {
        purple: 'bg-gradient-to-br from-purple-500 to-indigo-500 shadow-purple-500/25',
        blue: 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-blue-500/25',
        green: 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/25',
        orange: 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-orange-500/25',
        pink: 'bg-gradient-to-br from-pink-500 to-rose-500 shadow-pink-500/25',
        gray: isDark
            ? 'bg-gray-700 shadow-none'
            : 'bg-gray-300 shadow-none',
    };

    return (
        <div className={`relative flex gap-4 pb-8 last:pb-0 ${className}`}>
            {/* Connector line */}
            {!isLast && (
                <div
                    className={`
                        absolute left-[15px] top-10 w-[2px] bottom-0
                        ${isDark ? 'bg-gradient-to-b from-white/10 to-transparent' : 'bg-gradient-to-b from-gray-200 to-transparent'}
                    `}
                />
            )}

            {/* Dot / Icon */}
            <div className={`
                relative z-10 flex-shrink-0 flex items-center justify-center rounded-full shadow-lg
                ${dotSizes[dotSize]}
                ${colorStyles[color]}
            `}>
                {icon ? (
                    <span className={`text-white ${iconSizes[dotSize]}`}>{icon}</span>
                ) : (
                    <span className="w-2 h-2 rounded-full bg-white" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
                {children}
            </div>
        </div>
    );
}

/**
 * TimelineContent - Content wrapper for timeline items
 */
export function TimelineContent({
    title,
    subtitle,
    time,
    children,
    className = '',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={className}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {title}
                    </p>
                    {subtitle && (
                        <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {subtitle}
                        </p>
                    )}
                </div>
                {time && (
                    <span className={`text-xs whitespace-nowrap flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {time}
                    </span>
                )}
            </div>
            {children && (
                <div className={`
                    mt-2 text-sm rounded-xl p-3
                    ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-50 text-gray-600'}
                `}>
                    {children}
                </div>
            )}
        </div>
    );
}
