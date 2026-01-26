import { useTheme } from '@/Contexts/ThemeContext';
import { forwardRef } from 'react';

/**
 * Input - Text input component with dark mode support
 * Supports labels, errors, icons, and multiple sizes
 */
const Input = forwardRef(function Input({
    label,
    error,
    icon,
    iconRight,
    size = 'md',
    className = '',
    containerClassName = '',
    ...props
}, ref) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const sizeStyles = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-3 text-base',
        lg: 'px-5 py-4 text-lg',
    };

    const baseStyles = `
        w-full rounded-xl transition-all duration-200
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
            <div className="relative">
                {icon && (
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {icon}
                    </div>
                )}
                <input
                    ref={ref}
                    className={`
                        ${baseStyles}
                        ${sizeStyles[size]}
                        ${icon ? 'pl-11' : ''}
                        ${iconRight ? 'pr-11' : ''}
                        ${className}
                    `}
                    {...props}
                />
                {iconRight && (
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {iconRight}
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
});

export default Input;

/**
 * SearchInput - Input with search icon
 */
export function SearchInput({ placeholder = 'Search...', ...props }) {
    return (
        <Input
            type="search"
            placeholder={placeholder}
            icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            }
            {...props}
        />
    );
}
