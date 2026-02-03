import { useState, useCallback, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../Layouts/AppLayout';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { useTheme } from '@/Contexts/ThemeContext';
import { useToast } from '@/Components/Layout/ToastProvider';
import MediaSidebar from '@/Components/Media/MediaSidebar';
import MediaDetailPanel from '@/Components/Media/MediaDetailPanel';
import MediaContextMenu from '@/Components/Media/MediaContextMenu';
import CreateFolderModal from '@/Components/Media/CreateFolderModal';

export default function Index({ media, stats, folders = [], filters, storage_plan }) {
    const [viewMode, setViewMode] = useState('grid');
    const [selectedItems, setSelectedItems] = useState([]);
    const [activeItem, setActiveItem] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [contextMenu, setContextMenu] = useState(null);
    const [backgroundContextMenu, setBackgroundContextMenu] = useState(null);
    const [showDetailPanel, setShowDetailPanel] = useState(true);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [dragOverFolder, setDragOverFolder] = useState(null);

    const { showConfirm } = useConfirm();
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { addToast } = useToast();
    const isDark = theme === 'dark';

    // Auto-select first item when data loads
    useEffect(() => {
        if (media?.data?.length > 0 && !activeItem) {
            setActiveItem(media.data[0]);
        }
    }, [media?.data]);

    const handleUpload = useCallback((files) => {
        if (!files || files.length === 0) return;
        setIsUploading(true);
        setUploadProgress(0);
        const formData = new FormData();
        Array.from(files).forEach((file, index) => {
            formData.append(`files[${index}]`, file);
        });
        // Include current folder so files are uploaded to the correct location
        if (filters?.folder) {
            formData.append('folder', filters.folder);
        }
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => prev >= 90 ? 90 : prev + 10);
        }, 200);
        router.post('/media', formData, {
            forceFormData: true,
            onSuccess: () => {
                addToast(t('media.upload_success', 'Tải lên thành công'), 'success');
            },
            onFinish: () => {
                clearInterval(progressInterval);
                setUploadProgress(100);
                setTimeout(() => {
                    setIsUploading(false);
                    setUploadProgress(0);
                }, 500);
            },
        });
    }, [addToast, t, filters?.folder]);

    // Track if we're doing an internal drag (moving media to folder) vs external (uploading file)
    const [isInternalDrag, setIsInternalDrag] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        // Only show upload overlay for external file drops (not internal media drags)
        if (!isInternalDrag && e.dataTransfer.types.includes('Files')) {
            setIsDragging(true);
        }
    };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        // Only upload if it's an external drop (has files but no media-id)
        if (e.dataTransfer.files.length > 0 && !e.dataTransfer.getData('text/media-id')) {
            handleUpload(e.dataTransfer.files);
        }
    };

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
                onSuccess: () => {
                    setSelectedItems([]);
                    setActiveItem(null);
                    addToast(t('media.deleted_success', 'Đã xóa thành công'), 'success');
                },
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
        if (confirmed) {
            router.delete(`/media/${id}`, {
                onSuccess: () => {
                    if (activeItem?.id === id) setActiveItem(null);
                    addToast(t('media.deleted_success', 'Đã xóa thành công'), 'success');
                },
            });
        }
    };

    const applyFilter = (key, value) => {
        // Support both single key-value and object with multiple params
        const newFilters = typeof key === 'object'
            ? { ...filters, ...key }
            : { ...filters, [key]: value };
        router.get('/media', newFilters, { preserveState: true });
    };

    const handleContextMenu = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        setBackgroundContextMenu(null);
        setContextMenu({ x: e.clientX, y: e.clientY });
        setActiveItem(item);
    };

    // Handle right-click on background (empty area) to show folder creation option
    const handleBackgroundContextMenu = (e) => {
        // Only trigger if clicking directly on the content area background
        if (e.target === e.currentTarget) {
            e.preventDefault();
            setContextMenu(null);
            setBackgroundContextMenu({ x: e.clientX, y: e.clientY });
        }
    };

    const copyUrl = async (url) => {
        try {
            await navigator.clipboard.writeText(url);
            addToast(t('media.url_copied', 'Đã sao chép URL'), 'success');
        } catch (err) {
            addToast(t('media.copy_failed', 'Không thể sao chép'), 'error');
        }
    };

    // Navigate into folder
    const navigateToFolder = (folderName) => {
        // Don't add leading slash - backend handles normalization
        router.get('/media', { ...filters, folder: folderName, type: null }, { preserveState: true });
    };

    // Navigate back to root
    const navigateToRoot = () => {
        router.get('/media', { ...filters, folder: null, type: null }, { preserveState: true });
    };

    // Handle dropping file on folder
    const handleDropOnFolder = (e, folderName) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverFolder(null);
        setIsInternalDrag(false);

        // Get dragged media ID from data transfer
        const mediaId = e.dataTransfer.getData('text/media-id');
        if (mediaId) {
            router.post(`/media/${mediaId}/move`, { folder: '/' + folderName }, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    addToast(t('media.moved_to_folder', 'File đã được chuyển vào thư mục'), 'success');
                },
                onError: (errors) => {
                    console.error('Move error:', errors);
                    addToast(t('media.move_error', 'Không thể di chuyển file'), 'error');
                }
            });
        }
    };

    // Handle drag start on media item
    const handleMediaDragStart = (e, item) => {
        setIsInternalDrag(true);
        e.dataTransfer.setData('text/media-id', item.id.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    // Handle drag end on media item
    const handleMediaDragEnd = () => {
        setIsInternalDrag(false);
        setDragOverFolder(null);
    };

    // Check if currently in a folder
    const currentFolder = filters?.folder ? filters.folder.replace(/^\//, '') : null;

    return (
        <AppLayout title={t('media.title')}>
            <div
                className={`h-[calc(100vh-64px)] flex ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Sidebar */}
                <MediaSidebar
                    activeFilter={filters?.type}
                    activeFolder={filters?.folder}
                    onFilterChange={applyFilter}
                    stats={stats}
                    folders={folders}
                    storagePlan={storage_plan}
                    isDark={isDark}
                />

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Toolbar */}
                    <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'bg-[#0d0d0d] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center gap-4">
                            <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('media.title', 'Thư viện Media')}
                            </h1>
                            <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {media?.total || 0} files
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Bulk Delete */}
                            {selectedItems.length > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${isDark
                                        ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    {t('common.delete')} ({selectedItems.length})
                                </button>
                            )}

                            {/* Search */}
                            <div className="relative">
                                <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder={t('common.search', 'Tìm kiếm...')}
                                    defaultValue={filters?.search}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilter('search', e.target.value)}
                                    className={`w-48 pl-10 pr-4 py-2 rounded-lg text-sm ${isDark
                                        ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-500 focus:border-gray-500'
                                        : 'bg-gray-100 border-transparent text-gray-900 placeholder-gray-400 focus:bg-gray-50'
                                        } border focus:outline-none transition-all`}
                                />
                            </div>

                            {/* View Toggle */}
                            <div className={`flex p-1 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                                {[
                                    { mode: 'grid', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
                                    { mode: 'list', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' }
                                ].map(({ mode, icon }) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className={`p-2 rounded-md transition-all ${viewMode === mode
                                            ? isDark ? 'bg-white text-black' : 'bg-white text-gray-900 shadow-sm'
                                            : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                                        </svg>
                                    </button>
                                ))}
                            </div>

                            {/* Detail Panel Toggle */}
                            <button
                                onClick={() => setShowDetailPanel(!showDetailPanel)}
                                className={`p-2 rounded-lg transition-all ${showDetailPanel
                                    ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                                    : isDark ? 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                title={t('media.toggle_details', 'Ẩn/Hiện chi tiết')}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                </svg>
                            </button>

                            {/* Upload Button */}
                            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${isDark
                                ? 'bg-white text-black hover:bg-gray-100'
                                : 'bg-gray-900 text-white hover:bg-gray-800'
                                }`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                {t('media.upload', 'Tải lên')}
                                <input type="file" multiple className="hidden" accept="image/*,video/*" onChange={(e) => handleUpload(e.target.files)} />
                            </label>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div
                        className="flex-1 overflow-y-auto p-6"
                        onContextMenu={handleBackgroundContextMenu}
                    >
                        {/* Upload Progress */}
                        {isUploading && (
                            <div className={`mb-4 p-4 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#222]' : 'bg-gray-100'}`}>
                                        <svg className={`w-5 h-5 animate-pulse ${isDark ? 'text-white' : 'text-gray-900'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {t('media.uploading', 'Đang tải lên...')} {uploadProgress}%
                                        </p>
                                        <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                                            <div
                                                className={`h-full rounded-full transition-all duration-200 ${isDark ? 'bg-emerald-500' : 'bg-emerald-600'}`}
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Drag Overlay */}
                        {isDragging && (
                            <div className={`fixed inset-0 z-40 flex items-center justify-center ${isDark ? 'bg-black/80' : 'bg-white/80'} backdrop-blur-sm`}>
                                <div className={`p-12 rounded-2xl border-2 border-dashed ${isDark ? 'border-[#2a2a2a] bg-[#1a1a1a]' : 'border-gray-300 bg-gray-50'}`}>
                                    <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center ${isDark ? 'bg-[#222]' : 'bg-gray-100'}`}>
                                        <svg className={`w-10 h-10 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <p className={`mt-4 text-lg font-medium text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {t('media.drop_here', 'Thả file vào đây')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Breadcrumb for folder navigation */}
                        {currentFolder && (
                            <div className={`mb-4 flex items-center gap-2 px-2 py-2 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                                <button
                                    onClick={navigateToRoot}
                                    className={`flex items-center gap-1 text-sm font-medium ${isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-500'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    Media
                                </button>
                                <svg className={`w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {currentFolder}
                                </span>
                            </div>
                        )}

                        {/* Media Grid/List */}
                        {/* Hide folders when type filter is active (image/video/ai) */}
                        {(() => {
                            const hasTypeFilter = filters?.type && !['', 'all', 'any'].includes(filters.type);
                            const showFolders = !currentFolder && !hasTypeFilter;
                            return (folders.length > 0 && showFolders) || media?.data?.length > 0 ? (
                                viewMode === 'grid' ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                                        {/* Folder Cards - only show in "All Files" view (no type filter) */}
                                        {showFolders && folders.map((folder) => (
                                            <div
                                                key={`folder-${folder}`}
                                                onClick={() => navigateToFolder(folder)}
                                                onDragOver={(e) => { e.preventDefault(); setDragOverFolder(folder); }}
                                                onDragLeave={() => setDragOverFolder(null)}
                                                onDrop={(e) => handleDropOnFolder(e, folder)}
                                                className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] flex flex-col items-center justify-center ${dragOverFolder === folder
                                                    ? 'ring-2 ring-violet-500 ring-offset-2 ' + (isDark ? 'ring-offset-[#0d0d0d] bg-violet-500/20' : 'ring-offset-white bg-violet-100')
                                                    : isDark ? 'bg-[#1a1a1a] hover:bg-[#222]' : 'bg-gray-100 hover:bg-gray-50'
                                                    } border-2 border-dashed ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}
                                            >
                                                <svg className={`w-16 h-16 mb-2 ${isDark ? 'text-amber-500' : 'text-amber-400'}`} fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                                                </svg>
                                                <span className={`text-sm font-medium text-center px-2 truncate max-w-full ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {folder}
                                                </span>
                                                <span className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {t('media.folder', 'Thư mục')}
                                                </span>
                                            </div>
                                        ))}

                                        {/* Media Items */}
                                        {media.data.map((item) => (
                                            <div
                                                key={item.id}
                                                draggable
                                                onDragStart={(e) => handleMediaDragStart(e, item)}
                                                onDragEnd={handleMediaDragEnd}
                                                onClick={() => setActiveItem(item)}
                                                onContextMenu={(e) => handleContextMenu(e, item)}
                                                className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] ${activeItem?.id === item.id
                                                    ? isDark
                                                        ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0d0d0d]'
                                                        : 'ring-2 ring-gray-900 ring-offset-2'
                                                    : ''
                                                    } ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}
                                            >
                                                {item.type === 'video' ? (
                                                    <div className="relative w-full h-full">
                                                        <video
                                                            src={item.url}
                                                            className="w-full h-full object-cover"
                                                            muted
                                                            loop
                                                            playsInline
                                                            preload="metadata"
                                                            onMouseEnter={(e) => e.target.play().catch(() => { })}
                                                            onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm opacity-70 group-hover:opacity-100 transition-opacity`}>
                                                                <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <img src={item.thumbnail_url || item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                                                )}

                                                {/* Checkbox */}
                                                <div className="absolute top-2 left-2">
                                                    <label
                                                        className={`w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition-all ${selectedItems.includes(item.id)
                                                            ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
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

                                                {/* AI Badge */}
                                                {item.source === 'ai_generated' && (
                                                    <div className="absolute top-2 right-2">
                                                        <div className={`px-1.5 py-0.5 rounded-md ${isDark ? 'bg-blue-900/80' : 'bg-blue-500/80'}`}>
                                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Overlay */}
                                                <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 pointer-events-none`}>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white text-xs font-medium truncate">{item.original_name}</p>
                                                        <p className="text-white/60 text-[10px]">{item.formatted_size}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* List View */
                                    <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                        {media.data.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => setActiveItem(item)}
                                                onContextMenu={(e) => handleContextMenu(e, item)}
                                                className={`flex items-center gap-4 p-4 border-b last:border-b-0 transition-all cursor-pointer ${activeItem?.id === item.id
                                                    ? isDark ? 'bg-white/5' : 'bg-gray-50'
                                                    : isDark ? 'border-[#2a2a2a] hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <label
                                                    className={`w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition-all border ${selectedItems.includes(item.id)
                                                        ? isDark ? 'bg-white border-white text-black' : 'bg-gray-900 border-gray-900 text-white'
                                                        : isDark ? 'border-[#2a2a2a] hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                                                        }`}
                                                    onClick={(e) => toggleSelect(item.id, e)}
                                                >
                                                    {selectedItems.includes(item.id) && (
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </label>
                                                <div className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ${isDark ? 'bg-[#222]' : 'bg-gray-100'}`}>
                                                    {item.type === 'video' ? (
                                                        <div className="relative w-full h-full">
                                                            <video src={item.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <svg className="w-4 h-4 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <img src={item.thumbnail_url || item.url} alt="" className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.original_name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            {item.type === 'image' ? 'Image' : 'Video'}
                                                        </span>
                                                        {item.source === 'ai_generated' && (
                                                            <span className={`inline-flex items-center gap-1 text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                                </svg>
                                                                AI
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.formatted_size}</div>
                                                <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{new Date(item.created_at).toLocaleDateString('vi-VN')}</div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                /* Empty State */
                                <div className={`flex flex-col items-center justify-center py-20 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${isDark ? 'bg-[#222]' : 'bg-gray-100'}`}>
                                        <svg className={`w-10 h-10 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className={`mt-6 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {t('media.no_files', 'Chưa có file nào')}
                                    </h3>
                                    <p className={`mt-2 text-sm max-w-sm text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {t('media.upload_first_file', 'Tải lên hoặc kéo thả file vào đây để bắt đầu')}
                                    </p>
                                    <label className={`mt-6 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all ${isDark
                                        ? 'bg-white text-black hover:bg-gray-100'
                                        : 'bg-gray-900 text-white hover:bg-gray-800'
                                        }`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        {t('media.upload_files', 'Tải lên file')}
                                        <input type="file" multiple className="hidden" accept="image/*,video/*" onChange={(e) => handleUpload(e.target.files)} />
                                    </label>
                                </div>
                            )
                        })()}

                        {/* Pagination */}
                        {media?.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-center gap-2">
                                {media.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${link.active
                                            ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                                            : link.url
                                                ? isDark ? 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                                : isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
                                            }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail Panel */}
                {showDetailPanel && (
                    <MediaDetailPanel
                        item={activeItem}
                        onClose={() => setActiveItem(null)}
                        onDelete={handleDelete}
                        isDark={isDark}
                    />
                )}

                {/* Context Menu for files */}
                <MediaContextMenu
                    position={contextMenu}
                    item={activeItem}
                    onClose={() => setContextMenu(null)}
                    onCopyUrl={() => copyUrl(activeItem?.url)}
                    onDownload={() => {
                        const a = document.createElement('a');
                        a.href = activeItem?.url;
                        a.download = activeItem?.original_name;
                        a.click();
                    }}
                    onDelete={() => handleDelete(activeItem?.id)}
                    onOpenAiStudio={() => router.visit('/ai-studio')}
                    isDark={isDark}
                />

                {/* Background Context Menu (for creating folders) */}
                {backgroundContextMenu && (
                    <div
                        className="fixed z-50"
                        style={{ left: backgroundContextMenu.x, top: backgroundContextMenu.y }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`w-52 py-1.5 rounded-xl shadow-xl border overflow-hidden ${isDark
                            ? 'bg-[#1a1a1a] border-[#2a2a2a]'
                            : 'bg-white border-gray-200'
                            }`}>
                            <button
                                onClick={() => {
                                    setBackgroundContextMenu(null);
                                    setShowCreateFolderModal(true);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-all ${isDark
                                    ? 'text-gray-300 hover:bg-[#222] hover:text-white'
                                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                </svg>
                                <span>{t('media.create_folder', 'Tạo thư mục mới')}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Create Folder Modal */}
                <CreateFolderModal
                    isOpen={showCreateFolderModal}
                    onClose={() => setShowCreateFolderModal(false)}
                    onSuccess={() => {
                        addToast(t('media.folder_created', 'Thư mục đã được tạo'), 'success');
                    }}
                    isDark={isDark}
                />
            </div>
        </AppLayout>
    );
}
