import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../Layouts/AppLayout';

export default function Checkout({ package: pkg = {}, paymentMethods = [], bankInfo = {} }) {
    const { t } = useTranslation();
    const [selectedMethod, setSelectedMethod] = useState('bank_transfer');
    const [processing, setProcessing] = useState(false);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleSubmit = () => {
        setProcessing(true);
        router.post('/topup/process', {
            package_id: pkg.id,
            payment_method: selectedMethod,
        });
    };

    const methodIcons = {
        bank_transfer: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        momo: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
            </svg>
        ),
        vnpay: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
        ),
        zalopay: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    };

    return (
        <AppLayout title={t('topup.payment', { defaultValue: 'Thanh toán' })}>
            <div className="max-w-4xl mx-auto">
                {/* Breadcrumb */}
                <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
                    <Link href="/topup" className="hover:text-emerald-600 dark:hover:text-emerald-400">
                        {t('topup.topup', { defaultValue: 'Nạp tiền' })}
                    </Link>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-gray-900 dark:text-white font-medium">{t('topup.payment', { defaultValue: 'Thanh toán' })}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Order Summary */}
                    <div className="lg:col-span-1 lg:order-2">
                        <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 bg-gradient-to-br from-emerald-600 to-teal-600">
                                <h2 className="text-xl font-bold text-white mb-1">{t('topup.your_order', { defaultValue: 'Đơn hàng của bạn' })}</h2>
                                <p className="text-emerald-200 text-sm">{pkg.name}</p>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('topup.deposit_amount', { defaultValue: 'Số tiền nạp' })}</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(pkg.price)}
                                    </span>
                                </div>
                                {pkg.bonus > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Bonus</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                            +{formatCurrency(pkg.bonus)}
                                        </span>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">{t('topup.wallet_receive', { defaultValue: 'Nhận vào ví' })}</span>
                                        <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency((pkg.price || 0) + (pkg.bonus || 0))}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Bonus info */}
                            {pkg.bonus_percent > 0 && (
                                <div className="mx-6 mb-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                            {t('topup.bonus_info', { percent: pkg.bonus_percent, defaultValue: `Thêm ${pkg.bonus_percent}% bonus vào ví` })}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="lg:col-span-2 lg:order-1">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                {t('topup.select_payment', { defaultValue: 'Chọn phương thức thanh toán' })}
                            </h3>

                            <div className="space-y-3">
                                {paymentMethods.map((method) => (
                                    <label
                                        key={method.id}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedMethod === method.id
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value={method.id}
                                            checked={selectedMethod === method.id}
                                            onChange={() => setSelectedMethod(method.id)}
                                            className="w-5 h-5 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                                        />
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${selectedMethod === method.id
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                            }`}>
                                            {methodIcons[method.id] || methodIcons.bank_transfer}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                                {method.name}
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {method.description}
                                            </p>
                                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                                Thời gian xử lý: {method.processing_time}
                                            </p>
                                        </div>
                                        {selectedMethod === method.id && (
                                            <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Security Notice */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700 mb-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                                        {t('topup.secure_payment', { defaultValue: 'Thanh toán an toàn' })}
                                    </h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        {t('topup.secure_desc', { defaultValue: 'Mọi giao dịch được bảo mật và mã hóa. Tiền sẽ được cộng vào ví ngay sau khi admin xác nhận thanh toán.' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                            <Link
                                href="/topup"
                                className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                {t('topup.back', { defaultValue: 'Quay lại' })}
                            </Link>
                            <button
                                onClick={handleSubmit}
                                disabled={processing}
                                className={`px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center gap-2 ${processing ? 'opacity-75 cursor-not-allowed' : ''
                                    }`}
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>{t('topup.processing', { defaultValue: 'Đang xử lý...' })}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{t('topup.continue_payment', { defaultValue: 'Tiếp tục thanh toán' })}</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
