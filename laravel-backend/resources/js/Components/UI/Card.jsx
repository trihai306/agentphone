/**
 * Card component - reusable card container with dark mode support
 * Supports different padding sizes and hover effects
 */
export default function Card({
    children,
    className = '',
    padding = 'md',
    hover = false,
    ...props
}) {
    // Base styles with dark mode support
    const baseStyles = 'rounded-xl bg-white shadow-lg dark:bg-gray-800';

    // Padding variants
    const paddingStyles = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    // Optional hover effect
    const hoverStyles = hover
        ? 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:hover:shadow-gray-900/50'
        : '';

    const combinedStyles = `${baseStyles} ${paddingStyles[padding] || paddingStyles.md} ${hoverStyles} ${className}`;

    return (
        <div className={combinedStyles} {...props}>
            {children}
        </div>
    );
}

/**
 * CardHeader component - optional header section for cards
 */
export function CardHeader({ children, className = '' }) {
    return (
        <div className={`mb-4 ${className}`}>
            {children}
        </div>
    );
}

/**
 * CardTitle component - title within card header
 */
export function CardTitle({ children, className = '' }) {
    return (
        <h3 className={`text-xl font-bold text-gray-900 dark:text-white ${className}`}>
            {children}
        </h3>
    );
}

/**
 * CardDescription component - description text within card
 */
export function CardDescription({ children, className = '' }) {
    return (
        <p className={`text-gray-600 dark:text-gray-300 ${className}`}>
            {children}
        </p>
    );
}

/**
 * CardContent component - main content area of card
 */
export function CardContent({ children, className = '' }) {
    return (
        <div className={className}>
            {children}
        </div>
    );
}

/**
 * CardFooter component - optional footer section for cards
 */
export function CardFooter({ children, className = '' }) {
    return (
        <div className={`mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 ${className}`}>
            {children}
        </div>
    );
}
