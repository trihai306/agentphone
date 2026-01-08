import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import LandingLayout from '../../Layouts/LandingLayout';

export default function Index({ packages = [], auth }) {
    const [billingPeriod, setBillingPeriod] = useState('monthly');
    const [selectedType, setSelectedType] = useState('all');

    const packageTypes = [
        { key: 'all', label: 'Tất cả', icon: 'grid' },
        { key: 'subscription', label: 'Thuê bao', icon: 'refresh' },
        { key: 'one_time', label: 'Mua một lần', icon: 'shopping-bag' },
        { key: 'credits', label: 'Gói Credits', icon: 'zap' },
    ];

    const filteredPackages = (packages || []).filter(pkg =>
        selectedType === 'all' || pkg.type === selectedType
    );

    const handleSelectPackage = (pkg) => {
        if (auth?.user) {
            router.visit(`/packages/${pkg.id}/subscribe`);
        } else {
            router.visit('/register', { data: { package_id: pkg.id } });
        }
    };

    return (
        <LandingLayout>
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                {/* Animated Background */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute top-0 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-40 left-20 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
                    <div className="text-center">
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/30 mb-6">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Giá cả minh bạch - Không phí ẩn
                        </span>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight">
                            Chọn gói phù hợp với
                            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                                nhu cầu của bạn
                            </span>
                        </h1>

                        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
                            Quản lý thiết bị thông minh, tự động hóa workflow, tiết kiệm thời gian.
                            Bắt đầu miễn phí - nâng cấp bất cứ lúc nào.
                        </p>

                        {/* Billing Toggle */}
                        <div className="inline-flex items-center p-1.5 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
                            <button
                                onClick={() => setBillingPeriod('monthly')}
                                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                                    billingPeriod === 'monthly'
                                        ? 'bg-white text-gray-900 shadow-lg'
                                        : 'text-gray-300 hover:text-white'
                                }`}
                            >
                                Hàng tháng
                            </button>
                            <button
                                onClick={() => setBillingPeriod('yearly')}
                                className={`relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                                    billingPeriod === 'yearly'
                                        ? 'bg-white text-gray-900 shadow-lg'
                                        : 'text-gray-300 hover:text-white'
                                }`}
                            >
                                Hàng năm
                                <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">
                                    -20%
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Package Type Filter */}
            <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center space-x-2 py-4 overflow-x-auto">
                        {packageTypes.map((type) => (
                            <button
                                key={type.key}
                                onClick={() => setSelectedType(type.key)}
                                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                                    selectedType === type.key
                                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                }`}
                            >
                                <TypeIcon type={type.icon} />
                                <span>{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="bg-gray-50 dark:bg-gray-900 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {filteredPackages.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredPackages.map((pkg, index) => (
                                <PricingCard
                                    key={pkg.id}
                                    package={pkg}
                                    billingPeriod={billingPeriod}
                                    onSelect={() => handleSelectPackage(pkg)}
                                    index={index}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Chưa có gói dịch vụ nào</h3>
                            <p className="text-gray-600 dark:text-gray-400">Vui lòng quay lại sau.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Features Comparison */}
            <div className="bg-white dark:bg-gray-800 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            So sánh tính năng
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-400">
                            Xem chi tiết tính năng của từng gói
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <ComparisonTable packages={filteredPackages} />
                    </div>
                </div>
            </div>

            {/* Trust Section */}
            <div className="bg-gray-50 dark:bg-gray-900 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <TrustItem icon="users" value="10,000+" label="Người dùng tin tưởng" />
                        <TrustItem icon="devices" value="50,000+" label="Thiết bị được quản lý" />
                        <TrustItem icon="uptime" value="99.9%" label="Uptime đảm bảo" />
                        <TrustItem icon="support" value="24/7" label="Hỗ trợ kỹ thuật" />
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white dark:bg-gray-800 py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Câu hỏi thường gặp
                        </h2>
                    </div>
                    <div className="space-y-4">
                        <FAQItem
                            question="Tôi có thể thay đổi gói sau khi đăng ký không?"
                            answer="Có, bạn có thể nâng cấp hoặc hạ cấp gói bất cứ lúc nào. Thay đổi sẽ được áp dụng ngay lập tức và phần chênh lệch sẽ được tính theo ngày sử dụng."
                        />
                        <FAQItem
                            question="Phương thức thanh toán nào được chấp nhận?"
                            answer="Chúng tôi chấp nhận thanh toán qua thẻ tín dụng/ghi nợ (Visa, MasterCard), chuyển khoản ngân hàng, và ví điện tử (MoMo, ZaloPay, VNPay)."
                        />
                        <FAQItem
                            question="Có thời gian dùng thử miễn phí không?"
                            answer="Có! Tất cả các gói đều có 14 ngày dùng thử miễn phí. Không cần nhập thẻ tín dụng để bắt đầu."
                        />
                        <FAQItem
                            question="Tôi có thể hủy đăng ký bất cứ lúc nào không?"
                            answer="Hoàn toàn có thể. Bạn có thể hủy đăng ký từ cài đặt tài khoản. Không có phí hủy và bạn vẫn được sử dụng đến hết chu kỳ thanh toán."
                        />
                        <FAQItem
                            question="Credits là gì và hoạt động như thế nào?"
                            answer="Credits là đơn vị để sử dụng các tính năng nâng cao như AI automation, batch processing. 1 credit = 1 action. Credits không hết hạn và có thể mua thêm bất cứ lúc nào."
                        />
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 py-20">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                        Bắt đầu miễn phí ngay hôm nay
                    </h2>
                    <p className="text-xl text-white/90 mb-8">
                        Tham gia cùng hàng ngàn người dùng đang quản lý thiết bị một cách thông minh
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="inline-flex items-center px-8 py-4 bg-white text-purple-600 font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <span>Dùng thử 14 ngày miễn phí</span>
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur text-white font-semibold rounded-2xl border border-white/30 hover:bg-white/20 transition-all duration-300"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>Liên hệ tư vấn</span>
                        </Link>
                    </div>
                </div>
            </div>
        </LandingLayout>
    );
}

function TypeIcon({ type }) {
    const icons = {
        grid: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
        refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
        'shopping-bag': "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
        zap: "M13 10V3L4 14h7v7l9-11h-7z",
    };

    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[type] || icons.grid} />
        </svg>
    );
}

function PricingCard({ package: pkg, billingPeriod, onSelect, index }) {
    const [showAllFeatures, setShowAllFeatures] = useState(false);
    const price = billingPeriod === 'yearly' && pkg.type === 'subscription'
        ? Math.floor(pkg.price * 0.8)
        : pkg.price;

    const monthlyPrice = pkg.type === 'subscription' ? price : null;
    const yearlyTotal = billingPeriod === 'yearly' && pkg.type === 'subscription' ? price * 12 : null;

    const typeLabels = {
        subscription: { label: 'Thuê bao', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        one_time: { label: 'Một lần', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
        credits: { label: 'Credits', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    };

    const typeInfo = typeLabels[pkg.type] || typeLabels.subscription;

    return (
        <div
            className={`group relative flex flex-col rounded-3xl transition-all duration-500 hover:-translate-y-2 ${
                pkg.is_featured
                    ? 'bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 p-[2px] shadow-2xl shadow-purple-500/30'
                    : 'bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl border border-gray-200 dark:border-gray-700'
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            {/* Inner container for featured cards */}
            <div className={`flex flex-col h-full rounded-[22px] ${pkg.is_featured ? 'bg-white dark:bg-gray-800' : ''}`}>
                {/* Badge */}
                {pkg.badge && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <span
                            className="px-4 py-1.5 rounded-full text-sm font-bold text-white shadow-lg"
                            style={{ backgroundColor: pkg.badge_color || '#8B5CF6' }}
                        >
                            {pkg.badge}
                        </span>
                    </div>
                )}

                <div className="flex-1 p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${typeInfo.color}`}>
                                {typeInfo.label}
                            </span>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
                                {pkg.name}
                            </h3>
                        </div>
                        {pkg.icon && (
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                                pkg.is_featured
                                    ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                                    : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600'
                            }`}>
                                <PackageIcon icon={pkg.icon} className={pkg.is_featured ? 'text-white' : 'text-gray-600 dark:text-gray-300'} />
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-2">
                        {pkg.description}
                    </p>

                    {/* Price */}
                    <div className="mb-6">
                        <div className="flex items-baseline gap-2">
                            {pkg.original_price && pkg.original_price > pkg.price && (
                                <span className="text-lg text-gray-400 line-through">
                                    {formatCurrency(pkg.original_price)}
                                </span>
                            )}
                            <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                                {formatCurrency(price)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-gray-500 dark:text-gray-400">
                                {pkg.type === 'subscription'
                                    ? `/${billingPeriod === 'yearly' ? 'tháng' : 'tháng'}`
                                    : pkg.type === 'credits'
                                        ? `cho ${pkg.credits} credits`
                                        : 'trọn đời'
                                }
                            </span>
                            {pkg.discount_percent && (
                                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-full">
                                    -{pkg.discount_percent}%
                                </span>
                            )}
                        </div>
                        {yearlyTotal && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {formatCurrency(yearlyTotal)}/năm khi thanh toán hàng năm
                            </p>
                        )}
                    </div>

                    {/* Key Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {pkg.max_devices && (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {pkg.max_devices === -1 ? 'Không giới hạn' : `${pkg.max_devices} thiết bị`}
                                </span>
                            </div>
                        )}
                        {pkg.duration_days && pkg.type === 'subscription' && (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {pkg.duration_days} ngày
                                </span>
                            </div>
                        )}
                        {pkg.credits && (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {pkg.credits.toLocaleString()} credits
                                </span>
                            </div>
                        )}
                        {pkg.is_trial && (
                            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                    {pkg.trial_days} ngày dùng thử
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Features */}
                    {pkg.features && pkg.features.length > 0 && (
                        <div className="space-y-3 mb-6">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                                Tính năng bao gồm
                            </h4>
                            <ul className="space-y-2">
                                {(showAllFeatures ? pkg.features : pkg.features.slice(0, 5)).map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            {pkg.features.length > 5 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowAllFeatures(!showAllFeatures);
                                    }}
                                    className="flex items-center gap-1.5 ml-8 text-sm text-purple-600 dark:text-purple-400 font-medium hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                                >
                                    <span>{showAllFeatures ? 'Ẩn bớt' : `+${pkg.features.length - 5} tính năng khác`}</span>
                                    <svg
                                        className={`w-4 h-4 transition-transform duration-300 ${showAllFeatures ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* CTA Button */}
                <div className="p-8 pt-0">
                    <button
                        onClick={onSelect}
                        className={`w-full py-4 px-6 rounded-2xl font-bold text-center transition-all duration-300 ${
                            pkg.is_featured
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-0.5'
                                : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                        }`}
                    >
                        {pkg.is_trial ? 'Bắt đầu dùng thử' : pkg.price === 0 ? 'Bắt đầu miễn phí' : 'Chọn gói này'}
                    </button>

                    {pkg.active_subscribers > 0 && (
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{pkg.active_subscribers}</span> người đang sử dụng
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function PackageIcon({ icon, className = '' }) {
    const icons = {
        rocket: "M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z",
        star: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
        crown: "M5 3l3.057 4.073 4.943-4.073 4.943 4.073L21 3v16a2 2 0 01-2 2H5a2 2 0 01-2-2V3z",
        zap: "M13 10V3L4 14h7v7l9-11h-7z",
        shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
        default: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    };

    return (
        <svg className={`w-7 h-7 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon] || icons.default} />
        </svg>
    );
}

function ComparisonTable({ packages }) {
    if (!packages || packages.length === 0) return null;

    // Collect all unique features
    const allFeatures = [...new Set(packages.flatMap(pkg => pkg.features || []))];

    return (
        <table className="w-full min-w-[800px]">
            <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Tính năng
                    </th>
                    {packages.slice(0, 4).map((pkg) => (
                        <th key={pkg.id} className="py-4 px-6 text-center">
                            <div className="font-bold text-gray-900 dark:text-white">{pkg.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {formatCurrency(pkg.price)}/{pkg.type === 'subscription' ? 'tháng' : 'lần'}
                            </div>
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                    <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">Số thiết bị tối đa</td>
                    {packages.slice(0, 4).map((pkg) => (
                        <td key={pkg.id} className="py-4 px-6 text-center font-medium text-gray-900 dark:text-white">
                            {pkg.max_devices === -1 ? 'Không giới hạn' : pkg.max_devices || '-'}
                        </td>
                    ))}
                </tr>
                <tr>
                    <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">Credits hàng tháng</td>
                    {packages.slice(0, 4).map((pkg) => (
                        <td key={pkg.id} className="py-4 px-6 text-center font-medium text-gray-900 dark:text-white">
                            {pkg.credits ? pkg.credits.toLocaleString() : '-'}
                        </td>
                    ))}
                </tr>
                {allFeatures.slice(0, 8).map((feature, idx) => (
                    <tr key={idx}>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{feature}</td>
                        {packages.slice(0, 4).map((pkg) => (
                            <td key={pkg.id} className="py-4 px-6 text-center">
                                {pkg.features?.includes(feature) ? (
                                    <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function TrustItem({ icon, value, label }) {
    const icons = {
        users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
        devices: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
        uptime: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
        support: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z",
    };

    return (
        <div className="group">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
                </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
        </div>
    );
}

function FAQItem({ question, answer }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <span className="font-semibold text-gray-900 dark:text-white pr-4">{question}</span>
                <svg
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className={`transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                <div className="px-6 pb-5">
                    <p className="text-gray-600 dark:text-gray-400">{answer}</p>
                </div>
            </div>
        </div>
    );
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);
}
