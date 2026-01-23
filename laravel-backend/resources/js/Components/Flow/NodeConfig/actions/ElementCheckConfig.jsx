import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';
import ElementPickerModal from '../../ElementPickerModal';

/**
 * ElementCheckConfig - Configuration for element check with True/False branching
 * Similar to Condition but specifically for element status checks
 */
export function ElementCheckConfig({ data, updateData, updateMultipleData, isDark, selectedDevice, userId }) {
    const { t } = useTranslation();
    const [showPicker, setShowPicker] = useState(false);
    const checkType = data.checkType || 'exists';

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
                        ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 hover:from-violet-500/30 hover:to-purple-500/30 text-violet-400 border border-violet-500/30'
                        : 'bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 text-violet-600 border border-violet-200'
                        }`}
                >
                    <span>📱</span>
                    {t('flows.editor.config.pick_element_from_device')}
                </button>
                <p className={`text-[10px] mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('flows.editor.config.pick_element_hint')}
                </p>
            </ConfigSection>

            <ConfigSection title={t('flows.editor.config.check_type')} isDark={isDark}>
                <div className="space-y-2">
                    {[
                        { value: 'exists', label: t('flows.editor.config.assert_exists'), icon: '✓', desc: t('flows.editor.config.assert_exists_desc') },
                        { value: 'not_exists', label: t('flows.editor.config.assert_not_exists'), icon: '✗', desc: t('flows.editor.config.assert_not_exists_desc') },
                        { value: 'text_equals', label: t('flows.editor.config.assert_text_equals'), icon: '=', desc: t('flows.editor.config.assert_text_equals_desc') },
                        { value: 'text_contains', label: t('flows.editor.config.assert_text_contains'), icon: '⊃', desc: t('flows.editor.config.assert_text_contains_desc') },
                        { value: 'is_checked', label: t('flows.editor.config.is_checked'), icon: '☑', desc: t('flows.editor.config.check_is_checked_desc') },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => updateData('checkType', opt.value)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all border ${checkType === opt.value
                                ? 'border-violet-500 bg-violet-500/10'
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

            {['text_equals', 'text_contains'].includes(checkType) && (
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
            </ConfigSection>

            {/* Branching Info */}
            <div className={`p-3 rounded-lg ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                <p className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('flows.editor.config.branching')}
                </p>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>{t('flows.editor.config.condition_true')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        <span className={isDark ? 'text-red-400' : 'text-red-600'}>{t('flows.editor.config.condition_false')}</span>
                    </div>
                </div>
            </div>

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

export default ElementCheckConfig;
