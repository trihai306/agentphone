import { memo, useState, useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * QuickAddMenu - Context-aware menu for quickly adding nodes
 * Appears when clicking the + button on a node handle
 */
function QuickAddMenu({
    nodeId,
    nodeType,
    position,
    onAddNode,
    onClose
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Context-aware suggestions based on current node type
    const getSuggestions = () => {
        switch (nodeType) {
            case 'data_source':
                return [
                    { type: 'loop', icon: '🔄', label: 'Loop', description: 'Iterate through records' },
                    { type: 'condition', icon: '❓', label: 'Condition', description: 'Filter data' },
                ];
            case 'loop':
                return [
                    { type: 'http', icon: '🌐', label: 'HTTP Request', description: 'API call' },
                    { type: 'ai_process', icon: '🤖', label: 'AI Process', description: 'AI transformation' },
                    { type: 'condition', icon: '❓', label: 'Condition', description: 'Branch logic' },
                    { type: 'element_check', icon: '🔍', label: 'Element Check', description: 'Check element exists' },
                    { type: 'text_data', icon: '📝', label: 'Text Data', description: 'Static text' },
                ];
            case 'condition':
                return [
                    { type: 'http', icon: '🌐', label: 'HTTP Request', description: 'API call' },
                    { type: 'element_check', icon: '🔍', label: 'Element Check', description: 'Kiểm tra element' },
                    { type: 'wait_for_element', icon: '⏳', label: 'Wait For', description: 'Chờ element' },
                    { type: 'wait', icon: '⏱️', label: 'Wait', description: 'Delay execution' },
                ];
            case 'http':
                return [
                    { type: 'condition', icon: '❓', label: 'Condition', description: 'Check response' },
                    { type: 'ai_process', icon: '🤖', label: 'AI Process', description: 'Process response' },
                    { type: 'wait', icon: '⏱️', label: 'Wait', description: 'Rate limiting' },
                ];
            case 'click':
            case 'tap':
            case 'smart_action':
            case 'recorded_action':
                return [
                    { type: 'element_check', icon: '🔍', label: 'Element Check', description: 'Check popup/dialog' },
                    { type: 'wait_for_element', icon: '⏳', label: 'Wait For', description: 'Chờ element xuất hiện' },
                    { type: 'wait', icon: '⏱️', label: 'Wait', description: 'Delay' },
                    { type: 'condition', icon: '❓', label: 'Condition', description: 'Branch logic' },
                ];
            default:
                return [
                    { type: 'element_check', icon: '🔍', label: 'Element Check', description: 'Kiểm tra element/text', highlight: true },
                    { type: 'wait_for_element', icon: '⏳', label: 'Wait For Element', description: 'Chờ element', highlight: true },
                    { type: 'data_source', icon: '📊', label: 'Data Source', description: 'Fetch data' },
                    { type: 'loop', icon: '🔄', label: 'Loop', description: 'Iterate' },
                    { type: 'condition', icon: '❓', label: 'Condition', description: 'Branch' },
                    { type: 'http', icon: '🌐', label: 'HTTP Request', description: 'API call' },
                    { type: 'wait', icon: '⏱️', label: 'Wait', description: 'Delay' },
                ];
        }
    };

    const suggestions = getSuggestions();

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Menu */}
            <div
                className="fixed z-50"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    transform: 'translate(-50%, 8px)',
                }}
            >
                <div
                    className={`rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200`}
                    style={{
                        background: isDark
                            ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(20, 20, 20, 0.95) 100%)'
                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                        minWidth: '240px',
                    }}
                >
                    {/* Header */}
                    <div className={`px-4 py-3 border-b ${isDark ? 'border-white/10' : 'border-black/5'}`}>
                        <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Add Node
                        </h3>
                    </div>

                    {/* Suggestions */}
                    <div className="py-2">
                        {suggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => onAddNode(suggestion.type)}
                                className={`
                                    w-full px-4 py-3 flex items-center gap-3 
                                    transition-all duration-150
                                    ${isDark
                                        ? 'hover:bg-white/10 active:bg-white/15'
                                        : 'hover:bg-gray-100 active:bg-gray-200'
                                    }
                                `}
                            >
                                <span className="text-2xl">{suggestion.icon}</span>
                                <div className="flex-1 text-left">
                                    <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {suggestion.label}
                                    </div>
                                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {suggestion.description}
                                    </div>
                                </div>
                                <svg
                                    className={`w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className={`px-4 py-2 border-t ${isDark ? 'border-white/10 bg-white/5' : 'border-black/5 bg-gray-50'}`}>
                        <p className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            💡 Context-aware suggestions
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default memo(QuickAddMenu);
