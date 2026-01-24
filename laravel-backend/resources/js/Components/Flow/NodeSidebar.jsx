import React from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { NodeIcon } from './FlowIcons';

/**
 * NodeSidebar - Collapsible left sidebar with draggable node templates
 * Displays node categories: Actions, Logic, Resources
 */
export default function NodeSidebar({
    showSidebar,
    sidebarExpanded,
    setSidebarExpanded,
    nodeTemplates,
    onDragStart,
}) {
    const { isDark } = useTheme();
    const { t } = useTranslation();

    if (!showSidebar) return null;

    const handleDragStart = (e, template) => {
        // Set data directly on the native event
        e.dataTransfer.setData('application/reactflow/type', template.type);
        e.dataTransfer.setData('application/reactflow/label', template.label);
        e.dataTransfer.setData('text/plain', template.type);
        e.dataTransfer.effectAllowed = 'move';

        // Call parent handler for visual feedback
        if (onDragStart) {
            onDragStart(e, template.type, template.label, template.color);
        }
    };

    const NodeItem = ({ template }) => (
        <div
            key={template.type}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, template)}
            data-node-type={template.type}
            data-node-label={template.label}
            data-node-color={template.color}
            className={`group relative flex items-center ${sidebarExpanded ? 'gap-2 p-2' : 'justify-center p-1.5'} rounded-lg cursor-grab active:cursor-grabbing border select-none ${isDark ? 'bg-[#1a1a1a] hover:bg-[#1e1e1e] border-[#252525] hover:border-[#333]' : 'bg-gray-50 hover:bg-white border-gray-200 hover:border-gray-300'}`}
            title={!sidebarExpanded ? template.label : undefined}
        >
            <div
                className={`${sidebarExpanded ? 'w-7 h-7' : 'w-8 h-8'} rounded-md flex items-center justify-center flex-shrink-0 pointer-events-none`}
                style={{ backgroundColor: template.bgColor }}
            >
                <NodeIcon icon={template.icon} color={template.color} />
            </div>
            {sidebarExpanded && (
                <div className="flex-1 min-w-0 pointer-events-none">
                    <p className={`text-[11px] font-semibold truncate pointer-events-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{template.label}</p>
                </div>
            )}
        </div>
    );

    const CategorySection = ({ category, label, color, templates }) => (
        <div className={`border-b ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
            {sidebarExpanded && (
                <div className={`px-2 py-2 sticky top-0 z-10 backdrop-blur-sm ${isDark ? 'bg-[#0f0f0f]/90' : 'bg-white/90'}`}>
                    <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
                    </div>
                </div>
            )}
            {!sidebarExpanded && (
                <div className="flex justify-center py-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                </div>
            )}
            <div className={`${sidebarExpanded ? 'px-2 pb-2 space-y-1' : 'p-1 space-y-1'}`}>
                {templates.map((template) => (
                    <NodeItem key={template.type} template={template} />
                ))}
            </div>
        </div>
    );

    return (
        <div className={`${sidebarExpanded ? 'w-64' : 'w-14'} flex flex-col transition-all duration-300 border-r ${isDark ? 'bg-[#0f0f0f] border-[#1e1e1e]' : 'bg-white border-gray-200'}`}>
            {/* Sidebar Header */}
            <div className={`h-12 px-2 flex items-center ${sidebarExpanded ? 'justify-between' : 'justify-center'} flex-shrink-0 border-b ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                {sidebarExpanded && (
                    <span className={`text-sm font-semibold pl-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('flows.editor.toolbar.nodes_title')}</span>
                )}
                <button
                    onClick={() => setSidebarExpanded(!sidebarExpanded)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isDark ? 'hover:bg-[#1a1a1a] text-gray-500 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'}`}
                    title={sidebarExpanded ? 'Collapse' : 'Expand'}
                >
                    <svg className={`w-4 h-4 transition-transform duration-200 ${sidebarExpanded ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </button>
            </div>

            {/* Search Filter - Only show when expanded */}
            {sidebarExpanded && (
                <div className={`px-2 py-2 border-b ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                    <div className="relative">
                        <svg className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder={t('flows.editor.sidebar.search_placeholder')}
                            className={`w-full pl-8 pr-2 py-1.5 text-xs rounded-md border transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#252525] text-white placeholder-gray-500 focus:border-indigo-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'} focus:outline-none`}
                        />
                    </div>
                </div>
            )}

            {/* Node List with Categories */}
            <div className="flex-1 overflow-y-auto overflow-x-visible flow-editor-sidebar" style={{ scrollBehavior: 'smooth' }}>
                <CategorySection
                    category="action"
                    label={t('flows.editor.categories.recorded_actions')}
                    color="bg-blue-500"
                    templates={nodeTemplates.filter(t => t.category === 'action')}
                />
                <CategorySection
                    category="logic"
                    label={t('flows.editor.categories.logic_control')}
                    color="bg-orange-500"
                    templates={nodeTemplates.filter(t => t.category === 'logic')}
                />
                <CategorySection
                    category="resource"
                    label={t('flows.editor.categories.resources')}
                    color="bg-pink-500"
                    templates={nodeTemplates.filter(t => t.category === 'resource')}
                />
            </div>

            {/* Sidebar Footer - Keyboard Shortcuts */}
            {sidebarExpanded && (
                <div className={`p-2 border-t ${isDark ? 'border-[#1e1e1e] bg-[#0a0a0a]' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="space-y-1 text-[9px]">
                        <div className={`flex items-center justify-between ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <span>{t('flows.editor.sidebar.delete')}</span>
                            <kbd className={`px-1 py-0.5 rounded font-mono border text-[8px] ${isDark ? 'bg-[#1a1a1a] text-gray-400 border-[#252525]' : 'bg-white text-gray-500 border-gray-200'}`}>Del</kbd>
                        </div>
                        <div className={`flex items-center justify-between ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <span>{t('flows.editor.sidebar.save')}</span>
                            <kbd className={`px-1 py-0.5 rounded font-mono border text-[8px] ${isDark ? 'bg-[#1a1a1a] text-gray-400 border-[#252525]' : 'bg-white text-gray-500 border-gray-200'}`}>⌘S</kbd>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
