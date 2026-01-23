import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';

/**
 * CustomActionConfig - Configuration for custom action nodes
 * Supports shell commands, ADB commands, JavaScript, and webhooks
 */
export function CustomActionConfig({ data, updateData, isDark, upstreamVariables }) {
    const { t } = useTranslation();
    return (
        <>
            <ConfigSection title={t('flows.editor.config.action_type')} isDark={isDark}>
                <select
                    value={data.actionType || 'shell'}
                    onChange={(e) => updateData('actionType', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                >
                    <option value="shell">{t('flows.editor.config.shell_command')}</option>
                    <option value="adb">{t('flows.editor.config.adb_command')}</option>
                    <option value="javascript">{t('flows.editor.config.javascript')}</option>
                    <option value="webhook">{t('flows.editor.config.webhook')}</option>
                </select>
            </ConfigSection>

            <ConfigSection title={t('flows.editor.config.command_code')} isDark={isDark}>
                <textarea
                    value={data.command || ''}
                    onChange={(e) => updateData('command', e.target.value)}
                    placeholder={
                        data.actionType === 'adb'
                            ? 'adb shell input tap 500 800'
                            : data.actionType === 'javascript'
                                ? 'return data.value * 2;'
                                : 'echo "Hello World"'
                    }
                    rows={4}
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
            </ConfigSection>

            {data.actionType === 'webhook' && (
                <ConfigSection title={t('flows.editor.config.webhook_url')} isDark={isDark}>
                    <input
                        type="text"
                        value={data.webhookUrl || ''}
                        onChange={(e) => updateData('webhookUrl', e.target.value)}
                        placeholder="https://api.example.com/hook"
                        className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                            }`}
                    />
                </ConfigSection>
            )}

            <ConfigSection title={t('flows.editor.config.output_variable')} isDark={isDark}>
                <input
                    type="text"
                    value={data.outputVariable || 'output'}
                    onChange={(e) => updateData('outputVariable', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-cyan-400'
                        : 'bg-white border-gray-200 text-cyan-600'
                        }`}
                />
            </ConfigSection>

            <ConfigSection title={t('flows.editor.config.timeout')} isDark={isDark}>
                <input
                    type="number"
                    min="1000"
                    max="60000"
                    value={data.timeout || 10000}
                    onChange={(e) => updateData('timeout', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
            </ConfigSection>

            <ConfigSection title={t('flows.editor.config.on_error')} isDark={isDark}>
                <select
                    value={data.onError || 'stop'}
                    onChange={(e) => updateData('onError', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                >
                    <option value="stop">{t('flows.editor.config.stop_workflow')}</option>
                    <option value="continue">{t('flows.editor.config.continue_workflow')}</option>
                    <option value="retry">{t('flows.editor.config.retry_workflow')}</option>
                </select>
            </ConfigSection>
        </>
    );
}

export default CustomActionConfig;
