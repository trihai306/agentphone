import { useState } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function History({ topups = { data: [] }, stats = {} }) {
    const [filter, setFilter] = useState('all');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusConfig = (status) => {
        const configs = {
            completed: {
                label: 'Thành công',
                color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ),
            },
            pending: {
                label: 'Đang xử lý',
                color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                icon: (
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                ),
            },
            failed: {
                label: 'Thất bại',
                color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ),
            },
            cancelled: {
                label: 'Đã hủy',
                color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                ),
            },
        };
        return configs[status] || configs.pending;
    };

    const getPaymentMethodName = (method) => {
        const methods = {
            bank_transfer: 'Chuyển khoản',
            momo: 'MoMo',
            vnpay: 'VNPay',
            zalopay: 'ZaloPay',
        };
        return methods[method] || method;
    };

    const filteredTopups = filter === 'all'
        ? topups.data
        : topups.data.filter(t => t.payment_status === filter);

    return (
        <AppLayout title="Lịch sử nạp tiền">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                            Lịch sử nạp tiền
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Xem lại các giao dịch nạp tiền của bạn
                        </p>
                    </div>
                    <Link
                        href="/topup"
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-2xl shadow-lg transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Nạp thêm</span>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Số dư hiện tại"
                    value={formatCurrency(stats.current_balance || 0)}
                    icon="wallet"
                    gradient="from-emerald-500 to-teal-600"
                />
                <StatCard
                    title="Tổng đã nạp"
                    value={formatCurrency(stats.total_amount || 0)}
                    icon="trending-up"
                    gradient="from-green-500 to-emerald-600"
                />
                <StatCard
                    title="Đang chờ xử lý"
                    value={formatCurrency(stats.pending_amount || 0)}
                    icon="clock"
                    gradient="from-amber-500 to-orange-600"
                />
                <StatCard
                    title="Số lần nạp"
                    value={stats.total_topups || 0}
                    suffix="lần"
                    icon="repeat"
                    gradient="from-blue-500 to-cyan-600"
                />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2">
                {[
                    { key: 'all', label: 'Tất cả' },
                    { key: 'completed', label: 'Thành công' },
                    { key: 'pending', label: 'Đang xử lý' },
                    { key: 'failed', label: 'Thất bại' },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                            filter === tab.key
                                ? 'bg-emerald-600 text-white shadow-lg'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Transactions List */}
            {filteredTopups.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredTopups.map((topup) => {
                            const status = getStatusConfig(topup.payment_status);
                            return (
                                <div key={topup.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${status.color}`}>
                                                {status.icon}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-gray-900 dark:text-white">
                                                        {topup.package_name}
                                                    </h3>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    Mã đơn: {topup.order_code} • {getPaymentMethodName(topup.payment_method)}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(topup.created_at).toLocaleDateString('vi-VN', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right sm:text-right">
                                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                                +{formatCurrency(topup.price || topup.amount)}
                                            </p>
                                            {topup.bonus > 0 && (
                                                <p className="text-sm text-green-600 dark:text-green-400">
                                                    +{formatCurrency(topup.bonus)} bonus
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {topups.last_page > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Trang {topups.current_page} / {topups.last_page}
                            </p>
                            <div className="flex items-center gap-2">
                                {topups.prev_page_url && (
                                    <Link
                                        href={topups.prev_page_url}
                                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Trước
                                    </Link>
                                )}
                                {topups.next_page_url && (
                                    <Link
                                        href={topups.next_page_url}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                    >
                                        Sau
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Chưa có giao dịch nào
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {filter === 'all'
                            ? 'Bạn chưa nạp tiền lần nào. Hãy nạp ngay để sử dụng dịch vụ!'
                            : 'Không tìm thấy giao dịch phù hợp với bộ lọc.'
                        }
                    </p>
                    <Link
                        href="/topup"
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Nạp tiền ngay</span>
                    </Link>
                </div>
            )}
        </AppLayout>
    );
}

function StatCard({ title, value, suffix = '', icon, gradient }) {
    const icons = {
        wallet: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
        'trending-up': "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
        clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
        repeat: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    };

    return (
        <div className="group relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700/50 p-6 hover:shadow-2xl transition-all duration-500 overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
            <div className="relative">
                <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
                    </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                    {title}
                </h3>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    {value} {suffix && <span className="text-base font-medium text-gray-500 dark:text-gray-400">{suffix}</span>}
                </p>
            </div>
        </div>
    );
}
