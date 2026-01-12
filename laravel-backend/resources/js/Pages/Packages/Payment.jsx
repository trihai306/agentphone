import { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../Layouts/AppLayout';

export default function Payment({ userPackage = {}, paymentMethods = [], bankInfo = {} }) {
    const { t } = useTranslation();
    const { auth } = usePage().props;
    const [copied, setCopied] = useState(null);
    const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes

    const pkg = userPackage.service_package || {};

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: userPackage.currency || 'VND',
        }).format(price);
    };

    const copyToClipboard = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
    };

    const selectedMethod = paymentMethods.find(m => m.id === userPackage.payment_method) || {};

    return (
        <AppLayout title={t('packages.breadcrumb.payment')}>
            <div className="max-w-4xl mx-auto">
                {/* Breadcrumb */}
                <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
                    <Link href="/packages" className="hover:text-purple-600 dark:hover:text-purple-400">
                        {t('packages.breadcrumb.packages')}
                    </Link>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-gray-900 dark:text-white font-medium">{t('packages.breadcrumb.payment')}</span>
                </nav>

                {/* Timer Warning */}
                <div className={`mb-6 p-4 rounded-2xl border ${timeLeft < 300
                        ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700'
                        : 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <svg className={`w-6 h-6 ${timeLeft < 300 ? 'text-red-500' : 'text-amber-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <h3 className={`font-semibold ${timeLeft < 300 ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}`}>
                                    {t('packages.payment_time')}
                                </h3>
                                <p className={`text-sm ${timeLeft < 300 ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                    {t('packages.payment_time_warning')}
                                </p>
                            </div>
                        </div>
                        <div className={`text-3xl font-mono font-bold ${timeLeft < 300 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Order Info */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 bg-gradient-to-br from-purple-600 to-indigo-600">
                                <h2 className="text-xl font-bold text-white">{t('packages.order_number', { code: userPackage.order_code })}</h2>
                                <p className="text-white/80 text-sm mt-1">
                                    {new Date(userPackage.created_at).toLocaleDateString('vi-VN')}
                                </p>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('packages.service_package')}</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{pkg.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('common.status')}</span>
                                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-semibold rounded-full">
                                        {t('packages.awaiting_payment')}
                                    </span>
                                </div>
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">{t('packages.total')}</span>
                                        <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
                                            {formatPrice(userPackage.price_paid)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Instructions */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                {t('packages.payment_instructions')} - {selectedMethod.name}
                            </h3>

                            {userPackage.payment_method === 'bank_transfer' && (
                                <div className="space-y-4">
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {t('packages.bank_transfer_note')}
                                    </p>

                                    {/* Bank Info */}
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">{t('packages.bank_name')}</span>
                                                <p className="font-semibold text-gray-900 dark:text-white">{bankInfo.bank_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">{t('packages.account_number')}</span>
                                                <p className="font-mono font-semibold text-gray-900 dark:text-white text-lg">{bankInfo.account_number}</p>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(bankInfo.account_number, 'account')}
                                                className="px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                                            >
                                                {copied === 'account' ? t('packages.copied') : t('packages.copy')}
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">{t('packages.account_name')}</span>
                                                <p className="font-semibold text-gray-900 dark:text-white">{bankInfo.account_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">{t('packages.branch')}</span>
                                                <p className="font-semibold text-gray-900 dark:text-white">{bankInfo.branch}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Transfer Content */}
                                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">{t('packages.transfer_content')}</span>
                                                <p className="font-mono font-bold text-purple-800 dark:text-purple-200 text-xl mt-1">
                                                    {userPackage.order_code}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(userPackage.order_code, 'content')}
                                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                            >
                                                {copied === 'content' ? t('packages.copied') : t('packages.copy')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-sm text-green-600 dark:text-green-400 font-medium">{t('packages.payment_amount')}</span>
                                                <p className="font-bold text-green-800 dark:text-green-200 text-2xl mt-1">
                                                    {formatPrice(userPackage.price_paid)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(userPackage.price_paid.toString(), 'amount')}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                {copied === 'amount' ? t('packages.copied') : t('packages.copy')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {userPackage.payment_method !== 'bank_transfer' && (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {t('packages.redirecting')}
                                    </h4>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {t('packages.redirect_message', { method: selectedMethod.name })}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center space-x-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{t('packages.important_notes')}</span>
                            </h4>
                            <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-2">
                                <li>• {t('packages.note_transfer')}</li>
                                <li>• {t('packages.note_activation')}</li>
                                <li>• {t('packages.note_support')}</li>
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-6">
                            <Link
                                href="/packages"
                                className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold"
                            >
                                {t('common.back')}
                            </Link>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-2xl transition-colors"
                            >
                                {t('packages.i_have_paid')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
