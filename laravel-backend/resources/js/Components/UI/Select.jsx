import { useTheme } from '@/Contexts/ThemeContext';
import { forwardRef } from 'react';

/**
 * Select - Dropdown select component with dark mode support
 */
const Select = forwardRef(function Select({
    label,
    error,
    options = [],
    placeholder = 'Select an option',
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
        w-full rounded-xl transition-all duration-200 appearance-none cursor-pointer
        ${isDark
            ? 'bg-[#1a1a1a] text-white border-[#2a2a2a]'
            : 'bg-white text-gray-900 border-gray-200'
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
                <select
                    ref={ref}
                    className={`${baseStyles} ${sizeStyles[size]} pr-10 ${className}`}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
});

export default Select;
