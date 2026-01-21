import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { useToast } from '@/Components/Layout/ToastProvider';

export default function MyListings({ listings, stats, userFlows = [] }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { auth } = usePage().props;
    const { showConfirm } = useConfirm();
    const { addToast } = useToast();
    const isDark = theme === 'dark';

    // Vietnamese currency formatter
    const formatVND = (value) => {
        return new Intl.NumberFormat('vi-VN').format(value || 0);
    };

    const [showPublishModal, setShowPublishModal] = useState(false);
    const [publishData, setPublishData] = useState({
        listable_type: 'flow',
        listable_id: '',
        title: '',
        description: '',
        tags: [],
        price_type: 'free',
        price: 0,
    });
    const [tagInput, setTagInput] = useState('');
    const [publishing, setPublishing] = useState(false);
    const [selectedFlow, setSelectedFlow] = useState(null);

    const handleFlowSelect = (flowId) => {
        const flow = userFlows.find(f => f.id == flowId);
        setSelectedFlow(flow);
        setPublishData({
            ...publishData,
            listable_id: flowId,
            title: flow?.name || '',
            description: flow?.description || '',
        });
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (publishData.tags.length < 10 && !publishData.tags.includes(tagInput.trim())) {
                setPublishData({ ...publishData, tags: [...publishData.tags, tagInput.trim()] });
            }
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setPublishData({ ...publishData, tags: publishData.tags.filter(t => t !== tagToRemove) });
    };

    const handlePublish = (e) => {
        e.preventDefault();
        setPublishing(true);
        router.post('/marketplace/publish', publishData, {
            onSuccess: () => {
                addToast(t('marketplace.publish_success', 'Submitted for review!'), 'success');
                setShowPublishModal(false);
                setPublishData({
                    listable_type: 'flow',
                    listable_id: '',
                    title: '',
                    description: '',
                    tags: [],
                    price_type: 'free',
                    price: 0,
                });
            },
            onError: (errors) => {
                addToast(Object.values(errors)[0] || t('marketplace.publish_error', 'Failed to publish'), 'error');
            },
            onFinish: () => setPublishing(false),
        });
    };

    const handleDelete = async (listingId) => {
        const confirmed = await showConfirm({
            title: t('marketplace.delete_listing', 'Delete Listing'),
            message: t('marketplace.delete_confirm', 'This will remove your listing from the marketplace.'),
            type: 'danger',
            confirmText: t('common.delete', 'Delete'),
            cancelText: t('common.cancel', 'Cancel'),
        });

        if (confirmed) {
            router.delete(`/marketplace/${listingId}`, {
                onSuccess: () => addToast(t('marketplace.deleted', 'Listing deleted'), 'success'),
            });
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            draft: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
            pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            published: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
        };
        return (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${styles[status] || styles.draft}`}>
                {t(`marketplace.status.${status}`, status.charAt(0).toUpperCase() + status.slice(1))}
            </span>
        );
    };

    return (
        <AppLayout title={t('marketplace.my_listings', 'My Listings')}>
            <Head title={t('marketplace.my_listings', 'My Listings')} />

            <div className={`min-h-screen ${isDark ? 'bg-[#09090b]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
                {/* Background decoration */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-indigo-900/20' : 'bg-indigo-200/50'}`} />
                    <div className={`absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-purple-900/20' : 'bg-purple-200/40'}`} />
                </div>

                <div className="relative max-w-[1400px] mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-10">
                        <div>
                            <div className="flex items-center gap-4">
                                <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {t('marketplace.my_listings', 'My Listings')}
                                    </h1>
                                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {t('marketplace.manage_listings', 'Manage your marketplace listings')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Link
                                href="/marketplace"
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${isDark
                                    ? 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {t('marketplace.browse', 'Browse Marketplace')}
                            </Link>
                            <button
                                onClick={() => setShowPublishModal(true)}
                                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                {t('marketplace.publish_new', 'Publish New')}
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-5 gap-5 mb-8">
                        {[
                            { label: t('marketplace.stats.total', 'Total'), value: stats.total_listings, gradient: 'from-indigo-500 to-purple-600' },
                            { label: t('marketplace.stats.published', 'Published'), value: stats.published, gradient: 'from-emerald-500 to-teal-500' },
                            { label: t('marketplace.stats.pending', 'Pending'), value: stats.pending, gradient: 'from-amber-500 to-orange-500' },
                            { label: t('marketplace.stats.downloads', 'Downloads'), value: stats.total_downloads, gradient: 'from-blue-500 to-cyan-500' },
                            { label: t('marketplace.stats.earnings', 'Earnings'), value: `${formatVND(stats.total_earnings || 0)} đ`, gradient: 'from-pink-500 to-rose-500' },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className={`relative overflow-hidden p-5 rounded-2xl backdrop-blur-xl border transition-all hover:scale-[1.02] ${isDark
                                    ? 'bg-white/5 border-white/10 hover:border-white/20'
                                    : 'bg-white/80 border-gray-200/50 hover:border-gray-300 shadow-lg shadow-gray-200/50'
                                    }`}
                            >
                                <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl bg-gradient-to-br ${stat.gradient} opacity-20`} />
                                <div className="relative">
                                    <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {stat.label}
                                    </p>
                                    <p className={`text-2xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {stat.value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Listings Table */}
                    {listings.data.length > 0 ? (
                        <div className={`rounded-2xl overflow-hidden backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                            <table className="w-full">
                                <thead>
                                    <tr className={`border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                        <th className={`text-left px-6 py-4 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {t('marketplace.listing', 'Tin Đăng')}
                                        </th>
                                        <th className={`text-left px-6 py-4 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {t('marketplace.type', 'Loại')}
                                        </th>
                                        <th className={`text-left px-6 py-4 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {t('marketplace.price', 'Giá')}
                                        </th>
                                        <th className={`text-left px-6 py-4 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {t('marketplace.status_label', 'Trạng Thái')}
                                        </th>
                                        <th className={`text-left px-6 py-4 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {t('marketplace.downloads_label', 'Lượt Tải')}
                                        </th>
                                        <th className={`text-left px-6 py-4 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {t('marketplace.earnings_label', 'Thu Nhập')}
                                        </th>
                                        <th className={`text-right px-6 py-4 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {t('common.actions', 'Hành Động')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {listings.data.map((listing) => (
                                        <tr key={listing.id} className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{listing.title}</p>
                                                    <p className={`text-sm truncate max-w-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {listing.description || t('marketplace.no_description', 'No description')}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {listing.listable_type?.includes('DataCollection') ? 'Collection' : 'Workflow'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-sm font-medium ${listing.price_type === 'free' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {listing.price_type === 'free' ? t('marketplace.free', 'Free') : `${formatVND(listing.price)} đ`}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(listing.status)}
                                                {listing.rejection_reason && (
                                                    <p className="text-xs text-red-400 mt-1">{listing.rejection_reason}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {listing.downloads_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {formatVND((listing.purchases_sum_price_paid || 0) * 0.8)} đ
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {listing.status === 'published' && (
                                                        <Link
                                                            href={`/marketplace/${listing.id}`}
                                                            className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'}`}
                                                            title={t('common.view', 'View')}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </Link>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(listing.id)}
                                                        className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                                                        title={t('common.delete', 'Delete')}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* Empty State */
                        <div className={`relative overflow-hidden rounded-2xl p-16 text-center backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-indigo-500 to-purple-600`} />
                            <div className="relative">
                                <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-6">
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {t('marketplace.no_listings', 'No listings yet')}
                                </h3>
                                <p className={`text-sm mb-8 max-w-md mx-auto ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {t('marketplace.start_selling', 'Start sharing your workflows and data collections with the community!')}
                                </p>
                                <button
                                    onClick={() => setShowPublishModal(true)}
                                    className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    {t('marketplace.publish_first', 'Publish Your First Listing')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {listings.last_page > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-2">
                            {listings.prev_page_url && (
                                <Link href={listings.prev_page_url} className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
                                    ← {t('common.previous', 'Previous')}
                                </Link>
                            )}
                            <span className={`px-4 py-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('common.page', 'Page')} {listings.current_page} / {listings.last_page}
                            </span>
                            {listings.next_page_url && (
                                <Link href={listings.next_page_url} className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
                                    {t('common.next', 'Next')} →
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Publish Modal */}
                {showPublishModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPublishModal(false)}>
                        <div className={`w-full max-w-lg rounded-2xl overflow-hidden ${isDark ? 'bg-zinc-900' : 'bg-white'} shadow-2xl`} onClick={(e) => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div className="relative h-20 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-end p-6">
                                <h2 className="text-xl font-bold text-white">{t('marketplace.publish_listing', 'Publish to Marketplace')}</h2>
                                <button onClick={() => setShowPublishModal(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handlePublish} className="p-6 space-y-5">
                                {/* Workflow Selection */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {t('marketplace.select_workflow', 'Select Workflow')} <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={publishData.listable_id}
                                        onChange={(e) => handleFlowSelect(e.target.value)}
                                        required
                                        className={`w-full px-4 py-3 rounded-xl text-sm ${isDark
                                            ? 'bg-white/5 border-white/10 text-white'
                                            : 'bg-gray-50 border-gray-200 text-gray-900'
                                            } border focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                                    >
                                        <option value="">{t('marketplace.choose_workflow', 'Choose a workflow...')}</option>
                                        {userFlows.map((flow) => (
                                            <option key={flow.id} value={flow.id}>
                                                {flow.name}
                                                {flow.bundled_collection_count > 0 ? ` (+ ${flow.bundled_collection_count} ${t('marketplace.data_structures', 'data structures')})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedFlow?.bundled_collection_count > 0 && (
                                        <p className={`text-xs mt-2 flex items-center gap-1.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                            </svg>
                                            {t('marketplace.includes_data_structure', 'Includes data structure')} ({t('marketplace.schema_only', 'Schema only, no data')})
                                        </p>
                                    )}
                                </div>

                                {/* Title */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {t('marketplace.title', 'Title')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={publishData.title}
                                        onChange={(e) => setPublishData({ ...publishData, title: e.target.value })}
                                        required
                                        maxLength={255}
                                        placeholder={t('marketplace.title_placeholder', 'Give your listing a catchy title')}
                                        className={`w-full px-4 py-3 rounded-xl text-sm ${isDark
                                            ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                                            } border focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {t('marketplace.description', 'Description')}
                                    </label>
                                    <textarea
                                        value={publishData.description}
                                        onChange={(e) => setPublishData({ ...publishData, description: e.target.value })}
                                        rows={3}
                                        maxLength={2000}
                                        placeholder={t('marketplace.description_placeholder', 'Describe what this does and why others would want it')}
                                        className={`w-full px-4 py-3 rounded-xl text-sm resize-none ${isDark
                                            ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                                            } border focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                                    />
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {t('marketplace.tags', 'Tags')}
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {publishData.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}
                                            >
                                                {tag}
                                                <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-red-400">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleAddTag}
                                        placeholder={t('marketplace.tags_placeholder', 'Press Enter to add tags')}
                                        className={`w-full px-4 py-3 rounded-xl text-sm ${isDark
                                            ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                                            } border focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                                    />
                                </div>

                                {/* Pricing */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {t('marketplace.pricing', 'Pricing')} <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { value: 'free', label: t('marketplace.free', 'Free'), sublabel: t('marketplace.free_sublabel', 'Share with community') },
                                            { value: 'paid', label: t('marketplace.paid', 'Paid'), sublabel: t('marketplace.paid_sublabel', 'Earn credits') },
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setPublishData({ ...publishData, price_type: option.value, price: option.value === 'free' ? 0 : publishData.price })}
                                                className={`p-4 rounded-xl border text-left transition-all ${publishData.price_type === option.value
                                                    ? option.value === 'free' ? 'border-emerald-500 bg-emerald-500/10' : 'border-amber-500 bg-amber-500/10'
                                                    : isDark ? 'border-white/10 hover:border-white/20' : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <span className={`text-sm font-medium ${publishData.price_type === option.value
                                                    ? option.value === 'free' ? 'text-emerald-500' : 'text-amber-500'
                                                    : isDark ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>
                                                    {option.label}
                                                </span>
                                                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{option.sublabel}</p>
                                            </button>
                                        ))}
                                    </div>
                                    {publishData.price_type === 'paid' && (
                                        <div className="mt-3">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={publishData.price}
                                                    onChange={(e) => setPublishData({ ...publishData, price: parseInt(e.target.value) || 0 })}
                                                    min={1000}
                                                    max={100000000}
                                                    step={1000}
                                                    required
                                                    placeholder={t('marketplace.price_placeholder', 'Enter price (VNĐ)')}
                                                    className={`w-full px-4 py-3 pr-12 rounded-xl text-sm ${isDark
                                                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                                                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                                                        } border focus:outline-none focus:ring-2 focus:ring-amber-500/20`}
                                                />
                                                <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>đ</span>
                                            </div>
                                            {publishData.price > 0 && (
                                                <p className={`text-xs mt-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                                    {t('marketplace.earnings_note', 'You will receive 80%')}: <strong>{formatVND(publishData.price * 0.8)} đ</strong>
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowPublishModal(false)}
                                        className={`flex-1 px-4 py-3 text-sm font-medium rounded-xl transition-all ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                                    >
                                        {t('common.cancel', 'Cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={publishing || !publishData.listable_id || !publishData.title}
                                        className="flex-1 px-4 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {publishing ? t('common.submitting', 'Submitting...') : t('marketplace.submit_review', 'Submit for Review')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
