import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/Contexts/ThemeContext';
import { createPortal } from 'react-dom';

/**
 * MediaLibraryModal - Full-featured media library modal matching /media page UI
 * Supports multi-file selection and folder selection
 * 
 * Usage:
 * <MediaLibraryModal
 *   isOpen={showPicker}
 *   onClose={() => setShowPicker(false)}
 *   onSelect={(files) => handleFilesSelected(files)} // Array of files
 *   onSelectFolder={(folder) => handleFolderSelected(folder)}
 *   allowFolderSelection={true}
 *   allowMultiple={true} // Enable multi-select
 *   fileType="any" // 'image', 'video', or 'any'
 * />
 */
export default function MediaLibraryModal({
    isOpen,
    onClose,
    onSelect,
    onSelectFolder,
    allowFolderSelection = false,
    allowMultiple = true,
    fileType = 'any',
}) {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const isDark = theme === 'dark';

    // State
    const [viewMode, setViewMode] = useState('grid');
    const [activeFilter, setActiveFilter] = useState(null);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [mediaFiles, setMediaFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [stats, setStats] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [showDetailPanel, setShowDetailPanel] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // Fetch media when modal opens or filter changes
    useEffect(() => {
        if (isOpen) {
            fetchMedia();
        }
    }, [isOpen, activeFilter, currentFolder]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedItems([]);
            setCurrentFolder(null);
            setSearchTerm('');
            setActiveFilter(null);
        }
    }, [isOpen]);

    const fetchMedia = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (currentFolder) {
                params.append('folder', currentFolder);
            }
            if (activeFilter && activeFilter !== 'all') {
                params.append('type', activeFilter);
            }
            if (fileType !== 'any') {
                params.append('type', fileType);
            }

            const response = await window.axios.get(`/media/list.json?${params.toString()}`);
            const data = response.data;
            const files = data?.data || data || [];
            setMediaFiles(files);

            // Get folders - only show at root level
            if (!currentFolder) {
                const foldersResponse = await window.axios.get('/media/folders.json');
                setFolders(foldersResponse.data?.folders || foldersResponse.data || []);
            } else {
                setFolders([]);
            }

            // Get stats
            try {
                const statsResponse = await window.axios.get('/media/stats.json');
                setStats(statsResponse.data || {});
            } catch (err) {
                // Stats may not exist
            }
        } catch (error) {
            console.error('Failed to fetch media:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle file upload
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

        window.axios.post('/media', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(() => {
            fetchMedia();
        }).finally(() => {
            clearInterval(progressInterval);
            setUploadProgress(100);
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 500);
        });
    }, []);

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

    // Filter files based on search
    const filteredFiles = useMemo(() => {
        return mediaFiles.filter(file => {
            const matchesSearch = !searchTerm ||
                file.original_name?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [mediaFiles, searchTerm]);

    // Filter folders based on search
    const filteredFolders = useMemo(() => {
        return folders.filter(folder => {
            const folderName = typeof folder === 'string' ? folder : folder.name;
            return !searchTerm || folderName.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [folders, searchTerm]);

    // Navigate to folder
    const navigateToFolder = (folderName) => {
        const folderPath = currentFolder
            ? `${currentFolder}/${folderName}`
            : `/${folderName}`;
        setCurrentFolder(folderPath);
        setSelectedItems([]);
    };

    // Navigate back
    const navigateBack = () => {
        if (!currentFolder) return;
        const parts = currentFolder.split('/').filter(Boolean);
        if (parts.length <= 1) {
            setCurrentFolder(null);
        } else {
            parts.pop();
            setCurrentFolder('/' + parts.join('/'));
        }
        setSelectedItems([]);
    };

    // Toggle item in selection
    const toggleItemSelection = (item) => {
        if (allowMultiple) {
            setSelectedItems(prev => {
                const isSelected = prev.some(i => i.id === item.id);
                if (isSelected) {
                    return prev.filter(i => i.id !== item.id);
                }
                return [...prev, item];
            });
        } else {
            setSelectedItems([item]);
        }
    };

    // Select all files in current view
    const selectAll = () => {
        setSelectedItems(filteredFiles);
    };

    // Clear selection
    const clearSelection = () => {
        setSelectedItems([]);
    };

    // Handle confirm selection
    const handleConfirmSelection = () => {
        if (selectedItems.length > 0 && onSelect) {
            onSelect(allowMultiple ? selectedItems : selectedItems[0]);
            onClose();
        }
    };

    const handleSelectFolder = () => {
        if (currentFolder && onSelectFolder) {
            onSelectFolder({
                name: currentFolder.split('/').filter(Boolean).pop(),
                path: currentFolder,
                files: filteredFiles, // Include files in folder
            });
            onClose();
        }
    };

    // Check if item is selected
    const isItemSelected = (item) => selectedItems.some(i => i.id === item.id);

    // Sidebar nav items
    const navItems = [
        { key: 'all', label: t('media.all_files', 'Tất cả tệp'), icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', count: stats.total },
        { key: 'image', label: t('media.images', 'Hình ảnh'), icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', count: stats.images },
        { key: 'video', label: 'Video', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', count: stats.videos },
        { key: 'ai', label: 'AI Generated', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', count: stats.ai_generated },
    ];

    if (!isOpen) return null;

    const modalContent = (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
            onClick={onClose}
        >
            <div
                className={`relative w-full max-w-7xl h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col ${isDark ? 'bg-[#0d0d0d]' : 'bg-white'}`}
                onClick={(e) => e.stopPropagation()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Header */}
                <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${isDark ? 'bg-[#0d0d0d] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
                    <div>
                        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {t('media.library', 'Thư Viện Media')}
                        </h2>
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 mt-1">
                            <button
                                onClick={() => setCurrentFolder(null)}
                                className={`text-sm ${isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-500'}`}
                            >
                                {t('media.library', 'Thư viện')}
                            </button>
                            {currentFolder && (
                                <>
                                    <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>/</span>
                                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {currentFolder.split('/').filter(Boolean).pop()}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-[#252525] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Main Content - 3 Column Layout */}
                <div className="flex-1 flex min-h-0 overflow-hidden">
                    {/* Left Sidebar - Filters */}
                    <div className={`w-56 shrink-0 border-r flex flex-col ${isDark ? 'bg-[#0d0d0d] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
                        <div className="flex-1 p-4 space-y-1 overflow-y-auto">
                            <p className={`text-xs font-medium uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('media.library', 'Thư viện')}
                            </p>

                            {navItems.map((item) => (
                                <button
                                    key={item.key}
                                    onClick={() => {
                                        setActiveFilter(item.key === 'all' ? null : item.key);
                                        setCurrentFolder(null);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${(activeFilter === item.key && !currentFolder) || (item.key === 'all' && !activeFilter && !currentFolder)
                                        ? isDark
                                            ? 'bg-white text-black'
                                            : 'bg-gray-900 text-white'
                                        : isDark
                                            ? 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                                    </svg>
                                    <span className="flex-1 text-left">{item.label}</span>
                                    {item.count !== undefined && (
                                        <span className={`text-xs ${(activeFilter === item.key && !currentFolder) || (item.key === 'all' && !activeFilter && !currentFolder)
                                            ? isDark ? 'text-black/60' : 'text-white/60'
                                            : isDark ? 'text-gray-600' : 'text-gray-400'
                                            }`}>
                                            {item.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Center - Main Content */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                        {/* Toolbar */}
                        <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-3">
                                <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {filteredFiles.length} {t('media.files', 'files')}
                                </span>
                                {selectedItems.length > 0 && (
                                    <>
                                        <span className={`text-sm font-medium ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                                            • {selectedItems.length} đã chọn
                                        </span>
                                        <button
                                            onClick={clearSelection}
                                            className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                        >
                                            Bỏ chọn
                                        </button>
                                    </>
                                )}
                                {allowMultiple && filteredFiles.length > 0 && selectedItems.length < filteredFiles.length && (
                                    <button
                                        onClick={selectAll}
                                        className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30' : 'bg-violet-50 text-violet-600 hover:bg-violet-100'}`}
                                    >
                                        Chọn tất cả
                                    </button>
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
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
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

                        {/* Media Grid/List */}
                        <div className="flex-1 overflow-y-auto p-4">
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
                                <div className={`absolute inset-0 z-40 flex items-center justify-center ${isDark ? 'bg-black/80' : 'bg-white/80'} backdrop-blur-sm`}>
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

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-4" />
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('common.loading', 'Đang tải...')}</p>
                                </div>
                            ) : viewMode === 'grid' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {/* Back Button when in folder */}
                                    {currentFolder && (
                                        <div
                                            onClick={navigateBack}
                                            className={`group aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 border-2 border-dashed ${isDark ? 'border-[#2a2a2a] hover:border-violet-500/50 bg-[#1a1a1a]' : 'border-gray-200 hover:border-violet-500/50 bg-white'}`}
                                        >
                                            <svg className={`w-10 h-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                                            </svg>
                                            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Quay lại</span>
                                        </div>
                                    )}

                                    {/* Folder Cards */}
                                    {!currentFolder && filteredFolders.map((folder) => {
                                        const folderName = typeof folder === 'string' ? folder : folder.name;
                                        return (
                                            <div
                                                key={`folder-${folderName}`}
                                                onClick={() => navigateToFolder(folderName)}
                                                className={`group aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] flex flex-col items-center justify-center ${isDark ? 'bg-[#1a1a1a] hover:bg-[#222]' : 'bg-gray-100 hover:bg-gray-50'} border-2 border-dashed ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}
                                            >
                                                <svg className={`w-16 h-16 mb-2 ${isDark ? 'text-amber-500' : 'text-amber-400'}`} fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                                                </svg>
                                                <span className={`text-sm font-medium text-center px-2 truncate max-w-full ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {folderName}
                                                </span>
                                                <span className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {t('media.folder', 'Thư mục')}
                                                </span>
                                            </div>
                                        );
                                    })}

                                    {/* Media Files */}
                                    {filteredFiles.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleItemSelection(item)}
                                            className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] ${isItemSelected(item)
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

                                            {/* Selection indicator */}
                                            {isItemSelected(item) && (
                                                <div className="absolute top-2 right-2">
                                                    <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}

                                            {/* AI Badge */}
                                            {item.source === 'ai_generated' && (
                                                <div className="absolute top-2 left-2">
                                                    <div className={`px-1.5 py-0.5 rounded-md ${isDark ? 'bg-blue-900/80' : 'bg-blue-500/80'}`}>
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Overlay */}
                                            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-xs font-medium truncate">{item.original_name}</p>
                                                    <p className="text-white/60 text-[10px]">{item.formatted_size}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Empty State */}
                                    {!isLoading && filteredFiles.length === 0 && filteredFolders.length === 0 && !currentFolder && (
                                        <div className="col-span-full flex flex-col items-center justify-center py-12">
                                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                                                <svg className={`w-10 h-10 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <h3 className={`mt-6 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {t('media.no_files', 'Chưa có tệp nào')}
                                            </h3>
                                            <p className={`mt-2 text-sm max-w-sm text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {t('media.upload_first_file', 'Tải lên hoặc kéo thả file vào đây để bắt đầu')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* List View */
                                <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                    {filteredFiles.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleItemSelection(item)}
                                            className={`flex items-center gap-4 p-4 border-b last:border-b-0 transition-all cursor-pointer ${isItemSelected(item)
                                                ? isDark ? 'bg-violet-500/10' : 'bg-violet-50'
                                                : isDark ? 'border-[#2a2a2a] hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'
                                                }`}
                                        >
                                            {/* Selection checkbox */}
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isItemSelected(item)
                                                ? 'bg-violet-500 border-violet-500'
                                                : isDark ? 'border-gray-600' : 'border-gray-300'
                                                }`}>
                                                {isItemSelected(item) && (
                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 ${isDark ? 'bg-[#222]' : 'bg-gray-100'}`}>
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
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar - Detail Panel */}
                    {showDetailPanel && (
                        <div className={`w-72 shrink-0 border-l flex flex-col ${isDark ? 'bg-[#0d0d0d] border-[#2a2a2a]' : 'bg-gray-50 border-gray-200'}`}>
                            {selectedItems.length > 0 ? (() => {
                                const lastItem = selectedItems[selectedItems.length - 1];
                                return (
                                    <>
                                        {/* Preview */}
                                        <div className={`aspect-square w-full flex items-center justify-center p-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
                                            {lastItem.type === 'video' ? (
                                                <video
                                                    src={lastItem.url}
                                                    controls
                                                    className="max-w-full max-h-full rounded-lg"
                                                />
                                            ) : (
                                                <img
                                                    src={lastItem.thumbnail_url || lastItem.url}
                                                    alt={lastItem.original_name}
                                                    className="max-w-full max-h-full object-contain rounded-lg"
                                                />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                            {/* Selection count */}
                                            {selectedItems.length > 1 && (
                                                <div className={`p-3 rounded-lg ${isDark ? 'bg-violet-500/10' : 'bg-violet-50'}`}>
                                                    <p className={`text-sm font-medium ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                                                        {selectedItems.length} files đã chọn
                                                    </p>
                                                </div>
                                            )}
                                            <div>
                                                <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {t('media.filename', 'Tên file')}
                                                </p>
                                                <p className={`text-sm font-medium break-all ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {lastItem.original_name}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {t('media.type', 'Loại')}
                                                    </p>
                                                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                        {lastItem.type === 'video' ? 'Video' : 'Image'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {t('media.size', 'Kích thước')}
                                                    </p>
                                                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                        {lastItem.formatted_size}
                                                    </p>
                                                </div>
                                            </div>

                                            {lastItem.source === 'ai_generated' && (
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    AI Generated
                                                </div>
                                            )}
                                        </div>
                                    </>
                                );
                            })() : (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center p-6">
                                        <div className={`w-16 h-16 mx-auto rounded-xl flex items-center justify-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                                            <svg className={`w-8 h-8 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <p className={`mt-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {t('media.select_to_preview', 'Chọn file để xem chi tiết')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`px-6 py-4 border-t shrink-0 flex items-center justify-between ${isDark ? 'border-[#2a2a2a] bg-[#0d0d0d]' : 'border-gray-200 bg-gray-50'}`}>
                    <div>
                        {selectedItems.length > 0 ? (
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-violet-500/20' : 'bg-violet-50'}`}>
                                    <span className={`text-lg font-bold ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                                        {selectedItems.length}
                                    </span>
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {selectedItems.length} file đã chọn
                                    </p>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {selectedItems.map(i => i.original_name).slice(0, 2).join(', ')}
                                        {selectedItems.length > 2 && ` +${selectedItems.length - 2} khác`}
                                    </p>
                                </div>
                            </div>
                        ) : currentFolder && allowFolderSelection ? (
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-50'}`}>
                                    <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M10 4H2v16h20V6H12l-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {currentFolder.split('/').filter(Boolean).pop()}
                                    </p>
                                    <p className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                        Chọn folder → Lấy {filteredFiles.length} file trong folder
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {t('media.select_file_or_folder', 'Chọn file hoặc folder')}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className={`px-4 py-2.5 rounded-xl font-medium transition-all ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                        >
                            {t('common.cancel', 'Hủy')}
                        </button>

                        {/* Select Folder Button */}
                        {currentFolder && allowFolderSelection && selectedItems.length === 0 && (
                            <button
                                onClick={handleSelectFolder}
                                className="px-6 py-2.5 rounded-xl font-medium transition-all bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:scale-105"
                            >
                                Chọn Folder ({filteredFiles.length} files)
                            </button>
                        )}

                        {/* Select Files Button */}
                        <button
                            onClick={handleConfirmSelection}
                            disabled={selectedItems.length === 0}
                            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${selectedItems.length > 0
                                ? 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg shadow-violet-500/30 hover:scale-105'
                                : `${isDark ? 'bg-[#252525] text-gray-600' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
                                }`}
                        >
                            {selectedItems.length > 0
                                ? `Chọn ${selectedItems.length} File`
                                : t('media.select_file', 'Chọn File')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
