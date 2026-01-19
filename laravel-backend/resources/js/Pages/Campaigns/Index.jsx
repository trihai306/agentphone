import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import ConfirmModal from '@/Components/UI/ConfirmModal';

const statusColors = {
    draft: { bg: 'bg-gray-500/10', text: 'text-gray-400', key: 'draft' },
    active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', key: 'active' },
    paused: { bg: 'bg-amber-500/10', text: 'text-amber-400', key: 'paused' },
    completed: { bg: 'bg-violet-500/10', text: 'text-violet-400', key: 'completed' },
};

export default function Index({ campaigns, stats }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Confirm modal state
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: 'danger',
        title: '',
        message: '',
        confirmText: '',
        onConfirm: () => { },
    });
    const [isProcessing, setIsProcessing] = useState(false);

    const showConfirm = (config) => {
        setConfirmModal({ isOpen: true, ...config });
    };

    const closeConfirm = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleRun = (campaign) => {
        showConfirm({
            type: 'success',
            title: t('campaigns.confirm.run_title'),
            message: t('campaigns.confirm.run_message', { name: campaign.name, count: campaign.total_records || 0 }),
            confirmText: `▶ ${t('campaigns.actions.start')}`,
            onConfirm: () => {
                setIsProcessing(true);
                router.post(`/campaigns/${campaign.id}/run`, {}, {
                    onSuccess: () => closeConfirm(),
                    onFinish: () => setIsProcessing(false),
                });
            },
        });
    };

    const handlePause = (campaign) => {
        showConfirm({
            type: 'warning',
            title: t('campaigns.confirm.pause_title'),
            message: t('campaigns.confirm.pause_message', { name: campaign.name }),
            confirmText: `⏸ ${t('campaigns.actions.pause')}`,
            onConfirm: () => {
                setIsProcessing(true);
                router.post(`/campaigns/${campaign.id}/pause`, {}, {
                    onSuccess: () => closeConfirm(),
                    onFinish: () => setIsProcessing(false),
                });
            },
        });
    };

    const handleDelete = (campaign) => {
        showConfirm({
            type: 'danger',
            title: t('campaigns.confirm.delete_title'),
            message: t('campaigns.confirm.delete_message', { name: campaign.name }),
            confirmText: `🗑 ${t('campaigns.actions.delete')}`,
            onConfirm: () => {
                setIsProcessing(true);
                router.delete(`/campaigns/${campaign.id}`, {
                    onSuccess: () => closeConfirm(),
                    onFinish: () => setIsProcessing(false),
                });
            },
        });
    };

    return (
        <AppLayout title="Campaigns">
            <div className={`min-h-screen ${isDark ? 'bg-[#09090b]' : 'bg-gray-50'}`}>
                <div className="relative max-w-[1600px] mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                                <span className="text-2xl">🌱</span>
                            </div>
                            <div>
                                <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {t('campaigns.title')}
                                </h1>
                                <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {t('campaigns.description')}
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/campaigns/create"
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:scale-[1.02] transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {t('campaigns.create_campaign')}
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        {[
                            { label: t('campaigns.stats.total'), value: stats?.total || 0, gradient: 'from-violet-500 to-purple-600', icon: '📊' },
                            { label: t('campaigns.stats.active'), value: stats?.active || 0, gradient: 'from-emerald-500 to-teal-500', icon: '▶️' },
                            { label: t('campaigns.stats.draft'), value: stats?.draft || 0, gradient: 'from-gray-500 to-slate-600', icon: '📝' },
                            { label: t('campaigns.stats.completed'), value: stats?.completed || 0, gradient: 'from-blue-500 to-cyan-500', icon: '✅' },
                        ].map(stat => (
                            <div key={stat.label} className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{stat.label}</p>
                                    <span className="text-lg">{stat.icon}</span>
                                </div>
                                <p className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${stat.gradient}`}>
                                    {stat.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Campaign Grid */}
                    {campaigns.data?.length > 0 ? (
                        <div className="grid grid-cols-3 gap-4">
                            {campaigns.data.map(campaign => {
                                const status = statusColors[campaign.status] || statusColors.draft;
                                const progress = campaign.total_records > 0
                                    ? Math.round((campaign.records_processed / campaign.total_records) * 100)
                                    : 0;

                                return (
                                    <div
                                        key={campaign.id}
                                        className={`group relative rounded-2xl p-5 transition-all hover:scale-[1.01] ${isDark ? 'bg-white/5 hover:bg-white/[0.07]' : 'bg-white shadow-sm hover:shadow-md'}`}
                                    >
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                                    style={{ backgroundColor: `${campaign.color}20` }}
                                                >
                                                    {campaign.icon || '🌱'}
                                                </div>
                                                <div>
                                                    <Link
                                                        href={`/campaigns/${campaign.id}`}
                                                        className={`font-semibold hover:underline ${isDark ? 'text-white' : 'text-gray-900'}`}
                                                    >
                                                        {campaign.name}
                                                    </Link>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                                                            {t(`campaigns.status.${status.key}`)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Meta */}
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">📊</span>
                                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {campaign.data_collection?.name || t('campaigns.meta.no_data')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">⚡</span>
                                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {campaign.workflows?.length || 0} {t('campaigns.meta.workflows')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">📱</span>
                                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {campaign.devices?.length || 0} {t('campaigns.meta.devices')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>{t('campaigns.meta.progress')}</span>
                                                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                                    {campaign.records_processed || 0} / {campaign.total_records || 0}
                                                </span>
                                            </div>
                                            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                                                <div
                                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            {campaign.status === 'active' ? (
                                                <button
                                                    onClick={() => handlePause(campaign)}
                                                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${isDark ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}
                                                >
                                                    ⏸ {t('campaigns.actions.pause')}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleRun(campaign)}
                                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-all"
                                                >
                                                    ▶ {t('campaigns.actions.run')}
                                                </button>
                                            )}
                                            <Link
                                                href={`/campaigns/${campaign.id}`}
                                                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                            >
                                                {t('campaigns.details')}
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(campaign)}
                                                className={`px-3 py-2.5 rounded-xl transition-all ${isDark ? 'text-red-400 hover:bg-red-500/20' : 'text-red-500 hover:bg-red-50'}`}
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Empty State with Onboarding */
                        <div className={`relative overflow-hidden rounded-2xl p-8 ${isDark ? 'bg-white/5' : 'bg-white shadow-lg'}`}>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-emerald-500 to-teal-600" />
                            <div className="relative">
                                {/* Header */}
                                <div className="text-center mb-8">
                                    <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg mb-4">
                                        <span className="text-4xl">🚀</span>
                                    </div>
                                    <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        Bắt đầu với Campaign
                                    </h3>
                                    <p className={`text-sm max-w-lg mx-auto ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        Campaign giúp tự động chạy kịch bản cho nhiều tài khoản cùng lúc trên nhiều thiết bị
                                    </p>
                                </div>

                                {/* How It Works */}
                                <div className={`rounded-xl p-5 mb-6 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <h4 className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        📖 Cách thức hoạt động
                                    </h4>
                                    <div className="flex items-center justify-between gap-2">
                                        {[
                                            { icon: '📊', title: 'Danh sách tài khoản', desc: 'Data Collection' },
                                            { icon: '→', isArrow: true },
                                            { icon: '⚡', title: 'Kịch bản', desc: 'Workflows' },
                                            { icon: '→', isArrow: true },
                                            { icon: '📱', title: 'Thiết bị', desc: 'Devices' },
                                            { icon: '→', isArrow: true },
                                            { icon: '🎯', title: 'Kết quả', desc: 'Auto Jobs' },
                                        ].map((item, i) => (
                                            item.isArrow ? (
                                                <span key={i} className={`text-lg ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>→</span>
                                            ) : (
                                                <div key={i} className="text-center flex-1">
                                                    <div className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center mb-1.5 ${isDark ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
                                                        <span className="text-lg">{item.icon}</span>
                                                    </div>
                                                    <p className={`font-medium text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</p>
                                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.desc}</p>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>

                                {/* Prerequisites Checklist */}
                                <div className={`rounded-xl p-5 mb-6 ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50'}`}>
                                    <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                                        📋 Kiểm tra trước khi bắt đầu
                                    </h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <Link href="/data" className={`flex items-center gap-3 p-3 rounded-lg transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:shadow-md'}`}>
                                            <span className="text-xl">📊</span>
                                            <div>
                                                <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Data Collection</p>
                                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Danh sách tài khoản</p>
                                            </div>
                                        </Link>
                                        <Link href="/flows" className={`flex items-center gap-3 p-3 rounded-lg transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:shadow-md'}`}>
                                            <span className="text-xl">⚡</span>
                                            <div>
                                                <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Workflows</p>
                                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Kịch bản tự động</p>
                                            </div>
                                        </Link>
                                        <Link href="/devices" className={`flex items-center gap-3 p-3 rounded-lg transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:shadow-md'}`}>
                                            <span className="text-xl">📱</span>
                                            <div>
                                                <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Devices</p>
                                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Thiết bị đã kết nối</p>
                                            </div>
                                        </Link>
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className="text-center">
                                    <Link
                                        href="/campaigns/create"
                                        className="inline-flex items-center gap-2.5 px-8 py-3.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Tạo Campaign Đầu Tiên
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {campaigns.last_page > 1 && (
                        <div className={`mt-8 flex items-center justify-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {campaigns.prev_page_url && (
                                <Link href={campaigns.prev_page_url} className="px-4 py-2 rounded-lg hover:bg-white/5">← {t('campaigns.pagination.previous')}</Link>
                            )}
                            <span className={`px-4 py-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                {t('campaigns.pagination.page_of', { current: campaigns.current_page, total: campaigns.last_page })}
                            </span>
                            {campaigns.next_page_url && (
                                <Link href={campaigns.next_page_url} className="px-4 py-2 rounded-lg bg-emerald-500 text-white">{t('campaigns.pagination.next')} →</Link>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
                isLoading={isProcessing}
            />
        </AppLayout>
    );
}
