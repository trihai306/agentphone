import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigSection } from '../shared';
import ElementPickerModal from '../../ElementPickerModal';

/**
 * GestureConfig - Configuration for drag_drop, pinch_zoom, fling actions
 * Supports both coordinate-based and element-based gestures
 */
export function GestureConfig({ data, updateData, updateMultipleData, isDark, nodeType, selectedDevice, userId }) {
    const [showPicker, setShowPicker] = useState(false);
    const [pickingFor, setPickingFor] = useState(null); // 'start' or 'end'
    const { t } = useTranslation();

    // Handler for element selection from picker
    const handleElementSelect = (element) => {
        const centerX = element.centerX || element.x || Math.round((element.bounds?.left + element.bounds?.right) / 2) || 0;
        const centerY = element.centerY || element.y || Math.round((element.bounds?.top + element.bounds?.bottom) / 2) || 0;

        if (pickingFor === 'start') {
            updateMultipleData({
                startX: centerX,
                startY: centerY,
                startElement: element.resourceId || element.text,
            });
        } else if (pickingFor === 'end') {
            updateMultipleData({
                endX: centerX,
                endY: centerY,
                endElement: element.resourceId || element.text,
            });
        } else if (pickingFor === 'center') {
            updateMultipleData({
                centerX: centerX,
                centerY: centerY,
            });
        }

        setShowPicker(false);
        setPickingFor(null);
    };

    const CoordinateInput = ({ label, xField, yField, onPickElement }) => (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
                {onPickElement && (
                    <button
                        onClick={onPickElement}
                        className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${isDark
                            ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30'
                            : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-600 border border-cyan-200'
                            }`}
                    >
                        📱 Pick Element
                    </button>
                )}
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>X</label>
                    <input
                        type="number"
                        value={data[xField] || ''}
                        onChange={(e) => updateData(xField, parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                    />
                </div>
                <div>
                    <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Y</label>
                    <input
                        type="number"
                        value={data[yField] || ''}
                        onChange={(e) => updateData(yField, parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                    />
                </div>
            </div>
        </div>
    );

    // ========== DRAG & DROP CONFIG ==========
    if (nodeType === 'drag_drop') {
        return (
            <>
                <ConfigSection title={t('flows.editor.config.drag_drop', { defaultValue: '🎯 Drag & Drop' })} isDark={isDark}>
                    <div className="space-y-4">
                        <CoordinateInput
                            label="Start Position"
                            xField="startX"
                            yField="startY"
                            onPickElement={() => { setPickingFor('start'); setShowPicker(true); }}
                        />

                        {/* Arrow indicator */}
                        <div className="flex justify-center">
                            <div className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${isDark ? 'bg-[#1a1a1a] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                                Drag to
                            </div>
                        </div>

                        <CoordinateInput
                            label="End Position"
                            xField="endX"
                            yField="endY"
                            onPickElement={() => { setPickingFor('end'); setShowPicker(true); }}
                        />
                    </div>
                </ConfigSection>

                <ConfigSection title={t('flows.editor.config.animation', { defaultValue: '⏱️ Animation' })} isDark={isDark}>
                    <div>
                        <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Duration (ms)
                        </label>
                        <input
                            type="number"
                            min="100"
                            max="5000"
                            step="100"
                            value={data.duration || 500}
                            onChange={(e) => updateData('duration', parseInt(e.target.value) || 500)}
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                        />
                        <div className="flex gap-1 mt-2">
                            {[200, 500, 1000, 2000].map(ms => (
                                <button
                                    key={ms}
                                    onClick={() => updateData('duration', ms)}
                                    className={`px-2 py-1 rounded text-[10px] transition-all ${data.duration === ms
                                        ? 'bg-indigo-500 text-white'
                                        : isDark
                                            ? 'bg-[#252525] hover:bg-[#2a2a2a] text-gray-400'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                        }`}
                                >
                                    {ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
                                </button>
                            ))}
                        </div>
                    </div>
                </ConfigSection>

                <ElementPickerModal
                    isOpen={showPicker}
                    onClose={() => { setShowPicker(false); setPickingFor(null); }}
                    onSelect={handleElementSelect}
                    deviceId={selectedDevice?.device_id}
                    userId={userId}
                    elementType="any"
                />
            </>
        );
    }

    // ========== PINCH ZOOM CONFIG ==========
    if (nodeType === 'pinch_zoom') {
        return (
            <>
                <ConfigSection title={t('flows.editor.config.pinch_zoom', { defaultValue: '🔍 Pinch Zoom' })} isDark={isDark}>
                    <div className="space-y-4">
                        {/* Direction */}
                        <div>
                            <label className={`block text-[10px] font-semibold uppercase mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Zoom Direction
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { value: 'in', label: '🔎 Zoom In', desc: 'Magnify' },
                                    { value: 'out', label: '🔍 Zoom Out', desc: 'Shrink' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => updateData('direction', opt.value)}
                                        className={`px-3 py-3 rounded-xl text-left transition-all border ${data.direction === opt.value
                                            ? 'border-violet-500 bg-violet-500/10'
                                            : isDark
                                                ? 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <span className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{opt.label}</span>
                                        <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{opt.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Scale Factor */}
                        <div>
                            <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Scale Factor
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="5"
                                step="0.5"
                                value={data.scale || 2}
                                onChange={(e) => updateData('scale', parseFloat(e.target.value) || 2)}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                            />
                            <div className="flex gap-1 mt-2">
                                {[1.5, 2, 2.5, 3].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => updateData('scale', s)}
                                        className={`px-2 py-1 rounded text-[10px] transition-all ${data.scale === s
                                            ? 'bg-violet-500 text-white'
                                            : isDark
                                                ? 'bg-[#252525] hover:bg-[#2a2a2a] text-gray-400'
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                            }`}
                                    >
                                        {s}×
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Center Point */}
                        <CoordinateInput
                            label="Center Point"
                            xField="centerX"
                            yField="centerY"
                            onPickElement={() => { setPickingFor('center'); setShowPicker(true); }}
                        />
                    </div>
                </ConfigSection>

                <ElementPickerModal
                    isOpen={showPicker}
                    onClose={() => { setShowPicker(false); setPickingFor(null); }}
                    onSelect={handleElementSelect}
                    deviceId={selectedDevice?.device_id}
                    userId={userId}
                    elementType="any"
                />
            </>
        );
    }

    // ========== FLING CONFIG ==========
    if (nodeType === 'fling') {
        return (
            <ConfigSection title={t('flows.editor.config.fling', { defaultValue: '💨 Fling Gesture' })} isDark={isDark}>
                <div className="space-y-4">
                    {/* Direction */}
                    <div>
                        <label className={`block text-[10px] font-semibold uppercase mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Fling Direction
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: 'up', label: '⬆️ Up', desc: 'Scroll down' },
                                { value: 'down', label: '⬇️ Down', desc: 'Scroll up' },
                                { value: 'left', label: '⬅️ Left', desc: 'Scroll right' },
                                { value: 'right', label: '➡️ Right', desc: 'Scroll left' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => updateData('direction', opt.value)}
                                    className={`px-3 py-2 rounded-xl text-left transition-all border ${data.direction === opt.value
                                        ? 'border-amber-500 bg-amber-500/10'
                                        : isDark
                                            ? 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <span className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{opt.label}</span>
                                    <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Velocity */}
                    <div>
                        <label className={`block text-[10px] font-semibold uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Velocity (pixels/sec)
                        </label>
                        <input
                            type="number"
                            min="1000"
                            max="20000"
                            step="500"
                            value={data.velocity || 5000}
                            onChange={(e) => updateData('velocity', parseInt(e.target.value) || 5000)}
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                        />
                        <div className="flex gap-1 mt-2">
                            {[
                                { value: 3000, label: 'Slow' },
                                { value: 5000, label: 'Normal' },
                                { value: 8000, label: 'Fast' },
                                { value: 15000, label: 'Very Fast' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => updateData('velocity', opt.value)}
                                    className={`px-2 py-1 rounded text-[10px] transition-all ${data.velocity === opt.value
                                        ? 'bg-amber-500 text-white'
                                        : isDark
                                            ? 'bg-[#252525] hover:bg-[#2a2a2a] text-gray-400'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Start Position (optional) */}
                    <div>
                        <label className={`block text-[10px] font-semibold uppercase mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Start Position (Optional)
                        </label>
                        <p className={`text-[10px] mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            Leave empty to use screen center
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <input
                                    type="number"
                                    value={data.startX || ''}
                                    onChange={(e) => updateData('startX', parseInt(e.target.value) || 0)}
                                    placeholder="Center"
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                                />
                            </div>
                            <div>
                                <input
                                    type="number"
                                    value={data.startY || ''}
                                    onChange={(e) => updateData('startY', parseInt(e.target.value) || 0)}
                                    placeholder="Center"
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </ConfigSection>
        );
    }

    return null;
}

export default GestureConfig;
