import { useState } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useToast } from '@/Components/Layout/ToastProvider';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import {
    PageHeader,
    SectionHeader,
    GlassCard,
    GlassCardStat,
    Badge,
    Button,
} from '@/Components/UI';

export default function AiCreditsIndex({ packages = [], currentCredits = 0, walletBalance = 0 }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { addToast } = useToast();
    const { showConfirm } = useConfirm();
    const isDark = theme === 'dark';
    const [processing, setProcessing] = useState(false);

    const handlePurchase = async (pkg) => {
        if (walletBalance < pkg.price) {
            addToast(t('ai_credits.insufficient_balance'), 'warning');
            return;
        }

        const confirmed = await showConfirm({
            title: t('ai_credits.confirm_purchase'),
            message: t('ai_credits.confirm_purchase_message', { credits: pkg.credits, price: pkg.formatted_price }),
            type: 'info',
            confirmText: t('ai_credits.buy_now'),
            cancelText: t('common.cancel'),
        });

        if (!confirmed) return;

        setProcessing(true);
        router.post('/ai-credits/purchase', {
            package_id: pkg.id,
            payment_method: 'wallet',
        }, {
            onFinish: () => setProcessing(false),
        });
    };

    const formatNumber = (num) => new Intl.NumberFormat('vi-VN').format(num);
    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);

    const usageInfo = [
        { icon: '🖼️', title: t('ai_studio.image_generation'), desc: t('ai_credits.cost_per_image') },
        { icon: '🎬', title: t('ai_studio.video_generation'), desc: t('ai_credits.cost_per_video') },
    ];

    return (
        <AppLayout title={t('ai_credits.title')}>
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1000px] mx-auto px-6 py-6">
                    {/* Header */}
                    <PageHeader
                        title={t('ai_credits.title')}
                        subtitle={t('ai_credits.description')}
                    />

                    {/* Balance Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <GlassCard gradient="purple" hover={false}>
                            <GlassCardStat
                                value={formatNumber(currentCredits)}
                                label={t('ai_credits.title')}
                            />
                        </GlassCard>
                        <GlassCard gradient="blue" hover={false}>
                            <GlassCardStat
                                value={formatCurrency(walletBalance)}
                                label={t('dashboard.stats.wallet_balance')}
                            />
                            <Button href="/topup" variant="ghost" size="sm" className="mt-2">
                                {t('topup.title')} →
                            </Button>
                        </GlassCard>
                    </div>

                    {/* Packages */}
                    <SectionHeader title={t('ai_credits.packages')} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {packages.map((pkg) => (
                            <GlassCard
                                key={pkg.id}
                                gradient={pkg.is_featured ? 'purple' : 'gray'}
                                hover
                                className={pkg.is_featured ? (isDark ? 'bg-white text-black' : 'bg-gray-900 text-white') : ''}
                            >
                                {pkg.badge && (
                                    <Badge
                                        variant={pkg.is_featured ? 'default' : 'purple'}
                                        size="sm"
                                        className="mb-2"
                                    >
                                        {pkg.badge}
                                    </Badge>
                                )}

                                <h3 className={`text-lg font-semibold ${pkg.is_featured ? '' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {pkg.name}
                                </h3>

                                <div className="mt-3 mb-4">
                                    <span className={`text-3xl font-semibold ${pkg.is_featured ? '' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {formatNumber(pkg.credits)}
                                    </span>
                                    <span className={`text-sm ml-1 opacity-60`}>
                                        credits
                                    </span>
                                </div>

                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className={`text-xl font-semibold ${pkg.is_featured ? '' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {pkg.formatted_price}
                                    </span>
                                    {pkg.original_price && (
                                        <span className="text-sm line-through opacity-40">
                                            {pkg.formatted_original_price}
                                        </span>
                                    )}
                                </div>

                                {pkg.discount_percent && (
                                    <p className={`text-sm mb-3 ${pkg.is_featured ? 'opacity-60' : 'text-emerald-500'}`}>
                                        {t('packages.save_percent', { percent: pkg.discount_percent })}
                                    </p>
                                )}

                                <Button
                                    onClick={() => handlePurchase(pkg)}
                                    disabled={processing}
                                    variant={pkg.is_featured ? (isDark ? 'secondary' : 'primary') : (isDark ? 'primary' : 'secondary')}
                                    className="w-full"
                                >
                                    {processing ? t('packages.processing') : t('ai_credits.buy_now')}
                                </Button>
                            </GlassCard>
                        ))}
                    </div>

                    {/* Usage Info */}
                    <GlassCard gradient="gray" hover={false}>
                        <SectionHeader title={t('ai_credits.credit_usage')} className="mb-0" />
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            {usageInfo.map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                                        <span>{item.icon}</span>
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</p>
                                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </AppLayout>
    );
}
