import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/Contexts/ThemeContext';
import { VariableInput } from './VariablePicker';
import ElementPickerModal from './ElementPickerModal';

/**
 * NodeConfigPanel - Smart configuration panel for workflow nodes
 * Slides in from right when a node is selected
 */
export default function NodeConfigPanel({
    node,
    onUpdateNode,
    onClose,
    upstreamVariables = [],
    loopContext = null,
    selectedDevice = null,
    userId = null,
    dataSourceNodes = [],
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { t } = useTranslation();

    if (!node) return null;

    const nodeType = node.type;
    const nodeData = node.data || {};

    // Update node data
    const updateData = (key, value) => {
        onUpdateNode(node.id, {
            ...node,
            data: { ...nodeData, [key]: value }
        });
    };

    // Batch update multiple fields at once (avoids closure stale state issues)
    const updateMultipleData = (updates) => {
        onUpdateNode(node.id, {
            ...node,
            data: { ...nodeData, ...updates }
        });
    };

    return (
        <div
            className={`fixed right-0 top-14 bottom-0 w-80 z-[60] overflow-hidden flex flex-col transition-transform duration-300 ${isDark ? 'bg-[#1a1a1a] border-l border-[#2a2a2a]' : 'bg-white border-l border-gray-200'}`}
            style={{ boxShadow: '-4px 0 20px rgba(0,0,0,0.1)' }}
        >
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                    <NodeTypeIcon type={nodeType} />
                    <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {t(`flows.editor.nodes.${nodeType}`, { defaultValue: getNodeTypeName(nodeType) })}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'}`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Common: Label */}
                <ConfigSection title={t('flows.editor.config.label')} isDark={isDark}>
                    <input
                        type="text"
                        value={nodeData.label || ''}
                        onChange={(e) => updateData('label', e.target.value)}
                        placeholder="Node name..."
                        className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                            } focus:outline-none focus:ring-2 focus:ring-cyan-500/50`}
                    />
                </ConfigSection>

                {/* Type-specific config */}
                {nodeType === 'text_data' && (
                    <TextInputConfig
                        data={nodeData}
                        updateData={updateData}
                        isDark={isDark}
                        upstreamVariables={upstreamVariables}
                        loopContext={loopContext}
                    />
                )}

                {nodeType === 'loop' && (
                    <LoopConfig
                        data={nodeData}
                        updateData={updateData}
                        isDark={isDark}
                        dataSourceNodes={dataSourceNodes}
                    />
                )}

                {nodeType === 'http' && (
                    <HttpConfig
                        data={nodeData}
                        updateData={updateData}
                        isDark={isDark}
                        upstreamVariables={upstreamVariables}
                        loopContext={loopContext}
                    />
                )}

                {nodeType === 'condition' && (
                    <ConditionConfig
                        data={nodeData}
                        updateData={updateData}
                        updateMultipleData={updateMultipleData}
                        isDark={isDark}
                        upstreamVariables={upstreamVariables}
                        selectedDevice={selectedDevice}
                        userId={userId}
                    />
                )}

                {nodeType === 'ai_process' && (
                    <AIConfig
                        data={nodeData}
                        updateData={updateData}
                        isDark={isDark}
                        upstreamVariables={upstreamVariables}
                        loopContext={loopContext}
                    />
                )}

                {nodeType === 'data_source' && (
                    <DataSourceConfig
                        data={nodeData}
                        isDark={isDark}
                    />
                )}

                {nodeType === 'wait' && (
                    <WaitConfig
                        data={nodeData}
                        updateData={updateData}
                        isDark={isDark}
                    />
                )}

                {/* Scroll-specific config */}
                {['scroll', 'scroll_up', 'scroll_down', 'scroll_left', 'scroll_right'].includes(nodeType) && (
                    <ScrollActionConfig
                        data={nodeData}
                        updateData={updateData}
                        isDark={isDark}
                    />
                )}

                {/* Open App config */}
                {nodeType === 'open_app' && (
                    <OpenAppActionConfig
                        data={nodeData}
                        updateData={updateData}
                        isDark={isDark}
                    />
                )}

                {/* Tap/Click/Text Input config */}
                {['tap', 'click', 'long_press', 'text_input', 'focus'].includes(nodeType) && (
                    <TapActionConfig
                        data={nodeData}
                        updateData={updateData}
                        updateMultipleData={updateMultipleData}
                        isDark={isDark}
                        nodeType={nodeType}
                        selectedDevice={selectedDevice}
                        userId={userId}
                        dataSourceNodes={dataSourceNodes}
                    />
                )}

                {/* Back/Home key config */}
                {['back', 'home', 'key_event'].includes(nodeType) && (
                    <KeyActionConfig
                        data={nodeData}
                        updateData={updateData}
                        isDark={isDark}
                        nodeType={nodeType}
                    />
                )}

                {/* Swipe config */}
                {nodeType === 'swipe' && (
                    <SwipeActionConfig
                        data={nodeData}
                        updateData={updateData}
                        isDark={isDark}
                    />
                )}

                {/* Assert config */}
                {nodeType === 'assert' && (
                    <AssertConfig
                        data={nodeData}
                        updateData={updateData}
                        updateMultipleData={updateMultipleData}
                        isDark={isDark}
                        selectedDevice={selectedDevice}
                        userId={userId}
                    />
                )}

                {/* Element Check config */}
                {nodeType === 'element_check' && (
                    <ElementCheckConfig
                        data={nodeData}
                        updateData={updateData}
                        updateMultipleData={updateMultipleData}
                        isDark={isDark}
                        selectedDevice={selectedDevice}
                        userId={userId}
                    />
                )}

                {/* Wait For Element config */}
                {nodeType === 'wait_for_element' && (
                    <WaitForElementConfig
                        data={nodeData}
                        updateData={updateData}
                        updateMultipleData={updateMultipleData}
                        isDark={isDark}
                        selectedDevice={selectedDevice}
                        userId={userId}
                    />
                )}

                {/* Start/End config */}
                {['input', 'output'].includes(nodeType) && (
                    <StartEndConfig
                        data={nodeData}
                        updateData={updateData}
                        isDark={isDark}
                        nodeType={nodeType}
                    />
                )}

                {/* File Input config */}
                {nodeType === 'file_input' && (
                    <FileInputConfig
                        data={nodeData}
                        updateData={updateData}
                        isDark={isDark}
                    />
                )}

                {/* Process config */}
                {nodeType === 'process' && (
                    <ProcessConfig
                        data={nodeData}
                        updateData={updateData}
                        isDark={isDark}
                        upstreamVariables={upstreamVariables}
                    />
                )}

                {/* Custom Action config */}
                {nodeType === 'custom' && (
                    <CustomActionConfig
                        data={nodeData}
                        updateData={updateData}
                        isDark={isDark}
                        upstreamVariables={upstreamVariables}
                    />
                )}

                {/* Universal: Error Handling Options */}
                {!['input', 'output', 'start', 'end', 'condition', 'loop', 'data_source'].includes(nodeType) && (
                    <ConfigSection title={t('flows.editor.config.error_handling', { defaultValue: 'Error Handling' })} isDark={isDark}>
                        <div className="space-y-2">
                            {[
                                {
                                    value: 'stop',
                                    icon: '🛑',
                                    label: t('flows.editor.config.stop_workflow', { defaultValue: 'Stop Workflow' }),
                                    desc: t('flows.editor.config.stop_workflow_desc', { defaultValue: 'Stop immediately if this action fails' }),
                                    color: 'red'
                                },
                                {
                                    value: 'continue',
                                    icon: '⏭️',
                                    label: t('flows.editor.config.skip_continue', { defaultValue: 'Skip & Continue' }),
                                    desc: t('flows.editor.config.skip_continue_desc', { defaultValue: 'Skip this action and continue workflow' }),
                                    color: 'amber'
                                },
                                {
                                    value: 'retry',
                                    icon: '🔄',
                                    label: t('flows.editor.config.retry_action', { defaultValue: 'Retry Action' }),
                                    desc: t('flows.editor.config.retry_action_desc', { defaultValue: 'Retry up to 3 times before failing' }),
                                    color: 'blue'
                                },
                            ].map(option => {
                                const currentValue = nodeData.onError || 'stop';
                                const isSelected = currentValue === option.value;
                                const colorMap = {
                                    red: { bg: 'bg-red-500/10', border: 'border-red-500/50', text: 'text-red-500' },
                                    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/50', text: 'text-amber-500' },
                                    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/50', text: 'text-blue-500' },
                                };
                                const colors = colorMap[option.color];

                                return (
                                    <label
                                        key={option.value}
                                        className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isSelected
                                            ? `${colors.bg} ${colors.border}`
                                            : isDark
                                                ? 'bg-[#0f0f0f] border-[#2a2a2a] hover:border-[#3a3a3a]'
                                                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`errorHandling-${node.id}`}
                                            value={option.value}
                                            checked={isSelected}
                                            onChange={() => {
                                                updateData('onError', option.value);
                                                // Also set continueOnError for backward compatibility
                                                updateData('continueOnError', option.value === 'continue');
                                            }}
                                            className="sr-only"
                                        />
                                        <span className="text-xl mt-0.5">{option.icon}</span>
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${isSelected ? colors.text : isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {option.label}
                                            </p>
                                            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {option.desc}
                                            </p>
                                        </div>
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected
                                            ? colors.border
                                            : isDark ? 'border-[#3a3a3a]' : 'border-gray-300'
                                            }`}>
                                            {isSelected && (
                                                <div className={`w-2 h-2 rounded-full ${option.color === 'red' ? 'bg-red-500' :
                                                    option.color === 'amber' ? 'bg-amber-500' : 'bg-blue-500'
                                                    }`} />
                                            )}
                                        </div>
                                    </label>
                                );
                            })}
                        </div>

                        {/* Retry attempts config */}
                        {(nodeData.onError === 'retry') && (
                            <div className="mt-3 pt-3 border-t border-dashed" style={{ borderColor: isDark ? '#2a2a2a' : '#e5e7eb' }}>
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {t('flows.editor.config.retry_attempts', { defaultValue: 'Retry Attempts' })}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 5].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => updateData('retryAttempts', n)}
                                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${(nodeData.retryAttempts || 3) === n
                                                    ? 'bg-blue-500 text-white'
                                                    : isDark
                                                        ? 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {n}×
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </ConfigSection>
                )}
            </div>

            {/* Footer: Node ID */}
            <div className={`px-4 py-2 border-t text-[10px] font-mono ${isDark ? 'border-[#2a2a2a] text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                ID: {node.id}
            </div>
        </div>
    );
}

// ============================================
// Config Sections for Different Node Types
// ============================================

function ConfigSection({ title, children, isDark }) {
    return (
        <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {title}
            </label>
            {children}
        </div>
    );
}

function TextInputConfig({ data, updateData, isDark, upstreamVariables, loopContext }) {
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

function LoopConfig({ data, updateData, isDark, dataSourceNodes = [] }) {
    const { t } = useTranslation();

    // Map source to dataSource for backend compatibility
    const currentSource = data.dataSource || data.source || 'fixed';

    const handleSourceChange = (source) => {
        // Update both for backward compatibility
        updateData('source', source);
        // Map to backend-expected values
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

    // Find current selected data source
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

            {/* Data Source Mode: Picker Dropdown */}
            {(currentSource === 'data') && (
                <>
                    {/* Data Source Picker */}
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

                    {/* Selected Data Source Preview */}
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

                    {/* Manual Source Variable (fallback/advanced) */}
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

            {/* Item Variable Name - Always visible */}
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

function HttpConfig({ data, updateData, isDark, upstreamVariables, loopContext }) {
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

function ConditionConfig({ data, updateData, updateMultipleData, isDark, upstreamVariables, selectedDevice, userId }) {
    const [showPicker, setShowPicker] = useState(false);
    const { t } = useTranslation();

    const conditionType = data.conditionType || 'variable'; // 'variable' or 'element'

    const variableOperators = [
        { value: '==', label: 'equals' },
        { value: '!=', label: 'not equals' },
        { value: '>', label: 'greater than' },
        { value: '<', label: 'less than' },
        { value: '>=', label: 'greater or equal' },
        { value: '<=', label: 'less or equal' },
        { value: 'contains', label: 'contains' },
        { value: 'startsWith', label: 'starts with' },
        { value: 'endsWith', label: 'ends with' },
    ];

    const elementOperators = [
        { value: 'exists', label: t('flows.editor.config.element_exists'), desc: t('flows.editor.config.element_exists_desc') },
        { value: 'not_exists', label: t('flows.editor.config.element_not_exists'), desc: t('flows.editor.config.element_not_exists_desc') },
        { value: 'text_equals', label: t('flows.editor.config.text_equals'), desc: t('flows.editor.config.text_equals_desc') },
        { value: 'text_contains', label: t('flows.editor.config.text_contains'), desc: t('flows.editor.config.text_contains_desc') },
    ];

    const handleElementSelect = (element) => {
        console.log('🎯 ConditionConfig handleElementSelect:', element);

        // Calculate center from bounds for potential coordinate-based actions
        let centerX, centerY;
        if (element.bounds) {
            const b = element.bounds;
            centerX = Math.round((b.left + b.right) / 2);
            centerY = Math.round((b.top + b.bottom) / 2);
        }

        updateMultipleData({
            resourceId: element.resourceId,
            targetSelector: element.resourceId || element.contentDescription || element.text,
            text: element.text,
            contentDescription: element.contentDescription,
            className: element.className,
            bounds: element.bounds,
            x: centerX,
            y: centerY,
            isClickable: element.isClickable ?? false,
            isEditable: element.isEditable ?? false,
            isScrollable: element.isScrollable ?? false,
            packageName: element.packageName,
        });
        setShowPicker(false);
    };

    return (
        <>
            {/* Condition Type Selector */}
            <ConfigSection title={t('flows.editor.config.condition_type')} isDark={isDark}>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => updateData('conditionType', 'variable')}
                        className={`px-3 py-2.5 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all ${conditionType === 'variable'
                            ? isDark
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                                : 'bg-cyan-50 text-cyan-600 border border-cyan-200'
                            : isDark
                                ? 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:border-cyan-500/30'
                                : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-cyan-200'
                            }`}
                    >
                        <span className="text-lg">📊</span>
                        <span>{t('flows.editor.config.variable')}</span>
                    </button>
                    <button
                        onClick={() => updateData('conditionType', 'element')}
                        className={`px-3 py-2.5 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all ${conditionType === 'element'
                            ? isDark
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : isDark
                                ? 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:border-emerald-500/30'
                                : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-emerald-200'
                            }`}
                    >
                        <span className="text-lg">📱</span>
                        <span>{t('flows.editor.config.element')}</span>
                    </button>
                </div>
            </ConfigSection>

            {/* Variable Condition Mode */}
            {conditionType === 'variable' && (
                <>
                    <ConfigSection title={t('flows.editor.config.left_value')} isDark={isDark}>
                        <VariableInput
                            value={data.leftValue || ''}
                            onChange={(val) => updateData('leftValue', val)}
                            placeholder="{{item.status}}"
                            availableVariables={upstreamVariables}
                        />
                    </ConfigSection>

                    <ConfigSection title={t('flows.editor.config.operator')} isDark={isDark}>
                        <select
                            value={data.operator || '=='}
                            onChange={(e) => updateData('operator', e.target.value)}
                            className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                                ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                                : 'bg-white border-gray-200 text-gray-900'
                                }`}
                        >
                            {variableOperators.map(op => (
                                <option key={op.value} value={op.value}>{op.label}</option>
                            ))}
                        </select>
                    </ConfigSection>

                    <ConfigSection title={t('flows.editor.config.right_value')} isDark={isDark}>
                        <VariableInput
                            value={data.rightValue || ''}
                            onChange={(val) => updateData('rightValue', val)}
                            placeholder="active"
                            availableVariables={upstreamVariables}
                        />
                    </ConfigSection>
                </>
            )}

            {/* Element Condition Mode */}
            {conditionType === 'element' && (
                <>
                    {/* Element Picker Button */}
                    <ConfigSection title={t('flows.editor.config.target_element')} isDark={isDark}>
                        <button
                            onClick={() => setShowPicker(true)}
                            className={`w-full px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${isDark
                                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-400 border border-emerald-500/30'
                                : 'bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-600 border border-emerald-200'
                                }`}
                        >
                            <span>📱</span>
                            Chọn Element từ Thiết bị
                        </button>
                        <p className={`text-[10px] mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Click để scan màn hình và chọn element cần kiểm tra
                        </p>
                    </ConfigSection>

                    {/* Selected Element Display */}
                    {(data.resourceId || data.text) && (
                        <ConfigSection title={t('flows.editor.config.element_selected')} isDark={isDark}>
                            <div className={`p-3 rounded-lg text-xs space-y-1 ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                                {data.resourceId && (
                                    <div className="flex items-center gap-2">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>ID:</span>
                                        <span className={`font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{data.resourceId}</span>
                                    </div>
                                )}
                                {data.text && (
                                    <div className="flex items-center gap-2">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Text:</span>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>"{data.text}"</span>
                                    </div>
                                )}
                                {data.className && (
                                    <div className="flex items-center gap-2">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Type:</span>
                                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{data.className.split('.').pop()}</span>
                                    </div>
                                )}
                            </div>
                        </ConfigSection>
                    )}

                    {/* Element Check Operator */}
                    <ConfigSection title={t('flows.editor.config.check_type')} isDark={isDark}>
                        <div className="space-y-2">
                            {elementOperators.map(op => (
                                <label
                                    key={op.value}
                                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${data.elementOperator === op.value
                                        ? isDark
                                            ? 'bg-emerald-500/20 border border-emerald-500/50'
                                            : 'bg-emerald-50 border border-emerald-200'
                                        : isDark
                                            ? 'bg-[#1a1a1a] border border-[#2a2a2a] hover:border-emerald-500/30'
                                            : 'bg-gray-50 border border-gray-200 hover:border-emerald-200'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="elementOperator"
                                        value={op.value}
                                        checked={data.elementOperator === op.value}
                                        onChange={(e) => updateData('elementOperator', e.target.value)}
                                        className="mt-0.5"
                                    />
                                    <div className="flex-1">
                                        <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {op.label}
                                        </div>
                                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {op.desc}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </ConfigSection>

                    {/* Expected Value for text checks */}
                    {(data.elementOperator === 'text_equals' || data.elementOperator === 'text_contains') && (
                        <ConfigSection title={t('flows.editor.config.expected_value')} isDark={isDark}>
                            <VariableInput
                                value={data.expectedValue || ''}
                                onChange={(val) => updateData('expectedValue', val)}
                                placeholder="Expected text..."
                                availableVariables={upstreamVariables}
                            />
                        </ConfigSection>
                    )}

                    {/* Timeout */}
                    <ConfigSection title={t('flows.editor.config.timeout')} isDark={isDark}>
                        <input
                            type="number"
                            value={data.timeout || 5000}
                            onChange={(e) => updateData('timeout', parseInt(e.target.value) || 5000)}
                            min={1000}
                            max={30000}
                            step={1000}
                            className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                                ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                                : 'bg-white border-gray-200 text-gray-900'
                                }`}
                        />
                        <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Thời gian tối đa để đợi element
                        </p>
                    </ConfigSection>
                </>
            )}

            {/* Element Picker Modal */}
            {showPicker && (
                <ElementPickerModal
                    isOpen={showPicker}
                    onClose={() => setShowPicker(false)}
                    onSelect={handleElementSelect}
                    deviceId={selectedDevice?.device_id}
                    userId={userId}
                />
            )}
        </>
    );
}

function AIConfig({ data, updateData, isDark, upstreamVariables, loopContext }) {
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
                    placeholder="Analyze this data: {{item.content}}"
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

function DataSourceConfig({ data, isDark }) {
    return (
        <div className={`p-3 rounded-lg ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{data.collectionIcon || '📊'}</span>
                <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {data.collectionName || 'No collection selected'}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {data.recordCount || 0} records
                    </p>
                </div>
            </div>
            {data.schema?.length > 0 && (
                <div className="mt-3 space-y-1">
                    <p className={`text-[10px] uppercase font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Output Fields:
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

function WaitConfig({ data, updateData, isDark }) {
    const { t } = useTranslation();
    const durationMs = data.duration || 1000; // Default 1000ms = 1s

    return (
        <>
            <ConfigSection title={t('flows.editor.config.duration') + ' (ms)'} isDark={isDark}>
                <div className="space-y-2">
                    <input
                        type="number"
                        min="0"
                        max="86400000"
                        step="100"
                        value={durationMs}
                        onChange={(e) => updateData('duration', parseInt(e.target.value) || 1000)}
                        className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                            }`}
                    />
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        = {(durationMs / 1000).toFixed(1)} giây
                    </p>
                </div>
            </ConfigSection>
            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {t('flows.editor.config.quick_set')}:
                <div className="flex gap-2 mt-1 flex-wrap">
                    {[
                        { label: '0.5s', ms: 500 },
                        { label: '1s', ms: 1000 },
                        { label: '2s', ms: 2000 },
                        { label: '5s', ms: 5000 },
                        { label: '10s', ms: 10000 },
                        { label: '30s', ms: 30000 },
                        { label: '60s', ms: 60000 },
                    ].map(opt => (
                        <button
                            key={opt.ms}
                            onClick={() => updateData('duration', opt.ms)}
                            className={`px-2 py-1 rounded text-xs transition-all ${durationMs === opt.ms
                                ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500'
                                : isDark
                                    ? 'bg-[#252525] hover:bg-[#2a2a2a]'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}

// ============================================
// Helper Functions
// ============================================

function getNodeTypeName(type) {
    const names = {
        text_data: 'Text Input',
        loop: 'Loop',
        condition: 'Condition',
        http: 'HTTP Request',
        ai_process: 'AI Process',
        data_source: 'Data Source',
        wait: 'Wait/Delay',
        input: 'Start',
        output: 'End',
        click: 'Click Action',
        scroll: 'Scroll',
        swipe: 'Swipe',
    };
    return names[type] || type;
}

function NodeTypeIcon({ type }) {
    const colors = {
        text_data: '#a855f7',
        loop: '#6366f1',
        condition: '#f97316',
        http: '#f97316',
        ai_process: '#ec4899',
        data_source: '#f59e0b',
        wait: '#6b7280',
        input: '#10b981',
        output: '#ef4444',
    };

    return (
        <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ backgroundColor: `${colors[type] || '#6b7280'}20` }}
        >
            <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colors[type] || '#6b7280' }}
            />
        </div>
    );
}

// ============================================
// Action-specific Config Components
// ============================================

function ScrollActionConfig({ data, updateData, isDark }) {
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
        { value: 'up', icon: '↑', label: t('flows.editor.scroll.up', { defaultValue: 'Up' }), color: '#22c55e', desc: 'Scroll content down' },
        { value: 'down', icon: '↓', label: t('flows.editor.scroll.down', { defaultValue: 'Down' }), color: '#3b82f6', desc: 'Scroll content up' },
        { value: 'left', icon: '←', label: t('flows.editor.scroll.left', { defaultValue: 'Left' }), color: '#a855f7', desc: 'Scroll content right' },
        { value: 'right', icon: '→', label: t('flows.editor.scroll.right', { defaultValue: 'Right' }), color: '#f59e0b', desc: 'Scroll content left' },
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

function OpenAppActionConfig({ data, updateData, isDark }) {
    return (
        <>
            <ConfigSection title="Package Name" isDark={isDark}>
                <input
                    type="text"
                    value={data.packageName || data.package_name || ''}
                    onChange={(e) => updateData('packageName', e.target.value)}
                    placeholder="com.example.app"
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-emerald-400'
                        : 'bg-white border-gray-200 text-emerald-600'
                        }`}
                />
            </ConfigSection>

            <ConfigSection title="Quick Select" isDark={isDark}>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { name: 'Facebook', pkg: 'com.facebook.katana', icon: '📘' },
                        { name: 'Instagram', pkg: 'com.instagram.android', icon: '📷' },
                        { name: 'TikTok', pkg: 'com.zhiliaoapp.musically', icon: '🎵' },
                        { name: 'YouTube', pkg: 'com.google.android.youtube', icon: '🎬' },
                    ].map(app => (
                        <button
                            key={app.pkg}
                            onClick={() => updateData('packageName', app.pkg)}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all ${isDark
                                ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-300'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                }`}
                        >
                            <span>{app.icon}</span>
                            <span>{app.name}</span>
                        </button>
                    ))}
                </div>
            </ConfigSection>

            <ConfigSection title="Startup Wait (ms)" isDark={isDark}>
                <input
                    type="number"
                    min="1000"
                    max="30000"
                    step="1000"
                    value={data.timeout || 4000}
                    onChange={(e) => updateData('timeout', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
                <div className="flex gap-1 mt-1">
                    {[2000, 4000, 6000, 10000].map(ms => (
                        <button
                            key={ms}
                            onClick={() => updateData('timeout', ms)}
                            className={`px-2 py-0.5 rounded text-[10px] ${isDark ? 'bg-[#252525] hover:bg-[#2a2a2a] text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                        >
                            {ms / 1000}s
                        </button>
                    ))}
                </div>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Wait for app to fully load
                </p>
            </ConfigSection>
        </>
    );
}

function TapActionConfig({ data, updateData, updateMultipleData, isDark, nodeType, selectedDevice, userId, dataSourceNodes = [] }) {
    const [showPicker, setShowPicker] = useState(false);
    const { t } = useTranslation();
    const selectorPriority = data.selectorPriority || 'auto';

    // Debug: log data to see what we have
    console.log('[NodeConfigPanel] TapActionConfig data:', data);

    const screenshotUrl = data.screenshotUrl || data.screenshot_url;

    // Handler for element selection from picker
    const handleElementSelect = (element) => {
        console.log('🎯 TapActionConfig handleElementSelect called:', element);
        console.log('🔑 resourceId:', element.resourceId);
        console.log('📝 text:', element.text);
        console.log('📦 bounds:', element.bounds);

        // Calculate center coordinates from bounds if not directly provided
        let centerX = element.centerX || element.x;
        let centerY = element.centerY || element.y;

        // If still no coordinates but bounds available, calculate from bounds
        if ((!centerX || !centerY) && element.bounds) {
            const b = element.bounds;
            if (b.left !== undefined && b.right !== undefined) {
                centerX = Math.round((b.left + b.right) / 2);
            }
            if (b.top !== undefined && b.bottom !== undefined) {
                centerY = Math.round((b.top + b.bottom) / 2);
            }
        }

        console.log('📍 Calculated center:', centerX, centerY);

        // Use batch update to avoid closure stale state issue
        updateMultipleData({
            resourceId: element.resourceId,
            resource_id: element.resourceId,
            text: element.text,
            contentDescription: element.contentDescription,
            className: element.className,
            x: centerX,
            y: centerY,
            bounds: element.bounds,
            isClickable: element.isClickable ?? false,
            isEditable: element.isEditable ?? false,
            isScrollable: element.isScrollable ?? false,
            isCheckable: element.isCheckable ?? false,
            isFocusable: element.isFocusable ?? false,
            packageName: element.packageName || data.packageName,
        });

        setShowPicker(false);
        console.log('✅ Element selection complete, modal closed');
    };

    return (
        <>
            {/* Screenshot Preview with Tap Indicator */}
            {screenshotUrl && (
                <ConfigSection title="Interaction Screenshot" isDark={isDark}>
                    <div className="relative w-full rounded-lg overflow-hidden border border-gray-500/20"
                        style={{ aspectRatio: '9/19.5' }}>
                        <img
                            src={screenshotUrl}
                            alt="Tap screenshot"
                            className="w-full h-full object-cover"
                        />
                        {/* Tap Position Indicator */}
                        {(data.x || data.coordinates?.x) && (data.y || data.coordinates?.y) && (
                            <div
                                className="absolute w-8 h-8 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                style={{
                                    left: `${((data.x || data.coordinates?.x) / 1080) * 100}%`,
                                    top: `${((data.y || data.coordinates?.y) / 2400) * 100}%`,
                                }}
                            >
                                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
                                <div className="absolute inset-1 bg-red-500 rounded-full border-2 border-white shadow-lg" />
                            </div>
                        )}
                    </div>
                    {/* Coordinates display below image */}
                    <div className={`flex justify-center gap-4 mt-2 text-[10px] font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <span>X: {data.x || data.coordinates?.x || 0}</span>
                        <span>Y: {data.y || data.coordinates?.y || 0}</span>
                    </div>
                </ConfigSection>
            )}

            {/* Element Picker Button */}
            <ConfigSection title="🔍 Element Inspector" isDark={isDark}>
                <button
                    onClick={() => setShowPicker(true)}
                    className={`w-full px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${isDark
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-400 border border-cyan-500/30'
                        : 'bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 text-cyan-600 border border-cyan-200'
                        }`}
                >
                    <span>📱</span>
                    Chọn Element từ Thiết bị
                </button>
                <p className={`text-[10px] mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Click để scan màn hình và chọn element cần tương tác
                </p>
            </ConfigSection>

            <ConfigSection title="Element Selector" isDark={isDark}>
                <div className="space-y-2">
                    {[
                        { value: 'auto', label: 'Auto (Smart)', desc: 'ID → Text → Coords' },
                        { value: 'id', label: 'Resource ID', desc: 'Most reliable' },
                        { value: 'text', label: 'Text Content', desc: 'Flexible' },
                        { value: 'coords', label: 'Coordinates', desc: 'Fallback only' },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => updateData('selectorPriority', opt.value)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-all border ${selectorPriority === opt.value
                                ? 'border-cyan-500 bg-cyan-500/10'
                                : isDark
                                    ? 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <span className={isDark ? 'text-white' : 'text-gray-900'}>{opt.label}</span>
                            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{opt.desc}</span>
                        </button>
                    ))}
                </div>
            </ConfigSection>

            {/* Comprehensive Element Details */}
            <ConfigSection title="Element Details" isDark={isDark}>
                <div className={`rounded-lg overflow-hidden border ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                    {/* ID Section */}
                    {(data.resourceId || data.resource_id) && (
                        <div className={`px-3 py-2 border-b ${isDark ? 'border-[#2a2a2a] bg-[#0f0f0f]' : 'border-gray-100 bg-gray-50'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-cyan-500 text-[10px] font-bold">ID</span>
                            </div>
                            <code className={`text-xs break-all ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {data.resourceId || data.resource_id}
                            </code>
                        </div>
                    )}

                    {/* Text Section - EDITABLE */}
                    <div className={`px-3 py-2 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-purple-500 text-[10px] font-bold">TEXT (Editable)</span>
                            <span className={`text-[9px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                Hỗ trợ {'{{'} biến {'}}'}
                            </span>
                        </div>
                        <input
                            type="text"
                            value={data.text || ''}
                            onChange={(e) => updateData('text', e.target.value)}
                            placeholder="Nhập text để tìm element..."
                            className={`w-full px-2 py-1.5 text-xs rounded border ${isDark
                                ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600'
                                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                } focus:ring-1 focus:ring-purple-500 focus:border-purple-500`}
                        />
                    </div>

                    {/* Content Description Section - EDITABLE */}
                    <div className={`px-3 py-2 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-green-500 text-[10px] font-bold">CONTENT DESC (Editable)</span>
                            <span className={`text-[9px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                Hỗ trợ {'{{'} biến {'}}'}
                            </span>
                        </div>
                        <input
                            type="text"
                            value={data.contentDescription || ''}
                            onChange={(e) => updateData('contentDescription', e.target.value)}
                            placeholder="Nhập content description..."
                            className={`w-full px-2 py-1.5 text-xs rounded border ${isDark
                                ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600'
                                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                } focus:ring-1 focus:ring-green-500 focus:border-green-500`}
                        />
                    </div>

                    {/* Class Name Section */}
                    {(data.className || data.class_name) && (
                        <div className={`px-3 py-2 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-orange-500 text-[10px] font-bold">CLASS</span>
                            </div>
                            <code className={`text-xs break-all ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {data.className || data.class_name}
                            </code>
                        </div>
                    )}

                    {/* Package Name Section */}
                    {(data.packageName || data.package_name) && (
                        <div className={`px-3 py-2 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-blue-500 text-[10px] font-bold">PACKAGE</span>
                            </div>
                            <code className={`text-xs break-all ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {data.packageName || data.package_name}
                            </code>
                        </div>
                    )}

                    {/* Bounds Section */}
                    {data.bounds && (
                        <div className={`px-3 py-2 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-pink-500 text-[10px] font-bold">BOUNDS</span>
                            </div>
                            <code className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {typeof data.bounds === 'object' && data.bounds !== null
                                    ? `${data.bounds.width ?? 0}×${data.bounds.height ?? 0} @ (${data.bounds.left ?? 0}, ${data.bounds.top ?? 0})`
                                    : typeof data.bounds === 'string' ? data.bounds : 'N/A'}
                            </code>
                        </div>
                    )}

                    {/* Coordinates Section */}
                    {(data.x || data.coordinates?.x) && (
                        <div className={`px-3 py-2 ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-amber-500 text-[10px] font-bold">COORDINATES</span>
                            </div>
                            <div className="flex gap-4 text-xs font-mono">
                                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                    X: <span className="text-amber-400">{data.x || data.coordinates?.x}</span>
                                </span>
                                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                    Y: <span className="text-amber-400">{data.y || data.coordinates?.y}</span>
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Element Flags */}
                    {(data.isClickable !== undefined || data.isEditable !== undefined || data.isScrollable !== undefined || data.isCheckable !== undefined) && (
                        <div className={`px-3 py-2 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[10px] font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>FLAGS</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {data.isClickable && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                                        clickable
                                    </span>
                                )}
                                {data.isEditable && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                                        editable
                                    </span>
                                )}
                                {data.isScrollable && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                                        scrollable
                                    </span>
                                )}
                                {data.isCheckable && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                                        checkable
                                    </span>
                                )}
                                {data.isFocusable && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>
                                        focusable
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* No data case */}
                    {!data.resourceId && !data.resource_id && !data.text && !data.contentDescription && !data.x && !data.coordinates?.x && (
                        <div className={`px-3 py-4 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <p className="text-xs">No element data recorded</p>
                        </div>
                    )}
                </div>
            </ConfigSection>

            {nodeType === 'text_input' && (
                <ConfigSection title="Input Text" isDark={isDark}>
                    <input
                        type="text"
                        value={data.inputText || data.text || ''}
                        onChange={(e) => updateData('inputText', e.target.value)}
                        placeholder="Text to type or {{variable}}..."
                        className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                            }`}
                    />

                    {/* Variable Picker - Show available fields from connected data source */}
                    {data.dataSourceNodeId && (() => {
                        const connectedSource = dataSourceNodes.find(n => n.id === data.dataSourceNodeId);
                        const schema = connectedSource?.data?.schema || [];
                        const outputName = connectedSource?.data?.outputName ||
                            connectedSource?.data?.collectionName?.toLowerCase().replace(/\s+/g, '_') || 'data';

                        if (schema.length === 0) return null;

                        return (
                            <div className="mt-2">
                                <p className={`text-[10px] mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    📊 Chọn field từ <span className="text-amber-400 font-medium">{connectedSource?.data?.collectionName || 'Data Source'}</span>:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {schema.map((field, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => updateData('inputText', `{{item.${field.name}}}`)}
                                            className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${isDark
                                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                                                }`}
                                        >
                                            {field.name}
                                        </button>
                                    ))}
                                </div>
                                <p className={`text-[9px] mt-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                    💡 Click để chèn biến vào ô nhập liệu
                                </p>
                            </div>
                        );
                    })()}

                    {/* Hint when no data source connected */}
                    {!data.dataSourceNodeId && (
                        <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            💡 Kết nối Data Source để chọn field từ dropdown
                        </p>
                    )}
                </ConfigSection>
            )}

            <ConfigSection title="Wait After (ms)" isDark={isDark}>
                <input
                    type="number"
                    min="100"
                    max="30000"
                    step="100"
                    value={data.timeout || 500}
                    onChange={(e) => updateData('timeout', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
                <div className="flex gap-1 mt-1">
                    {[300, 500, 1000, 2000].map(ms => (
                        <button
                            key={ms}
                            onClick={() => updateData('timeout', ms)}
                            className={`px-2 py-0.5 rounded text-[10px] ${isDark ? 'bg-[#252525] hover:bg-[#2a2a2a] text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                        >
                            {ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
                        </button>
                    ))}
                </div>
            </ConfigSection>

            {/* Smart Matching Toggle */}
            <ConfigSection title="Smart Matching" isDark={isDark}>
                <div className="space-y-3">
                    {/* Fuzzy Match Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Fuzzy Matching
                            </p>
                            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Allow partial text/description matches
                            </p>
                        </div>
                        <button
                            onClick={() => updateData('fuzzyMatch', !data.fuzzyMatch)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${data.fuzzyMatch ? 'bg-cyan-500' : isDark ? 'bg-[#2a2a2a]' : 'bg-gray-300'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${data.fuzzyMatch ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>

                    {/* Case Insensitive Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Ignore Case
                            </p>
                            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Case-insensitive text matching
                            </p>
                        </div>
                        <button
                            onClick={() => updateData('ignoreCase', !data.ignoreCase)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${data.ignoreCase !== false ? 'bg-cyan-500' : isDark ? 'bg-[#2a2a2a]' : 'bg-gray-300'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${data.ignoreCase !== false ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>
                </div>
            </ConfigSection>

            {/* Element Picker Modal */}
            <ElementPickerModal
                isOpen={showPicker}
                onClose={() => setShowPicker(false)}
                onSelect={handleElementSelect}
                deviceId={selectedDevice?.device_id}
                userId={userId}
                elementType={nodeType === 'text_input' ? 'editable' : 'clickable'}
            />
        </>
    );
}

function KeyActionConfig({ data, updateData, isDark, nodeType }) {
    const { t } = useTranslation();

    // Available hardware keys with icons and categories
    const keyGroups = [
        {
            label: 'Navigation',
            keys: [
                { value: 'KEYCODE_BACK', label: 'Back', icon: '←', desc: 'Go back' },
                { value: 'KEYCODE_HOME', label: 'Home', icon: '🏠', desc: 'Go to home screen' },
                { value: 'KEYCODE_APP_SWITCH', label: 'Recent Apps', icon: '📑', desc: 'Show recent apps' },
                { value: 'KEYCODE_MENU', label: 'Menu', icon: '☰', desc: 'Open menu' },
            ]
        },
        {
            label: 'Input',
            keys: [
                { value: 'KEYCODE_ENTER', label: 'Enter', icon: '⏎', desc: 'Submit/Confirm' },
                { value: 'KEYCODE_DEL', label: 'Delete', icon: '⌫', desc: 'Delete character' },
                { value: 'KEYCODE_SPACE', label: 'Space', icon: '␣', desc: 'Space character' },
                { value: 'KEYCODE_TAB', label: 'Tab', icon: '⇥', desc: 'Tab key' },
                { value: 'KEYCODE_ESCAPE', label: 'Escape', icon: 'Esc', desc: 'Escape/Cancel' },
            ]
        },
        {
            label: 'D-Pad',
            keys: [
                { value: 'KEYCODE_DPAD_UP', label: 'Up', icon: '↑', desc: 'Navigate up' },
                { value: 'KEYCODE_DPAD_DOWN', label: 'Down', icon: '↓', desc: 'Navigate down' },
                { value: 'KEYCODE_DPAD_LEFT', label: 'Left', icon: '←', desc: 'Navigate left' },
                { value: 'KEYCODE_DPAD_RIGHT', label: 'Right', icon: '→', desc: 'Navigate right' },
                { value: 'KEYCODE_DPAD_CENTER', label: 'Center', icon: '⊙', desc: 'Select/Confirm' },
            ]
        },
        {
            label: 'Media',
            keys: [
                { value: 'KEYCODE_VOLUME_UP', label: 'Volume +', icon: '🔊', desc: 'Increase volume' },
                { value: 'KEYCODE_VOLUME_DOWN', label: 'Volume -', icon: '🔉', desc: 'Decrease volume' },
                { value: 'KEYCODE_VOLUME_MUTE', label: 'Mute', icon: '🔇', desc: 'Mute audio' },
                { value: 'KEYCODE_MEDIA_PLAY_PAUSE', label: 'Play/Pause', icon: '⏯️', desc: 'Toggle play' },
                { value: 'KEYCODE_MEDIA_NEXT', label: 'Next', icon: '⏭️', desc: 'Next track' },
                { value: 'KEYCODE_MEDIA_PREVIOUS', label: 'Previous', icon: '⏮️', desc: 'Previous track' },
            ]
        },
        {
            label: 'System',
            keys: [
                { value: 'KEYCODE_POWER', label: 'Power', icon: '⏻', desc: 'Power button' },
                { value: 'KEYCODE_CAMERA', label: 'Camera', icon: '📷', desc: 'Open camera' },
                { value: 'KEYCODE_SEARCH', label: 'Search', icon: '🔍', desc: 'Open search' },
            ]
        }
    ];

    // Get current key based on nodeType or data
    const getCurrentKey = () => {
        if (data.key || data.keyCode) return data.key || data.keyCode;
        if (nodeType === 'back') return 'KEYCODE_BACK';
        if (nodeType === 'home') return 'KEYCODE_HOME';
        return 'KEYCODE_ENTER';
    };

    const currentKey = getCurrentKey();

    // Find current key info
    const findKeyInfo = (keyValue) => {
        for (const group of keyGroups) {
            const key = group.keys.find(k => k.value === keyValue);
            if (key) return { ...key, group: group.label };
        }
        return { value: keyValue, label: keyValue, icon: '⌨️', desc: 'Custom key' };
    };

    const currentKeyInfo = findKeyInfo(currentKey);

    return (
        <>
            {/* Current Key Display */}
            <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20' : 'bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isDark ? 'bg-pink-500/20' : 'bg-pink-100'}`}>
                        {currentKeyInfo.icon}
                    </div>
                    <div>
                        <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {currentKeyInfo.label}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {currentKeyInfo.desc}
                        </p>
                    </div>
                </div>
            </div>

            {/* Key Selection - Only show for generic key_event type */}
            {nodeType === 'key_event' && (
                <ConfigSection title={t('flows.editor.config.select_key', { defaultValue: 'Select Key' })} isDark={isDark}>
                    <div className="space-y-3">
                        {keyGroups.map(group => (
                            <div key={group.label}>
                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {group.label}
                                </p>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {group.keys.map(key => {
                                        const isSelected = currentKey === key.value;
                                        return (
                                            <button
                                                key={key.value}
                                                onClick={() => {
                                                    updateData('key', key.value);
                                                    updateData('keyCode', key.value);
                                                }}
                                                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all border ${isSelected
                                                    ? isDark
                                                        ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
                                                        : 'bg-pink-50 border-pink-300 text-pink-600'
                                                    : isDark
                                                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-gray-400 hover:border-pink-500/30'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-pink-200'
                                                    }`}
                                            >
                                                <span className="text-base">{key.icon}</span>
                                                <span className="text-xs font-medium truncate">{key.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </ConfigSection>
            )}

            {/* Fixed key info for back/home types */}
            {(nodeType === 'back' || nodeType === 'home') && (
                <div className={`p-3 rounded-lg ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                    <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {nodeType === 'back' && '← This node will press the Android BACK button'}
                        {nodeType === 'home' && '🏠 This node will press the Android HOME button'}
                    </p>
                </div>
            )}

            {/* Wait After */}
            <ConfigSection title={t('flows.editor.config.wait_after', { defaultValue: 'Wait After (ms)' })} isDark={isDark}>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min="0"
                        max="10000"
                        step="100"
                        value={data.timeout || data.wait_after || 500}
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 500;
                            updateData('timeout', val);
                            updateData('wait_after', val);
                        }}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg border ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                            }`}
                    />
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>ms</span>
                </div>
                <div className="flex gap-1 mt-2">
                    {[100, 300, 500, 1000, 2000].map(ms => (
                        <button
                            key={ms}
                            onClick={() => {
                                updateData('timeout', ms);
                                updateData('wait_after', ms);
                            }}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${(data.timeout || data.wait_after || 500) === ms
                                ? 'bg-pink-500 text-white'
                                : isDark
                                    ? 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
                        </button>
                    ))}
                </div>
            </ConfigSection>

            {/* Repeat Count */}
            <ConfigSection title={t('flows.editor.config.repeat_count', { defaultValue: 'Repeat Count' })} isDark={isDark}>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={data.repeatCount || 1}
                        onChange={(e) => updateData('repeatCount', parseInt(e.target.value) || 1)}
                        className={`w-20 px-3 py-2 text-sm rounded-lg border text-center ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                            }`}
                    />
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {t('flows.editor.config.times', { defaultValue: 'times' })}
                    </span>
                </div>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {t('flows.editor.config.repeat_count_hint', { defaultValue: 'Press the key multiple times (useful for scrolling)' })}
                </p>
            </ConfigSection>
        </>
    );
}

// Swipe Config - Start/End coordinates with gesture visualization
function SwipeActionConfig({ data, updateData, isDark }) {
    // Read from actionData (APK) or direct props (manual config)
    const actionData = data.actionData || {};
    const startX = data.startX || actionData.start_x || data.x || 540;
    const startY = data.startY || actionData.start_y || data.y || 1200;
    const endX = data.endX || actionData.end_x || 540;
    const endY = data.endY || actionData.end_y || 600;


    return (
        <>
            <ConfigSection title="Swipe Gesture" isDark={isDark}>
                <div className="space-y-3">
                    <div>
                        <p className={`text-[10px] mb-1 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Start Point
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>X</label>
                                <input
                                    type="number"
                                    value={startX}
                                    onChange={(e) => updateData('startX', parseInt(e.target.value))}
                                    className={`w-full px-2 py-1.5 text-sm rounded border ${isDark
                                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                                        : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                />
                            </div>
                            <div>
                                <label className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Y</label>
                                <input
                                    type="number"
                                    value={startY}
                                    onChange={(e) => updateData('startY', parseInt(e.target.value))}
                                    className={`w-full px-2 py-1.5 text-sm rounded border ${isDark
                                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                                        : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <span className={`text-lg ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>↓</span>
                    </div>
                    <div>
                        <p className={`text-[10px] mb-1 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            End Point
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>X</label>
                                <input
                                    type="number"
                                    value={endX}
                                    onChange={(e) => updateData('endX', parseInt(e.target.value))}
                                    className={`w-full px-2 py-1.5 text-sm rounded border ${isDark
                                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                                        : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                />
                            </div>
                            <div>
                                <label className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Y</label>
                                <input
                                    type="number"
                                    value={endY}
                                    onChange={(e) => updateData('endY', parseInt(e.target.value))}
                                    className={`w-full px-2 py-1.5 text-sm rounded border ${isDark
                                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                                        : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </ConfigSection>

            <ConfigSection title="Quick Presets" isDark={isDark}>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { label: '↑ Swipe Up', sx: 540, sy: 1600, ex: 540, ey: 800 },
                        { label: '↓ Swipe Down', sx: 540, sy: 800, ex: 540, ey: 1600 },
                        { label: '← Swipe Left', sx: 900, sy: 1200, ex: 180, ey: 1200 },
                        { label: '→ Swipe Right', sx: 180, sy: 1200, ex: 900, ey: 1200 },
                    ].map(preset => (
                        <button
                            key={preset.label}
                            onClick={() => {
                                updateData('startX', preset.sx);
                                updateData('startY', preset.sy);
                                updateData('endX', preset.ex);
                                updateData('endY', preset.ey);
                            }}
                            className={`px-2 py-1.5 rounded text-xs transition-all ${isDark
                                ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-300'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                }`}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </ConfigSection>

            <ConfigSection title="Duration (ms)" isDark={isDark}>
                <input
                    type="number"
                    min="100"
                    max="2000"
                    step="100"
                    value={data.duration || actionData.duration || 300}
                    onChange={(e) => updateData('duration', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    100-200ms = fast flick • 300-500ms = normal • 800ms+ = slow drag
                </p>
            </ConfigSection>

            <ConfigSection title="Wait After (ms)" isDark={isDark}>
                <input
                    type="number"
                    min="100"
                    max="10000"
                    value={data.timeout || 500}
                    onChange={(e) => updateData('timeout', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
            </ConfigSection>
        </>
    );
}

// Assert Config - Verify element exists or has value
function AssertConfig({ data, updateData, updateMultipleData, isDark, selectedDevice, userId }) {
    const [showPicker, setShowPicker] = useState(false);
    const assertType = data.assertType || 'exists';

    const handleElementSelect = (element) => {
        console.log('🎯 AssertConfig handleElementSelect:', element);

        // Calculate center from bounds
        let centerX, centerY;
        if (element.bounds) {
            const b = element.bounds;
            centerX = Math.round((b.left + b.right) / 2);
            centerY = Math.round((b.top + b.bottom) / 2);
        }

        updateMultipleData({
            resourceId: element.resourceId,
            targetSelector: element.resourceId || element.contentDescription || element.text,
            text: element.text,
            contentDescription: element.contentDescription,
            className: element.className,
            bounds: element.bounds,
            x: centerX,
            y: centerY,
            isClickable: element.isClickable ?? false,
            isEditable: element.isEditable ?? false,
            isScrollable: element.isScrollable ?? false,
            packageName: element.packageName,
        });
        setShowPicker(false);
    };

    return (
        <>
            {/* Element Picker Button */}
            <ConfigSection title="🔍 Element Inspector" isDark={isDark}>
                <button
                    onClick={() => setShowPicker(true)}
                    className={`w-full px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${isDark
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-400 border border-emerald-500/30'
                        : 'bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-600 border border-emerald-200'
                        }`}
                >
                    <span>📱</span>
                    Chọn Element từ Thiết bị
                </button>
                <p className={`text-[10px] mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Click để scan màn hình và chọn element cần kiểm tra
                </p>
            </ConfigSection>

            {/* Selected Element Display */}
            {(data.resourceId || data.text) && (
                <ConfigSection title="✅ Element Đã Chọn" isDark={isDark}>
                    <div className={`p-3 rounded-lg text-xs space-y-1 ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                        {data.resourceId && (
                            <div className="flex items-center gap-2">
                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>ID:</span>
                                <span className={`font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{data.resourceId}</span>
                            </div>
                        )}
                        {data.text && (
                            <div className="flex items-center gap-2">
                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Text:</span>
                                <span className={isDark ? 'text-white' : 'text-gray-900'}>"{data.text}"</span>
                            </div>
                        )}
                        {data.className && (
                            <div className="flex items-center gap-2">
                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Type:</span>
                                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{data.className.split('.').pop()}</span>
                            </div>
                        )}
                    </div>
                </ConfigSection>
            )}

            <ConfigSection title="Assertion Type" isDark={isDark}>
                <div className="space-y-2">
                    {[
                        { value: 'exists', label: 'Element Exists', icon: '✓', desc: 'Verify element is visible' },
                        { value: 'not_exists', label: 'Element Not Exists', icon: '✗', desc: 'Verify element is hidden' },
                        { value: 'text_equals', label: 'Text Equals', icon: '=', desc: 'Verify exact text match' },
                        { value: 'text_contains', label: 'Text Contains', icon: '⊃', desc: 'Verify text includes value' },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => updateData('assertType', opt.value)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all border ${assertType === opt.value
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : isDark
                                    ? 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <span className="text-lg w-6 text-center">{opt.icon}</span>
                            <div>
                                <div className={isDark ? 'text-white' : 'text-gray-900'}>{opt.label}</div>
                                <div className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{opt.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </ConfigSection>

            <ConfigSection title="Target Element" isDark={isDark}>
                <input
                    type="text"
                    value={data.targetSelector || data.resourceId || ''}
                    onChange={(e) => updateData('targetSelector', e.target.value)}
                    placeholder="Resource ID or text..."
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
            </ConfigSection>

            {['text_equals', 'text_contains'].includes(assertType) && (
                <ConfigSection title="Expected Value" isDark={isDark}>
                    <input
                        type="text"
                        value={data.expectedValue || ''}
                        onChange={(e) => updateData('expectedValue', e.target.value)}
                        placeholder="Expected text..."
                        className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                            }`}
                    />
                </ConfigSection>
            )}

            <ConfigSection title="On Failure" isDark={isDark}>
                <select
                    value={data.onFailure || 'stop'}
                    onChange={(e) => updateData('onFailure', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                >
                    <option value="stop">❌ Stop Workflow</option>
                    <option value="continue">⏭️ Continue</option>
                    <option value="retry">🔄 Retry (3 times)</option>
                </select>
            </ConfigSection>

            <ConfigSection title="Timeout (ms)" isDark={isDark}>
                <input
                    type="number"
                    min="1000"
                    max="30000"
                    value={data.timeout || 5000}
                    onChange={(e) => updateData('timeout', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Max time to wait for element
                </p>
            </ConfigSection>

            {/* Element Picker Modal */}
            <ElementPickerModal
                isOpen={showPicker}
                onClose={() => setShowPicker(false)}
                onSelect={handleElementSelect}
                deviceId={selectedDevice?.device_id}
                userId={userId}
            />
        </>
    );
}

// Element Check Config - Check element with True/False branching
function ElementCheckConfig({ data, updateData, updateMultipleData, isDark, selectedDevice, userId }) {
    const [showPicker, setShowPicker] = useState(false);
    const checkType = data.checkType || 'exists';

    const handleElementSelect = (element) => {
        console.log('🎯 ElementCheckConfig handleElementSelect:', element);

        // Calculate center from bounds
        let centerX, centerY;
        if (element.bounds) {
            const b = element.bounds;
            centerX = Math.round((b.left + b.right) / 2);
            centerY = Math.round((b.top + b.bottom) / 2);
        }

        updateMultipleData({
            resourceId: element.resourceId,
            text: element.text,
            contentDescription: element.contentDescription,
            className: element.className,
            bounds: element.bounds,
            x: centerX,
            y: centerY,
            isClickable: element.isClickable ?? false,
            isEditable: element.isEditable ?? false,
            isScrollable: element.isScrollable ?? false,
            packageName: element.packageName,
        });
        setShowPicker(false);
    };

    return (
        <>
            {/* Element Picker Button */}
            <ConfigSection title="🔍 Element Inspector" isDark={isDark}>
                <button
                    onClick={() => setShowPicker(true)}
                    className={`w-full px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${isDark
                        ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 hover:from-violet-500/30 hover:to-purple-500/30 text-violet-400 border border-violet-500/30'
                        : 'bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 text-violet-600 border border-violet-200'
                        }`}
                >
                    <span>📱</span>
                    Chọn Element từ Thiết bị
                </button>
                <p className={`text-[10px] mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Click để scan màn hình và chọn element
                </p>
            </ConfigSection>

            <ConfigSection title="Check Type" isDark={isDark}>
                <div className="space-y-2">
                    {[
                        { value: 'exists', label: 'Element Exists', icon: '✓', desc: 'Check if element is visible' },
                        { value: 'not_exists', label: 'Element Not Exists', icon: '✗', desc: 'Check if element is hidden' },
                        { value: 'text_equals', label: 'Text Equals', icon: '=', desc: 'Compare exact text' },
                        { value: 'text_contains', label: 'Text Contains', icon: '⊃', desc: 'Check if text includes value' },
                        { value: 'is_checked', label: 'Is Checked', icon: '☑', desc: 'Check checkbox state' },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => updateData('checkType', opt.value)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all border ${checkType === opt.value
                                ? 'border-violet-500 bg-violet-500/10'
                                : isDark
                                    ? 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <span className="text-lg w-6 text-center">{opt.icon}</span>
                            <div>
                                <div className={isDark ? 'text-white' : 'text-gray-900'}>{opt.label}</div>
                                <div className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{opt.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </ConfigSection>

            <ConfigSection title="Target Element" isDark={isDark}>
                <input
                    type="text"
                    value={data.resourceId || ''}
                    onChange={(e) => updateData('resourceId', e.target.value)}
                    placeholder="Resource ID..."
                    className={`w-full px-3 py-2 text-sm rounded-lg border mb-2 ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
                <input
                    type="text"
                    value={data.text || ''}
                    onChange={(e) => updateData('text', e.target.value)}
                    placeholder="Text to find..."
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
            </ConfigSection>

            {['text_equals', 'text_contains'].includes(checkType) && (
                <ConfigSection title="Expected Value" isDark={isDark}>
                    <input
                        type="text"
                        value={data.expectedValue || ''}
                        onChange={(e) => updateData('expectedValue', e.target.value)}
                        placeholder="Expected text..."
                        className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                            }`}
                    />
                </ConfigSection>
            )}

            <ConfigSection title="Timeout (ms)" isDark={isDark}>
                <input
                    type="number"
                    min="1000"
                    max="30000"
                    value={data.timeout || 5000}
                    onChange={(e) => updateData('timeout', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
            </ConfigSection>

            {/* Branching Info */}
            <div className={`p-3 rounded-lg ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                <p className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Branching:
                </p>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>True → condition met</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        <span className={isDark ? 'text-red-400' : 'text-red-600'}>False → condition not met</span>
                    </div>
                </div>
            </div>

            {/* Element Picker Modal */}
            <ElementPickerModal
                isOpen={showPicker}
                onClose={() => setShowPicker(false)}
                onSelect={handleElementSelect}
                deviceId={selectedDevice?.device_id}
                userId={userId}
            />
        </>
    );
}

// Wait For Element Config - Wait with timeout
function WaitForElementConfig({ data, updateData, updateMultipleData, isDark, selectedDevice, userId }) {
    const [showPicker, setShowPicker] = useState(false);

    const handleElementSelect = (element) => {
        console.log('🎯 WaitForElementConfig handleElementSelect:', element);

        // Calculate center from bounds
        let centerX, centerY;
        if (element.bounds) {
            const b = element.bounds;
            centerX = Math.round((b.left + b.right) / 2);
            centerY = Math.round((b.top + b.bottom) / 2);
        }

        updateMultipleData({
            resourceId: element.resourceId,
            text: element.text,
            contentDescription: element.contentDescription,
            className: element.className,
            bounds: element.bounds,
            x: centerX,
            y: centerY,
            isClickable: element.isClickable ?? false,
            packageName: element.packageName,
        });
        setShowPicker(false);
    };

    return (
        <>
            {/* Element Picker Button */}
            <ConfigSection title="🔍 Element Inspector" isDark={isDark}>
                <button
                    onClick={() => setShowPicker(true)}
                    className={`w-full px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${isDark
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-400 border border-amber-500/30'
                        : 'bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-600 border border-amber-200'
                        }`}
                >
                    <span>📱</span>
                    Chọn Element từ Thiết bị
                </button>
            </ConfigSection>

            <ConfigSection title="Target Element" isDark={isDark}>
                <input
                    type="text"
                    value={data.resourceId || ''}
                    onChange={(e) => updateData('resourceId', e.target.value)}
                    placeholder="Resource ID..."
                    className={`w-full px-3 py-2 text-sm rounded-lg border mb-2 ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
                <input
                    type="text"
                    value={data.text || ''}
                    onChange={(e) => updateData('text', e.target.value)}
                    placeholder="Text to find..."
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
            </ConfigSection>

            <ConfigSection title="Timeout (ms)" isDark={isDark}>
                <input
                    type="number"
                    min="1000"
                    max="60000"
                    step="1000"
                    value={data.timeout || 10000}
                    onChange={(e) => updateData('timeout', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
                <div className="flex gap-1 mt-2">
                    {[5000, 10000, 15000, 30000].map(ms => (
                        <button
                            key={ms}
                            onClick={() => updateData('timeout', ms)}
                            className={`px-2 py-1 rounded text-[10px] ${isDark ? 'bg-[#252525] hover:bg-[#2a2a2a] text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                        >
                            {ms / 1000}s
                        </button>
                    ))}
                </div>
            </ConfigSection>

            <ConfigSection title="On Timeout" isDark={isDark}>
                <select
                    value={data.onTimeout || 'fail'}
                    onChange={(e) => updateData('onTimeout', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                >
                    <option value="fail">❌ Fail Workflow</option>
                    <option value="skip">⏭️ Skip & Continue</option>
                    <option value="retry">🔄 Retry</option>
                </select>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    What to do if element doesn't appear within timeout
                </p>
            </ConfigSection>

            {/* Element Picker Modal */}
            <ElementPickerModal
                isOpen={showPicker}
                onClose={() => setShowPicker(false)}
                onSelect={handleElementSelect}
                deviceId={selectedDevice?.device_id}
                userId={userId}
            />
        </>
    );
}

// Start/End Config
function StartEndConfig({ data, updateData, isDark, nodeType }) {
    return (
        <>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{nodeType === 'input' ? '▶️' : '🏁'}</span>
                    <div>
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {nodeType === 'input' ? 'Workflow Start' : 'Workflow End'}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {nodeType === 'input'
                                ? 'Entry point of your automation'
                                : 'Marks completion of workflow'}
                        </div>
                    </div>
                </div>
            </div>

            {nodeType === 'input' && (
                <>
                    <ConfigSection title="Trigger Type" isDark={isDark}>
                        <select
                            value={data.triggerType || 'manual'}
                            onChange={(e) => updateData('triggerType', e.target.value)}
                            className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                                ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                                : 'bg-white border-gray-200 text-gray-900'
                                }`}
                        >
                            <option value="manual">👆 Manual Run</option>
                            <option value="scheduled">⏰ Scheduled</option>
                            <option value="api">🔗 API Trigger</option>
                        </select>
                    </ConfigSection>

                    {data.triggerType === 'scheduled' && (
                        <ConfigSection title="Schedule" isDark={isDark}>
                            <input
                                type="text"
                                value={data.cronExpression || '0 9 * * *'}
                                onChange={(e) => updateData('cronExpression', e.target.value)}
                                placeholder="Cron expression..."
                                className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                                    ? 'bg-[#0f0f0f] border-[#2a2a2a] text-cyan-400'
                                    : 'bg-white border-gray-200 text-cyan-600'
                                    }`}
                            />
                            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Default: Daily at 9:00 AM
                            </p>
                        </ConfigSection>
                    )}
                </>
            )}

            {nodeType === 'output' && (
                <ConfigSection title="Completion Status" isDark={isDark}>
                    <select
                        value={data.status || 'success'}
                        onChange={(e) => updateData('status', e.target.value)}
                        className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                            }`}
                    >
                        <option value="success">✅ Success</option>
                        <option value="failure">❌ Failure</option>
                        <option value="conditional">❓ Based on Condition</option>
                    </select>
                </ConfigSection>
            )}
        </>
    );
}

// File Input Config - Enhanced with multi-file and selection mode
function FileInputConfig({ data, updateData, isDark }) {
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const files = data.files || [];
    const selectionMode = data.selectionMode || 'sequential';
    const currentIndex = data.currentIndex || 0;

    // Handle files selected from Media Library
    const handleFilesSelected = (selectedFiles) => {
        const newFiles = selectedFiles.map(file => ({
            id: file.id,
            name: file.name || file.file_name,
            path: file.path || file.file_path,
            url: file.url || file.file_url || `/storage/${file.path || file.file_path}`,
            type: file.type || file.mime_type,
            thumbnail: file.thumbnail_url || file.url || `/storage/${file.path || file.file_path}`,
        }));
        updateData('files', [...files, ...newFiles]);
        setShowMediaPicker(false);
    };

    const removeFile = (index) => {
        const newFiles = files.filter((_, i) => i !== index);
        updateData('files', newFiles);
        // Reset index if out of bounds
        if (currentIndex >= newFiles.length) {
            updateData('currentIndex', 0);
        }
    };

    const moveFile = (index, direction) => {
        const newFiles = [...files];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newFiles.length) return;
        [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
        updateData('files', newFiles);
    };

    return (
        <>
            {/* Selection Mode */}
            <ConfigSection title="🎯 Selection Mode" isDark={isDark}>
                <div className="flex gap-2">
                    {[
                        { value: 'sequential', icon: '📋', label: 'Sequential', desc: 'Theo thứ tự' },
                        { value: 'random', icon: '🎲', label: 'Random', desc: 'Ngẫu nhiên' },
                    ].map(mode => (
                        <button
                            key={mode.value}
                            onClick={() => updateData('selectionMode', mode.value)}
                            className={`flex-1 p-3 rounded-xl text-left transition-all border ${selectionMode === mode.value
                                    ? 'border-cyan-500 bg-cyan-500/10'
                                    : isDark
                                        ? 'border-[#2a2a2a] bg-[#0f0f0f] hover:border-[#3a3a3a]'
                                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{mode.icon}</span>
                                <div>
                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {mode.label}
                                    </p>
                                    <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {mode.desc}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </ConfigSection>

            {/* Files List */}
            <ConfigSection title={`📁 Files (${files.length})`} isDark={isDark}>
                {files.length === 0 ? (
                    <div className={`text-center py-6 rounded-xl border-2 border-dashed ${isDark ? 'border-[#2a2a2a] text-gray-500' : 'border-gray-200 text-gray-400'
                        }`}>
                        <p className="text-2xl mb-2">📭</p>
                        <p className="text-sm">Chưa có file nào</p>
                        <p className="text-xs mt-1">Click button bên dưới để thêm files</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {files.map((file, index) => (
                            <div
                                key={file.id || index}
                                className={`flex items-center gap-3 p-2 rounded-lg transition-all ${selectionMode === 'sequential' && index === currentIndex
                                        ? 'ring-2 ring-cyan-500 bg-cyan-500/10'
                                        : isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'
                                    }`}
                            >
                                {/* Index badge */}
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${selectionMode === 'sequential' && index === currentIndex
                                        ? 'bg-cyan-500 text-white'
                                        : isDark ? 'bg-[#252525] text-gray-400' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                    {index + 1}
                                </div>

                                {/* Thumbnail */}
                                {file.thumbnail && file.type?.startsWith('image') ? (
                                    <img
                                        src={file.thumbnail}
                                        alt={file.name}
                                        className="w-10 h-10 rounded object-cover"
                                    />
                                ) : (
                                    <div className={`w-10 h-10 rounded flex items-center justify-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
                                        }`}>
                                        <span className="text-lg">
                                            {file.type?.startsWith('video') ? '🎬' : '📄'}
                                        </span>
                                    </div>
                                )}

                                {/* File name */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {file.name}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-1">
                                    {selectionMode === 'sequential' && (
                                        <>
                                            <button
                                                onClick={() => moveFile(index, -1)}
                                                disabled={index === 0}
                                                className={`p-1 rounded text-xs transition-all ${index === 0
                                                        ? 'opacity-30 cursor-not-allowed'
                                                        : isDark ? 'hover:bg-[#252525]' : 'hover:bg-gray-200'
                                                    }`}
                                            >
                                                ⬆️
                                            </button>
                                            <button
                                                onClick={() => moveFile(index, 1)}
                                                disabled={index === files.length - 1}
                                                className={`p-1 rounded text-xs transition-all ${index === files.length - 1
                                                        ? 'opacity-30 cursor-not-allowed'
                                                        : isDark ? 'hover:bg-[#252525]' : 'hover:bg-gray-200'
                                                    }`}
                                            >
                                                ⬇️
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => removeFile(index)}
                                        className={`p-1 rounded text-xs transition-all hover:bg-red-500/20 text-red-500`}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Files Button */}
                <button
                    onClick={() => setShowMediaPicker(true)}
                    className={`w-full mt-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${isDark
                            ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30'
                            : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border border-cyan-200'
                        }`}
                >
                    <span>➕</span>
                    <span>Thêm từ Media Library</span>
                </button>
            </ConfigSection>

            {/* Current Index (Sequential only) */}
            {selectionMode === 'sequential' && files.length > 0 && (
                <ConfigSection title="📍 Current Index" isDark={isDark}>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            min="0"
                            max={files.length - 1}
                            value={currentIndex}
                            onChange={(e) => updateData('currentIndex', Math.min(parseInt(e.target.value) || 0, files.length - 1))}
                            className={`w-20 px-3 py-2 text-sm rounded-lg border text-center ${isDark
                                ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                                : 'bg-white border-gray-200 text-gray-900'
                                }`}
                        />
                        <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            / {files.length} files
                        </span>
                        <button
                            onClick={() => updateData('currentIndex', 0)}
                            className={`text-xs px-2 py-1 rounded transition-all ${isDark ? 'bg-[#252525] hover:bg-[#2a2a2a]' : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                        >
                            Reset
                        </button>
                    </div>
                    <p className={`text-[10px] mt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        Next file: {files[currentIndex]?.name || 'N/A'}
                    </p>
                </ConfigSection>
            )}

            {/* Output Variable */}
            <ConfigSection title="📤 Output Variable" isDark={isDark}>
                <input
                    type="text"
                    value={data.outputVariable || 'filePath'}
                    onChange={(e) => updateData('outputVariable', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-cyan-400'
                        : 'bg-white border-gray-200 text-cyan-600'
                        }`}
                />
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Access via {'{{'}filePath{'}}'}  in downstream nodes
                </p>
            </ConfigSection>

            {/* Allowed Types */}
            <ConfigSection title="📋 Allowed Types" isDark={isDark}>
                <div className="flex flex-wrap gap-2">
                    {['image', 'video', 'document', 'any'].map(type => (
                        <button
                            key={type}
                            onClick={() => updateData('allowedType', type)}
                            className={`px-3 py-1.5 rounded text-xs transition-all ${data.allowedType === type
                                ? 'bg-cyan-500 text-white'
                                : isDark
                                    ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-300'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                        >
                            {type === 'image' && '🖼️'}
                            {type === 'video' && '🎬'}
                            {type === 'document' && '📄'}
                            {type === 'any' && '📦'}
                            {' '}{type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </ConfigSection>

            {/* Media Picker Modal - TODO: Implement actual picker */}
            {showMediaPicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className={`w-full max-w-2xl mx-4 rounded-2xl shadow-2xl ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
                        <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                📁 Select Files from Media Library
                            </h3>
                            <button
                                onClick={() => setShowMediaPicker(false)}
                                className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'}`}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6">
                            <p className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Media Library integration sẽ được thêm sau.<br />
                                Hiện tại, bạn có thể nhập URL trực tiếp.
                            </p>
                            {/* URL input fallback */}
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Paste file URL here..."
                                    className={`w-full px-4 py-3 rounded-lg border ${isDark
                                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                                        : 'bg-gray-50 border-gray-200 text-gray-900'
                                        }`}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.target.value) {
                                            const url = e.target.value;
                                            const name = url.split('/').pop() || 'file';
                                            handleFilesSelected([{
                                                id: Date.now(),
                                                name,
                                                path: url,
                                                url,
                                                type: name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image/jpeg' : 'file',
                                            }]);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Press Enter to add file URL
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// Process Config - Data transformation
function ProcessConfig({ data, updateData, isDark, upstreamVariables }) {
    const processType = data.processType || 'transform';

    return (
        <>
            <ConfigSection title="Process Type" isDark={isDark}>
                <select
                    value={processType}
                    onChange={(e) => updateData('processType', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                >
                    <option value="transform">🔄 Transform Data</option>
                    <option value="filter">🔍 Filter Array</option>
                    <option value="map">📍 Map Values</option>
                    <option value="reduce">📊 Reduce/Aggregate</option>
                    <option value="format">✨ Format Text</option>
                    <option value="parse">📝 Parse JSON</option>
                </select>
            </ConfigSection>

            <ConfigSection title="Input" isDark={isDark}>
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
                <ConfigSection title="Expression" isDark={isDark}>
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
                <ConfigSection title="Filter Condition" isDark={isDark}>
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

            <ConfigSection title="Output Variable" isDark={isDark}>
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

// Custom Action Config
function CustomActionConfig({ data, updateData, isDark, upstreamVariables }) {
    return (
        <>
            <ConfigSection title="Action Type" isDark={isDark}>
                <select
                    value={data.actionType || 'shell'}
                    onChange={(e) => updateData('actionType', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                >
                    <option value="shell">⌨️ Shell Command</option>
                    <option value="adb">📱 ADB Command</option>
                    <option value="javascript">📜 JavaScript</option>
                    <option value="webhook">🔔 Webhook</option>
                </select>
            </ConfigSection>

            <ConfigSection title="Command / Code" isDark={isDark}>
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
                <ConfigSection title="Webhook URL" isDark={isDark}>
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

            <ConfigSection title="Output Variable" isDark={isDark}>
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

            <ConfigSection title="Timeout (ms)" isDark={isDark}>
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

            <ConfigSection title="On Error" isDark={isDark}>
                <select
                    value={data.onError || 'stop'}
                    onChange={(e) => updateData('onError', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                >
                    <option value="stop">❌ Stop Workflow</option>
                    <option value="continue">⏭️ Continue</option>
                    <option value="retry">🔄 Retry (3 times)</option>
                </select>
            </ConfigSection>
        </>
    );
}
