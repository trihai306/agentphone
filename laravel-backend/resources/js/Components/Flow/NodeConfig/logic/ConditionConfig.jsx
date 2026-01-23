import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';
import { VariableInput } from '../../VariablePicker';
import ElementPickerModal from '../../ElementPickerModal';

/**
 * ConditionConfig - Configuration for condition/branching nodes
 * Supports variable comparison and element-based conditions
 */
export function ConditionConfig({ data, updateData, updateMultipleData, isDark, upstreamVariables, selectedDevice, userId }) {
    const [showPicker, setShowPicker] = useState(false);
    const { t } = useTranslation();

    const conditionType = data.conditionType || 'variable';

    const variableOperators = [
        { value: '==', label: 'equals' },
        { value: '!=', label: 'not equals' },
        { value: '>', label: 'greater than' },
        { value: '<', label: 'less than' },
        { value: '>=', label: 'greater or equal' },
        { value: '<=', label: 'less or equal' },
        { value: 'contains', label: 'contains' },
        { value: 'startsWith', label: 'starts with' },
        { value: 'endsWith', label: 'ends with' },
    ];

    const elementOperators = [
        { value: 'exists', label: t('flows.editor.config.element_exists'), desc: t('flows.editor.config.element_exists_desc') },
        { value: 'not_exists', label: t('flows.editor.config.element_not_exists'), desc: t('flows.editor.config.element_not_exists_desc') },
        { value: 'text_equals', label: t('flows.editor.config.text_equals'), desc: t('flows.editor.config.text_equals_desc') },
        { value: 'text_contains', label: t('flows.editor.config.text_contains'), desc: t('flows.editor.config.text_contains_desc') },
    ];

    const handleElementSelect = (element) => {
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
            {/* Condition Type Selector */}
            <ConfigSection title={t('flows.editor.config.condition_type')} isDark={isDark}>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => updateData('conditionType', 'variable')}
                        className={`px-3 py-2.5 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all ${conditionType === 'variable'
                            ? isDark
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                                : 'bg-cyan-50 text-cyan-600 border border-cyan-200'
                            : isDark
                                ? 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:border-cyan-500/30'
                                : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-cyan-200'
                            }`}
                    >
                        <span className="text-lg">📊</span>
                        <span>{t('flows.editor.config.variable')}</span>
                    </button>
                    <button
                        onClick={() => updateData('conditionType', 'element')}
                        className={`px-3 py-2.5 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all ${conditionType === 'element'
                            ? isDark
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : isDark
                                ? 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:border-emerald-500/30'
                                : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-emerald-200'
                            }`}
                    >
                        <span className="text-lg">📱</span>
                        <span>{t('flows.editor.config.element')}</span>
                    </button>
                </div>
            </ConfigSection>

            {/* Variable Condition Mode */}
            {conditionType === 'variable' && (
                <>
                    <ConfigSection title={t('flows.editor.config.left_value')} isDark={isDark}>
                        <VariableInput
                            value={data.leftValue || ''}
                            onChange={(val) => updateData('leftValue', val)}
                            placeholder="{{item.status}}"
                            availableVariables={upstreamVariables}
                        />
                    </ConfigSection>

                    <ConfigSection title={t('flows.editor.config.operator')} isDark={isDark}>
                        <select
                            value={data.operator || '=='}
                            onChange={(e) => updateData('operator', e.target.value)}
                            className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                                ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                                : 'bg-white border-gray-200 text-gray-900'
                                }`}
                        >
                            {variableOperators.map(op => (
                                <option key={op.value} value={op.value}>{op.label}</option>
                            ))}
                        </select>
                    </ConfigSection>

                    <ConfigSection title={t('flows.editor.config.right_value')} isDark={isDark}>
                        <VariableInput
                            value={data.rightValue || ''}
                            onChange={(val) => updateData('rightValue', val)}
                            placeholder="active"
                            availableVariables={upstreamVariables}
                        />
                    </ConfigSection>
                </>
            )}

            {/* Element Condition Mode */}
            {conditionType === 'element' && (
                <>
                    <ConfigSection title={t('flows.editor.config.target_element')} isDark={isDark}>
                        <button
                            onClick={() => setShowPicker(true)}
                            className={`w-full px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${isDark
                                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-400 border border-emerald-500/30'
                                : 'bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-600 border border-emerald-200'
                                }`}
                        >
                            <span>📱</span>
                            {t('flows.editor.config.pick_element_from_device', { defaultValue: 'Chọn Element từ Thiết bị' })}
                        </button>
                        <p className={`text-[10px] mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t('flows.editor.config.pick_element_hint', { defaultValue: 'Click để scan màn hình và chọn element cần kiểm tra' })}
                        </p>
                    </ConfigSection>

                    {/* Selected Element Display */}
                    {(data.resourceId || data.text) && (
                        <ConfigSection title={t('flows.editor.config.selected_element', { defaultValue: 'Element Selected' })} isDark={isDark}>
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

                    {/* Element Check Operator */}
                    <ConfigSection title={t('flows.editor.config.check_type')} isDark={isDark}>
                        <div className="space-y-2">
                            {elementOperators.map(op => (
                                <label
                                    key={op.value}
                                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${data.elementOperator === op.value
                                        ? isDark
                                            ? 'bg-emerald-500/20 border border-emerald-500/50'
                                            : 'bg-emerald-50 border border-emerald-200'
                                        : isDark
                                            ? 'bg-[#1a1a1a] border border-[#2a2a2a] hover:border-emerald-500/30'
                                            : 'bg-gray-50 border border-gray-200 hover:border-emerald-200'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="elementOperator"
                                        value={op.value}
                                        checked={data.elementOperator === op.value}
                                        onChange={(e) => updateData('elementOperator', e.target.value)}
                                        className="mt-0.5"
                                    />
                                    <div className="flex-1">
                                        <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {op.label}
                                        </div>
                                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {op.desc}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </ConfigSection>

                    {/* Expected Value for text checks */}
                    {(data.elementOperator === 'text_equals' || data.elementOperator === 'text_contains') && (
                        <ConfigSection title={t('flows.editor.config.expected_value')} isDark={isDark}>
                            <VariableInput
                                value={data.expectedValue || ''}
                                onChange={(val) => updateData('expectedValue', val)}
                                placeholder="Expected text..."
                                availableVariables={upstreamVariables}
                            />
                        </ConfigSection>
                    )}

                    {/* Timeout */}
                    <ConfigSection title={t('flows.editor.config.timeout')} isDark={isDark}>
                        <input
                            type="number"
                            value={data.timeout || 5000}
                            onChange={(e) => updateData('timeout', parseInt(e.target.value) || 5000)}
                            min={1000}
                            max={30000}
                            step={1000}
                            className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                                ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                                : 'bg-white border-gray-200 text-gray-900'
                                }`}
                        />
                        <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t('flows.editor.config.timeout_desc', { defaultValue: 'Max wait time for element' })}
                        </p>
                    </ConfigSection>
                </>
            )}

            {/* Element Picker Modal */}
            {showPicker && (
                <ElementPickerModal
                    isOpen={showPicker}
                    onClose={() => setShowPicker(false)}
                    onSelect={handleElementSelect}
                    deviceId={selectedDevice?.device_id}
                    userId={userId}
                    elementType="clickable"
                />
            )}
        </>
    );
}
