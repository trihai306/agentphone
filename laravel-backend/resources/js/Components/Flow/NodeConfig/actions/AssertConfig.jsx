import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';
import ElementPickerModal from '../../ElementPickerModal';

/**
 * AssertConfig - Configuration for assertion nodes
 * Verify element exists, text matches, etc. with failure handling
 */
export function AssertConfig({ data, updateData, updateMultipleData, isDark, selectedDevice, userId }) {
    const { t } = useTranslation();
    const [showPicker, setShowPicker] = useState(false);
    const assertType = data.assertType || 'exists';

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
            targetSelector: element.resourceId || element.contentDescription || element.text,
            text: element.text,
            contentDescription: element.contentDescription,
            className: element.className,
            bounds: element.bounds,
            x: centerX,
            y: centerY,
            isClickable: element.isClickable ?? false,
            isEditable: element.isEditable ?? false,
            isScrollable: element.isScrollable ?? false,
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
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-400 border border-emerald-500/30'
                        : 'bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-600 border border-emerald-200'
                        }`}
                >
                    <span>📱</span>
                    {t('flows.editor.config.pick_element_from_device')}
                </button>
                <p className={`text-[10px] mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('flows.editor.config.pick_element_hint')}
                </p>
            </ConfigSection>

            {/* Selected Element Display */}
            {(data.resourceId || data.text) && (
                <ConfigSection title={t('flows.editor.config.element_selected')} isDark={isDark}>
                    <div className={`p-3 rounded-lg text-xs space-y-1 ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                        {data.resourceId && (
                            <div className="flex items-center gap-2">
                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>ID:</span>
                                <span className={`font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{data.resourceId}</span>
                            </div>
                        )}
                        {data.text && (
                            <div className="flex items-center gap-2">
                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Text:</span>
                                <span className={isDark ? 'text-white' : 'text-gray-900'}>"{data.text}"</span>
                            </div>
                        )}
                        {data.className && (
                            <div className="flex items-center gap-2">
                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Type:</span>
                                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{data.className.split('.').pop()}</span>
                            </div>
                        )}
                    </div>
                </ConfigSection>
            )}

            <ConfigSection title={t('flows.editor.config.assert_type')} isDark={isDark}>
                <div className="space-y-2">
                    {[
                        { value: 'exists', label: t('flows.editor.config.assert_exists'), icon: '✓', desc: t('flows.editor.config.assert_exists_desc') },
                        { value: 'not_exists', label: t('flows.editor.config.assert_not_exists'), icon: '✗', desc: t('flows.editor.config.assert_not_exists_desc') },
                        { value: 'text_equals', label: t('flows.editor.config.assert_text_equals'), icon: '=', desc: t('flows.editor.config.assert_text_equals_desc') },
                        { value: 'text_contains', label: t('flows.editor.config.assert_text_contains'), icon: '⊃', desc: t('flows.editor.config.assert_text_contains_desc') },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => updateData('assertType', opt.value)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all border ${assertType === opt.value
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : isDark
                                    ? 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <span className="text-lg w-6 text-center">{opt.icon}</span>
                            <div>
                                <div className={isDark ? 'text-white' : 'text-gray-900'}>{opt.label}</div>
                                <div className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{opt.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </ConfigSection>

            <ConfigSection title={t('flows.editor.config.target_element')} isDark={isDark}>
                <input
                    type="text"
                    value={data.targetSelector || data.resourceId || ''}
                    onChange={(e) => updateData('targetSelector', e.target.value)}
                    placeholder={t('flows.editor.config.target_element_placeholder')}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
            </ConfigSection>

            {['text_equals', 'text_contains'].includes(assertType) && (
                <ConfigSection title={t('flows.editor.config.expected_value')} isDark={isDark}>
                    <input
                        type="text"
                        value={data.expectedValue || ''}
                        onChange={(e) => updateData('expectedValue', e.target.value)}
                        placeholder={t('flows.editor.config.expected_value_placeholder')}
                        className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                            }`}
                    />
                </ConfigSection>
            )}

            <ConfigSection title={t('flows.editor.config.on_failure')} isDark={isDark}>
                <select
                    value={data.onFailure || 'stop'}
                    onChange={(e) => updateData('onFailure', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                >
                    <option value="stop">{t('flows.editor.config.stop_workflow')}</option>
                    <option value="continue">{t('flows.editor.config.continue_workflow')}</option>
                    <option value="retry">{t('flows.editor.config.retry_workflow')}</option>
                </select>
            </ConfigSection>

            <ConfigSection title={t('flows.editor.config.timeout')} isDark={isDark}>
                <input
                    type="number"
                    min="1000"
                    max="30000"
                    value={data.timeout || 5000}
                    onChange={(e) => updateData('timeout', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('flows.editor.config.timeout_desc')}
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

export default AssertConfig;
