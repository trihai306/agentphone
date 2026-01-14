import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { VariableInput } from './VariablePicker';

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
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

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

    return (
        <div
            className={`fixed right-0 top-14 bottom-0 w-80 z-40 overflow-hidden flex flex-col transition-transform duration-300 ${isDark ? 'bg-[#1a1a1a] border-l border-[#2a2a2a]' : 'bg-white border-l border-gray-200'}`}
            style={{ boxShadow: '-4px 0 20px rgba(0,0,0,0.1)' }}
        >
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                    <NodeTypeIcon type={nodeType} />
                    <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {getNodeTypeName(nodeType)}
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
                <ConfigSection title="Label" isDark={isDark}>
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
                        isDark={isDark}
                        upstreamVariables={upstreamVariables}
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
                {nodeType === 'scroll' && (
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
                        isDark={isDark}
                        nodeType={nodeType}
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
                        isDark={isDark}
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
    return (
        <>
            <ConfigSection title="Text Content" isDark={isDark}>
                <VariableInput
                    value={data.textContent || ''}
                    onChange={(val) => updateData('textContent', val)}
                    placeholder="Enter text content with {{variables}}..."
                    multiline
                    availableVariables={upstreamVariables}
                    loopContext={loopContext}
                />
            </ConfigSection>
            <ConfigSection title="Output Variable" isDark={isDark}>
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
                    Access via: {`{{${data.outputVariable || 'text'}}}`}
                </p>
            </ConfigSection>
        </>
    );
}

function LoopConfig({ data, updateData, isDark }) {
    const sourceOptions = [
        { value: 'data', label: 'From Data Source', icon: '📊' },
        { value: 'custom', label: 'Custom Array', icon: '📝' },
        { value: 'count', label: 'Fixed Count', icon: '🔢' },
    ];

    return (
        <>
            <ConfigSection title="Loop Source" isDark={isDark}>
                <div className="space-y-2">
                    {sourceOptions.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => updateData('source', opt.value)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all border ${data.source === opt.value
                                ? 'border-cyan-500 bg-cyan-500/10'
                                : isDark
                                    ? 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <span>{opt.icon}</span>
                            <span className={isDark ? 'text-white' : 'text-gray-900'}>{opt.label}</span>
                        </button>
                    ))}
                </div>
            </ConfigSection>

            {data.source === 'data' && (
                <ConfigSection title="Source Variable" isDark={isDark}>
                    <input
                        type="text"
                        value={data.sourceVariable || '{{records}}'}
                        onChange={(e) => updateData('sourceVariable', e.target.value)}
                        className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-indigo-400'
                            : 'bg-white border-gray-200 text-indigo-600'
                            }`}
                    />
                </ConfigSection>
            )}

            {data.source === 'count' && (
                <ConfigSection title="Iterations" isDark={isDark}>
                    <input
                        type="number"
                        min="1"
                        max="10000"
                        value={data.iterations || 10}
                        onChange={(e) => updateData('iterations', parseInt(e.target.value))}
                        className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                            }`}
                    />
                </ConfigSection>
            )}

            <ConfigSection title="Item Variable Name" isDark={isDark}>
                <input
                    type="text"
                    value={data.itemVariable || 'item'}
                    onChange={(e) => updateData('itemVariable', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-cyan-400'
                        : 'bg-white border-gray-200 text-cyan-600'
                        }`}
                />
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Access current item as: {`{{${data.itemVariable || 'item'}}}`}
                </p>
            </ConfigSection>

            <ConfigSection title="Index Variable Name" isDark={isDark}>
                <input
                    type="text"
                    value={data.indexVariable || 'index'}
                    onChange={(e) => updateData('indexVariable', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-cyan-400'
                        : 'bg-white border-gray-200 text-cyan-600'
                        }`}
                />
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

    return (
        <>
            <ConfigSection title="Method" isDark={isDark}>
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

            <ConfigSection title="URL" isDark={isDark}>
                <VariableInput
                    value={data.url || ''}
                    onChange={(val) => updateData('url', val)}
                    placeholder="https://api.example.com/{{endpoint}}"
                    availableVariables={upstreamVariables}
                    loopContext={loopContext}
                />
            </ConfigSection>

            <ConfigSection title="Headers (JSON)" isDark={isDark}>
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
                <ConfigSection title="Body" isDark={isDark}>
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

            <ConfigSection title="Output Variable" isDark={isDark}>
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

function ConditionConfig({ data, updateData, isDark, upstreamVariables }) {
    const operators = [
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

    return (
        <>
            <ConfigSection title="Left Value" isDark={isDark}>
                <VariableInput
                    value={data.leftValue || ''}
                    onChange={(val) => updateData('leftValue', val)}
                    placeholder="{{item.status}}"
                    availableVariables={upstreamVariables}
                />
            </ConfigSection>

            <ConfigSection title="Operator" isDark={isDark}>
                <select
                    value={data.operator || '=='}
                    onChange={(e) => updateData('operator', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                >
                    {operators.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                </select>
            </ConfigSection>

            <ConfigSection title="Right Value" isDark={isDark}>
                <VariableInput
                    value={data.rightValue || ''}
                    onChange={(val) => updateData('rightValue', val)}
                    placeholder="active"
                    availableVariables={upstreamVariables}
                />
            </ConfigSection>
        </>
    );
}

function AIConfig({ data, updateData, isDark, upstreamVariables, loopContext }) {
    return (
        <>
            <ConfigSection title="Model" isDark={isDark}>
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

            <ConfigSection title="Prompt Template" isDark={isDark}>
                <VariableInput
                    value={data.prompt || ''}
                    onChange={(val) => updateData('prompt', val)}
                    placeholder="Analyze this data: {{item.content}}"
                    multiline
                    availableVariables={upstreamVariables}
                    loopContext={loopContext}
                />
            </ConfigSection>

            <ConfigSection title="Output Variable" isDark={isDark}>
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
    return (
        <>
            <ConfigSection title="Duration (seconds)" isDark={isDark}>
                <input
                    type="number"
                    min="0"
                    max="86400"
                    value={data.duration || 1}
                    onChange={(e) => updateData('duration', parseFloat(e.target.value))}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
            </ConfigSection>
            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Quick set:
                <div className="flex gap-2 mt-1">
                    {[1, 5, 10, 30, 60].map(sec => (
                        <button
                            key={sec}
                            onClick={() => updateData('duration', sec)}
                            className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-[#252525] hover:bg-[#2a2a2a]' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                            {sec}s
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
    const direction = data.direction || data.actionData?.direction || 'down';
    const amount = data.amount || data.actionData?.amount || 1;

    return (
        <>
            <ConfigSection title="Scroll Direction" isDark={isDark}>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { value: 'up', icon: '↑', label: 'Up' },
                        { value: 'down', icon: '↓', label: 'Down' },
                        { value: 'left', icon: '←', label: 'Left' },
                        { value: 'right', icon: '→', label: 'Right' },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => updateData('direction', opt.value)}
                            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border ${direction === opt.value
                                ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                                : isDark
                                    ? 'border-[#2a2a2a] hover:border-[#3a3a3a] text-gray-400'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                }`}
                        >
                            <span className="text-lg">{opt.icon}</span>
                            <span>{opt.label}</span>
                        </button>
                    ))}
                </div>
            </ConfigSection>

            <ConfigSection title="Scroll Amount" isDark={isDark}>
                <input
                    type="number"
                    min="1"
                    max="10"
                    value={amount}
                    onChange={(e) => updateData('amount', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
                <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 5].map(n => (
                        <button
                            key={n}
                            onClick={() => updateData('amount', n)}
                            className={`px-2 py-0.5 rounded text-[10px] ${isDark ? 'bg-[#252525] hover:bg-[#2a2a2a] text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                        >
                            {n}×
                        </button>
                    ))}
                </div>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    1 = ~40% of screen height
                </p>
            </ConfigSection>

            {(data.resourceId || data.resource_id) && (
                <ConfigSection title="Target Container" isDark={isDark}>
                    <div className={`p-2 rounded-lg font-mono text-xs ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                        <span className="text-cyan-400">#</span>
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}> {data.resourceId || data.resource_id}</span>
                    </div>
                </ConfigSection>
            )}

            <ConfigSection title="Wait After (ms)" isDark={isDark}>
                <input
                    type="number"
                    min="100"
                    max="30000"
                    step="100"
                    value={data.timeout || 1000}
                    onChange={(e) => updateData('timeout', parseInt(e.target.value))}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                />
                <div className="flex gap-1 mt-1">
                    {[500, 1000, 2000, 3000].map(ms => (
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

function TapActionConfig({ data, updateData, isDark, nodeType }) {
    const selectorPriority = data.selectorPriority || 'auto';

    return (
        <>
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

            {(data.resourceId || data.resource_id || data.text || data.contentDescription || data.x || data.coordinates?.x) && (
                <ConfigSection title="Current Target" isDark={isDark}>
                    <div className={`p-2 rounded-lg font-mono text-xs space-y-1 ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                        {(data.resourceId || data.resource_id) && (
                            <div className="flex gap-2">
                                <span className="text-cyan-400">#</span>
                                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{data.resourceId || data.resource_id}</span>
                            </div>
                        )}
                        {data.text && (
                            <div className="flex gap-2">
                                <span className="text-purple-400">T</span>
                                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{data.text}</span>
                            </div>
                        )}
                        {data.contentDescription && (
                            <div className="flex gap-2">
                                <span className="text-green-400">CD</span>
                                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{data.contentDescription}</span>
                            </div>
                        )}
                        {(data.x || data.coordinates?.x) && (data.y || data.coordinates?.y) && (
                            <div className="flex gap-2">
                                <span className="text-amber-400">📍</span>
                                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>({data.x || data.coordinates?.x}, {data.y || data.coordinates?.y})</span>
                            </div>
                        )}
                    </div>
                </ConfigSection>
            )}

            {nodeType === 'text_input' && (
                <ConfigSection title="Input Text" isDark={isDark}>
                    <input
                        type="text"
                        value={data.inputText || data.text || ''}
                        onChange={(e) => updateData('inputText', e.target.value)}
                        placeholder="Text to type..."
                        className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                            }`}
                    />
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
        </>
    );
}

function KeyActionConfig({ data, updateData, isDark, nodeType }) {
    return (
        <>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {nodeType === 'back' && '← Press Android BACK button'}
                    {nodeType === 'home' && '🏠 Press Android HOME button'}
                    {nodeType === 'key_event' && '⌨️ Simulate hardware key press'}
                </p>
            </div>

            <ConfigSection title="Wait After (ms)" isDark={isDark}>
                <input
                    type="number"
                    min="100"
                    max="5000"
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
function AssertConfig({ data, updateData, isDark }) {
    const assertType = data.assertType || 'exists';

    return (
        <>
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

// File Input Config
function FileInputConfig({ data, updateData, isDark }) {
    return (
        <>
            <ConfigSection title="File Source" isDark={isDark}>
                <select
                    value={data.fileSource || 'media'}
                    onChange={(e) => updateData('fileSource', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                        ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                        }`}
                >
                    <option value="media">📁 From Media Library</option>
                    <option value="url">🔗 From URL</option>
                    <option value="variable">📝 From Variable</option>
                </select>
            </ConfigSection>

            {data.fileSource === 'url' && (
                <ConfigSection title="File URL" isDark={isDark}>
                    <input
                        type="text"
                        value={data.fileUrl || ''}
                        onChange={(e) => updateData('fileUrl', e.target.value)}
                        placeholder="https://example.com/file.jpg"
                        className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                            ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                            }`}
                    />
                </ConfigSection>
            )}

            {data.fileName && (
                <ConfigSection title="Selected File" isDark={isDark}>
                    <div className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                        <span className="text-2xl">📄</span>
                        <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {data.fileName}
                            </div>
                            {data.fileSize && (
                                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {data.fileSize}
                                </div>
                            )}
                        </div>
                    </div>
                </ConfigSection>
            )}

            <ConfigSection title="Output Variable" isDark={isDark}>
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
                    Access via {'{{filePath}}'} in downstream nodes
                </p>
            </ConfigSection>

            <ConfigSection title="Allowed Types" isDark={isDark}>
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
