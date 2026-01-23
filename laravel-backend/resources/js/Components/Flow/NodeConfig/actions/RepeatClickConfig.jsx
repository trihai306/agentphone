import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';
import ElementPickerModal from '../../ElementPickerModal';

/**
 * RepeatClickConfig - Configuration for repeat_click action
 * Click element multiple times with configurable count and delay
 */
export function RepeatClickConfig({ data, updateData, updateMultipleData, isDark, selectedDevice, userId }) {
    const [showPicker, setShowPicker] = useState(false);
    const { t } = useTranslation();

    const clickCount = data.clickCount || 3;
    const delayBetweenClicks = data.delayBetweenClicks || 200;
    const randomDelay = data.randomDelay || false;
    const minDelay = data.minDelay || 100;
    const maxDelay = data.maxDelay || 500;

    // Handler for element selection from picker
    const handleElementSelect = (element) => {
        let centerX = element.centerX || element.x;
        let centerY = element.centerY || element.y;

        if ((!centerX || !centerY) && element.bounds) {
            const b = element.bounds;
            if (b.left !== undefined && b.right !== undefined) {
                centerX = Math.round((b.left + b.right) / 2);
            }
            if (b.top !== undefined && b.bottom !== undefined) {
                centerY = Math.round((b.top + b.bottom) / 2);
            }
        }

        updateMultipleData({
            resourceId: element.resourceId,
            text: element.text,
            contentDescription: element.contentDescription,
            x: centerX,
            y: centerY,
            bounds: element.bounds,
            packageName: element.packageName || data.packageName,
        });

        setShowPicker(false);
    };

    return (
        <>
            {/* Click Count */}
            <ConfigSection title={t('flows.editor.config.click_count', { defaultValue: '🔢 Click Count' })} isDark={isDark}>
                <input
                    type="number"
                    min="1"
                    max="100"
                    value={clickCount}
                    onChange={(e) => updateData('clickCount', parseInt(e.target.value) || 1)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
                <div className="flex gap-1 mt-2">
                    {[3, 5, 10, 20, 50].map(count => (
                        <button
                            key={count}
                            onClick={() => updateData('clickCount', count)}
                            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${clickCount === count
                                    ? 'bg-cyan-500 text-white'
                                    : isDark
                                        ? 'bg-[#252525] hover:bg-[#2a2a2a] text-gray-400'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                }`}
                        >
                            {count}x
                        </button>
                    ))}
                </div>
            </ConfigSection>

            {/* Delay Settings */}
            <ConfigSection title={t('flows.editor.config.delay_between_clicks', { defaultValue: '⏱️ Delay Between Clicks' })} isDark={isDark}>
                {/* Random Delay Toggle */}
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {t('flows.editor.config.random_delay', { defaultValue: 'Random Delay' })}
                        </p>
                        <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t('flows.editor.config.random_delay_desc', { defaultValue: 'More human-like behavior' })}
                        </p>
                    </div>
                    <button
                        onClick={() => updateData('randomDelay', !randomDelay)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${randomDelay ? 'bg-cyan-500' : isDark ? 'bg-[#2a2a2a]' : 'bg-gray-300'}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${randomDelay ? 'translate-x-5' : ''}`} />
                    </button>
                </div>

                {randomDelay ? (
                    <div className="space-y-3">
                        <div>
                            <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {t('flows.editor.config.min_delay_ms', { defaultValue: 'Min Delay (ms)' })}
                            </label>
                            <input
                                type="number"
                                min="50"
                                max="5000"
                                value={minDelay}
                                onChange={(e) => updateData('minDelay', parseInt(e.target.value) || 100)}
                                className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                                    ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                                    : 'bg-white border-gray-200 text-gray-900'
                                    }`}
                            />
                        </div>
                        <div>
                            <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {t('flows.editor.config.max_delay_ms', { defaultValue: 'Max Delay (ms)' })}
                            </label>
                            <input
                                type="number"
                                min="50"
                                max="5000"
                                value={maxDelay}
                                onChange={(e) => updateData('maxDelay', parseInt(e.target.value) || 500)}
                                className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                                    ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                                    : 'bg-white border-gray-200 text-gray-900'
                                    }`}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <input
                            type="number"
                            min="50"
                            max="5000"
                            step="50"
                            value={delayBetweenClicks}
                            onChange={(e) => updateData('delayBetweenClicks', parseInt(e.target.value) || 200)}
                            className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                                ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                                : 'bg-white border-gray-200 text-gray-900'
                                }`}
                        />
                        <div className="flex gap-1 mt-2">
                            {[100, 200, 500, 1000].map(ms => (
                                <button
                                    key={ms}
                                    onClick={() => updateData('delayBetweenClicks', ms)}
                                    className={`px-2 py-1 rounded text-[10px] ${delayBetweenClicks === ms
                                            ? 'bg-cyan-500 text-white'
                                            : isDark
                                                ? 'bg-[#252525] hover:bg-[#2a2a2a] text-gray-400'
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                        }`}
                                >
                                    {ms}ms
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </ConfigSection>

            {/* Element Picker Button */}
            <ConfigSection title={t('flows.editor.config.target_element', { defaultValue: '🎯 Target Element' })} isDark={isDark}>
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

            {/* Element Details */}
            {(data.resourceId || data.text || data.x) && (
                <ConfigSection title={t('flows.editor.config.selected_element', { defaultValue: 'Selected Element' })} isDark={isDark}>
                    <div className={`rounded-lg overflow-hidden border ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                        {data.resourceId && (
                            <div className={`px-3 py-2 border-b ${isDark ? 'border-[#2a2a2a] bg-[#0f0f0f]' : 'border-gray-100 bg-gray-50'}`}>
                                <span className="text-cyan-500 text-[10px] font-bold">ID</span>
                                <code className={`block text-xs mt-1 break-all ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {data.resourceId}
                                </code>
                            </div>
                        )}
                        {data.text && (
                            <div className={`px-3 py-2 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                                <span className="text-purple-500 text-[10px] font-bold">TEXT</span>
                                <p className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {data.text}
                                </p>
                            </div>
                        )}
                        {(data.x || data.y) && (
                            <div className={`px-3 py-2 ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                                <span className="text-amber-500 text-[10px] font-bold">COORDINATES</span>
                                <p className={`text-xs font-mono mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    X: {data.x || 0}, Y: {data.y || 0}
                                </p>
                            </div>
                        )}
                    </div>
                </ConfigSection>
            )}

            {/* Summary */}
            <ConfigSection title={t('flows.editor.config.action_summary', { defaultValue: '📋 Action Summary' })} isDark={isDark}>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-[#0f0f0f] border border-[#2a2a2a]' : 'bg-gray-50 border border-gray-200'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {t('flows.editor.config.repeat_click_summary', {
                            defaultValue: 'Click {{count}} times with {{delay}}ms delay',
                            count: clickCount,
                            delay: randomDelay ? `${minDelay}-${maxDelay}` : delayBetweenClicks
                        })}
                    </p>
                    {data.text && (
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Target: "{data.text}"
                        </p>
                    )}
                </div>
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

export default RepeatClickConfig;
