import { useState } from 'react';
import { router, Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useToast } from '@/Components/Layout/ToastProvider';
import {
    PageHeader,
    SectionHeader,
    GlassCard,
    GlassCardStat,
    Badge,
    Button,
    DataList,
} from '@/Components/UI';

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

    const stats = [
        { label: 'Số file', value: usage?.file_count || 0, suffix: `/ ${currentPlan?.max_files || '∞'}` },
        { label: 'File tối đa', value: formatBytes(currentPlan?.max_file_size_bytes || 0) },
        { label: 'Giá/tháng', value: formatPrice(currentPlan?.price || 0) },
    ];

    return (
        <AppLayout title="Gói lưu trữ">
            <Head title="Gói lưu trữ" />
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1200px] mx-auto px-6 py-8">
                    {/* Header */}
                    <PageHeader
                        title="Gói lưu trữ Media"
                        subtitle="Quản lý dung lượng và nâng cấp gói của bạn"
                        backHref="/media"
                    />

                    {/* Current Usage Card */}
                    <GlassCard gradient="gray" hover={false} className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Gói hiện tại: {currentPlan?.name || 'Free'}
                                </h2>
                                <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {currentPlan?.description || 'Gói miễn phí cơ bản'}
                                </p>
                            </div>
                            <Badge variant="success" size="md">Đang sử dụng</Badge>
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
                            {stats.map((stat, i) => (
                                <div key={i} className={`p-4 rounded-lg ${isDark ? 'bg-[#222]' : 'bg-gray-50'}`}>
                                    <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {stat.label}
                                    </p>
                                    <p className={`text-2xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {stat.value}
                                        {stat.suffix && <span className="text-sm font-normal text-gray-500"> {stat.suffix}</span>}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    {/* Plans Grid */}
                    <SectionHeader title="Các gói có sẵn" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {plans?.map((plan) => {
                            const isCurrentPlan = currentPlan?.id === plan.id;
                            const isUpgrade = (plan.price || 0) > (currentPlan?.price || 0);

                            return (
                                <GlassCard
                                    key={plan.id}
                                    gradient={isCurrentPlan ? 'purple' : 'gray'}
                                    hover={!isCurrentPlan}
                                    className={isCurrentPlan ? (isDark ? 'ring-2 ring-emerald-500' : 'border-2 border-emerald-500') : ''}
                                >
                                    {/* Popular Badge */}
                                    {plan.slug === 'pro' && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <Badge variant="warning" size="sm">Phổ biến</Badge>
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
                                                <span className={`${isDark ? 'text-emerald-400' : 'text-emerald-500'}`}>✓</span>
                                                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Action Button */}
                                    {isCurrentPlan ? (
                                        <Button disabled variant="success" className="w-full">
                                            Gói hiện tại
                                        </Button>
                                    ) : isUpgrade ? (
                                        <Button onClick={() => setSelectedPlan(plan)} className="w-full">
                                            Nâng cấp
                                        </Button>
                                    ) : (
                                        <Button disabled variant="ghost" className="w-full">
                                            Gói thấp hơn
                                        </Button>
                                    )}
                                </GlassCard>
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
                    <GlassCard
                        gradient="gray"
                        hover={false}
                        className="w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Xác nhận nâng cấp
                        </h3>
                        <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Bạn muốn nâng cấp lên gói <strong className={isDark ? 'text-white' : 'text-gray-900'}>{selectedPlan.name}</strong>?
                        </p>

                        <DataList
                            items={[
                                { label: 'Dung lượng', value: formatBytes(selectedPlan.max_storage_bytes) },
                                { label: 'Số file tối đa', value: selectedPlan.max_files || 'Không giới hạn' },
                                { label: 'Giá', value: `${formatPrice(selectedPlan.price)}/tháng` },
                            ]}
                            className="mt-4"
                        />

                        <div className="flex gap-3 mt-6">
                            <Button
                                onClick={() => setSelectedPlan(null)}
                                disabled={isUpgrading}
                                variant="ghost"
                                className="flex-1"
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={() => handleUpgrade(selectedPlan)}
                                disabled={isUpgrading}
                                className="flex-1"
                            >
                                {isUpgrading ? 'Đang xử lý...' : 'Xác nhận nâng cấp'}
                            </Button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </AppLayout>
    );
}
