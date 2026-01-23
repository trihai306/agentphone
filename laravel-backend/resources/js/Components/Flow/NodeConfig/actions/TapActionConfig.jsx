import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';
import ElementPickerModal from '../../ElementPickerModal';

/**
 * TapActionConfig - Configuration for tap, double_tap, long_press, text_input actions
 * Includes element detection, smart selector priority, and visual element picker
 */
export function TapActionConfig({ data, updateData, updateMultipleData, isDark, nodeType, selectedDevice, userId, dataSourceNodes = [] }) {
    const [showPicker, setShowPicker] = useState(false);
    const { t } = useTranslation();
    const selectorPriority = data.selectorPriority || 'auto';

    const screenshotUrl = data.screenshotUrl || data.screenshot_url;

    // Handler for element selection from picker
    const handleElementSelect = (element) => {

        // Calculate center coordinates from bounds if not directly provided
        let centerX = element.centerX || element.x;
        let centerY = element.centerY || element.y;

        // If still no coordinates but bounds available, calculate from bounds
        if ((!centerX || !centerY) && element.bounds) {
            const b = element.bounds;
            if (b.left !== undefined && b.right !== undefined) {
                centerX = Math.round((b.left + b.right) / 2);
            }
            if (b.top !== undefined && b.bottom !== undefined) {
                centerY = Math.round((b.top + b.bottom) / 2);
            }
        }

        // Map strategy from ElementPicker to selectorPriority
        let selectorPriorityValue = 'auto';
        if (element._strategy === 'id') selectorPriorityValue = 'id';
        else if (element._strategy === 'text') selectorPriorityValue = 'text';
        else if (element._strategy === 'xy' || element._strategy === 'coordinates') selectorPriorityValue = 'coords';
        else if (element._strategy === 'icon') selectorPriorityValue = 'icon';

        // Use batch update to avoid closure stale state issue
        updateMultipleData({
            resourceId: element.resourceId,
            resource_id: element.resourceId,
            text: element.text,
            contentDescription: element.contentDescription,
            className: element.className,
            x: centerX,
            y: centerY,
            bounds: element.bounds,
            isClickable: element.isClickable ?? false,
            isEditable: element.isEditable ?? false,
            isScrollable: element.isScrollable ?? false,
            isCheckable: element.isCheckable ?? false,
            isFocusable: element.isFocusable ?? false,
            packageName: element.packageName || data.packageName,
            // Store cropped icon image for template matching
            image: element.image || null,
            // Store selector strategy
            selectorPriority: selectorPriorityValue,
            // Store all selectors for fallback
            _selectors: element._selectors,
        });

        setShowPicker(false);
    };

    return (
        <>
            {/* Screenshot Preview with Tap Indicator */}
            {screenshotUrl && (
                <ConfigSection title={t('flows.editor.config.interaction_screenshot', { defaultValue: 'Interaction Screenshot' })} isDark={isDark}>
                    <div className="relative w-full rounded-lg overflow-hidden border border-gray-500/20"
                        style={{ aspectRatio: '9/19.5' }}>
                        <img
                            src={screenshotUrl}
                            alt="Tap screenshot"
                            className="w-full h-full object-cover"
                        />
                        {/* Tap Position Indicator */}
                        {(data.x || data.coordinates?.x) && (data.y || data.coordinates?.y) && (
                            <div
                                className="absolute w-8 h-8 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                style={{
                                    left: `${((data.x || data.coordinates?.x) / 1080) * 100}%`,
                                    top: `${((data.y || data.coordinates?.y) / 2400) * 100}%`,
                                }}
                            >
                                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
                                <div className="absolute inset-1 bg-red-500 rounded-full border-2 border-white shadow-lg" />
                            </div>
                        )}
                    </div>
                    {/* Coordinates display below image */}
                    <div className={`flex justify-center gap-4 mt-2 text-[10px] font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <span>X: {data.x || data.coordinates?.x || 0}</span>
                        <span>Y: {data.y || data.coordinates?.y || 0}</span>
                    </div>
                </ConfigSection>
            )}

            {/* Element Picker Button */}
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
                <p className={`text-[10px] mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('flows.editor.config.pick_element_hint', { defaultValue: 'Click để scan màn hình và chọn element cần tương tác' })}
                </p>
            </ConfigSection>

            <ConfigSection title={t('flows.editor.config.element_selector', { defaultValue: 'Element Selector' })} isDark={isDark}>
                <div className="space-y-2">
                    {[
                        { value: 'auto', label: t('flows.editor.config.selector_auto', { defaultValue: '🧠 Auto (Smart)' }), desc: t('flows.editor.config.selector_auto_desc', { defaultValue: 'ID → Text → Icon' }) },
                        { value: 'id', label: t('flows.editor.config.selector_id', { defaultValue: '🏷️ Resource ID' }), desc: t('flows.editor.config.most_reliable', { defaultValue: 'Most reliable' }) },
                        { value: 'text', label: t('flows.editor.config.selector_text', { defaultValue: '📝 Text Content' }), desc: t('flows.editor.config.flexible', { defaultValue: 'Flexible' }) },
                        { value: 'icon', label: t('flows.editor.config.selector_icon', { defaultValue: '🖼️ Icon Match' }), desc: t('flows.editor.config.visual_detection', { defaultValue: 'Visual detection' }) },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => updateData('selectorPriority', opt.value)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-all border ${selectorPriority === opt.value
                                ? 'border-cyan-500 bg-cyan-500/10'
                                : isDark
                                    ? 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <span className={isDark ? 'text-white' : 'text-gray-900'}>{opt.label}</span>
                            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{opt.desc}</span>
                        </button>
                    ))}
                </div>
            </ConfigSection>

            {/* Comprehensive Element Details */}
            <ConfigSection title={t('flows.editor.config.element_details', { defaultValue: 'Element Details' })} isDark={isDark}>
                <div className={`rounded-lg overflow-hidden border ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                    {/* ID Section */}
                    {(data.resourceId || data.resource_id) && (
                        <div className={`px-3 py-2 border-b ${isDark ? 'border-[#2a2a2a] bg-[#0f0f0f]' : 'border-gray-100 bg-gray-50'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-cyan-500 text-[10px] font-bold">ID</span>
                            </div>
                            <code className={`text-xs break-all ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {data.resourceId || data.resource_id}
                            </code>
                        </div>
                    )}

                    {/* Text Section - EDITABLE */}
                    <div className={`px-3 py-2 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-purple-500 text-[10px] font-bold">{t('flows.editor.config.text_editable', { defaultValue: 'TEXT (Editable)' })}</span>
                            <span className={`text-[9px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                {t('flows.editor.config.variable_support', { defaultValue: 'Supports {{ variable }}' })}
                            </span>
                        </div>
                        <input
                            type="text"
                            value={data.text || ''}
                            onChange={(e) => updateData('text', e.target.value)}
                            placeholder={t('flows.editor.config.enter_text_to_find', { defaultValue: 'Enter text to find element...' })}
                            className={`w-full px-2 py-1.5 text-xs rounded border ${isDark
                                ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600'
                                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                } focus:ring-1 focus:ring-purple-500 focus:border-purple-500`}
                        />
                    </div>

                    {/* Content Description Section - EDITABLE */}
                    <div className={`px-3 py-2 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-green-500 text-[10px] font-bold">{t('flows.editor.config.content_desc_editable', { defaultValue: 'CONTENT DESC (Editable)' })}</span>
                            <span className={`text-[9px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                {t('flows.editor.config.variable_support', { defaultValue: 'Supports {{ variable }}' })}
                            </span>
                        </div>
                        <input
                            type="text"
                            value={data.contentDescription || ''}
                            onChange={(e) => updateData('contentDescription', e.target.value)}
                            placeholder={t('flows.editor.config.enter_content_desc', { defaultValue: 'Enter content description...' })}
                            className={`w-full px-2 py-1.5 text-xs rounded border ${isDark
                                ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600'
                                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                } focus:ring-1 focus:ring-green-500 focus:border-green-500`}
                        />
                    </div>

                    {/* Class Name Section */}
                    {(data.className || data.class_name) && (
                        <div className={`px-3 py-2 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-orange-500 text-[10px] font-bold">{t('flows.editor.config.class', { defaultValue: 'CLASS' })}</span>
                            </div>
                            <code className={`text-xs break-all ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {data.className || data.class_name}
                            </code>
                        </div>
                    )}

                    {/* Package Name Section */}
                    {(data.packageName || data.package_name) && (
                        <div className={`px-3 py-2 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-blue-500 text-[10px] font-bold">{t('flows.editor.config.package', { defaultValue: 'PACKAGE' })}</span>
                            </div>
                            <code className={`text-xs break-all ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {data.packageName || data.package_name}
                            </code>
                        </div>
                    )}

                    {/* Bounds Section */}
                    {data.bounds && (
                        <div className={`px-3 py-2 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-pink-500 text-[10px] font-bold">{t('flows.editor.config.bounds', { defaultValue: 'BOUNDS' })}</span>
                            </div>
                            <code className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {typeof data.bounds === 'object' && data.bounds !== null
                                    ? `${data.bounds.width ?? 0}×${data.bounds.height ?? 0} @ (${data.bounds.left ?? 0}, ${data.bounds.top ?? 0})`
                                    : typeof data.bounds === 'string' ? data.bounds : 'N/A'}
                            </code>
                        </div>
                    )}

                    {/* Icon Template Section */}
                    {data.image && (
                        <div className={`px-3 py-2 ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-violet-500 text-[10px] font-bold">{t('flows.editor.config.icon_template', { defaultValue: '🖼️ ICON TEMPLATE' })}</span>
                                {selectorPriority === 'icon' && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
                                        {t('flows.editor.config.active', { defaultValue: 'Active' })}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${selectorPriority === 'icon' ? 'border-violet-500' : isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                                    <img
                                        src={
                                            // Priority: 1) base64 from _selectors, 2) base64 inline, 3) URL
                                            data._selectors?.primary?.template
                                                ? `data:image/png;base64,${data._selectors.primary.template}`
                                                : data.image?.startsWith('http')
                                                    ? data.image
                                                    : data.image?.length > 200
                                                        ? `data:image/png;base64,${data.image}`
                                                        : data.image?.startsWith('/storage')
                                                            ? data.image
                                                            : null
                                        }
                                        alt="Icon template"
                                        className="w-full h-full object-contain bg-white"
                                        onError={(e) => {
                                            // Fallback to placeholder if image fails to load
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('flows.editor.config.icon_template_help', { defaultValue: 'This icon will be detected on screen at runtime using template matching.' })}
                                    </p>
                                    <p className={`text-[9px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                        {t('flows.editor.config.icon_template_tip', { defaultValue: '💡 Works even if UI layout changes' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fallback Coordinates (hidden but stored) */}
                    {(data.x || data.y) && selectorPriority !== 'icon' && (
                        <div className={`px-3 py-2 ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-amber-500 text-[10px] font-bold">{t('flows.editor.config.fallback_coords', { defaultValue: '📍 FALLBACK COORDS' })}</span>
                            </div>
                            <div className="flex gap-4 text-xs font-mono">
                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                                    X: <span className="text-amber-400">{data.x || 0}</span>
                                </span>
                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                                    Y: <span className="text-amber-400">{data.y || 0}</span>
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Element Flags */}
                    {(data.isClickable !== undefined || data.isEditable !== undefined || data.isScrollable !== undefined || data.isCheckable !== undefined) && (
                        <div className={`px-3 py-2 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[10px] font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('flows.editor.config.flags', { defaultValue: 'FLAGS' })}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {data.isClickable && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                                        clickable
                                    </span>
                                )}
                                {data.isEditable && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                                        editable
                                    </span>
                                )}
                                {data.isScrollable && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                                        scrollable
                                    </span>
                                )}
                                {data.isCheckable && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                                        checkable
                                    </span>
                                )}
                                {data.isFocusable && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>
                                        focusable
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* No data case */}
                    {!data.resourceId && !data.resource_id && !data.text && !data.contentDescription && !data.x && !data.coordinates?.x && (
                        <div className={`px-3 py-4 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <p className="text-xs">{t('flows.editor.config.no_element_data', { defaultValue: 'No element data recorded' })}</p>
                        </div>
                    )}
                </div>
            </ConfigSection>

            {nodeType === 'text_input' && (
                <ConfigSection title={t('flows.editor.config.input_text_label', { defaultValue: 'Input Text' })} isDark={isDark}>
                    <input
                        type="text"
                        value={data.inputText || data.text || ''}
                        onChange={(e) => updateData('inputText', e.target.value)}
                        placeholder={t('flows.editor.config.input_text_placeholder', { defaultValue: 'Text to type or {{variable}}...' })}
                        className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                            }`}
                    />

                    {/* Variable Picker - Show available fields from connected data source */}
                    {data.dataSourceNodeId && (() => {
                        const connectedSource = dataSourceNodes.find(n => n.id === data.dataSourceNodeId);
                        const schema = connectedSource?.data?.schema || [];
                        const outputName = connectedSource?.data?.outputName ||
                            connectedSource?.data?.collectionName?.toLowerCase().replace(/\s+/g, '_') || 'data';

                        if (schema.length === 0) return null;

                        return (
                            <div className="mt-2">
                                <p className={`text-[10px] mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {t('flows.editor.config.select_field_from', { defaultValue: '📊 Select field from' })} <span className="text-amber-400 font-medium">{connectedSource?.data?.collectionName || 'Data Source'}</span>:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {schema.map((field, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => updateData('inputText', `{{item.${field.name}}}`)}
                                            className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${isDark
                                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                                                }`}
                                        >
                                            {field.name}
                                        </button>
                                    ))}
                                </div>
                                <p className={`text-[9px] mt-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                    {t('flows.editor.config.click_to_insert_variable', { defaultValue: '💡 Click to insert variable into input' })}
                                </p>
                            </div>
                        );
                    })()}

                    {/* Hint when no data source connected */}
                    {!data.dataSourceNodeId && (
                        <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t('flows.editor.config.connect_data_source_hint', { defaultValue: '💡 Connect Data Source to select field from dropdown' })}
                        </p>
                    )}
                </ConfigSection>
            )}

            <ConfigSection title={t('flows.editor.config.wait_after_ms', { defaultValue: 'Wait After (ms)' })} isDark={isDark}>
                <input
                    type="number"
                    min="100"
                    max="30000"
                    step="100"
                    value={data.timeout || 500}
                    onChange={(e) => updateData('timeout', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
                <div className="flex gap-1 mt-1">
                    {[300, 500, 1000, 2000].map(ms => (
                        <button
                            key={ms}
                            onClick={() => updateData('timeout', ms)}
                            className={`px-2 py-0.5 rounded text-[10px] ${isDark ? 'bg-[#252525] hover:bg-[#2a2a2a] text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                        >
                            {ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
                        </button>
                    ))}
                </div>
            </ConfigSection>

            {/* Smart Matching Toggle */}
            <ConfigSection title={t('flows.editor.config.smart_matching', { defaultValue: 'Smart Matching' })} isDark={isDark}>
                <div className="space-y-3">
                    {/* Fuzzy Match Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('flows.editor.config.fuzzy_matching', { defaultValue: 'Fuzzy Matching' })}
                            </p>
                            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('flows.editor.config.fuzzy_matching_desc', { defaultValue: 'Allow partial text/description matches' })}
                            </p>
                        </div>
                        <button
                            onClick={() => updateData('fuzzyMatch', !data.fuzzyMatch)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${data.fuzzyMatch ? 'bg-cyan-500' : isDark ? 'bg-[#2a2a2a]' : 'bg-gray-300'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${data.fuzzyMatch ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>

                    {/* Case Insensitive Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('flows.editor.config.ignore_case', { defaultValue: 'Ignore Case' })}
                            </p>
                            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('flows.editor.config.ignore_case_desc', { defaultValue: 'Case-insensitive text matching' })}
                            </p>
                        </div>
                        <button
                            onClick={() => updateData('ignoreCase', !data.ignoreCase)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${data.ignoreCase !== false ? 'bg-cyan-500' : isDark ? 'bg-[#2a2a2a]' : 'bg-gray-300'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${data.ignoreCase !== false ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>
                </div>
            </ConfigSection>

            {/* Element Picker Modal */}
            <ElementPickerModal
                isOpen={showPicker}
                onClose={() => setShowPicker(false)}
                onSelect={handleElementSelect}
                deviceId={selectedDevice?.device_id}
                userId={userId}
                elementType={nodeType === 'text_input' ? 'editable' : 'clickable'}
            />
        </>
    );
}

export default TapActionConfig;
