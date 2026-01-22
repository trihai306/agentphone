import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function Index({ creditPackages = [], recentTopups = [], currentBalance = 0, walletBalance = 0 }) {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const isDark = theme === 'dark';
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSelectPackage = (pkg) => {
        setSelectedPackage(pkg.id);
        setProcessing(true);
        router.post('/topup/checkout', { package_id: pkg.id });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const packageColors = [
        { from: 'from-blue-500', to: 'to-cyan-500', shadow: 'shadow-blue-500/25', bg: 'bg-blue-500/10' },
        { from: 'from-emerald-500', to: 'to-teal-500', shadow: 'shadow-emerald-500/25', bg: 'bg-emerald-500/10' },
        { from: 'from-violet-500', to: 'to-purple-600', shadow: 'shadow-violet-500/25', bg: 'bg-violet-500/10' },
        { from: 'from-amber-500', to: 'to-orange-500', shadow: 'shadow-amber-500/25', bg: 'bg-amber-500/10' },
        { from: 'from-pink-500', to: 'to-rose-500', shadow: 'shadow-pink-500/25', bg: 'bg-pink-500/10' },
        { from: 'from-indigo-500', to: 'to-blue-600', shadow: 'shadow-indigo-500/25', bg: 'bg-indigo-500/10' },
    ];

    const getColor = (index) => packageColors[index % packageColors.length];

    return (
        <AppLayout title={t('topup.title')}>
            <Head title={t('topup.title')} />

            <div className={`min-h-screen ${isDark ? 'bg-[#09090b]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
                {/* Background decoration */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-200/50'}`} />
                    <div className={`absolute bottom-0 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-amber-900/20' : 'bg-amber-200/40'}`} />
                </div>

                <div className="relative max-w-[1400px] mx-auto px-6 py-8">
                    {/* Hero Header */}
                    <div className="flex items-start justify-between mb-10">
                        <div>
                            <div className="flex items-center gap-4">
                                <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {t('topup.title')}
                                    </h1>
                                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {t('topup.description')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Link
                            href="/topup/history"
                            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl border transition-all ${isDark
                                ? 'border-white/10 text-gray-300 hover:bg-white/5 hover:border-white/20'
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {t('topup.history')}
                        </Link>
                    </div>

                    {/* Balance Card */}
                    <div className={`relative overflow-hidden p-8 rounded-2xl backdrop-blur-xl border mb-10 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-xl shadow-gray-200/50'
                        }`}>
                        <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl bg-gradient-to-br from-emerald-500 to-teal-500 opacity-20`} />
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {t('topup.current_balance')}
                                </p>
                                <p className={`text-5xl font-bold mt-3 bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent`}>
                                    {formatCurrency(walletBalance || currentBalance)}
                                </p>
                            </div>
                            <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Packages Section */}
                    <h2 className={`text-lg font-semibold mb-5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {t('topup.select_package')}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                        {creditPackages.map((pkg, index) => {
                            const color = getColor(index);
                            const isPopular = pkg.popular;
                            const isSelected = selectedPackage === pkg.id;

                            return (
                                <button
                                    key={pkg.id}
                                    onClick={() => handleSelectPackage(pkg)}
                                    disabled={processing}
                                    className={`group relative overflow-hidden text-left rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed ${isPopular
                                        ? `bg-gradient-to-br ${color.from} ${color.to} border-transparent shadow-xl ${color.shadow}`
                                        : isDark
                                            ? 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                                            : 'bg-white/80 border-gray-200/50 hover:border-gray-300 shadow-lg shadow-gray-200/30'
                                        }`}
                                >
                                    {/* Popular badge */}
                                    {isPopular && (
                                        <div className="absolute top-4 right-4">
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm">
                                                {t('topup.popular')}
                                            </span>
                                        </div>
                                    )}

                                    {/* Bonus badge */}
                                    {pkg.bonus > 0 && !isPopular && (
                                        <div className="absolute top-4 right-4">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'
                                                }`}>
                                                +{pkg.bonus_percent || Math.round((pkg.bonus / pkg.price) * 100)}%
                                            </span>
                                        </div>
                                    )}

                                    <div className="p-6">
                                        {/* Icon */}
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isPopular
                                            ? 'bg-white/20'
                                            : `bg-gradient-to-br ${color.from} ${color.to} ${color.shadow} shadow-lg`
                                            }`}>
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                        </div>

                                        {/* Package Name */}
                                        <h3 className={`text-xl font-bold ${isPopular ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {pkg.name}
                                        </h3>

                                        {/* Price */}
                                        <div className="mt-3">
                                            <span className={`text-3xl font-bold ${isPopular ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {formatCurrency(pkg.price)}
                                            </span>
                                        </div>

                                        {/* Bonus info */}
                                        {pkg.bonus > 0 && (
                                            <div className={`mt-3 flex items-center gap-2 ${isPopular ? 'text-white/90' : ''}`}>
                                                <svg className={`w-4 h-4 ${isPopular ? 'text-white' : 'text-emerald-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                                </svg>
                                                <span className={`text-sm font-medium ${isPopular ? 'text-white' : isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                    Bonus: +{formatCurrency(pkg.bonus)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Total receive */}
                                        <div className={`mt-4 pt-4 border-t ${isPopular ? 'border-white/20' : isDark ? 'border-white/10' : 'border-gray-100'}`}>
                                            <div className="flex justify-between items-center">
                                                <span className={`text-sm ${isPopular ? 'text-white/70' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {t('topup.you_receive')}
                                                </span>
                                                <span className={`text-lg font-bold ${isPopular ? 'text-white' : isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                    {formatCurrency(pkg.price + (pkg.bonus || 0))}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Loading indicator */}
                                        {isSelected && processing && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl">
                                                <div className="flex items-center gap-2 text-white">
                                                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    <span className="text-sm font-medium">{t('topup.processing')}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Payment Methods Preview */}
                    <div className={`p-6 rounded-2xl backdrop-blur-xl border mb-10 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg shadow-gray-200/30'
                        }`}>
                        <h3 className={`text-sm font-medium uppercase tracking-wider mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t('topup.payment_methods')}
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            {['Chuyển khoản ngân hàng', 'MoMo', 'VNPay', 'ZaloPay'].map((method, i) => (
                                <div key={i} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{method}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    {recentTopups.length > 0 && (
                        <>
                            <h2 className={`text-lg font-semibold mb-5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('topup.recent_transactions')}
                            </h2>
                            <div className={`rounded-2xl overflow-hidden backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className={`border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                                                <th className={`text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('topup.package')}</th>
                                                <th className={`text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('topup.amount')}</th>
                                                <th className={`text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('topup.status')}</th>
                                                <th className={`text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('topup.date')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
                                            {recentTopups.map((topup) => (
                                                <tr key={topup.id} className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                                                    <td className={`py-4 px-6 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {topup.package_name}
                                                    </td>
                                                    <td className={`py-4 px-6 font-semibold text-emerald-500`}>
                                                        +{formatCurrency(topup.amount || topup.price)}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${topup.payment_status === 'completed'
                                                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                            : topup.payment_status === 'pending'
                                                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                                : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                            }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${topup.payment_status === 'completed'
                                                                ? 'bg-emerald-500'
                                                                : topup.payment_status === 'pending'
                                                                    ? 'bg-amber-500 animate-pulse'
                                                                    : 'bg-red-500'
                                                                }`} />
                                                            {topup.payment_status === 'completed' ? t('topup.completed') : topup.payment_status === 'pending' ? t('topup.pending') : t('topup.failed')}
                                                        </span>
                                                    </td>
                                                    <td className={`py-4 px-6 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {new Date(topup.created_at).toLocaleDateString('vi-VN')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Security Note */}
                    <div className={`mt-8 p-5 rounded-2xl ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{t('topup.secure_ssl')}</h4>
                                <p className={`text-sm mt-1 ${isDark ? 'text-blue-300/70' : 'text-blue-600/70'}`}>
                                    {t('topup.secure_ssl_description')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
