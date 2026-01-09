import { useState, useCallback } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function Index({ media, stats, folders, filters, storage_plan }) {
    const [viewMode, setViewMode] = useState('grid');
    const [selectedItems, setSelectedItems] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewItem, setPreviewItem] = useState(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const { flash } = usePage().props;

    // Format bytes to readable size
    const formatBytes = (bytes) => {
        if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
        if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
        if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return bytes + ' bytes';
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

        // Simulate progress
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + 10;
            });
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

    // Handle drag events
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleUpload(e.dataTransfer.files);
    };

    // Toggle item selection
    const toggleSelect = (id) => {
        setSelectedItems(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    // Bulk delete
    const handleBulkDelete = () => {
        if (selectedItems.length === 0) return;
        if (!confirm(`Xác nhận xóa ${selectedItems.length} file?`)) return;

        router.post('/media/bulk-delete', { ids: selectedItems }, {
            onSuccess: () => setSelectedItems([]),
        });
    };

    // Delete single item
    const handleDelete = (id) => {
        if (!confirm('Xác nhận xóa file này?')) return;
        router.delete(`/media/${id}`);
    };

    // Filter handlers
    const applyFilter = (key, value) => {
        router.get('/media', { ...filters, [key]: value }, { preserveState: true });
    };

    return (
        <AppLayout title="Thư viện Media">
            {/* Animated Header Gradient Background */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />

            {/* Header with Stats */}
            <div className="relative mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                            Thư Viện Media
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                            Quản lý ảnh và video của bạn
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        {selectedItems.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105"
                            >
                                <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="font-semibold">Xóa ({selectedItems.length})</span>
                            </button>
                        )}

                        <label className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:via-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 cursor-pointer transition-all hover:scale-105 relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="relative z-10">Tải lên</span>
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                accept="image/*,video/*"
                                onChange={(e) => handleUpload(e.target.files)}
                            />
                        </label>
                    </div>
                </div>

                {/* Premium Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Tổng file" value={stats.total} icon="📁" gradient="blue" />
                    <StatCard label="Ảnh" value={stats.images} icon="🖼️" gradient="green" />
                    <StatCard label="Video" value={stats.videos} icon="🎬" gradient="purple" />
                    <StatCard label="Dung lượng" value={formatBytes(stats.storage_used)} icon="💾" gradient="orange" />
                </div>

                {/* Storage Usage Bar */}
                {storage_plan && (
                    <StorageUsageBar
                        storagePlan={storage_plan}
                        currentUsage={stats.storage_used}
                        onUpgrade={() => setShowUpgradeModal(true)}
                    />
                )}
            </div>

            {/* Filters & View Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                    <FilterButton
                        active={!filters.type}
                        onClick={() => applyFilter('type', null)}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z" />
                        </svg>
                        Tất cả
                    </FilterButton>
                    <FilterButton
                        active={filters.type === 'image'}
                        onClick={() => applyFilter('type', 'image')}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        Ảnh
                    </FilterButton>
                    <FilterButton
                        active={filters.type === 'video'}
                        onClick={() => applyFilter('type', 'video')}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        Video
                    </FilterButton>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search with icon */}
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Tìm kiếm file..."
                            defaultValue={filters.search}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilter('search', e.target.value)}
                            className="w-64 pl-10 pr-4 py-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400"
                        />
                        <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1 border-2 border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                            title="Grid View"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                            title="List View"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Enhanced Upload Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-10 mb-6 text-center transition-all duration-300 backdrop-blur-sm ${isDragging
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.02]'
                    : 'border-gray-300 dark:border-gray-700 bg-white/30 dark:bg-gray-800/30 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'
                    }`}
            >
                {isUploading ? (
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <div className="w-full max-w-xs">
                            <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">Đang tải lên...</p>
                            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 rounded-full"
                                    style={{ width: `${uploadProgress}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{uploadProgress}% hoàn thành</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-900/40 dark:via-indigo-900/40 dark:to-purple-900/40 rounded-3xl flex items-center justify-center mb-5 shadow-lg transform group-hover:scale-110 transition-transform">
                            <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Kéo thả file vào đây
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            hoặc click để chọn file từ máy tính
                        </p>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span>Hỗ trợ: JPG, PNG, GIF, WebP, MP4, MOV • Tối đa 50MB/file</span>
                        </div>
                    </>
                )}
            </div>

            {/* Media Grid/List */}
            {media.data.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {media.data.map((item, index) => (
                            <MediaCard
                                key={item.id}
                                item={item}
                                index={index}
                                selected={selectedItems.includes(item.id)}
                                onSelect={() => toggleSelect(item.id)}
                                onPreview={() => setPreviewItem(item)}
                                onDelete={() => handleDelete(item.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-xl">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                                <tr>
                                    <th className="w-10 p-4">
                                        <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600" />
                                    </th>
                                    <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Tên file</th>
                                    <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Loại</th>
                                    <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Kích thước</th>
                                    <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Ngày tạo</th>
                                    <th className="w-20 p-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {media.data.map((item) => (
                                    <MediaListItem
                                        key={item.id}
                                        item={item}
                                        selected={selectedItems.includes(item.id)}
                                        onSelect={() => toggleSelect(item.id)}
                                        onPreview={() => setPreviewItem(item)}
                                        onDelete={() => handleDelete(item.id)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                <EmptyState />
            )}

            {/* Pagination */}
            {media.last_page > 1 && (
                <div className="flex justify-center mt-8">
                    <Pagination links={media.links} />
                </div>
            )}

            {/* Enhanced Preview Modal */}
            {previewItem && (
                <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
            )}

            {/* Upgrade Modal */}
            <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
        </AppLayout>
    );
}

// Premium Stat Card with Animation
function StatCard({ label, value, icon, gradient }) {
    const gradients = {
        blue: 'from-blue-500 via-blue-600 to-indigo-600',
        green: 'from-emerald-500 via-teal-500 to-cyan-600',
        purple: 'from-purple-500 via-pink-500 to-rose-600',
        orange: 'from-orange-500 via-amber-500 to-yellow-600',
    };

    return (
        <div className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300" style={{
                backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`
            }} />
            <div className="relative flex items-center justify-between">
                <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        {value}
                    </p>
                </div>
                <div className={`w-14 h-14 bg-gradient-to-br ${gradients[gradient]} rounded-2xl flex items-center justify-center text-2xl shadow-lg transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

// Enhanced Filter Button
function FilterButton({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${active
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/40 scale-105'
                : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-700'
                }`}
        >
            {children}
        </button>
    );
}

// Premium Media Card with Advanced Animations
function MediaCard({ item, index, selected, onSelect, onPreview, onDelete }) {
    return (
        <div
            className={`group relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer hover:shadow-2xl ${selected
                ? 'border-blue-500 ring-4 ring-blue-500/30 scale-105'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
            style={{
                animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`
            }}
        >
            {/* Thumbnail with Overlay Effects */}
            <div className="aspect-square relative overflow-hidden" onClick={onPreview}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

                {item.type === 'video' ? (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
                            <svg className="relative w-16 h-16 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                ) : (
                    <img
                        src={item.thumbnail_url || item.url}
                        alt={item.original_name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                    />
                )}

                {/* Quick Preview Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full p-3 shadow-xl transform scale-0 group-hover:scale-100 transition-transform duration-300">
                        <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Glassmorphic Checkbox */}
            <div className="absolute top-3 left-3 z-30">
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={onSelect}
                    className="w-5 h-5 rounded-md border-2 border-white/50 bg-white/20 backdrop-blur-md checked:bg-blue-500 checked:border-blue-500 transition-all shadow-lg cursor-pointer"
                />
            </div>

            {/* Type Badge with Glow */}
            {item.type === 'video' && (
                <div className="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 backdrop-blur-md rounded-full text-white text-xs font-semibold shadow-lg z-30 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    Video
                </div>
            )}

            {/* Info Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                <p className="text-white text-sm font-semibold truncate mb-1">{item.original_name}</p>
                <div className="flex items-center justify-between text-white/80 text-xs">
                    <span>{item.formatted_size}</span>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-1.5 bg-red-500/90 hover:bg-red-600 rounded-lg transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Enhanced List Item
function MediaListItem({ item, selected, onSelect, onPreview, onDelete }) {
    return (
        <tr className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10 transition-all group">
            <td className="p-4">
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={onSelect}
                    className="rounded border-gray-300 dark:border-gray-600 checked:bg-blue-500 transition-all"
                />
            </td>
            <td className="p-4">
                <div className="flex items-center gap-4 cursor-pointer" onClick={onPreview}>
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex-shrink-0 shadow-md">
                        {item.type === 'video' ? (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                            </div>
                        ) : (
                            <img src={item.thumbnail_url || item.url} alt="" className="w-full h-full object-cover" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="font-semibold text-gray-900 dark:text-white truncate block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.original_name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(item.created_at).toLocaleDateString('vi-VN')}
                        </span>
                    </div>
                </div>
            </td>
            <td className="p-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold shadow-sm ${item.type === 'image'
                    ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-400'
                    : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-400'
                    }`}>
                    {item.type === 'image' ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                    )}
                    {item.type === 'image' ? 'Ảnh' : 'Video'}
                </span>
            </td>
            <td className="p-4 text-sm font-medium text-gray-700 dark:text-gray-300">{item.formatted_size}</td>
            <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                {new Date(item.created_at).toLocaleDateString('vi-VN')}
            </td>
            <td className="p-4">
                <button
                    onClick={onDelete}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </td>
        </tr>
    );
}

// Premium Empty State
function EmptyState() {
    return (
        <div className="text-center py-24">
            <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 rounded-[2rem] transform rotate-6 animate-pulse" />
                <div className="relative w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-[2rem] flex items-center justify-center shadow-2xl">
                    <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
                Chưa có file nào
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Bắt đầu xây dựng thư viện media của bạn bằng cách tải lên ảnh hoặc video đầu tiên
            </p>
            <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    Ảnh
                </div>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-700" />
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    Video
                </div>
            </div>
        </div>
    );
}

// Enhanced Preview Modal
function PreviewModal({ item, onClose }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fadeIn"
            onClick={onClose}
        >
            <div className="relative max-w-6xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-14 right-0 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white transition-all hover:scale-110 group"
                >
                    <svg className="w-6 h-6 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Media Preview */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-900 to-black">
                    {item.type === 'video' ? (
                        <video
                            src={item.url}
                            controls
                            className="w-full max-h-[70vh] rounded-2xl"
                            autoPlay
                        />
                    ) : (
                        <img
                            src={item.url}
                            alt={item.original_name}
                            className="w-full h-auto max-h-[70vh] object-contain rounded-2xl"
                        />
                    )}
                </div>

                {/* Info Panel */}
                <div className="mt-6 p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">{item.original_name}</h3>
                            <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm">
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    {item.formatted_size}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                    {new Date(item.created_at).toLocaleDateString('vi-VN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        {item.type === 'image' ? (
                                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                        ) : (
                                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                        )}
                                    </svg>
                                    {item.type === 'image' ? 'Ảnh' : 'Video'}
                                </span>
                            </div>
                        </div>
                        <a
                            href={item.url}
                            download={item.original_name}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:scale-105"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Tải xuống
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Storage Usage Bar Component
function StorageUsageBar({ storagePlan, currentUsage, onUpgrade }) {
    const usagePercentage = storagePlan.usage_percentage;
    const isNearLimit = usagePercentage >= 80;
    const isOverLimit = usagePercentage >= 100;

    const formatBytes = (bytes) => {
        if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
        if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
        return (bytes / 1024).toFixed(2) + ' KB';
    };

    return (
        <div className={`mt-6 p-5 rounded-2xl border-2 backdrop-blur-sm transition-all ${isOverLimit
            ? 'bg-red-50/80 dark:bg-red-900/20 border-red-300 dark:border-red-700'
            : isNearLimit
                ? 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                : 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700'
            }`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <svg className={`w-5 h-5 ${isOverLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-blue-600'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                        <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                        <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                    </svg>
                    <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            Dung lượng: {formatBytes(currentUsage)} / {storagePlan.formatted_storage}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Gói {storagePlan.name} {storagePlan.max_files && `• Tối đa ${storagePlan.max_files.toLocaleString()} file`}
                        </p>
                    </div>
                </div>

                {(isNearLimit || isOverLimit) && (
                    <button
                        onClick={onUpgrade}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:scale-105"
                    >
                        {isOverLimit ? 'Nâng cấp ngay' : 'Nâng cấp'}
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${isOverLimit
                        ? 'bg-gradient-to-r from-red-500 to-rose-600'
                        : isNearLimit
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                        }`}
                    style={{ width: `${Math.min(100, usagePercentage)}%` }}
                >
                    <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 text-right">
                {usagePercentage.toFixed(1)}% đã sử dụng
            </p>

            {/* Warning Message */}
            {isOverLimit && (
                <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl">
                    <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                        ⚠️ Bạn đã vượt quá giới hạn dung lượng. Vui lòng nâng cấp để tiếp tục tải lên.
                    </p>
                </div>
            )}
            {isNearLimit && !isOverLimit && (
                <div className="mt-3 p-3 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-xl">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                        💡 Dung lượng sắp hết. Hãy nâng cấp để có thêm không gian lưu trữ.
                    </p>
                </div>
            )}
        </div>
    );
}

// Upgrade Modal Component
function UpgradeModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const plans = [
        {
            name: 'Basic',
            price: '50,000₫',
            period: '/tháng',
            storage: '10GB',
            files: '1,000 file',
            features: ['10GB lưu trữ', '1,000 file', 'File tối đa 50MB', 'Ưu tiên tốc độ', 'Video HD'],
            color: 'from-blue-500 to-cyan-500',
        },
        {
            name: 'Pro',
            price: '200,000₫',
            period: '/tháng',
            storage: '50GB',
            files: '5,000 file',
            features: ['50GB lưu trữ', '5,000 file', 'File tối đa 200MB', 'Ưu tiên cao nhất', 'Video 4K', 'Tự động backup'],
            color: 'from-purple-500 to-pink-500',
            popular: true,
        },
        {
            name: 'Enterprise',
            price: '500,000₫',
            period: '/tháng',
            storage: '100GB',
            files: 'Unlimited',
            features: ['100GB lưu trữ', 'Không giới hạn file', 'File tối đa 500MB', 'API access', 'Hỗ trợ 24/7', 'Backup hàng ngày'],
            color: 'from-orange-500 to-amber-500',
        },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="relative max-w-6xl w-full max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black rounded-3xl p-8 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors group"
                >
                    <svg className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                        Nâng cấp gói lưu trữ
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        Chọn gói phù hợp với nhu cầu của bạn
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 transition-all hover:scale-105 ${plan.popular
                                ? 'border-purple-500 shadow-2xl shadow-purple-500/30'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full shadow-lg">
                                    Phổ biến nhất
                                </div>
                            )}

                            <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                                    <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                                    <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                                </svg>
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                                {plan.name}
                            </h3>

                            <div className="text-center mb-6">
                                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                    {plan.price}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400">{plan.period}</span>
                            </div>

                            <div className="space-y-3 mb-6">
                                {plan.features.map((feature, index) => (
                                    <div key={index} className="flex items-start gap-2">
                                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button className={`w-full py-3 rounded-xl font-semibold transition-all shadow-lg hover:scale-105 ${plan.popular
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                                }`}>
                                Chọn gói này
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer Note */}
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
                    💳 Hỗ trợ thanh toán qua thẻ, ví điện tử, chuyển khoản
                </p>
            </div>
        </div>
    );
}

// Enhanced Pagination
function Pagination({ links }) {
    return (
        <div className="flex items-center gap-2">
            {links.map((link, index) => (
                <Link
                    key={index}
                    href={link.url || '#'}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${link.active
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/40 scale-110'
                        : link.url
                            ? 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-700 hover:scale-105'
                            : 'bg-gray-100 dark:bg-gray-900 text-gray-400 cursor-not-allowed border-2 border-gray-200 dark:border-gray-800'
                        }`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                />
            ))}
        </div>
    );
}
