import { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function Payment({ topup = {}, package: pkg = {}, paymentMethods = [], bankInfo = {} }) {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const isDark = theme === 'dark';
    const [copied, setCopied] = useState(null);
    const [timeLeft, setTimeLeft] = useState(30 * 60);

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

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);

    const copyToClipboard = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleConfirmPayment = () => router.visit('/topup/history');

    return (
        <AppLayout title={t('topup.payment')}>
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[900px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <Link
                            href="/topup"
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'}`}
                        >
                            <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div className="flex-1">
                            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('topup.complete_payment')}
                            </h1>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {t('topup.order_code')} #{topup.order_code}
                            </p>
                        </div>
                        <div className={`px-4 py-2 rounded-lg font-mono text-lg font-bold ${timeLeft < 300 ? (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600') : (isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600')}`}>
                            {formatTime(timeLeft)}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Order Summary */}
                        <div className="lg:col-span-1 lg:order-2">
                            <div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                <h2 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('topup.order_summary')}</h2>

                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('topup.package')}</span>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{topup.package_name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('topup.amount')}</span>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{formatCurrency(topup.price)}</span>
                                    </div>
                                    {topup.bonus_credits > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('topup.bonus')}</span>
                                            <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>+{formatCurrency(topup.bonus_credits)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className={`pt-4 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                                    <div className="flex justify-between">
                                        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('topup.total')}</span>
                                        <span className={`text-xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                            {formatCurrency((topup.price || 0) + (topup.bonus_credits || 0))}
                                        </span>
                                    </div>
                                </div>

                                <div className={`mt-4 px-3 py-2 rounded-lg text-center ${isDark ? 'bg-amber-900/20 text-amber-400' : 'bg-amber-50 text-amber-700'}`}>
                                    <span className="text-xs font-medium">{t('topup.pending_payment')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Instructions */}
                        <div className="lg:col-span-2 lg:order-1 space-y-4">
                            {topup.payment_method === 'bank_transfer' && (
                                <div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                    <h2 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('topup.bank_transfer_details')}</h2>

                                    <div className="space-y-4">
                                        <div className={`p-4 rounded-lg ${isDark ? 'bg-[#222]' : 'bg-gray-50'}`}>
                                            <div className="space-y-3">
                                                <div>
                                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('topup.bank')}</span>
                                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{bankInfo.bank_name}</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('topup.account_number')}</span>
                                                        <p className={`font-mono font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{bankInfo.account_number}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => copyToClipboard(bankInfo.account_number, 'account')}
                                                        className={`px-3 py-1 text-xs rounded ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`}
                                                    >
                                                        {copied === 'account' ? t('topup.copied') : t('topup.copy')}
                                                    </button>
                                                </div>
                                                <div>
                                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('topup.account_name')}</span>
                                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{bankInfo.account_name}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`p-4 rounded-lg ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className={`text-xs ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{t('topup.transfer_description')}</span>
                                                    <p className={`font-mono font-bold text-lg ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>{topup.order_code}</p>
                                                </div>
                                                <button
                                                    onClick={() => copyToClipboard(topup.order_code, 'code')}
                                                    className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                                                >
                                                    {copied === 'code' ? t('topup.copied') : t('topup.copy')}
                                                </button>
                                            </div>
                                        </div>

                                        <div className={`p-4 rounded-lg ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{t('topup.amount_to_transfer')}</span>
                                                    <p className={`font-bold text-xl ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{formatCurrency(topup.price)}</p>
                                                </div>
                                                <button
                                                    onClick={() => copyToClipboard(String(topup.price), 'amount')}
                                                    className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                                                >
                                                    {copied === 'amount' ? t('topup.copied') : t('topup.copy')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                                <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>{t('topup.important_notes')}</h3>
                                <ul className={`text-xs space-y-1 ${isDark ? 'text-blue-300/80' : 'text-blue-700'}`}>
                                    <li>• {t('topup.note_description')}</li>
                                    <li>• {t('topup.note_credit')}</li>
                                    <li>• {t('topup.note_expiry')}</li>
                                </ul>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3">
                                <Link
                                    href="/topup"
                                    className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    {t('topup.cancel')}
                                </Link>
                                <button
                                    onClick={handleConfirmPayment}
                                    className={`px-6 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                                >
                                    {t('topup.completed_payment')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
