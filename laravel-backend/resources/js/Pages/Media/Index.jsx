import { useState, useCallback } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
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

    const toggleSelect = (id) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkDelete = async () => {
        if (selectedItems.length === 0) return;
        const confirmed = await showConfirm({
            title: 'Delete Files',
            message: `Delete ${selectedItems.length} files?`,
            type: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel',
        });
        if (confirmed) {
            router.post('/media/bulk-delete', { ids: selectedItems }, {
                onSuccess: () => setSelectedItems([]),
            });
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm({
            title: 'Delete File',
            message: 'Are you sure?',
            type: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel',
        });
        if (confirmed) router.delete(`/media/${id}`);
    };

    const applyFilter = (key, value) => {
        router.get('/media', { ...filters, [key]: value }, { preserveState: true });
    };

    return (
        <AppLayout title="Media">
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1400px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Media Library
                            </h1>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                Manage your images and videos
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {selectedItems.length > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'
                                        }`}
                                >
                                    Delete ({selectedItems.length})
                                </button>
                            )}
                            <label className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                }`}>
                                + Upload
                                <input type="file" multiple className="hidden" accept="image/*,video/*" onChange={(e) => handleUpload(e.target.files)} />
                            </label>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Total', value: stats.total },
                            { label: 'Images', value: stats.images },
                            { label: 'Videos', value: stats.videos },
                            { label: 'Storage', value: formatBytes(stats.storage_used) },
                        ].map((stat, i) => (
                            <div key={i} className={`p-4 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{stat.label}</p>
                                <p className={`text-2xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Filters & View */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            {[
                                { key: null, label: 'All' },
                                { key: 'image', label: 'Images' },
                                { key: 'video', label: 'Videos' },
                            ].map((f, i) => (
                                <button
                                    key={i}
                                    onClick={() => applyFilter('type', f.key)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-lg ${filters.type === f.key
                                            ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                                            : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Search..."
                                defaultValue={filters.search}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilter('search', e.target.value)}
                                className={`w-48 px-3 py-2 text-sm rounded-lg ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
                                    } border focus:outline-none`}
                            />
                            <div className={`flex items-center gap-1 p-1 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                                {['grid', 'list'].map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className={`p-1.5 rounded ${viewMode === mode ? isDark ? 'bg-[#2a2a2a] text-white' : 'bg-white text-gray-900 shadow-sm' : isDark ? 'text-gray-500' : 'text-gray-400'}`}
                                    >
                                        {mode === 'grid' ? (
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Upload Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-all ${isDragging
                                ? isDark ? 'border-white bg-[#1a1a1a]' : 'border-gray-900 bg-gray-50'
                                : isDark ? 'border-[#2a2a2a] hover:border-gray-600' : 'border-gray-200 hover:border-gray-400'
                            }`}
                    >
                        {isUploading ? (
                            <div className="space-y-3">
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Uploading... {uploadProgress}%</p>
                                <div className={`w-full max-w-xs mx-auto h-1.5 rounded-full ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`}>
                                    <div className={`h-full rounded-full ${isDark ? 'bg-white' : 'bg-gray-900'}`} style={{ width: `${uploadProgress}%` }} />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-3 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                                    <svg className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Drop files here or click to upload</p>
                                <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>JPG, PNG, GIF, MP4 • Max 50MB</p>
                            </>
                        )}
                    </div>

                    {/* Media Grid/List */}
                    {media.data.length > 0 ? (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                                {media.data.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer ${selectedItems.includes(item.id)
                                                ? isDark ? 'ring-2 ring-white' : 'ring-2 ring-gray-900'
                                                : ''
                                            }`}
                                        onClick={() => setPreviewItem(item)}
                                    >
                                        {item.type === 'video' ? (
                                            <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                                                <svg className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        ) : (
                                            <img src={item.thumbnail_url || item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                                        )}
                                        <div className="absolute top-2 left-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.includes(item.id)}
                                                onChange={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                                                className="w-4 h-4 rounded"
                                            />
                                        </div>
                                        <div className={`absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t ${isDark ? 'from-black/80' : 'from-black/60'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}>
                                            <p className="text-white text-xs truncate">{item.original_name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                <table className="w-full">
                                    <thead>
                                        <tr className={`border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                                            <th className="w-10 p-3"><input type="checkbox" className="rounded" /></th>
                                            <th className={`text-left p-3 text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Name</th>
                                            <th className={`text-left p-3 text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Type</th>
                                            <th className={`text-left p-3 text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Size</th>
                                            <th className={`text-left p-3 text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Date</th>
                                            <th className="w-16 p-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-[#2a2a2a]' : 'divide-gray-100'}`}>
                                        {media.data.map((item) => (
                                            <tr key={item.id} className={isDark ? 'hover:bg-[#222]' : 'hover:bg-gray-50'}>
                                                <td className="p-3">
                                                    <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => toggleSelect(item.id)} className="rounded" />
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPreviewItem(item)}>
                                                        <div className={`w-10 h-10 rounded overflow-hidden flex-shrink-0 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                                                            {item.type === 'video' ? (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <svg className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                            ) : (
                                                                <img src={item.thumbnail_url || item.url} alt="" className="w-full h-full object-cover" />
                                                            )}
                                                        </div>
                                                        <span className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.original_name}</span>
                                                    </div>
                                                </td>
                                                <td className={`p-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {item.type === 'image' ? 'Image' : 'Video'}
                                                </td>
                                                <td className={`p-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.formatted_size}</td>
                                                <td className={`p-3 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{new Date(item.created_at).toLocaleDateString()}</td>
                                                <td className="p-3">
                                                    <button onClick={() => handleDelete(item.id)} className={`p-1.5 rounded ${isDark ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-600'}`}>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : (
                        <div className={`rounded-lg p-16 text-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <div className={`w-14 h-14 mx-auto rounded-lg flex items-center justify-center mb-4 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                                <svg className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No files yet</h3>
                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Upload your first file to get started</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {media.last_page > 1 && (
                        <div className="mt-6 flex items-center justify-center gap-2">
                            {media.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`px-3 py-1.5 text-sm rounded-lg ${link.active
                                            ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                                            : link.url
                                                ? isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                                : isDark ? 'text-gray-600' : 'text-gray-300'
                                        }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Preview Modal */}
                {previewItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90" onClick={() => setPreviewItem(null)}>
                        <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setPreviewItem(null)} className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="rounded-lg overflow-hidden">
                                {previewItem.type === 'video' ? (
                                    <video src={previewItem.url} controls className="w-full" autoPlay />
                                ) : (
                                    <img src={previewItem.url} alt={previewItem.original_name} className="w-full h-auto" />
                                )}
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <div>
                                    <p className="text-white font-medium">{previewItem.original_name}</p>
                                    <p className="text-white/60 text-sm">{previewItem.formatted_size} • {new Date(previewItem.created_at).toLocaleDateString()}</p>
                                </div>
                                <a href={previewItem.url} download={previewItem.original_name} className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg">
                                    Download
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
