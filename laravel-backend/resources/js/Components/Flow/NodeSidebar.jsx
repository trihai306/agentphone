import React from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { NodeIcon } from './FlowIcons';
import { useMouseDrag } from './MouseDragProvider';

/**
 * NodeSidebar - Collapsible left sidebar with draggable node templates
 * Uses custom mouse-based drag instead of HTML5 Drag API for reliability
 */
export default function NodeSidebar({
    showSidebar,
    sidebarExpanded,
    setSidebarExpanded,
    nodeTemplates,
    onDragStart, // Keep for compatibility but not used with mouse drag
}) {
    const { isDark } = useTheme();
    const { t } = useTranslation();
    const { startDrag } = useMouseDrag();

    if (!showSidebar) return null;

    // Handle mousedown to start custom drag
    const handleMouseDown = (e, template) => {
        e.preventDefault();
        e.stopPropagation();
        startDrag(template.type, template.label, template.color, template.bgColor);
    };

    const NodeItem = ({ template }) => (
        <div
            onMouseDown={(e) => handleMouseDown(e, template)}
            data-node-type={template.type}
            data-node-label={template.label}
            data-node-color={template.color}
            className={`
                group relative flex items-center cursor-grab active:cursor-grabbing select-none
                transition-all duration-150
                ${sidebarExpanded
                    ? 'gap-3 px-3 py-2.5 rounded-xl border'
                    : 'justify-center p-2 rounded-lg border'
                }
                ${isDark
                    ? 'bg-[#1a1a1a] hover:bg-[#222] border-[#2a2a2a] hover:border-[#3a3a3a]'
                    : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow'
                }
            `}
            title={!sidebarExpanded ? template.label : undefined}
        >
            {/* Icon Container */}
            <div
                className={`
                    ${sidebarExpanded ? 'w-10 h-10' : 'w-9 h-9'} 
                    rounded-xl flex items-center justify-center flex-shrink-0 pointer-events-none
                    border transition-colors
                `}
                style={{
                    backgroundColor: template.bgColor,
                    borderColor: `${template.color}30`,
                }}
            >
                <NodeIcon icon={template.icon} color={template.color} size={sidebarExpanded ? 20 : 18} />
            </div>

            {/* Label */}
            {sidebarExpanded && (
                <div className="flex-1 min-w-0 pointer-events-none">
                    <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {template.label}
                    </p>
                </div>
            )}
        </div>
    );

    const CategorySection = ({ category, label, color, templates }) => (
        <div className={`${isDark ? 'border-[#1e1e1e]' : 'border-gray-100'}`}>
            {sidebarExpanded && (
                <div className={`px-3 py-2.5 sticky top-0 z-10 backdrop-blur-sm ${isDark ? 'bg-[#0f0f0f]/95' : 'bg-gray-50/95'}`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${color}`} />
                        <span className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
                    </div>
                </div>
            )}
            {!sidebarExpanded && (
                <div className="flex justify-center py-2">
                    <div className={`w-2 h-2 rounded-full ${color}`} />
                </div>
            )}
            <div className={`${sidebarExpanded ? 'px-3 pb-3 space-y-2' : 'px-1.5 pb-2 space-y-1.5'}`}>
                {templates.map((template) => (
                    <NodeItem key={template.type} template={template} />
                ))}
            </div>
        </div>
    );

    return (
        <div className={`${sidebarExpanded ? 'w-64' : 'w-14'} flex flex-col border-r ${isDark ? 'bg-[#0f0f0f] border-[#1e1e1e]' : 'bg-white border-gray-200'}`}>
            {/* Sidebar Header */}
            <div className={`h-12 px-2 flex items-center ${sidebarExpanded ? 'justify-between' : 'justify-center'} flex-shrink-0 border-b ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                {sidebarExpanded && (
                    <span className={`text-sm font-semibold pl-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('flows.editor.toolbar.nodes_title')}</span>
                )}
                <button
                    onClick={() => setSidebarExpanded(!sidebarExpanded)}
                    className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-[#1e1e1e] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                    title={sidebarExpanded ? t('flows.editor.sidebar.collapse') : t('flows.editor.sidebar.expand')}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {sidebarExpanded ? (
                            <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
                        ) : (
                            <path d="M13 5l7 7-7 7M6 5l7 7-7 7" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Search (only when expanded) */}
            {sidebarExpanded && (
                <div className={`p-2 border-b ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                    <div className="relative">
                        <svg className={`absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    color="bg-purple-500"
                    templates={nodeTemplates.filter(t => t.category === 'resource')}
                />
            </div>
        </div>
    );
}
