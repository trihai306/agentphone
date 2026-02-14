import { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * Accordion - Collapsible content sections with smooth animation
 * Supports single or multiple open panels
 */
export default function Accordion({
    children,
    type = 'single', // 'single' | 'multiple'
    defaultOpen = [],
    className = '',
}) {
    const [openItems, setOpenItems] = useState(
        Array.isArray(defaultOpen) ? defaultOpen : [defaultOpen]
    );

    const toggle = useCallback((value) => {
        setOpenItems((prev) => {
            if (type === 'single') {
                return prev.includes(value) ? [] : [value];
            }
            return prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value];
        });
    }, [type]);

    return (
        <div className={`divide-y ${className}`}>
            {typeof children === 'function'
                ? children({ openItems, toggle })
                : children
            }
        </div>
    );
}

/**
 * AccordionItem - Individual collapsible section
 */
export function AccordionItem({
    value,
    title,
    subtitle,
    icon,
    isOpen = false,
    onToggle,
    children,
    className = '',
    disabled = false,
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const contentRef = useRef(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (contentRef.current) {
            setHeight(isOpen ? contentRef.current.scrollHeight : 0);
        }
    }, [isOpen, children]);

    return (
        <div className={`
            ${isDark ? 'divide-white/10' : 'divide-gray-200'}
            ${disabled ? 'opacity-50' : ''}
            ${className}
        `}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => !disabled && onToggle?.(value)}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between gap-3 py-4 text-left
                    transition-colors group
                    ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                    ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}
                `}
            >
                <div className="flex items-center gap-3 min-w-0">
                    {icon && (
                        <span className={`flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {icon}
                        </span>
                    )}
                    <div className="min-w-0">
                        <span className={`text-sm font-semibold block ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {title}
                        </span>
                        {subtitle && (
                            <span className={`text-xs mt-0.5 block ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {subtitle}
                            </span>
                        )}
                    </div>
                </div>
                <svg
                    className={`
                        w-5 h-5 flex-shrink-0 transition-transform duration-300
                        ${isOpen ? 'rotate-180' : ''}
                        ${isDark ? 'text-gray-500' : 'text-gray-400'}
                    `}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Content with smooth height transition */}
            <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: `${height}px` }}
            >
                <div ref={contentRef} className="pb-4">
                    <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * AccordionGroup - Pre-wired Accordion with items data
 */
export function AccordionGroup({
    items = [],
    type = 'single',
    defaultOpen = [],
    className = '',
}) {
    const [openItems, setOpenItems] = useState(
        Array.isArray(defaultOpen) ? defaultOpen : [defaultOpen]
    );

    const toggle = useCallback((value) => {
        setOpenItems((prev) => {
            if (type === 'single') {
                return prev.includes(value) ? [] : [value];
            }
            return prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value];
        });
    }, [type]);

    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={`
            rounded-2xl border overflow-hidden
            ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}
            ${className}
        `}>
            {items.map((item, index) => (
                <AccordionItem
                    key={item.value || index}
                    value={item.value || index}
                    title={item.title}
                    subtitle={item.subtitle}
                    icon={item.icon}
                    isOpen={openItems.includes(item.value || index)}
                    onToggle={toggle}
                    disabled={item.disabled}
                    className="px-4"
                >
                    {item.content}
                </AccordionItem>
            ))}
        </div>
    );
}
