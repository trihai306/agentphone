import { useTheme } from '@/Contexts/ThemeContext';

/**
 * ProgressBar - Animated progress indicator with gradient support
 * Variants: default, gradient, striped
 */
export default function ProgressBar({
    value = 0,
    max = 100,
    variant = 'default',
    color = 'purple',
    size = 'md',
    showLabel = false,
    label,
    animated = true,
    className = '',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeStyles = {
        xs: 'h-1',
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-4',
        xl: 'h-6',
    };

    const colorStyles = {
        purple: 'bg-purple-500',
        blue: 'bg-blue-500',
        green: 'bg-emerald-500',
        orange: 'bg-orange-500',
        pink: 'bg-pink-500',
        cyan: 'bg-cyan-500',
    };

    const gradientStyles = {
        purple: 'bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500',
        blue: 'bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400',
        green: 'bg-gradient-to-r from-emerald-500 via-green-400 to-teal-400',
        orange: 'bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400',
        pink: 'bg-gradient-to-r from-pink-500 via-rose-400 to-fuchsia-500',
        cyan: 'bg-gradient-to-r from-cyan-500 via-blue-400 to-indigo-400',
    };

    const barColor = variant === 'gradient'
        ? gradientStyles[color]
        : colorStyles[color];

    const stripedOverlay = variant === 'striped'
        ? 'bg-[length:1rem_1rem] bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)]'
        : '';

    return (
        <div className={`w-full ${className}`}>
            {(showLabel || label) && (
                <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {label || `${Math.round(percentage)}%`}
                    </span>
                    {label && showLabel && (
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {Math.round(percentage)}%
                        </span>
                    )}
                </div>
            )}
            <div className={`
                w-full rounded-full overflow-hidden
                ${sizeStyles[size]}
                ${isDark ? 'bg-white/10' : 'bg-gray-200'}
            `}>
                <div
                    className={`
                        h-full rounded-full
                        ${barColor}
                        ${stripedOverlay}
                        ${animated ? 'transition-all duration-700 ease-out' : ''}
                        ${variant === 'striped' && animated ? 'animate-[progress-stripe_1s_linear_infinite]' : ''}
                    `}
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={max}
                />
            </div>
        </div>
    );
}

/**
 * CircularProgress - Circular progress indicator
 */
export function CircularProgress({
    value = 0,
    max = 100,
    size = 48,
    strokeWidth = 4,
    color = 'purple',
    showValue = true,
    className = '',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const colors = {
        purple: 'stroke-purple-500',
        blue: 'stroke-blue-500',
        green: 'stroke-emerald-500',
        orange: 'stroke-orange-500',
        pink: 'stroke-pink-500',
        cyan: 'stroke-cyan-500',
    };

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    className={isDark ? 'stroke-white/10' : 'stroke-gray-200'}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    className={`${colors[color]} transition-all duration-700 ease-out`}
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset,
                    }}
                />
            </svg>
            {showValue && (
                <span className={`absolute text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {Math.round(percentage)}%
                </span>
            )}
        </div>
    );
}
