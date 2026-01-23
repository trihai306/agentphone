import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';

/**
 * SwipeActionConfig - Configuration for swipe gesture actions
 * Includes start/end coordinates, quick presets, and duration settings
 */
export function SwipeActionConfig({ data, updateData, isDark }) {
    const { t } = useTranslation();

    // Read from actionData (APK) or direct props (manual config)
    const actionData = data.actionData || {};
    const startX = data.startX || actionData.start_x || data.x || 540;
    const startY = data.startY || actionData.start_y || data.y || 1200;
    const endX = data.endX || actionData.end_x || 540;
    const endY = data.endY || actionData.end_y || 600;

    return (
        <>
            <ConfigSection title={t('flows.editor.config.swipe_gesture', { defaultValue: 'Swipe Gesture' })} isDark={isDark}>
                <div className="space-y-3">
                    <div>
                        <p className={`text-[10px] mb-1 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t('flows.editor.config.start_point', { defaultValue: 'Start Point' })}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>X</label>
                                <input
                                    type="number"
                                    value={startX}
                                    onChange={(e) => updateData('startX', parseInt(e.target.value))}
                                    className={`w-full px-2 py-1.5 text-sm rounded border ${isDark
                                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                                        : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                />
                            </div>
                            <div>
                                <label className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Y</label>
                                <input
                                    type="number"
                                    value={startY}
                                    onChange={(e) => updateData('startY', parseInt(e.target.value))}
                                    className={`w-full px-2 py-1.5 text-sm rounded border ${isDark
                                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                                        : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <span className={`text-lg ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>↓</span>
                    </div>
                    <div>
                        <p className={`text-[10px] mb-1 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t('flows.editor.config.end_point', { defaultValue: 'End Point' })}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>X</label>
                                <input
                                    type="number"
                                    value={endX}
                                    onChange={(e) => updateData('endX', parseInt(e.target.value))}
                                    className={`w-full px-2 py-1.5 text-sm rounded border ${isDark
                                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                                        : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                />
                            </div>
                            <div>
                                <label className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Y</label>
                                <input
                                    type="number"
                                    value={endY}
                                    onChange={(e) => updateData('endY', parseInt(e.target.value))}
                                    className={`w-full px-2 py-1.5 text-sm rounded border ${isDark
                                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                                        : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </ConfigSection>

            <ConfigSection title={t('flows.editor.config.quick_presets', { defaultValue: 'Quick Presets' })} isDark={isDark}>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { label: t('flows.editor.config.swipe_up', { defaultValue: '↑ Swipe Up' }), sx: 540, sy: 1600, ex: 540, ey: 800 },
                        { label: t('flows.editor.config.swipe_down', { defaultValue: '↓ Swipe Down' }), sx: 540, sy: 800, ex: 540, ey: 1600 },
                        { label: t('flows.editor.config.swipe_left', { defaultValue: '← Swipe Left' }), sx: 900, sy: 1200, ex: 180, ey: 1200 },
                        { label: t('flows.editor.config.swipe_right', { defaultValue: '→ Swipe Right' }), sx: 180, sy: 1200, ex: 900, ey: 1200 },
                    ].map(preset => (
                        <button
                            key={preset.label}
                            onClick={() => {
                                updateData('startX', preset.sx);
                                updateData('startY', preset.sy);
                                updateData('endX', preset.ex);
                                updateData('endY', preset.ey);
                            }}
                            className={`px-2 py-1.5 rounded text-xs transition-all ${isDark
                                ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-300'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                }`}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </ConfigSection>

            <ConfigSection title={t('flows.editor.config.duration_ms', { defaultValue: 'Duration (ms)' })} isDark={isDark}>
                <input
                    type="number"
                    min="100"
                    max="2000"
                    step="100"
                    value={data.duration || actionData.duration || 300}
                    onChange={(e) => updateData('duration', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('flows.editor.config.duration_hint', { defaultValue: '100-200ms = fast flick • 300-500ms = normal • 800ms+ = slow drag' })}
                </p>
            </ConfigSection>

            <ConfigSection title={t('flows.editor.config.wait_after_ms', { defaultValue: 'Wait After (ms)' })} isDark={isDark}>
                <input
                    type="number"
                    min="100"
                    max="10000"
                    value={data.timeout || 500}
                    onChange={(e) => updateData('timeout', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
            </ConfigSection>
        </>
    );
}

export default SwipeActionConfig;
