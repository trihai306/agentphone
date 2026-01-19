import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useToast } from '@/Components/Layout/ToastProvider';

export default function StoragePlans({ currentPlan, plans, usage }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { addToast } = useToast();
    const isDark = theme === 'dark';
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [isUpgrading, setIsUpgrading] = useState(false);

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
        if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
        if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return bytes + ' B';
    };

    const formatPrice = (price) => {
        if (price === 0) return 'Miễn phí';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(price);
    };

    const usagePercent = currentPlan?.max_storage_bytes
        ? Math.min((usage?.storage_used || 0) / currentPlan.max_storage_bytes * 100, 100)
        : 0;

    const handleUpgrade = async (plan) => {
        setIsUpgrading(true);
        router.post('/media/storage-plans/upgrade', { plan_id: plan.id }, {
            onSuccess: () => {
                addToast('Đã nâng cấp gói thành công!', 'success');
                setSelectedPlan(null);
            },
            onError: () => {
                addToast('Không thể nâng cấp. Vui lòng thử lại.', 'error');
            },
            onFinish: () => setIsUpgrading(false),
        });
    };

    return (
        <AppLayout title="Gói lưu trữ">
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1200px] mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Link
                                    href="/media"
                                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#1a1a1a] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </Link>
                                <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Gói lưu trữ Media
                                </h1>
                            </div>
                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Quản lý dung lượng và nâng cấp gói của bạn
                            </p>
                        </div>
                    </div>

                    {/* Current Usage Card */}
                    <div className={`p-6 rounded-xl mb-8 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Gói hiện tại: {currentPlan?.name || 'Free'}
                                </h2>
                                <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {currentPlan?.description || 'Gói miễn phí cơ bản'}
                                </p>
                            </div>
                            <div className={`px-4 py-2 rounded-lg ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                <span className="text-sm font-medium">Đang sử dụng</span>
                            </div>
                        </div>

                        {/* Usage Progress */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Dung lượng đã dùng
                                </span>
                                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {formatBytes(usage?.storage_used || 0)} / {formatBytes(currentPlan?.max_storage_bytes || 0)}
                                </span>
                            </div>
                            <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                                <div
                                    className={`h-full rounded-full transition-all ${usagePercent > 90
                                            ? 'bg-red-500'
                                            : usagePercent > 70
                                                ? 'bg-amber-500'
                                                : isDark ? 'bg-emerald-500' : 'bg-emerald-600'
                                        }`}
                                    style={{ width: `${usagePercent}%` }}
                                />
                            </div>
                            {usagePercent > 70 && (
                                <p className={`mt-2 text-xs ${usagePercent > 90 ? 'text-red-400' : 'text-amber-400'}`}>
                                    {usagePercent > 90
                                        ? '⚠️ Dung lượng sắp hết! Nâng cấp ngay để tiếp tục upload.'
                                        : '⚡ Dung lượng đang sử dụng hơn 70%. Cân nhắc nâng cấp gói.'}
                                </p>
                            )}
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className={`p-4 rounded-lg ${isDark ? 'bg-[#222]' : 'bg-gray-50'}`}>
                                <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Số file
                                </p>
                                <p className={`text-2xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {usage?.file_count || 0} <span className="text-sm font-normal text-gray-500">/ {currentPlan?.max_files || '∞'}</span>
                                </p>
                            </div>
                            <div className={`p-4 rounded-lg ${isDark ? 'bg-[#222]' : 'bg-gray-50'}`}>
                                <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    File tối đa
                                </p>
                                <p className={`text-2xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {formatBytes(currentPlan?.max_file_size_bytes || 0)}
                                </p>
                            </div>
                            <div className={`p-4 rounded-lg ${isDark ? 'bg-[#222]' : 'bg-gray-50'}`}>
                                <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Giá/tháng
                                </p>
                                <p className={`text-2xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {formatPrice(currentPlan?.price || 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Plans Grid */}
                    <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Các gói có sẵn
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {plans?.map((plan) => {
                            const isCurrentPlan = currentPlan?.id === plan.id;
                            const isUpgrade = (plan.price || 0) > (currentPlan?.price || 0);

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative p-6 rounded-xl transition-all ${isCurrentPlan
                                            ? isDark
                                                ? 'bg-[#1a1a1a] ring-2 ring-emerald-500'
                                                : 'bg-white border-2 border-emerald-500'
                                            : isDark
                                                ? 'bg-[#1a1a1a] hover:bg-[#222]'
                                                : 'bg-white border border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {/* Popular Badge */}
                                    {plan.slug === 'pro' && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${isDark ? 'bg-amber-500 text-black' : 'bg-amber-500 text-white'
                                                }`}>
                                                Phổ biến
                                            </span>
                                        </div>
                                    )}

                                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {plan.name}
                                    </h3>
                                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {plan.description}
                                    </p>

                                    <div className="mt-4 mb-6">
                                        <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {formatPrice(plan.price)}
                                        </span>
                                        {plan.price > 0 && (
                                            <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>/tháng</span>
                                        )}
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-2 mb-6">
                                        {plan.features?.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Action Button */}
                                    {isCurrentPlan ? (
                                        <button
                                            disabled
                                            className={`w-full py-2.5 rounded-lg text-sm font-medium ${isDark
                                                    ? 'bg-emerald-900/30 text-emerald-400'
                                                    : 'bg-emerald-50 text-emerald-600'
                                                }`}
                                        >
                                            Gói hiện tại
                                        </button>
                                    ) : isUpgrade ? (
                                        <button
                                            onClick={() => setSelectedPlan(plan)}
                                            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${isDark
                                                    ? 'bg-white text-black hover:bg-gray-100'
                                                    : 'bg-gray-900 text-white hover:bg-gray-800'
                                                }`}
                                        >
                                            Nâng cấp
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className={`w-full py-2.5 rounded-lg text-sm font-medium ${isDark
                                                    ? 'bg-[#222] text-gray-500'
                                                    : 'bg-gray-100 text-gray-400'
                                                }`}
                                        >
                                            Gói thấp hơn
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Upgrade Confirmation Modal */}
            {selectedPlan && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => !isUpgrading && setSelectedPlan(null)}
                >
                    <div
                        className={`w-full max-w-md p-6 rounded-2xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Xác nhận nâng cấp
                        </h3>
                        <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Bạn muốn nâng cấp lên gói <strong className={isDark ? 'text-white' : 'text-gray-900'}>{selectedPlan.name}</strong>?
                        </p>

                        <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-[#222]' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Dung lượng</span>
                                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {formatBytes(selectedPlan.max_storage_bytes)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Số file tối đa</span>
                                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {selectedPlan.max_files || 'Không giới hạn'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Giá</span>
                                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {formatPrice(selectedPlan.price)}/tháng
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setSelectedPlan(null)}
                                disabled={isUpgrading}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${isDark
                                        ? 'bg-[#222] text-gray-300 hover:bg-[#2a2a2a]'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => handleUpgrade(selectedPlan)}
                                disabled={isUpgrading}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${isDark
                                        ? 'bg-white text-black hover:bg-gray-100'
                                        : 'bg-gray-900 text-white hover:bg-gray-800'
                                    } disabled:opacity-50`}
                            >
                                {isUpgrading ? 'Đang xử lý...' : 'Xác nhận nâng cấp'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
