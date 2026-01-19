import { memo, useState, useCallback } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * NodePalette - Sidebar component for Loop Sub-Flow Modal
 * Features: Search, collapsible categories, draggable nodes
 */
function NodePalette({ onDragStart }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState({
        actions: true,
        logic: true,
    });

    // Node definitions
    const nodeCategories = {
        actions: {
            label: 'Actions',
            icon: '⚡',
            color: '#3b82f6',
            nodes: [
                { type: 'tap', label: 'Tap', icon: '👆', color: '#3b82f6', description: 'Tap on element' },
                { type: 'text_input', label: 'Type', icon: '⌨️', color: '#a855f7', description: 'Input text' },
                { type: 'scroll', label: 'Scroll', icon: '📜', color: '#f59e0b', description: 'Scroll the screen' },
                { type: 'swipe', label: 'Swipe', icon: '👋', color: '#06b6d4', description: 'Swipe gesture' },
                { type: 'click', label: 'Click', icon: '🖱️', color: '#10b981', description: 'Click element' },
                { type: 'long_press', label: 'Long Press', icon: '✊', color: '#ef4444', description: 'Long press' },
                { type: 'key_event', label: 'Key Press', icon: '⌨️', color: '#ec4899', description: 'Press hardware key' },
                { type: 'back', label: 'Back', icon: '←', color: '#6366f1', description: 'Press BACK button' },
                { type: 'home', label: 'Home', icon: '🏠', color: '#8b5cf6', description: 'Press HOME button' },
                { type: 'open_app', label: 'Open App', icon: '📱', color: '#22c55e', description: 'Launch an app' },
            ]
        },
        logic: {
            label: 'Logic',
            icon: '🧠',
            color: '#f97316',
            nodes: [
                { type: 'condition', label: 'If/Else', icon: '❓', color: '#f97316', description: 'Conditional branch' },
                { type: 'delay', label: 'Delay', icon: '⏱️', color: '#6366f1', description: 'Wait duration' },
                { type: 'assert', label: 'Assert', icon: '✅', color: '#22c55e', description: 'Verify condition' },
                { type: 'wait_for_element', label: 'Wait For', icon: '👁️', color: '#8b5cf6', description: 'Wait for element' },
                { type: 'element_check', label: 'Check', icon: '🔍', color: '#ec4899', description: 'Check element exists' },
            ]
        }
    };

    // Filter nodes based on search query
    const filterNodes = (nodes) => {
        if (!searchQuery.trim()) return nodes;
        const query = searchQuery.toLowerCase();
        return nodes.filter(node =>
            node.label.toLowerCase().includes(query) ||
            node.description.toLowerCase().includes(query)
        );
    };

    // Toggle category expansion
    const toggleCategory = (categoryKey) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryKey]: !prev[categoryKey]
        }));
    };

    // Handle drag start
    const handleDragStart = (event, nodeType, nodeData) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/nodedata', JSON.stringify(nodeData));
        event.dataTransfer.effectAllowed = 'move';
        onDragStart?.(nodeType, nodeData);
    };

    return (
        <div
            className={`w-56 flex flex-col h-full border-r ${isDark ? 'bg-[#0f0f0f] border-white/10' : 'bg-gray-50 border-gray-200'
                }`}
        >
            {/* Search Input */}
            <div className="p-3 border-b border-white/5">
                <div className={`relative ${isDark ? '' : ''}`}>
                    <input
                        type="text"
                        placeholder="Search nodes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full px-3 py-2 pl-9 text-sm rounded-xl outline-none transition-all ${isDark
                            ? 'bg-white/5 text-white placeholder:text-gray-500 focus:bg-white/10 border border-white/10 focus:border-indigo-500/50'
                            : 'bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 border border-gray-200'
                            }`}
                    />
                    <svg
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Node Categories */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {Object.entries(nodeCategories).map(([categoryKey, category]) => {
                    const filteredNodes = filterNodes(category.nodes);
                    if (filteredNodes.length === 0 && searchQuery) return null;

                    return (
                        <div key={categoryKey} className="space-y-1">
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(categoryKey)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors ${isDark
                                    ? 'hover:bg-white/5 text-gray-400'
                                    : 'hover:bg-gray-100 text-gray-500'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span>{category.icon}</span>
                                    <span style={{ color: category.color }}>{category.label}</span>
                                </span>
                                <svg
                                    className={`w-4 h-4 transition-transform ${expandedCategories[categoryKey] ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Node Items */}
                            {expandedCategories[categoryKey] && (
                                <div className="space-y-1 pl-2">
                                    {filteredNodes.map((node) => (
                                        <div
                                            key={node.type}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, node.type, node)}
                                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-grab active:cursor-grabbing transition-all ${isDark
                                                ? 'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20'
                                                : 'bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 shadow-sm'
                                                }`}
                                            style={{
                                                boxShadow: isDark ? `0 0 0 1px ${node.color}10` : undefined
                                            }}
                                        >
                                            {/* Node Icon */}
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                                                style={{
                                                    backgroundColor: `${node.color}20`,
                                                    boxShadow: `0 2px 8px ${node.color}30`
                                                }}
                                            >
                                                {node.icon}
                                            </div>

                                            {/* Node Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {node.label}
                                                </div>
                                                <div className={`text-[10px] truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {node.description}
                                                </div>
                                            </div>

                                            {/* Drag Indicator */}
                                            <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
                                                </svg>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer Tip */}
            <div className={`p-3 border-t text-center text-[10px] ${isDark ? 'border-white/5 text-gray-600' : 'border-gray-100 text-gray-400'}`}>
                💡 Drag nodes to canvas
            </div>
        </div>
    );
}

export default memo(NodePalette);
