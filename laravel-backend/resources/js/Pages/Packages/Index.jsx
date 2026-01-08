import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function Index({ packages = [], myPackages = [], stats = {} }) {
    const { auth } = usePage().props;
    const [selectedType, setSelectedType] = useState('all');
    const [showMyPackages, setShowMyPackages] = useState(true);

    const packageTypes = [
        { key: 'all', label: 'Tất cả gói', icon: 'grid' },
        { key: 'subscription', label: 'Thuê bao', icon: 'refresh' },
        { key: 'one_time', label: 'Mua một lần', icon: 'shopping-bag' },
        { key: 'credits', label: 'Gói Credits', icon: 'zap' },
    ];

    const filteredPackages = packages?.filter(pkg =>
        selectedType === 'all' || pkg.type === selectedType
    ) || [];

    const handleSubscribe = (pkg) => {
        router.visit(`/packages/${pkg.id}/subscribe`);
    };

    return (
        <AppLayout title="Gói Dịch Vụ">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                            Gói Dịch Vụ
                        </h1>
                        <p className="text-base text-gray-600 dark:text-gray-400">
                            Quản lý và nâng cấp gói dịch vụ của bạn
                        </p>
                    </div>
                    <Link
                        href="/pricing"
                        className="hidden sm:flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-xl transition-all duration-300"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Xem tất cả gói</span>
                    </Link>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Gói đang sử dụng"
                    value={stats?.activePackages || 0}
                    icon="package"
                    gradient="from-purple-500 to-indigo-600"
                />
                <StatCard
                    title="Credits còn lại"
                    value={stats?.remainingCredits || 0}
                    icon="zap"
                    gradient="from-amber-500 to-orange-600"
                />
                <StatCard
                    title="Thiết bị đang dùng"
                    value={`${stats?.usedDevices || 0}/${stats?.maxDevices || 0}`}
                    icon="device"
                    gradient="from-blue-500 to-cyan-600"
                />
                <StatCard
                    title="Ngày còn lại"
                    value={stats?.daysRemaining || 0}
                    icon="calendar"
                    gradient="from-green-500 to-emerald-600"
                />
            </div>

            {/* My Active Packages */}
            {myPackages && myPackages.length > 0 && (
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Gói của tôi
                        </h2>
                        <button
                            onClick={() => setShowMyPackages(!showMyPackages)}
                            className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                        >
                            {showMyPackages ? 'Ẩn' : 'Hiện'}
                        </button>
                    </div>

                    {showMyPackages && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {myPackages.map((userPkg) => (
                                <MyPackageCard key={userPkg.id} userPackage={userPkg} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Available Packages */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Gói có sẵn
                    </h2>

                    {/* Filter Tabs */}
                    <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                        {packageTypes.map((type) => (
                            <button
                                key={type.key}
                                onClick={() => setSelectedType(type.key)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                                    selectedType === type.key
                                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                <TypeIcon type={type.icon} />
                                <span>{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {filteredPackages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredPackages.map((pkg, index) => (
                            <PackageCard
                                key={pkg.id}
                                package={pkg}
                                onSubscribe={() => handleSubscribe(pkg)}
                                index={index}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-3xl">
                        <div className="w-20 h-20 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Không tìm thấy gói nào
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Thử chọn loại gói khác hoặc quay lại sau.
                        </p>
                    </div>
                )}
            </div>

            {/* Help Section */}
            <div className="mt-12 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-3xl p-8 border border-purple-200 dark:border-purple-800">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Cần hỗ trợ chọn gói?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Liên hệ đội ngũ tư vấn để được hỗ trợ chọn gói phù hợp nhất.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/contact"
                        className="px-6 py-3 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                    >
                        Liên hệ ngay
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}

function StatCard({ title, value, icon, gradient }) {
    const icons = {
        package: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
        zap: "M13 10V3L4 14h7v7l9-11h-7z",
        device: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
        calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
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
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
            </div>
        </div>
    );
}

function MyPackageCard({ userPackage }) {
    const pkg = userPackage.service_package;
    const isExpiringSoon = userPackage.days_remaining <= 7 && userPackage.days_remaining > 0;
    const isExpired = userPackage.status === 'expired';

    const statusConfig = {
        active: { label: 'Đang hoạt động', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
        expired: { label: 'Đã hết hạn', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
        cancelled: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
        pending: { label: 'Chờ thanh toán', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    };

    const status = statusConfig[userPackage.status] || statusConfig.active;

    return (
        <div className={`relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl border-2 ${
            isExpired ? 'border-red-200 dark:border-red-800' :
            isExpiringSoon ? 'border-amber-200 dark:border-amber-800' :
            'border-green-200 dark:border-green-800'
        } overflow-hidden`}>
            {/* Header */}
            <div className={`px-6 py-4 ${
                isExpired ? 'bg-red-50 dark:bg-red-900/20' :
                isExpiringSoon ? 'bg-amber-50 dark:bg-amber-900/20' :
                'bg-green-50 dark:bg-green-900/20'
            }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isExpired ? 'bg-red-500' :
                            isExpiringSoon ? 'bg-amber-500' :
                            'bg-green-500'
                        }`}>
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {pkg?.name || 'Gói dịch vụ'}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.color}`}>
                                {status.label}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(userPackage.price_paid)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {pkg?.type === 'subscription' ? '/tháng' : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Progress / Usage */}
                <div className="space-y-4 mb-6">
                    {/* Time Remaining */}
                    {userPackage.expires_at && (
                        <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-600 dark:text-gray-400">Thời hạn còn lại</span>
                                <span className={`font-semibold ${
                                    isExpired ? 'text-red-600 dark:text-red-400' :
                                    isExpiringSoon ? 'text-amber-600 dark:text-amber-400' :
                                    'text-green-600 dark:text-green-400'
                                }`}>
                                    {isExpired ? 'Đã hết hạn' : `${userPackage.days_remaining || 0} ngày`}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                        isExpired ? 'bg-red-500' :
                                        isExpiringSoon ? 'bg-amber-500' :
                                        'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.max(0, Math.min(100, (userPackage.days_remaining / (pkg?.duration_days || 30)) * 100))}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Device Usage */}
                    {pkg?.max_devices && (
                        <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-600 dark:text-gray-400">Thiết bị đã dùng</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {userPackage.used_devices || 0}/{pkg.max_devices === -1 ? '∞' : pkg.max_devices}
                                </span>
                            </div>
                            {pkg.max_devices !== -1 && (
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                                        style={{ width: `${Math.min(100, ((userPackage.used_devices || 0) / pkg.max_devices) * 100)}%` }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Credits */}
                    {userPackage.remaining_credits !== null && (
                        <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-600 dark:text-gray-400">Credits còn lại</span>
                                <span className="font-semibold text-purple-600 dark:text-purple-400">
                                    {userPackage.remaining_credits?.toLocaleString() || 0}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    {!isExpired && (
                        <Link
                            href={`/my-packages/${userPackage.id}/manage`}
                            className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Quản lý
                        </Link>
                    )}
                    {(isExpired || isExpiringSoon) && (
                        <Link
                            href={`/packages/${pkg?.id}/subscribe`}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl text-center shadow-lg hover:shadow-xl transition-all"
                        >
                            {isExpired ? 'Gia hạn ngay' : 'Gia hạn sớm'}
                        </Link>
                    )}
                </div>
            </div>

            {/* Warning Banner */}
            {isExpiringSoon && !isExpired && (
                <div className="px-6 py-3 bg-amber-100 dark:bg-amber-900/30 border-t border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-sm font-medium">
                            Gói sắp hết hạn! Gia hạn ngay để tiếp tục sử dụng.
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

function PackageCard({ package: pkg, onSubscribe, index }) {
    const [showAllFeatures, setShowAllFeatures] = useState(false);
    const typeLabels = {
        subscription: { label: 'Thuê bao', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: 'refresh' },
        one_time: { label: 'Một lần', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: 'shopping-bag' },
        credits: { label: 'Credits', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: 'zap' },
    };

    const typeInfo = typeLabels[pkg.type] || typeLabels.subscription;

    return (
        <div
            className={`group relative flex flex-col bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ${
                pkg.is_featured ? 'ring-2 ring-purple-500' : ''
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            {/* Badge */}
            {pkg.badge && (
                <div className="absolute -top-0 -right-0">
                    <div
                        className="px-4 py-1.5 text-xs font-bold text-white rounded-bl-2xl"
                        style={{ backgroundColor: pkg.badge_color || '#8B5CF6' }}
                    >
                        {pkg.badge}
                    </div>
                </div>
            )}

            <div className="flex-1 p-6">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        pkg.is_featured
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                            : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600'
                    }`}>
                        <TypeIcon type={typeInfo.icon} className={pkg.is_featured ? 'text-white' : 'text-gray-600 dark:text-gray-300'} />
                    </div>
                    <div className="flex-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${typeInfo.color}`}>
                            {typeInfo.label}
                        </span>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                            {pkg.name}
                        </h3>
                    </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {pkg.description}
                </p>

                {/* Price */}
                <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                        {pkg.original_price && pkg.original_price > pkg.price && (
                            <span className="text-sm text-gray-400 line-through">
                                {formatCurrency(pkg.original_price)}
                            </span>
                        )}
                        <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                            {formatCurrency(pkg.price)}
                        </span>
                        {pkg.discount_percent && (
                            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-full">
                                -{pkg.discount_percent}%
                            </span>
                        )}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {pkg.type === 'subscription'
                            ? '/tháng'
                            : pkg.type === 'credits'
                                ? `cho ${pkg.credits?.toLocaleString()} credits`
                                : 'trọn đời'
                        }
                    </span>
                </div>

                {/* Key Info */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {pkg.max_devices && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="text-gray-700 dark:text-gray-300">
                                {pkg.max_devices === -1 ? '∞' : pkg.max_devices} thiết bị
                            </span>
                        </div>
                    )}
                    {pkg.is_trial && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-sm">
                            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-amber-700 dark:text-amber-400">
                                {pkg.trial_days} ngày dùng thử
                            </span>
                        </div>
                    )}
                </div>

                {/* Features */}
                {pkg.features && pkg.features.length > 0 && (
                    <div className="space-y-2">
                        <ul className="space-y-2">
                            {(showAllFeatures ? pkg.features : pkg.features.slice(0, 3)).map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                    <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        {pkg.features.length > 3 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAllFeatures(!showAllFeatures);
                                }}
                                className="flex items-center gap-1.5 ml-6 text-sm text-purple-600 dark:text-purple-400 font-medium hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
                            >
                                <span>{showAllFeatures ? 'Ẩn bớt' : `+${pkg.features.length - 3} tính năng khác`}</span>
                                <svg
                                    className={`w-4 h-4 transition-transform duration-300 ${showAllFeatures ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* CTA */}
            <div className="p-6 pt-0">
                <button
                    onClick={onSubscribe}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-center transition-all duration-300 ${
                        pkg.is_featured
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl'
                            : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                    }`}
                >
                    {pkg.is_trial ? 'Bắt đầu dùng thử' : pkg.price === 0 ? 'Đăng ký miễn phí' : 'Chọn gói này'}
                </button>
            </div>
        </div>
    );
}

function TypeIcon({ type, className = '' }) {
    const icons = {
        grid: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
        refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
        'shopping-bag': "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
        zap: "M13 10V3L4 14h7v7l9-11h-7z",
    };

    return (
        <svg className={`w-6 h-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[type] || icons.grid} />
        </svg>
    );
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount || 0);
}
