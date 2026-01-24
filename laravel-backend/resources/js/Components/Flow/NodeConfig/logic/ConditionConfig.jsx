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
                    {/* Logic Operator Toggle */}
                    <ConfigSection title="Logic Operator" isDark={isDark}>
                        <div className="flex gap-2">
                            {['AND', 'OR'].map((op) => {
                                const isSelected = (data.logicOperator || 'AND') === op;
                                return (
                                    <button
                                        key={op}
                                        onClick={() => updateData('logicOperator', op)}
                                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${isSelected
                                                ? op === 'AND'
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-amber-500 text-white'
                                                : isDark
                                                    ? 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]'
                                                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                                            }`}
                                    >
                                        {op === 'AND' ? '∧ AND' : '∨ OR'}
                                    </button>
                                );
                            })}
                        </div>
                        <p className={`text-[10px] mt-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            {(data.logicOperator || 'AND') === 'AND'
                                ? 'Tất cả điều kiện phải đúng'
                                : 'Chỉ cần một điều kiện đúng'}
                        </p>
                    </ConfigSection>

                    {/* Conditions List */}
                    <ConfigSection
                        title={t('flows.editor.config.conditions', 'Điều Kiện')}
                        isDark={isDark}
                        badge={
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                                {(data.conditions || [{ leftValue: data.leftValue, operator: data.operator, rightValue: data.rightValue }]).length}
                            </span>
                        }
                    >
                        <div className="space-y-2">
                            {(data.conditions && data.conditions.length > 0
                                ? data.conditions
                                : [{ leftValue: data.leftValue || '', operator: data.operator || '==', rightValue: data.rightValue || '' }]
                            ).map((cond, idx) => (
                                <div
                                    key={idx}
                                    className={`p-2.5 rounded-xl space-y-2 ${isDark ? 'bg-[#0f0f0f] border border-[#1a1a1a]' : 'bg-gray-50 border border-gray-100'}`}
                                >
                                    {/* Row Header */}
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            #{idx + 1}
                                        </span>
                                        {(data.conditions?.length || 1) > 1 && (
                                            <button
                                                onClick={() => {
                                                    const newConditions = [...(data.conditions || [])];
                                                    newConditions.splice(idx, 1);
                                                    updateData('conditions', newConditions);
                                                }}
                                                className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>

                                    {/* 3-Column Grid: Left | Operator | Right */}
                                    <div className="grid grid-cols-[1fr_auto_1fr] gap-1.5 items-center">
                                        {/* Left Value */}
                                        <VariableInput
                                            value={cond.leftValue || ''}
                                            onChange={(val) => {
                                                if (data.conditions) {
                                                    const newConditions = [...data.conditions];
                                                    newConditions[idx] = { ...cond, leftValue: val };
                                                    updateData('conditions', newConditions);
                                                } else {
                                                    updateData('leftValue', val);
                                                }
                                            }}
                                            placeholder="{{var}}"
                                            availableVariables={upstreamVariables}
                                            className="!text-xs"
                                        />

                                        {/* Operator */}
                                        <select
                                            value={cond.operator || '=='}
                                            onChange={(e) => {
                                                if (data.conditions) {
                                                    const newConditions = [...data.conditions];
                                                    newConditions[idx] = { ...cond, operator: e.target.value };
                                                    updateData('conditions', newConditions);
                                                } else {
                                                    updateData('operator', e.target.value);
                                                }
                                            }}
                                            className={`px-2 py-1.5 text-xs rounded-lg border font-bold text-center ${isDark
                                                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                                                : 'bg-orange-50 border-orange-200 text-orange-600'
                                                }`}
                                            style={{ minWidth: '60px' }}
                                        >
                                            {variableOperators.map(op => (
                                                <option key={op.value} value={op.value}>{op.label}</option>
                                            ))}
                                        </select>

                                        {/* Right Value */}
                                        <VariableInput
                                            value={cond.rightValue || ''}
                                            onChange={(val) => {
                                                if (data.conditions) {
                                                    const newConditions = [...data.conditions];
                                                    newConditions[idx] = { ...cond, rightValue: val };
                                                    updateData('conditions', newConditions);
                                                } else {
                                                    updateData('rightValue', val);
                                                }
                                            }}
                                            placeholder="value"
                                            availableVariables={upstreamVariables}
                                            className="!text-xs"
                                        />
                                    </div>

                                    {/* Logic connector */}
                                    {idx < (data.conditions?.length || 1) - 1 && (
                                        <div className="flex justify-center">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${(data.logicOperator || 'AND') === 'AND'
                                                    ? 'bg-blue-500/20 text-blue-400'
                                                    : 'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                {data.logicOperator || 'AND'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Add Condition Button */}
                            <button
                                onClick={() => {
                                    const currentConditions = data.conditions || [
                                        { leftValue: data.leftValue || '', operator: data.operator || '==', rightValue: data.rightValue || '' }
                                    ];
                                    updateData('conditions', [...currentConditions, { leftValue: '', operator: '==', rightValue: '' }]);
                                }}
                                className={`w-full py-2.5 rounded-xl text-xs font-medium transition-all border-2 border-dashed flex items-center justify-center gap-2 ${isDark
                                    ? 'border-[#2a2a2a] text-gray-500 hover:border-orange-500/50 hover:text-orange-400'
                                    : 'border-gray-200 text-gray-400 hover:border-orange-500 hover:text-orange-600'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Thêm Điều Kiện
                            </button>
                        </div>
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
