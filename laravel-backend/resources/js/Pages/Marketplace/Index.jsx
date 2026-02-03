import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Index({ listings = { data: [] }, filters = {}, stats = {}, popularTags = [] }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const formatVND = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [filterCategory, setFilterCategory] = useState(filters?.category || 'all');
    const [filterPriceType, setFilterPriceType] = useState(filters?.price_type || 'all');
    const [sortBy, setSortBy] = useState(filters?.sort || 'popular');

    // Categories as horizontal tabs
    const categories = [
        { id: 'all', name: t('common.all', 'Tất cả'), icon: '🔥' },
        { id: 'tiktok', name: 'TikTok', icon: '🎵' },
        { id: 'facebook', name: 'Facebook', icon: '📘' },
        { id: 'instagram', name: 'Instagram', icon: '📸' },
        { id: 'youtube', name: 'YouTube', icon: '▶️' },
        { id: 'shopee', name: 'Shopee', icon: '🛒' },
        { id: 'lazada', name: 'Lazada', icon: '🛍️' },
        { id: 'telegram', name: 'Telegram', icon: '✈️' },
        { id: 'ecommerce', name: 'E-commerce', icon: '🏪' },
        { id: 'automation', name: 'Automation', icon: '⚡' },
    ];

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/marketplace', {
            search: searchQuery,
            category: filterCategory !== 'all' ? filterCategory : undefined,
            price_type: filterPriceType !== 'all' ? filterPriceType : undefined,
            sort: sortBy,
        }, { preserveState: true });
    };

    const handleCategoryClick = (categoryId) => {
        setFilterCategory(categoryId);
        router.get('/marketplace', {
            search: searchQuery || undefined,
            category: categoryId !== 'all' ? categoryId : undefined,
            price_type: filterPriceType !== 'all' ? filterPriceType : undefined,
            sort: sortBy,
        }, { preserveState: true });
    };

    const handleFilterChange = (type, value) => {
        if (type === 'price') setFilterPriceType(value);
        if (type === 'sort') setSortBy(value);
        router.get('/marketplace', {
            search: searchQuery || undefined,
            category: filterCategory !== 'all' ? filterCategory : undefined,
            price_type: type === 'price' ? (value !== 'all' ? value : undefined) : (filterPriceType !== 'all' ? filterPriceType : undefined),
            sort: type === 'sort' ? value : sortBy,
        }, { preserveState: true });
    };

    // Card gradients based on category/index
    const gradients = [
        'from-violet-600 via-purple-600 to-indigo-600',
        'from-pink-500 via-rose-500 to-red-500',
        'from-cyan-500 via-blue-500 to-indigo-500',
        'from-emerald-500 via-teal-500 to-cyan-500',
        'from-orange-500 via-amber-500 to-yellow-500',
        'from-fuchsia-500 via-pink-500 to-rose-500',
    ];

    return (
        <AppLayout title={t('marketplace.title', 'Chợ Chia Sẻ')}>
            <Head title={t('marketplace.title', 'Chợ Chia Sẻ')} />

            <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                {/* Hero Section with Gradient */}
                <div className="relative overflow-hidden">
                    <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-violet-900/30 via-purple-900/20 to-transparent' : 'bg-gradient-to-br from-violet-100 via-purple-50 to-white'}`} />
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-violet-500/20 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

                    <div className="relative max-w-7xl mx-auto px-6 pt-8 pb-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className={`text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {t('marketplace.title', 'Chợ Chia Sẻ')}
                                </h1>
                                <p className={`mt-2 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Khám phá {stats?.total_listings || 0}+ campaigns từ cộng đồng
                                </p>
                            </div>
                            <Link
                                href="/marketplace/my-listings"
                                className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Đăng bán
                            </Link>
                        </div>

                        {/* Search Bar - Large & Prominent */}
                        <form onSubmit={handleSearch} className="relative max-w-2xl mb-8">
                            <div className={`relative flex items-center rounded-2xl overflow-hidden ${isDark ? 'bg-white/10 backdrop-blur-xl border border-white/10' : 'bg-white shadow-xl shadow-gray-200/50 border border-gray-100'}`}>
                                <svg className={`absolute left-5 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm campaigns, TikTok automation, e-commerce..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-full pl-14 pr-32 py-4 text-base bg-transparent ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'} focus:outline-none`}
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-lg transition-all"
                                >
                                    Tìm kiếm
                                </button>
                            </div>
                        </form>

                        {/* Category Tabs - Horizontal Scroll */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryClick(cat.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filterCategory === cat.id
                                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                                        : isDark
                                            ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                                            : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 shadow-sm'
                                        }`}
                                >
                                    <span className="text-base">{cat.icon}</span>
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Filter Bar */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{listings?.total || 0}</span> kết quả
                            </span>

                            {/* Price Filter Pills */}
                            <div className={`flex rounded-xl overflow-hidden ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-100'}`}>
                                {[
                                    { value: 'all', label: 'Tất cả' },
                                    { value: 'free', label: '🆓 Miễn phí' },
                                    { value: 'paid', label: '💰 Trả phí' },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleFilterChange('price', option.value)}
                                        className={`px-4 py-2 text-xs font-medium transition-all ${filterPriceType === option.value
                                            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                                            : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => handleFilterChange('sort', e.target.value)}
                            className={`px-4 py-2 rounded-xl text-sm ${isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-white border-gray-200 text-gray-700'} border focus:outline-none`}
                        >
                            <option value="popular">🔥 Phổ biến</option>
                            <option value="newest">✨ Mới nhất</option>
                            <option value="rating">⭐ Đánh giá cao</option>
                            <option value="price_low">💵 Giá thấp → cao</option>
                            <option value="price_high">💎 Giá cao → thấp</option>
                        </select>
                    </div>

                    {/* Listings Grid */}
                    {listings?.data?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {listings.data.map((listing, index) => (
                                <Link
                                    key={listing.id}
                                    href={`/marketplace/${listing.id}`}
                                    className={`group relative overflow-hidden rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white shadow-lg hover:shadow-xl'}`}
                                >
                                    {/* Card Header with Gradient */}
                                    <div className={`relative h-40 bg-gradient-to-br ${gradients[index % gradients.length]} p-5`}>
                                        {/* Decorative circles */}
                                        <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
                                        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-black/10 blur-2xl -translate-x-1/2 translate-y-1/2" />

                                        {/* Price Badge */}
                                        <div className="absolute top-4 right-4">
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md ${listing.price_type === 'free'
                                                ? 'bg-emerald-500/90 text-white'
                                                : 'bg-white/90 text-gray-900'
                                                }`}>
                                                {listing.price_type === 'free' ? 'MIỄN PHÍ' : `${formatVND(listing.price)} đ`}
                                            </span>
                                        </div>

                                        {/* Stats Row */}
                                        <div className="absolute bottom-4 left-4 flex items-center gap-3">
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-black/20 text-white backdrop-blur-sm">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                {listing.downloads_count}
                                            </span>
                                            {listing.rating > 0 && (
                                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-black/20 text-white backdrop-blur-sm">
                                                    ⭐ {listing.rating.toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-5">
                                        <h3 className={`font-semibold text-base truncate group-hover:text-violet-500 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {listing.title}
                                        </h3>
                                        <p className={`text-sm mt-2 line-clamp-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                            {listing.description || 'Workflow automation'}
                                        </p>

                                        {/* Tags */}
                                        {listing.tags?.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-4">
                                                {listing.tags.slice(0, 2).map((tag, i) => (
                                                    <span
                                                        key={i}
                                                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${isDark ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600'}`}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Author */}
                                        <div className={`flex items-center gap-2 mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                                            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center`}>
                                                <span className="text-xs font-bold text-white">{listing.user?.name?.charAt(0)}</span>
                                            </div>
                                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{listing.user?.name}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className={`text-center py-20 rounded-3xl ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Không tìm thấy kết quả
                            </h3>
                            <p className={`text-sm mb-8 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                Thử từ khóa khác hoặc xóa bộ lọc
                            </p>
                            <button
                                onClick={() => router.get('/marketplace')}
                                className="px-8 py-3 text-sm font-semibold rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white"
                            >
                                Xem tất cả
                            </button>
                        </div>
                    )}

                    {/* Pagination */}
                    {listings?.last_page > 1 && (
                        <div className="mt-10 flex items-center justify-center gap-3">
                            {listings?.prev_page_url && (
                                <Link href={listings.prev_page_url} className={`px-5 py-2.5 text-sm font-medium rounded-xl ${isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                    ← Trước
                                </Link>
                            )}
                            <span className={`px-4 py-2 text-sm font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Trang {listings?.current_page} / {listings?.last_page}
                            </span>
                            {listings?.next_page_url && (
                                <Link href={listings.next_page_url} className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                                    Tiếp →
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
