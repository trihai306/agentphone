import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/Contexts/ThemeContext';
import { VariableInput } from './VariablePicker';
import ElementPickerModal from './ElementPickerModal';
import AppPickerModal from './AppPickerModal';
import MediaPickerModal from '@/Components/MediaPickerModal';

// Modular NodeConfig imports
import {
    ConfigSection,
    getNodeTypeName,
    NodeTypeIcon,
} from './NodeConfig/shared';

import {
    TextInputConfig,
    WaitConfig,
    HttpConfig,
    AIConfig,
    StartEndConfig,
    FileInputConfig,
    ProcessConfig,
    CustomActionConfig,
} from './NodeConfig/basic';

import {
    ConditionConfig,
    LoopConfig,
    DataSourceConfig,
} from './NodeConfig/logic';

import {
    TapActionConfig,
    KeyActionConfig,
    SwipeActionConfig,
    ScrollActionConfig,
    OpenAppActionConfig,
    AssertConfig,
    ElementCheckConfig,
    WaitForElementConfig,
    RepeatClickConfig,
} from './NodeConfig/actions';

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
    deviceApps = [],
    deviceAppsLoading = false,
    onRequestDeviceApps,
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

                {['ai_process', 'ai_call'].includes(nodeType) && (
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
                        updateMultipleData={updateMultipleData}
                        isDark={isDark}
                        selectedDevice={selectedDevice}
                        userId={userId}
                        deviceApps={deviceApps}
                        deviceAppsLoading={deviceAppsLoading}
                        onRequestDeviceApps={onRequestDeviceApps}
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

                {/* Repeat Click config */}
                {nodeType === 'repeat_click' && (
                    <RepeatClickConfig
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
