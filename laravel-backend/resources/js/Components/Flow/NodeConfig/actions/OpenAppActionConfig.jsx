import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';
import AppPickerModal from '../../AppPickerModal';

/**
 * OpenAppActionConfig - Configuration for open_app action nodes
 * Allows selecting app by package name or from device's installed apps
 */
export function OpenAppActionConfig({ data, updateData, updateMultipleData, isDark, selectedDevice, userId, deviceApps, deviceAppsLoading, onRequestDeviceApps }) {
    const { t } = useTranslation();
    const [showAppPicker, setShowAppPicker] = useState(false);

    const handleAppSelect = (app) => {
        updateMultipleData({
            packageName: app.packageName,
            appName: app.appName || app.name,
            appIcon: app.icon || null
        });
    };

    // Get current app info
    const currentPackage = data.packageName || data.package_name || '';
    const currentAppName = data.appName || '';
    const currentAppIcon = data.appIcon || null;

    return (
        <>
            {/* Selected App Preview */}
            {currentPackage && (
                <ConfigSection title={t('flows.editor.config.selected_app', { defaultValue: 'Selected App' })} isDark={isDark}>
                    <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-gray-50 border border-gray-200'}`}>
                        {/* App Icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 ${isDark ? 'bg-[#252525]' : 'bg-white shadow-sm'}`}>
                            {currentAppIcon ? (
                                <img
                                    src={`data:image/png;base64,${currentAppIcon}`}
                                    alt={currentAppName || 'App'}
                                    className="w-10 h-10 object-contain"
                                />
                            ) : (
                                <span className="text-2xl">📱</span>
                            )}
                        </div>

                        {/* App Info */}
                        <div className="flex-1 min-w-0">
                            <div className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {currentAppName || 'Unknown App'}
                            </div>
                            <div className={`text-xs font-mono truncate ${isDark ? 'text-emerald-400/70' : 'text-emerald-600/70'}`}>
                                {currentPackage}
                            </div>
                        </div>

                        {/* Clear button */}
                        <button
                            onClick={() => updateMultipleData({ packageName: '', appName: '', appIcon: null })}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${isDark ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-200 text-gray-400'}`}
                            title={t('common.clear', 'Clear')}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </ConfigSection>
            )}

            <ConfigSection title={t('flows.editor.config.package_name', { defaultValue: 'Package Name' })} isDark={isDark}>
                <input
                    type="text"
                    value={currentPackage}
                    onChange={(e) => updateData('packageName', e.target.value)}
                    placeholder="com.example.app"
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-emerald-400'
                        : 'bg-white border-gray-200 text-emerald-600'
                        }`}
                />
            </ConfigSection>

            <ConfigSection title={t('flows.editor.config.startup_wait', { defaultValue: 'Startup Wait (ms)' })} isDark={isDark}>
                <input
                    type="number"
                    min="1000"
                    max="30000"
                    step="1000"
                    value={data.timeout || 4000}
                    onChange={(e) => updateData('timeout', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
                <div className="flex gap-1 mt-1">
                    {[2000, 4000, 6000, 10000].map(ms => (
                        <button
                            key={ms}
                            onClick={() => updateData('timeout', ms)}
                            className={`px-2 py-0.5 rounded text-[10px] ${isDark ? 'bg-[#252525] hover:bg-[#2a2a2a] text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                        >
                            {ms / 1000}s
                        </button>
                    ))}
                </div>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('flows.editor.config.startup_wait_desc', { defaultValue: 'Wait for app to fully load' })}
                </p>
            </ConfigSection>

            {/* Pick from device */}
            {selectedDevice && (
                <ConfigSection title={t('flows.editor.config.pick_from_device', { defaultValue: 'Pick from Device' })} isDark={isDark}>
                    <button
                        onClick={() => setShowAppPicker(true)}
                        className={`w-full px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${isDark
                            ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 text-emerald-400 border border-emerald-500/30'
                            : 'bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 text-emerald-600 border border-emerald-200'
                            }`}
                    >
                        <span>📱</span>
                        {t('flows.editor.config.select_installed_app', { defaultValue: 'Select Installed App' })}
                    </button>
                    <p className={`text-[10px] mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {t('flows.editor.config.pick_app_hint', { defaultValue: 'Choose from apps installed on the connected device' })}
                    </p>
                </ConfigSection>
            )}

            {/* App Picker Modal */}
            <AppPickerModal
                isOpen={showAppPicker}
                onClose={() => setShowAppPicker(false)}
                onSelect={handleAppSelect}
                deviceId={selectedDevice?.device_id}
                userId={userId}
                apps={deviceApps}
                loading={deviceAppsLoading}
                onRequestApps={onRequestDeviceApps}
            />
        </>
    );
}
