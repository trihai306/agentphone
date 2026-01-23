import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';

/**
 * WaitConfig - Configuration for wait/delay nodes
 * Allows setting delay duration with quick presets
 */
export function WaitConfig({ data, updateData, isDark }) {
    const { t } = useTranslation();
    const durationMs = data.duration || 1000;

    return (
        <>
            <ConfigSection title={t('flows.editor.config.duration') + ' (ms)'} isDark={isDark}>
                <div className="space-y-2">
                    <input
                        type="number"
                        min="0"
                        max="86400000"
                        step="100"
                        value={durationMs}
                        onChange={(e) => updateData('duration', parseInt(e.target.value) || 1000)}
                        className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                            }`}
                    />
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        = {(durationMs / 1000).toFixed(1)} {t('flows.editor.config.seconds')}
                    </p>
                </div>
            </ConfigSection>
            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {t('flows.editor.config.quick_set')}:
                <div className="flex gap-2 mt-1 flex-wrap">
                    {[
                        { label: '0.5s', ms: 500 },
                        { label: '1s', ms: 1000 },
                        { label: '2s', ms: 2000 },
                        { label: '5s', ms: 5000 },
                        { label: '10s', ms: 10000 },
                        { label: '30s', ms: 30000 },
                        { label: '60s', ms: 60000 },
                    ].map(opt => (
                        <button
                            key={opt.ms}
                            onClick={() => updateData('duration', opt.ms)}
                            className={`px-2 py-1 rounded text-xs transition-all ${durationMs === opt.ms
                                ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500'
                                : isDark
                                    ? 'bg-[#252525] hover:bg-[#2a2a2a]'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
