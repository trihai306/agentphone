import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/Components/Layout/ToastProvider';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { Icon } from '@/Components/UI';

export default function Index({
    creditPackages = [],
    aiCreditPackages = [],
    recentTopups = [],
    currentBalance = 0,
    walletBalance = 0,
    aiCredits = 0
}) {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const { addToast } = useToast();
    const { showConfirm } = useConfirm();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState('wallet'); // wallet, xu, credits
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [customXuAmount, setCustomXuAmount] = useState('');
    const [customCreditAmount, setCustomCreditAmount] = useState('');

    // Constants
    const XU_RATE = 100; // 100 VND = 1 Xu
    const CREDIT_RATE = 500; // 500 VND = 1 Credit

    // Calculate conversions
    const toXu = (vnd) => Math.floor((vnd || 0) / XU_RATE);
    const toCredits = (vnd) => Math.floor((vnd || 0) / CREDIT_RATE);
    const currentXu = toXu(walletBalance);

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);

    const formatNumber = (num) => new Intl.NumberFormat('vi-VN').format(num);

    // Handle wallet topup
    const handleWalletTopup = (pkg) => {
        setSelectedPackage(pkg.id);
        setProcessing(true);
        router.post('/topup/checkout', { package_id: pkg.id });
    };

    // Handle Xu purchase from wallet
    const handleXuPurchase = async () => {
        const amount = parseFloat(customXuAmount);
        const xu = toXu(amount);

        if (amount < 10000) {
            addToast(t('topup.min_amount_error', 'Số tiền tối thiểu là 10,000 VND'), 'error');
            return;
        }

        if (amount > walletBalance) {
            addToast(t('topup.insufficient_balance', 'Số dư ví không đủ'), 'error');
            return;
        }

        const confirmed = await showConfirm({
            title: t('topup.confirm_buy_xu', 'Xác Nhận Mua Xu'),
            message: `${t('topup.will_spend', 'Bạn sẽ chi')} ${formatCurrency(amount)} ${t('topup.to_receive', 'để nhận')} ${formatNumber(xu)} Xu. ${t('topup.confirm_question', 'Xác nhận?')}`,
            type: 'info',
            confirmText: t('common.confirm', 'Xác Nhận'),
            cancelText: t('common.cancel', 'Hủy'),
        });

        if (!confirmed) return;

        setProcessing(true);
        router.post('/topup/purchase-xu', { amount }, {
            preserveScroll: true,
            onSuccess: () => {
                addToast(t('topup.xu_purchase_success', 'Đã mua Xu thành công!'), 'success');
                setCustomXuAmount('');
            },
            onError: (errors) => addToast(errors.message || t('common.error', 'Có lỗi xảy ra'), 'error'),
            onFinish: () => setProcessing(false),
        });
    };

    // Handle AI Credits purchase from wallet
    const handleCreditPurchase = async (pkg) => {
        if (walletBalance < pkg.price) {
            addToast(t('topup.insufficient_balance', 'Số dư ví không đủ'), 'warning');
            return;
        }

        const confirmed = await showConfirm({
            title: t('topup.confirm_buy_credits', 'Xác Nhận Mua Credits'),
            message: `${t('topup.will_spend', 'Bạn sẽ chi')} ${pkg.formatted_price} ${t('topup.to_receive', 'để nhận')} ${formatNumber(pkg.credits)} Credits. ${t('topup.confirm_question', 'Xác nhận?')}`,
            type: 'info',
            confirmText: t('topup.buy_now', 'Mua Ngay'),
            cancelText: t('common.cancel', 'Hủy'),
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

    // Handle custom credit purchase
    const handleCustomCreditPurchase = async () => {
        const amount = parseFloat(customCreditAmount);
        const credits = toCredits(amount);

        if (amount < 10000) {
            addToast(t('topup.min_amount_error', 'Số tiền tối thiểu là 10,000 VND'), 'error');
            return;
        }

        if (amount > walletBalance) {
            addToast(t('topup.insufficient_balance', 'Số dư ví không đủ'), 'error');
            return;
        }

        const confirmed = await showConfirm({
            title: t('topup.confirm_buy_credits', 'Xác Nhận Mua Credits'),
            message: `${t('topup.will_spend', 'Bạn sẽ chi')} ${formatCurrency(amount)} ${t('topup.to_receive', 'để nhận')} ${formatNumber(credits)} Credits. ${t('topup.confirm_question', 'Xác nhận?')}`,
            type: 'info',
            confirmText: t('common.confirm', 'Xác Nhận'),
            cancelText: t('common.cancel', 'Hủy'),
        });

        if (!confirmed) return;

        setProcessing(true);
        router.post('/ai-credits/purchase-custom', { amount, credits }, {
            preserveScroll: true,
            onSuccess: () => {
                addToast(t('topup.credits_purchase_success', 'Đã mua Credits thành công!'), 'success');
                setCustomCreditAmount('');
            },
            onError: (errors) => addToast(errors.message || t('common.error', 'Có lỗi xảy ra'), 'error'),
            onFinish: () => setProcessing(false),
        });
    };

    const tabs = [
        { id: 'wallet', label: t('topup.tab_wallet', 'Nạp Ví'), icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', color: 'emerald' },
        { id: 'xu', label: t('topup.tab_xu', 'Mua Xu'), icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'amber' },
        { id: 'credits', label: t('topup.tab_credits', 'Mua Credits'), icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'purple' },
    ];

    const packageColors = [
        { from: 'from-blue-500', to: 'to-cyan-500', shadow: 'shadow-blue-500/25' },
        { from: 'from-emerald-500', to: 'to-teal-500', shadow: 'shadow-emerald-500/25' },
        { from: 'from-violet-500', to: 'to-purple-600', shadow: 'shadow-violet-500/25' },
        { from: 'from-amber-500', to: 'to-orange-500', shadow: 'shadow-amber-500/25' },
        { from: 'from-pink-500', to: 'to-rose-500', shadow: 'shadow-pink-500/25' },
    ];

    return (
        <AppLayout title={t('topup.title')}>
            <Head title={t('topup.title')} />

            <div className={`min-h-screen ${isDark ? 'bg-[#09090b]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
                {/* Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-200/50'}`} />
                    <div className={`absolute bottom-0 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-amber-900/20' : 'bg-amber-200/40'}`} />
                </div>

                <div className="relative max-w-[1200px] mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {t('topup.page_title', 'Nạp Tiền & Mua Xu/Credits')}
                                </h1>
                                <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {t('topup.page_description', 'Nạp tiền vào ví, mua Xu cho Nhiệm Vụ hoặc Credits cho AI Studio')}
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/topup/history"
                            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl border transition-all ${isDark
                                ? 'border-white/10 text-gray-300 hover:bg-white/5'
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {t('topup.history', 'Lịch sử')}
                        </Link>
                    </div>

                    {/* Balance Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {/* Wallet Balance */}
                        <div className={`relative overflow-hidden p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-lg'}`}>
                            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20" />
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('topup.wallet_balance', 'Ví tiền')}</span>
                                </div>
                                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(walletBalance)}
                                </p>
                            </div>
                        </div>

                        {/* Xu Balance */}
                        <div className={`relative overflow-hidden p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-lg'}`}>
                            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20" />
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('topup.xu_tasks', 'Xu (Nhiệm Vụ)')}</span>
                                </div>
                                <p className={`text-2xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                    {formatNumber(currentXu)} Xu
                                </p>
                                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    1 Xu = 100đ
                                </p>
                            </div>
                        </div>

                        {/* AI Credits Balance */}
                        <div className={`relative overflow-hidden p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-lg'}`}>
                            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl bg-gradient-to-br from-purple-500/20 to-violet-500/20" />
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>AI Credits</span>
                                </div>
                                <p className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                                    {formatNumber(aiCredits)}
                                </p>
                                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    500đ = 1 Credit
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className={`inline-flex p-1.5 rounded-2xl mb-8 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                                    ? `bg-gradient-to-r ${tab.color === 'emerald' ? 'from-emerald-500 to-teal-500' :
                                        tab.color === 'amber' ? 'from-amber-500 to-orange-500' :
                                            'from-purple-500 to-violet-600'
                                    } text-white shadow-lg`
                                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                                </svg>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'wallet' && (
                        <div>
                            <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('topup.choose_package', 'Chọn gói nạp tiền')}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {creditPackages.map((pkg, index) => {
                                    const color = packageColors[index % packageColors.length];
                                    const isSelected = selectedPackage === pkg.id;

                                    return (
                                        <button
                                            key={pkg.id}
                                            onClick={() => handleWalletTopup(pkg)}
                                            disabled={processing}
                                            className={`group relative overflow-hidden text-left rounded-2xl border transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 ${pkg.popular
                                                ? `bg-gradient-to-br ${color.from} ${color.to} border-transparent shadow-xl ${color.shadow}`
                                                : isDark
                                                    ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                                    : 'bg-white border-gray-200 hover:border-gray-300 shadow-lg'
                                                }`}
                                        >
                                            {pkg.popular && (
                                                <div className="absolute top-4 right-4">
                                                    <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm">
                                                        {t('topup.popular', 'PHỔ BIẾN')}
                                                    </span>
                                                </div>
                                            )}

                                            {pkg.bonus > 0 && !pkg.popular && (
                                                <div className="absolute top-4 right-4">
                                                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                                        +{Math.round((pkg.bonus / pkg.price) * 100)}%
                                                    </span>
                                                </div>
                                            )}

                                            <div className="p-6">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${pkg.popular ? 'bg-white/20' : `bg-gradient-to-br ${color.from} ${color.to} shadow-lg`
                                                    }`}>
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                    </svg>
                                                </div>

                                                <h3 className={`text-xl font-bold ${pkg.popular ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {pkg.name}
                                                </h3>

                                                <div className="mt-3">
                                                    <span className={`text-3xl font-bold ${pkg.popular ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {formatCurrency(pkg.price)}
                                                    </span>
                                                </div>

                                                {pkg.bonus > 0 && (
                                                    <div className={`mt-3 flex items-center gap-2`}>
                                                        <svg className={`w-4 h-4 ${pkg.popular ? 'text-white' : 'text-emerald-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                                        </svg>
                                                        <span className={`text-sm font-medium ${pkg.popular ? 'text-white' : isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                            Bonus: +{formatCurrency(pkg.bonus)}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className={`mt-4 pt-4 border-t ${pkg.popular ? 'border-white/20' : isDark ? 'border-white/10' : 'border-gray-100'}`}>
                                                    <div className="flex justify-between items-center">
                                                        <span className={`text-sm ${pkg.popular ? 'text-white/70' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            {t('topup.you_receive', 'Nhận được')}
                                                        </span>
                                                        <span className={`text-lg font-bold ${pkg.popular ? 'text-white' : isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                            {formatCurrency(pkg.price + (pkg.bonus || 0))}
                                                        </span>
                                                    </div>
                                                </div>

                                                {isSelected && processing && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl">
                                                        <div className="flex items-center gap-2 text-white">
                                                            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                            </svg>
                                                            <span className="text-sm font-medium">{t('common.processing', 'Đang xử lý...')}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Payment Methods */}
                            <div className={`mt-8 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-lg'}`}>
                                <h3 className={`text-sm font-medium uppercase tracking-wider mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {t('topup.payment_methods', 'Phương thức thanh toán')}
                                </h3>
                                <div className="flex flex-wrap gap-4">
                                    {[t('topup.bank_transfer', 'Chuyển khoản ngân hàng'), 'MoMo', 'VNPay', 'ZaloPay'].map((method, i) => (
                                        <div key={i} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                            <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{method}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'xu' && (
                        <div>
                            <div className={`p-8 rounded-2xl border mb-8 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-lg'}`}>
                                <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {t('topup.buy_xu_from_wallet', 'Mua Xu từ Ví')}
                                </h2>
                                <p className={`text-sm mb-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {t('topup.xu_description', 'Xu dùng để thanh toán cho Nhiệm Vụ • 1 Xu = 100đ')}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Input */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {t('topup.amount_vnd', 'Số tiền (VND)')}
                                        </label>
                                        <input
                                            type="number"
                                            value={customXuAmount}
                                            onChange={(e) => setCustomXuAmount(e.target.value)}
                                            min="10000"
                                            step="10000"
                                            className={`w-full px-4 py-3 rounded-xl border ${isDark
                                                ? 'bg-white/5 border-white/10 text-white'
                                                : 'bg-gray-50 border-gray-200 text-gray-900'
                                                } focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                                            placeholder="100,000"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">{t('topup.min_10k', 'Tối thiểu: 10,000 VND')}</p>

                                        {/* Quick amounts */}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {[50000, 100000, 200000, 500000].map((amt) => (
                                                <button
                                                    key={amt}
                                                    onClick={() => setCustomXuAmount(String(amt))}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isDark
                                                        ? 'bg-white/5 text-gray-300 hover:bg-white/10'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {formatNumber(amt)}đ
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Result */}
                                    <div className={`rounded-xl p-6 ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                                        <div className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {t('topup.you_will_receive', 'Bạn sẽ nhận được')}
                                        </div>
                                        <div className={`text-4xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                            {formatNumber(toXu(parseFloat(customXuAmount) || 0))} Xu
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            {t('topup.xu_rate', 'Tỷ lệ: 100 VND = 1 Xu')}
                                        </div>
                                    </div>
                                </div>

                                {/* Purchase button */}
                                <button
                                    onClick={handleXuPurchase}
                                    disabled={!customXuAmount || parseFloat(customXuAmount) < 10000 || parseFloat(customXuAmount) > walletBalance || processing}
                                    className={`w-full mt-6 py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isDark
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/25'
                                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg'
                                        }`}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {processing ? t('common.processing', 'Đang xử lý...') : t('topup.buy_xu_now', 'Mua Xu Ngay')}
                                    </span>
                                </button>

                                {customXuAmount && parseFloat(customXuAmount) > walletBalance && (
                                    <div className={`mt-4 p-4 rounded-xl text-sm ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
                                        {t('topup.insufficient_balance_message', 'Số dư ví không đủ. Vui lòng nạp thêm tiền.')}
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-100'}`}>
                                <h4 className={`font-semibold mb-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                                    {t('topup.xu_info_title', 'Xu dùng để làm gì?')}
                                </h4>
                                <ul className={`text-sm space-y-2 ${isDark ? 'text-amber-300/70' : 'text-amber-600/80'}`}>
                                    <li>• {t('topup.xu_info_1', 'Thanh toán thưởng cho người nhận Nhiệm Vụ')}</li>
                                    <li>• {t('topup.xu_info_2', 'Mua các gói dịch vụ trên Marketplace')}</li>
                                    <li>• {t('topup.xu_info_3', 'Chi phí khi tạo và đăng Nhiệm Vụ')}</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeTab === 'credits' && (
                        <div>
                            {/* Custom Amount */}
                            <div className={`p-8 rounded-2xl border mb-8 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-lg'}`}>
                                <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {t('topup.buy_custom_credits', 'Mua Credits Tùy Chỉnh')}
                                </h2>
                                <p className={`text-sm mb-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {t('topup.credits_description', 'Credits dùng cho AI Studio (tạo ảnh, video) • 500đ = 1 Credit')}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Input */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {t('topup.amount_vnd', 'Số tiền (VND)')}
                                        </label>
                                        <input
                                            type="number"
                                            value={customCreditAmount}
                                            onChange={(e) => setCustomCreditAmount(e.target.value)}
                                            min="10000"
                                            step="10000"
                                            className={`w-full px-4 py-3 rounded-xl border ${isDark
                                                ? 'bg-white/5 border-white/10 text-white'
                                                : 'bg-gray-50 border-gray-200 text-gray-900'
                                                } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                                            placeholder="100,000"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">{t('topup.min_10k', 'Tối thiểu: 10,000 VND')}</p>

                                        {/* Quick amounts */}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {[50000, 100000, 200000, 500000].map((amt) => (
                                                <button
                                                    key={amt}
                                                    onClick={() => setCustomCreditAmount(String(amt))}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isDark
                                                        ? 'bg-white/5 text-gray-300 hover:bg-white/10'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {formatNumber(amt)}đ
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Result */}
                                    <div className={`rounded-xl p-6 ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                                        <div className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {t('topup.you_will_receive', 'Bạn sẽ nhận được')}
                                        </div>
                                        <div className={`text-4xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                                            {formatNumber(toCredits(parseFloat(customCreditAmount) || 0))} Credits
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            {t('topup.credit_rate', 'Tỷ lệ: 500 VND = 1 Credit')}
                                        </div>
                                    </div>
                                </div>

                                {/* Purchase button */}
                                <button
                                    onClick={handleCustomCreditPurchase}
                                    disabled={!customCreditAmount || parseFloat(customCreditAmount) < 10000 || parseFloat(customCreditAmount) > walletBalance || processing}
                                    className={`w-full mt-6 py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isDark
                                        ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:shadow-lg hover:shadow-purple-500/25'
                                        : 'bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:shadow-lg'
                                        }`}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        {processing ? t('common.processing', 'Đang xử lý...') : t('topup.buy_credits_now', 'Mua Credits Ngay')}
                                    </span>
                                </button>

                                {customCreditAmount && parseFloat(customCreditAmount) > walletBalance && (
                                    <div className={`mt-4 p-4 rounded-xl text-sm ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
                                        {t('topup.insufficient_balance_message', 'Số dư ví không đủ. Vui lòng nạp thêm tiền.')}
                                    </div>
                                )}
                            </div>

                            {/* Credit Packages */}
                            {aiCreditPackages.length > 0 && (
                                <>
                                    <h2 className={`text-lg font-semibold mb-5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {t('topup.or_choose_package', 'Hoặc chọn gói có sẵn')}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                        {aiCreditPackages.map((pkg) => (
                                            <div
                                                key={pkg.id}
                                                className={`relative p-6 rounded-2xl border transition-all hover:scale-[1.02] ${pkg.is_featured
                                                    ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                                                    : isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-lg'
                                                    }`}
                                            >
                                                {pkg.badge && (
                                                    <span className={`absolute top-4 right-4 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${pkg.is_featured ? 'bg-black/20 text-white' : 'bg-purple-500/10 text-purple-500'
                                                        }`}>
                                                        {pkg.badge}
                                                    </span>
                                                )}

                                                <h3 className={`text-lg font-semibold ${pkg.is_featured ? '' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {pkg.name}
                                                </h3>

                                                <div className="mt-3 mb-4">
                                                    <span className={`text-3xl font-bold`}>
                                                        {formatNumber(pkg.credits)}
                                                    </span>
                                                    <span className="text-sm ml-1 opacity-60">credits</span>
                                                </div>

                                                <div className="flex items-baseline gap-2 mb-4">
                                                    <span className={`text-xl font-semibold`}>
                                                        {pkg.formatted_price}
                                                    </span>
                                                    {pkg.original_price && (
                                                        <span className="text-sm line-through opacity-40">
                                                            {pkg.formatted_original_price}
                                                        </span>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => handleCreditPurchase(pkg)}
                                                    disabled={processing || walletBalance < pkg.price}
                                                    className={`w-full py-3 rounded-xl font-medium transition-all disabled:opacity-50 ${pkg.is_featured
                                                        ? isDark ? 'bg-black text-white' : 'bg-white text-black'
                                                        : 'bg-gradient-to-r from-purple-500 to-violet-600 text-white'
                                                        }`}
                                                >
                                                    {processing ? t('common.processing', 'Đang xử lý...') : t('topup.buy_now', 'Mua Ngay')}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Info */}
                            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-purple-500/5 border-purple-500/20' : 'bg-purple-50 border-purple-100'}`}>
                                <h4 className={`font-semibold mb-2 ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                                    {t('topup.credits_info_title', 'Credits dùng để làm gì?')}
                                </h4>
                                <ul className={`text-sm space-y-2 ${isDark ? 'text-purple-300/70' : 'text-purple-600/80'}`}>
                                    <li>• {t('topup.credits_info_1', 'Tạo ảnh AI: ~10-50 credits/ảnh')}</li>
                                    <li>• {t('topup.credits_info_2', 'Tạo video AI: ~100-500 credits/video')}</li>
                                    <li>• ✨ {t('topup.credits_info_3', 'Sử dụng các model AI cao cấp')}</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
