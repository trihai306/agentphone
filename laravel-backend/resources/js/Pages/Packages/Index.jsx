import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Index({ packages = [], myPackages = [], stats = {} }) {
    const { t } = useTranslation();
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

    const packageColors = [
        { from: 'from-indigo-500', to: 'to-blue-600', shadow: 'shadow-indigo-500/25' },
        { from: 'from-violet-500', to: 'to-purple-600', shadow: 'shadow-violet-500/25' },
        { from: 'from-emerald-500', to: 'to-teal-500', shadow: 'shadow-emerald-500/25' },
        { from: 'from-amber-500', to: 'to-orange-500', shadow: 'shadow-amber-500/25' },
        { from: 'from-pink-500', to: 'to-rose-500', shadow: 'shadow-pink-500/25' },
    ];

    const getColor = (index) => packageColors[index % packageColors.length];

    return (
        <AppLayout title={t('packages.title')}>
            <div className={`min-h-screen ${isDark ? 'bg-[#09090b]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
                {/* Background decoration */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-indigo-900/20' : 'bg-indigo-200/50'}`} />
                    <div className={`absolute bottom-0 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-violet-900/20' : 'bg-violet-200/40'}`} />
                </div>

                <div className="relative max-w-[1400px] mx-auto px-6 py-8">
                    {/* Hero Header */}
                    <div className="flex items-start justify-between mb-10">
                        <div>
                            <div className="flex items-center gap-4">
                                <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {t('packages.title')}
                                    </h1>
                                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {t('packages.manage_description')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Link
                            href="/pricing"
                            className="group relative flex items-center gap-2.5 px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all duration-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                            {t('packages.view_all_plans')}
                        </Link>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-5 mb-8">
                        {[
                            { label: t('packages.active_packages'), value: stats?.activePackages || 0, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20' },
                            { label: t('packages.credits_remaining'), value: stats?.remainingCredits || 0, icon: 'M13 10V3L4 14h7v7l9-11h-7z', gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
                            { label: t('packages.device_slots'), value: `${stats?.usedDevices || 0}/${stats?.maxDevices || 0}`, icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z', gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20' },
                            { label: t('packages.days_remaining'), value: stats?.daysRemaining || 0, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', gradient: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className={`relative overflow-hidden p-5 rounded-2xl backdrop-blur-xl border transition-all hover:scale-[1.02] ${isDark
                                    ? 'bg-white/5 border-white/10 hover:border-white/20'
                                    : 'bg-white/80 border-gray-200/50 hover:border-gray-300 shadow-lg shadow-gray-200/50'
                                    }`}
                            >
                                <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl bg-gradient-to-br ${stat.gradient} opacity-20`} />
                                <div className="relative flex items-center justify-between">
                                    <div>
                                        <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {stat.label}
                                        </p>
                                        <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {stat.value}
                                        </p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${stat.gradient} ${stat.shadow} shadow-lg`}>
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* My Packages */}
                    {myPackages && myPackages.length > 0 && (
                        <div className="mb-10">
                            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('packages.my_active_packages')}
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {myPackages.map((userPkg, index) => {
                                    const pkg = userPkg.service_package;
                                    const isExpired = userPkg.status === 'expired';
                                    const isExpiringSoon = userPkg.days_remaining <= 7 && userPkg.days_remaining > 0;
                                    const color = getColor(index);

                                    return (
                                        <div
                                            key={userPkg.id}
                                            className={`relative overflow-hidden rounded-2xl backdrop-blur-xl border transition-all ${isDark
                                                ? 'bg-white/5 border-white/10 hover:border-white/20'
                                                : 'bg-white/80 border-gray-200/50 hover:border-gray-300 shadow-lg shadow-gray-200/30'
                                                }`}
                                        >
                                            {/* Gradient top bar */}
                                            <div className={`h-1.5 bg-gradient-to-r ${color.from} ${color.to}`} />

                                            <div className="p-6">
                                                <div className="flex items-start justify-between mb-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${color.from} ${color.to} ${color.shadow} shadow-lg`}>
                                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                {pkg?.name || 'Package'}
                                                            </h3>
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold mt-1 ${isExpired
                                                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                                }`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                                                                {isExpired ? t('packages.expired') : t('packages.active')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {formatCurrency(userPkg.price_paid)}
                                                    </p>
                                                </div>

                                                <div className="space-y-4">
                                                    {userPkg.expires_at && (
                                                        <div>
                                                            <div className="flex justify-between text-sm mb-2">
                                                                <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>{t('packages.time_remaining')}</span>
                                                                <span className={`font-medium ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-amber-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                    {isExpired ? 'Expired' : `${userPkg.days_remaining || 0} days left`}
                                                                </span>
                                                            </div>
                                                            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                                                                <div
                                                                    className={`h-full rounded-full transition-all bg-gradient-to-r ${isExpired ? 'from-red-500 to-rose-500' : isExpiringSoon ? 'from-amber-500 to-orange-500' : `${color.from} ${color.to}`
                                                                        }`}
                                                                    style={{ width: `${Math.max(0, Math.min(100, (userPkg.days_remaining / (pkg?.duration_days || 30)) * 100))}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {pkg?.max_devices && (
                                                        <div className="flex justify-between text-sm">
                                                            <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Device slots used</span>
                                                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                {userPkg.used_devices || 0} / {pkg.max_devices === -1 ? '∞' : pkg.max_devices}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex gap-3 mt-6">
                                                    {!isExpired && (
                                                        <Link
                                                            href={`/my-packages/${userPkg.id}/manage`}
                                                            className={`flex-1 py-2.5 text-sm font-medium text-center rounded-xl transition-all ${isDark ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                                                }`}
                                                        >
                                                            {t('packages.manage')}
                                                        </Link>
                                                    )}
                                                    {(isExpired || isExpiringSoon) && (
                                                        <Link
                                                            href={`/packages/${pkg?.id}/subscribe`}
                                                            className={`flex-1 py-2.5 text-sm font-semibold text-center rounded-xl bg-gradient-to-r ${color.from} ${color.to} text-white ${color.shadow} shadow-lg hover:scale-[1.02] transition-all`}
                                                        >
                                                            {isExpired ? t('packages.renew_now') : t('packages.renew_early')}
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Filter Toolbar */}
                    <div className={`flex items-center gap-4 p-4 rounded-2xl backdrop-blur-xl border mb-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg shadow-gray-200/30'
                        }`}>
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('common.filter')}:</span>
                        <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                            {[
                                { key: 'all', label: t('common.all') },
                                { key: 'subscription', label: t('packages.type.subscription') },
                                { key: 'one_time', label: t('packages.type.one_time') },
                                { key: 'credits', label: t('packages.type.credits') },
                            ].map((type) => (
                                <button
                                    key={type.key}
                                    onClick={() => setSelectedType(type.key)}
                                    className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${selectedType === type.key
                                        ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25'
                                        : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-white'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Available Packages */}
                    <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {t('packages.available_packages')}
                    </h2>
                    {filteredPackages.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredPackages.map((pkg, index) => {
                                const color = getColor(index);
                                return (
                                    <div
                                        key={pkg.id}
                                        className={`group relative overflow-hidden rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:scale-[1.02] ${pkg.is_featured
                                            ? 'bg-gradient-to-br from-indigo-500 to-blue-600 border-transparent shadow-xl shadow-indigo-500/30'
                                            : isDark
                                                ? 'bg-white/5 border-white/10 hover:border-white/20'
                                                : 'bg-white/80 border-gray-200/50 hover:border-gray-300 shadow-lg shadow-gray-200/30'
                                            }`}
                                    >
                                        {pkg.badge && (
                                            <div className="absolute top-4 right-4">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${pkg.is_featured
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg shadow-amber-500/25'
                                                    }`}>
                                                    {pkg.badge}
                                                </span>
                                            </div>
                                        )}

                                        <div className="p-6">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${pkg.is_featured
                                                ? 'bg-white/20'
                                                : `bg-gradient-to-br ${color.from} ${color.to} ${color.shadow} shadow-lg`
                                                }`}>
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                            </div>

                                            <h3 className={`text-xl font-bold ${pkg.is_featured ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {pkg.name}
                                            </h3>

                                            <p className={`text-sm mt-2 mb-5 line-clamp-2 ${pkg.is_featured ? 'text-white/70' : isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                                {pkg.description}
                                            </p>

                                            <div className="flex items-baseline gap-2 mb-5">
                                                <span className={`text-3xl font-bold ${pkg.is_featured ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {formatCurrency(pkg.price)}
                                                </span>
                                                <span className={`text-sm ${pkg.is_featured ? 'text-white/60' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {pkg.type === 'subscription' ? '/month' : pkg.type === 'credits' ? 'credits' : 'lifetime'}
                                                </span>
                                            </div>

                                            {pkg.features && pkg.features.length > 0 && (
                                                <ul className="space-y-2.5 mb-6">
                                                    {pkg.features.slice(0, 4).map((feature, idx) => (
                                                        <li key={idx} className={`flex items-center gap-2.5 text-sm ${pkg.is_featured ? 'text-white/90' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${pkg.is_featured ? 'bg-white/20' : 'bg-emerald-500/10'}`}>
                                                                <svg className={`w-3 h-3 ${pkg.is_featured ? 'text-white' : 'text-emerald-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            <button
                                                onClick={() => handleSubscribe(pkg)}
                                                className={`w-full py-3 text-sm font-semibold rounded-xl transition-all ${pkg.is_featured
                                                    ? 'bg-white text-indigo-600 hover:bg-gray-100 shadow-lg'
                                                    : `bg-gradient-to-r ${color.from} ${color.to} text-white ${color.shadow} shadow-lg hover:scale-[1.02]`
                                                    }`}
                                            >
                                                {pkg.is_trial ? t('packages.start_free_trial') : pkg.price === 0 ? t('packages.get_started_free') : t('packages.subscribe_now')}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className={`relative overflow-hidden rounded-2xl p-16 text-center backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-indigo-500 to-blue-600`} />
                            <div className="relative">
                                <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/30 mb-6">
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {t('packages.no_packages')}
                                </h3>
                                <p className={`text-sm mb-8 max-w-md mx-auto ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {t('packages.no_packages_desc')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout >
    );
}
