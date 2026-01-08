import { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function Payment({ topup = {}, package: pkg = {}, paymentMethods = [], bankInfo = {} }) {
    const [copied, setCopied] = useState(null);
    const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes

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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: topup.currency || 'VND',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const copyToClipboard = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
    };

    const selectedMethod = paymentMethods.find(m => m.id === topup.payment_method) || {};

    const handleConfirmPayment = () => {
        router.visit('/topup/history');
    };

    return (
        <AppLayout title="Thanh toán nạp tiền">
            <div className="max-w-4xl mx-auto">
                {/* Breadcrumb */}
                <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
                    <Link href="/topup" className="hover:text-emerald-600 dark:hover:text-emerald-400">
                        Nạp tiền
                    </Link>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-gray-900 dark:text-white font-medium">Thanh toán</span>
                </nav>

                {/* Timer Warning */}
                <div className={`mb-6 p-4 rounded-2xl border ${
                    timeLeft < 300
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
                                    Thời gian thanh toán
                                </h3>
                                <p className={`text-sm ${timeLeft < 300 ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                    Vui lòng hoàn tất thanh toán trong thời gian quy định
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
                            <div className="p-6 bg-gradient-to-br from-emerald-600 to-teal-600">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Nạp tiền</h2>
                                        <p className="text-white/80 text-sm">#{topup.order_code}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Gói nạp</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{topup.package_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Số tiền nạp</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(topup.price)}
                                    </span>
                                </div>
                                {topup.bonus_credits > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Bonus</span>
                                        <span className="font-bold text-green-600 dark:text-green-400">
                                            +{formatCurrency(topup.bonus_credits)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Trạng thái</span>
                                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-semibold rounded-full">
                                        Chờ thanh toán
                                    </span>
                                </div>
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">Tổng cộng</span>
                                        <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(topup.price)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Total Amount Summary */}
                            <div className="mx-6 mb-6 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                                <div className="text-center">
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-1">Tổng nhận vào ví</p>
                                    <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
                                        {formatCurrency((topup.price || 0) + (topup.bonus_credits || 0))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Instructions */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                Hướng dẫn thanh toán - {selectedMethod.name}
                            </h3>

                            {topup.payment_method === 'bank_transfer' && (
                                <div className="space-y-4">
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Vui lòng chuyển khoản đến tài khoản sau và ghi nội dung chuyển khoản đúng format:
                                    </p>

                                    {/* Bank Info */}
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">Ngân hàng</span>
                                                <p className="font-semibold text-gray-900 dark:text-white">{bankInfo.bank_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">Số tài khoản</span>
                                                <p className="font-mono font-semibold text-gray-900 dark:text-white text-lg">{bankInfo.account_number}</p>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(bankInfo.account_number, 'account')}
                                                className="px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                                            >
                                                {copied === 'account' ? 'Đã sao chép!' : 'Sao chép'}
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">Tên tài khoản</span>
                                                <p className="font-semibold text-gray-900 dark:text-white">{bankInfo.account_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">Chi nhánh</span>
                                                <p className="font-semibold text-gray-900 dark:text-white">{bankInfo.branch}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">Nội dung chuyển khoản</span>
                                                <p className="font-mono font-bold text-purple-800 dark:text-purple-200 text-xl mt-1">
                                                    {topup.order_code}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(topup.order_code, 'content')}
                                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                            >
                                                {copied === 'content' ? 'Đã sao chép!' : 'Sao chép'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Số tiền thanh toán</span>
                                                <p className="font-bold text-emerald-800 dark:text-emerald-200 text-2xl mt-1">
                                                    {formatCurrency(topup.price)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(topup.price?.toString(), 'amount')}
                                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                            >
                                                {copied === 'amount' ? 'Đã sao chép!' : 'Sao chép'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {topup.payment_method !== 'bank_transfer' && (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-10 h-10 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        Đang chuyển hướng đến cổng thanh toán...
                                    </h4>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Bạn sẽ được chuyển đến {selectedMethod.name} để hoàn tất thanh toán
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
                                <span>Lưu ý quan trọng</span>
                            </h4>
                            <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-2">
                                <li>• Vui lòng ghi đúng nội dung chuyển khoản để hệ thống tự động xác nhận</li>
                                <li>• Tiền sẽ được cộng vào ví trong vòng 5-15 phút sau khi admin xác nhận thanh toán</li>
                                <li>• Số dư ví không có thời hạn sử dụng</li>
                                <li>• Nếu cần hỗ trợ, vui lòng liên hệ hotline: 1900 xxxx hoặc email: support@devicehub.vn</li>
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-6">
                            <Link
                                href="/topup"
                                className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold"
                            >
                                Quay lại
                            </Link>
                            <button
                                onClick={handleConfirmPayment}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-2xl shadow-lg transition-all"
                            >
                                Tôi đã thanh toán
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
