import { useState } from 'react';
import { Link, router, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import ConfirmModal from '@/Components/UI/ConfirmModal';
import { Button, Icon } from '@/Components/UI';

const statusConfig = {
    draft: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Nháp', iconName: 'edit' },
    active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Đang chạy', iconName: 'play' },
    paused: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Tạm dừng', iconName: 'clock' },
    completed: { bg: 'bg-violet-500/10', text: 'text-violet-400', label: 'Hoàn thành', iconName: 'checkCircle' },
};

export default function Show({ campaign }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const status = statusConfig[campaign?.status] || statusConfig.draft;

    const [confirmModal, setConfirmModal] = useState({ isOpen: false });
    const [isProcessing, setIsProcessing] = useState(false);

    const progress = campaign?.total_records > 0
        ? Math.round((campaign.records_processed / campaign.total_records) * 100)
        : 0;

    const handleRun = () => {
        setConfirmModal({
            isOpen: true,
            type: 'success',
            title: 'Chạy Campaign',
            message: `Bắt đầu chạy campaign "${campaign.name}"?`,
            confirmText: 'Bắt đầu',
            onConfirm: () => {
                setIsProcessing(true);
                router.post(`/campaigns/${campaign.id}/run`, {}, {
                    onFinish: () => { setIsProcessing(false); setConfirmModal({ isOpen: false }); },
                });
            },
        });
    };

    const handlePause = () => {
        setConfirmModal({
            isOpen: true,
            type: 'warning',
            title: 'Tạm dừng Campaign',
            message: `Tạm dừng campaign "${campaign.name}"?`,
            confirmText: 'Tạm dừng',
            onConfirm: () => {
                setIsProcessing(true);
                router.post(`/campaigns/${campaign.id}/pause`, {}, {
                    onFinish: () => { setIsProcessing(false); setConfirmModal({ isOpen: false }); },
                });
            },
        });
    };

    if (!campaign) {
        return (
            <AppLayout title="Campaign">
                <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#09090b]' : 'bg-gray-50'}`}>
                    <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>Không tìm thấy campaign</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title={campaign.name}>
            <div className={`min-h-screen ${isDark ? 'bg-[#09090b]' : 'bg-gray-50'}`}>
                <div className="max-w-[1400px] mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-5">
                            <Button variant="ghost" size="icon" href="/campaigns" as="Link">
                                ←
                            </Button>
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                                style={{ backgroundColor: `${campaign.color}20` }}
                            >
                                {campaign.icon ? campaign.icon : <Icon name="seed" className="w-8 h-8" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {campaign.name}
                                    </h1>
                                    <span className={`text-sm px-3 py-1 rounded-full ${status.bg} ${status.text}`}>
                                        <Icon name={status.iconName} className="w-4 h-4 inline-block" /> {status.label}
                                    </span>
                                </div>
                                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {campaign.description || 'Chưa có mô tả'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {campaign.status === 'active' ? (
                                <Button variant="secondary" onClick={handlePause} className={isDark ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}>
                                    Tạm dừng
                                </Button>
                            ) : (
                                <Button variant="gradient" onClick={handleRun} className="bg-gradient-to-r from-emerald-500 to-teal-600">
                                    Chạy Campaign
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-5 gap-4 mb-8">
                        {[
                            { label: 'Records', value: campaign.total_records || 0, icon: 'chartBar', color: 'violet' },
                            { label: 'Đã xử lý', value: campaign.records_processed || 0, icon: 'check', color: 'blue' },
                            { label: 'Thành công', value: campaign.records_success || 0, icon: 'checkCircle', color: 'emerald' },
                            { label: 'Thất bại', value: campaign.records_failed || 0, icon: 'xCircle', color: 'red' },
                            { label: 'Lặp/record', value: campaign.repeat_per_record || 1, icon: 'refresh', color: 'amber' },
                        ].map(stat => (
                            <div key={stat.label} className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <Icon name={stat.icon} className="w-5 h-5" />
                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{stat.label}</span>
                                </div>
                                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Progress Bar */}
                    <div className={`p-6 rounded-2xl mb-8 ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Tiến độ tổng thể</span>
                            <span className={`text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{progress}%</span>
                        </div>
                        <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className={`flex justify-between text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <span>{campaign.records_processed || 0} / {campaign.total_records || 0} records</span>
                            <span>Tỷ lệ thành công: {campaign.records_processed > 0 ? Math.round((campaign.records_success / campaign.records_processed) * 100) : 0}%</span>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-3 gap-6">
                        {/* Left: Configuration */}
                        <div className={`col-span-2 rounded-2xl p-6 ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                            <h2 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}><Icon name="settings" className="w-5 h-5 inline-block mr-1" /> Cấu hình</h2>

                            {/* Data Collection */}
                            <div className="mb-6">
                                <label className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Data Collection</label>
                                <div className={`mt-2 p-4 rounded-xl flex items-center gap-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    {campaign.data_collection?.icon ? <span className="text-2xl">{campaign.data_collection.icon}</span> : <Icon name="database" className="w-6 h-6" />}
                                    <div>
                                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{campaign.data_collection?.name || 'Chưa chọn'}</p>
                                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{campaign.data_collection?.total_records || 0} records</p>
                                    </div>
                                </div>
                            </div>

                            {/* Workflows */}
                            <div className="mb-6">
                                <label className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Workflows ({campaign.workflows?.length || 0})</label>
                                <div className="mt-2 space-y-2">
                                    {campaign.workflows?.length > 0 ? campaign.workflows.map((wf, index) => (
                                        <div key={wf.id} className={`p-3 rounded-xl flex items-center gap-3 ${isDark ? 'bg-violet-500/10' : 'bg-violet-50'}`}>
                                            <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center font-bold">{index + 1}</span>
                                            <span className={isDark ? 'text-white' : 'text-gray-900'}>{wf.name}</span>
                                        </div>
                                    )) : (
                                        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Chưa chọn workflow</p>
                                    )}
                                </div>
                            </div>

                            {/* Devices */}
                            <div>
                                <label className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Thiết bị ({campaign.devices?.length || 0})</label>
                                <div className="mt-2 grid grid-cols-3 gap-2">
                                    {campaign.devices?.length > 0 ? campaign.devices.map(device => (
                                        <div key={device.id} className={`p-3 rounded-xl flex items-center gap-2 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                            <div className="relative">
                                                <Icon name="device" className="w-5 h-5" />
                                                <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${device.socket_connected ? 'bg-green-500' : 'bg-gray-400'}`} />
                                            </div>
                                            <span className={`text-sm truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{device.name}</span>
                                        </div>
                                    )) : (
                                        <p className={`text-sm col-span-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Chưa chọn thiết bị</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Recent Jobs */}
                        <div className={`rounded-2xl p-6 ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}><Icon name="clipboard" className="w-5 h-5 inline-block mr-1" /> Jobs gần đây</h2>
                                <Button variant="link" size="xs" href="/jobs" as="Link" className={isDark ? 'text-violet-400' : 'text-violet-600'}>Xem tất cả →</Button>
                            </div>
                            {campaign.jobs?.length > 0 ? (
                                <div className="space-y-2">
                                    {campaign.jobs.slice(0, 8).map(job => (
                                        <div key={job.id} className={`p-3 rounded-xl flex items-center justify-between ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${job.status === 'completed' ? 'bg-emerald-500' :
                                                    job.status === 'running' ? 'bg-blue-500 animate-pulse' :
                                                        job.status === 'failed' ? 'bg-red-500' : 'bg-gray-400'
                                                    }`} />
                                                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Job #{job.id}</span>
                                            </div>
                                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{job.status}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <Icon name="inbox" className="w-8 h-8 mx-auto mb-2" />
                                    <p className="text-sm">Chưa có job nào</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
                isLoading={isProcessing}
            />
        </AppLayout>
    );
}
