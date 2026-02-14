import { useState, useEffect, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';
import { Button } from '@/Components/UI';

/**
 * CreateJobModal - Modal tạo job với multi-workflow và repeat
 */
export default function CreateJobModal({ isOpen, onClose, devices = [], flows = [] }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [selectedFlows, setSelectedFlows] = useState([]); // Multi-select
    const [repeatCount, setRepeatCount] = useState(1);
    const [deviceSearch, setDeviceSearch] = useState('');
    const [flowSearch, setFlowSearch] = useState('');

    const onlineDevices = devices.filter(d => d.socket_connected || d.status === 'online');

    // Filter devices
    const filteredDevices = useMemo(() => {
        if (!deviceSearch.trim()) return onlineDevices;
        const q = deviceSearch.toLowerCase();
        return onlineDevices.filter(d =>
            (d.name || '').toLowerCase().includes(q) ||
            (d.model || '').toLowerCase().includes(q)
        );
    }, [onlineDevices, deviceSearch]);

    // Filter flows (exclude selected)
    const availableFlows = useMemo(() => {
        const selected = new Set(selectedFlows.map(f => f.id));
        let result = flows.filter(f => !selected.has(f.id));
        if (flowSearch.trim()) {
            const q = flowSearch.toLowerCase();
            result = result.filter(f => (f.name || '').toLowerCase().includes(q));
        }
        return result;
    }, [flows, selectedFlows, flowSearch]);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setSelectedDevice(null);
            setSelectedFlows([]);
            setRepeatCount(1);
            setDeviceSearch('');
            setFlowSearch('');
        }
    }, [isOpen]);

    // Add workflow to selected
    const addFlow = (flow) => {
        setSelectedFlows([...selectedFlows, flow]);
        setFlowSearch('');
    };

    // Remove workflow
    const removeFlow = (id) => {
        setSelectedFlows(selectedFlows.filter(f => f.id !== id));
    };

    // Move workflow up/down
    const moveFlow = (index, direction) => {
        const newList = [...selectedFlows];
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= newList.length) return;
        [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
        setSelectedFlows(newList);
    };

    const handleSubmit = () => {
        if (!selectedDevice || selectedFlows.length === 0) return;

        setIsSubmitting(true);

        // Create job with multi-workflow and repeat
        const flowNames = selectedFlows.slice(0, 2).map(f => f.name).join(' → ');
        const suffix = selectedFlows.length > 2 ? ` (+${selectedFlows.length - 2})` : '';
        const repeatSuffix = repeatCount > 1 ? ` x${repeatCount}` : '';

        router.post('/jobs', {
            name: `${flowNames}${suffix}${repeatSuffix}`,
            device_id: selectedDevice.id,
            flow_ids: selectedFlows.map(f => f.id),
            repeat_count: repeatCount,
            priority: 5,
        }, {
            onSuccess: () => onClose(),
            onFinish: () => setIsSubmitting(false),
        });
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className={`w-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col
                        ${isDark ? 'bg-[#0f0f0f]' : 'bg-white'}`}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                                <span className="text-xl">🚀</span>
                            </div>
                            <div>
                                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Tạo Job</h2>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Chọn thiết bị, kịch bản và số lần chạy</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon-sm" onClick={onClose}>✕</Button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-3 gap-4">
                            {/* Column 1: Device */}
                            <div className={`rounded-2xl p-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${selectedDevice ? 'bg-emerald-500 text-white' : isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                                        {selectedDevice ? '✓' : '1'}
                                    </div>
                                    <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Thiết Bị</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>{onlineDevices.length}</span>
                                </div>

                                <input
                                    type="text"
                                    value={deviceSearch}
                                    onChange={e => setDeviceSearch(e.target.value)}
                                    placeholder="🔍 Tìm..."
                                    className={`w-full px-3 py-2 rounded-lg text-sm mb-2 ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-600' : 'bg-white border-gray-200'} border focus:outline-none focus:ring-1 focus:ring-violet-500`}
                                />

                                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                    {filteredDevices.map(device => (
                                        <button
                                            key={device.id}
                                            onClick={() => setSelectedDevice(device)}
                                            className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-left transition-all
                                                ${selectedDevice?.id === device.id ? 'bg-emerald-500/20 ring-1 ring-emerald-500' : isDark ? 'hover:bg-white/5' : 'hover:bg-white'}`}
                                        >
                                            <span className="text-xl">📱</span>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{device.name || 'Thiết bị'}</p>
                                                <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{device.model}</p>
                                            </div>
                                            {selectedDevice?.id === device.id && <span className="text-emerald-500 text-sm">✓</span>}
                                        </button>
                                    ))}
                                    {filteredDevices.length === 0 && (
                                        <p className={`text-center py-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Không có thiết bị</p>
                                    )}
                                </div>
                            </div>

                            {/* Column 2: Selected Workflows (Order) */}
                            <div className={`rounded-2xl p-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${selectedFlows.length > 0 ? 'bg-violet-500 text-white' : isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                                        {selectedFlows.length > 0 ? '✓' : '2'}
                                    </div>
                                    <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Thứ Tự Chạy</span>
                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{selectedFlows.length} đã chọn</span>
                                </div>

                                <div className="space-y-1.5 max-h-48 overflow-y-auto mb-3">
                                    {selectedFlows.length > 0 ? selectedFlows.map((flow, index) => (
                                        <div key={flow.id} className={`flex items-center gap-2 p-2 rounded-xl ${isDark ? 'bg-violet-500/10 border border-violet-500/30' : 'bg-violet-50 border border-violet-200'}`}>
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-violet-500 text-white' : 'bg-violet-500 text-white'}`}>
                                                {index + 1}
                                            </span>
                                            <span className={`flex-1 text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{flow.name}</span>
                                            <div className="flex gap-0.5">
                                                <button onClick={() => moveFlow(index, -1)} disabled={index === 0} className={`w-5 h-5 rounded text-xs ${index === 0 ? 'opacity-30' : 'hover:bg-white/20'}`}>↑</button>
                                                <button onClick={() => moveFlow(index, 1)} disabled={index === selectedFlows.length - 1} className={`w-5 h-5 rounded text-xs ${index === selectedFlows.length - 1 ? 'opacity-30' : 'hover:bg-white/20'}`}>↓</button>
                                                <button onClick={() => removeFlow(flow.id)} className="w-5 h-5 rounded text-xs text-red-400 hover:bg-red-500/20">✕</button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className={`text-center py-6 border-2 border-dashed rounded-xl ${isDark ? 'border-white/10 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                                            <p className="text-sm">← Chọn từ danh sách</p>
                                        </div>
                                    )}
                                </div>

                                {selectedFlows.length > 1 && (
                                    <p className={`text-xs text-center ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                                        ⚡ Chạy tuần tự: 1 → 2 → ...
                                    </p>
                                )}
                            </div>

                            {/* Column 3: Available Workflows */}
                            <div className={`rounded-2xl p-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg">⚡</span>
                                    <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Kịch Bản</span>
                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{flows.length} có sẵn</span>
                                </div>

                                <input
                                    type="text"
                                    value={flowSearch}
                                    onChange={e => setFlowSearch(e.target.value)}
                                    placeholder="🔍 Tìm..."
                                    className={`w-full px-3 py-2 rounded-lg text-sm mb-2 ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-600' : 'bg-white border-gray-200'} border focus:outline-none focus:ring-1 focus:ring-violet-500`}
                                />

                                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                    {availableFlows.map(flow => (
                                        <button
                                            key={flow.id}
                                            onClick={() => addFlow(flow)}
                                            className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-left transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-white'}`}
                                        >
                                            <span className="text-xl">⚡</span>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{flow.name}</p>
                                            </div>
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>+ Thêm</span>
                                        </button>
                                    ))}
                                    {availableFlows.length === 0 && (
                                        <p className={`text-center py-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {flows.length === 0 ? 'Chưa có workflow' : 'Đã chọn hết'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Repeat Settings */}
                        <div className={`mt-4 p-4 rounded-2xl flex items-center justify-between ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🔄</span>
                                <div>
                                    <p className={`font-semibold text-sm ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>Lặp lại</p>
                                    <p className={`text-xs ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>Chạy lại toàn bộ workflow chain</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setRepeatCount(Math.max(1, repeatCount - 1))}
                                    className={`w-8 h-8 rounded-lg font-bold ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'}`}
                                >-</button>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={repeatCount}
                                    onChange={e => setRepeatCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                                    className={`w-16 text-center py-1.5 rounded-lg text-lg font-bold ${isDark ? 'bg-white/10 text-white' : 'bg-white text-gray-900'} border-0 focus:outline-none focus:ring-2 focus:ring-amber-500`}
                                />
                                <button
                                    onClick={() => setRepeatCount(Math.min(100, repeatCount + 1))}
                                    className={`w-8 h-8 rounded-lg font-bold ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'}`}
                                >+</button>
                                <span className={`text-sm ml-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>lần</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={`px-6 py-4 border-t flex items-center justify-between shrink-0 ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {selectedDevice && selectedFlows.length > 0
                                ? `📱 ${selectedDevice.name} • ${selectedFlows.length} workflow${repeatCount > 1 ? ` • x${repeatCount} lần` : ''}`
                                : 'Chọn thiết bị và ít nhất 1 workflow'}
                        </div>

                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={onClose}>Hủy</Button>
                            <Button
                                variant="gradient"
                                onClick={handleSubmit}
                                disabled={!selectedDevice || selectedFlows.length === 0 || isSubmitting}
                            >
                                {isSubmitting ? 'Đang tạo...' : `🚀 Chạy ${repeatCount > 1 ? `(${repeatCount}x)` : ''}`}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
