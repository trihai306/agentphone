import { useTranslation } from 'react-i18next';

/**
 * DataSourceConfig - Configuration for data source nodes
 * Displays collection info and schema (read-only preview)
 */
export function DataSourceConfig({ data, isDark }) {
    const { t } = useTranslation();

    return (
        <div className={`p-3 rounded-lg ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{data.collectionIcon || '📊'}</span>
                <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {data.collectionName || t('flows.editor.config.no_collection_selected', { defaultValue: 'No collection selected' })}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {data.recordCount || 0} {t('flows.editor.config.records', { defaultValue: 'records' })}
                    </p>
                </div>
            </div>
            {data.schema?.length > 0 && (
                <div className="mt-3 space-y-1">
                    <p className={`text-[10px] uppercase font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {t('flows.editor.config.output_fields', { defaultValue: 'Output Fields:' })}
                    </p>
                    {data.schema.slice(0, 5).map((field, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="text-cyan-400">•</span>
                            <span className={`font-mono ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                {field.name}
                            </span>
                            <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>
                                ({field.type})
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
