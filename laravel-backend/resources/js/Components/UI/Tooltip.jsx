import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * Tooltip - Hover tooltip component
 */
export default function Tooltip({
    children,
    content,
    position = 'top', // top, bottom, left, right
    delay = 200,
    className = '',
}) {
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef(null);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const showTooltip = () => {
        timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsVisible(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const positions = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    const arrowPositions = {
        top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-700 border-l-transparent border-r-transparent border-b-transparent',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-700 border-l-transparent border-r-transparent border-t-transparent',
        left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-700 border-t-transparent border-b-transparent border-r-transparent',
        right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-700 border-t-transparent border-b-transparent border-l-transparent',
    };

    return (
        <div
            className={`relative inline-flex ${className}`}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
        >
            {children}
            {isVisible && content && (
                <div className={`
                    absolute ${positions[position]} z-50
                    px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap
                    ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white'}
                    shadow-lg animate-fade-in
                `}>
                    {content}
                    <div className={`absolute border-4 ${arrowPositions[position]}`} />
                </div>
            )}
        </div>
    );
}
