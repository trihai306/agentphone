import { useState } from 'react';

export default function ModelSelector({ type = 'image', models = [], value, onChange, disabled = false }) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedModel = models.find(m => m.id === value);

    return (
        <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Chọn AI Model
            </label>

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-2 rounded-xl transition-all ${disabled
                        ? 'border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-60'
                        : isOpen
                            ? 'border-purple-500 dark:border-purple-400'
                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                    }`}
            >
                <div className="flex-1 text-left">
                    {selectedModel ? (
                        <>
                            <div className="font-semibold text-gray-900 dark:text-white">
                                {selectedModel.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {selectedModel.credits_cost} credits/{type === 'image' ? 'ảnh' : 'giây'}
                            </div>
                        </>
                    ) : (
                        <span className="text-gray-400">Chọn model...</span>
                    )}
                </div>
                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && !disabled && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-96 overflow-auto">
                        {models.map((model) => (
                            <button
                                key={model.id}
                                type="button"
                                onClick={() => {
                                    onChange(model.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 ${value === model.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-gray-900 dark:text-white">
                                            {model.name}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {model.description}
                                        </div>
                                    </div>
                                    <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                        {model.credits_cost} credits
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
