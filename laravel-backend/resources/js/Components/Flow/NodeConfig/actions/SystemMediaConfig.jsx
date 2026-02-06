import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';

/**
 * SystemMediaConfig - Configuration for system and media control actions
 * recents, notifications, quick_settings, volume_up, volume_down, media_play_pause
 */
export function SystemMediaConfig({ data, updateData, isDark, nodeType }) {
    const { t } = useTranslation();

    const actionInfo = {
        recents: {
            title: '📱 Recent Apps',
            icon: '📱',
            color: 'blue',
            description: 'Open the recent apps screen (multitasking view).',
            hint: 'Equivalent to swiping up from bottom or pressing the square button.',
        },
        notifications: {
            title: '🔔 Notifications',
            icon: '🔔',
            color: 'purple',
            description: 'Pull down the notification shade.',
            hint: 'Shows all pending notifications and quick toggles.',
        },
        quick_settings: {
            title: '⚙️ Quick Settings',
            icon: '⚙️',
            color: 'cyan',
            description: 'Open the quick settings panel.',
            hint: 'Full quick settings view with WiFi, Bluetooth, etc.',
        },
        volume_up: {
            title: '🔊 Volume Up',
            icon: '🔊',
            color: 'green',
            description: 'Increase the media volume by one step.',
            hint: 'Equivalent to pressing the physical volume up button.',
        },
        volume_down: {
            title: '🔉 Volume Down',
            icon: '🔉',
            color: 'amber',
            description: 'Decrease the media volume by one step.',
            hint: 'Equivalent to pressing the physical volume down button.',
        },
        media_play_pause: {
            title: '⏯️ Media Play/Pause',
            icon: '⏯️',
            color: 'pink',
            description: 'Toggle play/pause for the current media.',
            hint: 'Works with most music and video apps.',
        },
    };

    const info = actionInfo[nodeType] || {
        title: 'System Action',
        icon: '⚙️',
        color: 'gray',
        description: 'Execute a system action.',
        hint: '',
    };

    const colorClasses = {
        blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', light: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600' } },
        purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', light: { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600' } },
        cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', light: { bg: 'bg-cyan-50', border: 'border-cyan-100', text: 'text-cyan-600' } },
        green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', light: { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-600' } },
        amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', light: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600' } },
        pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-400', light: { bg: 'bg-pink-50', border: 'border-pink-100', text: 'text-pink-600' } },
        gray: { bg: 'bg-gray-500/10', border: 'border-gray-500/20', text: 'text-gray-400', light: { bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-600' } },
    };

    const colors = colorClasses[info.color];

    return (
        <ConfigSection title={info.title} isDark={isDark}>
            <div className="space-y-4">
                {/* Action Info Card */}
                <div className={`p-4 rounded-xl border ${isDark ? `${colors.bg} ${colors.border}` : `${colors.light.bg} ${colors.light.border}`}`}>
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">{info.icon}</span>
                        <div>
                            <p className={`text-sm font-medium ${isDark ? colors.text : colors.light.text}`}>
                                {info.description}
                            </p>
                            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                💡 {info.hint}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Wait After (Optional) */}
                <div>
                    <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Wait After (ms)
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="10000"
                        step="100"
                        value={data.waitAfter || 500}
                        onChange={(e) => updateData('waitAfter', parseInt(e.target.value) || 500)}
                        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                    />
                    <div className="flex gap-1 mt-2">
                        {[0, 300, 500, 1000].map(ms => (
                            <button
                                key={ms}
                                onClick={() => updateData('waitAfter', ms)}
                                className={`px-2 py-1 rounded text-[10px] transition-all ${(data.waitAfter || 500) === ms
                                    ? 'bg-indigo-500 text-white'
                                    : isDark
                                        ? 'bg-[#252525] hover:bg-[#2a2a2a] text-gray-400'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                    }`}
                            >
                                {ms === 0 ? 'None' : ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Volume-specific repeat option */}
                {(nodeType === 'volume_up' || nodeType === 'volume_down') && (
                    <div>
                        <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Repeat Count
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={data.repeatCount || 1}
                            onChange={(e) => updateData('repeatCount', parseInt(e.target.value) || 1)}
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                        />
                        <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            Number of times to press the volume button
                        </p>
                    </div>
                )}

                {/* No Configuration Required Info */}
                <div className={`p-3 rounded-lg ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-gray-50 border border-gray-100'}`}>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        ℹ️ This action requires no additional configuration. It will execute immediately when the workflow reaches this node.
                    </p>
                </div>
            </div>
        </ConfigSection>
    );
}

export default SystemMediaConfig;
