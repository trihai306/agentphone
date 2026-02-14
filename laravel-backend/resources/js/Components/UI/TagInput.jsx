import { useState, useRef, useCallback, useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * TagInput - Tag input field with add/remove and suggestions
 *
 * Usage:
 *   <TagInput
 *     value={['React', 'Vue']}
 *     onChange={setTags}
 *     suggestions={['Angular', 'Svelte']}
 *     placeholder="Add tag..."
 *   />
 */
export default function TagInput({
    value = [],
    onChange,
    suggestions = [],
    placeholder = 'Type and press Enter...',
    maxTags,
    color = 'purple',
    disabled = false,
    className = '',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [input, setInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef(null);

    const colorMap = {
        purple: isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200',
        blue: isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200',
        green: isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
        orange: isDark ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-orange-50 text-orange-700 border-orange-200',
    };

    const filteredSuggestions = suggestions.filter(
        (s) => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s)
    );

    const addTag = useCallback((tag) => {
        const trimmed = tag.trim();
        if (!trimmed || value.includes(trimmed)) return;
        if (maxTags && value.length >= maxTags) return;
        onChange?.([...value, trimmed]);
        setInput('');
        setShowSuggestions(false);
        setHighlightedIndex(-1);
    }, [value, onChange, maxTags]);

    const removeTag = useCallback((index) => {
        onChange?.(value.filter((_, i) => i !== index));
    }, [value, onChange]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
                addTag(filteredSuggestions[highlightedIndex]);
            } else if (input) {
                addTag(input);
            }
        } else if (e.key === 'Backspace' && !input && value.length > 0) {
            removeTag(value.length - 1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex((prev) =>
                prev < filteredSuggestions.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((prev) =>
                prev > 0 ? prev - 1 : filteredSuggestions.length - 1
            );
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    useEffect(() => {
        setShowSuggestions(input.length > 0 && filteredSuggestions.length > 0);
        setHighlightedIndex(-1);
    }, [input]);

    return (
        <div className={`relative ${className}`}>
            <div
                className={`
                    flex flex-wrap items-center gap-1.5 px-3 py-2 min-h-[42px]
                    rounded-xl border transition-colors cursor-text
                    ${isDark
                        ? 'bg-white/5 border-white/10 focus-within:border-purple-500/50'
                        : 'bg-white border-gray-200 focus-within:border-purple-400'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => inputRef.current?.focus()}
            >
                {/* Tags */}
                {value.map((tag, index) => (
                    <Tag
                        key={`${tag}-${index}`}
                        label={tag}
                        color={colorMap[color]}
                        onRemove={() => removeTag(index)}
                        disabled={disabled}
                        isDark={isDark}
                    />
                ))}

                {/* Input */}
                {(!maxTags || value.length < maxTags) && (
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => input && filteredSuggestions.length > 0 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder={value.length === 0 ? placeholder : ''}
                        disabled={disabled}
                        className={`
                            flex-1 min-w-[120px] bg-transparent outline-none text-sm
                            ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}
                        `}
                    />
                )}
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && (
                <div className={`
                    absolute z-50 mt-1 w-full rounded-xl border shadow-xl overflow-hidden
                    ${isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200'}
                `}>
                    {filteredSuggestions.slice(0, 8).map((suggestion, index) => (
                        <button
                            key={suggestion}
                            type="button"
                            onClick={() => addTag(suggestion)}
                            className={`
                                w-full text-left px-4 py-2.5 text-sm transition-colors
                                ${index === highlightedIndex
                                    ? isDark ? 'bg-white/10 text-white' : 'bg-purple-50 text-purple-900'
                                    : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'
                                }
                            `}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Tag - Individual removable tag
 */
export function Tag({ label, color, onRemove, disabled, isDark }) {
    return (
        <span className={`
            inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border
            ${color}
        `}>
            {label}
            {onRemove && !disabled && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="ml-0.5 hover:opacity-70 transition-opacity"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </span>
    );
}
