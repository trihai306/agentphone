import { useState } from 'react';
import { Link, router, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import FolderSelectModal from '@/Components/Media/FolderSelectModal';
import { Icon } from '@/Components/UI';

export default function Gallery({ generations, filters, currentCredits = 0, folders = [] }) {
    const { theme } = useTheme();
    const { showConfirm } = useConfirm();
    const isDark = theme === 'dark';
    const [selectedGeneration, setSelectedGeneration] = useState(null);
    const [localFilters, setLocalFilters] = useState(filters || {});
    const [viewMode, setViewMode] = useState('grid'); // grid, list
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [showSaveDropdown, setShowSaveDropdown] = useState(false);

    // Theme classes
    const themeClasses = {
        pageBg: isDark ? 'bg-[#0a0a0a]' : 'bg-[#fafafa]',
        cardBg: isDark ? 'bg-[#1a1a1a]' : 'bg-white',
        cardBorder: isDark ? 'border-[#2a2a2a]' : 'border-slate-200',
        inputBg: isDark ? 'bg-[#1a1a1a]' : 'bg-white',
        textPrimary: isDark ? 'text-white' : 'text-slate-900',
        textSecondary: isDark ? 'text-slate-400' : 'text-slate-500',
        textMuted: isDark ? 'text-slate-500' : 'text-slate-400',
    };

    const applyFilters = () => {
        router.get('/ai-studio/generations', localFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setLocalFilters({});
        router.get('/ai-studio/generations', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm({
            title: 'Xoá tác phẩm',
            message: 'Bạn có chắc chắn muốn xoá tác phẩm này không?',
            type: 'danger',
            confirmText: 'Xoá',
            cancelText: 'Huỷ',
        });

        if (confirmed) {
            router.delete(`/ai-studio/generations/${id}`, {
                onSuccess: () => setSelectedGeneration(null),
            });
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            completed: isDark
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200',
            processing: isDark
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-amber-50 text-amber-600 border-amber-200',
            pending: isDark
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                : 'bg-blue-50 text-blue-600 border-blue-200',
            failed: isDark
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-rose-50 text-rose-600 border-rose-200',
        };
        const labels = {
            completed: '✓ Hoàn thành',
            processing: '⏳ Đang xử lý',
            pending: '⏳ Chờ xử lý',
            failed: '✕ Thất bại',
        };
        return { style: styles[status] || styles.failed, label: labels[status] || status };
    };

    const getTypeBadge = (type) => {
        if (type === 'video') {
            return isDark
                ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                : 'bg-violet-50 text-violet-600 border-violet-200';
        }
        return isDark
            ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
            : 'bg-sky-50 text-sky-600 border-sky-200';
    };

    return (
        <AppLayout title="AI Gallery">
            <div className={`min-h-screen transition-colors duration-300 ${themeClasses.pageBg}`}>
                <div className="max-w-[1600px] mx-auto px-6 py-8">
                    {/* Premium Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark
                                    ? 'bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/30'
                                    : 'bg-gradient-to-br from-violet-100 to-indigo-100 border border-violet-200'}`}>
                                    <Icon name="palette" className="w-5 h-5" />
                                </div>
                                <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>
                                    AI Gallery
                                </h1>
                            </div>
                            <p className={`text-sm ${themeClasses.textMuted}`}>
                                {generations.total} tác phẩm đã tạo
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* View Mode Toggle */}
                            <div className={`flex p-1 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-slate-100'}`}>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                                        ? isDark ? 'bg-[#2a2a2a] text-white' : 'bg-white text-slate-900 shadow-sm'
                                        : isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list'
                                        ? isDark ? 'bg-[#2a2a2a] text-white' : 'bg-white text-slate-900 shadow-sm'
                                        : isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>

                            {/* Credits Badge */}
                            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${isDark
                                ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20'
                                : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'}`}>
                                <span className="text-lg">✨</span>
                                <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                    {currentCredits.toLocaleString()}
                                </span>
                                <span className={`text-sm ${themeClasses.textMuted}`}>credits</span>
                            </div>

                            {/* Create Button */}
                            <Link
                                href="/ai-studio"
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 transition-all duration-200"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Tạo mới
                            </Link>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className={`p-5 rounded-2xl mb-6 border ${themeClasses.cardBg} ${themeClasses.cardBorder}`}>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                                <label className={`block text-xs font-semibold mb-2 ${themeClasses.textSecondary}`}>
                                    Loại
                                </label>
                                <select
                                    value={localFilters.type || ''}
                                    onChange={(e) => setLocalFilters({ ...localFilters, type: e.target.value })}
                                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border focus:outline-none focus:ring-2 ${isDark
                                        ? 'bg-[#0a0a0a] border-[#2a2a2a] text-white focus:ring-violet-500/30 focus:border-violet-500'
                                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-violet-500/20 focus:border-violet-400'}`}
                                >
                                    <option value="">Tất cả</option>
                                    <option value="image">Hình ảnh</option>
                                    <option value="video">Video</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-xs font-semibold mb-2 ${themeClasses.textSecondary}`}>
                                    Trạng thái
                                </label>
                                <select
                                    value={localFilters.status || ''}
                                    onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value })}
                                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border focus:outline-none focus:ring-2 ${isDark
                                        ? 'bg-[#0a0a0a] border-[#2a2a2a] text-white focus:ring-violet-500/30 focus:border-violet-500'
                                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-violet-500/20 focus:border-violet-400'}`}
                                >
                                    <option value="">Tất cả</option>
                                    <option value="completed">✓ Hoàn thành</option>
                                    <option value="processing">⏳ Đang xử lý</option>
                                    <option value="failed">✕ Thất bại</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className={`block text-xs font-semibold mb-2 ${themeClasses.textSecondary}`}>
                                    Tìm kiếm
                                </label>
                                <div className="relative">
                                    <svg className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${themeClasses.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Tìm theo prompt..."
                                        value={localFilters.search || ''}
                                        onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
                                        className={`w-full pl-11 pr-4 py-2.5 rounded-xl text-sm transition-all duration-200 border focus:outline-none focus:ring-2 ${isDark
                                            ? 'bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder-slate-600 focus:ring-violet-500/30 focus:border-violet-500'
                                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-violet-500/20 focus:border-violet-400'}`}
                                    />
                                </div>
                            </div>

                            <div className="flex items-end gap-2">
                                <button
                                    onClick={applyFilters}
                                    className="flex-1 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 transition-all duration-200"
                                >
                                    Lọc
                                </button>
                                <button
                                    onClick={clearFilters}
                                    className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${isDark
                                        ? 'text-slate-400 hover:text-white hover:bg-[#1a1a1a]'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                                >
                                    Xoá
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Gallery Grid */}
                    {generations.data?.length > 0 ? (
                        <div className={viewMode === 'grid'
                            ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
                            : 'flex flex-col gap-3'
                        }>
                            {generations.data.map((gen) => (
                                viewMode === 'grid' ? (
                                    // Grid Card
                                    <div
                                        key={gen.id}
                                        onClick={() => setSelectedGeneration(gen)}
                                        className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${isDark
                                            ? 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-violet-500/50 hover:shadow-violet-500/10'
                                            : 'bg-white border-slate-200 hover:border-violet-300 hover:shadow-violet-200/50'}`}
                                    >
                                        {gen.status === 'completed' && gen.output_url ? (
                                            gen.type === 'video' ? (
                                                <video
                                                    src={gen.output_url}
                                                    className="w-full h-full object-cover"
                                                    muted
                                                    loop
                                                    onMouseEnter={(e) => e.target.play()}
                                                    onMouseLeave={(e) => e.target.pause()}
                                                />
                                            ) : (
                                                <img src={gen.output_url} alt={gen.prompt} className="w-full h-full object-cover" />
                                            )
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                                {gen.status === 'processing' || gen.status === 'pending' ? (
                                                    <>
                                                        <div className={`w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mb-3 ${isDark
                                                            ? 'border-violet-500/30 border-t-violet-500'
                                                            : 'border-violet-200 border-t-violet-500'}`} />
                                                        <span className={`text-sm font-medium ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                                                            Đang tạo...
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isDark
                                                            ? 'bg-rose-500/20'
                                                            : 'bg-rose-50'}`}>
                                                            <Icon name="xCircle" className="w-5 h-5" />
                                                        </div>
                                                        <span className={`text-sm font-medium ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                                                            Thất bại
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                                <p className="text-white text-sm font-medium line-clamp-2 mb-2">
                                                    {gen.prompt}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-white/70 text-xs">
                                                        {new Date(gen.created_at).toLocaleDateString('vi-VN')}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(gen.status).style}`}>
                                                        {gen.status === 'completed' ? '✓' : gen.status === 'failed' ? '✕' : '⏳'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Type Badge */}
                                        <div className="absolute top-3 left-3">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border backdrop-blur-sm ${getTypeBadge(gen.type)}`}>
                                                {gen.type === 'video' ? 'Video' : 'Ảnh'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    // List Card
                                    <div
                                        key={gen.id}
                                        onClick={() => setSelectedGeneration(gen)}
                                        className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border transition-all duration-200 hover:scale-[1.01] ${isDark
                                            ? 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-violet-500/50'
                                            : 'bg-white border-slate-200 hover:border-violet-300'}`}
                                    >
                                        {/* Thumbnail */}
                                        <div className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 ${isDark ? 'bg-[#0a0a0a]' : 'bg-slate-100'}`}>
                                            {gen.status === 'completed' && gen.output_url ? (
                                                gen.type === 'video' ? (
                                                    <video src={gen.output_url} className="w-full h-full object-cover" muted />
                                                ) : (
                                                    <img src={gen.output_url} alt="" className="w-full h-full object-cover" />
                                                )
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    {gen.status === 'processing' || gen.status === 'pending' ? (
                                                        <div className={`w-6 h-6 rounded-full border-2 border-t-transparent animate-spin ${isDark ? 'border-violet-500/30 border-t-violet-500' : 'border-violet-200 border-t-violet-500'}`} />
                                                    ) : (
                                                        <Icon name="xCircle" className="w-4 h-4 text-rose-500" />
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium line-clamp-1 mb-1 ${themeClasses.textPrimary}`}>
                                                {gen.prompt}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs ${themeClasses.textMuted}`}>
                                                    {new Date(gen.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className={`px-1.5 py-0.5 text-xs font-medium rounded border ${getTypeBadge(gen.type)}`}>
                                                    {gen.type === 'video' ? <Icon name="video" className="w-5 h-5" /> : <Icon name="media" className="w-5 h-5" />}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${getStatusBadge(gen.status).style}`}>
                                            {getStatusBadge(gen.status).label}
                                        </span>
                                    </div>
                                )
                            ))}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className={`rounded-2xl p-16 text-center border ${themeClasses.cardBg} ${themeClasses.cardBorder}`}>
                            <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 ${isDark
                                ? 'bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20'
                                : 'bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100'}`}>
                                <Icon name="palette" className="w-10 h-10" />
                            </div>
                            <h3 className={`text-xl font-semibold mb-2 ${themeClasses.textPrimary}`}>
                                Chưa có tác phẩm nào
                            </h3>
                            <p className={`text-sm mb-6 max-w-md mx-auto ${themeClasses.textMuted}`}>
                                Bắt đầu sáng tạo hình ảnh và video tuyệt vời với AI. Chất lượng cao, tốc độ nhanh.
                            </p>
                            <Link
                                href="/ai-studio"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 transition-all duration-200"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Bắt đầu sáng tạo
                            </Link>
                        </div>
                    )}

                    {/* Pagination */}
                    {generations.data?.length > 0 && generations.links && (
                        <div className="mt-8 flex items-center justify-center gap-2">
                            {generations.links.map((link, i) => (
                                <button
                                    key={i}
                                    onClick={() => link.url && router.get(link.url)}
                                    disabled={!link.url}
                                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${link.active
                                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25'
                                        : link.url
                                            ? isDark
                                                ? 'text-slate-400 hover:text-white hover:bg-[#1a1a1a]'
                                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                            : isDark ? 'text-slate-700' : 'text-slate-300'
                                        }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {selectedGeneration && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                    onClick={() => setSelectedGeneration(null)}
                >
                    <div
                        className={`relative max-w-4xl w-full rounded-2xl overflow-hidden border ${isDark
                            ? 'bg-[#1a1a1a] border-[#2a2a2a]'
                            : 'bg-white border-slate-200'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedGeneration(null)}
                            className={`absolute top-4 right-4 z-10 p-2 rounded-xl transition-all ${isDark
                                ? 'bg-black/50 text-white hover:bg-black/70'
                                : 'bg-white/90 text-slate-600 hover:bg-white shadow-lg'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Media */}
                        <div className={`flex items-center justify-center min-h-[400px] max-h-[60vh] ${isDark ? 'bg-[#0a0a0a]' : 'bg-slate-50'}`}>
                            {selectedGeneration.status === 'completed' && selectedGeneration.output_url ? (
                                selectedGeneration.type === 'video' ? (
                                    <video
                                        src={selectedGeneration.output_url}
                                        className="max-h-[60vh] w-auto"
                                        controls
                                        autoPlay
                                    />
                                ) : (
                                    <img
                                        src={selectedGeneration.output_url}
                                        alt={selectedGeneration.prompt}
                                        className="max-h-[60vh] w-auto"
                                    />
                                )
                            ) : (
                                <div className="text-center py-16">
                                    {selectedGeneration.status === 'processing' || selectedGeneration.status === 'pending' ? (
                                        <>
                                            <div className={`w-16 h-16 mx-auto rounded-full border-4 border-t-transparent animate-spin mb-4 ${isDark
                                                ? 'border-violet-500/30 border-t-violet-500'
                                                : 'border-violet-200 border-t-violet-500'}`} />
                                            <p className={`text-lg font-medium ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                                                Đang tạo...
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-rose-500/20' : 'bg-rose-50'}`}>
                                                <Icon name="xCircle" className="w-8 h-8" />
                                            </div>
                                            <p className={`text-lg font-medium ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                                                Tạo thất bại
                                            </p>
                                            {selectedGeneration.error_message && (
                                                <p className={`text-sm mt-2 max-w-md mx-auto ${themeClasses.textMuted}`}>
                                                    {selectedGeneration.error_message}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Info Panel */}
                        <div className="p-6">
                            <p className={`text-base mb-4 ${themeClasses.textPrimary}`}>
                                {selectedGeneration.prompt}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${getTypeBadge(selectedGeneration.type)}`}>
                                    {selectedGeneration.type === 'video' ? 'Video' : 'Hình ảnh'}
                                </span>
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${getStatusBadge(selectedGeneration.status).style}`}>
                                    {getStatusBadge(selectedGeneration.status).label}
                                </span>
                                <span className={`text-xs ${themeClasses.textMuted}`}>
                                    {new Date(selectedGeneration.created_at).toLocaleDateString('vi-VN', {
                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                                {selectedGeneration.credits_used > 0 && (
                                    <span className={`text-xs ${themeClasses.textMuted}`}>
                                        ✨ {selectedGeneration.credits_used} credits
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-slate-200'}`}>
                                <div className="flex items-center gap-2">
                                    {selectedGeneration.status === 'completed' && selectedGeneration.output_url && (
                                        <>
                                            <a
                                                href={selectedGeneration.output_url}
                                                download
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 transition-all duration-200"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Tải xuống
                                            </a>

                                            {/* Save to Media with Folder Selection */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${isDark
                                                        ? 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]'
                                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    Lưu vào Media
                                                    <svg className={`w-3 h-3 transition-transform ${showSaveDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>

                                                {showSaveDropdown && (
                                                    <div className={`absolute left-0 bottom-full mb-2 w-48 rounded-xl shadow-xl border overflow-hidden ${isDark
                                                        ? 'bg-[#1a1a1a] border-[#2a2a2a]'
                                                        : 'bg-white border-slate-200'
                                                        }`}>
                                                        <button
                                                            onClick={() => {
                                                                setShowSaveDropdown(false);
                                                                router.post(`/media/save-from-ai/${selectedGeneration.id}`, { folder: '/' }, { preserveScroll: true });
                                                            }}
                                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${isDark
                                                                ? 'text-white hover:bg-[#2a2a2a]'
                                                                : 'text-slate-900 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                            </svg>
                                                            <span>Thư mục gốc</span>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setShowSaveDropdown(false);
                                                                setShowFolderModal(true);
                                                            }}
                                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all border-t ${isDark
                                                                ? 'text-white hover:bg-[#2a2a2a] border-[#2a2a2a]'
                                                                : 'text-slate-900 hover:bg-slate-50 border-slate-100'
                                                                }`}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                                            </svg>
                                                            <span>Chọn thư mục...</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleDelete(selectedGeneration.id)}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${isDark
                                        ? 'text-rose-400 hover:bg-rose-500/20'
                                        : 'text-rose-600 hover:bg-rose-50'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Xoá
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Folder Selection Modal */}
            <FolderSelectModal
                isOpen={showFolderModal}
                onClose={() => setShowFolderModal(false)}
                onSelect={(folder) => {
                    if (selectedGeneration) {
                        router.post(`/media/save-from-ai/${selectedGeneration.id}`, { folder }, { preserveScroll: true });
                    }
                }}
                folders={folders}
                isDark={isDark}
                title="Lưu vào thư mục"
            />
        </AppLayout >
    );
}

