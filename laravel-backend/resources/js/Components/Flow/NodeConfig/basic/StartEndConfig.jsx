import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';

/**
 * StartEndConfig - Configuration for workflow start (input) and end (output) nodes
 * Handles trigger types for start and completion status for end
 */
export function StartEndConfig({ data, updateData, isDark, nodeType }) {
    const { t } = useTranslation();
    return (
        <>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{nodeType === 'input' ? '▶️' : '🏁'}</span>
                    <div>
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {nodeType === 'input' ? t('flows.editor.config.workflow_start') : t('flows.editor.config.workflow_end')}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {nodeType === 'input'
                                ? t('flows.editor.config.start_desc')
                                : t('flows.editor.config.end_desc')}
                        </div>
                    </div>
                </div>
            </div>

            {nodeType === 'input' && (
                <>
                    <ConfigSection title={t('flows.editor.config.trigger_type')} isDark={isDark}>
                        <select
                            value={data.triggerType || 'manual'}
                            onChange={(e) => updateData('triggerType', e.target.value)}
                            className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                                ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                                : 'bg-white border-gray-200 text-gray-900'
                                }`}
                        >
                            <option value="manual">{t('flows.editor.config.trigger_manual')}</option>
                            <option value="scheduled">{t('flows.editor.config.trigger_scheduled')}</option>
                            <option value="api">{t('flows.editor.config.trigger_api')}</option>
                        </select>
                    </ConfigSection>

                    {data.triggerType === 'scheduled' && (
                        <ConfigSection title={t('flows.editor.config.schedule')} isDark={isDark}>
                            <input
                                type="text"
                                value={data.cronExpression || '0 9 * * *'}
                                onChange={(e) => updateData('cronExpression', e.target.value)}
                                placeholder={t('flows.editor.config.cron_placeholder')}
                                className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                                    ? 'bg-[#0f0f0f] border-[#2a2a2a] text-cyan-400'
                                    : 'bg-white border-gray-200 text-cyan-600'
                                    }`}
                            />
                            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('flows.editor.config.cron_desc')}
                            </p>
                        </ConfigSection>
                    )}
                </>
            )}

            {nodeType === 'output' && (
                <ConfigSection title={t('flows.editor.config.completion_status')} isDark={isDark}>
                    <select
                        value={data.status || 'success'}
                        onChange={(e) => updateData('status', e.target.value)}
                        className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                            }`}
                    >
                        <option value="success">{t('flows.editor.config.status_success')}</option>
                        <option value="failure">{t('flows.editor.config.status_failure')}</option>
                        <option value="conditional">{t('flows.editor.config.status_conditional')}</option>
                    </select>
                </ConfigSection>
            )}
        </>
    );
}

export default StartEndConfig;
