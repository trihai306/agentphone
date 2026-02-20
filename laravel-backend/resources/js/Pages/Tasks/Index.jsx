import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { Button } from '@/Components/UI';

export default function Index({ tasks = { data: [] }, filters: rawFilters = {}, stats = {} }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // 1 Xu = 100 VNĐ
    const toXu = (vnd) => Math.floor((vnd || 0) / 100);

    // Defensive: PHP empty array becomes [] in JS, convert to object
    const filters = Array.isArray(rawFilters) ? {} : (rawFilters || {});

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [filterCategory, setFilterCategory] = useState(filters.category || 'all');
    const [filterPriceType, setFilterPriceType] = useState(filters.price_type || 'all');
    const [sortBy, setSortBy] = useState(filters.sort || 'newest');

    // Categories as horizontal tabs
    const categories = [
        { id: 'all', name: t('common.all', 'Tất cả') },
        { id: 'tiktok', name: 'TikTok' },
        { id: 'facebook', name: 'Facebook' },
        { id: 'instagram', name: 'Instagram' },
        { id: 'youtube', name: 'YouTube' },
        { id: 'shopee', name: 'Shopee' },
        { id: 'lazada', name: 'Lazada' },
        { id: 'telegram', name: 'Telegram' },
        { id: 'ecommerce', name: 'E-commerce' },
        { id: 'automation', name: 'Automation' },
    ];

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/tasks', {
            search: searchQuery,
            category: filterCategory !== 'all' ? filterCategory : undefined,
            price_type: filterPriceType !== 'all' ? filterPriceType : undefined,
            sort: sortBy,
        }, { preserveState: true });
    };

    const handleCategoryClick = (categoryId) => {
        setFilterCategory(categoryId);
        router.get('/tasks', {
            search: searchQuery || undefined,
            category: categoryId !== 'all' ? categoryId : undefined,
            price_type: filterPriceType !== 'all' ? filterPriceType : undefined,
            sort: sortBy,
        }, { preserveState: true });
    };

    const handleFilterChange = (type, value) => {
        if (type === 'price') setFilterPriceType(value);
        if (type === 'sort') setSortBy(value);
        router.get('/tasks', {
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

    const getTimeRemaining = (deadline) => {
        if (!deadline) return null;
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const diff = deadlineDate - now;
        if (diff <= 0) return { text: t('tasks.expired', 'Đã hết hạn'), expired: true };
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return { text: `${days} ${t('common.days', 'ngày')} ${t('tasks.remaining', 'còn lại')}`, expired: false };
        return { text: `${hours} ${t('common.hours', 'giờ')} ${t('tasks.remaining', 'còn lại')}`, expired: false };
    };

    return (
        <AppLayout title={t('tasks.title', 'Nhiệm Vụ')}>
            <Head title={t('tasks.title', 'Nhiệm Vụ')} />

            <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                {/* Hero Section with Gradient */}
                <div className="relative overflow-hidden">
                    <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-emerald-900/30 via-teal-900/20 to-transparent' : 'bg-gradient-to-br from-emerald-100 via-teal-50 to-white'}`} />
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

                    <div className="relative max-w-7xl mx-auto px-6 pt-8 pb-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className={`text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {t('tasks.title', 'Nhiệm Vụ')}
                                </h1>
                                <p className={`mt-2 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('tasks.subtitle', 'Tạo và nhận công việc từ cộng đồng')} · {stats?.total_tasks || 0}+ {t('tasks.available', 'nhiệm vụ')}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="secondary"
                                    href="/tasks/my"
                                    as="Link"
                                    icon={
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    }
                                >
                                    {t('tasks.my_tasks', 'Nhiệm vụ của tôi')}
                                </Button>
                                <Button
                                    variant="gradient"
                                    href="/tasks/create"
                                    as="Link"
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/25"
                                    icon={
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    }
                                >
                                    {t('tasks.create', 'Tạo nhiệm vụ')}
                                </Button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="relative max-w-2xl mb-8">
                            <div className={`relative flex items-center rounded-2xl overflow-hidden ${isDark ? 'bg-white/10 backdrop-blur-xl border border-white/10' : 'bg-white shadow-xl shadow-gray-200/50 border border-gray-100'}`}>
                                <svg className={`absolute left-5 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder={t('tasks.search_placeholder', 'Tìm kiếm nhiệm vụ, TikTok, automation...')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-full pl-14 pr-32 py-4 text-base bg-transparent ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'} focus:outline-none`}
                                />
                                <Button
                                    type="submit"
                                    variant="gradient"
                                    size="sm"
                                    className="absolute right-2 bg-gradient-to-r from-emerald-600 to-teal-600"
                                >
                                    {t('common.search', 'Tìm kiếm')}
                                </Button>
                            </div>
                        </form>

                        {/* Category Tabs */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryClick(cat.id)}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filterCategory === cat.id
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                                        : isDark
                                            ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                                            : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 shadow-sm'
                                        }`}
                                >
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
                                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{tasks?.total || 0}</span> {t('common.results', 'kết quả')}
                            </span>
                        </div>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => handleFilterChange('sort', e.target.value)}
                            className={`px-4 py-2 rounded-xl text-sm ${isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-white border-gray-200 text-gray-700'} border focus:outline-none`}
                        >
                            <option value="newest">✨ {t('common.newest', 'Mới nhất')}</option>
                            <option value="deadline">⏰ {t('tasks.deadline_soon', 'Sắp hết hạn')}</option>
                            <option value="reward_high">{t('tasks.reward_high', 'Thưởng cao')}</option>
                            <option value="reward_low">{t('tasks.reward_low', 'Thưởng thấp')}</option>
                        </select>
                    </div>

                    {/* Tasks Grid */}
                    {tasks?.data?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {tasks.data.map((task, index) => {
                                const timeRemaining = getTimeRemaining(task.deadline_at);
                                return (
                                    <Link
                                        key={task.id}
                                        href={`/tasks/${task.id}`}
                                        className={`group relative overflow-hidden rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white shadow-lg hover:shadow-xl'}`}
                                    >
                                        {/* Card Header with Gradient */}
                                        <div className={`relative h-36 bg-gradient-to-br ${gradients[index % gradients.length]} p-5`}>
                                            {/* Decorative circles */}
                                            <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
                                            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-black/10 blur-2xl -translate-x-1/2 translate-y-1/2" />

                                            {/* Reward Badge - In Xu */}
                                            <div className="absolute top-4 right-4">
                                                <span className="px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md bg-amber-500/90 text-white flex items-center gap-1.5">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {toXu(task.reward_amount).toLocaleString()} Xu
                                                </span>
                                            </div>

                                            {/* Icon & Time */}
                                            <div className="absolute bottom-4 left-4 flex items-center gap-3">
                                                {task.icon ? <span className="text-3xl">{task.icon}</span> : <Icon name="clipboard" className="w-8 h-8" />}
                                                {timeRemaining && (
                                                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${timeRemaining.expired ? 'bg-red-500/80 text-white' : 'bg-black/20 text-white'}`}>
                                                        ⏰ {timeRemaining.text}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-5">
                                            <h3 className={`font-semibold text-base truncate group-hover:text-emerald-500 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {task.title}
                                            </h3>
                                            <p className={`text-sm mt-2 line-clamp-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                                {task.description || t('tasks.no_description', 'Không có mô tả')}
                                            </p>

                                            {/* Progress */}
                                            <div className="mt-4">
                                                <div className="flex items-center justify-between text-xs mb-1.5">
                                                    <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                                                        {t('tasks.devices_accepted', 'Máy đã nhận')}
                                                    </span>
                                                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {task.accepted_devices}/{task.required_devices}
                                                    </span>
                                                </div>
                                                <div className={`h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                                        style={{ width: `${Math.min(100, (task.accepted_devices / task.required_devices) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Tags */}
                                            {task.tags?.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-4">
                                                    {task.tags.slice(0, 2).map((tag, i) => (
                                                        <span
                                                            key={i}
                                                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Creator */}
                                            <div className={`flex items-center gap-2 mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                                                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center`}>
                                                    <span className="text-xs font-bold text-white">{task.creator?.name?.charAt(0)}</span>
                                                </div>
                                                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{task.creator?.name}</span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className={`text-center py-20 rounded-3xl ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('tasks.no_tasks', 'Chưa có nhiệm vụ nào')}
                            </h3>
                            <p className={`text-sm mb-8 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {t('tasks.be_first', 'Hãy là người đầu tiên tạo nhiệm vụ!')}
                            </p>
                            <Button
                                variant="gradient"
                                href="/tasks/create"
                                as="Link"
                                className="bg-gradient-to-r from-emerald-600 to-teal-600"
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                }
                            >
                                {t('tasks.create_first', 'Tạo nhiệm vụ đầu tiên')}
                            </Button>
                        </div>
                    )}

                    {/* Pagination */}
                    {tasks?.last_page > 1 && (
                        <div className="mt-10 flex items-center justify-center gap-3">
                            {tasks?.prev_page_url && (
                                <Link href={tasks.prev_page_url} className={`px-5 py-2.5 text-sm font-medium rounded-xl ${isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                    ← {t('common.previous', 'Trước')}
                                </Link>
                            )}
                            <span className={`px-4 py-2 text-sm font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('common.page', 'Trang')} {tasks?.current_page} / {tasks?.last_page}
                            </span>
                            {tasks?.next_page_url && (
                                <Link href={tasks.next_page_url} className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                                    {t('common.next', 'Tiếp')} →
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
