import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';

/**
 * ScrollActionConfig - Configuration for scroll gestures
 * Supports directional scrolling with amount control and visual preview
 */
export function ScrollActionConfig({ data, updateData, isDark }) {
    const { t } = useTranslation();

    // Auto-detect direction from eventType (scroll_up, scroll_down, etc.)
    const detectDirection = () => {
        const eventType = data.eventType || '';
        if (eventType.includes('up')) return 'up';
        if (eventType.includes('down')) return 'down';
        if (eventType.includes('left')) return 'left';
        if (eventType.includes('right')) return 'right';
        return data.direction || data.actionData?.direction || 'down';
    };

    const direction = data.direction || detectDirection();
    const amount = data.amount || data.actionData?.amount || 1;

    const directionOptions = [
        { value: 'up', icon: '↑', label: t('flows.editor.scroll.up', { defaultValue: 'Up' }), color: '#22c55e', desc: t('flows.editor.scroll.desc_up', { defaultValue: 'Scroll content down' }) },
        { value: 'down', icon: '↓', label: t('flows.editor.scroll.down', { defaultValue: 'Down' }), color: '#3b82f6', desc: t('flows.editor.scroll.desc_down', { defaultValue: 'Scroll content up' }) },
        { value: 'left', icon: '←', label: t('flows.editor.scroll.left', { defaultValue: 'Left' }), color: '#a855f7', desc: t('flows.editor.scroll.desc_left', { defaultValue: 'Scroll content right' }) },
        { value: 'right', icon: '→', label: t('flows.editor.scroll.right', { defaultValue: 'Right' }), color: '#f59e0b', desc: t('flows.editor.scroll.desc_right', { defaultValue: 'Scroll content left' }) },
    ];

    const currentDir = directionOptions.find(d => d.value === direction) || directionOptions[1];

    return (
        <>
            {/* Visual Gesture Preview */}
            <div className={`mb-4 p-4 rounded-xl ${isDark ? 'bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]' : 'bg-gradient-to-br from-gray-50 to-white'} border ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                <div className="flex items-center justify-center gap-4">
                    {/* Phone mockup with gesture */}
                    <div className="relative w-16 h-24 rounded-lg border-2 flex items-center justify-center"
                        style={{ borderColor: currentDir.color, background: isDark ? '#0a0a0a' : '#f9fafb' }}>
                        {/* Gesture animation */}
                        <div className="flex flex-col items-center gap-1 animate-pulse">
                            <span style={{ color: currentDir.color }} className="text-2xl font-bold">{currentDir.icon}</span>
                        </div>
                    </div>
                    <div className="text-left">
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {t('flows.editor.scroll.scrolling', { direction: currentDir.label, defaultValue: `Scrolling ${currentDir.label}` })}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {amount}× ({amount * 40}% of screen)
                        </p>
                    </div>
                </div>
            </div>

            <ConfigSection title={t('flows.editor.scroll.direction', { defaultValue: 'Scroll Direction' })} isDark={isDark}>
                <div className="grid grid-cols-2 gap-2">
                    {directionOptions.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => updateData('direction', opt.value)}
                            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all border ${direction === opt.value
                                ? `border-2 shadow-lg`
                                : isDark
                                    ? 'border-[#2a2a2a] hover:border-[#3a3a3a] text-gray-400'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                }`}
                            style={direction === opt.value ? {
                                borderColor: opt.color,
                                backgroundColor: `${opt.color}15`,
                                color: opt.color,
                                boxShadow: `0 4px 12px ${opt.color}30`
                            } : {}}
                        >
                            <span className="text-xl">{opt.icon}</span>
                            <span>{opt.label}</span>
                        </button>
                    ))}
                </div>
            </ConfigSection>

            <ConfigSection title={t('flows.editor.scroll.amount', { defaultValue: 'Scroll Amount' })} isDark={isDark}>
                {/* Slider */}
                <div className="relative pt-1 pb-2">
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={amount}
                        onChange={(e) => updateData('amount', parseInt(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                        style={{
                            background: isDark
                                ? `linear-gradient(to right, ${currentDir.color} 0%, ${currentDir.color} ${amount * 10}%, #2a2a2a ${amount * 10}%, #2a2a2a 100%)`
                                : `linear-gradient(to right, ${currentDir.color} 0%, ${currentDir.color} ${amount * 10}%, #e5e7eb ${amount * 10}%, #e5e7eb 100%)`
                        }}
                    />
                </div>

                {/* Quick preset buttons */}
                <div className="flex gap-1.5 mt-2">
                    {[1, 2, 3, 5, 10].map(n => (
                        <button
                            key={n}
                            onClick={() => updateData('amount', n)}
                            className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${amount === n
                                ? `text-white`
                                : isDark
                                    ? 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            style={amount === n ? { backgroundColor: currentDir.color } : {}}
                        >
                            {n}×
                        </button>
                    ))}
                </div>

                <div className={`flex items-center justify-between mt-2 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span>{t('flows.editor.scroll.small', { defaultValue: 'Small scroll' })}</span>
                    <span>{t('flows.editor.scroll.full_page', { defaultValue: 'Full page' })}</span>
                </div>
            </ConfigSection>

            {/* Target Container (if available) */}
            {(data.resourceId || data.resource_id) && (
                <ConfigSection title={t('flows.editor.scroll.target_container', { defaultValue: 'Target Container' })} isDark={isDark}>
                    <div className={`p-3 rounded-xl font-mono text-xs ${isDark ? 'bg-[#0f0f0f] border border-[#2a2a2a]' : 'bg-gray-50 border border-gray-200'}`}>
                        <div className="flex items-center gap-2">
                            <span className="text-cyan-500">#</span>
                            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{data.resourceId || data.resource_id}</span>
                        </div>
                    </div>
                </ConfigSection>
            )}

            {/* Screenshot preview if available */}
            {data.screenshotUrl && (
                <ConfigSection title={t('flows.editor.scroll.reference', { defaultValue: 'Reference Screenshot' })} isDark={isDark}>
                    <div className="relative rounded-xl overflow-hidden border border-dashed"
                        style={{ borderColor: isDark ? '#2a2a2a' : '#e5e7eb' }}>
                        <img
                            src={data.screenshotUrl}
                            alt="Scroll reference"
                            className="w-full h-32 object-cover opacity-60"
                        />
                        {/* Direction overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${currentDir.color}90` }}>
                                <span className="text-white text-2xl">{currentDir.icon}</span>
                            </div>
                        </div>
                    </div>
                </ConfigSection>
            )}

            <ConfigSection title={t('flows.editor.scroll.wait_after', { defaultValue: 'Wait After (ms)' })} isDark={isDark}>
                <input
                    type="number"
                    min="100"
                    max="30000"
                    step="100"
                    value={data.timeout || data.wait_after || 1000}
                    onChange={(e) => updateData('timeout', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
                <div className="flex gap-1 mt-1.5">
                    {[500, 1000, 2000, 3000].map(ms => (
                        <button
                            key={ms}
                            onClick={() => updateData('timeout', ms)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${(data.timeout || 1000) === ms
                                ? isDark
                                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                    : 'bg-cyan-50 text-cyan-600 border border-cyan-200'
                                : isDark
                                    ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-400'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                }`}
                        >
                            {ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
                        </button>
                    ))}
                </div>
            </ConfigSection>
        </>
    );
}

export default ScrollActionConfig;
