import React, { useState, useEffect } from 'react';
import { Button } from '@/Components/UI';

/**
 * Popover component for configuring edge delay time
 * Appears when user clicks on an edge in the workflow editor
 * 
 * Uses milliseconds (ms) for consistency with rest of system
 */
export default function EdgeDelayPopover({
    isOpen,
    onClose,
    onSave,
    position,
    isDark = true,
    initialDelay = { mode: 'none', fixedMs: 500, minMs: 500, maxMs: 1500 }
}) {
    const [mode, setMode] = useState(initialDelay.mode);
    const [fixedMs, setFixedMs] = useState(initialDelay.fixedMs);
    const [minMs, setMinMs] = useState(initialDelay.minMs);
    const [maxMs, setMaxMs] = useState(initialDelay.maxMs);

    useEffect(() => {
        if (isOpen) {
            setMode(initialDelay.mode);
            setFixedMs(initialDelay.fixedMs);
            setMinMs(initialDelay.minMs);
            setMaxMs(initialDelay.maxMs);
        }
    }, [isOpen, initialDelay]);

    const handleSave = () => {
        onSave({
            mode,
            fixedMs: parseInt(fixedMs) || 500,
            minMs: parseInt(minMs) || 500,
            maxMs: parseInt(maxMs) || 1500,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed z-[9999] border rounded-xl shadow-2xl p-4 min-w-[280px] ${isDark
                ? 'bg-gray-900 border-gray-700'
                : 'bg-white border-gray-200'
                }`}
            style={{
                left: position?.x || 100,
                top: position?.y || 100,
                transform: 'translate(-50%, -100%)',
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                    <span>⏱️</span>
                    Delay Time
                </h3>
                <Button variant="ghost" size="icon-xs" onClick={onClose}>
                    ✕
                </Button>
            </div>

            {/* Mode Selection */}
            <div className="flex gap-2 mb-4">
                {[
                    { value: 'none', label: 'None' },
                    { value: 'fixed', label: 'Fixed' },
                    { value: 'random', label: 'Random' },
                ].map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setMode(option.value)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${mode === option.value
                            ? 'bg-indigo-500 text-white'
                            : isDark
                                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {/* Fixed Delay Input */}
            {mode === 'fixed' && (
                <div className="mb-4">
                    <label className={`block text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Delay (ms)
                    </label>
                    <input
                        type="number"
                        min="100"
                        max="300000"
                        step="100"
                        value={fixedMs}
                        onChange={(e) => setFixedMs(e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none ${isDark
                            ? 'bg-gray-800 border-gray-600 text-white'
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                            }`}
                    />
                </div>
            )}

            {/* Random Range Inputs */}
            {mode === 'random' && (
                <div className="mb-4">
                    <label className={`block text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Random Range (ms)
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min="100"
                            max="300000"
                            step="100"
                            value={minMs}
                            onChange={(e) => setMinMs(e.target.value)}
                            placeholder="Min"
                            className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none ${isDark
                                ? 'bg-gray-800 border-gray-600 text-white'
                                : 'bg-gray-50 border-gray-300 text-gray-900'
                                }`}
                        />
                        <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>—</span>
                        <input
                            type="number"
                            min="100"
                            max="300000"
                            step="100"
                            value={maxMs}
                            onChange={(e) => setMaxMs(e.target.value)}
                            placeholder="Max"
                            className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none ${isDark
                                ? 'bg-gray-800 border-gray-600 text-white'
                                : 'bg-gray-50 border-gray-300 text-gray-900'
                                }`}
                        />
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Will wait {minMs}-{maxMs}ms randomly
                    </p>
                </div>
            )}

            {/* Preview */}
            {mode !== 'none' && (
                <div className={`rounded-lg px-3 py-2 mb-4 text-center ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'
                    }`}>
                    <span className="text-indigo-500 text-sm font-medium">
                        ⏱️ {mode === 'fixed' ? `${fixedMs}ms` : `${minMs}-${maxMs}ms`}
                    </span>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={onClose}>
                    Cancel
                </Button>
                <Button variant="gradient" className="flex-1" onClick={handleSave}>
                    Apply
                </Button>
            </div>
        </div>
    );
}
