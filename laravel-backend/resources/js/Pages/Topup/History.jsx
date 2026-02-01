import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function History({ topups = { data: [] }, stats = {} }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [filter, setFilter] = useState('all');

    const formatVND = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

    const getStatusConfig = (status) => {
        const configs = {
            completed: {
                label: t('topup.completed', 'Hoàn thành'),
                bg: 'bg-emerald-500/20',
                text: 'text-emerald-400',
                border: 'border-emerald-500/30'
            },
            pending: {
                label: t('topup.pending', 'Đang xử lý'),
                bg: 'bg-amber-500/20',
                text: 'text-amber-400',
                border: 'border-amber-500/30'
            },
            failed: {
                label: t('topup.failed', 'Thất bại'),
                bg: 'bg-red-500/20',
                text: 'text-red-400',
                border: 'border-red-500/30'
            },
            cancelled: {
                label: t('topup.cancelled', 'Đã hủy'),
                bg: 'bg-gray-500/20',
                text: 'text-gray-400',
                border: 'border-gray-500/30'
            },
        };
        return configs[status] || configs.pending;
    };

    const filteredTopups = filter === 'all'
        ? topups.data
        : topups.data.filter(t => t.payment_status === filter);

    const statsData = [
        {
            label: t('topup.current_balance', 'Số dư hiện tại'),
            value: stats.current_balance || 0,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
            gradient: 'from-violet-500 to-purple-600'
        },
        {
            label: t('topup.total_deposited', 'Tổng nạp'),
            value: stats.total_amount || 0,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            gradient: 'from-emerald-500 to-teal-600'
        },
        {
            label: t('topup.pending', 'Đang xử lý'),
            value: stats.pending_amount || 0,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            gradient: 'from-amber-500 to-orange-600'
        },
        {
            label: t('topup.transactions', 'Giao dịch'),
            value: stats.total_topups || 0,
            isCount: true,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
            gradient: 'from-blue-500 to-indigo-600'
        },
    ];

    const filterTabs = [
        { id: 'all', label: t('common.all', 'Tất cả') },
        { id: 'completed', label: t('topup.completed', 'Hoàn thành') },
        { id: 'pending', label: t('topup.pending', 'Đang xử lý') },
        { id: 'failed', label: t('topup.failed', 'Thất bại') },
    ];

    return (
        <AppLayout title={t('topup.history_title', 'Lịch sử giao dịch')}>
            <Head title={t('topup.history_title', 'Lịch sử giao dịch')} />

            <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                {/* Hero Section */}
                <div className="relative overflow-hidden">
                    <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-violet-900/30 via-purple-900/20 to-transparent' : 'bg-gradient-to-br from-violet-100 via-purple-50 to-white'}`} />
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-violet-500/20 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

                    <div className="relative max-w-5xl mx-auto px-6 pt-8 pb-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {t('topup.history_title', 'Lịch sử giao dịch')}
                                </h1>
                                <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('topup.history_description', 'Các giao dịch nạp tiền của bạn')}
                                </p>
                            </div>
                            <Link
                                href="/topup"
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-violet-500/30 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                {t('topup.title', 'Nạp Tiền')}
                            </Link>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {statsData.map((stat, index) => (
                                <div
                                    key={index}
                                    className={`relative overflow-hidden rounded-2xl p-5 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white shadow-lg border border-gray-100'}`}
                                >
                                    <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2`} />
                                    <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${stat.gradient} mb-3`}>
                                        <span className="text-white">{stat.icon}</span>
                                    </div>
                                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {stat.isCount ? stat.value : `${formatVND(stat.value)} đ`}
                                    </p>
                                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-5xl mx-auto px-6 py-8">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 mb-6">
                        {filterTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setFilter(tab.id)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === tab.id
                                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                                    : isDark
                                        ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Transactions List */}
                    {filteredTopups.length > 0 ? (
                        <div className="space-y-3">
                            {filteredTopups.map((topup) => {
                                const statusConfig = getStatusConfig(topup.payment_status);
                                return (
                                    <div
                                        key={topup.id}
                                        className={`group relative overflow-hidden rounded-2xl p-5 transition-all hover:scale-[1.01] ${isDark
                                            ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                                            : 'bg-white hover:shadow-lg border border-gray-100 shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                {/* Icon */}
                                                <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                                                    <svg className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                {/* Info */}
                                                <div>
                                                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {topup.package_name || t('topup.deposit', 'Nạp tiền')}
                                                    </p>
                                                    <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {topup.order_code} • {new Date(topup.created_at).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right flex items-center gap-4">
                                                {/* Amount */}
                                                <p className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                    +{formatVND(topup.price || topup.amount)} đ
                                                </p>
                                                {/* Status Badge */}
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Pagination */}
                            {topups.last_page > 1 && (
                                <div className={`flex items-center justify-between pt-4 mt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                    <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {t('common.page', 'Trang')} {topups.current_page} / {topups.last_page}
                                    </span>
                                    <div className="flex gap-2">
                                        {topups.prev_page_url && (
                                            <Link
                                                href={topups.prev_page_url}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                            >
                                                ← {t('common.previous', 'Trước')}
                                            </Link>
                                        )}
                                        {topups.next_page_url && (
                                            <Link
                                                href={topups.next_page_url}
                                                className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-purple-600 text-white"
                                            >
                                                {t('common.next', 'Sau')} →
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className={`text-center py-16 rounded-3xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'}`}>
                            <div className={`inline-flex p-4 rounded-2xl mb-4 ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
                                <svg className={`w-8 h-8 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('topup.no_transactions', 'Chưa có giao dịch')}
                            </h3>
                            <p className={`mb-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {filter === 'all'
                                    ? t('topup.no_topups_yet', 'Bạn chưa thực hiện giao dịch nạp tiền nào')
                                    : t('topup.no_matching', 'Không có giao dịch phù hợp')
                                }
                            </p>
                            <Link
                                href="/topup"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-violet-500/30 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                {t('topup.topup_now', 'Nạp tiền ngay')}
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
