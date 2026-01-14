import { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../Layouts/AppLayout';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { useTheme } from '@/Contexts/ThemeContext';

const statusColors = {
    pending: {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-500',
        border: 'border-yellow-500/20',
        icon: '⏳',
    },
    queued: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-500',
        border: 'border-blue-500/20',
        icon: '📋',
    },
    running: {
        bg: 'bg-violet-500/10',
        text: 'text-violet-500',
        border: 'border-violet-500/20',
        icon: '▶️',
    },
    completed: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-500',
        border: 'border-emerald-500/20',
        icon: '✓',
    },
    failed: {
        bg: 'bg-red-500/10',
        text: 'text-red-500',
        border: 'border-red-500/20',
        icon: '✕',
    },
    cancelled: {
        bg: 'bg-gray-500/10',
        text: 'text-gray-500',
        border: 'border-gray-500/20',
        icon: '⊘',
    },
};

export default function Index({ jobs, stats }) {
    const { t } = useTranslation();
    const { showConfirm } = useConfirm();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const handleCancel = async (jobId, e) => {
        e?.preventDefault();
        const confirmed = await showConfirm({
            title: t('jobs.cancel_job'),
            message: t('jobs.confirm_cancel'),
            type: 'warning',
            confirmText: t('common.confirm'),
            cancelText: t('common.cancel'),
        });

        if (confirmed) {
            router.post(`/jobs/${jobId}/cancel`);
        }
    };

    const handleDelete = async (jobId, e) => {
        e?.preventDefault();
        const confirmed = await showConfirm({
            title: t('jobs.delete_job'),
            message: t('jobs.confirm_delete'),
            type: 'danger',
            confirmText: t('common.delete'),
            cancelText: t('common.cancel'),
        });

        if (confirmed) {
            router.delete(`/jobs/${jobId}`);
        }
    };

    return (
        <AppLayout title={t('jobs.title')}>
            <div className={`min-h-screen ${isDark ? 'bg-[#09090b]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
                {/* Background decoration */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-violet-900/20' : 'bg-violet-200/50'}`} />
                    <div className={`absolute bottom-0 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-200/40'}`} />
                </div>

                <div className="relative max-w-[1400px] mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-10">
                        <div>
                            <div className="flex items-center gap-4">
                                <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    {stats?.running > 0 && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-[#09090b] animate-pulse" />
                                    )}
                                </div>
                                <div>
                                    <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {t('jobs.title')}
                                    </h1>
                                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {t('jobs.description')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Link
                            href="/jobs/create"
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {t('jobs.create_job')}
                        </Link>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-5 mb-8">
                        {[
                            { label: t('jobs.stats.total'), value: stats?.total || 0, gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20' },
                            { label: t('jobs.stats.running'), value: stats?.running || 0, gradient: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20', pulse: stats?.running > 0 },
                            { label: t('jobs.stats.completed'), value: stats?.completed || 0, gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20' },
                            { label: t('jobs.stats.failed'), value: stats?.failed || 0, gradient: 'from-red-500 to-rose-500', shadow: 'shadow-red-500/20' },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className={`relative overflow-hidden p-5 rounded-2xl backdrop-blur-xl border transition-all hover:scale-[1.02] ${isDark
                                    ? 'bg-white/5 border-white/10 hover:border-white/20'
                                    : 'bg-white/80 border-gray-200/50 hover:border-gray-300 shadow-lg shadow-gray-200/50'
                                    }`}
                            >
                                <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl bg-gradient-to-br ${stat.gradient} opacity-20`} />
                                <div className="relative flex items-center justify-between">
                                    <div>
                                        <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {stat.label}
                                        </p>
                                        <p className={`text-4xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {stat.value}
                                        </p>
                                    </div>
                                    {stat.pulse && (
                                        <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Jobs List */}
                    {jobs.data?.length > 0 ? (
                        <div className={`rounded-2xl overflow-hidden backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                            <table className="w-full">
                                <thead className={`${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <tr>
                                        <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {t('jobs.table.job')}
                                        </th>
                                        <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {t('jobs.table.flow')}
                                        </th>
                                        <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {t('jobs.table.device')}
                                        </th>
                                        <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {t('jobs.table.status')}
                                        </th>
                                        <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {t('jobs.table.progress')}
                                        </th>
                                        <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {t('jobs.table.created')}
                                        </th>
                                        <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {t('common.actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200/10">
                                    {jobs.data.map((job) => {
                                        const statusStyle = statusColors[job.status] || statusColors.pending;
                                        const progress = job.total_tasks > 0 ? Math.round((job.completed_tasks / job.total_tasks) * 100) : 0;

                                        return (
                                            <tr key={job.id} className={`${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors`}>
                                                <td className="px-6 py-4">
                                                    <Link href={`/jobs/${job.id}`} className={`font-medium ${isDark ? 'text-white hover:text-violet-400' : 'text-gray-900 hover:text-violet-600'}`}>
                                                        {job.name}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {job.flow?.name || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {job.device?.name || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                                                        <span>{statusStyle.icon}</span>
                                                        {t(`jobs.status.${job.status}`)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-24 h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                                                            <div
                                                                className={`h-full rounded-full ${job.status === 'completed' ? 'bg-emerald-500' : job.status === 'failed' ? 'bg-red-500' : 'bg-violet-500'}`}
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            {job.completed_tasks}/{job.total_tasks}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {job.created_at_human}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link
                                                            href={`/jobs/${job.id}`}
                                                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'}`}
                                                            title={t('common.view')}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </Link>
                                                        {['pending', 'queued', 'running'].includes(job.status) && (
                                                            <button
                                                                onClick={(e) => handleCancel(job.id, e)}
                                                                className={`p-2 rounded-lg ${isDark ? 'hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-400' : 'hover:bg-yellow-50 text-gray-400 hover:text-yellow-600'}`}
                                                                title={t('jobs.cancel_job')}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                        {!['running', 'pending', 'queued'].includes(job.status) && (
                                                            <button
                                                                onClick={(e) => handleDelete(job.id, e)}
                                                                className={`p-2 rounded-lg ${isDark ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                                                                title={t('common.delete')}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* Empty State */
                        <div className={`relative overflow-hidden rounded-2xl p-16 text-center backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-violet-500 to-purple-600" />
                            <div className="relative">
                                <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30 mb-6">
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                                <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {t('jobs.no_jobs')}
                                </h3>
                                <p className={`text-sm mb-8 max-w-md mx-auto ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {t('jobs.no_jobs_description')}
                                </p>
                                <Link
                                    href="/jobs/create"
                                    className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    {t('jobs.create_first_job')}
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {jobs.last_page > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-2">
                            {jobs.prev_page_url && (
                                <Link href={jobs.prev_page_url} className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
                                    ← {t('common.previous')}
                                </Link>
                            )}
                            <span className={`px-4 py-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('common.page')} {jobs.current_page} / {jobs.last_page}
                            </span>
                            {jobs.next_page_url && (
                                <Link href={jobs.next_page_url} className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
                                    {t('common.next')} →
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
