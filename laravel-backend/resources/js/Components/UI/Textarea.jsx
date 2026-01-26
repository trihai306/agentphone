import { useTheme } from '@/Contexts/ThemeContext';
import { forwardRef } from 'react';

/**
 * Textarea - Multi-line text input with dark mode support
 */
const Textarea = forwardRef(function Textarea({
    label,
    error,
    rows = 4,
    resize = 'vertical',
    className = '',
    containerClassName = '',
    ...props
}, ref) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const resizeStyles = {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize',
    };

    const baseStyles = `
        w-full px-4 py-3 rounded-xl transition-all duration-200
        ${isDark
            ? 'bg-[#1a1a1a] text-white placeholder-gray-500 border-[#2a2a2a]'
            : 'bg-white text-gray-900 placeholder-gray-400 border-gray-200'
        }
        border focus:outline-none focus:ring-2
        ${error
            ? 'border-red-500 focus:ring-red-500/20'
            : isDark
                ? 'focus:border-purple-500 focus:ring-purple-500/20'
                : 'focus:border-blue-500 focus:ring-blue-500/20'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
    `;

    return (
        <div className={containerClassName}>
            {label && (
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {label}
                </label>
            )}
            <textarea
                ref={ref}
                rows={rows}
                className={`${baseStyles} ${resizeStyles[resize]} ${className}`}
                {...props}
            />
            {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
});

export default Textarea;
