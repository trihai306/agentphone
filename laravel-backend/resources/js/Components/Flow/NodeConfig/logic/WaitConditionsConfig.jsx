import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';

/**
 * WaitConditionsConfig - Configuration for wait_for_text, wait_for_activity, wait_for_package, wait_idle
 * Waiting and synchronization actions
 */
export function WaitConditionsConfig({ data, updateData, isDark, nodeType }) {
    const { t } = useTranslation();

    const TimeoutSection = () => (
        <div>
            <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Timeout (ms)
            </label>
            <input
                type="number"
                min="1000"
                max="120000"
                step="1000"
                value={data.timeout || 30000}
                onChange={(e) => updateData('timeout', parseInt(e.target.value) || 30000)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
            />
            <div className="flex gap-1 mt-2">
                {[10000, 30000, 60000, 120000].map(ms => (
                    <button
                        key={ms}
                        onClick={() => updateData('timeout', ms)}
                        className={`px-2 py-1 rounded text-[10px] transition-all ${data.timeout === ms
                            ? 'bg-indigo-500 text-white'
                            : isDark
                                ? 'bg-[#252525] hover:bg-[#2a2a2a] text-gray-400'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                    >
                        {ms >= 60000 ? `${ms / 60000}m` : `${ms / 1000}s`}
                    </button>
                ))}
            </div>
        </div>
    );

    // ========== WAIT FOR TEXT CONFIG ==========
    if (nodeType === 'wait_for_text') {
        return (
            <ConfigSection title={t('flows.editor.config.wait_for_text', { defaultValue: '⏳ Wait For Text' })} isDark={isDark}>
                <div className="space-y-4">
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-100'}`}>
                        <p className={`text-sm ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                            Wait until specific text appears on screen.
                        </p>
                    </div>

                    <div>
                        <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Text to Wait For
                        </label>
                        <input
                            type="text"
                            value={data.waitText || ''}
                            onChange={(e) => updateData('waitText', e.target.value)}
                            placeholder="Success, Loading Complete, etc..."
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                        />
                    </div>

                    <div>
                        <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Check Interval (ms)
                        </label>
                        <input
                            type="number"
                            min="200"
                            max="5000"
                            step="100"
                            value={data.interval || 500}
                            onChange={(e) => updateData('interval', parseInt(e.target.value) || 500)}
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                        />
                        <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            How often to check for the text
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Case Sensitive
                            </p>
                            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Match exact uppercase/lowercase
                            </p>
                        </div>
                        <button
                            onClick={() => updateData('caseSensitive', !data.caseSensitive)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${data.caseSensitive ? 'bg-purple-500' : isDark ? 'bg-[#2a2a2a]' : 'bg-gray-300'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${data.caseSensitive ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>

                    <TimeoutSection />
                </div>
            </ConfigSection>
        );
    }

    // ========== WAIT FOR ACTIVITY CONFIG ==========
    if (nodeType === 'wait_for_activity') {
        return (
            <ConfigSection title={t('flows.editor.config.wait_for_activity', { defaultValue: '⏳ Wait For Activity' })} isDark={isDark}>
                <div className="space-y-4">
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
                        <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                            Wait until a specific Android Activity is displayed.
                        </p>
                    </div>

                    <div>
                        <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Activity Name
                        </label>
                        <input
                            type="text"
                            value={data.activityName || ''}
                            onChange={(e) => updateData('activityName', e.target.value)}
                            placeholder="com.app.MainActivity"
                            className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                        />
                        <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            💡 Full or partial activity class name
                        </p>
                    </div>

                    <TimeoutSection />
                </div>
            </ConfigSection>
        );
    }

    // ========== WAIT FOR PACKAGE CONFIG ==========
    if (nodeType === 'wait_for_package') {
        return (
            <ConfigSection title={t('flows.editor.config.wait_for_package', { defaultValue: '⏳ Wait For Package' })} isDark={isDark}>
                <div className="space-y-4">
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-100'}`}>
                        <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                            Wait until a specific app is in foreground.
                        </p>
                    </div>

                    <div>
                        <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Package Name
                        </label>
                        <input
                            type="text"
                            value={data.packageName || ''}
                            onChange={(e) => updateData('packageName', e.target.value)}
                            placeholder="com.facebook.katana"
                            className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-green-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                        />
                        <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            💡 Use `Open App` node to get package names
                        </p>
                    </div>

                    <TimeoutSection />
                </div>
            </ConfigSection>
        );
    }

    // ========== WAIT IDLE CONFIG ==========
    if (nodeType === 'wait_idle') {
        return (
            <ConfigSection title={t('flows.editor.config.wait_idle', { defaultValue: '⏳ Wait for Idle' })} isDark={isDark}>
                <div className="space-y-4">
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'}`}>
                        <p className={`text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                            Wait until the screen becomes idle (no animations or transitions).
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Useful after app launches or page transitions
                        </p>
                    </div>

                    <TimeoutSection />

                    <div className={`p-3 rounded-lg ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-gray-50 border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            ℹ️ This action uses Android's <code className="text-cyan-500">waitForIdle()</code> API to detect when the UI has stopped changing.
                        </p>
                    </div>
                </div>
            </ConfigSection>
        );
    }

    return null;
}

export default WaitConditionsConfig;
