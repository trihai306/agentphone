import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function Index({ creditPackages = [], recentTopups = [], currentBalance = 0, paymentMethods = [], walletBalance = 0 }) {
    const [selectedPackage, setSelectedPackage] = useState(null);

    const handleSelectPackage = (pkg) => {
        setSelectedPackage(pkg);
        router.post('/topup/checkout', {
            package_id: pkg.id,
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusConfig = (status) => {
        const configs = {
            completed: { label: 'Thành công', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
            pending: { label: 'Đang xử lý', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
            failed: { label: 'Thất bại', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
        };
        return configs[status] || configs.pending;
    };

    const iconComponents = {
        zap: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
        star: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
        ),
        fire: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
        ),
        briefcase: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        crown: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l3.057 4.073 4.943-4.073 4.943 4.073L21 3v16a2 2 0 01-2 2H5a2 2 0 01-2-2V3z" />
            </svg>
        ),
        diamond: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3L2 9l10 6 10-6-10-6zM2 17l10 6 10-6M2 12l10 6 10-6" />
            </svg>
        ),
    };

    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-emerald-600',
        purple: 'from-purple-500 to-pink-600',
        amber: 'from-amber-500 to-orange-600',
        rose: 'from-rose-500 to-red-600',
        indigo: 'from-indigo-500 to-purple-600',
    };

    return (
        <AppLayout title="Nạp tiền">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                            Nạp tiền vào ví
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Chọn gói nạp tiền để sử dụng dịch vụ
                        </p>
                    </div>
                    <Link
                        href="/topup/history"
                        className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Lịch sử nạp tiền</span>
                    </Link>
                </div>
            </div>

            {/* Current Balance Card */}
            <div className="mb-8">
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-8 text-white">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <p className="text-emerald-200 text-sm font-medium mb-1">Số dư ví hiện tại</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-extrabold">{formatCurrency(walletBalance || currentBalance)}</span>
                            </div>
                            <p className="text-emerald-200 mt-2">
                                Nạp thêm tiền để tiếp tục sử dụng dịch vụ
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Topup Packages Grid */}
            <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Chọn gói nạp tiền
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {creditPackages.map((pkg, index) => (
                        <div
                            key={pkg.id}
                            className={`group relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer ${
                                pkg.popular
                                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                            }`}
                            onClick={() => handleSelectPackage(pkg)}
                        >
                            {/* Popular Badge */}
                            {pkg.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                                    <span className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold rounded-full shadow-lg">
                                        Phổ biến nhất
                                    </span>
                                </div>
                            )}

                            {/* Bonus Badge */}
                            {pkg.bonus_percent > 0 && (
                                <div className="absolute top-4 right-4">
                                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">
                                        +{pkg.bonus_percent}% Bonus
                                    </span>
                                </div>
                            )}

                            <div className="p-6">
                                {/* Icon & Name */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClasses[pkg.color] || colorClasses.purple} flex items-center justify-center text-white shadow-lg`}>
                                        {iconComponents[pkg.icon] || iconComponents.zap}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                            {pkg.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Nạp vào ví
                                        </p>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="mb-4">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                            {formatCurrency(pkg.price)}
                                        </span>
                                    </div>
                                    {pkg.bonus > 0 && (
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                            </svg>
                                            <span className="text-green-600 dark:text-green-400 font-semibold">
                                                +{formatCurrency(pkg.bonus)} bonus
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Total Received */}
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Nhận vào ví</p>
                                            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(pkg.price + (pkg.bonus || 0))}
                                            </span>
                                        </div>
                                        <button className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                                            pkg.popular
                                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:shadow-xl'
                                                : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                                        }`}>
                                            Nạp ngay
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Topups */}
            {recentTopups.length > 0 && (
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Nạp tiền gần đây
                        </h2>
                        <Link
                            href="/topup/history"
                            className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                        >
                            Xem tất cả
                        </Link>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {recentTopups.map((topup) => {
                                const status = getStatusConfig(topup.payment_status);
                                return (
                                    <div key={topup.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                                                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {topup.package_name}
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
                                        <div className="text-right">
                                            <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                                +{formatCurrency(topup.amount || topup.price)}
                                            </p>
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Benefits Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                    Tại sao nên nạp tiền?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            Tiết kiệm hơn
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Nạp càng nhiều, nhận bonus càng cao. Tiết kiệm đến 20%!
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            An toàn bảo mật
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Số dư ví được bảo mật tuyệt đối, an toàn 100%
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            Bonus hấp dẫn
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Nhận thêm tiền bonus khi nạp các gói lớn
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
