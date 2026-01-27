import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';

/**
 * ProbabilityConfig - Configuration for probability/random branching nodes
 * Supports 2-5 weighted paths with auto-normalized percentages
 */
export function ProbabilityConfig({ data, updateData, isDark }) {
    const { t } = useTranslation();

    // Get paths from data or use default 2 paths with 50/50
    const paths = data.paths || [
        { label: 'Path A', weight: 50 },
        { label: 'Path B', weight: 50 }
    ];

    // Calculate total weight for normalization
    const totalWeight = paths.reduce((sum, path) => sum + (path.weight || 0), 0);

    // Normalize to percentages
    const normalizedPaths = paths.map(path => ({
        ...path,
        percentage: totalWeight > 0 ? Math.round((path.weight / totalWeight) * 100) : 0
    }));

    // Add new path
    const handleAddPath = () => {
        if (paths.length >= 5) return; // Max 5 paths

        const newPaths = [
            ...paths,
            { label: `Path ${String.fromCharCode(65 + paths.length)}`, weight: 50 }
        ];
        updateData('paths', newPaths);
    };

    // Remove path
    const handleRemovePath = (index) => {
        if (paths.length <= 2) return; // Min 2 paths

        const newPaths = paths.filter((_, i) => i !== index);
        updateData('paths', newPaths);
    };

    // Update path label
    const handleUpdateLabel = (index, label) => {
        const newPaths = [...paths];
        newPaths[index] = { ...newPaths[index], label };
        updateData('paths', newPaths);
    };

    // Update path weight
    const handleUpdateWeight = (index, weight) => {
        const newPaths = [...paths];
        newPaths[index] = { ...newPaths[index], weight: parseInt(weight) || 0 };
        updateData('paths', newPaths);
    };

    return (
        <>
            <ConfigSection
                title={t('flows.editor.config.probability_paths', { defaultValue: 'Probability Paths' })}
                isDark={isDark}
                badge={
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                        {paths.length}
                    </span>
                }
            >
                <div className="space-y-2.5">
                    {normalizedPaths.map((path, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-xl space-y-2.5 ${isDark ? 'bg-[#0f0f0f] border border-[#1a1a1a]' : 'bg-gray-50 border border-gray-100'}`}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Path {index + 1}
                                </span>
                                {paths.length > 2 && (
                                    <button
                                        onClick={() => handleRemovePath(index)}
                                        className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
                                        title="Remove path"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Label Input */}
                            <div>
                                <label className={`block text-[10px] font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t('flows.editor.config.path_label', { defaultValue: 'Label' })}
                                </label>
                                <input
                                    type="text"
                                    value={path.label}
                                    onChange={(e) => handleUpdateLabel(index, e.target.value)}
                                    placeholder={`Path ${String.fromCharCode(65 + index)}`}
                                    className={`w-full px-2.5 py-1.5 text-xs rounded-lg border ${isDark
                                        ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600'
                                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                        } focus:outline-none focus:ring-1 focus:ring-orange-500/50`}
                                />
                            </div>

                            {/* Weight Control */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className={`text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {t('flows.editor.config.weight', { defaultValue: 'Weight' })}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={path.weight}
                                            onChange={(e) => handleUpdateWeight(index, e.target.value)}
                                            min="0"
                                            max="100"
                                            className={`w-14 px-2 py-0.5 text-xs text-center rounded border ${isDark
                                                ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white'
                                                : 'bg-white border-gray-200 text-gray-900'
                                                } focus:outline-none focus:ring-1 focus:ring-orange-500/50`}
                                        />
                                        <span className={`text-xs font-bold text-orange-500 min-w-[45px] text-right`}>
                                            {path.percentage}%
                                        </span>
                                    </div>
                                </div>

                                {/* Weight Slider */}
                                <input
                                    type="range"
                                    value={path.weight}
                                    onChange={(e) => handleUpdateWeight(index, e.target.value)}
                                    min="0"
                                    max="100"
                                    step="5"
                                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-200'}`}
                                    style={{ accentColor: '#f97316' }}
                                />

                                {/* Visual Progress Bar */}
                                <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                                    <div
                                        className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-300"
                                        style={{ width: `${path.percentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add Path Button */}
                    <button
                        onClick={handleAddPath}
                        disabled={paths.length >= 5}
                        className={`w-full py-2.5 rounded-xl text-xs font-medium transition-all border-2 border-dashed flex items-center justify-center gap-2 ${paths.length >= 5
                            ? 'opacity-50 cursor-not-allowed'
                            : isDark
                                ? 'border-[#2a2a2a] text-gray-500 hover:border-orange-500/50 hover:text-orange-400'
                                : 'border-gray-200 text-gray-400 hover:border-orange-500 hover:text-orange-600'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {t('flows.editor.config.add_path', { defaultValue: 'Add Path' })}
                        {paths.length >= 5 && <span className="text-[10px]">(Max 5)</span>}
                    </button>
                </div>

                {/* Info Footer */}
                <div className={`mt-3 pt-3 border-t ${isDark ? 'border-[#1a1a1a]' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-2 text-[10px]">
                        <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                            {t('flows.editor.config.probability_hint', { defaultValue: 'Percentages are auto-normalized. Min 2 paths, max 5 paths.' })}
                        </span>
                    </div>
                </div>
            </ConfigSection>
        </>
    );
}
