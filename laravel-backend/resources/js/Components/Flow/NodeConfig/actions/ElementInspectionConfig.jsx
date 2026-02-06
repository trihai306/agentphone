import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';
import ElementPickerModal from '../../ElementPickerModal';

/**
 * ElementInspectionConfig - Configuration for get_bounds, is_visible, count_elements
 * Element inspection and analysis actions
 */
export function ElementInspectionConfig({ data, updateData, updateMultipleData, isDark, nodeType, selectedDevice, userId }) {
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

    const ElementSelectorSection = ({ title = 'element_inspector' }) => (
        <>
            <ConfigSection title={t(`flows.editor.config.${title}`, { defaultValue: '🔍 Element Inspector' })} isDark={isDark}>
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

            <ConfigSection title={t('flows.editor.config.element_filter', { defaultValue: '🎯 Element Filter' })} isDark={isDark}>
                <div className="space-y-3">
                    {/* Text */}
                    <div>
                        <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Text Content
                        </label>
                        <input
                            type="text"
                            value={data.text || ''}
                            onChange={(e) => updateData('text', e.target.value)}
                            placeholder="Element text or {{variable}}..."
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                        />
                    </div>

                    {/* Resource ID */}
                    <div>
                        <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Resource ID
                        </label>
                        <input
                            type="text"
                            value={data.resourceId || ''}
                            onChange={(e) => updateData('resourceId', e.target.value)}
                            placeholder="com.app:id/element"
                            className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                        />
                    </div>

                    {/* Content Description */}
                    <div>
                        <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Content Description
                        </label>
                        <input
                            type="text"
                            value={data.contentDescription || ''}
                            onChange={(e) => updateData('contentDescription', e.target.value)}
                            placeholder="Accessibility label..."
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                        />
                    </div>

                    {/* Class Name */}
                    <div>
                        <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Class Name
                        </label>
                        <input
                            type="text"
                            value={data.className || ''}
                            onChange={(e) => updateData('className', e.target.value)}
                            placeholder="android.widget.Button"
                            className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                        />
                    </div>
                </div>
            </ConfigSection>
        </>
    );

    // ========== GET BOUNDS CONFIG ==========
    if (nodeType === 'get_bounds') {
        return (
            <>
                <ConfigSection title={t('flows.editor.config.get_bounds', { defaultValue: '📐 Get Bounds' })} isDark={isDark}>
                    <div className="space-y-3">
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-cyan-50 border border-cyan-100'}`}>
                            <p className={`text-sm ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                Get the position and size (bounds) of an element.
                            </p>
                            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Returns: left, top, right, bottom, width, height
                            </p>
                        </div>

                        <div>
                            <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Output Variable Name
                            </label>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{'{{'}</span>
                                <input
                                    type="text"
                                    value={data.outputVariable?.replace(/[{}]/g, '') || 'bounds'}
                                    onChange={(e) => updateData('outputVariable', e.target.value.replace(/[{}]/g, ''))}
                                    placeholder="bounds"
                                    className={`flex-1 border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-cyan-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                                />
                                <span className={`text-sm font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{'}}'}</span>
                            </div>
                            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                💡 Access: {`{{bounds.left}}`}, {`{{bounds.width}}`}, etc.
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

    // ========== IS VISIBLE CONFIG ==========
    if (nodeType === 'is_visible') {
        return (
            <>
                <ConfigSection title={t('flows.editor.config.is_visible', { defaultValue: '👁️ Is Visible' })} isDark={isDark}>
                    <div className="space-y-3">
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-100'}`}>
                            <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                Check if an element is visible on screen.
                            </p>
                            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Returns: true/false
                            </p>
                        </div>

                        <div>
                            <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Timeout (ms)
                            </label>
                            <input
                                type="number"
                                min="1000"
                                max="60000"
                                step="1000"
                                value={data.timeout || 5000}
                                onChange={(e) => updateData('timeout', parseInt(e.target.value) || 5000)}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                            />
                            <div className="flex gap-1 mt-2">
                                {[3000, 5000, 10000, 30000].map(ms => (
                                    <button
                                        key={ms}
                                        onClick={() => updateData('timeout', ms)}
                                        className={`px-2 py-1 rounded text-[10px] transition-all ${data.timeout === ms
                                            ? 'bg-green-500 text-white'
                                            : isDark
                                                ? 'bg-[#252525] hover:bg-[#2a2a2a] text-gray-400'
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                            }`}
                                    >
                                        {ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Output Variable Name
                            </label>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{'{{'}</span>
                                <input
                                    type="text"
                                    value={data.outputVariable?.replace(/[{}]/g, '') || 'isVisible'}
                                    onChange={(e) => updateData('outputVariable', e.target.value.replace(/[{}]/g, ''))}
                                    placeholder="isVisible"
                                    className={`flex-1 border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-green-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                                />
                                <span className={`text-sm font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{'}}'}</span>
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
                    elementType="any"
                />
            </>
        );
    }

    // ========== COUNT ELEMENTS CONFIG ==========
    if (nodeType === 'count_elements') {
        return (
            <>
                <ConfigSection title={t('flows.editor.config.count_elements', { defaultValue: '🔢 Count Elements' })} isDark={isDark}>
                    <div className="space-y-3">
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'}`}>
                            <p className={`text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                Count how many elements match the specified criteria.
                            </p>
                            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Returns: number of matching elements
                            </p>
                        </div>

                        <div>
                            <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Output Variable Name
                            </label>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{'{{'}</span>
                                <input
                                    type="text"
                                    value={data.outputVariable?.replace(/[{}]/g, '') || 'count'}
                                    onChange={(e) => updateData('outputVariable', e.target.value.replace(/[{}]/g, ''))}
                                    placeholder="count"
                                    className={`flex-1 border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                                />
                                <span className={`text-sm font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{'}}'}</span>
                            </div>
                            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                💡 Use in conditions: {`if {{count}} > 0`}
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

export default ElementInspectionConfig;
