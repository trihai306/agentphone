import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useToast } from '@/Components/Layout/ToastProvider';
import { useConfirm } from '@/Components/UI/ConfirmModal';

export default function AiCreditsIndex({ packages = [], currentCredits = 0, walletBalance = 0 }) {
    const { theme } = useTheme();
    const { addToast } = useToast();
    const { showConfirm } = useConfirm();
    const isDark = theme === 'dark';
    const [processing, setProcessing] = useState(false);

    const handlePurchase = async (pkg) => {
        if (walletBalance < pkg.price) {
            addToast('Insufficient balance. Please top up.', 'warning');
            return;
        }

        const confirmed = await showConfirm({
            title: 'Confirm Purchase',
            message: `Buy ${pkg.credits} AI credits for ${pkg.formatted_price}?`,
            type: 'info',
            confirmText: 'Buy Now',
            cancelText: 'Cancel',
        });

        if (!confirmed) return;

        setProcessing(true);
        router.post('/ai-credits/purchase', {
            package_id: pkg.id,
            payment_method: 'wallet',
        }, {
            onFinish: () => setProcessing(false),
        });
    };

    const formatNumber = (num) => new Intl.NumberFormat('vi-VN').format(num);
    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);

    return (
        <AppLayout title="AI Credits">
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1000px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            AI Credits
                        </h1>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            Purchase credits for AI image and video generation
                        </p>
                    </div>

                    {/* Balance Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>AI Credits</p>
                            <p className={`text-3xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {formatNumber(currentCredits)}
                            </p>
                        </div>
                        <div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Wallet Balance</p>
                            <p className={`text-3xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {formatCurrency(walletBalance)}
                            </p>
                            <Link
                                href="/topup"
                                className={`text-sm mt-2 inline-block ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Top up →
                            </Link>
                        </div>
                    </div>

                    {/* Packages */}
                    <h2 className={`text-sm font-medium uppercase tracking-wider mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Credit Packages
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {packages.map((pkg) => (
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

                                <div className="mt-3 mb-4">
                                    <span className={`text-3xl font-semibold ${pkg.is_featured ? '' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {formatNumber(pkg.credits)}
                                    </span>
                                    <span className={`text-sm ml-1 ${pkg.is_featured ? (isDark ? 'text-black/60' : 'text-white/60') : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        credits
                                    </span>
                                </div>

                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className={`text-xl font-semibold ${pkg.is_featured ? '' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {pkg.formatted_price}
                                    </span>
                                    {pkg.original_price && (
                                        <span className={`text-sm line-through ${pkg.is_featured ? (isDark ? 'text-black/40' : 'text-white/40') : isDark ? 'text-gray-600' : 'text-gray-300'}`}>
                                            {pkg.formatted_original_price}
                                        </span>
                                    )}
                                </div>

                                {pkg.discount_percent && (
                                    <p className={`text-sm mb-3 ${pkg.is_featured ? (isDark ? 'text-black/60' : 'text-white/60') : isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                        Save {pkg.discount_percent}%
                                    </p>
                                )}

                                <button
                                    onClick={() => handlePurchase(pkg)}
                                    disabled={processing}
                                    className={`w-full py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${pkg.is_featured
                                            ? isDark ? 'bg-black text-white hover:bg-gray-900' : 'bg-white text-gray-900 hover:bg-gray-100'
                                            : isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                        }`}
                                >
                                    {processing ? 'Processing...' : 'Buy Now'}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Usage Info */}
                    <div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                        <h3 className={`text-sm font-medium uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Credit Usage
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                                    <svg className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Image Generation</p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>1 credit per image</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                                    <svg className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Video Generation</p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>5 credits per video</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
