import { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * VariablePicker - Smart variable picker with suggestions
 * Shows available variables from upstream nodes for easy insertion
 */
export default function VariablePicker({
    isOpen,
    onClose,
    onSelect,
    position = { x: 0, y: 0 },
    availableVariables = [],
    upstreamSchema = [],
    loopContext = null // { itemVariable: 'customer', indexVariable: 'index' }
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    // Build variable list from all sources
    const variables = useMemo(() => {
        const vars = [];

        // 1. Schema fields from upstream DataSource (in loop context)
        if (loopContext && upstreamSchema.length > 0) {
            vars.push({
                category: `From: ${loopContext.collectionName || 'Collection'}`,
                icon: '📦',
                items: upstreamSchema.map(field => ({
                    name: `${loopContext.itemVariable}.${field.name}`,
                    display: `{{${loopContext.itemVariable}.${field.name}}}`,
                    description: `${field.type} field`,
                    type: field.type,
                }))
            });
        }

        // 2. Loop variables (if in loop context)
        if (loopContext) {
            vars.push({
                category: 'Loop Variables',
                icon: '🔢',
                items: [
                    { name: loopContext.itemVariable, display: `{{${loopContext.itemVariable}}}`, description: 'Current record object' },
                    { name: loopContext.indexVariable || 'index', display: `{{${loopContext.indexVariable || 'index'}}}`, description: 'Current iteration (0-based)' },
                    { name: 'count', display: '{{count}}', description: 'Total number of records' },
                ]
            });
        }

        // 3. Data source variables
        if (availableVariables.some(v => v.type === 'data_source')) {
            vars.push({
                category: 'Data Source',
                icon: '📊',
                items: [
                    { name: 'records', display: '{{records}}', description: 'All records from collection' },
                    { name: 'count', display: '{{count}}', description: 'Number of records' },
                ]
            });
        }

        // 4. System variables
        vars.push({
            category: 'System',
            icon: '⚙️',
            items: [
                { name: 'timestamp', display: '{{timestamp}}', description: 'Current Unix timestamp' },
                { name: 'datetime', display: '{{datetime}}', description: 'Current date & time' },
                { name: 'date', display: '{{date}}', description: 'Current date (YYYY-MM-DD)' },
                { name: 'random', display: '{{random}}', description: 'Random number (0-1000)' },
            ]
        });

        // 5. Custom/upstream node outputs
        if (availableVariables.length > 0) {
            const nodeVars = availableVariables.filter(v => v.type !== 'data_source');
            if (nodeVars.length > 0) {
                vars.push({
                    category: 'Node Outputs',
                    icon: '🔌',
                    items: nodeVars.map(v => ({
                        name: v.name,
                        display: `{{${v.name}}}`,
                        description: v.description || `Output from ${v.nodeLabel}`,
                    }))
                });
            }
        }

        return vars;
    }, [availableVariables, upstreamSchema, loopContext]);

    // Filter by search
    const filteredVariables = useMemo(() => {
        if (!searchQuery) return variables;
        const query = searchQuery.toLowerCase();
        return variables.map(category => ({
            ...category,
            items: category.items.filter(item =>
                item.name.toLowerCase().includes(query) ||
                item.description?.toLowerCase().includes(query)
            )
        })).filter(category => category.items.length > 0);
    }, [variables, searchQuery]);

    // All filtered items flat list for keyboard nav
    const allItems = useMemo(() => {
        return filteredVariables.flatMap(cat => cat.items);
    }, [filteredVariables]);

    // Focus input on open
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setSearchQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (allItems[selectedIndex]) {
                    onSelect(allItems[selectedIndex].display);
                    onClose();
                }
                break;
            case 'Escape':
                onClose();
                break;
        }
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={containerRef}
            className={`fixed z-50 w-72 rounded-xl overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}
            style={{
                top: position.y,
                left: position.x,
                boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.4)',
                border: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`,
            }}
        >
            {/* Search Input */}
            <div className={`p-2 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search variables..."
                        className={`w-full pl-8 pr-3 py-2 text-sm rounded-lg border ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white placeholder-gray-500'
                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                            } focus:outline-none focus:ring-2 focus:ring-cyan-500/50`}
                    />
                    <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Variables List */}
            <div className="max-h-64 overflow-y-auto">
                {filteredVariables.length === 0 ? (
                    <div className={`p-4 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        No matching variables
                    </div>
                ) : (
                    filteredVariables.map((category, catIdx) => (
                        <div key={category.category}>
                            {/* Category Header */}
                            <div className={`px-3 py-1.5 text-[10px] uppercase font-semibold tracking-wider flex items-center gap-1.5 ${isDark ? 'bg-[#0f0f0f] text-gray-500' : 'bg-gray-50 text-gray-400'}`}>
                                <span>{category.icon}</span>
                                <span>{category.category}</span>
                            </div>

                            {/* Items */}
                            {category.items.map((item, itemIdx) => {
                                const flatIndex = filteredVariables
                                    .slice(0, catIdx)
                                    .reduce((acc, c) => acc + c.items.length, 0) + itemIdx;
                                const isSelected = selectedIndex === flatIndex;

                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => {
                                            onSelect(item.display);
                                            onClose();
                                        }}
                                        onMouseEnter={() => setSelectedIndex(flatIndex)}
                                        className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${isSelected
                                                ? isDark ? 'bg-cyan-500/20' : 'bg-cyan-50'
                                                : isDark ? 'hover:bg-[#252525]' : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-mono truncate ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                                {item.display}
                                            </p>
                                            {item.description && (
                                                <p className={`text-[10px] truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <kbd className={`ml-2 px-1.5 py-0.5 text-[10px] rounded ${isDark ? 'bg-[#2a2a2a] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                                ↵
                                            </kbd>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>

            {/* Footer Hint */}
            <div className={`px-3 py-2 text-[10px] border-t ${isDark ? 'border-[#2a2a2a] bg-[#0f0f0f] text-gray-500' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                <span className="font-medium">Tip:</span> Type <code className="px-1 rounded bg-cyan-500/20 text-cyan-500">{'{{'}</code> in any text field to trigger this picker
            </div>
        </div>
    );
}

/**
 * VariableInput - Input field with integrated variable picker
 * Shows picker when user types {{
 */
export function VariableInput({
    label,
    value,
    onChange,
    placeholder,
    availableVariables = [],
    upstreamSchema = [],
    loopContext = null,
    multiline = false,
    className = '',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [showPicker, setShowPicker] = useState(false);
    const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });
    const [cursorPosition, setCursorPosition] = useState(0);
    const inputRef = useRef(null);

    const handleInput = (e) => {
        const newValue = e.target.value;
        const cursor = e.target.selectionStart;

        // Check for {{ trigger
        if (newValue.slice(cursor - 2, cursor) === '{{') {
            const rect = inputRef.current.getBoundingClientRect();
            setPickerPosition({
                x: Math.min(rect.left, window.innerWidth - 300),
                y: rect.bottom + 4,
            });
            setCursorPosition(cursor);
            setShowPicker(true);
        }

        onChange(newValue);
    };

    const handleVariableSelect = (variable) => {
        // Insert variable at cursor, replacing the {{
        const before = value.slice(0, cursorPosition - 2);
        const after = value.slice(cursorPosition);
        const newValue = before + variable + after;
        onChange(newValue);
        setShowPicker(false);

        // Focus back to input
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                const newCursor = before.length + variable.length;
                inputRef.current.setSelectionRange(newCursor, newCursor);
            }
        }, 0);
    };

    const InputComponent = multiline ? 'textarea' : 'input';

    return (
        <div className={className}>
            {label && (
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {label}
                </label>
            )}
            <div className="relative">
                <InputComponent
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleInput}
                    placeholder={placeholder}
                    rows={multiline ? 3 : undefined}
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white placeholder-gray-500'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                        } focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${multiline ? 'resize-none' : ''}`}
                />

                {/* Variable hint */}
                <div className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-[#252525] text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                    {'{{'} = vars
                </div>
            </div>

            <VariablePicker
                isOpen={showPicker}
                onClose={() => setShowPicker(false)}
                onSelect={handleVariableSelect}
                position={pickerPosition}
                availableVariables={availableVariables}
                upstreamSchema={upstreamSchema}
                loopContext={loopContext}
            />
        </div>
    );
}
