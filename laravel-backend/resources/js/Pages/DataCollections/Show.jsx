import { useState, useCallback } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useConfirm } from '@/Components/UI/ConfirmModal';

export default function Show({ collection, records, filters }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { showConfirm } = useConfirm();
    const isDark = theme === 'dark';
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [editingCell, setEditingCell] = useState(null);
    const [showAddRow, setShowAddRow] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [isLoading, setIsLoading] = useState(false);

    // Form for adding new record
    const { data, setData, post, processing, reset } = useForm({
        data: (collection.schema || []).reduce((acc, field) => {
            acc[field.name] = field.default || '';
            return acc;
        }, {})
    });

    // Handle search with debounce
    const handleSearch = useCallback(() => {
        setIsLoading(true);
        router.get(`/data-collections/${collection.id}`,
            { search: searchQuery },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsLoading(false)
            }
        );
    }, [searchQuery, collection.id]);

    // Handle cursor navigation (Load More)
    const loadMore = (cursor, direction = 'next') => {
        setIsLoading(true);
        router.get(`/data-collections/${collection.id}`,
            { cursor, direction },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsLoading(false)
            }
        );
    };

    const handleAddRecord = (e) => {
        e.preventDefault();
        post(`/data-collections/${collection.id}/records`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowAddRow(false);
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
            onSuccess: () => setEditingCell(null)
        });
    };

    const handleDeleteRecord = async (recordId) => {
        const confirmed = await showConfirm({
            title: t('data_collections.delete_record_title', { defaultValue: 'Xóa record' }),
            message: t('data_collections.confirm_delete_record', { defaultValue: 'Xác nhận xóa record này?' }),
            type: 'danger',
            confirmText: t('common.delete', { defaultValue: 'Xóa' }),
            cancelText: t('common.cancel', { defaultValue: 'Hủy' }),
        });

        if (!confirmed) return;

        router.delete(`/data-collections/${collection.id}/records/${recordId}`, {
            preserveScroll: true
        });
    };

    const handleBulkDelete = async () => {
        if (selectedRecords.length === 0) return;

        const confirmed = await showConfirm({
            title: t('data_collections.delete_records_title', { defaultValue: 'Xóa nhiều records' }),
            message: t('data_collections.confirm_bulk_delete', { count: selectedRecords.length, defaultValue: `Xác nhận xóa ${selectedRecords.length} records?` }),
            type: 'danger',
            confirmText: t('common.delete', { defaultValue: 'Xóa' }),
            cancelText: t('common.cancel', { defaultValue: 'Hủy' }),
        });

        if (!confirmed) return;

        router.post(`/data-collections/${collection.id}/records/bulk-delete`, {
            ids: selectedRecords
        }, {
            preserveScroll: true,
            onSuccess: () => setSelectedRecords([])
        });
    };

    const toggleSelectAll = () => {
        if (selectedRecords.length === records.data.length) {
            setSelectedRecords([]);
        } else {
            setSelectedRecords(records.data.map(r => r.id));
        }
    };

    const handleExport = () => {
        window.location.href = `/data-collections/${collection.id}/export`;
    };

    return (
        <AppLayout title={collection.name}>
            <Head title={`${collection.name} - Data Collections`} />

            {/* Header */}
            <div className="relative mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <Link
                        href="/data-collections"
                        className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">{collection.icon}</span>
                        <div>
                            <h1 className="text-2xl font-bold">{collection.name}</h1>
                            {collection.description && (
                                <p className="text-sm text-gray-500">{collection.description}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search & Action Bar */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder={t('data_collections.search_records', { defaultValue: 'Search records...' })}
                                className={`w-64 pl-9 pr-4 py-2 rounded-lg border text-sm ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white' : 'bg-white border-gray-300'}`}
                            />
                            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>
                            {collection.total_records} records
                        </span>
                        <span className="text-sm text-gray-500">Updated {collection.updated_at}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedRecords.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete ({selectedRecords.length})
                            </button>
                        )}
                        <button
                            onClick={handleExport}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525]' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            {t('data_collections.export_csv', { defaultValue: 'Export CSV' })}
                        </button>
                        <button
                            onClick={() => setShowAddRow(!showAddRow)}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {t('data_collections.add_row', { defaultValue: 'Add Row' })}
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className={`rounded-2xl border-2 overflow-hidden ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className={`${isDark ? 'bg-[#141414]' : 'bg-gray-50'}`}>
                            <tr>
                                <th className="w-12 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedRecords.length === records.data.length && records.data.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded"
                                    />
                                </th>
                                {(collection.schema || []).map((field) => (
                                    <th
                                        key={field.name}
                                        className={`px-4 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <FieldIcon type={field.type} />
                                            {field.name}
                                            {field.required && <span className="text-red-500">*</span>}
                                        </div>
                                    </th>
                                ))}
                                <th className="w-20 px-4 py-3 text-right">{t('common.actions', { defaultValue: 'Actions' })}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Add New Row Form */}
                            {showAddRow && (
                                <tr className={`${isDark ? 'bg-cyan-500/10' : 'bg-cyan-50'}`}>
                                    <td className="px-4 py-3">
                                        <span className="text-cyan-500 font-bold">+</span>
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
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 justify-end">
                                            <button
                                                onClick={handleAddRecord}
                                                disabled={processing}
                                                className="p-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setShowAddRow(false)}
                                                className={`p-1.5 rounded ${isDark ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'}`}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {/* Data Rows */}
                            {records.data.map((record) => (
                                <tr
                                    key={record.id}
                                    className={`border-t ${isDark ? 'border-[#2a2a2a] hover:bg-[#252525]' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}
                                >
                                    <td className="px-4 py-3">
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
                                            className="w-4 h-4 rounded"
                                        />
                                    </td>
                                    {(collection.schema || []).map((field) => (
                                        <td key={field.name} className="px-4 py-3">
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
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => handleDeleteRecord(record.id)}
                                            className={`p-1.5 rounded transition-all ${isDark ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-500 hover:text-red-500'}`}
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
                                    <td colSpan={(collection.schema?.length || 0) + 2} className="px-4 py-12 text-center">
                                        <p className="text-gray-500 mb-4">{t('data_collections.no_records', { defaultValue: 'No records yet' })}</p>
                                        <button
                                            onClick={() => setShowAddRow(true)}
                                            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg"
                                        >
                                            {t('data_collections.add_first_record', { defaultValue: 'Add First Record' })}
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Cursor Pagination */}
                <div className={`px-4 py-3 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'} flex items-center justify-between`}>
                    <span className="text-sm text-gray-500">
                        {t('data_collections.showing_records', { showing: records.data.length, total: collection.total_records, defaultValue: `Showing ${records.data.length} of ${collection.total_records} records` })}
                        {records.per_page && ` • ${records.per_page} ${t('data_collections.per_page', { defaultValue: 'per page' })}`}
                    </span>
                    <div className="flex gap-2">
                        {records.prev_cursor && (
                            <button
                                onClick={() => loadMore(records.prev_cursor, 'prev')}
                                disabled={isLoading}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${isDark ? 'bg-[#252525] hover:bg-[#2a2a2a]' : 'bg-gray-100 hover:bg-gray-200'} disabled:opacity-50`}
                            >
                                ← {t('common.previous', { defaultValue: 'Previous' })}
                            </button>
                        )}
                        {records.has_more && records.next_cursor && (
                            <button
                                onClick={() => loadMore(records.next_cursor, 'next')}
                                disabled={isLoading}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${isDark ? 'bg-[#252525] hover:bg-[#2a2a2a]' : 'bg-gray-100 hover:bg-gray-200'} disabled:opacity-50`}
                            >
                                {isLoading ? t('common.loading', { defaultValue: 'Loading...' }) : t('data_collections.load_more', { defaultValue: 'Load More →' })}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

// Field Icon Component
function FieldIcon({ type }) {
    const icons = {
        text: '📝',
        number: '🔢',
        email: '📧',
        date: '📅',
        boolean: '☑️',
        select: '🎯',
        textarea: '📄',
        url: '🔗',
    };
    return <span className="text-sm">{icons[type] || '📄'}</span>;
}

// Field Input Component
function FieldInput({ field, value, onChange, isDark }) {
    const baseClass = `w-full px-2 py-1 rounded border text-sm ${isDark ? 'bg-[#252525] border-gray-700' : 'bg-white border-gray-300'}`;

    switch (field.type) {
        case 'boolean':
            return (
                <input
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) => onChange(e.target.checked)}
                    className="w-4 h-4 rounded"
                />
            );
        case 'select':
            return (
                <select value={value || ''} onChange={(e) => onChange(e.target.value)} className={baseClass}>
                    <option value="">Select...</option>
                    {(field.options || []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
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

// Editable Cell Component
function EditableCell({ value, field, isEditing, onEdit, onSave, onCancel, isDark }) {
    const [editValue, setEditValue] = useState(value);

    if (isEditing) {
        return (
            <div className="flex items-center gap-1">
                <FieldInput field={field} value={editValue} onChange={setEditValue} isDark={isDark} />
                <button onClick={() => onSave(editValue)} className="p-1 text-cyan-500 hover:text-cyan-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </button>
                <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        );
    }

    const displayValue = () => {
        if (field.type === 'boolean') {
            return value ? '✅' : '❌';
        }
        return value || <span className="text-gray-400 italic">empty</span>;
    };

    return (
        <div
            onClick={onEdit}
            className={`cursor-pointer px-2 py-1 rounded transition-all ${isDark ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'}`}
        >
            {displayValue()}
        </div>
    );
}
