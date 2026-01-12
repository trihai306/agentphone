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
