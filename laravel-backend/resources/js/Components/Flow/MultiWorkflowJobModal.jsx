import { useState, useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/Components/Layout/ToastProvider';
import { router } from '@inertiajs/react';
import { Button } from '@/Components/UI';
import WorkflowPicker from './WorkflowPicker';

/**
 * MultiWorkflowJobModal - Create a job with multiple workflows in sequence
 */
export default function MultiWorkflowJobModal({
    isOpen,
    onClose,
    workflows = [],
    devices = [],
    dataCollections = [],
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { t } = useTranslation();
    const { addToast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [selectedWorkflows, setSelectedWorkflows] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [config, setConfig] = useState({
        name: '',
        priority: 5,
        executionMode: 'sequential',
    });

    // Initialize name when workflows change
    useEffect(() => {
        if (selectedWorkflows.length > 0) {
            const names = selectedWorkflows.slice(0, 2).map(w => w.name).join(' → ');
            const suffix = selectedWorkflows.length > 2 ? ` (+${selectedWorkflows.length - 2})` : '';
            setConfig(c => ({ ...c, name: names + suffix }));
        }
    }, [selectedWorkflows]);

    const handleSubmit = async () => {
        if (!selectedDevice) {
            addToast(t('flows.editor.multi_job.select_device_warning'), 'warning');
            return;
        }
        if (selectedWorkflows.length === 0) {
            addToast(t('flows.editor.multi_job.select_workflow_warning'), 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            router.post('/jobs', {
                name: config.name,
                device_id: selectedDevice,
                flow_ids: selectedWorkflows.map(w => w.id),
                data_collection_id: selectedCollection,
                priority: config.priority,
                execution_mode: config.executionMode,
            }, {
                onSuccess: () => {
                    onClose();
                },
                onError: (errors) => {
                    console.error('Failed to create job:', errors);
                    addToast(t('common.error') + ': ' + Object.values(errors).flat().join(', '), 'error');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            });
        } catch (error) {
            console.error('Failed to create job:', error);
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const onlineDevices = devices.filter(d => d.status === 'online' || d.socket_connected);
    const offlineDevices = devices.filter(d => d.status !== 'online' && !d.socket_connected);

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

            {/* Modal */}
            <div
                className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                    w-[700px] max-h-[85vh] rounded-2xl z-50 overflow-hidden
                    ${isDark ? 'bg-[#0f0f0f]' : 'bg-white'}`}
                style={{ boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.5)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`px-6 py-4 border-b ${isDark ? 'border-[#1a1a1a]' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-500/30 flex items-center justify-center">
                                <span className="text-lg">🔗</span>
                            </div>
                            <div>
                                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {t('flows.editor.multi_job.title')}
                                </h2>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {t('flows.editor.multi_job.subtitle')}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon-xs" onClick={onClose}>
                            ✕
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5 max-h-[calc(85vh-180px)] overflow-y-auto">
                    {/* Job Name */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('flows.editor.multi_job.job_name')}
                        </label>
                        <input
                            type="text"
                            value={config.name}
                            onChange={e => setConfig({ ...config, name: e.target.value })}
                            placeholder="Enter job name..."
                            className={`w-full px-4 py-2.5 rounded-lg border ${isDark
                                ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600'
                                : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                                } focus:outline-none focus:ring-2 focus:ring-violet-500/50`}
                        />
                    </div>

                    {/* Device Selection */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('flows.editor.multi_job.target_device')}
                        </label>
                        <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                            {onlineDevices.length > 0 ? (
                                <div className={`p-2 grid grid-cols-2 gap-2 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                                    {onlineDevices.map(device => (
                                        <button
                                            key={device.id}
                                            onClick={() => setSelectedDevice(device.id)}
                                            className={`flex items-center gap-3 p-3 rounded-lg transition-all
                                                ${selectedDevice === device.id
                                                    ? 'bg-violet-500/20 border-violet-500'
                                                    : isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
                                                } border`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg
                                                ${selectedDevice === device.id ? 'bg-violet-500/30' : isDark ? 'bg-[#252525]' : 'bg-gray-100'}`}>
                                                📱
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {device.name || device.device_id}
                                                </p>
                                                <p className={`text-[10px] ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                                    🟢 Online
                                                </p>
                                            </div>
                                            {selectedDevice === device.id && (
                                                <span className="text-violet-400">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className={`p-6 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {t('flows.editor.multi_job.no_devices_online')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Workflow Selection */}
                    <WorkflowPicker
                        workflows={workflows}
                        selectedWorkflows={selectedWorkflows}
                        onChange={setSelectedWorkflows}
                        maxSelections={10}
                    />

                    {/* Data Collection */}
                    {dataCollections.length > 0 && (
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {t('flows.editor.batch.data_collection_optional')}
                            </label>
                            <select
                                value={selectedCollection || ''}
                                onChange={e => setSelectedCollection(e.target.value || null)}
                                className={`w-full px-4 py-2.5 rounded-lg border ${isDark
                                    ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white'
                                    : 'bg-white border-gray-200 text-gray-900'
                                    } focus:outline-none focus:ring-2 focus:ring-violet-500/50`}
                            >
                                <option value="">{t('flows.editor.batch.no_data_collection')}</option>
                                {dataCollections.map(dc => (
                                    <option key={dc.id} value={dc.id}>
                                        {dc.name} ({dc.records_count || 0} records)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Options */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {t('flows.editor.batch.priority')}
                            </label>
                            <select
                                value={config.priority}
                                onChange={e => setConfig({ ...config, priority: parseInt(e.target.value) })}
                                className={`w-full px-4 py-2.5 rounded-lg border ${isDark
                                    ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white'
                                    : 'bg-white border-gray-200 text-gray-900'
                                    } focus:outline-none`}
                            >
                                <option value={1}>{t('flows.editor.batch.priority_low')}</option>
                                <option value={5}>{t('flows.editor.batch.priority_normal')}</option>
                                <option value={8}>{t('flows.editor.batch.priority_high')}</option>
                                <option value={10}>{t('flows.editor.batch.priority_urgent')}</option>
                            </select>
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {t('flows.editor.batch.execution')}
                            </label>
                            <select
                                value={config.executionMode}
                                onChange={e => setConfig({ ...config, executionMode: e.target.value })}
                                className={`w-full px-4 py-2.5 rounded-lg border ${isDark
                                    ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white'
                                    : 'bg-white border-gray-200 text-gray-900'
                                    } focus:outline-none`}
                            >
                                <option value="sequential">{t('flows.editor.batch.sequential')}</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={`px-6 py-4 border-t flex justify-between items-center
                    ${isDark ? 'bg-[#0a0a0a] border-[#1a1a1a]' : 'bg-gray-50 border-gray-100'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {t('flows.editor.multi_job.summary', { workflows: selectedWorkflows.length, device: selectedDevice ? 1 : 0 })}
                    </p>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={onClose}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant="gradient"
                            onClick={handleSubmit}
                            disabled={isSubmitting || selectedWorkflows.length === 0 || !selectedDevice}
                        >
                            {isSubmitting ? t('common.creating') : t('flows.editor.multi_job.create_job', { count: selectedWorkflows.length })}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
