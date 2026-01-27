import { useState, useCallback, useMemo, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { useToast } from '@/Components/Layout/ToastProvider';

export default function Show({ collection, records, filters }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { showConfirm } = useConfirm();
    const { addToast } = useToast();
    const isDark = theme === 'dark';

    // State
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [editingCell, setEditingCell] = useState(null);
    const [showAddRow, setShowAddRow] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [isLoading, setIsLoading] = useState(false);
    const [sortField, setSortField] = useState(filters?.sort || 'created_at');
    const [sortOrder, setSortOrder] = useState(filters?.order || 'desc');
    const [perPage, setPerPage] = useState(records?.per_page || 50);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);

    // Table density state (compact | standard | comfortable)
    const [tableDensity, setTableDensity] = useState(() => {
        return localStorage.getItem('table_density') || 'standard';
    });

    // Persist density preference
    useEffect(() => {
        localStorage.setItem('table_density', tableDensity);
    }, [tableDensity]);

    // Density CSS classes
    const densityStyles = useMemo(() => ({
        compact: 'text-xs py-1 px-2',
        standard: 'text-sm py-2.5 px-3',
        comfortable: 'text-sm py-4 px-4'
    }), []);

    const { data, setData, post, processing, reset } = useForm({
        data: (collection.schema || []).reduce((acc, field) => {
            acc[field.name] = field.default || '';
            return acc;
        }, {})
    });

    // Sort options
    const sortOptions = useMemo(() => [
        { value: 'created_at', label: t('data_collections.sort.date_created'), icon: '📅' },
        { value: 'id', label: 'ID', icon: '#️⃣' },
        ...(collection.schema || []).map(field => ({
            value: `data.${field.name}`,
            label: field.name,
            icon: getFieldIcon(field.type)
        }))
    ], [collection.schema, t]);

    const perPageOptions = [10, 25, 50, 100];

    // Handlers
    const handleSearch = useCallback(() => {
        setIsLoading(true);
        router.get(`/data-collections/${collection.id}`, {
            search: searchQuery,
            sort: sortField,
            order: sortOrder,
            per_page: perPage
        }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsLoading(false)
        });
    }, [searchQuery, collection.id, sortField, sortOrder, perPage]);

    const handleSort = (field) => {
        const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortOrder(newOrder);
        setShowSortDropdown(false);
        setIsLoading(true);
        router.get(`/data-collections/${collection.id}`, {
            search: searchQuery,
            sort: field,
            order: newOrder,
            per_page: perPage
        }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsLoading(false)
        });
    };

    const handlePerPageChange = (value) => {
        setPerPage(value);
        setShowPerPageDropdown(false);
        setIsLoading(true);
        router.get(`/data-collections/${collection.id}`, {
            search: searchQuery,
            sort: sortField,
            order: sortOrder,
            per_page: value
        }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsLoading(false)
        });
    };

    const loadMore = (cursor, direction = 'next') => {
        setIsLoading(true);
        router.get(`/data-collections/${collection.id}`, {
            cursor,
            direction,
            search: searchQuery,
            sort: sortField,
            order: sortOrder,
            per_page: perPage
        }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsLoading(false)
        });
    };

    const handleAddRecord = (e) => {
        e.preventDefault();
        post(`/data-collections/${collection.id}/records`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowAddRow(false);
                addToast(t('data_collections.record_added'), 'success');
            }
        });
    };

    const handleUpdateCell = (recordId, fieldName, value) => {
        const record = records.data.find(r => r.id === recordId);
        if (!record) return;
        router.put(`/data-collections/${collection.id}/records/${recordId}`, {
            data: { ...record.data, [fieldName]: value }
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingCell(null);
                addToast(t('data_collections.record_updated'), 'success');
            }
        });
    };

    const handleDeleteRecord = async (recordId) => {
        const confirmed = await showConfirm({
            title: t('data_collections.delete_record'),
            message: t('data_collections.delete_record_confirm'),
            type: 'danger',
            confirmText: t('common.delete'),
            cancelText: t('common.cancel'),
        });
        if (confirmed) {
            router.delete(`/data-collections/${collection.id}/records/${recordId}`, {
                preserveScroll: true,
                onSuccess: () => addToast(t('data_collections.record_deleted'), 'success')
            });
        }
    };

    const handleBulkDelete = async () => {
        if (selectedRecords.length === 0) return;
        const confirmed = await showConfirm({
            title: t('data_collections.delete_records'),
            message: t('data_collections.delete_bulk_confirm', { count: selectedRecords.length }),
            type: 'danger',
            confirmText: t('common.delete'),
            cancelText: t('common.cancel'),
        });
        if (confirmed) {
            router.post(`/data-collections/${collection.id}/records/bulk-delete`, { ids: selectedRecords }, {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedRecords([]);
                    addToast(t('data_collections.records_deleted', { count: selectedRecords.length }), 'success');
                }
            });
        }
    };

    const toggleSelectAll = () => {
        if (selectedRecords.length === records.data.length) {
            setSelectedRecords([]);
        } else {
            setSelectedRecords(records.data.map(r => r.id));
        }
    };

    const handleExport = () => window.location.href = `/data-collections/${collection.id}/export`;

    const handleBulkExport = () => {
        if (selectedRecords.length === 0) return;
        const ids = selectedRecords.join(',');
        window.location.href = `/data-collections/${collection.id}/export?ids=${ids}`;
        addToast(t('data_collections.exporting_selected', { count: selectedRecords.length }), 'info');
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyboard = (e) => {
            // Ctrl/Cmd + A = Select all (prevent default browser behavior)
            if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.target.matches('input, textarea, [contenteditable]')) {
                e.preventDefault();
                toggleSelectAll();
            }

            // Delete key = Bulk delete if selection > 0
            if (e.key === 'Delete' && selectedRecords.length > 0 && !e.target.matches('input, textarea, [contenteditable]')) {
                handleBulkDelete();
            }

            // Escape = Clear selection
            if (e.key === 'Escape') {
                setSelectedRecords([]);
                setEditingCell(null);
            }
        };

        document.addEventListener('keydown', handleKeyboard);
        return () => document.removeEventListener('keydown', handleKeyboard);
    }, [selectedRecords, toggleSelectAll, handleBulkDelete]);

    return (
        <AppLayout title={collection.name}>
            <Head title={`${collection.name} - ${t('data_collections.title')}`} />

            <div className={`min-h-screen ${isDark ? 'bg-[#09090b]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
                {/* Background decoration */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-blue-900/20' : 'bg-blue-200/50'}`} />
                    <div className={`absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-violet-900/20' : 'bg-violet-200/40'}`} />
                </div>

                <div className="relative max-w-[1400px] mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-8">
                        <Link
                            href="/data-collections"
                            className={`p-3 rounded-xl mt-1 transition-all ${isDark
                                ? 'hover:bg-white/5 text-gray-400'
                                : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>

                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25`}>
                                    <span className="text-2xl">{collection.icon || '📊'}</span>
                                </div>
                                <div>
                                    <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {collection.name}
                                    </h1>
                                    {collection.description && (
                                        <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                            {collection.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick stats */}
                        <div className="flex items-center gap-3">
                            <div className={`px-4 py-2 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm'}`}>
                                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('data_collections.records')}</div>
                                <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{collection.total_records || 0}</div>
                            </div>
                            <div className={`px-4 py-2 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm'}`}>
                                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('data_collections.fields')}</div>
                                <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{collection.schema?.length || 0}</div>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className={`relative z-10 rounded-2xl mb-6 p-4 backdrop-blur-xl border ${isDark
                        ? 'bg-white/5 border-white/10'
                        : 'bg-white/80 border-gray-200/50 shadow-lg shadow-gray-200/20'}`}>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            {/* Search */}
                            <div className="flex items-center gap-3 flex-1">
                                <div className="relative flex-1 max-w-md">
                                    <svg className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder={t('data_collections.search_records')}
                                        className={`w-full pl-12 pr-4 py-3 rounded-xl text-sm ${isDark
                                            ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                                            } border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => { setSearchQuery(''); handleSearch(); }}
                                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-200 text-gray-400'}`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Sort Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => { setShowSortDropdown(!showSortDropdown); setShowPerPageDropdown(false); }}
                                        className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isDark
                                            ? 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                        </svg>
                                        <span>{sortOptions.find(o => o.value === sortField)?.label || t('data_collections.sort.date_created')}</span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                                            {sortOrder === 'asc' ? '↑' : '↓'}
                                        </span>
                                    </button>

                                    {showSortDropdown && (
                                        <div className={`absolute top-full left-0 mt-2 w-56 rounded-xl overflow-hidden shadow-2xl border z-[100] ${isDark
                                            ? 'bg-[#1a1a1a] border-white/10'
                                            : 'bg-white border-gray-200'
                                            }`}>
                                            {sortOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => handleSort(option.value)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${sortField === option.value
                                                        ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                                                        : isDark ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                                                        }`}
                                                >
                                                    <span>{option.icon}</span>
                                                    <span className="flex-1 text-left">{option.label}</span>
                                                    {sortField === option.value && (
                                                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Per Page Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => { setShowPerPageDropdown(!showPerPageDropdown); setShowSortDropdown(false); }}
                                        className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isDark
                                            ? 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                                            }`}
                                    >
                                        <span>{perPage} {t('data_collections.per_page')}</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {showPerPageDropdown && (
                                        <div className={`absolute top-full left-0 mt-2 w-32 rounded-xl overflow-hidden shadow-2xl border z-[100] ${isDark
                                            ? 'bg-[#1a1a1a] border-white/10'
                                            : 'bg-white border-gray-200'
                                            }`}>
                                            {perPageOptions.map((option) => (
                                                <button
                                                    key={option}
                                                    onClick={() => handlePerPageChange(option)}
                                                    className={`w-full px-4 py-2.5 text-sm text-left transition-all ${perPage === option
                                                        ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                                                        : isDark ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                                                        }`}
                                                >
                                                    {option} {t('data_collections.rows')}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Table Density Toggle */}
                                <div className={`flex items-center border rounded-xl overflow-hidden ${isDark
                                    ? 'border-white/10 bg-white/5'
                                    : 'border-gray-200 bg-gray-50'
                                    }`}>
                                    {/* Compact */}
                                    <button
                                        onClick={() => setTableDensity('compact')}
                                        className={`px-3 py-2.5 text-sm font-medium transition-all ${tableDensity === 'compact'
                                            ? isDark
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : 'bg-blue-50 text-blue-600'
                                            : isDark
                                                ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                            }`}
                                        title={t('data_collections.density.compact')}
                                    >
                                        {/* Compact icon: 3 thin horizontal lines */}
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                    </button>

                                    {/* Standard */}
                                    <button
                                        onClick={() => setTableDensity('standard')}
                                        className={`px-3 py-2.5 text-sm font-medium transition-all border-x ${tableDensity === 'standard'
                                            ? isDark
                                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                                : 'bg-blue-50 text-blue-600 border-blue-200'
                                            : isDark
                                                ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5 border-white/5'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border-gray-200'
                                            }`}
                                        title={t('data_collections.density.standard')}
                                    >
                                        {/* Standard icon: 3 medium lines */}
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                    </button>

                                    {/* Comfortable */}
                                    <button
                                        onClick={() => setTableDensity('comfortable')}
                                        className={`px-3 py-2.5 text-sm font-medium transition-all ${tableDensity === 'comfortable'
                                            ? isDark
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : 'bg-blue-50 text-blue-600'
                                            : isDark
                                                ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                            }`}
                                        title={t('data_collections.density.comfortable')}
                                    >
                                        {/* Comfortable icon: 3 thick lines with more spacing */}
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 5h16M4 12h16M4 19h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleExport}
                                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${isDark
                                        ? 'text-gray-300 hover:bg-white/5'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    {t('data_collections.export')}
                                </button>
                                <button
                                    onClick={() => setShowAddRow(!showAddRow)}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    {t('data_collections.add_row')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className={`relative z-0 rounded-2xl overflow-hidden backdrop-blur-xl border ${isDark
                        ? 'bg-white/5 border-white/10'
                        : 'bg-white/80 border-gray-200/50 shadow-lg shadow-gray-200/20'}`}>

                        {/* Loading overlay */}
                        {isLoading && (
                            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className={`sticky top-0 z-[1] ${isDark
                                    ? 'bg-[#141414]'
                                    : 'bg-gray-200/80'}`}>
                                    <tr className={`border-b-2 ${isDark ? 'border-blue-900/30' : 'border-blue-100'}`}>
                                        <th className="w-12 px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedRecords.length === records.data.length && records.data.length > 0}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                            />
                                        </th>
                                        {(collection.schema || []).map((field) => (
                                            <th
                                                key={field.name}
                                                onClick={() => handleSort(`data.${field.name}`)}
                                                className={`px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest cursor-pointer transition-colors ${isDark
                                                    ? 'text-gray-300 hover:text-white bg-transparent hover:bg-white/5'
                                                    : 'text-gray-700 hover:text-gray-900 bg-transparent hover:bg-black/5'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">{getFieldIcon(field.type)}</span>
                                                    <span>{field.name}</span>
                                                    {field.required && <span className="text-red-500">*</span>}
                                                    {sortField === `data.${field.name}` && (
                                                        <span className={`text-blue-500`}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        {/* Created At Column */}
                                        <th
                                            onClick={() => handleSort('created_at')}
                                            className={`px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest cursor-pointer transition-colors whitespace-nowrap ${isDark
                                                ? 'text-gray-300 hover:text-white bg-transparent hover:bg-white/5'
                                                : 'text-gray-700 hover:text-gray-900 bg-transparent hover:bg-black/5'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">📅</span>
                                                <span>{t('data_collections.sort.date_created')}</span>
                                                {sortField === 'created_at' && (
                                                    <span className="text-blue-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </div>
                                        </th>
                                        <th className="w-16 px-4 py-4 text-right">
                                            <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {t('common.actions')}
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {/* Add Row */}
                                    {showAddRow && (
                                        <tr className={`${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                                            <td className="px-4 py-4">
                                                <span className="text-blue-500 text-lg">+</span>
                                            </td>
                                            {(collection.schema || []).map((field) => (
                                                <td key={field.name} className="px-4 py-3">
                                                    <FieldInput
                                                        field={field}
                                                        value={data.data[field.name]}
                                                        onChange={(val) => setData('data', { ...data.data, [field.name]: val })}
                                                        isDark={isDark}
                                                    />
                                                </td>
                                            ))}
                                            {/* Empty cell for Created At column */}
                                            <td className="px-4 py-3"></td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={handleAddRecord}
                                                        disabled={processing}
                                                        className={`p-2 rounded-lg transition-all ${isDark
                                                            ? 'text-emerald-400 hover:bg-emerald-500/20'
                                                            : 'text-emerald-600 hover:bg-emerald-50'}`}
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => setShowAddRow(false)}
                                                        className={`p-2 rounded-lg transition-all ${isDark
                                                            ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                    {/* Records */}
                                    {records.data.map((record, rowIndex) => (
                                        <tr
                                            key={record.id}
                                            className={`group transition-colors ${isDark
                                                ? 'hover:bg-white/5'
                                                : rowIndex % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-100/50'
                                                }`}
                                        >
                                            <td className={densityStyles[tableDensity]}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRecords.includes(record.id)}
                                                    onChange={() => {
                                                        setSelectedRecords(prev =>
                                                            prev.includes(record.id)
                                                                ? prev.filter(id => id !== record.id)
                                                                : [...prev, record.id]
                                                        );
                                                    }}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                                />
                                            </td>
                                            {(collection.schema || []).map((field) => (
                                                <td key={field.name} className={densityStyles[tableDensity]}>
                                                    <EditableCell
                                                        value={record.data[field.name]}
                                                        field={field}
                                                        isEditing={editingCell === `${record.id}-${field.name}`}
                                                        onEdit={() => setEditingCell(`${record.id}-${field.name}`)}
                                                        onSave={(val) => handleUpdateCell(record.id, field.name, val)}
                                                        onCancel={() => setEditingCell(null)}
                                                        isDark={isDark}
                                                    />
                                                </td>
                                            ))}
                                            {/* Created At Column */}
                                            <td className={`${densityStyles[tableDensity]} whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {record.created_at || '—'}
                                            </td>
                                            <td className={densityStyles[tableDensity]}>
                                                <button
                                                    onClick={() => handleDeleteRecord(record.id)}
                                                    className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isDark
                                                        ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                                                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Empty State */}
                                    {records.data.length === 0 && !showAddRow && (
                                        <tr>
                                            <td colSpan={(collection.schema?.length || 0) + 2} className="px-4 py-16 text-center">
                                                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                                    <svg className={`w-8 h-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <p className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {searchQuery ? t('data_collections.no_results') : t('data_collections.no_records')}
                                                </p>
                                                <p className={`text-sm mb-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                                    {searchQuery ? t('data_collections.try_different_search') : t('data_collections.add_first_record')}
                                                </p>
                                                {!searchQuery && (
                                                    <button
                                                        onClick={() => setShowAddRow(true)}
                                                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                        </svg>
                                                        {t('data_collections.add_first_record')}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className={`px-6 py-4 border-t flex items-center justify-between ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>
                            <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {t('data_collections.showing_of', {
                                    count: records.data.length,
                                    total: collection.total_records
                                })}
                            </div>
                            <div className="flex items-center gap-2">
                                {records.prev_cursor && (
                                    <button
                                        onClick={() => loadMore(records.prev_cursor, 'prev')}
                                        disabled={isLoading}
                                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all disabled:opacity-50 ${isDark
                                            ? 'text-gray-300 hover:bg-white/5 border border-white/10'
                                            : 'text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        {t('common.previous')}
                                    </button>
                                )}
                                {records.has_more && records.next_cursor && (
                                    <button
                                        onClick={() => loadMore(records.next_cursor, 'next')}
                                        disabled={isLoading}
                                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all disabled:opacity-50 ${isDark
                                            ? 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'}`}
                                    >
                                        {isLoading ? t('common.loading') : t('common.next')}
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Floating Selection Toolbar */}
                    {selectedRecords.length > 0 && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
                            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${isDark
                                ? 'bg-[#1a1a1a]/95 border-white/10'
                                : 'bg-white/95 border-gray-200'
                                }`}>
                                {/* Selection count */}
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                        {selectedRecords.length} {t('data_collections.selected')}
                                    </span>
                                </div>

                                {/* Divider */}
                                <div className={`w-px h-6 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

                                {/* Bulk Export */}
                                <button
                                    onClick={handleBulkExport}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDark
                                        ? 'text-gray-300 hover:bg-white/5'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    {t('data_collections.export_selected')}
                                </button>

                                {/* Bulk Delete */}
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    {t('common.delete')}
                                </button>

                                {/* Clear selection */}
                                <button
                                    onClick={() => setSelectedRecords([])}
                                    className={`p-2 rounded-lg transition-all ${isDark
                                        ? 'text-gray-500 hover:bg-white/5'
                                        : 'text-gray-400 hover:bg-gray-100'
                                        }`}
                                    title={t('data_collections.clear_selection')}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

// Helper function to get field icon
function getFieldIcon(type) {
    const icons = {
        text: '📝',
        number: '🔢',
        email: '📧',
        date: '📅',
        boolean: '✓',
        select: '📋',
        textarea: '📄',
        url: '🔗',
        phone: '📱',
        currency: '💰',
        rating: '⭐',
        autonumber: '#️⃣'
    };
    return icons[type] || '📝';
}

function FieldInput({ field, value, onChange, isDark }) {
    const baseClass = `w-full px-3 py-2 rounded-lg text-sm transition-all ${isDark
        ? 'bg-white/5 border-white/10 text-white focus:border-blue-500'
        : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
        } border focus:outline-none focus:ring-2 focus:ring-blue-500/20`;

    switch (field.type) {
        case 'boolean':
            return (
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => onChange(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {value ? 'Yes' : 'No'}
                    </span>
                </label>
            );
        case 'select':
            return (
                <select value={value || ''} onChange={(e) => onChange(e.target.value)} className={baseClass}>
                    <option value="">Select...</option>
                    {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            );
        case 'date':
            return <input type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} className={baseClass} />;
        case 'number':
            return <input type="number" value={value || ''} onChange={(e) => onChange(e.target.value)} className={baseClass} />;
        case 'email':
            return <input type="email" value={value || ''} onChange={(e) => onChange(e.target.value)} className={baseClass} placeholder="email@example.com" />;
        case 'url':
            return <input type="url" value={value || ''} onChange={(e) => onChange(e.target.value)} className={baseClass} placeholder="https://..." />;
        case 'textarea':
            return <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} className={`${baseClass} resize-none`} rows={2} />;
        default:
            return <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className={baseClass} />;
    }
}

function EditableCell({ value, field, isEditing, onEdit, onSave, onCancel, isDark }) {
    const [editValue, setEditValue] = useState(value);

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <FieldInput field={field} value={editValue} onChange={setEditValue} isDark={isDark} />
                </div>
                <button
                    onClick={() => onSave(editValue)}
                    className={`p-1.5 rounded-lg transition-all ${isDark
                        ? 'text-emerald-400 hover:bg-emerald-500/20'
                        : 'text-emerald-600 hover:bg-emerald-50'}`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </button>
                <button
                    onClick={onCancel}
                    className={`p-1.5 rounded-lg transition-all ${isDark
                        ? 'text-gray-500 hover:bg-white/5'
                        : 'text-gray-400 hover:bg-gray-100'}`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        );
    }

    const displayValue = () => {
        if (field.type === 'boolean') {
            return value ? (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500">✓</span>
            ) : (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-500/10 text-gray-400">—</span>
            );
        }
        if (field.type === 'url' && value) {
            return (
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate block max-w-xs">
                    {value}
                </a>
            );
        }
        if (field.type === 'email' && value) {
            return (
                <a href={`mailto:${value}`} className="text-blue-500 hover:underline">
                    {value}
                </a>
            );
        }
        return value || <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>—</span>;
    };

    return (
        <div
            onClick={onEdit}
            className={`cursor-pointer text-sm py-1 px-2 -mx-2 rounded-lg transition-all hover:ring-2 hover:ring-blue-500/20 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
        >
            {displayValue()}
        </div>
    );
}
