import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * Dropdown - Dropdown menu component
 */
export default function Dropdown({
    trigger,
    items = [],
    position = 'bottom-right', // bottom-left, bottom-right, top-left, top-right
    className = '',
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const positions = {
        'bottom-left': 'top-full left-0 mt-2',
        'bottom-right': 'top-full right-0 mt-2',
        'top-left': 'bottom-full left-0 mb-2',
        'top-right': 'bottom-full right-0 mb-2',
    };

    return (
        <div ref={dropdownRef} className={`relative inline-flex ${className}`}>
            <div onClick={() => setIsOpen(!isOpen)}>
                {trigger}
            </div>
            {isOpen && (
                <div className={`
                    absolute ${positions[position]} z-50 min-w-[180px]
                    rounded-xl overflow-hidden shadow-xl
                    ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-gray-200'}
                `}>
                    {items.map((item, i) => {
                        if (item.divider) {
                            return (
                                <div
                                    key={i}
                                    className={`my-1 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}
                                />
                            );
                        }
                        return (
                            <button
                                key={i}
                                onClick={() => {
                                    item.onClick?.();
                                    setIsOpen(false);
                                }}
                                disabled={item.disabled}
                                className={`
                                    w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors
                                    ${item.danger
                                        ? 'text-red-500 hover:bg-red-500/10'
                                        : isDark
                                            ? 'text-gray-300 hover:bg-white/5'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }
                                    ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                {item.icon && <span className="text-base">{item.icon}</span>}
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/**
 * DropdownTrigger - Default button trigger for dropdown
 */
export function DropdownTrigger({ children, className = '' }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button className={`
            p-2 rounded-lg transition-colors
            ${isDark
                ? 'text-gray-400 hover:text-white hover:bg-white/10'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }
            ${className}
        `}>
            {children || (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
            )}
        </button>
    );
}
