import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Manage({ userPackage = {} }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const pkg = userPackage.service_package || {};

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: userPackage.currency || 'VND',
    }).format(price);

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString();
    };

    const handleCancel = () => {
        setProcessing(true);
        router.post(`/my-packages/${userPackage.id}/cancel`, { reason: cancelReason }, {
            onFinish: () => {
                setProcessing(false);
                setShowCancelModal(false);
            },
        });
    };

    const getStatusStyle = (status) => {
        if (status === 'active') return isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600';
        if (status === 'pending') return isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600';
        if (status === 'expired' || status === 'cancelled') return isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500';
        return isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500';
    };

    const creditsPercent = userPackage.remaining_credits != null && pkg.credits
        ? Math.round((userPackage.remaining_credits / pkg.credits) * 100) : null;

    return (
        <AppLayout title={`${t('packages.manage', 'Manage')} - ${pkg.name || t('packages.package', 'Package')}`}>
            <Head title={`${t('packages.manage', 'Manage')} - ${pkg.name || t('packages.package', 'Package')}`} />
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
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {pkg.name}
                                </h1>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusStyle(userPackage.status)}`}>
                                    {userPackage.status}
                                </span>
                            </div>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                Order #{userPackage.order_code}
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className={`p-4 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('packages.days_remaining', 'Days Remaining')}</p>
                            <p className={`text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {userPackage.days_remaining ?? 'N/A'}
                            </p>
                        </div>
                        <div className={`p-4 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('packages.credits_remaining', 'Credits Remaining')}</p>
                            <p className={`text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {userPackage.remaining_credits?.toLocaleString() ?? 'N/A'}
                            </p>
                        </div>
                        <div className={`p-4 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('packages.devices_used', 'Devices Used')}</p>
                            <p className={`text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {userPackage.used_devices ?? 0}/{pkg.max_devices === -1 ? '∞' : pkg.max_devices ?? 0}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Details */}
                        <div className="lg:col-span-2">
                            <div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                <h2 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('packages.details_label', 'Details')}</h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('packages.activation_date', 'Activation Date')}</span>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{formatDate(userPackage.activated_at)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('packages.expiry_date', 'Expiry Date')}</span>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{formatDate(userPackage.expires_at)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('packages.price_paid', 'Price Paid')}</span>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{formatPrice(userPackage.price_paid)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('packages.payment_status', 'Payment Status')}</span>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${userPackage.payment_status === 'paid' ? (isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600')}`}>
                                            {userPackage.payment_status === 'paid' ? t('packages.paid', 'Paid') : t('packages.pending', 'Pending')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('packages.auto_renew', 'Auto Renew')}</span>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{userPackage.auto_renew ? t('common.on', 'On') : t('common.off', 'Off')}</span>
                                    </div>
                                </div>

                                {/* Credits Progress */}
                                {creditsPercent !== null && (
                                    <div className={`mt-4 pt-4 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('packages.credits_usage', 'Credits Usage')}</span>
                                            <span className={isDark ? 'text-white' : 'text-gray-900'}>
                                                {userPackage.credits_used?.toLocaleString() || 0} / {pkg.credits?.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                                            <div
                                                className={`h-full rounded-full ${isDark ? 'bg-white' : 'bg-gray-900'}`}
                                                style={{ width: `${100 - creditsPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-4">
                            {userPackage.status === 'active' && (
                                <>
                                    <Link
                                        href={`/packages/${pkg.id}/subscribe`}
                                        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                                    >
                                        {t('packages.renew', 'Renew')}
                                    </Link>
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        className={`w-full px-4 py-2.5 text-sm font-medium rounded-lg ${isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'}`}
                                    >
                                        {t('packages.cancel_package', 'Cancel Package')}
                                    </button>
                                </>
                            )}

                            {userPackage.status === 'pending' && (
                                <Link
                                    href={`/my-packages/${userPackage.id}/payment`}
                                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg ${isDark ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
                                >
                                    {t('packages.pay_now', 'Pay Now')}
                                </Link>
                            )}

                            {userPackage.status === 'expired' && (
                                <Link
                                    href={`/packages/${pkg.id}/subscribe`}
                                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg ${isDark ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                                >
                                    {t('packages.resubscribe', 'Resubscribe')}
                                </Link>
                            )}

                            <Link
                                href="/packages"
                                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                {t('packages.back_to_packages', 'Back to Packages')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className={`w-full max-w-md p-6 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
                        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {t('packages.cancel_question', 'Cancel Package?')}
                        </h3>
                        <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t('packages.cancel_confirm', 'Are you sure you want to cancel {{name}}?', { name: pkg.name })}
                        </p>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder={t('packages.cancel_reason_placeholder', 'Reason for cancellation (optional)')}
                            rows={3}
                            className={`w-full px-3 py-2 rounded-lg text-sm mb-4 ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'} border focus:outline-none`}
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                {t('packages.keep_package', 'Keep Package')}
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={processing}
                                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {processing ? t('common.cancelling', 'Cancelling...') : t('packages.yes_cancel', 'Yes, Cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
