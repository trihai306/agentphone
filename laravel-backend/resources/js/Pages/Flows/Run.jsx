import { useState, useEffect } from 'react';
import { Link, router, Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Run({ flow, devices = [], dataSource = null }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [selectedDevice, setSelectedDevice] = useState(null);
    const [jobName, setJobName] = useState(`${flow.name} - ${new Date().toLocaleDateString()}`);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Auto-select first online device
    useEffect(() => {
        const onlineDevice = devices.find(d => d.is_online || d.socket_connected);
        if (onlineDevice && !selectedDevice) {
            setSelectedDevice(onlineDevice.id);
        }
    }, [devices]);

    // Calculate total iterations - APK will run all records
    const getIterationCount = () => {
        if (!dataSource) return 1;
        return dataSource.records_count || 1;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!selectedDevice) {
            setError('Vui lòng chọn thiết bị');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        router.post('/jobs', {
            name: jobName,
            flow_id: flow.id,
            device_id: selectedDevice,
            data_collection_id: dataSource?.id || null,
            execution_mode: 'sequential',
        }, {
            onSuccess: () => {
                // Redirect handled by controller
            },
            onError: (errors) => {
                setError(Object.values(errors)[0] || 'Có lỗi xảy ra');
                setIsSubmitting(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    return (
        <AppLayout title={`Run: ${flow.name}`}>
            <Head title={`Run: ${flow.name}`} />
            <div className={`min-h-screen ${isDark ? 'bg-[#09090b]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
                {/* Background decoration */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-200/50'}`} />
                    <div className={`absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-violet-900/20' : 'bg-violet-200/40'}`} />
                </div>

                <div className="relative max-w-4xl mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link
                            href="/flows"
                            className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Chạy Workflow
                            </h1>
                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                Cấu hình và chạy workflow trên thiết bị
                            </p>
                        </div>
                    </div>

                    {/* Workflow Info Card */}
                    <div className={`rounded-2xl p-6 mb-6 backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {flow.name}
                                </h2>
                                <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {flow.description || 'Không có mô tả'}
                                </p>
                                <div className="flex items-center gap-4 mt-3">
                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {flow.action_nodes_count || flow.nodes_count} actions
                                    </span>
                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Cập nhật {flow.updated_at}
                                    </span>
                                </div>
                            </div>
                            <Link
                                href={`/flows/${flow.id}/edit`}
                                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                            >
                                Chỉnh sửa
                            </Link>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Job Name */}
                        <div className={`rounded-2xl p-6 backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Tên Job
                            </label>
                            <input
                                type="text"
                                value={jobName}
                                onChange={(e) => setJobName(e.target.value)}
                                className={`w-full px-4 py-3 rounded-xl text-sm ${isDark
                                    ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-violet-500'
                                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500'
                                    } border focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all`}
                                placeholder="Nhập tên job..."
                            />
                        </div>

                        {/* Device Selection */}
                        <div className={`rounded-2xl p-6 backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Chọn Thiết Bị <span className="text-red-500">*</span>
                                </label>
                                <Link href="/devices" className={`text-xs ${isDark ? 'text-violet-400' : 'text-violet-600'} hover:underline`}>
                                    Quản lý thiết bị →
                                </Link>
                            </div>

                            {devices.length === 0 ? (
                                <div className={`text-center py-8 rounded-xl border-2 border-dashed ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                    <svg className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        Chưa có thiết bị nào
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {devices.map((device) => (
                                        <button
                                            key={device.id}
                                            type="button"
                                            onClick={() => setSelectedDevice(device.id)}
                                            disabled={!device.is_online && !device.socket_connected}
                                            className={`relative flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${selectedDevice === device.id
                                                ? 'border-emerald-500 bg-emerald-500/10'
                                                : device.is_online || device.socket_connected
                                                    ? isDark ? 'border-white/10 hover:border-white/20 bg-white/5' : 'border-gray-200 hover:border-gray-300 bg-white'
                                                    : isDark ? 'border-white/5 bg-white/2 opacity-50 cursor-not-allowed' : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                                }`}
                                        >
                                            {/* Online indicator */}
                                            <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${device.socket_connected
                                                ? 'bg-emerald-500 animate-pulse'
                                                : device.is_online
                                                    ? 'bg-emerald-500'
                                                    : 'bg-gray-400'
                                                }`} />

                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${device.is_online || device.socket_connected
                                                ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                                                : isDark ? 'bg-white/10' : 'bg-gray-200'
                                                }`}>
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {device.name}
                                                </p>
                                                <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                                    {device.model}
                                                </p>
                                            </div>
                                            {selectedDevice === device.id && (
                                                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Data Source Info (Read-only from workflow) */}
                        <div className={`rounded-2xl p-6 backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Nguồn Dữ Liệu
                                </label>
                                {dataSource && (
                                    <Link href={`/data-collections/${dataSource.id}`} className={`text-xs ${isDark ? 'text-violet-400' : 'text-violet-600'} hover:underline`}>
                                        Xem chi tiết →
                                    </Link>
                                )}
                            </div>

                            {dataSource ? (
                                <div className={`flex items-center gap-4 p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl"
                                        style={{ backgroundColor: dataSource.color || '#8B5CF6' }}
                                    >
                                        {dataSource.icon || '📊'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {dataSource.name}
                                        </p>
                                        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                            {dataSource.records_count} records - APK sẽ tự động lặp qua tất cả
                                        </p>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
                                        Từ workflow
                                    </div>
                                </div>
                            ) : (
                                <div className={`flex items-center gap-4 p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                                        <svg className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            Không có nguồn dữ liệu
                                        </p>
                                        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                            Workflow sẽ chạy 1 lần duy nhất
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Summary & Submit */}
                        <div className={`rounded-2xl p-6 backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                            <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Tóm tắt
                            </h3>

                            <div className={`grid grid-cols-3 gap-4 p-4 rounded-xl mb-6 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {getIterationCount()}
                                    </p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        Lần chạy
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {flow.action_nodes_count || flow.nodes_count}
                                    </p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        Actions/lần
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {getIterationCount() * (flow.action_nodes_count || flow.nodes_count)}
                                    </p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        Tổng actions
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex items-center gap-4">
                                <Link
                                    href="/flows"
                                    className={`flex-1 py-3 text-center text-sm font-medium rounded-xl transition-all ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                                >
                                    Huỷ
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !selectedDevice}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Đang tạo job...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Chạy Workflow
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
