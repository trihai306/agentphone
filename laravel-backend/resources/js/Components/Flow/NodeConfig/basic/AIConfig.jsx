import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';
import { VariableInput } from '../../VariablePicker';

/**
 * AIConfig - Configuration for AI/LLM processing nodes
 * Configures model selection, prompt template, and output
 */
export function AIConfig({ data, updateData, isDark, upstreamVariables, loopContext }) {
    const { t } = useTranslation();

    return (
        <>
            <ConfigSection title={t('flows.editor.config.model')} isDark={isDark}>
                <select
                    value={data.model || 'gpt-4'}
                    onChange={(e) => updateData('model', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="claude-3">Claude 3</option>
                    <option value="gemini-pro">Gemini Pro</option>
                </select>
            </ConfigSection>

            <ConfigSection title={t('flows.editor.config.prompt_template')} isDark={isDark}>
                <VariableInput
                    value={data.prompt || ''}
                    onChange={(val) => updateData('prompt', val)}
                    placeholder={t('flows.editor.config.prompt_placeholder', { defaultValue: 'Analyze this data: {{item.content}}' })}
                    multiline
                    availableVariables={upstreamVariables}
                    loopContext={loopContext}
                />
            </ConfigSection>

            <ConfigSection title={t('flows.editor.config.output_variable')} isDark={isDark}>
                <input
                    type="text"
                    value={data.outputVariable || 'aiResult'}
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
