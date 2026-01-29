import { useState, useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import axios from 'axios';

/**
 * BatchJobModal - Create and dispatch jobs to multiple devices
 * Supports batch execution with data collection binding
 */
export default function BatchJobModal({
    isOpen,
    onClose,
    flow,
    devices = [],
    dataCollections = [],
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedDevices, setSelectedDevices] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [config, setConfig] = useState({
        name: '',
        priority: 5,
        maxRetries: 3,
        executionMode: 'sequential', // 'sequential' | 'parallel'
    });

    // Initialize with flow name
    useEffect(() => {
        if (flow?.name) {
            setConfig(c => ({ ...c, name: `${flow.name} - Batch ${new Date().toLocaleDateString()}` }));
        }
    }, [flow]);

    const handleDeviceToggle = (deviceId) => {
        setSelectedDevices(prev =>
            prev.includes(deviceId)
                ? prev.filter(id => id !== deviceId)
                : [...prev, deviceId]
        );
    };

    const handleSelectAll = () => {
        const onlineDevices = devices.filter(d => d.status === 'online');
        if (selectedDevices.length === onlineDevices.length) {
            setSelectedDevices([]);
        } else {
            setSelectedDevices(onlineDevices.map(d => d.id));
        }
    };

    const handleSubmit = async () => {
        if (selectedDevices.length === 0) {
            confirm('Please select at least one device');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axios.post(`/api/flows/${flow.id}/jobs/batch`, {
                device_ids: selectedDevices,
                data_collection_id: selectedCollection,
                name: config.name,
                priority: config.priority,
                max_retries: config.maxRetries,
                execution_mode: config.executionMode,
            });

            confirm(`Created ${response.data.jobs?.length || selectedDevices.length} jobs successfully!`);
            onClose();
        } catch (error) {
            console.error('Failed to create batch jobs:', error);
            confirm('Failed to create jobs: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const onlineDevices = devices.filter(d => d.status === 'online');
    const offlineDevices = devices.filter(d => d.status !== 'online');

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                    w-[600px] max-h-[80vh] rounded-2xl z-50 overflow-hidden
                    ${isDark ? 'bg-[#0f0f0f]' : 'bg-white'}`}
                style={{ boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.5)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`px-6 py-4 border-b ${isDark ? 'border-[#1a1a1a]' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-500/30 flex items-center justify-center">
                                <span className="text-lg">🚀</span>
                            </div>
                            <div>
                                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Run Batch Jobs
                                </h2>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {flow?.name}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center
                                ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5 max-h-[calc(80vh-180px)] overflow-y-auto">
                    {/* Job Name */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Batch Name
                        </label>
                        <input
                            type="text"
                            value={config.name}
                            onChange={e => setConfig({ ...config, name: e.target.value })}
                            className={`w-full px-4 py-2.5 rounded-lg border ${isDark
                                ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white'
                                : 'bg-white border-gray-200 text-gray-900'
                                } focus:outline-none focus:ring-2 focus:ring-violet-500/50`}
                        />
                    </div>

                    {/* Device Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Select Devices ({selectedDevices.length}/{onlineDevices.length})
                            </label>
                            <button
                                onClick={handleSelectAll}
                                className={`text-xs px-2 py-1 rounded ${isDark
                                    ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
                                    : 'bg-violet-50 text-violet-600 hover:bg-violet-100'}`}
                            >
                                {selectedDevices.length === onlineDevices.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                            {/* Online Devices */}
                            {onlineDevices.length > 0 && (
                                <div className={`p-2 grid grid-cols-2 gap-2 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                                    {onlineDevices.map(device => (
                                        <button
                                            key={device.id}
                                            onClick={() => handleDeviceToggle(device.id)}
                                            className={`flex items-center gap-3 p-3 rounded-lg transition-all
                                                ${selectedDevices.includes(device.id)
                                                    ? 'bg-violet-500/20 border-violet-500'
                                                    : isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
                                                } border`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg
                                                ${selectedDevices.includes(device.id) ? 'bg-violet-500/30' : isDark ? 'bg-[#252525]' : 'bg-gray-100'}`}>
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
                                            {selectedDevices.includes(device.id) && (
                                                <span className="text-violet-400">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Offline Devices */}
                            {offlineDevices.length > 0 && (
                                <div className={`p-2 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                                    <p className={`text-[10px] uppercase font-medium mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                        Offline ({offlineDevices.length})
                                    </p>
                                    <div className="flex gap-2 flex-wrap">
                                        {offlineDevices.map(device => (
                                            <span key={device.id} className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-[#1a1a1a] text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                                                {device.name || device.device_id}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {devices.length === 0 && (
                                <div className={`p-6 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    No devices available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Data Collection */}
                    {dataCollections.length > 0 && (
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Data Collection (Optional)
                            </label>
                            <select
                                value={selectedCollection || ''}
                                onChange={e => setSelectedCollection(e.target.value || null)}
                                className={`w-full px-4 py-2.5 rounded-lg border ${isDark
                                    ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white'
                                    : 'bg-white border-gray-200 text-gray-900'
                                    } focus:outline-none focus:ring-2 focus:ring-violet-500/50`}
                            >
                                <option value="">No data collection</option>
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
                                Priority
                            </label>
                            <select
                                value={config.priority}
                                onChange={e => setConfig({ ...config, priority: parseInt(e.target.value) })}
                                className={`w-full px-4 py-2.5 rounded-lg border ${isDark
                                    ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white'
                                    : 'bg-white border-gray-200 text-gray-900'
                                    } focus:outline-none`}
                            >
                                <option value={1}>Low</option>
                                <option value={5}>Normal</option>
                                <option value={8}>High</option>
                                <option value={10}>Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Execution
                            </label>
                            <select
                                value={config.executionMode}
                                onChange={e => setConfig({ ...config, executionMode: e.target.value })}
                                className={`w-full px-4 py-2.5 rounded-lg border ${isDark
                                    ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white'
                                    : 'bg-white border-gray-200 text-gray-900'
                                    } focus:outline-none`}
                            >
                                <option value="sequential">Sequential</option>
                                <option value="parallel">Parallel</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={`px-6 py-4 border-t flex justify-between items-center
                    ${isDark ? 'bg-[#0a0a0a] border-[#1a1a1a]' : 'bg-gray-50 border-gray-100'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {selectedDevices.length} device(s) selected
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className={`px-4 py-2.5 rounded-lg text-sm font-medium
                                ${isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || selectedDevices.length === 0}
                            className={`px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-all
                                ${selectedDevices.length > 0
                                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700'
                                    : 'bg-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? 'Creating...' : `Run on ${selectedDevices.length} Device(s)`}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
