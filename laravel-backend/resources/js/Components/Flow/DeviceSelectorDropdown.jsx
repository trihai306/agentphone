import { useTranslation } from 'react-i18next';
import { useTheme } from '@/Contexts/ThemeContext';
import { deviceApi } from '@/services/api';

/**
 * DeviceSelectorDropdown - Premium glassmorphic dropdown for device selection
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether dropdown is visible
 * @param {Array} props.devices - List of online devices
 * @param {Object} props.selectedDevice - Currently selected device
 * @param {Function} props.onSelect - Callback when device is selected
 * @param {Function} props.onDisconnect - Callback to disconnect current device
 * @param {Function} props.onClose - Callback to close dropdown
 * @param {Function} props.addToast - Toast notification function
 */
export default function DeviceSelectorDropdown({
    isOpen,
    devices,
    selectedDevice,
    onSelect,
    onDisconnect,
    onClose,
    addToast,
}) {
    const { t } = useTranslation();
    const { isDark } = useTheme();

    if (!isOpen) return null;

    const handleDeviceSelect = async (device) => {
        onSelect(device);
        setTimeout(() => onClose(), 300);

        // Request realtime accessibility check via socket
        try {
            const result = await deviceApi.checkAccessibility(device.device_id);

            // Show warning based on current DB value (realtime update will come via socket)
            if (result.success && !result.data.current_status) {
                addToast(`⚠️ ${t('flows.editor.accessibility.checking')}`, 'info');
            }
        } catch (err) {
            console.warn('Failed to request accessibility check:', err);
            // Fallback to DB value
            if (!device.accessibility_enabled) {
                addToast(`⚠️ ${t('flows.editor.accessibility.not_enabled_short')}`, 'warning');
            }
        }
    };

    return (
        <div
            className={`absolute top-full right-0 mt-2 w-96 rounded-2xl shadow-2xl border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${isDark
                ? 'bg-[#1a1a1a]/95 backdrop-blur-xl border-[#2a2a2a]'
                : 'bg-white/95 backdrop-blur-xl border-gray-200'
                }`}
            style={{
                boxShadow: isDark
                    ? '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                    : '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
            }}
        >
            {/* Header with Gradient */}
            <div className={`px-5 py-4 border-b relative overflow-hidden ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10"></div>
                <div className="relative">
                    <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        Online Devices
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${devices.length > 0
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-gray-500/20 text-gray-500'
                            }`}>
                            {devices.length}
                        </span>
                    </h3>
                </div>
            </div>

            {/* Device List */}
            <div className={`max-h-[320px] overflow-y-auto p-3 space-y-2 ${isDark ? 'scrollbar-dark' : 'scrollbar-light'}`}>
                {devices.length === 0 ? (
                    <div className={`text-center py-8 px-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm font-medium">No devices online</p>
                        <p className="text-xs mt-1 opacity-70">Connect your Android device</p>
                    </div>
                ) : (
                    devices.map((device) => {
                        const isSelected = selectedDevice?.id === device.id;
                        return (
                            <button
                                key={device.id}
                                onClick={() => handleDeviceSelect(device)}
                                className={`group w-full text-left p-4 rounded-xl transition-all duration-300 relative overflow-hidden ${isSelected
                                    ? isDark
                                        ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                                        : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 shadow-lg shadow-emerald-200/50'
                                    : isDark
                                        ? 'bg-[#1e1e1e]/50 border border-[#2a2a2a] hover:bg-[#252525]/80 hover:border-[#3a3a3a]'
                                        : 'bg-gray-50/50 border border-gray-200 hover:bg-white hover:border-gray-300'
                                    }`}
                            >
                                {/* Hover Effect */}
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isDark
                                    ? 'bg-gradient-to-r from-indigo-500/5 to-purple-500/5'
                                    : 'bg-gradient-to-r from-indigo-500/5 to-purple-500/5'
                                    }`}></div>

                                <div className="relative flex items-center gap-3">
                                    {/* Device Avatar */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected
                                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                                        : isDark
                                            ? 'bg-gradient-to-br from-[#252525] to-[#1a1a1a] text-gray-400 group-hover:text-white'
                                            : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 group-hover:text-gray-700'
                                        }`}>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>

                                    {/* Device Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {device.name}
                                            </p>
                                            {/* Accessibility Status Badge */}
                                            {!device.accessibility_enabled && (
                                                <div
                                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isDark
                                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                        : 'bg-amber-100 text-amber-700 border border-amber-300'
                                                        }`}
                                                    title="Accessibility Service chưa được bật"
                                                >
                                                    ⚠ A11Y
                                                </div>
                                            )}
                                        </div>
                                        <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {device.model || device.device_id || 'Unknown model'}
                                        </p>
                                        {/* Accessibility warning text */}
                                        {!device.accessibility_enabled && (
                                            <p className={`text-[10px] mt-1 ${isDark ? 'text-amber-400/80' : 'text-amber-600'}`}>
                                                Cần bật Accessibility Service
                                            </p>
                                        )}
                                    </div>

                                    {/* Checkmark Badge with Animation */}
                                    {isSelected && (
                                        <div className="flex-shrink-0 animate-in zoom-in duration-200">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {/* Footer with Disconnect Button */}
            {selectedDevice && (
                <div className={`p-3 border-t ${isDark ? 'border-[#2a2a2a] bg-[#0f0f0f]/50' : 'border-gray-200 bg-gray-50/50'}`}>
                    <button
                        onClick={() => {
                            onDisconnect();
                            onClose();
                        }}
                        className={`w-full text-xs font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${isDark
                            ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300 active:bg-red-500/20'
                            : 'text-red-600 hover:bg-red-50 hover:text-red-700 active:bg-red-100'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Disconnect Device
                    </button>
                </div>
            )}
        </div>
    );
}
