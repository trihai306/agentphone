import { useTheme } from '@/Contexts/ThemeContext';

/**
 * Tabs - Tab navigation component
 */
export default function Tabs({
    items = [],
    activeTab,
    onChange,
    variant = 'default', // default, pills, underline
    size = 'md',
    className = '',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-5 py-2.5 text-base',
    };

    const variants = {
        default: {
            container: `rounded-xl p-1 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`,
            tab: (active) => `
                rounded-lg font-medium transition-all
                ${active
                    ? isDark
                        ? 'bg-white text-black shadow-sm'
                        : 'bg-white text-gray-900 shadow-sm'
                    : isDark
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-500 hover:text-gray-900'
                }
            `,
        },
        pills: {
            container: 'gap-2',
            tab: (active) => `
                rounded-full font-medium transition-all
                ${active
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25'
                    : isDark
                        ? 'bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                        : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                }
            `,
        },
        underline: {
            container: `border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`,
            tab: (active) => `
                relative font-medium transition-all pb-3
                ${active
                    ? isDark
                        ? 'text-white'
                        : 'text-gray-900'
                    : isDark
                        ? 'text-gray-500 hover:text-white'
                        : 'text-gray-500 hover:text-gray-900'
                }
                ${active ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-purple-500 after:rounded-full' : ''}
            `,
        },
    };

    const v = variants[variant] || variants.default;

    return (
        <div className={`flex ${v.container} ${className}`}>
            {items.map((item) => (
                <button
                    key={item.value}
                    onClick={() => onChange(item.value)}
                    disabled={item.disabled}
                    className={`
                        ${sizeStyles[size]}
                        ${v.tab(activeTab === item.value)}
                        ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        flex items-center gap-2
                    `}
                >
                    {item.icon && <span>{item.icon}</span>}
                    {item.label}
                    {item.count !== undefined && (
                        <span className={`
                            px-1.5 py-0.5 rounded-full text-xs
                            ${activeTab === item.value
                                ? isDark ? 'bg-white/20' : 'bg-black/10'
                                : isDark ? 'bg-white/10' : 'bg-black/5'
                            }
                        `}>
                            {item.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}

/**
 * TabPanel - Content panel for tabs
 */
export function TabPanel({ children, value, activeTab, className = '' }) {
    if (value !== activeTab) return null;
    return <div className={className}>{children}</div>;
}
