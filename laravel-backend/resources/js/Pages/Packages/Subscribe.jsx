import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../Layouts/AppLayout';

export default function Subscribe({ package: pkg = {}, existingPackage = null, paymentMethods = [] }) {
    const { t } = useTranslation();
    const { auth } = usePage().props;
    const [selectedPayment, setSelectedPayment] = useState('');
    const [processing, setProcessing] = useState(false);
    const [agreed, setAgreed] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedPayment || !agreed) return;

        setProcessing(true);
        router.post(`/packages/${pkg.id}/subscribe`, {
            payment_method: selectedPayment,
        }, {
            onFinish: () => setProcessing(false),
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: pkg.currency || 'VND',
        }).format(price);
    };

    const paymentIcons = {
        bank_transfer: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        momo: (
            <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
        ),
        vnpay: (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">VN</div>
        ),
        zalopay: (
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">Z</div>
        ),
    };

    return (
        <AppLayout title={`${t('packages.subscribe')} ${pkg.name || t('packages.title')}`}>
            <div className="max-w-4xl mx-auto">
                {/* Breadcrumb */}
                <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
                    <Link href="/packages" className="hover:text-purple-600 dark:hover:text-purple-400">
                        {t('packages.breadcrumb.packages')}
                    </Link>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-gray-900 dark:text-white font-medium">{t('packages.breadcrumb.subscribe')}</span>
                </nav>

                {/* Warning if already subscribed */}
                {existingPackage && (
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-2xl">
                        <div className="flex items-start space-x-3">
                            <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <h3 className="text-amber-800 dark:text-amber-200 font-semibold">{t('packages.already_have')}</h3>
                                <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
                                    {t('packages.already_have_description')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Package Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Package Header */}
                            <div className={`p-6 bg-gradient-to-br ${pkg.is_featured ? 'from-purple-600 to-indigo-600' : 'from-gray-700 to-gray-800'}`}>
                                {pkg.badge && (
                                    <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full mb-3">
                                        {pkg.badge}
                                    </span>
                                )}
                                <h2 className="text-2xl font-bold text-white">{pkg.name}</h2>
                                <p className="text-white/80 text-sm mt-2">{pkg.description}</p>
                            </div>

                            {/* Price */}
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-baseline space-x-2">
                                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                                        {formatPrice(pkg.price)}
                                    </span>
                                    {pkg.duration_days && (
                                        <span className="text-gray-500 dark:text-gray-400">
                                            /{pkg.duration_days} {t('packages.days')}
                                        </span>
                                    )}
                                </div>
                                {pkg.original_price && pkg.original_price > pkg.price && (
                                    <div className="mt-2 flex items-center space-x-2">
                                        <span className="text-gray-400 line-through text-lg">
                                            {formatPrice(pkg.original_price)}
                                        </span>
                                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-semibold rounded-full">
                                            -{pkg.discount_percent}%
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Features */}
                            <div className="p-6">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                                    {t('packages.includes')}
                                </h3>
                                <ul className="space-y-3">
                                    {pkg.credits && (
                                        <li className="flex items-center space-x-3">
                                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-gray-700 dark:text-gray-300">{pkg.credits.toLocaleString()} {t('packages.credits').toLowerCase()}</span>
                                        </li>
                                    )}
                                    {pkg.max_devices && (
                                        <li className="flex items-center space-x-3">
                                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-gray-700 dark:text-gray-300">
                                                {pkg.max_devices === -1 ? t('packages.unlimited') : pkg.max_devices} {t('packages.devices').toLowerCase()}
                                            </span>
                                        </li>
                                    )}
                                    {(pkg.features || []).map((feature, idx) => (
                                        <li key={idx} className="flex items-center space-x-3">
                                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Payment Form */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit}>
                            {/* Payment Methods */}
                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                    {t('packages.select_payment')}
                                </h3>
                                <div className="space-y-3">
                                    {paymentMethods.map((method) => (
                                        <label
                                            key={method.id}
                                            className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedPayment === method.id
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="payment_method"
                                                value={method.id}
                                                checked={selectedPayment === method.id}
                                                onChange={(e) => setSelectedPayment(e.target.value)}
                                                className="sr-only"
                                            />
                                            <div className="flex items-center space-x-4 flex-1">
                                                <div className="text-gray-600 dark:text-gray-400">
                                                    {paymentIcons[method.id] || (
                                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-semibold text-gray-900 dark:text-white">
                                                        {method.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {method.description}
                                                    </div>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPayment === method.id
                                                        ? 'border-purple-500 bg-purple-500'
                                                        : 'border-gray-300 dark:border-gray-600'
                                                    }`}>
                                                    {selectedPayment === method.id && (
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                    {t('packages.order_summary')}
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">{t('packages.service_package')}</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{pkg.name}</span>
                                    </div>
                                    {pkg.original_price && pkg.original_price > pkg.price && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">{t('packages.original_price')}</span>
                                                <span className="text-gray-400 line-through">{formatPrice(pkg.original_price)}</span>
                                            </div>
                                            <div className="flex justify-between text-green-600 dark:text-green-400">
                                                <span>{t('packages.discount')}</span>
                                                <span>-{formatPrice(pkg.original_price - pkg.price)}</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">{t('packages.total')}</span>
                                        <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
                                            {formatPrice(pkg.price)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Terms */}
                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                                <label className="flex items-start space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={agreed}
                                        onChange={(e) => setAgreed(e.target.checked)}
                                        className="mt-1 w-5 h-5 text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                                        {t('packages.terms_agreement')}{' '}
                                        <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">
                                            {t('packages.terms_of_service')}
                                        </a>{' '}
                                        {t('common.and')}{' '}
                                        <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">
                                            {t('packages.privacy_policy')}
                                        </a>{' '}
                                        {t('packages.of_devicehub')}
                                    </span>
                                </label>
                            </div>

                            {/* Submit */}
                            <div className="flex items-center justify-between">
                                <Link
                                    href="/packages"
                                    className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold"
                                >
                                    {t('common.back')}
                                </Link>
                                <button
                                    type="submit"
                                    disabled={!selectedPayment || !agreed || processing}
                                    className={`px-8 py-4 rounded-2xl font-bold text-white shadow-lg transition-all ${selectedPayment && agreed && !processing
                                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/30 hover:shadow-xl'
                                            : 'bg-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {processing ? (
                                        <span className="flex items-center space-x-2">
                                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>{t('packages.processing')}</span>
                                        </span>
                                    ) : (
                                        t('packages.pay_amount', { amount: formatPrice(pkg.price) })
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
