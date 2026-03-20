import { useState, useEffect } from 'react';
import { Link, router, usePage, Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { Button, Icon } from '@/Components/UI';

export default function Create({ flows = [], devices = [], dataCollections = [] }) {
    const { t } = useTranslation();
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

        // Build payload - include data_collection_id if the flow has a data source node
        const payload = {
            name: `${selectedFlow.name} - ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
            device_id: selectedDevice.id,
            flow_id: selectedFlow.id,
            priority: 5,
            execution_mode: 'sequential',
        };

        // Check if the selected flow has data_collection info (from nodes or metadata)
        const dataSourceNode = selectedFlow.nodes?.find(n => n.type === 'data_source');
        if (dataSourceNode?.data?.collectionId) {
            payload.data_collection_id = dataSourceNode.data.collectionId;
        } else if (selectedFlow.data_collection_id) {
            payload.data_collection_id = selectedFlow.data_collection_id;
        }

        router.post('/jobs', payload, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <AppLayout title={t('jobs.create_job')}>
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
                            ← {t('common.back_to_list')}
                        </Button>
                        <h1 className={`text-4xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {t('flows.run_flow')}
                        </h1>
                        <p className={`text-lg ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {t('jobs.create.select_device_and_flow')}
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
                                        {t('jobs.form.select_device')}
                                    </h2>
                                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {onlineDevices.length} {t('jobs.create.devices_online')}
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
                                                        {device.name || t('jobs.create.android_device')}
                                                    </p>
                                                    <p className={`text-sm truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {device.model || device.device_id}
                                                    </p>
                                                    <span className="inline-flex items-center gap-1 mt-2 text-emerald-500 text-sm font-medium">
                                                        <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                                                        {t('jobs.create.ready')}
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
                                            {t('jobs.create.no_devices_online')}
                                        </p>
                                        <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {t('jobs.create.open_app_prompt')}
                                        </p>
                                        <Button variant="primary" size="sm" href="/devices" as="Link">
                                            {t('jobs.create.view_guide')} →
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
                                        {t('jobs.form.select_flow')}
                                    </h2>
                                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {flows.length} {t('jobs.create.workflows_available')}
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
                                            {t('jobs.create.no_workflows')}
                                        </p>
                                        <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {t('jobs.create.record_to_create_workflow')}
                                        </p>
                                        <Button variant="primary" size="sm" href="/flows" as="Link">
                                            {t('flows.create_flow')} →
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
                                            {selectedDevice.name || t('devices.title')}
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
                                    {isSubmitting ? t('jobs.create.initializing') : t('jobs.create.start_run')}
                                </Button>
                            </>
                        ) : (
                            <div className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                <p className="text-lg mb-2">
                                    {!selectedDevice && !selectedFlow
                                        ? t('jobs.create.select_both')
                                        : !selectedDevice
                                            ? t('jobs.create.select_device_to_continue')
                                            : t('jobs.create.select_flow_to_continue')}
                                </p>
                                <p className="text-sm">
                                    {t('jobs.create.start_button_hint')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
