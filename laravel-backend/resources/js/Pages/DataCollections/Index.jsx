import { useState, useEffect, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import CreateCollectionModal from '@/Components/DataCollections/CreateCollectionModal';
import ImportCSVModal from '@/Components/DataCollections/ImportCSVModal';
import CreateDropdownMenu, { QUICK_TEMPLATES } from '@/Components/DataCollections/CreateDropdownMenu';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { useToast } from '@/Components/Layout/ToastProvider';
import { Button, SearchInput, Icon } from '@/Components/UI';

export default function Index({ collections, stats }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { showConfirm } = useConfirm();
    const { addToast } = useToast();
    const isDark = theme === 'dark';

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showImportCSVModal, setShowImportCSVModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    // Search & Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [sortBy, setSortBy] = useState('updated_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [filterBy, setFilterBy] = useState('all');
    const [hoveredCard, setHoveredCard] = useState(null);

    // Dropdown states
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    // Keyboard shortcut
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'n' || e.key === 'N') {
                e.preventDefault();
                setShowCreateModal(true);
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    // Sort & Filter logic
    const processedCollections = useMemo(() => {
        let result = [...collections];

        // Filter
        if (filterBy === 'has_data') {
            result = result.filter(c => (c.total_records || 0) > 0);
        } else if (filterBy === 'empty') {
            result = result.filter(c => (c.total_records || 0) === 0);
        } else if (filterBy === 'with_workflows') {
            result = result.filter(c => (c.workflows_count || 0) > 0);
        }

        // Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.name.toLowerCase().includes(term) ||
                (c.description || '').toLowerCase().includes(term)
            );
        }

        // Sort
        result.sort((a, b) => {
            let aVal, bVal;
            switch (sortBy) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'created_at':
                    aVal = new Date(a.created_at || 0).getTime();
                    bVal = new Date(b.created_at || 0).getTime();
                    break;
                case 'records':
                    aVal = a.total_records || 0;
                    bVal = b.total_records || 0;
                    break;
                case 'updated_at':
                default:
                    aVal = new Date(a.updated_at || 0).getTime();
                    bVal = new Date(b.updated_at || 0).getTime();
                    break;
            }

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [collections, searchTerm, sortBy, sortOrder, filterBy]);

    const handleDelete = async (id, e) => {
        e?.preventDefault();
        e?.stopPropagation();
        const confirmed = await showConfirm({
            title: t('data_collections.delete_title'),
            message: t('data_collections.delete_confirm'),
            type: 'danger',
            confirmText: t('common.delete'),
            cancelText: t('common.cancel'),
        });

        if (confirmed) {
            router.delete(`/data-collections/${id}`, {
                onSuccess: () => addToast(t('data_collections.deleted'), 'success'),
            });
        }
    };

    const handleDuplicate = async (collection, e) => {
        e?.preventDefault();
        e?.stopPropagation();
        router.post('/data-collections', {
            name: `${collection.name} (Copy)`,
            description: collection.description,
            icon: collection.icon,
            color: collection.color,
            schema: collection.schema,
        }, {
            onSuccess: () => addToast(t('data_collections.duplicated'), 'success'),
        });
    };

    const handleExport = (id, e) => {
        e?.preventDefault();
        e?.stopPropagation();
        window.location.href = `/data-collections/${id}/export`;
        addToast(t('data_collections.exporting'), 'info');
    };

    const handleCreateNew = () => {
        setSelectedTemplate(null);
        setShowCreateModal(true);
    };

    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template);
        setShowCreateModal(true);
    };

    const handleImportCSV = () => {
        setShowImportCSVModal(true);
    };

    // Get collection status
    const getCollectionStatus = (collection) => {
        const hasWorkflows = (collection.workflows_count || 0) > 0;
        const hasData = (collection.total_records || 0) > 0;

        if (hasWorkflows && hasData) return 'active'; // In use
        if (hasData) return 'data_only'; // Has data but no workflows
        return 'idle'; // Empty
    };

    // Get usage percentage (for progress indicator)
    const getUsagePercentage = (collection) => {
        // Assume 1000 records = 100% for visual purposes
        const maxRecords = 1000;
        const percentage = Math.min(Math.round(((collection.total_records || 0) / maxRecords) * 100), 100);
        return percentage;
    };

    // Format date safely - backend returns diffForHumans() string
    const formatDate = (dateStr) => {
        if (!dateStr) return t('common.no_date');
        // If it's already a human-readable string (from diffForHumans), return it
        if (typeof dateStr === 'string' && !dateStr.includes('T')) {
            return dateStr;
        }
        // Otherwise try to parse as date
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr; // Return original if invalid
            return date.toLocaleDateString();
        } catch {
            return dateStr; // Return original string on error
        }
    };

    // Get schema preview (first 3 field names)
    const getSchemaPreview = (collection) => {
        if (!collection.schema || !Array.isArray(collection.schema)) return [];
        return collection.schema.slice(0, 3).map(f => f.name);
    };

    const collectionColors = [
        { from: 'from-blue-500', to: 'to-cyan-500', bg: 'bg-blue-500/10' },
        { from: 'from-emerald-500', to: 'to-teal-500', bg: 'bg-emerald-500/10' },
        { from: 'from-violet-500', to: 'to-purple-600', bg: 'bg-violet-500/10' },
        { from: 'from-orange-500', to: 'to-amber-500', bg: 'bg-orange-500/10' },
        { from: 'from-pink-500', to: 'to-rose-500', bg: 'bg-pink-500/10' },
    ];

    const getColor = (index) => collectionColors[index % collectionColors.length];

    const sortOptions = [
        { value: 'updated_at', label: t('data_collections.sort.last_updated'), iconName: 'clock' },
        { value: 'created_at', label: t('data_collections.sort.date_created'), iconName: 'calendar' },
        { value: 'name', label: t('data_collections.sort.name_az'), iconName: 'sortAsc' },
        { value: 'records', label: t('data_collections.sort.records_count'), iconName: 'chartBar' },
    ];

    const filterOptions = [
        { value: 'all', label: t('data_collections.filter.all'), iconName: 'folder', count: collections.length },
        { value: 'has_data', label: t('data_collections.filter.has_data'), iconName: 'trendingUp', count: collections.filter(c => (c.total_records || 0) > 0).length },
        { value: 'empty', label: t('data_collections.filter.empty'), iconName: 'inbox', count: collections.filter(c => (c.total_records || 0) === 0).length },
        { value: 'with_workflows', label: t('data_collections.filter.with_workflows'), iconName: 'credits', count: collections.filter(c => (c.workflows_count || 0) > 0).length },
    ];

    return (
        <AppLayout title={t('data_collections.title')}>
            <Head title={t('data_collections.title')} />

            <div className={`min-h-screen ${isDark ? 'bg-[#09090b]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
                {/* Background decoration */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-blue-900/20' : 'bg-blue-200/50'}`} />
                    <div className={`absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-200/40'}`} />
                </div>

                <div className="relative max-w-[1400px] mx-auto px-6 py-8">
                    {/* Hero Header */}
                    <div className="flex items-start justify-between mb-10">
                        <div>
                            <div className="flex items-center gap-4">
                                <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {t('data_collections.title')}
                                    </h1>
                                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {t('data_collections.description')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Create Dropdown Menu */}
                        <CreateDropdownMenu
                            onCreateNew={handleCreateNew}
                            onSelectTemplate={handleSelectTemplate}
                            onImportCSV={handleImportCSV}
                        />
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-5 mb-8">
                        {[
                            { label: t('data_collections.stats.collections'), value: stats.total_collections, icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4', gradient: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
                            { label: t('data_collections.stats.total_records'), value: stats.total_records, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20' },
                            { label: t('data_collections.stats.active_workflows'), value: stats.active_workflows, icon: 'M13 10V3L4 14h7v7l9-11h-7z', gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className={`relative overflow-hidden p-5 rounded-2xl backdrop-blur-xl border transition-all hover:scale-[1.02] ${isDark
                                    ? 'bg-white/5 border-white/10 hover:border-white/20'
                                    : 'bg-white/80 border-gray-200/50 hover:border-gray-300 shadow-lg shadow-gray-200/50'
                                    }`}
                            >
                                <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl bg-gradient-to-br ${stat.gradient} opacity-20`} />
                                <div className="relative flex items-center justify-between">
                                    <div>
                                        <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {stat.label}
                                        </p>
                                        <p className={`text-4xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {stat.value}
                                        </p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${stat.gradient} ${stat.shadow} shadow-lg`}>
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Enhanced Toolbar */}
                    <div className={`flex items-center justify-between gap-4 p-4 rounded-2xl backdrop-blur-xl border mb-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg shadow-gray-200/30'
                        }`}>
                        {/* Search */}
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                placeholder={t('data_collections.search_placeholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => { setShowSortDropdown(!showSortDropdown); setShowFilterDropdown(false); }}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isDark
                                    ? 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                            >
                                <Icon name={sortOptions.find(o => o.value === sortBy)?.iconName} className="w-4 h-4" />
                                <span className="hidden sm:inline">{sortOptions.find(o => o.value === sortBy)?.label}</span>
                                <svg className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showSortDropdown && (
                                <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden shadow-2xl border z-50 ${isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200'
                                    }`}>
                                    {sortOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                if (sortBy === option.value) {
                                                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                } else {
                                                    setSortBy(option.value);
                                                    setSortOrder('desc');
                                                }
                                                setShowSortDropdown(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${sortBy === option.value
                                                ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                                                : isDark ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                                                }`}
                                        >
                                            <Icon name={option.iconName} className="w-4 h-4" />
                                            <span className="flex-1 text-left">{option.label}</span>
                                            {sortBy === option.value && (
                                                <svg className={`w-4 h-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Filter Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => { setShowFilterDropdown(!showFilterDropdown); setShowSortDropdown(false); }}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filterBy !== 'all'
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                                    : isDark
                                        ? 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                            >
                                <Icon name={filterOptions.find(o => o.value === filterBy)?.iconName} className="w-4 h-4" />
                                <span className="hidden sm:inline">{filterOptions.find(o => o.value === filterBy)?.label}</span>
                                <svg className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showFilterDropdown && (
                                <div className={`absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden shadow-2xl border z-50 ${isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200'
                                    }`}>
                                    {filterOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => { setFilterBy(option.value); setShowFilterDropdown(false); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${filterBy === option.value
                                                ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                                                : isDark ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                                                }`}
                                        >
                                            <Icon name={option.iconName} className="w-4 h-4" />
                                            <span className="flex-1 text-left">{option.label}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'
                                                }`}>{option.count}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* View Toggle */}
                        <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                            {[{ mode: 'grid', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' }, { mode: 'list', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' }].map(({ mode, icon }) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`p-2.5 rounded-lg transition-all ${viewMode === mode
                                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                                        : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-white'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Results info */}
                    {(searchTerm || filterBy !== 'all') && (
                        <div className={`flex items-center gap-2 mb-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span>{t('data_collections.showing_count', { shown: processedCollections.length, total: collections.length })}</span>
                            {(searchTerm || filterBy !== 'all') && (
                                <button
                                    onClick={() => { setSearchTerm(''); setFilterBy('all'); }}
                                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                        }`}
                                >
                                    {t('data_collections.clear_filters')}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Collections Grid */}
                    {processedCollections.length > 0 ? (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {processedCollections.map((collection, index) => {
                                    const color = getColor(index);
                                    const schemaPreview = getSchemaPreview(collection);
                                    const status = getCollectionStatus(collection);
                                    const usagePercentage = getUsagePercentage(collection);
                                    return (
                                        <Link
                                            key={collection.id}
                                            href={`/data-collections/${collection.id}`}
                                            onMouseEnter={() => setHoveredCard(collection.id)}
                                            onMouseLeave={() => setHoveredCard(null)}
                                            className={`group relative overflow-hidden rounded-2xl backdrop-blur-xl border transition-all duration-300 ${isDark
                                                ? 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                                                : 'bg-white/80 border-gray-200/50 hover:border-gray-300 hover:shadow-xl shadow-lg shadow-gray-200/30'
                                                } ${hoveredCard === collection.id ? 'scale-[1.02]' : ''}`}
                                        >
                                            {/* Gradient Header with enhanced visuals */}
                                            <div className={`relative h-28 bg-gradient-to-br ${color.from} ${color.to} p-4 overflow-hidden`}>
                                                {/* Decorative pattern */}
                                                <div className="absolute inset-0 opacity-10">
                                                    <div className="absolute top-2 right-2 w-20 h-20 rounded-full bg-white/20 blur-xl" />
                                                    <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-black/10 blur-2xl transform -translate-x-1/2 translate-y-1/2" />
                                                </div>

                                                {/* Status Badge - top left */}
                                                <div className="absolute top-3 left-3">
                                                    {status === 'active' ? (
                                                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/90 text-white shadow-lg">
                                                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 8 8">
                                                                <circle cx="4" cy="4" r="3" />
                                                            </svg>
                                                            {t('data_collections.status.in_use')}
                                                        </span>
                                                    ) : status === 'data_only' ? (
                                                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/90 text-white shadow-lg">
                                                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 8 8">
                                                                <circle cx="4" cy="4" r="3" />
                                                            </svg>
                                                            {t('data_collections.status.has_data')}
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-500/90 text-white shadow-lg">
                                                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 8 8">
                                                                <circle cx="4" cy="4" r="3" />
                                                            </svg>
                                                            {t('data_collections.status.idle')}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Icon - top right */}
                                                <div className="absolute top-3 right-3 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                    {collection.icon ? <span className="text-xl">{collection.icon}</span> : <Icon name="database" className="w-5 h-5 text-white" />}
                                                </div>

                                                {/* Stats badges */}
                                                <div className="absolute bottom-3 left-3 flex gap-2">
                                                    <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white/90 text-gray-700 shadow-sm">
                                                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                                        </svg>
                                                        {collection.schema?.length || collection.fields_count || 0} {t('data_collections.fields')}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white/90 text-gray-700 shadow-sm">
                                                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        {collection.total_records || 0} {t('data_collections.records')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-5">
                                                <h3 className={`font-semibold text-lg truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {collection.name}
                                                </h3>
                                                <p className={`text-sm mt-1.5 line-clamp-2 h-10 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                                    {collection.description || t('data_collections.no_description')}
                                                </p>

                                                {/* Schema Preview */}
                                                {schemaPreview.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                                        {schemaPreview.map((fieldName, i) => (
                                                            <span
                                                                key={i}
                                                                className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'
                                                                    }`}
                                                            >
                                                                {fieldName}
                                                            </span>
                                                        ))}
                                                        {(collection.schema?.length || 0) > 3 && (
                                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${isDark ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400'
                                                                }`}>
                                                                +{(collection.schema?.length || 0) - 3} {t('common.more')}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Usage Progress Indicator */}
                                                {usagePercentage > 0 && (
                                                    <div className="mt-3">
                                                        <div className={`flex items-center justify-between text-[10px] mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            <span>{t('data_collections.usage')}</span>
                                                            <span className="font-semibold">{usagePercentage}%</span>
                                                        </div>
                                                        <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                                            <div
                                                                className={`h-full rounded-full bg-gradient-to-r ${color.from} ${color.to} transition-all duration-500`}
                                                                style={{ width: `${usagePercentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Footer */}
                                                <div className={`flex items-center justify-between mt-5 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${color.from} ${color.to} flex items-center justify-center`}>
                                                            <span className="text-[10px] font-bold text-white">{collection.name.charAt(0).toUpperCase()}</span>
                                                        </div>
                                                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            {formatDate(collection.updated_at)}
                                                        </span>
                                                    </div>

                                                    {/* Quick Actions - appears on hover */}
                                                    <div className={`flex items-center gap-1 transition-opacity ${hoveredCard === collection.id ? 'opacity-100' : 'opacity-0'}`}>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            onClick={(e) => handleExport(collection.id, e)}
                                                            className={isDark ? 'hover:bg-blue-500/20 text-gray-400 hover:text-blue-400' : 'hover:bg-blue-50 text-gray-400 hover:text-blue-500'}
                                                            title={t('data_collections.export')}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                        </Button>
                                                        <Button
                                                            variant="success-ghost"
                                                            size="icon-xs"
                                                            onClick={(e) => handleDuplicate(collection, e)}
                                                            title={t('data_collections.duplicate')}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                        </Button>
                                                        <Button
                                                            variant="danger-ghost"
                                                            size="icon-xs"
                                                            onClick={(e) => handleDelete(collection.id, e)}
                                                            title={t('common.delete')}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            /* List View */
                            <div className={`rounded-2xl overflow-hidden backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                                {processedCollections.map((collection, index) => {
                                    const color = getColor(index);
                                    const schemaPreview = getSchemaPreview(collection);
                                    return (
                                        <Link
                                            key={collection.id}
                                            href={`/data-collections/${collection.id}`}
                                            className={`flex items-center gap-4 p-5 border-b last:border-b-0 transition-all ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${color.from} ${color.to} shadow-lg`}>
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{collection.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className={`text-sm truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{collection.description || t('data_collections.no_description')}</p>
                                                    {schemaPreview.length > 0 && (
                                                        <div className="flex gap-1">
                                                            {schemaPreview.slice(0, 2).map((fieldName, i) => (
                                                                <span
                                                                    key={i}
                                                                    className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'
                                                                        }`}
                                                                >
                                                                    {fieldName}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{collection.fields_count || 0} {t('data_collections.fields')}</div>
                                            <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{collection.total_records || 0} {t('data_collections.records')}</div>
                                            <div className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{formatDate(collection.updated_at)}</div>
                                            <Button variant="danger-ghost" size="icon-xs" onClick={(e) => handleDelete(collection.id, e)}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </Button>
                                        </Link>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        /* Empty State */
                        <div className={`relative overflow-hidden rounded-2xl p-16 text-center backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-blue-500 to-cyan-500`} />
                            <div className="relative">
                                <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30 mb-6">
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                    </svg>
                                </div>
                                <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {searchTerm || filterBy !== 'all' ? t('data_collections.no_results') : t('data_collections.create_first')}
                                </h3>
                                <p className={`text-sm mb-8 max-w-md mx-auto ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {searchTerm ? t('data_collections.no_results_for', { term: searchTerm }) :
                                        filterBy !== 'all' ? t('data_collections.no_filter_match') :
                                            t('data_collections.empty_description')}
                                </p>
                                {!searchTerm && filterBy === 'all' && (
                                    <Button
                                        variant="gradient"
                                        onClick={() => setShowCreateModal(true)}
                                        className="bg-gradient-to-r from-blue-500 to-cyan-500 shadow-blue-500/30"
                                        icon={
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        }
                                    >
                                        {t('data_collections.create_collection')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {
                showCreateModal && (
                    <CreateCollectionModal
                        isOpen={showCreateModal}
                        onClose={() => { setShowCreateModal(false); setSelectedTemplate(null); }}
                        initialTemplate={selectedTemplate}
                    />
                )
            }
            {
                showImportCSVModal && (
                    <ImportCSVModal
                        isOpen={showImportCSVModal}
                        onClose={() => setShowImportCSVModal(false)}
                    />
                )
            }
        </AppLayout >
    );
}
