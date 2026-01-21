import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { useToast } from '@/Components/Layout/ToastProvider';

export default function Show({ listing, hasPurchased, userPurchase, relatedListings, reviews }) {
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

    const [purchasing, setPurchasing] = useState(false);
    const [rating, setRating] = useState(userPurchase?.rating || 0);
    const [review, setReview] = useState(userPurchase?.review || '');
    const [showReviewForm, setShowReviewForm] = useState(false);

    const handlePurchase = async () => {
        if (listing.price_type === 'paid' && !hasPurchased) {
            const confirmed = await showConfirm({
                title: t('marketplace.confirm_purchase', 'Confirm Purchase'),
                message: t('marketplace.confirm_purchase_message', 'Sẽ trừ {{price}} đ từ tài khoản của bạn.', { price: formatVND(listing.price) }),
                type: 'warning',
                confirmText: t('marketplace.purchase', 'Purchase'),
                cancelText: t('common.cancel', 'Cancel'),
            });
            if (!confirmed) return;
        }

        setPurchasing(true);
        router.post(`/marketplace/${listing.id}/purchase`, {}, {
            onSuccess: () => {
                addToast(t('marketplace.purchase_success', 'Successfully added to your account!'), 'success');
            },
            onError: () => {
                addToast(t('marketplace.purchase_error', 'Failed to complete purchase'), 'error');
            },
            onFinish: () => setPurchasing(false),
        });
    };

    const handleSubmitReview = () => {
        router.post(`/marketplace/${listing.id}/rate`, {
            rating,
            review,
        }, {
            onSuccess: () => {
                addToast(t('marketplace.review_success', 'Thank you for your review!'), 'success');
                setShowReviewForm(false);
            },
        });
    };

    const getListableIcon = (type) => {
        if (type?.includes('DataCollection')) {
            return (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
            );
        }
        return (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
        );
    };

    const isOwner = auth?.user?.id === listing.user_id;

    return (
        <AppLayout title={listing.title}>
            <Head title={listing.title} />

            <div className={`min-h-screen ${isDark ? 'bg-[#09090b]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
                {/* Background decoration */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-indigo-900/20' : 'bg-indigo-200/50'}`} />
                    <div className={`absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-purple-900/20' : 'bg-purple-200/40'}`} />
                </div>

                <div className="relative max-w-[1200px] mx-auto px-6 py-8">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm mb-6">
                        <Link href="/marketplace" className={`${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'} transition-colors`}>
                            {t('marketplace.title', 'Marketplace')}
                        </Link>
                        <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>/</span>
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{listing.title}</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Header Card */}
                            <div className={`overflow-hidden rounded-2xl backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                                {/* Gradient Banner */}
                                <div className="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600 p-6">
                                    <div className="absolute inset-0 opacity-20">
                                        <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
                                        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-black/10 blur-3xl transform -translate-x-1/2 translate-y-1/2" />
                                    </div>

                                    {/* Type Badge */}
                                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/20 text-white backdrop-blur-md border border-white/20">
                                        {getListableIcon(listing.listable_type)}
                                        {listing.listable_type?.includes('DataCollection') ? 'Data Collection' : 'Workflow'}
                                    </div>

                                    {/* Stats */}
                                    <div className="absolute bottom-4 left-4 flex gap-4">
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-black/20 text-white backdrop-blur-md">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            {listing.views_count} {t('marketplace.views', 'views')}
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-black/20 text-white backdrop-blur-md">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            {listing.downloads_count} {t('marketplace.downloads', 'downloads')}
                                        </div>
                                        {listing.rating > 0 && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-black/20 text-white backdrop-blur-md">
                                                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                                {listing.rating.toFixed(1)} ({listing.ratings_count})
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {listing.title}
                                    </h1>

                                    {listing.tags?.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {listing.tags.map((tag, i) => (
                                                <span
                                                    key={i}
                                                    className={`px-3 py-1 rounded-lg text-xs font-medium ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'}`}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className={`mt-6 prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                                        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                            {listing.description || t('marketplace.no_description', 'No description provided.')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Reviews Section */}
                            <div className={`rounded-2xl backdrop-blur-xl border p-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {t('marketplace.reviews', 'Reviews')} ({listing.ratings_count})
                                    </h2>
                                    {hasPurchased && !userPurchase?.rating && (
                                        <button
                                            onClick={() => setShowReviewForm(true)}
                                            className="text-sm font-medium text-indigo-500 hover:text-indigo-400"
                                        >
                                            {t('marketplace.write_review', 'Write a Review')}
                                        </button>
                                    )}
                                </div>

                                {/* Review Form */}
                                {showReviewForm && (
                                    <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                        <div className="mb-4">
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {t('marketplace.your_rating', 'Your Rating')}
                                            </label>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        onClick={() => setRating(star)}
                                                        className="p-1"
                                                    >
                                                        <svg
                                                            className={`w-8 h-8 ${star <= rating ? 'text-yellow-400' : isDark ? 'text-gray-600' : 'text-gray-300'}`}
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {t('marketplace.your_review', 'Your Review')}
                                            </label>
                                            <textarea
                                                value={review}
                                                onChange={(e) => setReview(e.target.value)}
                                                rows={3}
                                                placeholder={t('marketplace.review_placeholder', 'Share your experience...')}
                                                className={`w-full px-4 py-3 rounded-xl text-sm ${isDark
                                                    ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                                                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                                    } border focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setShowReviewForm(false)}
                                                className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                                            >
                                                {t('common.cancel', 'Cancel')}
                                            </button>
                                            <button
                                                onClick={handleSubmitReview}
                                                disabled={!rating}
                                                className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                                            >
                                                {t('marketplace.submit_review', 'Submit Review')}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Reviews List */}
                                {reviews?.length > 0 ? (
                                    <div className="space-y-4">
                                        {reviews.map((reviewItem) => (
                                            <div key={reviewItem.id} className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                                        <span className="text-xs font-bold text-white">
                                                            {reviewItem.user?.name?.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                            {reviewItem.user?.name}
                                                        </p>
                                                        <div className="flex items-center gap-1">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <svg
                                                                    key={star}
                                                                    className={`w-3 h-3 ${star <= reviewItem.rating ? 'text-yellow-400' : 'text-gray-400'}`}
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                </svg>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                {reviewItem.review && (
                                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {reviewItem.review}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className={`text-sm text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {t('marketplace.no_reviews', 'No reviews yet. Be the first to review!')}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Purchase Card */}
                            <div className={`rounded-2xl backdrop-blur-xl border p-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                                {/* Price */}
                                <div className="text-center mb-6">
                                    {listing.price_type === 'free' ? (
                                        <span className="text-3xl font-bold text-emerald-500">{t('marketplace.free', 'Free')}</span>
                                    ) : (
                                        <div>
                                            <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatVND(listing.price)}</span>
                                            <span className={`text-lg ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>đ</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Button */}
                                {isOwner ? (
                                    <div className={`text-center py-3 rounded-xl text-sm font-medium ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                        {t('marketplace.your_listing', 'This is your listing')}
                                    </div>
                                ) : hasPurchased ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 text-emerald-500 font-medium">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            {t('marketplace.purchased', 'Purchased')}
                                        </div>
                                        <Link
                                            href={userPurchase?.cloned_type?.includes('Flow')
                                                ? `/flows/${userPurchase.cloned_id}/edit`
                                                : `/data-collections/${userPurchase.cloned_id}`}
                                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            {t('marketplace.open_item', 'Open Item')}
                                        </Link>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handlePurchase}
                                        disabled={purchasing}
                                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all disabled:opacity-50"
                                    >
                                        {purchasing ? (
                                            <>
                                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                {t('common.processing', 'Processing...')}
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                {listing.price_type === 'free'
                                                    ? t('marketplace.get_free', 'Get for Free')
                                                    : t('marketplace.purchase', 'Purchase')}
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Seller Card */}
                            <div className={`rounded-2xl backdrop-blur-xl border p-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                                <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t('marketplace.seller', 'Seller')}
                                </h3>
                                <div className="flex items-center gap-3">
                                    {listing.user?.avatar ? (
                                        <img src={listing.user.avatar} alt="" className="w-12 h-12 rounded-full" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                            <span className="text-lg font-bold text-white">
                                                {listing.user?.name?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {listing.user?.name}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Related Listings */}
                            {relatedListings?.length > 0 && (
                                <div className={`rounded-2xl backdrop-blur-xl border p-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                                    <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {t('marketplace.related', 'Related')}
                                    </h3>
                                    <div className="space-y-3">
                                        {relatedListings.map((related) => (
                                            <Link
                                                key={related.id}
                                                href={`/marketplace/${related.id}`}
                                                className={`block p-3 rounded-xl transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                                            >
                                                <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {related.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-xs ${related.price_type === 'free' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                        {related.price_type === 'free' ? t('marketplace.free', 'Miễn Phí') : `${formatVND(related.price)} đ`}
                                                    </span>
                                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        · {related.downloads_count} {t('marketplace.downloads', 'lượt tải')}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
