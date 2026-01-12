import { Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../Layouts/AppLayout';

export default function Show({ package: pkg = {} }) {
    const { t } = useTranslation();
    const { auth } = usePage().props;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: pkg.currency || 'VND',
        }).format(price);
    };

    const getPackageType = (type) => {
        const types = {
            subscription: t('packages.type.subscription'),
            one_time: t('packages.type.one_time'),
            credits: t('packages.type.credits')
        };
        return types[type] || type;
    };

    const handleSubscribe = () => {
        router.visit(`/packages/${pkg.id}/subscribe`);
    };

    return (
        <AppLayout title={pkg.name || t('packages.package_details')}>
            <div className="max-w-4xl mx-auto">
                {/* Breadcrumb */}
                <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
                    <Link href="/packages" className="hover:text-purple-600 dark:hover:text-purple-400">
                        {t('packages.breadcrumb.packages')}
                    </Link>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-gray-900 dark:text-white font-medium">{pkg.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Package Header */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className={`p-8 bg-gradient-to-br ${pkg.is_featured ? 'from-purple-600 to-indigo-600' : 'from-gray-700 to-gray-800'}`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        {pkg.badge && (
                                            <span className="inline-block px-3 py-1 bg-white/20 text-white text-sm font-semibold rounded-full mb-3">
                                                {pkg.badge}
                                            </span>
                                        )}
                                        <h1 className="text-3xl font-bold text-white mb-2">{pkg.name}</h1>
                                        <p className="text-white/80 text-lg">{pkg.description}</p>
                                    </div>
                                    {pkg.type && (
                                        <span className="px-4 py-2 bg-white/10 text-white text-sm font-medium rounded-xl">
                                            {getPackageType(pkg.type)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-8">
                                {/* Price */}
                                <div className="flex items-baseline space-x-3 mb-8">
                                    <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
                                        {formatPrice(pkg.price)}
                                    </span>
                                    {pkg.duration_days && (
                                        <span className="text-xl text-gray-500 dark:text-gray-400">
                                            /{pkg.duration_days} {t('packages.days')}
                                        </span>
                                    )}
                                </div>

                                {pkg.original_price && pkg.original_price > pkg.price && (
                                    <div className="flex items-center space-x-3 mb-8">
                                        <span className="text-2xl text-gray-400 line-through">
                                            {formatPrice(pkg.original_price)}
                                        </span>
                                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold rounded-full">
                                            {t('packages.save_percent', { percent: pkg.discount_percent })}
                                        </span>
                                    </div>
                                )}

                                {/* Key Stats */}
                                <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl mb-8">
                                    {pkg.credits && (
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                                {pkg.credits.toLocaleString()}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('packages.credits')}</p>
                                        </div>
                                    )}
                                    {pkg.max_devices && (
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                {pkg.max_devices === -1 ? '∞' : pkg.max_devices}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('packages.devices')}</p>
                                        </div>
                                    )}
                                    {pkg.duration_days && (
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                                {pkg.duration_days}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('packages.days')}</p>
                                        </div>
                                    )}
                                </div>

                                {/* CTA Button */}
                                <button
                                    onClick={handleSubscribe}
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-lg font-bold rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-xl transition-all"
                                >
                                    {t('packages.subscribe_now')}
                                </button>
                            </div>
                        </div>

                        {/* Features */}
                        {pkg.features && pkg.features.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                    {t('packages.features_included')}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {pkg.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Limits */}
                        {pkg.limits && Object.keys(pkg.limits).length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                    {t('packages.usage_limits')}
                                </h2>
                                <div className="space-y-4">
                                    {Object.entries(pkg.limits).map(([key, value]) => (
                                        <div key={key} className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                            <span className="text-gray-600 dark:text-gray-400 capitalize">
                                                {key.replace(/_/g, ' ')}
                                            </span>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {value === -1 ? t('packages.unlimited') : value.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Quick Info */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('packages.quick_info')}</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">{t('packages.package_code')}</span>
                                    <span className="font-mono font-semibold text-gray-900 dark:text-white">{pkg.code}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">{t('packages.package_type')}</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {getPackageType(pkg.type)}
                                    </span>
                                </div>
                                {pkg.active_subscribers !== undefined && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">{t('packages.users')}</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            {pkg.active_subscribers.toLocaleString()}+
                                        </span>
                                    </div>
                                )}
                                {pkg.is_trial && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">{t('packages.trial')}</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                            {t('packages.trial_days', { days: pkg.trial_days })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Guarantee */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-3xl border border-green-200 dark:border-green-700 p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-green-800 dark:text-green-200">
                                    {t('packages.money_back_guarantee')}
                                </h3>
                            </div>
                            <p className="text-green-700 dark:text-green-300 text-sm">
                                {t('packages.money_back_description')}
                            </p>
                        </div>

                        {/* Support */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('packages.support_247')}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                {t('packages.support_description')}
                            </p>
                            <div className="space-y-3">
                                <a href="mailto:support@devicehub.vn" className="flex items-center space-x-3 text-purple-600 dark:text-purple-400 hover:underline">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>support@devicehub.vn</span>
                                </a>
                                <a href="tel:1900xxxx" className="flex items-center space-x-3 text-purple-600 dark:text-purple-400 hover:underline">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span>1900 xxxx</span>
                                </a>
                            </div>
                        </div>

                        {/* Back Button */}
                        <Link
                            href="/packages"
                            className="flex items-center justify-center space-x-2 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold rounded-xl transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>{t('packages.back_to_list')}</span>
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
