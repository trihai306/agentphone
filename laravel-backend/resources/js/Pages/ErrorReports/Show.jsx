import { useForm, usePage, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useState } from 'react';

const statusConfig = {
    pending: { label: 'Pending', color: 'amber' },
    reviewing: { label: 'Reviewing', color: 'blue' },
    in_progress: { label: 'In Progress', color: 'purple' },
    resolved: { label: 'Resolved', color: 'emerald' },
    closed: { label: 'Closed', color: 'gray' },
};

export default function Show({ report, statuses, types, severities }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { flash } = usePage().props;
    const [showDeviceInfo, setShowDeviceInfo] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        message: '',
    });

    const handleSubmitResponse = (e) => {
        e.preventDefault();
        post(`/error-reports/${report.id}/respond`, {
            onSuccess: () => reset(),
        });
    };

    const getStatusStyle = (status) => {
        if (status === 'resolved' || status === 'closed') {
            return isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600';
        }
        if (status === 'pending') {
            return isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600';
        }
        return isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600';
    };

    const getSeverityStyle = (severity) => {
        if (severity === 'critical') return isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600';
        if (severity === 'high') return isDark ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-50 text-orange-600';
        return isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600';
    };

    return (
        <AppLayout title={`Report #${report.id}`}>
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1000px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-6">
                        <Link
                            href="/error-reports"
                            className={`p-2 rounded-lg mt-1 ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'}`}
                        >
                            <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {report.title}
                                </h1>
                                <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>#{report.id}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusStyle(report.status)}`}>
                                    {statuses[report.status]}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityStyle(report.severity)}`}>
                                    {severities[report.severity]}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${isDark ? 'bg-[#1a1a1a] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                                    {types[report.error_type]}
                                </span>
                                <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                    {new Date(report.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {flash?.success && (
                        <div className={`mb-6 p-3 rounded-lg ${isDark ? 'bg-emerald-900/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                            {flash.success}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Description */}
                            <div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                <h2 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Description</h2>
                                <p className={`whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {report.description}
                                </p>
                                {report.page_url && (
                                    <div className={`mt-4 pt-4 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Page URL: </span>
                                        <a href={report.page_url} target="_blank" className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'} break-all`}>
                                            {report.page_url}
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Screenshots */}
                            {report.screenshots?.length > 0 && (
                                <div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                    <h2 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Screenshots ({report.screenshots.length})
                                    </h2>
                                    <div className="grid grid-cols-3 gap-2">
                                        {report.screenshots.map((s, i) => (
                                            <a key={i} href={`/storage/${s}`} target="_blank" className="rounded-lg overflow-hidden">
                                                <img src={`/storage/${s}`} alt="" className="w-full h-24 object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Responses */}
                            <div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                <h2 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Discussion ({report.responses?.length || 0})
                                </h2>

                                {report.responses?.length === 0 ? (
                                    <p className={`text-center py-6 text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                        No responses yet
                                    </p>
                                ) : (
                                    <div className="space-y-4 mb-4">
                                        {report.responses.map((r) => (
                                            <div key={r.id} className={`p-3 rounded-lg ${r.is_admin_response ? (isDark ? 'bg-blue-900/20' : 'bg-blue-50') : (isDark ? 'bg-[#222]' : 'bg-gray-50')}`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {r.is_admin_response ? 'Admin' : 'You'}
                                                    </span>
                                                    {r.is_admin_response && (
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>Support</span>
                                                    )}
                                                    <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                                        {new Date(r.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{r.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Response Form */}
                                {!['resolved', 'closed'].includes(report.status) && (
                                    <form onSubmit={handleSubmitResponse} className={`pt-4 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                                        <textarea
                                            value={data.message}
                                            onChange={(e) => setData('message', e.target.value)}
                                            placeholder="Write a response..."
                                            rows={3}
                                            className={`w-full px-3 py-2 rounded-lg text-sm resize-none ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                                } border focus:outline-none`}
                                        />
                                        {errors.message && <p className="text-sm text-red-500 mt-1">{errors.message}</p>}
                                        <div className="flex justify-end mt-2">
                                            <button
                                                type="submit"
                                                disabled={processing || !data.message.trim()}
                                                className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                                    } disabled:opacity-50`}
                                            >
                                                {processing ? 'Sending...' : 'Send'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-4">
                            {/* Status */}
                            <div className={`p-4 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                <h3 className={`text-xs font-medium mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Status</h3>
                                <div className="space-y-2">
                                    {Object.entries(statuses).map(([key, label]) => (
                                        <div key={key} className={`flex items-center gap-2 text-sm ${report.status === key ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-600' : 'text-gray-400')}`}>
                                            <div className={`w-2 h-2 rounded-full ${report.status === key ? (key === 'resolved' || key === 'closed' ? 'bg-emerald-500' : 'bg-blue-500') : (isDark ? 'bg-gray-700' : 'bg-gray-200')}`} />
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Assignee */}
                            {report.assigned_admin && (
                                <div className={`p-4 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                    <h3 className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Assigned To</h3>
                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{report.assigned_admin.name}</p>
                                </div>
                            )}

                            {/* Device Info */}
                            {report.device_info && (
                                <div className={`p-4 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Device</h3>
                                        <button
                                            onClick={() => setShowDeviceInfo(!showDeviceInfo)}
                                            className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                                        >
                                            {showDeviceInfo ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                    {showDeviceInfo && (
                                        <div className={`text-xs space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            <p>Platform: {report.device_info.platform}</p>
                                            <p>Screen: {report.device_info.screenWidth}x{report.device_info.screenHeight}</p>
                                            {report.device_info.timezone && <p>Timezone: {report.device_info.timezone}</p>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
