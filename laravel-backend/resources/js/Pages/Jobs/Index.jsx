import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../Layouts/AppLayout';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { useTheme } from '@/Contexts/ThemeContext';
import CreateJobModal from '@/Components/Job/CreateJobModal';

// Simple debounce implementation
function useDebounce(callback, delay) {
    const timeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return useCallback((...args) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => callback(...args), delay);
    }, [callback, delay]);
}

const statusColors = {
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/20', icon: '⏳' },
    queued: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', icon: '📋' },
    running: { bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/20', icon: '▶️' },
    completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', icon: '✓' },
    failed: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20', icon: '✕' },
    cancelled: { bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500/20', icon: '⊘' },
};

export default function Index({ jobs, stats, deviceStats = [], devices = [], flows = [], filters = {} }) {
    const { t } = useTranslation();
    const { showConfirm } = useConfirm();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [search, setSearch] = useState(filters.search || '');
    const [showDevicePanel, setShowDevicePanel] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Debounced search
    const debouncedSearch = useDebounce((value) => {
        router.get('/jobs', { ...filters, search: value || undefined }, { preserveState: true, replace: true });
    }, 300);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        debouncedSearch(value);
    };

    const handleFilterChange = (key, value) => {
        router.get('/jobs', { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    };

    const handleCancel = async (jobId, e) => {
        e?.preventDefault();
        const confirmed = await showConfirm({
            title: t('jobs.cancel_job'),
            message: t('jobs.confirm_cancel'),
            type: 'warning',
        });
        if (confirmed) router.post(`/jobs/${jobId}/cancel`);
    };

    const handleDelete = async (jobId, e) => {
        e?.preventDefault();
        const confirmed = await showConfirm({
            title: t('jobs.delete_job'),
            message: t('jobs.confirm_delete'),
            type: 'danger',
        });
        if (confirmed) router.delete(`/jobs/${jobId}`);
    };

    return (
        <AppLayout title={t('jobs.title')}>
            <div className={`min-h-screen ${isDark ? 'bg-[#09090b]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
                {/* Background decoration */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-violet-900/20' : 'bg-violet-200/50'}`} />
                    <div className={`absolute bottom-0 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-200/40'}`} />
                </div>

                <div className="relative max-w-[1600px] mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-8">
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
                                    Quản lý và theo dõi tất cả jobs
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {t('jobs.create_job')}
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-5 gap-4 mb-6">
                        {[
                            { label: 'Tổng', value: stats?.total || 0, gradient: 'from-violet-500 to-purple-600', key: 'all' },
                            { label: 'Chờ', value: stats?.pending || 0, gradient: 'from-yellow-500 to-orange-500', key: 'pending' },
                            { label: 'Đang chạy', value: stats?.running || 0, gradient: 'from-blue-500 to-cyan-500', key: 'running', pulse: stats?.running > 0 },
                            { label: 'Hoàn thành', value: stats?.completed || 0, gradient: 'from-emerald-500 to-teal-500', key: 'completed' },
                            { label: 'Thất bại', value: stats?.failed || 0, gradient: 'from-red-500 to-rose-500', key: 'failed' },
                        ].map((stat) => (
                            <button
                                key={stat.key}
                                onClick={() => handleFilterChange('status', stat.key === 'all' ? undefined : stat.key)}
                                className={`relative overflow-hidden p-4 rounded-2xl backdrop-blur-xl border transition-all hover:scale-[1.02] text-left
                                    ${filters.status === stat.key || (stat.key === 'all' && !filters.status)
                                        ? 'ring-2 ring-violet-500'
                                        : ''
                                    }
                                    ${isDark ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-white/80 border-gray-200/50 hover:border-gray-300 shadow-lg'}`}
                            >
                                <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl bg-gradient-to-br ${stat.gradient} opacity-20`} />
                                <div className="relative flex items-center justify-between">
                                    <div>
                                        <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {stat.label}
                                        </p>
                                        <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {stat.value}
                                        </p>
                                    </div>
                                    {stat.pulse && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-6">
                        {/* Device Stats Panel */}
                        {showDevicePanel && deviceStats.length > 0 && (
                            <div className={`w-72 shrink-0 rounded-2xl backdrop-blur-xl border overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                                <div className={`px-4 py-3 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                                    <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        📱 Thiết bị
                                    </h3>
                                </div>
                                <div className="p-2 space-y-1 max-h-[500px] overflow-y-auto">
                                    {/* All devices button */}
                                    <button
                                        onClick={() => handleFilterChange('device_id', undefined)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left
                                            ${!filters.device_id
                                                ? 'bg-violet-500/20 text-violet-400'
                                                : isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-50 text-gray-600'}`}
                                    >
                                        <span className="text-lg">🌐</span>
                                        <span className="flex-1 text-sm font-medium">Tất cả thiết bị</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                                            {stats?.total || 0}
                                        </span>
                                    </button>

                                    {deviceStats.map(device => (
                                        <button
                                            key={device.id}
                                            onClick={() => handleFilterChange('device_id', device.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left
                                                ${filters.device_id == device.id
                                                    ? 'bg-violet-500/20'
                                                    : isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className="relative">
                                                <span className="text-lg">📱</span>
                                                <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${device.socket_connected ? 'bg-green-500' : 'bg-gray-500'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {device.name || 'Thiết bị'}
                                                </p>
                                                <div className="flex gap-2 text-[10px] mt-0.5">
                                                    {device.running_jobs > 0 && (
                                                        <span className="text-violet-400">▶ {device.running_jobs}</span>
                                                    )}
                                                    {device.completed_jobs > 0 && (
                                                        <span className="text-emerald-400">✓ {device.completed_jobs}</span>
                                                    )}
                                                    {device.failed_jobs > 0 && (
                                                        <span className="text-red-400">✕ {device.failed_jobs}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                                {device.total_jobs}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                            {/* Search & Filters */}
                            <div className={`flex items-center gap-3 p-3 rounded-xl mb-4 ${isDark ? 'bg-white/5' : 'bg-white/80 shadow'}`}>
                                <div className="relative flex-1">
                                    <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={handleSearchChange}
                                        placeholder="Tìm kiếm job..."
                                        className={`w-full pl-10 pr-4 py-2 rounded-lg border-0 ${isDark ? 'bg-white/5 text-white placeholder:text-gray-600' : 'bg-gray-50 text-gray-900 placeholder:text-gray-400'} focus:outline-none focus:ring-2 focus:ring-violet-500/50`}
                                    />
                                </div>
                                <button
                                    onClick={() => setShowDevicePanel(!showDevicePanel)}
                                    className={`p-2 rounded-lg ${showDevicePanel ? 'bg-violet-500/20 text-violet-400' : isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                                    title="Toggle device panel"
                                >
                                    📱
                                </button>
                            </div>

                            {/* Active Filters */}
                            {(filters.status || filters.device_id || filters.search) && (
                                <div className="flex items-center gap-2 mb-4 flex-wrap">
                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Bộ lọc:</span>
                                    {filters.status && filters.status !== 'all' && (
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${statusColors[filters.status]?.bg} ${statusColors[filters.status]?.text}`}>
                                            {filters.status}
                                            <button onClick={() => handleFilterChange('status', undefined)} className="hover:opacity-70">✕</button>
                                        </span>
                                    )}
                                    {filters.device_id && (
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                            📱 {devices.find(d => d.id == filters.device_id)?.name || 'Device'}
                                            <button onClick={() => handleFilterChange('device_id', undefined)} className="hover:opacity-70">✕</button>
                                        </span>
                                    )}
                                    {filters.search && (
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                                            "{filters.search}"
                                            <button onClick={() => { setSearch(''); handleFilterChange('search', undefined); }} className="hover:opacity-70">✕</button>
                                        </span>
                                    )}
                                    <button
                                        onClick={() => router.get('/jobs')}
                                        className={`text-xs ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        Xóa tất cả
                                    </button>
                                </div>
                            )}

                            {/* Jobs List */}
                            {jobs.data?.length > 0 ? (
                                <div className={`rounded-2xl overflow-hidden backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                                    <table className="w-full">
                                        <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                                            <tr>
                                                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Job</th>
                                                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Workflow</th>
                                                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Thiết bị</th>
                                                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Trạng thái</th>
                                                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tiến độ</th>
                                                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Thời gian</th>
                                                <th className={`px-4 py-3 w-20`}></th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
                                            {jobs.data.map((job) => {
                                                const statusStyle = statusColors[job.status] || statusColors.pending;
                                                const progress = job.total_tasks > 0 ? Math.round((job.completed_tasks / job.total_tasks) * 100) : 0;

                                                return (
                                                    <tr key={job.id} className={`${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors`}>
                                                        <td className="px-4 py-3">
                                                            <Link href={`/jobs/${job.id}`} className={`font-medium ${isDark ? 'text-white hover:text-violet-400' : 'text-gray-900 hover:text-violet-600'}`}>
                                                                {job.name}
                                                            </Link>
                                                            {job.is_multi_workflow && (
                                                                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
                                                                    🔗 Chain
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {job.is_multi_workflow ? (
                                                                <div className="flex items-center gap-1">
                                                                    {job.workflow_items?.slice(0, 3).map((item, i) => (
                                                                        <span key={item.id} className={`text-xs px-1.5 py-0.5 rounded ${item.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                            item.status === 'running' ? 'bg-violet-500/20 text-violet-400' :
                                                                                item.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                                                                                    isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'
                                                                            }`}>
                                                                            {i + 1}
                                                                        </span>
                                                                    ))}
                                                                    {job.workflow_items?.length > 3 && (
                                                                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>+{job.workflow_items.length - 3}</span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                    {job.flow?.name || '-'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-2 h-2 rounded-full ${job.device?.socket_connected ? 'bg-green-500' : 'bg-gray-500'}`} />
                                                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                    {job.device?.name || '-'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                                                                <span>{statusStyle.icon}</span>
                                                                {job.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-20 h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                                                                    <div
                                                                        className={`h-full rounded-full transition-all ${job.status === 'completed' ? 'bg-emerald-500' : job.status === 'failed' ? 'bg-red-500' : 'bg-violet-500'}`}
                                                                        style={{ width: `${progress}%` }}
                                                                    />
                                                                </div>
                                                                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                    {job.completed_tasks}/{job.total_tasks}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                {job.created_at_human}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Link
                                                                    href={`/jobs/${job.id}`}
                                                                    className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                </Link>
                                                                {['pending', 'queued', 'running'].includes(job.status) && (
                                                                    <button
                                                                        onClick={(e) => handleCancel(job.id, e)}
                                                                        className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-400' : 'hover:bg-yellow-50 text-gray-400 hover:text-yellow-600'}`}
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                    </button>
                                                                )}
                                                                {!['running', 'pending', 'queued'].includes(job.status) && (
                                                                    <button
                                                                        onClick={(e) => handleDelete(job.id, e)}
                                                                        className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
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
                                            {filters.search || filters.status || filters.device_id ? 'Không tìm thấy job' : t('jobs.no_jobs')}
                                        </h3>
                                        <p className={`text-sm mb-8 max-w-md mx-auto ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                            {filters.search || filters.status || filters.device_id
                                                ? 'Thử thay đổi bộ lọc để xem kết quả khác'
                                                : t('jobs.no_jobs_description')}
                                        </p>
                                        <button
                                            onClick={() => setShowCreateModal(true)}
                                            className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            {t('jobs.create_first_job')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Professional Pagination */}
                            {jobs.last_page > 1 && (
                                <div className={`mt-6 flex items-center justify-between px-4 py-3 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    {/* Info */}
                                    <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Hiển thị <span className="font-semibold">{jobs.from || 0}</span> - <span className="font-semibold">{jobs.to || 0}</span> / <span className="font-semibold">{jobs.total}</span> jobs
                                    </div>

                                    {/* Page Numbers */}
                                    <div className="flex items-center gap-1">
                                        {/* First Page */}
                                        {jobs.current_page > 2 && (
                                            <>
                                                <Link
                                                    href={`/jobs?page=1${filters.status && filters.status !== 'all' ? `&status=${filters.status}` : ''}${filters.device_id ? `&device_id=${filters.device_id}` : ''}${filters.search ? `&search=${filters.search}` : ''}`}
                                                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}
                                                >
                                                    1
                                                </Link>
                                                {jobs.current_page > 3 && <span className={`px-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>...</span>}
                                            </>
                                        )}

                                        {/* Prev Page */}
                                        {jobs.prev_page_url && jobs.current_page > 1 && (
                                            <Link
                                                href={jobs.prev_page_url}
                                                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}
                                            >
                                                {jobs.current_page - 1}
                                            </Link>
                                        )}

                                        {/* Current Page */}
                                        <span className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
                                            {jobs.current_page}
                                        </span>

                                        {/* Next Page */}
                                        {jobs.next_page_url && jobs.current_page < jobs.last_page && (
                                            <Link
                                                href={jobs.next_page_url}
                                                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}
                                            >
                                                {jobs.current_page + 1}
                                            </Link>
                                        )}

                                        {/* Last Page */}
                                        {jobs.current_page < jobs.last_page - 1 && (
                                            <>
                                                {jobs.current_page < jobs.last_page - 2 && <span className={`px-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>...</span>}
                                                <Link
                                                    href={`/jobs?page=${jobs.last_page}${filters.status && filters.status !== 'all' ? `&status=${filters.status}` : ''}${filters.device_id ? `&device_id=${filters.device_id}` : ''}${filters.search ? `&search=${filters.search}` : ''}`}
                                                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}
                                                >
                                                    {jobs.last_page}
                                                </Link>
                                            </>
                                        )}
                                    </div>

                                    {/* Prev/Next Buttons */}
                                    <div className="flex gap-2">
                                        {jobs.prev_page_url ? (
                                            <Link href={jobs.prev_page_url} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}>
                                                ← Trước
                                            </Link>
                                        ) : (
                                            <span className={`px-3 py-1.5 rounded-lg text-sm ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>← Trước</span>
                                        )}
                                        {jobs.next_page_url ? (
                                            <Link href={jobs.next_page_url} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white">
                                                Tiếp →
                                            </Link>
                                        ) : (
                                            <span className={`px-3 py-1.5 rounded-lg text-sm ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>Tiếp →</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Job Modal */}
            <CreateJobModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                devices={deviceStats}
                flows={flows}
            />
        </AppLayout>
    );
}
