import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

/**
 * ScenarioTab - AI Scenario/Script to Scenes Component
 * 
 * Allows users to input a script/scenario, parse it into scenes using AI,
 * edit individual scene prompts, and generate all scenes as videos/images.
 */
export default function ScenarioTab({
    isDark,
    themeClasses,
    videoModels = [],
    imageModels = [],
    currentCredits = 0,
    onCreditsUpdate,
    addToast,
}) {
    const { t } = useTranslation();

    // States
    const [step, setStep] = useState('input'); // input, scenes, generating
    const [script, setScript] = useState('');
    const [outputType, setOutputType] = useState('video');
    const [model, setModel] = useState('');
    const [parsing, setParsing] = useState(false);
    const [scenes, setScenes] = useState([]);
    const [title, setTitle] = useState('');
    const [totalCredits, setTotalCredits] = useState(0);
    const [scenario, setScenario] = useState(null);
    const [editingScene, setEditingScene] = useState(null);
    const [settings, setSettings] = useState({
        resolution: '1080p',
        aspect_ratio: '16:9',
        generate_audio: true,
    });

    const models = outputType === 'video' ? videoModels : imageModels;

    // Set default model
    useEffect(() => {
        if (models.length > 0 && !model) {
            const defaultModel = models.find(m => m.enabled && !m.coming_soon) || models[0];
            setModel(defaultModel?.id || '');
        }
    }, [models, outputType]);

    // Parse script into scenes
    const handleParse = async () => {
        if (!script.trim() || script.length < 10) {
            addToast('Vui lòng nhập kịch bản (ít nhất 10 ký tự)', 'warning');
            return;
        }

        setParsing(true);
        try {
            const response = await axios.post('/ai-studio/scenarios/parse', {
                script,
                output_type: outputType,
            });

            if (response.data.success) {
                setScenes(response.data.data.scenes);
                setTitle(response.data.data.title || '');
                setStep('scenes');

                // Estimate credits
                await estimateCredits(response.data.data.scenes);
            }
        } catch (error) {
            addToast(error.response?.data?.error || 'Không thể phân tích kịch bản', 'error');
        } finally {
            setParsing(false);
        }
    };

    // Estimate total credits
    const estimateCredits = async (sceneList) => {
        if (!model || sceneList.length === 0) return;

        try {
            const response = await axios.post('/ai-studio/scenarios/estimate', {
                model,
                output_type: outputType,
                scenes: sceneList,
                settings,
            });

            if (response.data.success) {
                setTotalCredits(response.data.total_credits);
            }
        } catch (error) {
            console.error('Failed to estimate credits', error);
        }
    };

    // Save and generate all scenes
    const handleGenerate = async () => {
        if (scenes.length === 0) {
            addToast('Không có cảnh nào để tạo', 'warning');
            return;
        }

        if (currentCredits < totalCredits) {
            addToast(`Không đủ credits. Cần ${totalCredits}, hiện có ${currentCredits}`, 'warning');
            return;
        }

        if (!model) {
            addToast('Vui lòng chọn model', 'warning');
            return;
        }

        setStep('generating');

        try {
            // First, save the scenario
            const saveResponse = await axios.post('/ai-studio/scenarios', {
                script,
                title,
                output_type: outputType,
                model,
                scenes,
                settings,
            });

            if (saveResponse.data.success) {
                const savedScenario = saveResponse.data.scenario;
                setScenario(savedScenario);

                // Start generation
                const genResponse = await axios.post(`/ai-studio/scenarios/${savedScenario.id}/generate`);

                if (genResponse.data.success) {
                    setScenario(genResponse.data.scenario);
                    addToast('Đã bắt đầu tạo video cho tất cả các cảnh', 'success');

                    // Start polling
                    startPolling(savedScenario.id);
                }
            }
        } catch (error) {
            addToast(error.response?.data?.error || 'Không thể tạo kịch bản', 'error');
            setStep('scenes');
        }
    };

    // Poll for status updates
    const startPolling = (scenarioId) => {
        const pollInterval = setInterval(async () => {
            try {
                const response = await axios.get(`/ai-studio/scenarios/${scenarioId}/status`);

                if (response.data.success) {
                    const updatedScenario = response.data.scenario;
                    setScenario(updatedScenario);
                    setScenes(updatedScenario.scenes);

                    // Check if completed
                    if (['completed', 'failed', 'partial'].includes(updatedScenario.status)) {
                        clearInterval(pollInterval);
                        if (updatedScenario.status === 'completed') {
                            addToast('Tất cả các cảnh đã được tạo thành công!', 'success');
                        } else if (updatedScenario.status === 'partial') {
                            addToast('Một số cảnh tạo thất bại', 'warning');
                        }
                        onCreditsUpdate?.();
                    }
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 3000);

        // Store interval ID for cleanup
        return () => clearInterval(pollInterval);
    };

    // Update scene prompt
    const handleUpdateScene = (index, field, value) => {
        const updated = [...scenes];
        updated[index] = { ...updated[index], [field]: value };
        setScenes(updated);
    };

    // Reset to start
    const handleReset = () => {
        setStep('input');
        setScenes([]);
        setScenario(null);
        setScript('');
        setTitle('');
        setTotalCredits(0);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-4 mb-8">
                {['input', 'scenes', 'generating'].map((s, i) => (
                    <div key={s} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step === s
                                ? 'bg-violet-600 text-white'
                                : i < ['input', 'scenes', 'generating'].indexOf(step)
                                    ? isDark ? 'bg-violet-500/30 text-violet-300' : 'bg-violet-100 text-violet-700'
                                    : isDark ? 'bg-[#2a2a2a] text-slate-500' : 'bg-slate-100 text-slate-400'
                            }`}>
                            {i + 1}
                        </div>
                        <span className={`ml-2 text-sm font-medium ${step === s ? themeClasses.textPrimary : themeClasses.textMuted
                            }`}>
                            {s === 'input' ? 'Nhập kịch bản' : s === 'scenes' ? 'Xem & Chỉnh sửa' : 'Đang tạo'}
                        </span>
                        {i < 2 && (
                            <div className={`w-16 h-0.5 mx-4 ${i < ['input', 'scenes', 'generating'].indexOf(step)
                                    ? 'bg-violet-500'
                                    : isDark ? 'bg-[#2a2a2a]' : 'bg-slate-200'
                                }`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step 1: Input */}
            {step === 'input' && (
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className={`p-6 rounded-2xl ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-slate-200 shadow-sm'}`}>
                        <h2 className={`text-lg font-bold mb-4 ${themeClasses.textPrimary}`}>
                            📝 Nhập Kịch Bản
                        </h2>

                        {/* Output Type Toggle */}
                        <div className="mb-4">
                            <label className={`block text-sm font-semibold mb-2 ${themeClasses.textSecondary}`}>
                                Loại Output
                            </label>
                            <div className={`flex p-1 rounded-xl ${isDark ? 'bg-[#0a0a0a]' : 'bg-slate-100'}`}>
                                {['video', 'image'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => { setOutputType(type); setModel(''); }}
                                        className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${outputType === type
                                                ? isDark ? 'bg-[#2a2a2a] text-white shadow' : 'bg-white text-slate-900 shadow-md'
                                                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                                            }`}
                                    >
                                        {type === 'video' ? '🎬 Video' : '🖼️ Ảnh'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Model Selection */}
                        <div className="mb-4">
                            <label className={`block text-sm font-semibold mb-2 ${themeClasses.textSecondary}`}>
                                Model AI
                            </label>
                            <select
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors ${isDark
                                        ? 'bg-[#0a0a0a] border-[#2a2a2a] text-white'
                                        : 'bg-white border-slate-200 text-slate-900'
                                    }`}
                            >
                                {models.filter(m => m.enabled && !m.coming_soon).map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} ({m.credits_cost} credits/{outputType === 'video' ? 'sec' : 'ảnh'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Script Input */}
                        <div className="mb-4">
                            <label className={`block text-sm font-semibold mb-2 ${themeClasses.textSecondary}`}>
                                Kịch Bản
                            </label>
                            <textarea
                                value={script}
                                onChange={(e) => setScript(e.target.value)}
                                placeholder="Nhập kịch bản của bạn... AI sẽ phân tích và chia thành các cảnh riêng biệt để tạo video/ảnh.

Ví dụ:
Cảnh 1: Một buổi sáng đẹp trời, ánh nắng chiếu qua cửa sổ phòng ngủ.
Cảnh 2: Một cô gái tỉnh dậy, vươn vai và mỉm cười.
Cảnh 3: Cô ấy đi ra ban công, ngắm nhìn thành phố từ trên cao..."
                                rows={10}
                                className={`w-full px-4 py-3 rounded-xl border text-sm resize-none transition-colors ${isDark
                                        ? 'bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder-slate-500'
                                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                                    }`}
                            />
                            <p className={`mt-2 text-xs ${themeClasses.textMuted}`}>
                                Tối thiểu 10 ký tự, tối đa 10,000 ký tự. AI sẽ chia thành tối đa 10 cảnh.
                            </p>
                        </div>

                        {/* Parse Button */}
                        <button
                            onClick={handleParse}
                            disabled={parsing || script.length < 10}
                            className={`w-full py-4 rounded-xl font-semibold text-base transition-all ${!parsing && script.length >= 10
                                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/30'
                                    : isDark ? 'bg-[#2a2a2a] text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            {parsing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang phân tích...
                                </span>
                            ) : (
                                '✨ Phân tích kịch bản'
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Scenes */}
            {step === 'scenes' && (
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Title */}
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-slate-200'}`}>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Tiêu đề kịch bản (tùy chọn)"
                            className={`w-full text-lg font-bold bg-transparent border-none focus:outline-none ${themeClasses.textPrimary}`}
                        />
                    </div>

                    {/* Scenes List */}
                    <div className="space-y-4">
                        {scenes.map((scene, index) => (
                            <div
                                key={scene.order}
                                className={`p-5 rounded-xl transition-all ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-slate-200 shadow-sm'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Scene Number */}
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-violet-600/20 text-violet-400' : 'bg-violet-100 text-violet-600'
                                        }`}>
                                        <span className="font-bold">{scene.order}</span>
                                    </div>

                                    {/* Scene Content */}
                                    <div className="flex-1 space-y-3">
                                        {/* Description */}
                                        <div>
                                            <label className={`text-xs font-semibold uppercase tracking-wide ${themeClasses.textMuted}`}>
                                                Mô tả
                                            </label>
                                            <p className={`mt-1 ${themeClasses.textSecondary}`}>
                                                {scene.description}
                                            </p>
                                        </div>

                                        {/* Prompt (Editable) */}
                                        <div>
                                            <label className={`text-xs font-semibold uppercase tracking-wide ${themeClasses.textMuted}`}>
                                                Prompt (có thể chỉnh sửa)
                                            </label>
                                            <textarea
                                                value={scene.prompt}
                                                onChange={(e) => handleUpdateScene(index, 'prompt', e.target.value)}
                                                rows={3}
                                                className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm resize-none ${isDark
                                                        ? 'bg-[#0a0a0a] border-[#2a2a2a] text-white'
                                                        : 'bg-slate-50 border-slate-200 text-slate-900'
                                                    }`}
                                            />
                                        </div>

                                        {/* Duration (for video) */}
                                        {outputType === 'video' && (
                                            <div className="flex items-center gap-3">
                                                <label className={`text-xs font-semibold ${themeClasses.textMuted}`}>
                                                    Thời lượng:
                                                </label>
                                                <select
                                                    value={scene.duration || 6}
                                                    onChange={(e) => handleUpdateScene(index, 'duration', parseInt(e.target.value))}
                                                    className={`px-3 py-1.5 rounded-lg border text-sm ${isDark
                                                            ? 'bg-[#0a0a0a] border-[#2a2a2a] text-white'
                                                            : 'bg-white border-slate-200 text-slate-900'
                                                        }`}
                                                >
                                                    {[4, 5, 6, 7, 8].map((d) => (
                                                        <option key={d} value={d}>{d}s</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary & Actions */}
                    <div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className={themeClasses.textSecondary}>
                                    <span className="font-bold">{scenes.length}</span> cảnh
                                </p>
                            </div>
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isDark ? 'bg-[#0a0a0a]' : 'bg-slate-50'
                                }`}>
                                <span className="text-lg">✨</span>
                                <span className={`font-bold ${themeClasses.textPrimary}`}>{totalCredits.toLocaleString()}</span>
                                <span className={themeClasses.textMuted}>credits</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleReset}
                                className={`px-6 py-3 rounded-xl font-medium transition-colors ${isDark
                                        ? 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                ← Quay lại
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={currentCredits < totalCredits}
                                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${currentCredits >= totalCredits
                                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/30'
                                        : isDark ? 'bg-[#2a2a2a] text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                🚀 Tạo {scenes.length} {outputType === 'video' ? 'video' : 'ảnh'}
                            </button>
                        </div>

                        {currentCredits < totalCredits && (
                            <p className="mt-3 text-sm text-rose-500 text-center">
                                Không đủ credits. Cần thêm {(totalCredits - currentCredits).toLocaleString()} credits.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Step 3: Generating */}
            {step === 'generating' && scenario && (
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Progress Header */}
                    <div className={`p-6 rounded-xl text-center ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-slate-200'}`}>
                        <h2 className={`text-xl font-bold mb-2 ${themeClasses.textPrimary}`}>
                            {scenario.status === 'generating' ? '🎬 Đang tạo...' :
                                scenario.status === 'completed' ? '✅ Hoàn thành!' :
                                    scenario.status === 'partial' ? '⚠️ Hoàn thành một phần' : '❌ Thất bại'}
                        </h2>
                        <p className={themeClasses.textSecondary}>
                            {scenario.completed_scenes} / {scenario.total_scenes} cảnh đã hoàn thành
                        </p>

                        {/* Progress Bar */}
                        <div className={`mt-4 h-3 rounded-full overflow-hidden ${isDark ? 'bg-[#2a2a2a]' : 'bg-slate-200'}`}>
                            <div
                                className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500"
                                style={{ width: `${scenario.progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Scenes Status */}
                    <div className="space-y-3">
                        {scenes.map((scene) => (
                            <div
                                key={scene.id}
                                className={`p-4 rounded-xl flex items-center gap-4 ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-slate-200'
                                    }`}
                            >
                                {/* Status Icon */}
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${scene.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                        scene.status === 'generating' ? 'bg-amber-500/20 text-amber-400' :
                                            scene.status === 'failed' ? 'bg-rose-500/20 text-rose-400' :
                                                isDark ? 'bg-[#2a2a2a] text-slate-500' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {scene.status === 'completed' ? '✓' :
                                        scene.status === 'generating' ? (
                                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                            </svg>
                                        ) :
                                            scene.status === 'failed' ? '✕' : scene.order}
                                </div>

                                {/* Scene Info */}
                                <div className="flex-1 min-w-0">
                                    <p className={`font-medium truncate ${themeClasses.textPrimary}`}>
                                        Cảnh {scene.order}: {scene.description}
                                    </p>
                                    {scene.error_message && (
                                        <p className="text-sm text-rose-500 mt-1">{scene.error_message}</p>
                                    )}
                                </div>

                                {/* Preview/Action */}
                                {scene.status === 'completed' && scene.result_url && (
                                    <a
                                        href={scene.result_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 transition-colors"
                                    >
                                        Xem
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    {scenario.status !== 'generating' && (
                        <div className="flex justify-center">
                            <button
                                onClick={handleReset}
                                className={`px-8 py-3 rounded-xl font-medium transition-colors ${isDark
                                        ? 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                Tạo kịch bản mới
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
