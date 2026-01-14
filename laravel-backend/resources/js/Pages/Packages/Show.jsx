import { Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Show({ package: pkg = {} }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: pkg.currency || 'VND',
    }).format(price);

    const handleSubscribe = () => router.visit(`/packages/${pkg.id}/subscribe`);

    return (
        <AppLayout title={pkg.name || 'Package Details'}>
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[900px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
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
                                {pkg.name}
                            </h1>
                            {pkg.badge && (
                                <span className={`text-xs font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                                    {pkg.badge}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Price Card */}
                            <div className={`p-6 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {formatPrice(pkg.price)}
                                    </span>
                                    {pkg.duration_days && (
                                        <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            / {pkg.duration_days} days
                                        </span>
                                    )}
                                </div>

                                {pkg.original_price && pkg.original_price > pkg.price && (
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className={`text-lg line-through ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                            {formatPrice(pkg.original_price)}
                                        </span>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                                            Save {pkg.discount_percent}%
                                        </span>
                                    </div>
                                )}

                                <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {pkg.description}
                                </p>

                                {/* Stats */}
                                <div className={`grid grid-cols-3 gap-4 p-4 rounded-lg mb-6 ${isDark ? 'bg-[#222]' : 'bg-gray-50'}`}>
                                    {pkg.credits && (
                                        <div className="text-center">
                                            <p className={`text-xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                                                {pkg.credits.toLocaleString()}
                                            </p>
                                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Credits</p>
                                        </div>
                                    )}
                                    {pkg.max_devices && (
                                        <div className="text-center">
                                            <p className={`text-xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                                {pkg.max_devices === -1 ? '∞' : pkg.max_devices}
                                            </p>
                                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Devices</p>
                                        </div>
                                    )}
                                    {pkg.duration_days && (
                                        <div className="text-center">
                                            <p className={`text-xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                {pkg.duration_days}
                                            </p>
                                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Days</p>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleSubscribe}
                                    className={`w-full py-3 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                        }`}
                                >
                                    Subscribe Now
                                </button>
                            </div>

                            {/* Features */}
                            {pkg.features?.length > 0 && (
                                <div className={`p-6 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                    <h2 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Features</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                        {/* Sidebar */}
                        <div className="space-y-4">
                            <div className={`p-4 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                <h3 className={`text-xs font-medium mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Info</h3>
                                <div className="space-y-2">
                                    {pkg.code && (
                                        <div className="flex justify-between">
                                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Code</span>
                                            <span className={`text-sm font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>{pkg.code}</span>
                                        </div>
                                    )}
                                    {pkg.type && (
                                        <div className="flex justify-between">
                                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Type</span>
                                            <span className={`text-sm capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{pkg.type.replace('_', ' ')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={`p-4 rounded-xl ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    <span className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Money Back Guarantee</span>
                                </div>
                                <p className={`text-xs ${isDark ? 'text-emerald-300/70' : 'text-emerald-600'}`}>
                                    7-day refund if not satisfied
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
