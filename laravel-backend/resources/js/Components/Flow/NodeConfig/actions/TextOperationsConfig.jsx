import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';
import ElementPickerModal from '../../ElementPickerModal';

/**
 * TextOperationsConfig - Configuration for clear_text, append_text, select_all, get_text
 * Text manipulation actions with element targeting
 */
export function TextOperationsConfig({ data, updateData, updateMultipleData, isDark, nodeType, selectedDevice, userId }) {
    const [showPicker, setShowPicker] = useState(false);
    const { t } = useTranslation();

    // Handler for element selection from picker
    const handleElementSelect = (element) => {
        const centerX = element.centerX || element.x || Math.round((element.bounds?.left + element.bounds?.right) / 2) || 0;
        const centerY = element.centerY || element.y || Math.round((element.bounds?.top + element.bounds?.bottom) / 2) || 0;

        updateMultipleData({
            resourceId: element.resourceId,
            text: element.text,
            contentDescription: element.contentDescription,
            className: element.className,
            x: centerX,
            y: centerY,
            bounds: element.bounds,
            packageName: element.packageName,
        });

        setShowPicker(false);
    };

    const ElementSelectorSection = () => (
        <>
            <ConfigSection title={t('flows.editor.config.element_inspector', { defaultValue: '🔍 Element Inspector' })} isDark={isDark}>
                <button
                    onClick={() => setShowPicker(true)}
                    className={`w-full px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${isDark
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-400 border border-cyan-500/30'
                        : 'bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 text-cyan-600 border border-cyan-200'
                        }`}
                >
                    <span>📱</span>
                    {t('flows.editor.config.pick_element_from_device', { defaultValue: 'Chọn Element từ Thiết bị' })}
                </button>
            </ConfigSection>

            <ConfigSection title={t('flows.editor.config.target_element', { defaultValue: '🎯 Target Element' })} isDark={isDark}>
                <div className="space-y-3">
                    {/* Text */}
                    <div>
                        <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t('flows.editor.config.text')}
                        </label>
                        <input
                            type="text"
                            value={data.text || ''}
                            onChange={(e) => updateData('text', e.target.value)}
                            placeholder={t('flows.editor.config.element_text_placeholder')}
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                        />
                    </div>

                    {/* Resource ID */}
                    <div>
                        <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t('flows.editor.config.resource_id')}
                        </label>
                        <input
                            type="text"
                            value={data.resourceId || ''}
                            onChange={(e) => updateData('resourceId', e.target.value)}
                            placeholder="com.app:id/input_field"
                            className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                        />
                    </div>

                    {/* Content Description */}
                    <div>
                        <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t('flows.editor.config.content_desc')}
                        </label>
                        <input
                            type="text"
                            value={data.contentDescription || ''}
                            onChange={(e) => updateData('contentDescription', e.target.value)}
                            placeholder={t('flows.editor.config.accessibility_label_placeholder')}
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                        />
                    </div>
                </div>
            </ConfigSection>
        </>
    );

    // ========== CLEAR TEXT CONFIG ==========
    if (nodeType === 'clear_text') {
        return (
            <>
                <ConfigSection title={t('flows.editor.config.clear_text', { defaultValue: '🗑️ Clear Text' })} isDark={isDark}>
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
                        <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                            {t('flows.editor.config.clear_text_desc')}
                        </p>
                    </div>
                </ConfigSection>

                <ElementSelectorSection />

                <ElementPickerModal
                    isOpen={showPicker}
                    onClose={() => setShowPicker(false)}
                    onSelect={handleElementSelect}
                    deviceId={selectedDevice?.device_id}
                    userId={userId}
                    elementType="editable"
                />
            </>
        );
    }

    // ========== APPEND TEXT CONFIG ==========
    if (nodeType === 'append_text') {
        return (
            <>
                <ConfigSection title={t('flows.editor.config.append_text', { defaultValue: '➕ Append Text' })} isDark={isDark}>
                    <div className="space-y-3">
                        <div>
                            <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('flows.editor.config.text_to_append')}
                            </label>
                            <input
                                type="text"
                                value={data.appendValue || ''}
                                onChange={(e) => updateData('appendValue', e.target.value)}
                                placeholder="Text to add... or {{variable}}"
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                            />
                            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                💡 Supports variables like {`{{item.field}}`}
                            </p>
                        </div>

                        {/* Append Position */}
                        <div>
                            <label className={`block text-[10px] font-semibold uppercase mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('flows.editor.config.append_position')}
                            </label>
                            <div className="flex gap-2">
                                {[
                                    { value: 'end', label: t('flows.editor.config.at_end') },
                                    { value: 'start', label: t('flows.editor.config.at_start') },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => updateData('appendPosition', opt.value)}
                                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all border ${(data.appendPosition || 'end') === opt.value
                                            ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                                            : isDark
                                                ? 'border-[#2a2a2a] hover:border-[#3a3a3a] text-gray-400'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </ConfigSection>

                <ElementSelectorSection />

                <ElementPickerModal
                    isOpen={showPicker}
                    onClose={() => setShowPicker(false)}
                    onSelect={handleElementSelect}
                    deviceId={selectedDevice?.device_id}
                    userId={userId}
                    elementType="editable"
                />
            </>
        );
    }

    // ========== SELECT ALL CONFIG ==========
    if (nodeType === 'select_all') {
        return (
            <>
                <ConfigSection title={t('flows.editor.config.select_all', { defaultValue: '📋 Select All' })} isDark={isDark}>
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
                        <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                            {t('flows.editor.config.select_all_desc')}
                        </p>
                    </div>
                </ConfigSection>

                <ElementSelectorSection />

                <ElementPickerModal
                    isOpen={showPicker}
                    onClose={() => setShowPicker(false)}
                    onSelect={handleElementSelect}
                    deviceId={selectedDevice?.device_id}
                    userId={userId}
                    elementType="editable"
                />
            </>
        );
    }

    // ========== GET TEXT CONFIG ==========
    if (nodeType === 'get_text') {
        return (
            <>
                <ConfigSection title={t('flows.editor.config.get_text', { defaultValue: '📝 Get Text' })} isDark={isDark}>
                    <div className="space-y-3">
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-100'}`}>
                            <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                {t('flows.editor.config.get_text_desc')}
                            </p>
                        </div>

                        <div>
                            <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('flows.editor.config.output_variable_name')}
                            </label>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{'{{'}</span>
                                <input
                                    type="text"
                                    value={data.outputVariable?.replace(/[{}]/g, '') || 'extractedText'}
                                    onChange={(e) => updateData('outputVariable', e.target.value.replace(/[{}]/g, ''))}
                                    placeholder="extractedText"
                                    className={`flex-1 border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-green-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                                />
                                <span className={`text-sm font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{'}}'}</span>
                            </div>
                            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                💡 Use this variable in subsequent nodes: {`{{${data.outputVariable?.replace(/[{}]/g, '') || 'extractedText'}}}`}
                            </p>
                        </div>
                    </div>
                </ConfigSection>

                <ElementSelectorSection />

                <ElementPickerModal
                    isOpen={showPicker}
                    onClose={() => setShowPicker(false)}
                    onSelect={handleElementSelect}
                    deviceId={selectedDevice?.device_id}
                    userId={userId}
                    elementType="any"
                />
            </>
        );
    }

    return null;
}

export default TextOperationsConfig;
