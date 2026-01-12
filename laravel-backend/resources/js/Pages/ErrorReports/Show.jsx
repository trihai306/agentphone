import { useForm, usePage, router, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../Layouts/AppLayout';
import { useState } from 'react';

const statusStyles = {
    pending: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
        icon: '⏳',
    },
    reviewing: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        dot: 'bg-blue-500',
        icon: '👀',
    },
    in_progress: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        text: 'text-purple-700 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800',
        dot: 'bg-purple-500',
        icon: '🔧',
    },
    resolved: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800',
        dot: 'bg-green-500',
        icon: '✅',
    },
    closed: {
        bg: 'bg-gray-50 dark:bg-gray-800/50',
        text: 'text-gray-700 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-700',
        dot: 'bg-gray-500',
        icon: '📁',
    },
};

const severityStyles = {
    low: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', emoji: '🟢' },
    medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', emoji: '🟡' },
    high: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', emoji: '🟠' },
    critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', emoji: '🔴' },
};

const typeIcons = {
    bug: '🐛',
    ui_issue: '🎨',
    performance: '⚡',
    feature_request: '💡',
    other: '❓',
};

export default function Show({ report, statuses, types, severities }) {
    const { t } = useTranslation();
    const { flash, auth } = usePage().props;
    const [showFullDeviceInfo, setShowFullDeviceInfo] = useState(false);
    const statusStyle = statusStyles[report.status] || statusStyles.pending;
    const severityStyle = severityStyles[report.severity] || severityStyles.medium;

    const { data, setData, post, processing, errors, reset } = useForm({
        message: '',
        attachments: [],
    });

    const handleSubmitResponse = (e) => {
        e.preventDefault();
        post(`/error-reports/${report.id}/respond`, {
            onSuccess: () => reset(),
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout title={`Báo cáo #${report.id}`}>
            {/* Header */}
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-amber-500/10 rounded-3xl blur-3xl"></div>
                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-gray-700/30 shadow-xl">
                    <div className="flex items-start gap-4">
                        <Link
                            href="/error-reports"
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">{typeIcons[report.error_type] || '❓'}</span>
                                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                                    {report.title}
                                </h1>
                                <span className="text-sm text-gray-400">#{report.id}</span>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                {/* Status */}
                                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                                    <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`}></span>
                                    {statusStyle.icon} {statuses[report.status]}
                                </span>
                                {/* Severity */}
                                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${severityStyle.bg} ${severityStyle.text}`}>
                                    {severityStyle.emoji} {severities[report.severity]}
                                </span>
                                {/* Type */}
                                <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                    {types[report.error_type]}
                                </span>
                                {/* Date */}
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('error_reports.sent_at', { defaultValue: 'Gửi lúc' })}: {formatDate(report.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Flash Messages */}
            {flash?.success && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-green-700 dark:text-green-400">{flash.success}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700/50 p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {t('error_reports.detailed_description', { defaultValue: 'Mô tả chi tiết' })}
                        </h2>
                        <div className="prose dark:prose-invert max-w-none">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {report.description}
                            </p>
                        </div>
                        {report.page_url && (
                            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">URL trang</div>
                                <a href={report.page_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline break-all">
                                    {report.page_url}
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Screenshots */}
                    {report.screenshots && report.screenshots.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700/50 p-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                {t('error_reports.screenshots_count', { count: report.screenshots.length, defaultValue: `Ảnh chụp màn hình (${report.screenshots.length})` })}
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {report.screenshots.map((screenshot, index) => (
                                    <a
                                        key={index}
                                        href={`/storage/${screenshot}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
                                    >
                                        <img
                                            src={`/storage/${screenshot}`}
                                            alt={`Screenshot ${index + 1}`}
                                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Responses Thread */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700/50 p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {t('error_reports.discussion', { defaultValue: 'Trao đổi' })} ({report.responses?.length || 0})
                        </h2>

                        {/* Response List */}
                        <div className="space-y-4 mb-6">
                            {report.responses?.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <p>{t('error_reports.no_responses', { defaultValue: 'Chưa có phản hồi nào' })}</p>
                                </div>
                            ) : (
                                report.responses.map((response, index) => (
                                    <div
                                        key={response.id}
                                        className={`flex gap-3 ${response.is_admin_response ? '' : 'flex-row-reverse'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${response.is_admin_response
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                            }`}>
                                            {response.is_admin_response ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className={`flex-1 max-w-[80%] ${response.is_admin_response ? '' : 'text-right'}`}>
                                            <div className={`inline-block p-4 rounded-2xl ${response.is_admin_response
                                                ? 'bg-blue-50 dark:bg-blue-900/20 rounded-tl-none'
                                                : 'bg-gray-100 dark:bg-gray-700 rounded-tr-none'
                                                }`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                                        {response.is_admin_response ? 'Admin' : response.user?.name || 'Bạn'}
                                                    </span>
                                                    {response.is_admin_response && (
                                                        <span className="px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                                                            {t('error_reports.support', { defaultValue: 'Hỗ trợ' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-700 dark:text-gray-300 text-left whitespace-pre-wrap">
                                                    {response.message}
                                                </p>
                                            </div>
                                            <div className={`text-xs text-gray-400 mt-1 ${response.is_admin_response ? 'text-left' : 'text-right'}`}>
                                                {formatDate(response.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Response Form */}
                        {!report.isResolved && (
                            <form onSubmit={handleSubmitResponse} className="border-t border-gray-100 dark:border-gray-700 pt-4">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            value={data.message}
                                            onChange={(e) => setData('message', e.target.value)}
                                            placeholder={t('error_reports.enter_response', { defaultValue: 'Nhập phản hồi của bạn...' })}
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        />
                                        {errors.message && (
                                            <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                                        )}
                                        <div className="flex justify-end mt-3">
                                            <button
                                                type="submit"
                                                disabled={processing || !data.message.trim()}
                                                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {processing ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        {t('error_reports.sending', { defaultValue: 'Đang gửi...' })}
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                        </svg>
                                                        {t('error_reports.send', { defaultValue: 'Gửi' })}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status Timeline */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700/50 p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {t('error_reports.status', { defaultValue: 'Trạng thái' })}
                        </h3>
                        <div className="space-y-4">
                            {Object.entries(statuses).map(([key, label], index) => {
                                const style = statusStyles[key];
                                const isActive = report.status === key;
                                const isPast = Object.keys(statuses).indexOf(report.status) > index;

                                return (
                                    <div key={key} className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive
                                            ? `${style.bg} ${style.text} ring-2 ring-offset-2 dark:ring-offset-gray-800 ${style.border.replace('border-', 'ring-')}`
                                            : isPast
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                                            }`}>
                                            {isPast && !isActive ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <span className="text-sm">{style.icon}</span>
                                            )}
                                        </div>
                                        <span className={`font-medium ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                                            }`}>
                                            {label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        {report.resolved_at && (
                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                <div className="text-xs text-green-600 dark:text-green-400 mb-1">{t('error_reports.resolved_at', { defaultValue: 'Đã giải quyết lúc' })}</div>
                                <div className="text-green-700 dark:text-green-300 font-medium">
                                    {formatDate(report.resolved_at)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Admin Assignment */}
                    {report.assigned_admin && (
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700/50 p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                {t('error_reports.assignee', { defaultValue: 'Người xử lý' })}
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        {report.assigned_admin.name}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {t('error_reports.support_agent', { defaultValue: 'Hỗ trợ viên' })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Device Info */}
                    {report.device_info && (
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700/50 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {t('error_reports.device', { defaultValue: 'Thiết bị' })}
                                </h3>
                                <button
                                    onClick={() => setShowFullDeviceInfo(!showFullDeviceInfo)}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    {showFullDeviceInfo ? t('common.collapse', { defaultValue: 'Thu gọn' }) : t('common.view_more', { defaultValue: 'Xem thêm' })}
                                </button>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Nền tảng</span>
                                    <span className="text-gray-900 dark:text-white font-medium">{report.device_info.platform}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Màn hình</span>
                                    <span className="text-gray-900 dark:text-white font-medium">
                                        {report.device_info.screenWidth} x {report.device_info.screenHeight}
                                    </span>
                                </div>
                                {showFullDeviceInfo && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Window</span>
                                            <span className="text-gray-900 dark:text-white font-medium">
                                                {report.device_info.windowWidth} x {report.device_info.windowHeight}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Múi giờ</span>
                                            <span className="text-gray-900 dark:text-white font-medium">{report.device_info.timezone}</span>
                                        </div>
                                        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                            <div className="text-gray-500 dark:text-gray-400 mb-1">User Agent</div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400 break-all">
                                                {report.device_info.userAgent}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
