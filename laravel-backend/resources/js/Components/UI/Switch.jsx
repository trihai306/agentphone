import { useTheme } from '@/Contexts/ThemeContext';
import { forwardRef } from 'react';

/**
 * Switch - Toggle switch component
 */
const Switch = forwardRef(function Switch({
    checked = false,
    onChange,
    label,
    description,
    size = 'md',
    disabled = false,
    className = '',
    ...props
}, ref) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const sizes = {
        sm: { switch: 'w-8 h-5', dot: 'w-3 h-3', translate: 'translate-x-3.5' },
        md: { switch: 'w-11 h-6', dot: 'w-4 h-4', translate: 'translate-x-5' },
        lg: { switch: 'w-14 h-8', dot: 'w-6 h-6', translate: 'translate-x-6' },
    };

    const s = sizes[size];

    return (
        <label className={`flex items-start gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
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
                        ${s.switch} rounded-full transition-colors
                        ${checked
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                            : isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'
                        }
                    `}
                />
                <div
                    className={`
                        absolute top-1 left-1 ${s.dot} rounded-full bg-white shadow
                        transition-transform
                        ${checked ? s.translate : 'translate-x-0'}
                    `}
                />
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
    );
});

export default Switch;
