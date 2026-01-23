import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';

/**
 * ProcessConfig - Configuration for data processing/transformation nodes
 * Supports transform, filter, map, reduce, format, and parse operations
 */
export function ProcessConfig({ data, updateData, isDark, upstreamVariables }) {
    const { t } = useTranslation();
    const processType = data.processType || 'transform';

    return (
        <>
            <ConfigSection title={t('flows.editor.config.process_type')} isDark={isDark}>
                <select
                    value={processType}
                    onChange={(e) => updateData('processType', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                >
                    <option value="transform">{t('flows.editor.config.transform_data')}</option>
                    <option value="filter">{t('flows.editor.config.filter_array')}</option>
                    <option value="map">{t('flows.editor.config.map_values')}</option>
                    <option value="reduce">{t('flows.editor.config.reduce_aggregate')}</option>
                    <option value="format">{t('flows.editor.config.format_text')}</option>
                    <option value="parse">{t('flows.editor.config.parse_json')}</option>
                </select>
            </ConfigSection>

            <ConfigSection title={t('flows.editor.config.input')} isDark={isDark}>
                <input
                    type="text"
                    value={data.inputVariable || ''}
                    onChange={(e) => updateData('inputVariable', e.target.value)}
                    placeholder="{{data}} or {{item.field}}"
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-cyan-400'
                        : 'bg-white border-gray-200 text-cyan-600'
                        }`}
                />
            </ConfigSection>

            {processType === 'transform' && (
                <ConfigSection title={t('flows.editor.config.expression')} isDark={isDark}>
                    <textarea
                        value={data.expression || ''}
                        onChange={(e) => updateData('expression', e.target.value)}
                        placeholder="{{value.toUpperCase()}}"
                        rows={3}
                        className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                            }`}
                    />
                </ConfigSection>
            )}

            {processType === 'filter' && (
                <ConfigSection title={t('flows.editor.config.filter_condition')} isDark={isDark}>
                    <input
                        type="text"
                        value={data.filterCondition || ''}
                        onChange={(e) => updateData('filterCondition', e.target.value)}
                        placeholder="item.status === 'active'"
                        className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                            }`}
                    />
                </ConfigSection>
            )}

            <ConfigSection title={t('flows.editor.config.output_variable')} isDark={isDark}>
                <input
                    type="text"
                    value={data.outputVariable || 'result'}
                    onChange={(e) => updateData('outputVariable', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-cyan-400'
                        : 'bg-white border-gray-200 text-cyan-600'
                        }`}
                />
            </ConfigSection>
        </>
    );
}

export default ProcessConfig;
