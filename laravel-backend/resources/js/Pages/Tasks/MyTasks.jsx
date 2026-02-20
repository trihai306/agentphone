import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { Icon } from '@/Components/UI';

export default function MyTasks({ createdTasks = [], acceptedApplications = [] }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [activeTab, setActiveTab] = useState('created');

    const formatVND = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);
    const formatDate = (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '';

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

    const handleStartExecution = (taskId, applicationId) => {
        router.post(`/tasks/${taskId}/applications/${applicationId}/start`);
    };

    return (
        <AppLayout title={t('tasks.my_tasks', 'Nhiệm vụ của tôi')}>
            <Head title={t('tasks.my_tasks', 'Nhiệm vụ của tôi')} />

            <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                <div className="max-w-6xl mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('tasks.my_tasks', 'Nhiệm vụ của tôi')}
                            </h1>
                            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('tasks.my_tasks_subtitle', 'Quản lý nhiệm vụ bạn đã tạo và nhận')}
                            </p>
                        </div>
                        <Link
                            href="/tasks/create"
                            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            {t('tasks.create', 'Tạo nhiệm vụ')}
                        </Link>
                    </div>

                    {/* Tabs */}
                    <div className={`flex items-center gap-2 p-1 mb-8 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                        <button
                            onClick={() => setActiveTab('created')}
                            className={`flex-1 py-3 px-6 text-sm font-medium rounded-xl transition-all ${activeTab === 'created'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Icon name="upload" className="w-4 h-4 inline-block mr-1" /> {t('tasks.created_tasks', 'Đã tạo')} ({createdTasks.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('accepted')}
                            className={`flex-1 py-3 px-6 text-sm font-medium rounded-xl transition-all ${activeTab === 'accepted'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Icon name="download" className="w-4 h-4 inline-block mr-1" /> {t('tasks.accepted_tasks', 'Đã nhận')} ({acceptedApplications.length})
                        </button>
                    </div>

                    {/* Created Tasks Tab */}
                    {activeTab === 'created' && (
                        <div className="space-y-4">
                            {createdTasks.length === 0 ? (
                                <div className={`text-center py-16 rounded-3xl ${isDark ? 'bg-white/5' : 'bg-white shadow-lg'}`}>
                                    <div className="mb-4"><Icon name="clipboard" className="w-12 h-12 mx-auto" /></div>
                                    <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {t('tasks.no_created_tasks', 'Chưa tạo nhiệm vụ nào')}
                                    </h3>
                                    <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {t('tasks.create_first_prompt', 'Tạo nhiệm vụ đầu tiên để chia sẻ workflow')}
                                    </p>
                                    <Link
                                        href="/tasks/create"
                                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                                    >
                                        {t('tasks.create', 'Tạo nhiệm vụ')}
                                    </Link>
                                </div>
                            ) : (
                                createdTasks.map((task) => {
                                    const status = statusColors[task.status] || statusColors.open;
                                    const pendingApps = task.applications?.filter(a => a.status === 'pending').length || 0;
                                    return (
                                        <Link
                                            key={task.id}
                                            href={`/tasks/${task.id}`}
                                            className={`block p-6 rounded-2xl transition-all hover:scale-[1.01] ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white shadow-lg hover:shadow-xl'}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                    {task.icon ? <span className="text-3xl">{task.icon}</span> : <Icon name="clipboard" className="w-8 h-8" />}
                                                    <div>
                                                        <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                            {task.title}
                                                        </h3>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                <Icon name="robot" className="w-3.5 h-3.5 inline-block mr-0.5" /> {task.flow?.name}
                                                            </span>
                                                            <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>·</span>
                                                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                <Icon name="device" className="w-3.5 h-3.5 inline-block mr-0.5" /> {task.accepted_devices}/{task.required_devices}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {pendingApps > 0 && (
                                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                                                            {pendingApps} {t('tasks.pending_apps', 'chờ duyệt')}
                                                        </span>
                                                    )}
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                                                        {status.label}
                                                    </span>
                                                    {task.reward_amount > 0 && (
                                                        <span className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                            <Icon name="coin" className="w-3.5 h-3.5 inline-block mr-0.5" /> {formatVND(task.reward_amount)} đ
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* Accepted Tasks Tab */}
                    {activeTab === 'accepted' && (
                        <div className="space-y-4">
                            {acceptedApplications.length === 0 ? (
                                <div className={`text-center py-16 rounded-3xl ${isDark ? 'bg-white/5' : 'bg-white shadow-lg'}`}>
                                    <div className="mb-4"><Icon name="download" className="w-12 h-12 mx-auto" /></div>
                                    <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {t('tasks.no_accepted_tasks', 'Chưa nhận nhiệm vụ nào')}
                                    </h3>
                                    <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {t('tasks.browse_tasks', 'Duyệt danh sách nhiệm vụ để bắt đầu')}
                                    </p>
                                    <Link
                                        href="/tasks"
                                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                                    >
                                        {t('tasks.browse', 'Xem nhiệm vụ')}
                                    </Link>
                                </div>
                            ) : (
                                acceptedApplications.map((app) => {
                                    const appStatus = appStatusColors[app.status] || appStatusColors.pending;
                                    return (
                                        <div
                                            key={app.id}
                                            className={`p-6 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-white shadow-lg'}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <Link href={`/tasks/${app.task?.id}`} className="flex items-center gap-4 group">
                                                    {app.task?.icon ? <span className="text-3xl">{app.task.icon}</span> : <Icon name="clipboard" className="w-8 h-8" />}
                                                    <div>
                                                        <h3 className={`font-semibold text-lg group-hover:text-emerald-500 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                            {app.task?.title}
                                                        </h3>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                <Icon name="user" className="w-3.5 h-3.5 inline-block mr-0.5" /> {app.task?.creator?.name}
                                                            </span>
                                                            <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>·</span>
                                                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                <Icon name="device" className="w-3.5 h-3.5 inline-block mr-0.5" /> {app.device?.name || `${app.device?.brand} ${app.device?.model}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Link>

                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${appStatus.bg} ${appStatus.text}`}>
                                                        {appStatus.label}
                                                    </span>

                                                    {/* Start Execution Button */}
                                                    {app.status === 'accepted' && (
                                                        <button
                                                            onClick={() => handleStartExecution(app.task?.id, app.id)}
                                                            className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg"
                                                        >
                                                            {t('tasks.start', 'Bắt đầu')}
                                                        </button>
                                                    )}

                                                    {/* Progress for Running */}
                                                    {app.status === 'running' && (
                                                        <span className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                                            ⏳ {app.progress || 0}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
