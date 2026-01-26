import { useTheme } from '@/Contexts/ThemeContext';

/**
 * Badge - Status indicator component
 * Supports multiple variants and sizes with dark mode
 */
export default function Badge({
    children,
    variant = 'default',
    size = 'md',
    dot = false,
    className = '',
    ...props
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const sizeStyles = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
    };

    const dotSizes = {
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-2.5 h-2.5',
    };

    const variants = {
        default: isDark
            ? 'bg-gray-800 text-gray-300 border-gray-700'
            : 'bg-gray-100 text-gray-600 border-gray-200',
        primary: isDark
            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
            : 'bg-blue-50 text-blue-600 border-blue-200',
        success: isDark
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            : 'bg-emerald-50 text-emerald-600 border-emerald-200',
        warning: isDark
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            : 'bg-amber-50 text-amber-600 border-amber-200',
        danger: isDark
            ? 'bg-red-500/20 text-red-400 border-red-500/30'
            : 'bg-red-50 text-red-600 border-red-200',
        info: isDark
            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
            : 'bg-cyan-50 text-cyan-600 border-cyan-200',
        purple: isDark
            ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
            : 'bg-purple-50 text-purple-600 border-purple-200',
    };

    const dotColors = {
        default: isDark ? 'bg-gray-400' : 'bg-gray-500',
        primary: 'bg-blue-500',
        success: 'bg-emerald-500',
        warning: 'bg-amber-500',
        danger: 'bg-red-500',
        info: 'bg-cyan-500',
        purple: 'bg-purple-500',
    };

    return (
        <span
            className={`
                inline-flex items-center gap-1.5 font-medium rounded-full border
                ${sizeStyles[size]}
                ${variants[variant]}
                ${className}
            `}
            {...props}
        >
            {dot && (
                <span className={`${dotSizes[size]} rounded-full ${dotColors[variant]}`} />
            )}
            {children}
        </span>
    );
}

/**
 * StatusBadge - Predefined status badges
 */
export function StatusBadge({ status, showDot = true }) {
    const statusConfig = {
        active: { label: 'Active', variant: 'success' },
        online: { label: 'Online', variant: 'success' },
        inactive: { label: 'Inactive', variant: 'default' },
        offline: { label: 'Offline', variant: 'default' },
        pending: { label: 'Pending', variant: 'warning' },
        processing: { label: 'Processing', variant: 'info' },
        completed: { label: 'Completed', variant: 'success' },
        failed: { label: 'Failed', variant: 'danger' },
        error: { label: 'Error', variant: 'danger' },
        cancelled: { label: 'Cancelled', variant: 'default' },
    };

    const config = statusConfig[status] || statusConfig.inactive;

    return (
        <Badge variant={config.variant} dot={showDot}>
            {config.label}
        </Badge>
    );
}
