/**
 * Button component - reusable button with variants
 * Supports primary, secondary, and outline variants with dark mode
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
    ...props
}) {
    // Base styles
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    // Size variants
    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    // Variant styles with dark mode support
    const variantStyles = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 dark:bg-gray-500 dark:hover:bg-gray-600 dark:focus:ring-gray-400',
        outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:focus:ring-blue-400',
        ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:ring-gray-400',
    };

    const combinedStyles = `${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`;

    // Render as anchor tag if href is provided
    if (href) {
        return (
            <a
                href={href}
                className={combinedStyles}
                {...props}
            >
                {children}
            </a>
        );
    }

    // Render as button
    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={combinedStyles}
            {...props}
        >
            {children}
        </button>
    );
}
