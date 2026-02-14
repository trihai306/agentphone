import { usePage, router, Link, Head } from '@inertiajs/react';
import { Alert } from '@/Components/UI';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const statusConfig = {
    pending: { label: 'Pending', color: 'amber' },
    reviewing: { label: 'Reviewing', color: 'blue' },
    in_progress: { label: 'In Progress', color: 'purple' },
    resolved: { label: 'Resolved', color: 'emerald' },
    closed: { label: 'Closed', color: 'gray' },
};

const severityConfig = {
    low: { label: 'Low', color: 'gray' },
    medium: { label: 'Medium', color: 'amber' },
    high: { label: 'High', color: 'orange' },
    critical: { label: 'Critical', color: 'red' },
};

export default function Index({ reports, currentStatus, statusCounts, statuses, types, severities }) {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const { flash } = usePage().props;
    const isDark = theme === 'dark';

    const handleFilterChange = (status) => {
        router.get('/error-reports', { status }, { preserveState: true });
    };

    const getStatusStyle = (status) => {
        const config = statusConfig[status] || statusConfig.pending;
        return isDark
            ? `bg-${config.color}-900/30 text-${config.color}-400`
            : `bg-${config.color}-50 text-${config.color}-600`;
    };

    return (
        <AppLayout title="Error Reports">
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1100px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('error_reports.title')}
                            </h1>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {t('error_reports.description')}
                            </p>
                        </div>
                        <Link
                            href="/error-reports/create"
                            className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                }`}
                        >
                            {t('error_reports.new_report')}
                        </Link>
                    </div>

                    {/* Flash */}
                    {flash?.success && (
                        <Alert type="success" className="mb-6">{flash.success}</Alert>
                    )}

                    {/* Status Filter */}
                    <div className="flex items-center gap-2 mb-6 overflow-x-auto">
                        <button
                            onClick={() => handleFilterChange('all')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${currentStatus === 'all'
                                ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {t('error_reports.all')} ({statusCounts.all})
                        </button>
                        {Object.entries(statuses).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => handleFilterChange(key)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${currentStatus === key
                                    ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                {label} {statusCounts[key] > 0 && `(${statusCounts[key]})`}
                            </button>
                        ))}
                    </div>

                    {/* Reports */}
                    {reports.data?.length === 0 ? (
                        <div className={`rounded-xl p-16 text-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <div className={`w-14 h-14 mx-auto rounded-lg flex items-center justify-center mb-4 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                                <svg className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </div>
                            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('error_reports.no_reports')}
                            </h3>
                            <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('error_reports.no_reports_yet')}
                            </p>
                            <Link
                                href="/error-reports/create"
                                className={`inline-block px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                    }`}
                            >
                                {t('error_reports.create_first')}
                            </Link>
                        </div>
                    ) : (
                        <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <table className="w-full">
                                <thead>
                                    <tr className={`border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                                        <th className={`text-left py-3 px-4 text-xs font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Report</th>
                                        <th className={`text-center py-3 px-4 text-xs font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Status</th>
                                        <th className={`text-center py-3 px-4 text-xs font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Severity</th>
                                        <th className={`text-left py-3 px-4 text-xs font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Date</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDark ? 'divide-[#2a2a2a]' : 'divide-gray-100'}`}>
                                    {reports.data.map((report) => (
                                        <tr key={report.id} className={isDark ? 'hover:bg-[#222]' : 'hover:bg-gray-50'}>
                                            <td className="py-4 px-4">
                                                <Link href={`/error-reports/${report.id}`} className="block">
                                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {report.title}
                                                        <span className={`ml-2 text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>#{report.id}</span>
                                                    </p>
                                                    <p className={`text-sm mt-0.5 line-clamp-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {report.description}
                                                    </p>
                                                </Link>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${report.status === 'resolved' || report.status === 'closed'
                                                    ? isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                                                    : report.status === 'pending'
                                                        ? isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600'
                                                        : isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    {statuses[report.status]}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${report.severity === 'critical'
                                                    ? isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'
                                                    : report.severity === 'high'
                                                        ? isDark ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-50 text-orange-600'
                                                        : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {severities[report.severity]}
                                                </span>
                                            </td>
                                            <td className={`py-4 px-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {new Date(report.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {reports.links && (
                                <div className={`px-4 py-3 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                                    <div className="flex items-center justify-between">
                                        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {reports.from} - {reports.to} of {reports.total}
                                        </p>
                                        <div className="flex gap-1">
                                            {reports.links.map((link, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => link.url && router.get(link.url)}
                                                    disabled={!link.url}
                                                    className={`px-3 py-1 text-sm rounded-md ${link.active
                                                        ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                                                        : link.url
                                                            ? isDark ? 'text-gray-400 hover:bg-[#2a2a2a]' : 'text-gray-500 hover:bg-gray-100'
                                                            : isDark ? 'text-gray-600' : 'text-gray-300'
                                                        }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
