import { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Payment({ userPackage = {}, paymentMethods = [], bankInfo = {} }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [copied, setCopied] = useState(null);
    const [timeLeft, setTimeLeft] = useState(30 * 60);

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

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: userPackage.currency || 'VND',
    }).format(price);

    const copyToClipboard = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
    };

    const selectedMethod = paymentMethods.find(m => m.id === userPackage.payment_method) || {};

    return (
        <AppLayout title="Payment">
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
                            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Complete Payment
                            </h1>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                Order #{userPackage.order_code}
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
                                <h2 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Order Summary</h2>

                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Package</span>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{pkg.name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Status</span>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                                            Pending
                                        </span>
                                    </div>
                                </div>

                                <div className={`pt-4 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                                    <div className="flex justify-between">
                                        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Total</span>
                                        <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {formatPrice(userPackage.price_paid)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Instructions */}
                        <div className="lg:col-span-2 lg:order-1 space-y-4">
                            {userPackage.payment_method === 'bank_transfer' && (
                                <div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                    <h2 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Bank Transfer Details</h2>

                                    <div className="space-y-4">
                                        <div className={`p-4 rounded-lg ${isDark ? 'bg-[#222]' : 'bg-gray-50'}`}>
                                            <div className="space-y-3">
                                                <div>
                                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Bank</span>
                                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{bankInfo.bank_name}</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Account Number</span>
                                                        <p className={`font-mono font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{bankInfo.account_number}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => copyToClipboard(bankInfo.account_number, 'account')}
                                                        className={`px-3 py-1 text-xs rounded ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`}
                                                    >
                                                        {copied === 'account' ? 'Copied!' : 'Copy'}
                                                    </button>
                                                </div>
                                                <div>
                                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Account Name</span>
                                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{bankInfo.account_name}</p>
                                                </div>
                                                {bankInfo.branch && (
                                                    <div>
                                                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Branch</span>
                                                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{bankInfo.branch}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className={`p-4 rounded-lg ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className={`text-xs ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Transfer Description (Required)</span>
                                                    <p className={`font-mono font-bold text-lg ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>{userPackage.order_code}</p>
                                                </div>
                                                <button
                                                    onClick={() => copyToClipboard(userPackage.order_code, 'code')}
                                                    className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                                                >
                                                    {copied === 'code' ? 'Copied!' : 'Copy'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className={`p-4 rounded-lg ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Amount to Transfer</span>
                                                    <p className={`font-bold text-xl ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{formatPrice(userPackage.price_paid)}</p>
                                                </div>
                                                <button
                                                    onClick={() => copyToClipboard(String(userPackage.price_paid), 'amount')}
                                                    className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                                                >
                                                    {copied === 'amount' ? 'Copied!' : 'Copy'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {userPackage.payment_method !== 'bank_transfer' && (
                                <div className={`p-8 rounded-xl text-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                                        Redirecting to {selectedMethod.name}...
                                    </p>
                                </div>
                            )}

                            {/* Notes */}
                            <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                                <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>Important Notes</h3>
                                <ul className={`text-xs space-y-1 ${isDark ? 'text-blue-300/80' : 'text-blue-700'}`}>
                                    <li>• Use exact transfer description for automatic verification</li>
                                    <li>• Package activation within 5-15 minutes after confirmation</li>
                                    <li>• Contact support if you need assistance</li>
                                </ul>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3">
                                <Link
                                    href="/packages"
                                    className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Back
                                </Link>
                                <button
                                    onClick={() => window.location.reload()}
                                    className={`px-6 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                                >
                                    I've Completed Payment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
