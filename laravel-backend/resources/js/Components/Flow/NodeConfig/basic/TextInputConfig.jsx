import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';
import { VariableInput } from '../../VariablePicker';

/**
 * TextInputConfig - Configuration for text_data nodes
 * Allows entering static text or using variables
 */
export function TextInputConfig({ data, updateData, isDark, upstreamVariables, loopContext }) {
    const { t } = useTranslation();

    return (
        <>
            <ConfigSection title={t('flows.editor.config.text_content')} isDark={isDark}>
                <VariableInput
                    value={data.textContent || ''}
                    onChange={(val) => updateData('textContent', val)}
                    placeholder={t('flows.editor.config.enter_text_placeholder')}
                    multiline
                    availableVariables={upstreamVariables}
                    loopContext={loopContext}
                />
            </ConfigSection>
            <ConfigSection title={t('flows.editor.config.output_variable')} isDark={isDark}>
                <input
                    type="text"
                    value={data.outputVariable || 'text'}
                    onChange={(e) => updateData('outputVariable', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-cyan-400'
                        : 'bg-white border-gray-200 text-cyan-600'
                        } focus:outline-none focus:ring-2 focus:ring-cyan-500/50`}
                />
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('flows.editor.config.access_via')}: {`{{${data.outputVariable || 'text'}}}`}
                </p>
            </ConfigSection>
        </>
    );
}
