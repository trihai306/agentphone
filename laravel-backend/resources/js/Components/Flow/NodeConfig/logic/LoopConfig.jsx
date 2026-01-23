import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';

/**
 * LoopConfig - Configuration for loop nodes
 * Supports data source, fixed count, and custom array modes
 */
export function LoopConfig({ data, updateData, isDark, dataSourceNodes = [] }) {
    const { t } = useTranslation();

    // Map source to dataSource for backend compatibility
    const currentSource = data.dataSource || data.source || 'fixed';

    const handleSourceChange = (source) => {
        updateData('source', source);
        const dataSourceValue = source === 'count' ? 'fixed' : source;
        updateData('dataSource', dataSourceValue);
    };

    const handleDataSourceSelect = (nodeId) => {
        const selectedNode = dataSourceNodes.find(n => n.id === nodeId);
        if (selectedNode) {
            updateData('dataSourceNodeId', nodeId);
            updateData('dataSourceName', selectedNode.data?.outputName ||
                selectedNode.data?.collectionName?.toLowerCase().replace(/\s+/g, '_') || 'records');
        }
    };

    const sourceOptions = [
        {
            value: 'data',
            label: t('flows.editor.config.from_data_source', { defaultValue: 'From Data Collection' }),
            icon: '📊',
            description: t('flows.editor.config.from_data_source_desc', { defaultValue: 'Loop through records from DataSource node' }),
            color: 'amber'
        },
        {
            value: 'count',
            label: t('flows.editor.config.fixed_count', { defaultValue: 'Fixed Iterations' }),
            icon: '🔢',
            description: t('flows.editor.config.fixed_count_desc', { defaultValue: 'Repeat a specific number of times' }),
            color: 'blue'
        },
        {
            value: 'custom',
            label: t('flows.editor.config.custom_array', { defaultValue: 'Custom Array' }),
            icon: '📝',
            description: t('flows.editor.config.custom_array_desc', { defaultValue: 'Loop through a custom variable' }),
            color: 'purple'
        },
    ];

    const colorMap = {
        amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/50', text: 'text-amber-500' },
        blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/50', text: 'text-blue-500' },
        purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/50', text: 'text-purple-500' },
    };

    const selectedDataSource = dataSourceNodes.find(n => n.id === data.dataSourceNodeId);

    return (
        <>
            <ConfigSection title={t('flows.editor.config.loop_source', { defaultValue: 'Loop Source' })} isDark={isDark}>
                <div className="space-y-2">
                    {sourceOptions.map(opt => {
                        const isSelected = currentSource === opt.value ||
                            (opt.value === 'count' && currentSource === 'fixed');
                        const colors = colorMap[opt.color];

                        return (
                            <button
                                key={opt.value}
                                onClick={() => handleSourceChange(opt.value)}
                                className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all border ${isSelected
                                    ? `${colors.bg} ${colors.border}`
                                    : isDark
                                        ? 'bg-[#0f0f0f] border-[#2a2a2a] hover:border-[#3a3a3a]'
                                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <span className="text-xl mt-0.5">{opt.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${isSelected ? colors.text : isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {opt.label}
                                    </p>
                                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {opt.description}
                                    </p>
                                </div>
                                {isSelected && (
                                    <svg className={`w-5 h-5 ${colors.text}`} fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        );
                    })}
                </div>
            </ConfigSection>

            {/* Data Source Mode */}
            {(currentSource === 'data') && (
                <>
                    <ConfigSection title={t('flows.editor.config.select_data_source', { defaultValue: 'Select Data Source' })} isDark={isDark}>
                        {dataSourceNodes.length > 0 ? (
                            <select
                                value={data.dataSourceNodeId || ''}
                                onChange={(e) => handleDataSourceSelect(e.target.value)}
                                className={`w-full px-3 py-2.5 text-sm rounded-xl border ${isDark
                                    ? 'bg-[#0f0f0f] border-amber-500/30 text-white'
                                    : 'bg-white border-amber-200 text-gray-900'
                                    } focus:outline-none focus:ring-2 focus:ring-amber-500/50`}
                            >
                                <option value="">{t('flows.editor.config.choose_collection', { defaultValue: '-- Choose a collection --' })}</option>
                                {dataSourceNodes.map(node => {
                                    const outputName = node.data?.outputName ||
                                        node.data?.collectionName?.toLowerCase().replace(/\s+/g, '_') || 'records';
                                    return (
                                        <option key={node.id} value={node.id}>
                                            📊 {node.data?.collectionName} ({node.data?.recordCount || 0} records) → {`{{${outputName}}}`}
                                        </option>
                                    );
                                })}
                            </select>
                        ) : (
                            <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                                <p className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                    ⚠️ {t('flows.editor.config.no_data_sources', { defaultValue: 'No DataSource nodes on canvas' })}
                                </p>
                                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {t('flows.editor.config.add_data_source_hint', { defaultValue: 'Drag a DataSource node to the canvas first' })}
                                </p>
                            </div>
                        )}
                    </ConfigSection>

                    {selectedDataSource && (
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                            <p className={`text-xs font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                ✓ {t('flows.editor.config.using_collection', { defaultValue: 'Using:' })} {selectedDataSource.data?.collectionName}
                            </p>
                            <div className={`mt-2 flex items-center gap-2 text-xs font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                <code className={`px-2 py-1 rounded ${isDark ? 'bg-black/30' : 'bg-white/50'}`}>
                                    {`{{${data.dataSourceName || 'records'}}}`}
                                </code>
                                <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>→</span>
                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                                    {selectedDataSource.data?.recordCount || 0} records
                                </span>
                            </div>
                        </div>
                    )}

                    {!selectedDataSource && dataSourceNodes.length === 0 && (
                        <ConfigSection title={t('flows.editor.config.source_variable', { defaultValue: 'Source Variable' })} isDark={isDark}>
                            <input
                                type="text"
                                value={data.sourceVariable || '{{records}}'}
                                onChange={(e) => updateData('sourceVariable', e.target.value)}
                                className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                                    ? 'bg-[#0f0f0f] border-[#2a2a2a] text-indigo-400'
                                    : 'bg-white border-gray-200 text-indigo-600'
                                    }`}
                            />
                            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('flows.editor.config.source_variable_hint', { defaultValue: 'Variable containing the array to loop through' })}
                            </p>
                        </ConfigSection>
                    )}
                </>
            )}

            {/* Fixed Count Mode */}
            {(currentSource === 'count' || currentSource === 'fixed') && (
                <ConfigSection title={t('flows.editor.config.iterations', { defaultValue: 'Iterations' })} isDark={isDark}>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min="1"
                            max="10000"
                            value={data.iterations || 10}
                            onChange={(e) => updateData('iterations', parseInt(e.target.value) || 1)}
                            className={`flex-1 px-3 py-2 text-sm rounded-lg border ${isDark
                                ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                                : 'bg-white border-gray-200 text-gray-900'
                                }`}
                        />
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t('flows.editor.config.times', { defaultValue: 'times' })}
                        </span>
                    </div>
                </ConfigSection>
            )}

            {/* Custom Array Mode */}
            {currentSource === 'custom' && (
                <ConfigSection title={t('flows.editor.config.source_variable', { defaultValue: 'Source Variable' })} isDark={isDark}>
                    <input
                        type="text"
                        value={data.sourceVariable || ''}
                        onChange={(e) => updateData('sourceVariable', e.target.value)}
                        placeholder="{{myArray}}"
                        className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-purple-400'
                            : 'bg-white border-gray-200 text-purple-600'
                            }`}
                    />
                </ConfigSection>
            )}

            {/* Item Variable Name */}
            <ConfigSection title={t('flows.editor.config.item_variable', { defaultValue: 'Item Variable' })} isDark={isDark}>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono ${isDark ? 'text-cyan-500' : 'text-cyan-600'}`}>{'{{'}</span>
                    <input
                        type="text"
                        value={data.itemVariable || 'item'}
                        onChange={(e) => updateData('itemVariable', e.target.value)}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-cyan-400'
                            : 'bg-white border-gray-200 text-cyan-600'
                            }`}
                    />
                    <span className={`text-xs font-mono ${isDark ? 'text-cyan-500' : 'text-cyan-600'}`}>{'}}'}</span>
                </div>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('flows.editor.config.item_variable_hint', { defaultValue: 'Access current item:' })} <code className="text-cyan-400">{`{{${data.itemVariable || 'item'}.fieldName}}`}</code>
                </p>
            </ConfigSection>

            {/* Index Variable Name */}
            <ConfigSection title={t('flows.editor.config.index_variable', { defaultValue: 'Index Variable' })} isDark={isDark}>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono ${isDark ? 'text-cyan-500' : 'text-cyan-600'}`}>{'{{'}</span>
                    <input
                        type="text"
                        value={data.indexVariable || 'index'}
                        onChange={(e) => updateData('indexVariable', e.target.value)}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-cyan-400'
                            : 'bg-white border-gray-200 text-cyan-600'
                            }`}
                    />
                    <span className={`text-xs font-mono ${isDark ? 'text-cyan-500' : 'text-cyan-600'}`}>{'}}'}</span>
                </div>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('flows.editor.config.index_variable_hint', { defaultValue: 'Zero-based iteration counter' })}
                </p>
            </ConfigSection>
        </>
    );
}
