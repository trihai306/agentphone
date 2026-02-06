import React from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * NodePropertiesPanel - Right sidebar showing selected node properties
 * Displays screenshot, action type, label, element details, and technical info
 */
export default function NodePropertiesPanel({
    selectedNode,
    setSelectedNode,
    setNodes,
    deleteSelectedNodes,
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (!selectedNode) return null;

    const handleLabelChange = (e) => {
        setNodes((nds) =>
            nds.map((n) =>
                n.id === selectedNode.id
                    ? { ...n, data: { ...n.data, label: e.target.value } }
                    : n
            )
        );
    };

    return (
        <div className={`w-80 flex flex-col border-l transition-colors ${isDark ? 'bg-[#0f0f0f] border-[#1e1e1e]' : 'bg-white border-gray-200'}`}>
            {/* Header */}
            <div className={`h-12 px-4 flex items-center justify-between border-b ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Node Properties</span>
                <button
                    onClick={() => setSelectedNode(null)}
                    className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${isDark ? 'hover:bg-[#1a1a1a] text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Recorded Action Badge */}
                {selectedNode.data?.isRecorded && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className={`text-xs font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>RECORDED ACTION</span>
                        {selectedNode.data?.sequenceNumber && (
                            <span className={`text-xs ${isDark ? 'text-red-400/60' : 'text-red-500/60'}`}>#{selectedNode.data.sequenceNumber}</span>
                        )}
                    </div>
                )}

                {/* Screenshot Preview */}
                {selectedNode.data?.screenshotUrl && (
                    <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Interaction Screenshot
                        </label>
                        <div className="relative w-full rounded-lg overflow-hidden border border-gray-500/20 cursor-pointer group" style={{ aspectRatio: '9/16' }}>
                            <img
                                src={selectedNode.data.screenshotUrl}
                                alt="Action screenshot"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {/* Tap Position Indicator */}
                            {selectedNode.data?.coordinates && (selectedNode.data.coordinates.x || selectedNode.data.coordinates.y) && (
                                <div
                                    className="absolute w-6 h-6 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{
                                        left: `${(selectedNode.data.coordinates.x / 1080) * 100}%`,
                                        top: `${(selectedNode.data.coordinates.y / 2400) * 100}%`,
                                    }}
                                >
                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
                                    <div className="absolute inset-1 bg-red-500 rounded-full border-2 border-white shadow-lg" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                                <span className="text-white text-xs font-medium">Click to expand</span>
                            </div>
                        </div>
                        {/* Coordinates display */}
                        {selectedNode.data?.coordinates && (
                            <div className={`flex justify-center gap-4 mt-2 text-[10px] font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                <span>X: {selectedNode.data.coordinates.x}</span>
                                <span>Y: {selectedNode.data.coordinates.y}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Type */}
                <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Action Type</label>
                    <div className="flex items-center gap-2">
                        <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedNode.data?.eventType === 'click' ? 'bg-blue-500/20' :
                                selectedNode.data?.eventType === 'text_input' ? 'bg-purple-500/20' :
                                    selectedNode.data?.eventType?.includes('scroll') ? 'bg-amber-500/20' :
                                        selectedNode.data?.eventType?.includes('swipe') ? 'bg-cyan-500/20' :
                                            'bg-indigo-500/20'
                                }`}
                        >
                            <svg className={`w-4 h-4 ${selectedNode.data?.eventType === 'click' ? 'text-blue-400' :
                                selectedNode.data?.eventType === 'text_input' ? 'text-purple-400' :
                                    selectedNode.data?.eventType?.includes('scroll') ? 'text-amber-400' :
                                        selectedNode.data?.eventType?.includes('swipe') ? 'text-cyan-400' :
                                            'text-indigo-400'
                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className={`text-sm font-medium capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {selectedNode.data?.eventType || selectedNode.type}
                        </span>
                    </div>
                </div>

                {/* Label - Editable */}
                <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Label</label>
                    <input
                        type="text"
                        value={selectedNode.data?.label || ''}
                        onChange={handleLabelChange}
                        className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                    />
                </div>

                {/* Probability Control - for action nodes */}
                {['click', 'tap', 'long_tap', 'long_press', 'double_tap', 'text_input', 'set_text', 'scroll', 'scroll_up', 'scroll_down', 'scroll_left', 'scroll_right', 'swipe', 'swipe_left', 'swipe_right', 'swipe_up', 'swipe_down', 'open_app', 'repeat_click'].includes(selectedNode.data?.eventType || selectedNode.type) && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className={`block text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Execution Probability
                            </label>
                            <span className={`text-sm font-mono font-bold ${(selectedNode.data?.probability || 100) < 50 ? 'text-amber-500' : (selectedNode.data?.probability || 100) < 100 ? 'text-blue-500' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {selectedNode.data?.probability ?? 100}%
                            </span>
                        </div>
                        <div className="space-y-2">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={selectedNode.data?.probability ?? 100}
                                onChange={(e) => {
                                    const probability = parseInt(e.target.value);
                                    setNodes((nds) =>
                                        nds.map((n) =>
                                            n.id === selectedNode.id
                                                ? { ...n, data: { ...n.data, probability } }
                                                : n
                                        )
                                    );
                                }}
                                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-200'}`}
                                style={{
                                    accentColor: (selectedNode.data?.probability || 100) < 50 ? '#f59e0b' : '#3b82f6'
                                }}
                            />
                            <div className="flex justify-between text-[10px] font-medium text-gray-500">
                                <span>0%</span>
                                <span>50%</span>
                                <span>100%</span>
                            </div>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {(selectedNode.data?.probability ?? 100) === 100
                                    ? 'Always execute this action'
                                    : (selectedNode.data?.probability ?? 100) === 0
                                        ? 'Never execute this action'
                                        : `${selectedNode.data?.probability}% chance to execute, ${100 - (selectedNode.data?.probability ?? 100)}% chance to skip`}
                            </p>
                        </div>
                    </div>
                )}

                {/* ========== NODE-SPECIFIC CONFIG SECTIONS ========== */}

                {/* Helper for updating node data */}
                {(() => {
                    const nodeType = selectedNode.data?.eventType || selectedNode.type;

                    const updateField = (field, value) => {
                        setNodes((nds) =>
                            nds.map((n) =>
                                n.id === selectedNode.id
                                    ? { ...n, data: { ...n.data, [field]: value } }
                                    : n
                            )
                        );
                    };

                    const ConfigSection = ({ title, children }) => (
                        <div className={`border-t pt-4 ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                            <label className={`block text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {title}
                            </label>
                            <div className="space-y-3">
                                {children}
                            </div>
                        </div>
                    );

                    const TextField = ({ label, field, placeholder }) => (
                        <div>
                            <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</label>
                            <input
                                type="text"
                                value={selectedNode.data?.[field] || ''}
                                onChange={(e) => updateField(field, e.target.value)}
                                placeholder={placeholder}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                            />
                        </div>
                    );

                    const NumberField = ({ label, field, placeholder, min = 0 }) => (
                        <div>
                            <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</label>
                            <input
                                type="number"
                                value={selectedNode.data?.[field] || ''}
                                onChange={(e) => updateField(field, parseInt(e.target.value) || 0)}
                                placeholder={placeholder}
                                min={min}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                            />
                        </div>
                    );

                    const SelectField = ({ label, field, options }) => (
                        <div>
                            <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</label>
                            <select
                                value={selectedNode.data?.[field] || options[0]?.value}
                                onChange={(e) => updateField(field, e.target.value)}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                            >
                                {options.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    );

                    const CheckboxField = ({ label, field }) => (
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedNode.data?.[field] || false}
                                onChange={(e) => updateField(field, e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                            />
                            <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
                        </label>
                    );

                    // =====================================================
                    // ELEMENT INSPECTION NODES
                    // =====================================================
                    if (['count_elements', 'get_bounds', 'is_visible', 'get_text'].includes(nodeType)) {
                        return (
                            <ConfigSection title="Element Selector">
                                <TextField label="Text" field="text" placeholder="Element text..." />
                                <TextField label="Resource ID" field="resourceId" placeholder="com.app:id/button" />
                                <TextField label="Content Description" field="contentDescription" placeholder="Button label" />
                                <TextField label="Class Name" field="className" placeholder="android.widget.Button" />
                                {['get_text', 'count_elements'].includes(nodeType) && (
                                    <TextField label="Output Variable" field="outputVariable" placeholder="{{result}}" />
                                )}
                                {nodeType === 'is_visible' && (
                                    <NumberField label="Timeout (ms)" field="timeout" placeholder="5000" />
                                )}
                            </ConfigSection>
                        );
                    }

                    // =====================================================
                    // WAIT CONDITION NODES
                    // =====================================================
                    if (nodeType === 'wait_for_text') {
                        return (
                            <ConfigSection title="Wait for Text">
                                <TextField label="Text to Wait For" field="waitText" placeholder="Loading complete..." />
                                <NumberField label="Timeout (ms)" field="timeout" placeholder="30000" />
                                <NumberField label="Check Interval (ms)" field="interval" placeholder="500" />
                                <CheckboxField label="Case Sensitive" field="caseSensitive" />
                            </ConfigSection>
                        );
                    }

                    if (nodeType === 'wait_for_activity') {
                        return (
                            <ConfigSection title="Wait for Activity">
                                <TextField label="Activity Name" field="activityName" placeholder="MainActivity" />
                                <NumberField label="Timeout (ms)" field="timeout" placeholder="30000" />
                            </ConfigSection>
                        );
                    }

                    if (nodeType === 'wait_for_package') {
                        return (
                            <ConfigSection title="Wait for App">
                                <TextField label="Package Name" field="packageName" placeholder="com.example.app" />
                                <NumberField label="Timeout (ms)" field="timeout" placeholder="30000" />
                            </ConfigSection>
                        );
                    }

                    if (nodeType === 'wait_idle') {
                        return (
                            <ConfigSection title="Wait Idle">
                                <NumberField label="Timeout (ms)" field="timeout" placeholder="10000" />
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Wait for UI to become idle (no animations/updates)
                                </p>
                            </ConfigSection>
                        );
                    }

                    // =====================================================
                    // TEXT OPERATION NODES
                    // =====================================================
                    if (['clear_text', 'select_all'].includes(nodeType)) {
                        return (
                            <ConfigSection title="Target Element">
                                <TextField label="Text" field="text" placeholder="Element text..." />
                                <TextField label="Resource ID" field="resourceId" placeholder="com.app:id/input" />
                            </ConfigSection>
                        );
                    }

                    if (nodeType === 'append_text') {
                        return (
                            <ConfigSection title="Append Text">
                                <TextField label="Target Element Text" field="text" placeholder="Element text..." />
                                <TextField label="Target Resource ID" field="resourceId" placeholder="com.app:id/input" />
                                <TextField label="Text to Append" field="appendValue" placeholder="Additional text..." />
                            </ConfigSection>
                        );
                    }

                    // =====================================================
                    // ADVANCED GESTURE NODES
                    // =====================================================
                    if (nodeType === 'drag_drop') {
                        return (
                            <ConfigSection title="Drag & Drop">
                                <div className="grid grid-cols-2 gap-2">
                                    <NumberField label="Start X" field="startX" placeholder="0" />
                                    <NumberField label="Start Y" field="startY" placeholder="0" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <NumberField label="End X" field="endX" placeholder="0" />
                                    <NumberField label="End Y" field="endY" placeholder="0" />
                                </div>
                                <NumberField label="Duration (ms)" field="duration" placeholder="500" />
                            </ConfigSection>
                        );
                    }

                    if (nodeType === 'pinch_zoom') {
                        return (
                            <ConfigSection title="Pinch Zoom">
                                <SelectField
                                    label="Direction"
                                    field="direction"
                                    options={[
                                        { value: 'in', label: 'Zoom In' },
                                        { value: 'out', label: 'Zoom Out' },
                                    ]}
                                />
                                <NumberField label="Scale Factor" field="scale" placeholder="2" />
                                <div className="grid grid-cols-2 gap-2">
                                    <NumberField label="Center X" field="centerX" placeholder="540" />
                                    <NumberField label="Center Y" field="centerY" placeholder="960" />
                                </div>
                            </ConfigSection>
                        );
                    }

                    if (nodeType === 'fling') {
                        return (
                            <ConfigSection title="Fling">
                                <SelectField
                                    label="Direction"
                                    field="direction"
                                    options={[
                                        { value: 'up', label: 'Up' },
                                        { value: 'down', label: 'Down' },
                                        { value: 'left', label: 'Left' },
                                        { value: 'right', label: 'Right' },
                                    ]}
                                />
                                <NumberField label="Velocity" field="velocity" placeholder="5000" />
                                <div className="grid grid-cols-2 gap-2">
                                    <NumberField label="Start X" field="startX" placeholder="540" />
                                    <NumberField label="Start Y" field="startY" placeholder="960" />
                                </div>
                            </ConfigSection>
                        );
                    }

                    // =====================================================
                    // SYSTEM ACTIONS (no config needed - just info)
                    // =====================================================
                    if (['recents', 'notifications', 'quick_settings'].includes(nodeType)) {
                        return (
                            <ConfigSection title="System Action">
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {nodeType === 'recents' && 'Opens the recent apps screen'}
                                    {nodeType === 'notifications' && 'Opens the notification panel'}
                                    {nodeType === 'quick_settings' && 'Opens the quick settings panel'}
                                </p>
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>No configuration needed</span>
                                </div>
                            </ConfigSection>
                        );
                    }

                    return null;
                })()}

                {/* Element Details Section */}
                {selectedNode.data?.isRecorded && (
                    <ElementDetailsSection selectedNode={selectedNode} isDark={isDark} />
                )}

                {/* Technical Info */}
                <div className={`border-t pt-4 ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Technical Info
                    </label>
                    <div className="space-y-2">
                        <div>
                            <span className={`text-[10px] font-semibold uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Node ID</span>
                            <div className={`text-xs font-mono rounded-lg px-3 py-2 border mt-1 ${isDark ? 'text-gray-500 bg-[#1a1a1a] border-[#2a2a2a]' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                                {selectedNode.id}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <span className={`text-[10px] font-semibold uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Canvas X</span>
                                <div className={`text-xs rounded-lg px-3 py-2 border mt-1 ${isDark ? 'text-gray-500 bg-[#1a1a1a] border-[#2a2a2a]' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                                    {Math.round(selectedNode.position?.x || 0)}
                                </div>
                            </div>
                            <div>
                                <span className={`text-[10px] font-semibold uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Canvas Y</span>
                                <div className={`text-xs rounded-lg px-3 py-2 border mt-1 ${isDark ? 'text-gray-500 bg-[#1a1a1a] border-[#2a2a2a]' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                                    {Math.round(selectedNode.position?.y || 0)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Button */}
            <div className={`p-4 border-t ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                <button
                    onClick={deleteSelectedNodes}
                    className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-semibold rounded-lg transition-all border border-red-500/20 hover:border-red-500/40"
                >
                    Delete Node
                </button>
            </div>
        </div>
    );
}

/**
 * ElementDetailsSection - Displays detailed element information for recorded actions
 */
function ElementDetailsSection({ selectedNode, isDark }) {
    const DetailItem = ({ icon, label, value, colorClass = '' }) => (
        <div className="mb-3">
            <div className={`flex items-center gap-1.5 mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {icon}
                <span className="text-[10px] font-semibold uppercase">{label}</span>
            </div>
            <div className={`text-xs font-mono rounded-lg px-3 py-2 border break-all ${colorClass || (isDark ? 'text-gray-300 bg-[#1a1a1a] border-[#2a2a2a]' : 'text-gray-700 bg-gray-50 border-gray-200')}`}>
                {value}
            </div>
        </div>
    );

    return (
        <div className={`border-t pt-4 ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Element Details
            </label>

            {/* Resource ID */}
            {selectedNode.data?.resourceId && (
                <DetailItem
                    icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
                    label="Resource ID"
                    value={selectedNode.data.resourceId}
                />
            )}

            {/* Text Content */}
            {selectedNode.data?.text && (
                <DetailItem
                    icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>}
                    label="Text Content"
                    value={`"${selectedNode.data.text}"`}
                />
            )}

            {/* Tap Coordinates */}
            {selectedNode.data?.coordinates && (selectedNode.data.coordinates.x || selectedNode.data.coordinates.y) && (
                <div className="mb-3">
                    <div className={`flex items-center gap-1.5 mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="text-[10px] font-semibold uppercase">Tap Coordinates</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className={`text-xs font-mono rounded-lg px-3 py-2 border ${isDark ? 'text-gray-300 bg-[#1a1a1a] border-[#2a2a2a]' : 'text-gray-700 bg-gray-50 border-gray-200'}`}>
                            X: {selectedNode.data.coordinates.x}
                        </div>
                        <div className={`text-xs font-mono rounded-lg px-3 py-2 border ${isDark ? 'text-gray-300 bg-[#1a1a1a] border-[#2a2a2a]' : 'text-gray-700 bg-gray-50 border-gray-200'}`}>
                            Y: {selectedNode.data.coordinates.y}
                        </div>
                    </div>
                </div>
            )}

            {/* Bounds */}
            {selectedNode.data?.bounds && (
                <DetailItem
                    icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" /></svg>}
                    label="Element Bounds"
                    value={typeof selectedNode.data.bounds === 'object' && selectedNode.data.bounds !== null
                        ? `${selectedNode.data.bounds.width ?? 0}×${selectedNode.data.bounds.height ?? 0} @ (${selectedNode.data.bounds.left ?? 0}, ${selectedNode.data.bounds.top ?? 0})`
                        : typeof selectedNode.data.bounds === 'string' ? selectedNode.data.bounds : 'N/A'}
                />
            )}

            {/* Package Name */}
            {selectedNode.data?.packageName && (
                <DetailItem
                    icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                    label="Package"
                    value={selectedNode.data.packageName}
                />
            )}

            {/* Class Name */}
            {selectedNode.data?.className && (
                <DetailItem
                    icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                    label="Class Name"
                    value={selectedNode.data.className}
                />
            )}

            {/* Content Description */}
            {selectedNode.data?.contentDescription && (
                <DetailItem
                    icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                    label="Content Description"
                    value={`"${selectedNode.data.contentDescription}"`}
                    colorClass={isDark ? 'text-green-300/90 bg-green-900/20 border-green-800/30' : 'text-green-700 bg-green-50 border-green-200'}
                />
            )}

            {/* Input Text */}
            {selectedNode.data?.inputText && (
                <DetailItem
                    icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                    label="Input Text"
                    value={`"${selectedNode.data.inputText}"`}
                    colorClass={isDark ? 'text-purple-300 bg-purple-900/20 border-purple-800/30' : 'text-purple-700 bg-purple-50 border-purple-200'}
                />
            )}

            {/* Accessibility Flags */}
            {(selectedNode.data?.isClickable !== undefined || selectedNode.data?.isEditable !== undefined || selectedNode.data?.isScrollable !== undefined) && (
                <div className="mb-3">
                    <div className={`flex items-center gap-1.5 mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-[10px] font-semibold uppercase">Element Flags</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {selectedNode.data?.isClickable && (
                            <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>Clickable</span>
                        )}
                        {selectedNode.data?.isEditable && (
                            <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>Editable</span>
                        )}
                        {selectedNode.data?.isScrollable && (
                            <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>Scrollable</span>
                        )}
                        {!selectedNode.data?.isClickable && !selectedNode.data?.isEditable && !selectedNode.data?.isScrollable && (
                            <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>No special flags</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
