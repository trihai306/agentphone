import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Subscribe({ package: pkg = {}, existingPackage = null, paymentMethods = [] }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [selectedPayment, setSelectedPayment] = useState('');
    const [processing, setProcessing] = useState(false);
    const [agreed, setAgreed] = useState(false);

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: pkg.currency || 'VND',
    }).format(price);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedPayment || !agreed) return;
        setProcessing(true);
        router.post(`/packages/${pkg.id}/subscribe`, { payment_method: selectedPayment }, {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppLayout title={`${t('packages.subscribe', 'Subscribe')} - ${pkg.name}`}>
            <Head title={`${t('packages.subscribe', 'Subscribe')} - ${pkg.name}`} />
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[900px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <Link
                            href="/packages"
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'}`}
                        >
                            <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Subscribe to {pkg.name}
                            </h1>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {t('packages.complete_subscription', 'Complete your subscription')}
                            </p>
                        </div>
                    </div>

                    {/* Warning */}
                    {existingPackage && (
                        <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-amber-900/20 text-amber-400' : 'bg-amber-50 text-amber-700'}`}>
                            {t('packages.existing_warning', 'You already have an active package. Subscribing will extend your current subscription.')}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Package Summary */}
                            <div className="lg:col-span-1 lg:order-2">
                                <div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                    <h2 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('packages.package', 'Package')}</h2>

                                    {pkg.badge && (
                                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded mb-2 ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                                            {pkg.badge}
                                        </span>
                                    )}

                                    <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{pkg.name}</h3>
                                    <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{pkg.description}</p>

                                    <div className="flex items-baseline gap-1 mb-4">
                                        <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrice(pkg.price)}</span>
                                        {pkg.duration_days && (
                                            <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>/ {pkg.duration_days} {t('packages.days', 'days')}</span>
                                        )}
                                    </div>

                                    {(pkg.features || []).length > 0 && (
                                        <div className={`pt-4 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                                            <div className="space-y-2">
                                                {pkg.features.map((f, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <svg className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{f}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Selection */}
                            <div className="lg:col-span-2 lg:order-1 space-y-4">
                                <div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                    <h2 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('packages.payment_method', 'Payment Method')}</h2>
                                    <div className="space-y-2">
                                        {paymentMethods.map((method) => (
                                            <label
                                                key={method.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${selectedPayment === method.id
                                                    ? isDark ? 'bg-white/5 ring-1 ring-white/20' : 'bg-gray-50 ring-1 ring-gray-200'
                                                    : isDark ? 'hover:bg-[#222]' : 'hover:bg-gray-50'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="payment"
                                                    value={method.id}
                                                    checked={selectedPayment === method.id}
                                                    onChange={() => setSelectedPayment(method.id)}
                                                    className="sr-only"
                                                />
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPayment === method.id
                                                    ? isDark ? 'border-white bg-white' : 'border-gray-900 bg-gray-900'
                                                    : isDark ? 'border-gray-600' : 'border-gray-300'
                                                    }`}>
                                                    {selectedPayment === method.id && (
                                                        <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-black' : 'bg-white'}`} />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{method.name}</p>
                                                    {method.description && (
                                                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{method.description}</p>
                                                    )}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Order Summary */}
                                <div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                    <h2 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('packages.order_summary', 'Order Summary')}</h2>
                                    <div className="flex justify-between mb-2">
                                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{pkg.name}</span>
                                        <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrice(pkg.price)}</span>
                                    </div>
                                    <div className={`pt-3 border-t flex justify-between ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('packages.total', 'Total')}</span>
                                        <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrice(pkg.price)}</span>
                                    </div>
                                </div>

                                {/* Terms */}
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={agreed}
                                        onChange={(e) => setAgreed(e.target.checked)}
                                        className="mt-1"
                                    />
                                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {t('packages.agree_terms', 'I agree to the Terms of Service and Privacy Policy')}
                                    </span>
                                </label>

                                {/* Actions */}
                                <div className="flex justify-end gap-3">
                                    <Link
                                        href="/packages"
                                        className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        {t('common.cancel', 'Cancel')}
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={!selectedPayment || !agreed || processing}
                                        className={`px-6 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                            } disabled:opacity-50`}
                                    >
                                        {processing ? t('common.processing', 'Processing...') : `${t('packages.pay', 'Pay')} ${formatPrice(pkg.price)}`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
