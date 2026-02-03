import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/Contexts/ThemeContext';
import { useToast } from '@/Components/Layout/ToastProvider';

/**
 * MediaLibraryModal - Reusable media picker modal
 * 
 * @param {boolean} isOpen - Control modal visibility
 * @param {function} onClose - Callback when modal closes
 * @param {function} onSelect - Callback when media item(s) selected: (items) => void
 * @param {boolean} multiple - Allow multiple selection (default: false)
 * @param {string} accept - Filter by type: 'all', 'image', 'video' (default: 'all')
 * @param {string} title - Custom modal title
 * 
 * @example
 * // Single selection
 * <MediaLibraryModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSelect={(item) => console.log(item.url)}
 * />
 * 
 * // Multiple selection
 * <MediaLibraryModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSelect={(items) => console.log(items)}
 *   multiple={true}
 *   accept="image"
 * />
 */
export default function MediaLibraryModal({
    isOpen,
    onClose,
    onSelect,
    multiple = false,
    accept = 'all',
    title
}) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { addToast } = useToast();
    const isDark = theme === 'dark';

    // State
    const [media, setMedia] = useState({ data: [], total: 0 });
    const [folders, setFolders] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [activeItem, setActiveItem] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [filters, setFilters] = useState({ type: accept === 'all' ? null : accept, folder: null, search: '' });
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [page, setPage] = useState(1);

    // Fetch media from API
    const fetchMedia = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.type) params.append('type', filters.type);
            if (filters.folder) params.append('folder', filters.folder);
            if (filters.search) params.append('search', filters.search);

            // Parallel fetch: files, folders, stats
            const [filesRes, foldersRes, statsRes] = await Promise.all([
                fetch(`/media/list.json?${params.toString()}`, {
                    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin'
                }),
                fetch('/media/folders.json', {
                    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin'
                }),
                fetch('/media/stats.json', {
                    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin'
                })
            ]);

            if (!filesRes.ok) throw new Error('Failed to fetch media');

            const [filesData, foldersData, statsData] = await Promise.all([
                filesRes.json(),
                foldersRes.json(),
                statsRes.json()
            ]);

            // Handle both paginated and non-paginated responses
            const mediaItems = filesData.data || filesData;
            setMedia({
                data: Array.isArray(mediaItems) ? mediaItems : (mediaItems.data || []),
                total: mediaItems.total || (Array.isArray(mediaItems) ? mediaItems.length : 0)
            });
            setFolders(foldersData.folders || foldersData.data || []);
            setStats(statsData.data || statsData || {});
        } catch (error) {
            console.error('Error fetching media:', error);
            addToast(t('media.load_error', 'Không thể tải thư viện'), 'error');
        } finally {
            setLoading(false);
        }
    }, [filters, addToast, t]);

    // Load media when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchMedia();
            setSelectedItems([]);
            setActiveItem(null);
        }
    }, [isOpen, fetchMedia]);

    // Handle file upload
    const handleUpload = useCallback(async (files) => {
        if (!files || files.length === 0) return;

        setIsUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        Array.from(files).forEach((file, index) => {
            formData.append(`files[${index}]`, file);
        });

        // Get CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        const progressInterval = setInterval(() => {
            setUploadProgress(prev => prev >= 90 ? 90 : prev + 10);
        }, 200);

        try {
            const response = await fetch('/media', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
                credentials: 'same-origin',
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');

            addToast(t('media.upload_success', 'Tải lên thành công'), 'success');
            fetchMedia();
        } catch (error) {
            console.error('Upload error:', error);
            addToast(t('media.upload_error', 'Lỗi tải lên'), 'error');
        } finally {
            clearInterval(progressInterval);
            setUploadProgress(100);
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 500);
        }
    }, [addToast, t, fetchMedia]);

    // Drag and drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        if (e.dataTransfer.types.includes('Files')) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files);
        }
    };

    // Toggle item selection
    const toggleSelect = (item, e) => {
        e?.stopPropagation();
        if (multiple) {
            setSelectedItems(prev =>
                prev.find(i => i.id === item.id)
                    ? prev.filter(i => i.id !== item.id)
                    : [...prev, item]
            );
        } else {
            setSelectedItems([item]);
        }
        setActiveItem(item);
    };

    // Confirm selection
    const handleConfirm = () => {
        if (selectedItems.length === 0) return;
        onSelect(multiple ? selectedItems : selectedItems[0]);
        onClose();
    };

    // Navigate to folder
    const navigateToFolder = (folderName) => {
        setFilters(prev => ({ ...prev, folder: '/' + folderName, type: null }));
        setPage(1);
    };

    // Navigate to root
    const navigateToRoot = () => {
        setFilters(prev => ({ ...prev, folder: null }));
        setPage(1);
    };

    // Apply filter
    const applyFilter = (type) => {
        setFilters(prev => ({ ...prev, type: type === 'all' ? null : type, folder: null }));
        setPage(1);
    };

    // Copy URL
    const copyUrl = async (url) => {
        try {
            await navigator.clipboard.writeText(url);
            addToast(t('media.url_copied', 'Đã sao chép URL'), 'success');
        } catch (err) {
            addToast(t('media.copy_failed', 'Không thể sao chép'), 'error');
        }
    };

    const currentFolder = filters.folder ? filters.folder.replace(/^\//, '') : null;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 ${isDark ? 'bg-black/80' : 'bg-black/50'} backdrop-blur-sm`}
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`relative w-[95vw] max-w-6xl h-[85vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col ${isDark ? 'bg-[#0d0d0d]' : 'bg-white'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Header */}
                <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'
                    }`}>
                    <div className="flex items-center gap-4">
                        <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {title || t('media.select_media', 'Chọn Media')}
                        </h2>
                        <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {media.total || 0} files
                        </span>
                        {selectedItems.length > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-violet-900/50 text-violet-300' : 'bg-violet-100 text-violet-700'
                                }`}>
                                {selectedItems.length} đã chọn
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder={t('common.search', 'Tìm kiếm...')}
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && fetchMedia()}
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

                        {/* Upload Button */}
                        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${isDark
                            ? 'bg-[#1a1a1a] text-white hover:bg-[#222]'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            {t('media.upload', 'Tải lên')}
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                accept={accept === 'image' ? 'image/*' : accept === 'video' ? 'video/*' : 'image/*,video/*'}
                                onChange={(e) => handleUpload(e.target.files)}
                            />
                        </label>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#1a1a1a] text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className={`w-48 flex-shrink-0 border-r p-4 space-y-1 overflow-y-auto ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'
                        }`}>
                        <p className={`text-xs font-medium uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t('media.library', 'Thư viện')}
                        </p>

                        {[
                            { key: 'all', label: t('media.all_files', 'Tất cả'), icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', count: stats.total },
                            { key: 'image', label: t('media.images', 'Hình ảnh'), icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', count: stats.images },
                            { key: 'video', label: t('media.videos', 'Video'), icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', count: stats.videos },
                        ].map((item) => (
                            <button
                                key={item.key}
                                onClick={() => applyFilter(item.key)}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${(filters.type === item.key && !filters.folder) || (item.key === 'all' && !filters.type && !filters.folder)
                                    ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                                    : isDark ? 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                                </svg>
                                <span className="flex-1 text-left truncate">{item.label}</span>
                                {item.count !== undefined && (
                                    <span className={`text-xs ${(filters.type === item.key && !filters.folder) || (item.key === 'all' && !filters.type && !filters.folder)
                                        ? isDark ? 'text-black/60' : 'text-white/60'
                                        : isDark ? 'text-gray-600' : 'text-gray-400'
                                        }`}>
                                        {item.count}
                                    </span>
                                )}
                            </button>
                        ))}

                        {/* Folders */}
                        {folders.length > 0 && (
                            <>
                                <div className={`my-3 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`} />
                                <p className={`text-xs font-medium uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {t('media.folders', 'Thư mục')}
                                </p>
                                {folders.map((folder) => (
                                    <button
                                        key={folder}
                                        onClick={() => navigateToFolder(folder)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${filters.folder === '/' + folder
                                            ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                                            : isDark ? 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        <svg className="w-4 h-4 flex-shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                                        </svg>
                                        <span className="flex-1 text-left truncate">{folder}</span>
                                    </button>
                                ))}
                            </>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Upload Progress */}
                        {isUploading && (
                            <div className={`mx-4 mt-4 p-4 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50 border border-gray-200'}`}>
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
                            <div className={`absolute inset-0 z-10 flex items-center justify-center ${isDark ? 'bg-black/80' : 'bg-white/80'} backdrop-blur-sm`}>
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

                        {/* Breadcrumb */}
                        {currentFolder && (
                            <div className={`mx-4 mt-4 flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
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

                        {/* Grid/List */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className={`w-8 h-8 border-2 rounded-full animate-spin ${isDark ? 'border-white border-t-transparent' : 'border-gray-900 border-t-transparent'}`} />
                                </div>
                            ) : media.data?.length > 0 ? (
                                viewMode === 'grid' ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                        {/* Folders */}
                                        {!currentFolder && folders.map((folder) => (
                                            <div
                                                key={`folder-${folder}`}
                                                onClick={() => navigateToFolder(folder)}
                                                className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] flex flex-col items-center justify-center border-2 border-dashed ${isDark ? 'bg-[#1a1a1a] hover:bg-[#222] border-[#2a2a2a]' : 'bg-gray-100 hover:bg-gray-50 border-gray-200'
                                                    }`}
                                            >
                                                <svg className={`w-12 h-12 mb-2 ${isDark ? 'text-amber-500' : 'text-amber-400'}`} fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                                                </svg>
                                                <span className={`text-xs font-medium text-center px-2 truncate max-w-full ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {folder}
                                                </span>
                                            </div>
                                        ))}

                                        {/* Media Items */}
                                        {media.data.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={(e) => toggleSelect(item, e)}
                                                className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] ${selectedItems.find(i => i.id === item.id)
                                                    ? isDark
                                                        ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[#0d0d0d]'
                                                        : 'ring-2 ring-violet-500 ring-offset-2'
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
                                                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm opacity-70 group-hover:opacity-100 transition-opacity">
                                                                <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <img src={item.thumbnail_url || item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                                                )}

                                                {/* Selection Indicator */}
                                                <div className={`absolute top-2 left-2 w-5 h-5 rounded-md flex items-center justify-center transition-all ${selectedItems.find(i => i.id === item.id)
                                                    ? isDark ? 'bg-violet-500 text-white' : 'bg-violet-500 text-white'
                                                    : 'bg-black/30 backdrop-blur-sm border border-white/20 opacity-0 group-hover:opacity-100'
                                                    }`}>
                                                    {selectedItems.find(i => i.id === item.id) && (
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
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
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
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
                                                onClick={(e) => toggleSelect(item, e)}
                                                className={`flex items-center gap-4 p-3 border-b last:border-b-0 transition-all cursor-pointer ${selectedItems.find(i => i.id === item.id)
                                                    ? isDark ? 'bg-violet-900/20' : 'bg-violet-50'
                                                    : isDark ? 'border-[#2a2a2a] hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${selectedItems.find(i => i.id === item.id)
                                                    ? 'bg-violet-500 border-violet-500 text-white'
                                                    : isDark ? 'border-[#2a2a2a]' : 'border-gray-300'
                                                    }`}>
                                                    {selectedItems.find(i => i.id === item.id) && (
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ${isDark ? 'bg-[#222]' : 'bg-gray-100'}`}>
                                                    {item.type === 'video' ? (
                                                        <div className="relative w-full h-full">
                                                            <video src={item.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <svg className="w-3 h-3 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <img src={item.thumbnail_url || item.url} alt="" className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.original_name}</p>
                                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.type === 'image' ? 'Image' : 'Video'}</p>
                                                </div>
                                                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.formatted_size}</div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                /* Empty State */
                                <div className={`flex flex-col items-center justify-center py-20 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50 border border-gray-200'}`}>
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-[#222]' : 'bg-gray-100'}`}>
                                        <svg className={`w-8 h-8 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className={`mt-4 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {t('media.no_files', 'Chưa có file nào')}
                                    </h3>
                                    <p className={`mt-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {t('media.upload_first_file', 'Tải lên hoặc kéo thả file vào đây')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview Panel */}
                    {activeItem && (
                        <div className={`w-72 flex-shrink-0 border-l flex flex-col ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                            {/* Preview */}
                            <div className={`aspect-square w-full flex items-center justify-center p-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                                {activeItem.type === 'video' ? (
                                    <video src={activeItem.url} controls className="max-w-full max-h-full rounded-lg" />
                                ) : (
                                    <img src={activeItem.thumbnail_url || activeItem.url} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                <div>
                                    <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {t('media.filename', 'Tên file')}
                                    </p>
                                    <p className={`text-sm font-medium break-all ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {activeItem.original_name}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {t('media.type', 'Loại')}
                                        </p>
                                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                            {activeItem.type === 'video' ? 'Video' : 'Image'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {t('media.size', 'Kích thước')}
                                        </p>
                                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                            {activeItem.formatted_size}
                                        </p>
                                    </div>
                                </div>

                                {/* Copy URL */}
                                <button
                                    onClick={() => copyUrl(activeItem.url)}
                                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isDark
                                        ? 'bg-[#1a1a1a] text-gray-300 hover:text-white hover:bg-[#222]'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    {t('media.copy_url', 'Sao chép URL')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`px-6 py-4 border-t flex items-center justify-between ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                    <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {multiple
                            ? t('media.select_multiple_hint', 'Click để chọn nhiều file')
                            : t('media.select_single_hint', 'Click để chọn file')
                        }
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDark
                                ? 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                        >
                            {t('common.cancel', 'Hủy')}
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={selectedItems.length === 0}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${selectedItems.length > 0
                                ? isDark
                                    ? 'bg-violet-600 text-white hover:bg-violet-500'
                                    : 'bg-violet-600 text-white hover:bg-violet-700'
                                : isDark
                                    ? 'bg-[#1a1a1a] text-gray-600 cursor-not-allowed'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {t('common.select', 'Chọn')} {selectedItems.length > 0 && `(${selectedItems.length})`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
