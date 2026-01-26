import { useTheme } from '@/Contexts/ThemeContext';

/**
 * Divider - Horizontal divider component
 */
export default function Divider({
    text,
    className = '',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (text) {
        return (
            <div className={`flex items-center gap-4 ${className}`}>
                <div className={`flex-1 h-px ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />
                <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{text}</span>
                <div className={`flex-1 h-px ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />
            </div>
        );
    }

    return (
        <div className={`h-px ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'} ${className}`} />
    );
}

/**
 * VerticalDivider - Vertical divider component
 */
export function VerticalDivider({ className = '' }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={`w-px h-full ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'} ${className}`} />
    );
}
