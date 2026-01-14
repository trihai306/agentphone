import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/Contexts/ThemeContext';

// Quick Templates matching CreateCollectionModal
const QUICK_TEMPLATES = [
    {
        id: 'customer',
        name: 'Customer Table',
        icon: '👥',
        description: 'Contact management with name, email, phone',
        color: 'from-blue-500 to-cyan-500',
        fields: [
            { name: 'Full Name', type: 'text', required: true },
            { name: 'Email', type: 'email', required: true },
            { name: 'Phone', type: 'phone', required: false },
            { name: 'Company', type: 'text', required: false },
            { name: 'Status', type: 'select', required: false, options: ['Lead', 'Active', 'Inactive'] },
        ]
    },
    {
        id: 'product',
        name: 'Product Inventory',
        icon: '📦',
        description: 'Product catalog with SKU, price, quantity',
        color: 'from-emerald-500 to-teal-500',
        fields: [
            { name: 'Product Name', type: 'text', required: true },
            { name: 'SKU', type: 'text', required: true },
            { name: 'Price', type: 'currency', required: true },
            { name: 'Quantity', type: 'number', required: true },
            { name: 'Category', type: 'select', required: false, options: ['Electronics', 'Clothing', 'Food', 'Other'] },
        ]
    },
    {
        id: 'task',
        name: 'Task Tracker',
        icon: '✅',
        description: 'Project tasks with due dates and priority',
        color: 'from-violet-500 to-purple-500',
        fields: [
            { name: 'Task Name', type: 'text', required: true },
            { name: 'Description', type: 'textarea', required: false },
            { name: 'Due Date', type: 'date', required: false },
            { name: 'Priority', type: 'select', required: false, options: ['Low', 'Medium', 'High', 'Urgent'] },
            { name: 'Completed', type: 'boolean', required: false },
        ]
    },
];

export default function CreateDropdownMenu({ onCreateNew, onSelectTemplate, onImportCSV }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [isOpen, setIsOpen] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const menuRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
                setShowTemplates(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on Escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                setShowTemplates(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    const handleCreateNew = () => {
        setIsOpen(false);
        onCreateNew?.();
    };

    const handleSelectTemplate = (template) => {
        setIsOpen(false);
        setShowTemplates(false);
        onSelectTemplate?.(template);
    };

    const handleImportCSV = () => {
        setIsOpen(false);
        onImportCSV?.();
    };

    return (
        <div ref={menuRef} className="relative">
            {/* Main Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group relative flex items-center gap-2.5 px-5 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all duration-200"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t('data_collections.new_collection')}
                <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <kbd className="hidden lg:inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded bg-white/20 ml-1">N</kbd>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className={`absolute right-0 top-full mt-2 w-72 rounded-2xl overflow-hidden shadow-2xl border backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${isDark
                    ? 'bg-[#1a1a1a]/95 border-white/10'
                    : 'bg-white/95 border-gray-200'
                    }`}>
                    {/* Header */}
                    <div className={`px-4 py-3 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                        <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t('data_collections.create_collection')}
                        </p>
                    </div>

                    <div className="p-2">
                        {/* Start Fresh */}
                        <button
                            onClick={handleCreateNew}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${isDark
                                ? 'hover:bg-white/5 text-gray-200'
                                : 'hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <span className="text-xl">🚀</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{t('data_collections.start_fresh')}</p>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {t('data_collections.create_empty')}
                                </p>
                            </div>
                            <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        {/* Divider */}
                        <div className={`my-2 h-px ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />

                        {/* Templates Submenu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowTemplates(!showTemplates)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${showTemplates
                                    ? isDark ? 'bg-white/5' : 'bg-gray-50'
                                    : ''
                                    } ${isDark ? 'hover:bg-white/5 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                            >
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                    <span className="text-xl">📋</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{t('data_collections.quick_templates')}</p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {t('data_collections.prebuild_structure')}
                                    </p>
                                </div>
                                <svg className={`w-4 h-4 opacity-40 transition-transform ${showTemplates ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            {/* Templates List */}
                            {showTemplates && (
                                <div className={`mt-2 ml-4 space-y-1 py-2 pl-4 border-l-2 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                    {QUICK_TEMPLATES.map((template) => (
                                        <button
                                            key={template.id}
                                            onClick={() => handleSelectTemplate(template)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group ${isDark
                                                ? 'hover:bg-white/5'
                                                : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center shadow-md`}>
                                                <span className="text-sm">{template.icon}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-medium text-sm truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                                    {template.name}
                                                </p>
                                                <p className={`text-[11px] truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {template.fields.length} {t('data_collections.fields')} • {template.description}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className={`my-2 h-px ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />

                        {/* Import CSV */}
                        <button
                            onClick={handleImportCSV}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${isDark
                                ? 'hover:bg-white/5 text-gray-200'
                                : 'hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <span className="text-xl">📥</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{t('data_collections.import_csv')}</p>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {t('data_collections.create_from_csv')}
                                </p>
                            </div>
                            <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Footer hint */}
                    <div className={`px-4 py-2.5 border-t ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>
                        <p className={`text-[11px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            💡 {t('data_collections.press_n_hint')} <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>N</kbd>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export { QUICK_TEMPLATES };
