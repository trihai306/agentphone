import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { router } from '@inertiajs/react';

/**
 * CommandPalette - Spotlight / Command menu (Cmd+K / Ctrl+K)
 *
 * Usage:
 *   <CommandPalette
 *     groups={[
 *       { label: 'Pages', items: [
 *         { id: 'dashboard', label: 'Dashboard', icon: '🏠', action: () => router.visit('/') },
 *       ]},
 *     ]}
 *   />
 */
export default function CommandPalette({
    groups = [],
    placeholder = 'Type a command or search...',
    shortcutKey = 'k',
    isOpen: controlledOpen,
    onOpenChange,
    className = '',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [internalOpen, setInternalOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    const isOpen = controlledOpen ?? internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;

    // Flatten and filter items
    const filteredGroups = useMemo(() => {
        if (!query) return groups;
        const q = query.toLowerCase();
        return groups
            .map((group) => ({
                ...group,
                items: group.items.filter((item) =>
                    item.label.toLowerCase().includes(q) ||
                    item.keywords?.some((k) => k.toLowerCase().includes(q))
                ),
            }))
            .filter((group) => group.items.length > 0);
    }, [groups, query]);

    const flatItems = useMemo(
        () => filteredGroups.flatMap((g) => g.items),
        [filteredGroups]
    );

    // Keyboard shortcut to open
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === shortcutKey) {
                e.preventDefault();
                setOpen(true);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [shortcutKey, setOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Scroll active item into view
    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
        el?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    const handleSelect = useCallback((item) => {
        setOpen(false);
        if (item.href) {
            router.visit(item.href);
        } else {
            item.action?.();
        }
    }, [setOpen]);

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setOpen(false);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (flatItems[activeIndex]) {
                handleSelect(flatItems[activeIndex]);
            }
        }
    };

    if (!isOpen) return null;

    let globalIndex = -1;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                onClick={() => setOpen(false)}
            />

            {/* Palette */}
            <div className={`
                fixed inset-x-4 top-[15%] mx-auto z-[200]
                max-w-xl w-full
                rounded-2xl overflow-hidden shadow-2xl
                ${isDark ? 'bg-[#1a1a1a] border border-white/10' : 'bg-white border border-gray-200'}
                ${className}
            `}>
                {/* Search input */}
                <div className={`
                    flex items-center gap-3 px-5 border-b
                    ${isDark ? 'border-white/10' : 'border-gray-100'}
                `}>
                    <svg className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className={`
                            flex-1 py-4 bg-transparent outline-none text-base
                            ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}
                        `}
                    />
                    <kbd className={`
                        hidden sm:inline-flex px-2 py-1 text-xs font-medium rounded-md border
                        ${isDark ? 'bg-white/5 text-gray-500 border-white/10' : 'bg-gray-100 text-gray-400 border-gray-200'}
                    `}>
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
                    {filteredGroups.length === 0 ? (
                        <div className={`px-5 py-12 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-sm">No results found</p>
                        </div>
                    ) : (
                        filteredGroups.map((group) => (
                            <div key={group.label}>
                                <div className={`
                                    px-5 py-1.5 text-xs font-semibold uppercase tracking-wider
                                    ${isDark ? 'text-gray-500' : 'text-gray-400'}
                                `}>
                                    {group.label}
                                </div>
                                {group.items.map((item) => {
                                    globalIndex++;
                                    const idx = globalIndex;
                                    const isActive = idx === activeIndex;

                                    return (
                                        <button
                                            key={item.id || item.label}
                                            data-index={idx}
                                            type="button"
                                            onClick={() => handleSelect(item)}
                                            onMouseEnter={() => setActiveIndex(idx)}
                                            className={`
                                                w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors
                                                ${isActive
                                                    ? isDark ? 'bg-white/10' : 'bg-purple-50'
                                                    : ''
                                                }
                                            `}
                                        >
                                            {item.icon && (
                                                <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm
                                                    ${isActive
                                                        ? 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg'
                                                        : isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'
                                                    }
                                                `}>
                                                    {item.icon}
                                                </span>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-sm font-medium ${isActive
                                                    ? isDark ? 'text-white' : 'text-purple-900'
                                                    : isDark ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>
                                                    {item.label}
                                                </span>
                                                {item.description && (
                                                    <span className={`text-xs ml-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {item.description}
                                                    </span>
                                                )}
                                            </div>
                                            {item.shortcut && (
                                                <kbd className={`
                                                    hidden sm:inline-flex px-1.5 py-0.5 text-xs font-mono rounded border
                                                    ${isDark ? 'bg-white/5 text-gray-500 border-white/10' : 'bg-gray-100 text-gray-400 border-gray-200'}
                                                `}>
                                                    {item.shortcut}
                                                </kbd>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer hints */}
                <div className={`
                    flex items-center justify-center gap-4 px-5 py-2.5 border-t text-xs
                    ${isDark ? 'border-white/10 text-gray-600' : 'border-gray-100 text-gray-400'}
                `}>
                    <span className="flex items-center gap-1">
                        <kbd className={`px-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>↑↓</kbd>
                        Navigate
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className={`px-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>↵</kbd>
                        Select
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className={`px-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>esc</kbd>
                        Close
                    </span>
                </div>
            </div>
        </>
    );
}
