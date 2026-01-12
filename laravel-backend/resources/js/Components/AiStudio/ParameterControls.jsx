export default function ParameterControls({ type = 'image', params, onChange, disabled = false }) {
    const updateParam = (key, value) => {
        onChange({ ...params, [key]: value });
    };

    if (type === 'image') {
        return (
            <div className="space-y-4">
                {/* Size */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Width
                        </label>
                        <select
                            value={params.width || 1024}
                            onChange={(e) => updateParam('width', parseInt(e.target.value))}
                            disabled={disabled}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:text-white"
                        >
                            <option value="512">512px</option>
                            <option value="768">768px</option>
                            <option value="1024">1024px</option>
                            <option value="1536">1536px</option>
                            <option value="2048">2048px</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Height
                        </label>
                        <select
                            value={params.height || 1024}
                            onChange={(e) => updateParam('height', parseInt(e.target.value))}
                            disabled={disabled}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:text-white"
                        >
                            <option value="512">512px</option>
                            <option value="768">768px</option>
                            <option value="1024">1024px</option>
                            <option value="1536">1536px</option>
                            <option value="2048">2048px</option>
                        </select>
                    </div>
                </div>

                {/* Steps */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Inference Steps: {params.num_inference_steps || 20}
                    </label>
                    <input
                        type="range"
                        min="10"
                        max="50"
                        value={params.num_inference_steps || 20}
                        onChange={(e) => updateParam('num_inference_steps', parseInt(e.target.value))}
                        disabled={disabled}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>Nhanh</span>
                        <span>Chất lượng cao</span>
                    </div>
                </div>

                {/* Negative Prompt */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Negative Prompt (Optional)
                    </label>
                    <input
                        type="text"
                        value={params.negative_prompt || ''}
                        onChange={(e) => updateParam('negative_prompt', e.target.value)}
                        placeholder="Những gì bạn không muốn thấy..."
                        disabled={disabled}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:text-white"
                    />
                </div>
            </div>
        );
    }

    // Video parameters
    return (
        <div className="space-y-4">
            {/* Duration */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration: {params.duration || 5}s
                </label>
                <input
                    type="range"
                    min="1"
                    max="10"
                    value={params.duration || 5}
                    onChange={(e) => updateParam('duration', parseInt(e.target.value))}
                    disabled={disabled}
                    className="w-full"
                />
            </div>

            {/* Resolution */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Resolution
                </label>
                <select
                    value={params.resolution || '720p'}
                    onChange={(e) => updateParam('resolution', e.target.value)}
                    disabled={disabled}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:text-white"
                >
                    <option value="576p">576p (1024x576)</option>
                    <option value="720p">720p (1280x720)</option>
                    <option value="1080p">1080p (1920x1080)</option>
                </select>
            </div>
        </div>
    );
}
