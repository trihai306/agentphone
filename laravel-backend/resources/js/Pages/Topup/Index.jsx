import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Index({ creditPackages = [], recentTopups = [], currentBalance = 0, walletBalance = 0 }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const handleSelectPackage = (pkg) => {
        router.post('/topup/checkout', { package_id: pkg.id });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <AppLayout title="Top Up">
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1400px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Top Up
                            </h1>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                Add funds to your wallet
                            </p>
                        </div>
                        <Link
                            href="/topup/history"
                            className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            History →
                        </Link>
                    </div>

                    {/* Balance Card */}
                    <div className={`p-6 rounded-xl mb-8 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Current Balance
                        </p>
                        <p className={`text-4xl font-semibold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(walletBalance || currentBalance)}
                        </p>
                    </div>

                    {/* Packages */}
                    <h2 className={`text-sm font-medium uppercase tracking-wider mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Select Package
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {creditPackages.map((pkg) => (
                            <button
                                key={pkg.id}
                                onClick={() => handleSelectPackage(pkg)}
                                className={`p-5 rounded-xl text-left transition-all ${pkg.popular
                                        ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                                        : isDark ? 'bg-[#1a1a1a] hover:bg-[#222]' : 'bg-white border border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                {pkg.popular && (
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded mb-2 inline-block ${isDark ? 'bg-black/10 text-black' : 'bg-white/20 text-white'
                                        }`}>
                                        Popular
                                    </span>
                                )}
                                <p className={`text-lg font-semibold ${pkg.popular ? '' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {pkg.name}
                                </p>
                                <p className={`text-2xl font-semibold mt-2 ${pkg.popular ? '' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(pkg.price)}
                                </p>
                                {pkg.bonus > 0 && (
                                    <p className={`text-sm mt-1 ${pkg.popular ? (isDark ? 'text-black/60' : 'text-white/60') : isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                        +{formatCurrency(pkg.bonus)} bonus
                                    </p>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Recent Topups */}
                    {recentTopups.length > 0 && (
                        <>
                            <h2 className={`text-sm font-medium uppercase tracking-wider mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Recent Transactions
                            </h2>
                            <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                <table className="w-full">
                                    <thead>
                                        <tr className={`border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                                            <th className={`text-left py-3 px-4 text-xs font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Package</th>
                                            <th className={`text-left py-3 px-4 text-xs font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Amount</th>
                                            <th className={`text-left py-3 px-4 text-xs font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Status</th>
                                            <th className={`text-left py-3 px-4 text-xs font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-[#2a2a2a]' : 'divide-gray-100'}`}>
                                        {recentTopups.map((topup) => (
                                            <tr key={topup.id} className={isDark ? 'hover:bg-[#222]' : 'hover:bg-gray-50'}>
                                                <td className={`py-4 px-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {topup.package_name}
                                                </td>
                                                <td className={`py-4 px-4 font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                    +{formatCurrency(topup.amount || topup.price)}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${topup.payment_status === 'completed'
                                                            ? isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                                                            : topup.payment_status === 'pending'
                                                                ? isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600'
                                                                : isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'
                                                        }`}>
                                                        {topup.payment_status === 'completed' ? 'Completed' : topup.payment_status === 'pending' ? 'Pending' : 'Failed'}
                                                    </span>
                                                </td>
                                                <td className={`py-4 px-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {new Date(topup.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
