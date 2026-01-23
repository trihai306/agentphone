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
            appName: app.appName || app.name
        });
    };

    return (
        <>
            <ConfigSection title={t('flows.editor.config.package_name', { defaultValue: 'Package Name' })} isDark={isDark}>
                <input
                    type="text"
                    value={data.packageName || data.package_name || ''}
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
