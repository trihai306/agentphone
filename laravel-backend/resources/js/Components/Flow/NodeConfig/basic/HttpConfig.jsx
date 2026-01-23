import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';
import { VariableInput } from '../../VariablePicker';

/**
 * HttpConfig - Configuration for HTTP request nodes
 * Configures method, URL, headers, body, and output variable
 */
export function HttpConfig({ data, updateData, isDark, upstreamVariables, loopContext }) {
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    const methodColors = {
        GET: 'bg-emerald-500',
        POST: 'bg-blue-500',
        PUT: 'bg-amber-500',
        PATCH: 'bg-orange-500',
        DELETE: 'bg-red-500',
    };

    const { t } = useTranslation();

    return (
        <>
            <ConfigSection title={t('flows.editor.config.http_method')} isDark={isDark}>
                <div className="flex gap-1">
                    {methods.map(method => (
                        <button
                            key={method}
                            onClick={() => updateData('method', method)}
                            className={`px-2 py-1 text-xs font-bold rounded transition-all ${data.method === method
                                ? `${methodColors[method]} text-white`
                                : isDark
                                    ? 'bg-[#252525] text-gray-400 hover:bg-[#2a2a2a]'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {method}
                        </button>
                    ))}
                </div>
            </ConfigSection>

            <ConfigSection title={t('flows.editor.config.http_url')} isDark={isDark}>
                <VariableInput
                    value={data.url || ''}
                    onChange={(val) => updateData('url', val)}
                    placeholder="https://api.example.com/{{endpoint}}"
                    availableVariables={upstreamVariables}
                    loopContext={loopContext}
                />
            </ConfigSection>

            <ConfigSection title={t('flows.editor.config.http_headers')} isDark={isDark}>
                <textarea
                    value={data.headers || '{}'}
                    onChange={(e) => updateData('headers', e.target.value)}
                    rows={3}
                    placeholder='{"Authorization": "Bearer {{token}}"}'
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-mono resize-none ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
            </ConfigSection>

            {['POST', 'PUT', 'PATCH'].includes(data.method) && (
                <ConfigSection title={t('flows.editor.config.http_body')} isDark={isDark}>
                    <VariableInput
                        value={data.body || ''}
                        onChange={(val) => updateData('body', val)}
                        placeholder='{"name": "{{item.name}}"}'
                        multiline
                        availableVariables={upstreamVariables}
                        loopContext={loopContext}
                    />
                </ConfigSection>
            )}

            <ConfigSection title={t('flows.editor.config.output_variable')} isDark={isDark}>
                <input
                    type="text"
                    value={data.outputVariable || 'response'}
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
