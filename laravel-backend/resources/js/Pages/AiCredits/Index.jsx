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
    const [customAmount, setCustomAmount] = useState('');

    const CREDIT_RATE = 500; // 500 VND = 1 credit

    const calculateCredits = (amount) => {
        const numAmount = parseFloat(amount) || 0;
        return Math.floor(numAmount / CREDIT_RATE);
    };

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

    const handleCustomPurchase = async () => {
        const credits = calculateCredits(customAmount);
        const amount = parseFloat(customAmount);

        if (amount < 10000) {
            addToast(t('ai_credits.custom_amount.min_amount_error', {
                defaultValue: 'Số tiền tối thiểu là 10,000 VND'
            }), 'error');
            return;
        }

        if (amount > walletBalance) {
            addToast(t('ai_credits.custom_amount.insufficient_balance', {
                defaultValue: 'Số dư ví không đủ'
            }), 'error');
            return;
        }

        const confirmed = await showConfirm({
            title: t('ai_credits.custom_amount.confirm_title', { defaultValue: 'Xác Nhận Mua Credits' }),
            message: `${t('ai_credits.custom_amount.confirm_message', {
                defaultValue: 'Bạn sẽ chi'
            })} ${formatCurrency(amount)} ${t('ai_credits.custom_amount.to_receive', {
                defaultValue: 'để nhận'
            })} ${formatNumber(credits)} credits. ${t('ai_credits.custom_amount.confirm_question', {
                defaultValue: 'Xác nhận?'
            })}`,
            type: 'info',
            confirmText: t('common.confirm', { defaultValue: 'Xác Nhận' }),
            cancelText: t('common.cancel', { defaultValue: 'Hủy' }),
        });

        if (!confirmed) return;

        setProcessing(true);
        router.post('/ai-credits/purchase-custom', {
            amount: amount,
            credits: credits,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                addToast(t('ai_credits.custom_amount.success', {
                    defaultValue: 'Đã mua credits thành công!'
                }), 'success');
                setCustomAmount('');
            },
            onError: (errors) => {
                addToast(errors.message || t('common.error', {
                    defaultValue: 'Có lỗi xảy ra'
                }), 'error');
            },
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

                    {/* Custom Amount Purchase */}
                    <div className="mb-8">
                        <SectionHeader
                            title={t('ai_credits.custom_amount.title', { defaultValue: 'Mua Theo Số Tiền Tùy Chỉnh' })}
                            subtitle={t('ai_credits.custom_amount.subtitle', {
                                defaultValue: 'Nhập số tiền bạn muốn chuyển đổi thành credits'
                            })}
                        />

                        <GlassCard className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Amount Input */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {t('ai_credits.custom_amount.amount_label', { defaultValue: 'Số Tiền (VND)' })}
                                    </label>
                                    <input
                                        type="number"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        min="10000"
                                        step="10000"
                                        className={`w-full px-4 py-3 rounded-lg border ${isDark
                                                ? 'bg-gray-800 border-gray-700 text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                            } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                                        placeholder="100,000"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {t('ai_credits.custom_amount.min_amount', { defaultValue: 'Tối thiểu: 10,000 VND' })}
                                    </p>
                                </div>

                                {/* Conversion Display */}
                                <div className={`rounded-lg p-4 ${isDark
                                        ? 'bg-gradient-to-br from-violet-900/20 to-purple-900/20'
                                        : 'bg-gradient-to-br from-violet-50 to-purple-50'
                                    }`}>
                                    <div className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('ai_credits.custom_amount.will_receive', { defaultValue: 'Bạn sẽ nhận được' })}
                                    </div>
                                    <div className={`text-3xl font-bold ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                                        {formatNumber(calculateCredits(customAmount))} Credits
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                        {t('ai_credits.custom_amount.rate', {
                                            defaultValue: 'Tỷ lệ: 500 VND = 1 Credit'
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Purchase Button */}
                            <Button
                                onClick={handleCustomPurchase}
                                disabled={!customAmount || parseFloat(customAmount) < 10000 || parseFloat(customAmount) > walletBalance || processing}
                                className="w-full mt-4"
                                variant="primary"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    {processing ? t('packages.processing') : t('ai_credits.custom_amount.purchase_button', {
                                        defaultValue: 'Mua Credits Ngay'
                                    })}
                                </span>
                            </Button>

                            {/* Error Message */}
                            {customAmount && parseFloat(customAmount) > walletBalance && (
                                <div className={`mt-3 p-3 rounded-lg text-sm ${isDark
                                        ? 'bg-red-900/20 text-red-400'
                                        : 'bg-red-50 text-red-600'
                                    }`}>
                                    {t('ai_credits.custom_amount.insufficient_balance', {
                                        defaultValue: 'Số dư ví không đủ. Vui lòng nạp thêm tiền.'
                                    })}
                                </div>
                            )}
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
