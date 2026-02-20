import { useState, useEffect } from 'react';
import { Link, router, usePage, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { Button, Icon } from '@/Components/UI';

export default function Create({ flows = [], devices = [], dataCollections = [] }) {
    const { theme } = useTheme();
    const { errors } = usePage().props;
    const isDark = theme === 'dark';

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [selectedFlow, setSelectedFlow] = useState(null);

    const onlineDevices = devices.filter(d => d.socket_connected || d.status === 'online');

    // Auto submit when both selected
    const handleSubmit = () => {
        if (!selectedDevice || !selectedFlow) return;

        setIsSubmitting(true);
        router.post('/jobs', {
            name: `${selectedFlow.name} - ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
            device_id: selectedDevice.id,
            flow_id: selectedFlow.id,
            priority: 5,
        }, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <AppLayout title="Tạo Job">
            <div className={`min-h-screen ${isDark ? 'bg-[#09090b]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
                {/* Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl ${isDark ? 'bg-violet-900/10' : 'bg-violet-200/30'}`} />
                    <div className={`absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl ${isDark ? 'bg-purple-900/10' : 'bg-purple-200/30'}`} />
                </div>

                <div className="relative max-w-5xl mx-auto px-6 py-12">
                    {/* Header - Simpler */}
                    <div className="text-center mb-12">
                        <Button variant="link" href="/jobs" as="Link" className={isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}>
                            ← Quay lại danh sách
                        </Button>
                        <h1 className={`text-4xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Chạy Workflow
                        </h1>
                        <p className={`text-lg ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            Chọn thiết bị và kịch bản bạn muốn chạy
                        </p>
                    </div>

                    {/* Two Column Selection */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        {/* Column 1: Device */}
                        <div>
                            <div className={`flex items-center gap-3 mb-4 ${selectedDevice ? 'text-emerald-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                                    ${selectedDevice
                                        ? 'bg-emerald-500 text-white'
                                        : isDark ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    {selectedDevice ? '✓' : '1'}
                                </div>
                                <div>
                                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        Chọn Thiết Bị
                                    </h2>
                                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {onlineDevices.length} thiết bị online
                                    </p>
                                </div>
                            </div>

                            <div className={`rounded-3xl border overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-xl'}`}>
                                {onlineDevices.length > 0 ? (
                                    <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                                        {onlineDevices.map(device => (
                                            <button
                                                key={device.id}
                                                onClick={() => setSelectedDevice(device)}
                                                className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group
                                                    ${selectedDevice?.id === device.id
                                                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500 scale-[1.02]'
                                                        : isDark
                                                            ? 'bg-white/5 border-white/10 hover:border-white/30 hover:scale-[1.01]'
                                                            : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:scale-[1.01]'}`}
                                            >
                                                <div className="relative">
                                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl
                                                        ${selectedDevice?.id === device.id
                                                            ? 'bg-emerald-500/30'
                                                            : isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                                                        <Icon name="device" className="w-5 h-5" />
                                                    </div>
                                                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                                                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-lg font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {device.name || 'Thiết bị Android'}
                                                    </p>
                                                    <p className={`text-sm truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {device.model || device.device_id}
                                                    </p>
                                                    <span className="inline-flex items-center gap-1 mt-2 text-emerald-500 text-sm font-medium">
                                                        <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                                                        Sẵn sàng
                                                    </span>
                                                </div>
                                                {selectedDevice?.id === device.id && (
                                                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xl">
                                                        ✓
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center">
                                        <div className="mb-4"><Icon name="noDevice" className="w-14 h-14 mx-auto" /></div>
                                        <p className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            Chưa có thiết bị online
                                        </p>
                                        <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Mở app CLICKAI trên điện thoại
                                        </p>
                                        <Button variant="primary" size="sm" href="/devices" as="Link">
                                            Xem hướng dẫn →
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Column 2: Workflow */}
                        <div>
                            <div className={`flex items-center gap-3 mb-4 ${selectedFlow ? 'text-emerald-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                                    ${selectedFlow
                                        ? 'bg-emerald-500 text-white'
                                        : isDark ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    {selectedFlow ? '✓' : '2'}
                                </div>
                                <div>
                                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        Chọn Kịch Bản
                                    </h2>
                                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {flows.length} workflow có sẵn
                                    </p>
                                </div>
                            </div>

                            <div className={`rounded-3xl border overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-xl'}`}>
                                {flows.length > 0 ? (
                                    <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                                        {flows.map(flow => (
                                            <button
                                                key={flow.id}
                                                onClick={() => setSelectedFlow(flow)}
                                                className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left
                                                    ${selectedFlow?.id === flow.id
                                                        ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-500 scale-[1.02]'
                                                        : isDark
                                                            ? 'bg-white/5 border-white/10 hover:border-white/30 hover:scale-[1.01]'
                                                            : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:scale-[1.01]'}`}
                                            >
                                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl
                                                    ${selectedFlow?.id === flow.id
                                                        ? 'bg-violet-500/30'
                                                        : isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                                                    <Icon name="credits" className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-lg font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {flow.name}
                                                    </p>
                                                    {flow.description && (
                                                        <p className={`text-sm truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            {flow.description}
                                                        </p>
                                                    )}
                                                </div>
                                                {selectedFlow?.id === flow.id && (
                                                    <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white text-xl">
                                                        ✓
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center">
                                        <div className="mb-4"><Icon name="credits" className="w-14 h-14 mx-auto" /></div>
                                        <p className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            Chưa có workflow
                                        </p>
                                        <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Ghi hình thao tác để tạo workflow đầu tiên
                                        </p>
                                        <Button variant="primary" size="sm" href="/flows" as="Link">
                                            Tạo workflow →
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Area */}
                    <div className={`rounded-3xl p-8 text-center ${selectedDevice && selectedFlow
                        ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-2 border-violet-500/50'
                        : isDark ? 'bg-white/5' : 'bg-gray-100'}`}>

                        {selectedDevice && selectedFlow ? (
                            <>
                                <div className="flex items-center justify-center gap-4 mb-6">
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isDark ? 'bg-white/10' : 'bg-white'}`}>
                                        <Icon name="device" className="w-6 h-6" />
                                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {selectedDevice.name || 'Thiết bị'}
                                        </span>
                                    </div>
                                    <span className="text-2xl">→</span>
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isDark ? 'bg-white/10' : 'bg-white'}`}>
                                        <Icon name="credits" className="w-6 h-6" />
                                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {selectedFlow.name}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    variant="gradient"
                                    size="lg"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    loading={isSubmitting}
                                    className="px-12 py-5 text-xl bg-gradient-to-r from-violet-500 to-purple-600 shadow-2xl shadow-violet-500/40 hover:shadow-violet-500/60 hover:scale-105 active:scale-95"
                                >
                                    {isSubmitting ? 'Đang khởi tạo...' : 'Bắt Đầu Chạy'}
                                </Button>
                            </>
                        ) : (
                            <div className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                <p className="text-lg mb-2">
                                    {!selectedDevice && !selectedFlow
                                        ? 'Chọn thiết bị và kịch bản ở trên'
                                        : !selectedDevice
                                            ? 'Chọn thiết bị để tiếp tục'
                                            : 'Chọn kịch bản để tiếp tục'}
                                </p>
                                <p className="text-sm">
                                    Sau khi chọn đủ, nút "Bắt Đầu Chạy" sẽ xuất hiện
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
