import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Checkout({ package: pkg = {}, paymentMethods = [], bankInfo = {} }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [selectedMethod, setSelectedMethod] = useState('bank_transfer');
    const [processing, setProcessing] = useState(false);

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);

    const handleSubmit = () => {
        setProcessing(true);
        router.post('/topup/process', {
            package_id: pkg.id,
            payment_method: selectedMethod,
        });
    };

    const methodIcons = {
        bank_transfer: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        momo: (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#AE2070" />
                <text x="12" y="16" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">M</text>
            </svg>
        ),
        vnpay: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
        ),
        zalopay: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    };

    return (
        <AppLayout title="Thanh toán">
            <Head title="Thanh toán" />

            <div className={`min-h-screen ${isDark ? 'bg-[#09090b]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
                {/* Background decoration */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-200/50'}`} />
                </div>

                <div className="relative max-w-[900px] mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-10">
                        <Link
                            href="/topup"
                            className={`p-3 rounded-xl transition-all ${isDark ? 'hover:bg-white/5 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Thanh toán
                            </h1>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                Hoàn tất thanh toán để nạp tiền
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Payment Methods - Left */}
                        <div className="lg:col-span-3 space-y-5">
                            <div className={`p-6 rounded-2xl backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                                <h2 className={`text-sm font-semibold uppercase tracking-wider mb-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Phương thức thanh toán
                                </h2>
                                <div className="space-y-3">
                                    {paymentMethods.map((method) => (
                                        <label
                                            key={method.id}
                                            className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border-2 ${selectedMethod === method.id
                                                    ? isDark
                                                        ? 'bg-emerald-500/10 border-emerald-500/50'
                                                        : 'bg-emerald-50 border-emerald-500'
                                                    : isDark
                                                        ? 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="payment"
                                                value={method.id}
                                                checked={selectedMethod === method.id}
                                                onChange={() => setSelectedMethod(method.id)}
                                                className="sr-only"
                                            />
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedMethod === method.id
                                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                                                    : isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {methodIcons[method.id]}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {method.name}
                                                </p>
                                                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {method.description}
                                                </p>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethod === method.id
                                                    ? 'border-emerald-500 bg-emerald-500'
                                                    : isDark ? 'border-gray-600' : 'border-gray-300'
                                                }`}>
                                                {selectedMethod === method.id && (
                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Security Note */}
                            <div className={`p-5 rounded-xl ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
                                <div className="flex items-center gap-3">
                                    <svg className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    <span className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                                        Thanh toán được mã hóa an toàn
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary - Right */}
                        <div className="lg:col-span-2">
                            <div className={`sticky top-6 p-6 rounded-2xl backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                                <h2 className={`text-sm font-semibold uppercase tracking-wider mb-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Chi tiết đơn hàng
                                </h2>

                                {/* Package Card */}
                                <div className={`p-4 rounded-xl mb-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border ${isDark ? 'border-emerald-500/20' : 'border-emerald-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{pkg.name}</p>
                                            <p className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Gói nạp tiền</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-5">
                                    <div className="flex justify-between text-sm">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Giá gói</span>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{formatCurrency(pkg.price)}</span>
                                    </div>
                                    {pkg.bonus > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Bonus</span>
                                            <span className="text-emerald-500 font-medium">+{formatCurrency(pkg.bonus)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className={`pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                                    <div className="flex justify-between items-center mb-5">
                                        <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Bạn nhận được</span>
                                        <span className="text-2xl font-bold text-emerald-500">
                                            {formatCurrency((pkg.price || 0) + (pkg.bonus || 0))}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-3">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={processing}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Xác nhận thanh toán
                                            </>
                                        )}
                                    </button>
                                    <Link
                                        href="/topup"
                                        className={`w-full block text-center py-3 text-sm font-medium rounded-xl transition-all ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                            }`}
                                    >
                                        Quay lại
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
