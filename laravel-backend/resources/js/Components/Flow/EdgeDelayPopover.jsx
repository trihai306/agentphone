import React, { useState, useEffect } from 'react';

/**
 * Popover component for configuring edge delay time
 * Appears when user clicks on an edge in the workflow editor
 */
export default function EdgeDelayPopover({
    isOpen,
    onClose,
    onSave,
    position,
    initialDelay = { mode: 'none', fixedSeconds: 1, minSeconds: 1, maxSeconds: 3 }
}) {
    const [mode, setMode] = useState(initialDelay.mode);
    const [fixedSeconds, setFixedSeconds] = useState(initialDelay.fixedSeconds);
    const [minSeconds, setMinSeconds] = useState(initialDelay.minSeconds);
    const [maxSeconds, setMaxSeconds] = useState(initialDelay.maxSeconds);

    useEffect(() => {
        if (isOpen) {
            setMode(initialDelay.mode);
            setFixedSeconds(initialDelay.fixedSeconds);
            setMinSeconds(initialDelay.minSeconds);
            setMaxSeconds(initialDelay.maxSeconds);
        }
    }, [isOpen, initialDelay]);

    const handleSave = () => {
        onSave({
            mode,
            fixedSeconds: parseFloat(fixedSeconds) || 1,
            minSeconds: parseFloat(minSeconds) || 1,
            maxSeconds: parseFloat(maxSeconds) || 3,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed z-[9999] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 min-w-[280px]"
            style={{
                left: position?.x || 100,
                top: position?.y || 100,
                transform: 'translate(-50%, -100%)',
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                    <span>⏱️</span>
                    Delay Time
                </h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    ✕
                </button>
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
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {/* Fixed Delay Input */}
            {mode === 'fixed' && (
                <div className="mb-4">
                    <label className="block text-gray-400 text-xs mb-2">
                        Delay (seconds)
                    </label>
                    <input
                        type="number"
                        min="0.1"
                        max="300"
                        step="0.1"
                        value={fixedSeconds}
                        onChange={(e) => setFixedSeconds(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    />
                </div>
            )}

            {/* Random Range Inputs */}
            {mode === 'random' && (
                <div className="mb-4">
                    <label className="block text-gray-400 text-xs mb-2">
                        Random Range (seconds)
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min="0.1"
                            max="300"
                            step="0.1"
                            value={minSeconds}
                            onChange={(e) => setMinSeconds(e.target.value)}
                            placeholder="Min"
                            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                        />
                        <span className="text-gray-500">—</span>
                        <input
                            type="number"
                            min="0.1"
                            max="300"
                            step="0.1"
                            value={maxSeconds}
                            onChange={(e) => setMaxSeconds(e.target.value)}
                            placeholder="Max"
                            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                        />
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                        Will wait {minSeconds}-{maxSeconds}s randomly
                    </p>
                </div>
            )}

            {/* Preview */}
            {mode !== 'none' && (
                <div className="bg-gray-800/50 rounded-lg px-3 py-2 mb-4 text-center">
                    <span className="text-indigo-400 text-sm font-medium">
                        ⏱️ {mode === 'fixed' ? `${fixedSeconds}s` : `${minSeconds}-${maxSeconds}s`}
                    </span>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors"
                >
                    Apply
                </button>
            </div>
        </div>
    );
}
