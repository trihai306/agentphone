import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function Manage({ userPackage = {} }) {
    const { auth } = usePage().props;
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const pkg = userPackage.service_package || {};

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: userPackage.currency || 'VND',
        }).format(price);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleCancel = () => {
        setProcessing(true);
        router.post(`/my-packages/${userPackage.id}/cancel`, {
            reason: cancelReason,
        }, {
            onFinish: () => {
                setProcessing(false);
                setShowCancelModal(false);
            },
        });
    };

    const getStatusBadge = (status) => {
        const styles = {
            active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
            pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
            expired: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
            cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
        };
        const labels = {
            active: 'Đang hoạt động',
            pending: 'Chờ xử lý',
            expired: 'Hết hạn',
            cancelled: 'Đã hủy',
        };
        return (
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${styles[status] || styles.pending}`}>
                {labels[status] || status}
            </span>
        );
    };

    const creditsPercent = userPackage.remaining_credits != null && pkg.credits
        ? Math.round((userPackage.remaining_credits / pkg.credits) * 100)
        : null;

    return (
        <AppLayout title={`Quản lý gói - ${pkg.name || 'Gói dịch vụ'}`}>
            <div className="max-w-4xl mx-auto">
                {/* Breadcrumb */}
                <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
                    <Link href="/packages" className="hover:text-purple-600 dark:hover:text-purple-400">
                        Gói dịch vụ
                    </Link>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-gray-900 dark:text-white font-medium">Quản lý gói</span>
                </nav>

                {/* Package Header */}
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl p-8 text-white mb-8">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                {pkg.badge && (
                                    <span className="px-3 py-1 bg-white/20 text-sm font-semibold rounded-full">
                                        {pkg.badge}
                                    </span>
                                )}
                                {getStatusBadge(userPackage.status)}
                            </div>
                            <h1 className="text-3xl font-bold mb-2">{pkg.name}</h1>
                            <p className="text-white/80">{pkg.description}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-white/60 text-sm">Mã đơn hàng</p>
                            <p className="font-mono font-bold text-lg">{userPackage.order_code}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Stats Cards */}
                    <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Days Remaining */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Ngày còn lại</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {userPackage.days_remaining ?? 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Credits */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Credits còn lại</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {userPackage.remaining_credits?.toLocaleString() ?? 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Devices */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Thiết bị đang dùng</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {userPackage.used_devices ?? 0}/{pkg.max_devices === -1 ? '∞' : pkg.max_devices ?? 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Chi tiết gói</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-600 dark:text-gray-400">Ngày kích hoạt</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {formatDate(userPackage.activated_at)}
                                    </span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-600 dark:text-gray-400">Ngày hết hạn</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {formatDate(userPackage.expires_at)}
                                    </span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-600 dark:text-gray-400">Giá đã thanh toán</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {formatPrice(userPackage.price_paid)}
                                    </span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-600 dark:text-gray-400">Trạng thái thanh toán</span>
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                                        userPackage.payment_status === 'paid'
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                    }`}>
                                        {userPackage.payment_status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-3">
                                    <span className="text-gray-600 dark:text-gray-400">Tự động gia hạn</span>
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                                        userPackage.auto_renew
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                    }`}>
                                        {userPackage.auto_renew ? 'Bật' : 'Tắt'}
                                    </span>
                                </div>

                                {/* Credits Progress */}
                                {creditsPercent !== null && (
                                    <div className="pt-4">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-600 dark:text-gray-400">Sử dụng credits</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {userPackage.credits_used?.toLocaleString() || 0} / {pkg.credits?.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                                                style={{ width: `${100 - creditsPercent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Hành động</h3>

                            {userPackage.status === 'active' && (
                                <>
                                    <Link
                                        href={`/packages/${pkg.id}/subscribe`}
                                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>Gia hạn gói</span>
                                    </Link>

                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold rounded-xl transition-all"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        <span>Hủy gói</span>
                                    </button>
                                </>
                            )}

                            {userPackage.status === 'pending' && (
                                <Link
                                    href={`/my-packages/${userPackage.id}/payment`}
                                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    <span>Thanh toán ngay</span>
                                </Link>
                            )}

                            {userPackage.status === 'expired' && (
                                <Link
                                    href={`/packages/${pkg.id}/subscribe`}
                                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <span>Đăng ký lại</span>
                                </Link>
                            )}

                            <Link
                                href="/packages"
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold rounded-xl transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                <span>Quay lại</span>
                            </Link>
                        </div>

                        {/* Help */}
                        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Cần hỗ trợ?</h4>
                            <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                                Liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào về gói dịch vụ.
                            </p>
                            <Link
                                href="/contact"
                                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline text-sm"
                            >
                                Liên hệ hỗ trợ →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Xác nhận hủy gói</h3>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                Bạn có chắc chắn muốn hủy gói <strong>{pkg.name}</strong>? Hành động này không thể hoàn tác.
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Lý do hủy (tùy chọn)
                            </label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="Cho chúng tôi biết lý do bạn hủy gói..."
                            />
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold rounded-xl transition-all"
                            >
                                Không, giữ lại
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={processing}
                                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                            >
                                {processing ? 'Đang xử lý...' : 'Có, hủy gói'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
