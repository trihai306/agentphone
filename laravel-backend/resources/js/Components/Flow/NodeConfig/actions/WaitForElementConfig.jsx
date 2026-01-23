import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';
import ElementPickerModal from '../../ElementPickerModal';

/**
 * WaitForElementConfig - Wait for element to appear with timeout handling
 * Used to synchronize automation flows with slow-loading UI elements
 */
export function WaitForElementConfig({ data, updateData, updateMultipleData, isDark, selectedDevice, userId }) {
    const { t } = useTranslation();
    const [showPicker, setShowPicker] = useState(false);

    const handleElementSelect = (element) => {
        // Calculate center from bounds
        let centerX, centerY;
        if (element.bounds) {
            const b = element.bounds;
            centerX = Math.round((b.left + b.right) / 2);
            centerY = Math.round((b.top + b.bottom) / 2);
        }

        updateMultipleData({
            resourceId: element.resourceId,
            text: element.text,
            contentDescription: element.contentDescription,
            className: element.className,
            bounds: element.bounds,
            x: centerX,
            y: centerY,
            isClickable: element.isClickable ?? false,
            packageName: element.packageName,
        });
        setShowPicker(false);
    };

    return (
        <>
            {/* Element Picker Button */}
            <ConfigSection title={t('flows.editor.config.element_inspector')} isDark={isDark}>
                <button
                    onClick={() => setShowPicker(true)}
                    className={`w-full px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${isDark
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-400 border border-amber-500/30'
                        : 'bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-600 border border-amber-200'
                        }`}
                >
                    <span>📱</span>
                    {t('flows.editor.config.pick_element_from_device')}
                </button>
            </ConfigSection>

            <ConfigSection title={t('flows.editor.config.target_element')} isDark={isDark}>
                <input
                    type="text"
                    value={data.resourceId || ''}
                    onChange={(e) => updateData('resourceId', e.target.value)}
                    placeholder={t('flows.editor.config.resource_id_placeholder')}
                    className={`w-full px-3 py-2 text-sm rounded-lg border mb-2 ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
                <input
                    type="text"
                    value={data.text || ''}
                    onChange={(e) => updateData('text', e.target.value)}
                    placeholder={t('flows.editor.config.text_to_find')}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
            </ConfigSection>

            <ConfigSection title={t('flows.editor.config.timeout')} isDark={isDark}>
                <input
                    type="number"
                    min="1000"
                    max="60000"
                    step="1000"
                    value={data.timeout || 10000}
                    onChange={(e) => updateData('timeout', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
                <div className="flex gap-1 mt-2">
                    {[5000, 10000, 15000, 30000].map(ms => (
                        <button
                            key={ms}
                            onClick={() => updateData('timeout', ms)}
                            className={`px-2 py-1 rounded text-[10px] ${isDark ? 'bg-[#252525] hover:bg-[#2a2a2a] text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                        >
                            {ms / 1000}s
                        </button>
                    ))}
                </div>
            </ConfigSection>

            <ConfigSection title={t('flows.editor.config.on_timeout')} isDark={isDark}>
                <select
                    value={data.onTimeout || 'fail'}
                    onChange={(e) => updateData('onTimeout', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                >
                    <option value="fail">{t('flows.editor.config.fail_workflow')}</option>
                    <option value="skip">{t('flows.editor.config.skip_continue')}</option>
                    <option value="retry">{t('flows.editor.config.retry_workflow')}</option>
                </select>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('flows.editor.config.on_timeout_desc')}
                </p>
            </ConfigSection>

            {/* Element Picker Modal */}
            <ElementPickerModal
                isOpen={showPicker}
                onClose={() => setShowPicker(false)}
                onSelect={handleElementSelect}
                deviceId={selectedDevice?.device_id}
                userId={userId}
                elementType="clickable"
            />
        </>
    );
}

export default WaitForElementConfig;
