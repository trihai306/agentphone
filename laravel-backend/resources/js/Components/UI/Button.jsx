import { Link } from '@inertiajs/react';

/**
 * Button component - reusable button with variants
 * Supports primary, secondary, outline, ghost, gradient, and danger variants with dark mode
 * Can render as <button>, <a>, or Inertia <Link>
 */
export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    type = 'button',
    disabled = false,
    className = '',
    onClick,
    href,
    as,
    icon,
    iconRight,
    loading = false,
    ...props
}) {
    // Base styles
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

    // Size variants
    const sizeStyles = {
        xs: 'px-2.5 py-1.5 text-xs gap-1.5',
        sm: 'px-3 py-2 text-sm gap-1.5',
        md: 'px-5 py-2.5 text-sm gap-2',
        lg: 'px-6 py-3 text-base gap-2',
        xl: 'px-8 py-4 text-lg gap-2.5',
        icon: 'p-2.5',
        'icon-sm': 'p-2',
        'icon-xs': 'p-1.5',
    };

    // Variant styles with dark mode support
    const variantStyles = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/30 shadow-sm dark:bg-blue-500 dark:hover:bg-blue-600',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500/20 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20',
        outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500/20 dark:border-white/20 dark:text-gray-300 dark:hover:bg-white/5',
        ghost: 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white',
        gradient: 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02]',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500/30 shadow-sm dark:bg-red-500 dark:hover:bg-red-600',
        'danger-ghost': 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 dark:hover:text-red-400',
        'success-ghost': 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-400',
        link: 'text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline dark:text-blue-400 dark:hover:text-blue-300 p-0',
    };

    const combinedStyles = `${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`;

    const content = (
        <>
            {loading && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {!loading && icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
            {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
        </>
    );

    // Render as Inertia Link
    if (href && as === 'Link') {
        return (
            <Link
                href={href}
                className={combinedStyles}
                {...props}
            >
                {content}
            </Link>
        );
    }

    // Render as anchor tag if href is provided
    if (href) {
        return (
            <a
                href={href}
                className={combinedStyles}
                {...props}
            >
                {content}
            </a>
        );
    }

    // Render as button
    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={combinedStyles}
            {...props}
        >
            {content}
        </button>
    );
}
