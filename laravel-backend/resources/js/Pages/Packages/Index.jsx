import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Index({ packages = [], myPackages = [], stats = {} }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [selectedType, setSelectedType] = useState('all');

    const filteredPackages = packages?.filter(pkg =>
        selectedType === 'all' || pkg.type === selectedType
    ) || [];

    const handleSubscribe = (pkg) => {
        router.visit(`/packages/${pkg.id}/subscribe`);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    return (
        <AppLayout title="Packages">
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1400px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Packages
                            </h1>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                Manage your service packages
                            </p>
                        </div>
                        <Link
                            href="/pricing"
                            className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                }`}
                        >
                            View All Plans
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Active', value: stats?.activePackages || 0 },
                            { label: 'Credits', value: stats?.remainingCredits || 0 },
                            { label: 'Devices', value: `${stats?.usedDevices || 0}/${stats?.maxDevices || 0}` },
                            { label: 'Days Left', value: stats?.daysRemaining || 0 },
                        ].map((stat, i) => (
                            <div key={i} className={`p-4 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{stat.label}</p>
                                <p className={`text-2xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* My Packages */}
                    {myPackages && myPackages.length > 0 && (
                        <div className="mb-10">
                            <h2 className={`text-sm font-medium uppercase tracking-wider mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                My Packages
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {myPackages.map((userPkg) => {
                                    const pkg = userPkg.service_package;
                                    const isExpired = userPkg.status === 'expired';
                                    const isExpiringSoon = userPkg.days_remaining <= 7 && userPkg.days_remaining > 0;

                                    return (
                                        <div
                                            key={userPkg.id}
                                            className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {pkg?.name || 'Package'}
                                                    </h3>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${isExpired
                                                            ? isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'
                                                            : isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                                                        }`}>
                                                        {isExpired ? 'Expired' : 'Active'}
                                                    </span>
                                                </div>
                                                <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {formatCurrency(userPkg.price_paid)}
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                {userPkg.expires_at && (
                                                    <div>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Time left</span>
                                                            <span className={isExpired ? 'text-red-400' : isExpiringSoon ? 'text-amber-400' : isDark ? 'text-white' : 'text-gray-900'}>
                                                                {isExpired ? 'Expired' : `${userPkg.days_remaining || 0} days`}
                                                            </span>
                                                        </div>
                                                        <div className={`h-1 rounded-full ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                                                            <div
                                                                className={`h-1 rounded-full ${isExpired ? 'bg-red-500' : isExpiringSoon ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                                style={{ width: `${Math.max(0, Math.min(100, (userPkg.days_remaining / (pkg?.duration_days || 30)) * 100))}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {pkg?.max_devices && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Devices</span>
                                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>
                                                            {userPkg.used_devices || 0}/{pkg.max_devices === -1 ? '∞' : pkg.max_devices}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-2 mt-4">
                                                {!isExpired && (
                                                    <Link
                                                        href={`/my-packages/${userPkg.id}/manage`}
                                                        className={`flex-1 py-2 text-sm font-medium text-center rounded-lg ${isDark ? 'bg-[#2a2a2a] text-white hover:bg-[#333]' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                                            }`}
                                                    >
                                                        Manage
                                                    </Link>
                                                )}
                                                {(isExpired || isExpiringSoon) && (
                                                    <Link
                                                        href={`/packages/${pkg?.id}/subscribe`}
                                                        className={`flex-1 py-2 text-sm font-medium text-center rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                                            }`}
                                                    >
                                                        {isExpired ? 'Renew' : 'Renew Early'}
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Filter */}
                    <div className="flex items-center gap-2 mb-6">
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'subscription', label: 'Subscription' },
                            { key: 'one_time', label: 'One-time' },
                            { key: 'credits', label: 'Credits' },
                        ].map((type) => (
                            <button
                                key={type.key}
                                onClick={() => setSelectedType(type.key)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${selectedType === type.key
                                        ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                                        : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>

                    {/* Available Packages */}
                    {filteredPackages.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPackages.map((pkg) => (
                                <div
                                    key={pkg.id}
                                    className={`p-5 rounded-xl transition-all ${pkg.is_featured
                                            ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                                            : isDark ? 'bg-[#1a1a1a] hover:bg-[#222]' : 'bg-white border border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {pkg.badge && (
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded mb-2 inline-block ${pkg.is_featured
                                                ? isDark ? 'bg-black/10' : 'bg-white/20'
                                                : isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600'
                                            }`}>
                                            {pkg.badge}
                                        </span>
                                    )}

                                    <h3 className={`text-lg font-semibold ${pkg.is_featured ? '' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {pkg.name}
                                    </h3>

                                    <p className={`text-sm mt-1 mb-4 ${pkg.is_featured ? (isDark ? 'text-black/60' : 'text-white/60') : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {pkg.description}
                                    </p>

                                    <div className="flex items-baseline gap-2 mb-4">
                                        <span className={`text-2xl font-semibold ${pkg.is_featured ? '' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {formatCurrency(pkg.price)}
                                        </span>
                                        <span className={`text-sm ${pkg.is_featured ? (isDark ? 'text-black/60' : 'text-white/60') : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {pkg.type === 'subscription' ? '/month' : pkg.type === 'credits' ? 'credits' : 'lifetime'}
                                        </span>
                                    </div>

                                    {pkg.features && pkg.features.length > 0 && (
                                        <ul className="space-y-2 mb-4">
                                            {pkg.features.slice(0, 4).map((feature, idx) => (
                                                <li key={idx} className={`flex items-center gap-2 text-sm ${pkg.is_featured ? (isDark ? 'text-black/80' : 'text-white/80') : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    <svg className={`w-4 h-4 ${pkg.is_featured ? (isDark ? 'text-black' : 'text-white') : 'text-emerald-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    <button
                                        onClick={() => handleSubscribe(pkg)}
                                        className={`w-full py-2.5 text-sm font-medium rounded-lg transition-colors ${pkg.is_featured
                                                ? isDark ? 'bg-black text-white hover:bg-gray-900' : 'bg-white text-gray-900 hover:bg-gray-100'
                                                : isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                            }`}
                                    >
                                        {pkg.is_trial ? 'Start Trial' : pkg.price === 0 ? 'Get Free' : 'Subscribe'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`rounded-lg p-16 text-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <div className={`w-14 h-14 mx-auto rounded-lg flex items-center justify-center mb-4 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                                <svg className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                No packages found
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Try selecting a different category
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
