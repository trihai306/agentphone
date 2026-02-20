import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Show({ task, userApplication, userDevices = [], canApply, isCreator }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // 1 Xu = 100 VNĐ
    const toXu = (vnd) => Math.floor((vnd || 0) / 100);
    const formatDate = (date) => date ? new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

    const [showApplyModal, setShowApplyModal] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        device_id: '',
        data_collection_id: '',
    });

    const handleApply = (e) => {
        e.preventDefault();
        post(`/tasks/${task.id}/apply`, {
            onSuccess: () => setShowApplyModal(false),
        });
    };

    const handleAccept = (applicationId) => {
        router.patch(`/tasks/${task.id}/applications/${applicationId}`, { action: 'accept' });
    };

    const handleReject = (applicationId) => {
        router.patch(`/tasks/${task.id}/applications/${applicationId}`, { action: 'reject' });
    };

    const handleCancel = () => {
        if (confirm(t('tasks.confirm_cancel', 'Bạn có chắc muốn hủy nhiệm vụ này?'))) {
            router.post(`/tasks/${task.id}/cancel`);
        }
    };

    const statusColors = {
        open: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: t('tasks.open', 'Đang mở') },
        in_progress: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: t('tasks.in_progress', 'Đang thực hiện') },
        completed: { bg: 'bg-violet-500/10', text: 'text-violet-400', label: t('tasks.completed', 'Hoàn thành') },
        cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', label: t('tasks.cancelled', 'Đã hủy') },
    };

    const appStatusColors = {
        pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: t('tasks.pending', 'Chờ duyệt') },
        accepted: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: t('tasks.accepted', 'Đã duyệt') },
        rejected: { bg: 'bg-red-500/10', text: 'text-red-400', label: t('tasks.rejected', 'Từ chối') },
        running: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: t('tasks.running', 'Đang chạy') },
        completed: { bg: 'bg-violet-500/10', text: 'text-violet-400', label: t('tasks.completed', 'Hoàn thành') },
        failed: { bg: 'bg-red-500/10', text: 'text-red-400', label: t('tasks.failed', 'Thất bại') },
    };

    const status = statusColors[task.status] || statusColors.open;

    return (
        <AppLayout title={task.title}>
            <Head title={task.title} />

            <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                {/* Hero Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 py-12">
                    <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-white/10 blur-3xl translate-y-1/2 -translate-x-1/3" />

                    <div className="relative max-w-5xl mx-auto px-6">
                        <Link href="/tasks" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors mb-6">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            {t('common.back_to_list', 'Quay lại danh sách')}
                        </Link>

                        <div className="flex items-start gap-6">
                            {/* Icon */}
                            <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                {task.icon ? <span className="text-4xl">{task.icon}</span> : <Icon name="clipboard" className="w-10 h-10" />}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                                        {status.label}
                                    </span>
                                    {/* Reward in Xu */}
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/90 text-white flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {toXu(task.reward_amount).toLocaleString()} Xu
                                    </span>
                                </div>
                                <h1 className="text-3xl font-bold text-white mb-2">{task.title}</h1>
                                <p className="text-white/80 text-lg">{task.description || t('tasks.no_description', 'Không có mô tả')}</p>

                                {/* Tags */}
                                {task.tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {task.tags.map((tag, i) => (
                                            <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-6 py-8">
                    <div className="grid grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="col-span-2 space-y-6">
                            {/* Workflow Info */}
                            <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-white shadow-lg'}`}>
                                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {t('tasks.workflow_info', 'Thông tin Workflow')}
                                </h3>
                                {task.flow && (
                                    <div className={`flex items-center gap-4 p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                        {task.flow.icon ? <span className="text-3xl">{task.flow.icon}</span> : <Icon name="robot" className="w-8 h-8" />}
                                        <div>
                                            <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.flow.name}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Data Collection Info */}
                            {(task.data_collection || task.user_provides_data) && (
                                <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-white shadow-lg'}`}>
                                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {t('tasks.data_info', 'Thông tin Data')}
                                    </h3>
                                    {task.user_provides_data ? (
                                        <div className={`p-4 rounded-xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                                            <p className={`text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                                <Icon name="exclamation" className="w-4 h-4 inline-block mr-1" /> {t('tasks.user_must_provide_data', 'Bạn cần cung cấp data collection của riêng mình khi nhận nhiệm vụ')}
                                            </p>
                                        </div>
                                    ) : task.data_collection ? (
                                        <div className={`flex items-center gap-4 p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                            {task.data_collection.icon ? <span className="text-3xl">{task.data_collection.icon}</span> : <Icon name="database" className="w-8 h-8" />}
                                            <div>
                                                <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.data_collection.name}</div>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            {/* Applications (Creator Only) */}
                            {isCreator && task.applications?.length > 0 && (
                                <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-white shadow-lg'}`}>
                                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {t('tasks.applications', 'Đơn đăng ký')} ({task.applications.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {task.applications.map((app) => {
                                            const appStatus = appStatusColors[app.status] || appStatusColors.pending;
                                            return (
                                                <div key={app.id} className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center`}>
                                                            <span className="text-sm font-bold text-white">{app.user?.name?.charAt(0)}</span>
                                                        </div>
                                                        <div>
                                                            <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{app.user?.name}</div>
                                                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                <Icon name="device" className="w-3.5 h-3.5 inline-block mr-0.5" /> {app.device?.name || app.device?.brand}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${appStatus.bg} ${appStatus.text}`}>
                                                            {appStatus.label}
                                                        </span>
                                                        {app.status === 'pending' && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleAccept(app.id)}
                                                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                                                                >
                                                                    {t('common.accept', 'Duyệt')}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleReject(app.id)}
                                                                    className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                                                >
                                                                    {t('common.reject', 'Từ chối')}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Stats Card */}
                            <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-white shadow-lg'}`}>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('tasks.devices_accepted', 'Máy đã nhận')}</span>
                                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {task.accepted_devices}/{task.required_devices}
                                        </span>
                                    </div>
                                    <div className={`h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                            style={{ width: `${Math.min(100, (task.accepted_devices / task.required_devices) * 100)}%` }}
                                        />
                                    </div>

                                    {task.deadline_at && (
                                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('tasks.deadline', 'Hạn chót')}</span>
                                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatDate(task.deadline_at)}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('common.created_at', 'Ngày tạo')}</span>
                                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatDate(task.created_at)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Creator Info */}
                            <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-white shadow-lg'}`}>
                                <h4 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('tasks.created_by', 'Người tạo')}</h4>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                        <span className="text-lg font-bold text-white">{task.creator?.name?.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.creator?.name}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                {/* User's Application Status */}
                                {userApplication && (
                                    <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                        <div className="text-center">
                                            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${appStatusColors[userApplication.status]?.bg} ${appStatusColors[userApplication.status]?.text}`}>
                                                {appStatusColors[userApplication.status]?.label}
                                            </span>
                                            <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {t('tasks.your_application', 'Đơn đăng ký của bạn')}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Apply Button */}
                                {canApply && !userApplication && (
                                    <button
                                        onClick={() => setShowApplyModal(true)}
                                        className="w-full py-4 text-base font-semibold rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
                                    >
                                        <Icon name="device" className="w-4 h-4 inline-block mr-1" /> {t('tasks.apply_now', 'Nhận nhiệm vụ')}
                                    </button>
                                )}

                                {/* Cancel Button (Creator Only) */}
                                {isCreator && task.status === 'open' && (
                                    <button
                                        onClick={handleCancel}
                                        className={`w-full py-3 text-sm font-medium rounded-xl ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                    >
                                        {t('tasks.cancel_task', 'Hủy nhiệm vụ')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Apply Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowApplyModal(false)}>
                    <div className={`w-full max-w-md p-6 rounded-3xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'} shadow-2xl`} onClick={(e) => e.stopPropagation()}>
                        <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {t('tasks.apply_for_task', 'Đăng ký nhận nhiệm vụ')}
                        </h3>
                        <form onSubmit={handleApply}>
                            <div className="mb-6">
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {t('tasks.select_device', 'Chọn thiết bị')} *
                                </label>
                                <select
                                    value={data.device_id}
                                    onChange={(e) => setData('device_id', e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl ${isDark ? 'bg-white/10 text-white border-white/10' : 'bg-gray-50 text-gray-900 border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                                    required
                                >
                                    <option value="">{t('tasks.choose_device', '-- Chọn thiết bị --')}</option>
                                    {userDevices.map((device) => (
                                        <option key={device.id} value={device.id}>{device.name || `${device.brand} ${device.model}`}</option>
                                    ))}
                                </select>
                                {errors.device_id && <p className="text-red-500 text-sm mt-1">{errors.device_id}</p>}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowApplyModal(false)}
                                    className={`flex-1 py-3 text-sm font-medium rounded-xl ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    {t('common.cancel', 'Hủy')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || !data.device_id}
                                    className={`flex-1 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white ${(processing || !data.device_id) ? 'opacity-50' : ''}`}
                                >
                                    {processing ? t('common.submitting', 'Đang gửi...') : t('tasks.submit_application', 'Gửi đăng ký')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
