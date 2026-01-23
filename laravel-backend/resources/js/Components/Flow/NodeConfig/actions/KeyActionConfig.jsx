import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';

/**
 * KeyActionConfig - Configuration for key_event, back, home node types
 * Includes key selection grid with categories and repeat count
 */
export function KeyActionConfig({ data, updateData, isDark, nodeType }) {
    const { t } = useTranslation();

    // Available hardware keys with icons and categories
    const keyGroups = [
        {
            label: t('flows.editor.config.keys.group_navigation', { defaultValue: 'Navigation' }),
            keys: [
                { value: 'KEYCODE_BACK', label: t('flows.editor.config.keys.back', { defaultValue: 'Back' }), icon: '←', desc: t('flows.editor.config.keys.desc_back', { defaultValue: 'Go back' }) },
                { value: 'KEYCODE_HOME', label: t('flows.editor.config.keys.home', { defaultValue: 'Home' }), icon: '🏠', desc: t('flows.editor.config.keys.desc_home', { defaultValue: 'Go to home screen' }) },
                { value: 'KEYCODE_APP_SWITCH', label: t('flows.editor.config.keys.recent_apps', { defaultValue: 'Recent Apps' }), icon: '📑', desc: t('flows.editor.config.keys.desc_recent_apps', { defaultValue: 'Show recent apps' }) },
                { value: 'KEYCODE_MENU', label: t('flows.editor.config.keys.menu', { defaultValue: 'Menu' }), icon: '☰', desc: t('flows.editor.config.keys.desc_menu', { defaultValue: 'Open menu' }) },
            ]
        },
        {
            label: t('flows.editor.config.keys.group_input', { defaultValue: 'Input' }),
            keys: [
                { value: 'KEYCODE_ENTER', label: t('flows.editor.config.keys.enter', { defaultValue: 'Enter' }), icon: '⏎', desc: t('flows.editor.config.keys.desc_enter', { defaultValue: 'Submit/Confirm' }) },
                { value: 'KEYCODE_DEL', label: t('flows.editor.config.keys.delete', { defaultValue: 'Delete' }), icon: '⌫', desc: t('flows.editor.config.keys.desc_delete', { defaultValue: 'Delete character' }) },
                { value: 'KEYCODE_SPACE', label: t('flows.editor.config.keys.space', { defaultValue: 'Space' }), icon: '␣', desc: t('flows.editor.config.keys.desc_space', { defaultValue: 'Space character' }) },
                { value: 'KEYCODE_TAB', label: t('flows.editor.config.keys.tab', { defaultValue: 'Tab' }), icon: '⇥', desc: t('flows.editor.config.keys.desc_tab', { defaultValue: 'Tab key' }) },
                { value: 'KEYCODE_ESCAPE', label: t('flows.editor.config.keys.escape', { defaultValue: 'Escape' }), icon: 'Esc', desc: t('flows.editor.config.keys.desc_escape', { defaultValue: 'Escape/Cancel' }) },
            ]
        },
        {
            label: t('flows.editor.config.keys.group_dpad', { defaultValue: 'D-Pad' }),
            keys: [
                { value: 'KEYCODE_DPAD_UP', label: t('flows.editor.config.keys.up', { defaultValue: 'Up' }), icon: '↑', desc: t('flows.editor.config.keys.desc_up', { defaultValue: 'Navigate up' }) },
                { value: 'KEYCODE_DPAD_DOWN', label: t('flows.editor.config.keys.down', { defaultValue: 'Down' }), icon: '↓', desc: t('flows.editor.config.keys.desc_down', { defaultValue: 'Navigate down' }) },
                { value: 'KEYCODE_DPAD_LEFT', label: t('flows.editor.config.keys.left', { defaultValue: 'Left' }), icon: '←', desc: t('flows.editor.config.keys.desc_left', { defaultValue: 'Navigate left' }) },
                { value: 'KEYCODE_DPAD_RIGHT', label: t('flows.editor.config.keys.right', { defaultValue: 'Right' }), icon: '→', desc: t('flows.editor.config.keys.desc_right', { defaultValue: 'Navigate right' }) },
                { value: 'KEYCODE_DPAD_CENTER', label: t('flows.editor.config.keys.center', { defaultValue: 'Center' }), icon: '⊙', desc: t('flows.editor.config.keys.desc_center', { defaultValue: 'Select/Confirm' }) },
            ]
        },
        {
            label: t('flows.editor.config.keys.group_media', { defaultValue: 'Media' }),
            keys: [
                { value: 'KEYCODE_VOLUME_UP', label: t('flows.editor.config.keys.volume_up', { defaultValue: 'Volume +' }), icon: '🔊', desc: t('flows.editor.config.keys.desc_volume_up', { defaultValue: 'Increase volume' }) },
                { value: 'KEYCODE_VOLUME_DOWN', label: t('flows.editor.config.keys.volume_down', { defaultValue: 'Volume -' }), icon: '🔉', desc: t('flows.editor.config.keys.desc_volume_down', { defaultValue: 'Decrease volume' }) },
                { value: 'KEYCODE_VOLUME_MUTE', label: t('flows.editor.config.keys.mute', { defaultValue: 'Mute' }), icon: '🔇', desc: t('flows.editor.config.keys.desc_mute', { defaultValue: 'Mute audio' }) },
                { value: 'KEYCODE_MEDIA_PLAY_PAUSE', label: t('flows.editor.config.keys.play_pause', { defaultValue: 'Play/Pause' }), icon: '⏯️', desc: t('flows.editor.config.keys.desc_play_pause', { defaultValue: 'Toggle play' }) },
                { value: 'KEYCODE_MEDIA_NEXT', label: t('flows.editor.config.keys.next', { defaultValue: 'Next' }), icon: '⏭️', desc: t('flows.editor.config.keys.desc_next', { defaultValue: 'Next track' }) },
                { value: 'KEYCODE_MEDIA_PREVIOUS', label: t('flows.editor.config.keys.previous', { defaultValue: 'Previous' }), icon: '⏮️', desc: t('flows.editor.config.keys.desc_previous', { defaultValue: 'Previous track' }) },
            ]
        },
        {
            label: t('flows.editor.config.keys.group_system', { defaultValue: 'System' }),
            keys: [
                { value: 'KEYCODE_POWER', label: t('flows.editor.config.keys.power', { defaultValue: 'Power' }), icon: '⏻', desc: t('flows.editor.config.keys.desc_power', { defaultValue: 'Power button' }) },
                { value: 'KEYCODE_CAMERA', label: t('flows.editor.config.keys.camera', { defaultValue: 'Camera' }), icon: '📷', desc: t('flows.editor.config.keys.desc_camera', { defaultValue: 'Open camera' }) },
                { value: 'KEYCODE_SEARCH', label: t('flows.editor.config.keys.search', { defaultValue: 'Search' }), icon: '🔍', desc: t('flows.editor.config.keys.desc_search', { defaultValue: 'Open search' }) },
            ]
        }
    ];

    // Get current key based on nodeType or data
    const getCurrentKey = () => {
        if (data.key || data.keyCode) return data.key || data.keyCode;
        if (nodeType === 'back') return 'KEYCODE_BACK';
        if (nodeType === 'home') return 'KEYCODE_HOME';
        return 'KEYCODE_ENTER';
    };

    const currentKey = getCurrentKey();

    // Find current key info
    const findKeyInfo = (keyValue) => {
        for (const group of keyGroups) {
            const key = group.keys.find(k => k.value === keyValue);
            if (key) return { ...key, group: group.label };
        }
        return { value: keyValue, label: keyValue, icon: '⌨️', desc: t('flows.editor.config.keys.custom_key', { defaultValue: 'Custom key' }) };
    };

    const currentKeyInfo = findKeyInfo(currentKey);

    return (
        <>
            {/* Current Key Display */}
            <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20' : 'bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isDark ? 'bg-pink-500/20' : 'bg-pink-100'}`}>
                        {currentKeyInfo.icon}
                    </div>
                    <div>
                        <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {currentKeyInfo.label}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {currentKeyInfo.desc}
                        </p>
                    </div>
                </div>
            </div>

            {/* Key Selection - Only show for generic key_event type */}
            {nodeType === 'key_event' && (
                <ConfigSection title={t('flows.editor.config.keys.select_key', { defaultValue: 'Select Key' })} isDark={isDark}>
                    <div className="space-y-3">
                        {keyGroups.map(group => (
                            <div key={group.label}>
                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {group.label}
                                </p>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {group.keys.map(key => {
                                        const isSelected = currentKey === key.value;
                                        return (
                                            <button
                                                key={key.value}
                                                onClick={() => {
                                                    updateData('key', key.value);
                                                    updateData('keyCode', key.value);
                                                }}
                                                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all border ${isSelected
                                                    ? isDark
                                                        ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
                                                        : 'bg-pink-50 border-pink-300 text-pink-600'
                                                    : isDark
                                                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-gray-400 hover:border-pink-500/30'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-pink-200'
                                                    }`}
                                            >
                                                <span className="text-base">{key.icon}</span>
                                                <span className="text-xs font-medium truncate">{key.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </ConfigSection>
            )}

            {/* Fixed key info for back/home types */}
            {(nodeType === 'back' || nodeType === 'home') && (
                <div className={`p-3 rounded-lg ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                    <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {nodeType === 'back' && t('flows.editor.config.keys.node_back_desc', { defaultValue: '← This node will press the Android BACK button' })}
                        {nodeType === 'home' && t('flows.editor.config.keys.node_home_desc', { defaultValue: '🏠 This node will press the Android HOME button' })}
                    </p>
                </div>
            )}

            {/* Wait After */}
            <ConfigSection title={t('flows.editor.config.wait_after', { defaultValue: 'Wait After (ms)' })} isDark={isDark}>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min="0"
                        max="10000"
                        step="100"
                        value={data.timeout || data.wait_after || 500}
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 500;
                            updateData('timeout', val);
                            updateData('wait_after', val);
                        }}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg border ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                            }`}
                    />
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>ms</span>
                </div>
                <div className="flex gap-1 mt-2">
                    {[100, 300, 500, 1000, 2000].map(ms => (
                        <button
                            key={ms}
                            onClick={() => {
                                updateData('timeout', ms);
                                updateData('wait_after', ms);
                            }}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${(data.timeout || data.wait_after || 500) === ms
                                ? 'bg-pink-500 text-white'
                                : isDark
                                    ? 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
                        </button>
                    ))}
                </div>
            </ConfigSection>

            {/* Repeat Count */}
            <ConfigSection title={t('flows.editor.config.keys.repeat_count', { defaultValue: 'Repeat Count' })} isDark={isDark}>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={data.repeatCount || 1}
                        onChange={(e) => updateData('repeatCount', parseInt(e.target.value) || 1)}
                        className={`w-20 px-3 py-2 text-sm rounded-lg border text-center ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                            }`}
                    />
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {t('flows.editor.config.keys.times', { defaultValue: 'times' })}
                    </span>
                </div>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {t('flows.editor.config.keys.repeat_count_hint', { defaultValue: 'Press the key multiple times (useful for scrolling)' })}
                </p>
            </ConfigSection>
        </>
    );
}

export default KeyActionConfig;
