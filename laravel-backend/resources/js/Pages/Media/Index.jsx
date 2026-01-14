import { useState, useCallback } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../Layouts/AppLayout';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Index({ media, stats, filters, storage_plan }) {
    const [viewMode, setViewMode] = useState('grid');
    const [selectedItems, setSelectedItems] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewItem, setPreviewItem] = useState(null);
    const { showConfirm } = useConfirm();
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const formatBytes = (bytes) => {
        if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
        if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
        if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return bytes + ' B';
    };

    const handleUpload = useCallback((files) => {
        if (!files || files.length === 0) return;
        setIsUploading(true);
        setUploadProgress(0);
        const formData = new FormData();
        Array.from(files).forEach((file, index) => {
            formData.append(`files[${index}]`, file);
        });
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => prev >= 90 ? 90 : prev + 10);
        }, 200);
        router.post('/media', formData, {
            forceFormData: true,
            onFinish: () => {
                clearInterval(progressInterval);
                setUploadProgress(100);
                setTimeout(() => {
                    setIsUploading(false);
                    setUploadProgress(0);
                }, 500);
            },
        });
    }, []);

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); handleUpload(e.dataTransfer.files); };

    const toggleSelect = (id, e) => {
        e?.stopPropagation();
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkDelete = async () => {
        if (selectedItems.length === 0) return;
        const confirmed = await showConfirm({
            title: t('media.delete_files'),
            message: t('media.confirm_delete_count', { count: selectedItems.length }),
            type: 'danger',
            confirmText: t('common.delete'),
            cancelText: t('common.cancel'),
        });
        if (confirmed) {
            router.post('/media/bulk-delete', { ids: selectedItems }, {
                onSuccess: () => setSelectedItems([]),
            });
        }
    };

    const handleDelete = async (id, e) => {
        e?.stopPropagation();
        const confirmed = await showConfirm({
            title: t('media.delete_file'),
            message: t('media.confirm_delete'),
            type: 'danger',
            confirmText: t('common.delete'),
            cancelText: t('common.cancel'),
        });
        if (confirmed) router.delete(`/media/${id}`);
    };

    const applyFilter = (key, value) => {
        router.get('/media', { ...filters, [key]: value }, { preserveState: true });
    };

    return (
        <AppLayout title={t('media.title')}>
            <div className={`min-h-screen ${isDark ? 'bg-[#09090b]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
                {/* Background decoration */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-pink-900/20' : 'bg-pink-200/50'}`} />
                    <div className={`absolute bottom-0 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-cyan-900/20' : 'bg-cyan-200/40'}`} />
                </div>

                <div className="relative max-w-[1400px] mx-auto px-6 py-8">
                    {/* Hero Header */}
                    <div className="flex items-start justify-between mb-10">
                        <div>
                            <div className="flex items-center gap-4">
                                <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-500/25">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {t('media.title')}
                                    </h1>
                                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {t('media.manage_description')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {selectedItems.length > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    {t('common.delete')} ({selectedItems.length})
                                </button>
                            )}
                            <label className="group relative flex items-center gap-2.5 px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 hover:scale-[1.02] transition-all duration-200 cursor-pointer">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                {t('media.upload_files')}
                                <input type="file" multiple className="hidden" accept="image/*,video/*" onChange={(e) => handleUpload(e.target.files)} />
                            </label>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-5 mb-8">
                        {[
                            { label: t('media.total_files'), value: stats.total, icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', gradient: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-500/20' },
                            { label: t('media.images'), value: stats.images, icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', gradient: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
                            { label: t('media.videos'), value: stats.videos, icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20' },
                            { label: t('media.storage_used'), value: formatBytes(stats.storage_used), icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4', gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
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
                                        <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
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

                    {/* Upload Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative overflow-hidden rounded-2xl p-8 mb-6 text-center transition-all border-2 border-dashed ${isDragging
                            ? 'border-pink-500 bg-pink-500/10'
                            : isDark
                                ? 'border-white/10 hover:border-white/20 bg-white/5'
                                : 'border-gray-200 hover:border-gray-300 bg-white/50'
                            }`}
                    >
                        {isUploading ? (
                            <div className="space-y-4">
                                <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-500/30">
                                    <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>
                                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Uploading... {uploadProgress}%</p>
                                <div className={`w-full max-w-xs mx-auto h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-200"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br from-pink-500/20 to-rose-500/20 mb-4">
                                    <svg className={`w-8 h-8 ${isDark ? 'text-pink-400' : 'text-pink-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>
                                <p className={`text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {t('media.drop_or_click')}
                                </p>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {t('media.file_types')}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Toolbar */}
                    <div className={`flex items-center justify-between gap-4 p-4 rounded-2xl backdrop-blur-xl border mb-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg shadow-gray-200/30'
                        }`}>
                        <div className="flex items-center gap-2">
                            {/* Filter Pills */}
                            <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                {[
                                    { key: null, label: t('common.all') },
                                    { key: 'image', label: t('media.images') },
                                    { key: 'video', label: t('media.videos') },
                                ].map((f, i) => (
                                    <button
                                        key={i}
                                        onClick={() => applyFilter('type', f.key)}
                                        className={`px-4 py-2 text-xs font-medium rounded-lg capitalize transition-all ${filters.type === f.key
                                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25'
                                            : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-white'
                                            }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder={t('common.search')}
                                    defaultValue={filters.search}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilter('search', e.target.value)}
                                    className={`w-48 pl-10 pr-4 py-2.5 rounded-xl text-sm ${isDark
                                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-pink-500/50'
                                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-pink-500'
                                        } border focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all`}
                                />
                            </div>

                            {/* View Toggle */}
                            <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                {[{ mode: 'grid', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' }, { mode: 'list', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' }].map(({ mode, icon }) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className={`p-2.5 rounded-lg transition-all ${viewMode === mode
                                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25'
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
                    </div>

                    {/* Media Grid/List */}
                    {media.data.length > 0 ? (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                                {media.data.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setPreviewItem(item)}
                                        className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03] ${selectedItems.includes(item.id)
                                            ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-transparent'
                                            : ''
                                            } ${isDark ? 'bg-white/5' : 'bg-gray-100 shadow-lg shadow-gray-200/30'}`}
                                    >
                                        {item.type === 'video' ? (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-purple-600/20">
                                                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm">
                                                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                        ) : (
                                            <img src={item.thumbnail_url || item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                                        )}

                                        {/* Checkbox */}
                                        <div className="absolute top-2 left-2">
                                            <label
                                                className={`w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition-all ${selectedItems.includes(item.id)
                                                    ? 'bg-pink-500 text-white'
                                                    : 'bg-black/30 backdrop-blur-sm border border-white/20 group-hover:opacity-100 opacity-0'
                                                    }`}
                                                onClick={(e) => toggleSelect(item.id, e)}
                                            >
                                                {selectedItems.includes(item.id) && (
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </label>
                                        </div>

                                        {/* Overlay */}
                                        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3`}>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-xs font-medium truncate">{item.original_name}</p>
                                                <p className="text-white/60 text-[10px]">{item.formatted_size}</p>
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(item.id, e)}
                                                className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* List View */
                            <div className={`rounded-2xl overflow-hidden backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                                {media.data.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`flex items-center gap-4 p-4 border-b last:border-b-0 transition-all cursor-pointer ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'
                                            }`}
                                        onClick={() => setPreviewItem(item)}
                                    >
                                        <label
                                            className={`w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition-all border ${selectedItems.includes(item.id)
                                                ? 'bg-pink-500 border-pink-500 text-white'
                                                : isDark ? 'border-white/20 hover:border-pink-500' : 'border-gray-300 hover:border-pink-500'
                                                }`}
                                            onClick={(e) => toggleSelect(item.id, e)}
                                        >
                                            {selectedItems.includes(item.id) && (
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </label>
                                        <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                                            {item.type === 'video' ? (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-purple-600/20">
                                                    <svg className={`w-5 h-5 ${isDark ? 'text-violet-400' : 'text-violet-500'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            ) : (
                                                <img src={item.thumbnail_url || item.url} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.original_name}</p>
                                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.type === 'image' ? 'Image' : 'Video'}</p>
                                        </div>
                                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.formatted_size}</div>
                                        <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{new Date(item.created_at).toLocaleDateString()}</div>
                                        <button onClick={(e) => handleDelete(item.id, e)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-red-500/20 text-gray-500 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        /* Empty State */
                        <div className={`relative overflow-hidden rounded-2xl p-16 text-center backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-pink-500 to-rose-500`} />
                            <div className="relative">
                                <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-500/30 mb-6">
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {t('media.no_files')}
                                </h3>
                                <p className={`text-sm mb-8 max-w-md mx-auto ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {t('media.upload_first_file')}
                                </p>
                                <label className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 hover:scale-[1.02] transition-all cursor-pointer">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    {t('media.upload_files')}
                                    <input type="file" multiple className="hidden" accept="image/*,video/*" onChange={(e) => handleUpload(e.target.files)} />
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {media.last_page > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-2">
                            {media.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${link.active
                                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25'
                                        : link.url
                                            ? isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                            : isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
                                        }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Preview Modal */}
                {previewItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setPreviewItem(null)}>
                        <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setPreviewItem(null)} className="absolute -top-14 right-0 p-3 rounded-xl bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="rounded-2xl overflow-hidden bg-black">
                                {previewItem.type === 'video' ? (
                                    <video src={previewItem.url} controls className="w-full" autoPlay />
                                ) : (
                                    <img src={previewItem.url} alt={previewItem.original_name} className="w-full h-auto max-h-[80vh] object-contain" />
                                )}
                            </div>
                            <div className={`mt-4 flex items-center justify-between p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-white/10'} backdrop-blur-xl`}>
                                <div>
                                    <p className="text-white font-medium">{previewItem.original_name}</p>
                                    <p className="text-white/60 text-sm">{previewItem.formatted_size} • {new Date(previewItem.created_at).toLocaleDateString()}</p>
                                </div>
                                <a
                                    href={previewItem.url}
                                    download={previewItem.original_name}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-pink-500/25"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    {t('common.download')}
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout >
    );
}
