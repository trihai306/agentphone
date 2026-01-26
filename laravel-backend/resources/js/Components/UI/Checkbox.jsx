import { useTheme } from '@/Contexts/ThemeContext';
import { forwardRef } from 'react';

/**
 * Checkbox - Checkbox component with label
 */
const Checkbox = forwardRef(function Checkbox({
    checked = false,
    onChange,
    label,
    description,
    error,
    size = 'md',
    disabled = false,
    indeterminate = false,
    className = '',
    ...props
}, ref) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    return (
        <div className={className}>
            <label className={`flex items-start gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="relative flex-shrink-0 mt-0.5">
                    <input
                        ref={ref}
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onChange?.(e.target.checked)}
                        disabled={disabled}
                        className="sr-only"
                        {...props}
                    />
                    <div
                        className={`
                            ${sizes[size]} rounded-md border-2 transition-all flex items-center justify-center
                            ${checked || indeterminate
                                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 border-purple-500'
                                : isDark
                                    ? 'border-[#3a3a3a] bg-[#1a1a1a]'
                                    : 'border-gray-300 bg-white'
                            }
                            ${error ? 'border-red-500' : ''}
                        `}
                    >
                        {checked && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        {indeterminate && !checked && (
                            <div className="w-2 h-0.5 bg-white rounded-full" />
                        )}
                    </div>
                </div>
                {(label || description) && (
                    <div>
                        {label && (
                            <span className={`block font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {label}
                            </span>
                        )}
                        {description && (
                            <span className={`block text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {description}
                            </span>
                        )}
                    </div>
                )}
            </label>
            {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
});

export default Checkbox;
