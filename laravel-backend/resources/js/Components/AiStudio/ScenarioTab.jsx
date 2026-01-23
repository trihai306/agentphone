import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

/**
 * ScenarioTab - AI Scenario/Script to Scenes Component
 * 
 * Enhanced version with:
 * - Extended duration slider (4-15s)
 * - Audio settings panel
 * - Improved scene cards with status indicators
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
    const [inputMode, setInputMode] = useState('text'); // 'text' or 'images'
    const [script, setScript] = useState('');
    const [sourceImages, setSourceImages] = useState([]); // Array of {file, preview, description}
    const [outputType, setOutputType] = useState('video');
    const [model, setModel] = useState('');
    const [parsing, setParsing] = useState(false);
    const [scenes, setScenes] = useState([]);
    const [title, setTitle] = useState('');
    const [totalCredits, setTotalCredits] = useState(0);
    const [scenario, setScenario] = useState(null);
    const [settings, setSettings] = useState({
        resolution: '1080p',
        aspect_ratio: '16:9',
        generate_audio: true,
        audio_style: 'natural', // natural, dramatic, upbeat
        background_music: false,
        music_style: 'none', // none, ambient, upbeat, dramatic, cinematic
    });
    const [totalCredits, setTotalCredits] = useState(0);
    const [scenario, setScenario] = useState(null);
    const [settings, setSettings] = useState({
        resolution: '1080p',
        aspect_ratio: '16:9',
        generate_audio: true,
        audio_style: 'natural', // natural, dramatic, upbeat
        background_music: false,
        music_style: 'none', // none, ambient, upbeat, dramatic, cinematic
    });

    const models = outputType === 'video' ? videoModels : imageModels;
    const selectedModel = models.find(m => m.id === model);

    // Duration config (extended range)
    const MIN_DURATION = 4;
    const MAX_DURATION = 15;
    const DEFAULT_DURATION = 6;

    // Audio style options
    const audioStyles = [
        { id: 'natural', label: '🎙️ Tự nhiên', desc: 'Voice và sound effects tự nhiên' },
        { id: 'dramatic', label: '🎭 Kịch tính', desc: 'Âm thanh sống động, cuốn hút' },
        { id: 'upbeat', label: '⚡ Năng động', desc: 'Nhịp độ nhanh, tràn đầy năng lượng' },
    ];

    // Background music options
    const musicStyles = [
        { id: 'none', label: 'Không nhạc nền' },
        { id: 'ambient', label: '🌊 Ambient' },
        { id: 'upbeat', label: '🎵 Upbeat' },
        { id: 'dramatic', label: '🎬 Cinematic' },
        { id: 'lo-fi', label: '🎧 Lo-Fi' },
    ];

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

    // Re-estimate when settings change
    useEffect(() => {
        if (scenes.length > 0) {
            estimateCredits(scenes);
        }
    }, [settings, scenes]);
    // Convert file to base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
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
            // Prepare scenes with base64 images
            const scenesWithImages = await Promise.all(scenes.map(async (scene) => {
                const sceneData = {
                    order: scene.order,
                    description: scene.description,
                    prompt: scene.prompt,
                    duration: scene.duration,
                };

                // Convert image to base64 if present
                if (scene.image && scene.image instanceof File) {
                    sceneData.source_image = await fileToBase64(scene.image);
                }

                return sceneData;
            }));

            // Save the scenario with images
            const saveResponse = await axios.post('/ai-studio/scenarios', {
                script,
                title,
                output_type: outputType,
                model,
                scenes: scenesWithImages,
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

    // Calculate total duration
    const getTotalDuration = () => {
        return scenes.reduce((acc, s) => acc + (s.duration || DEFAULT_DURATION), 0);
    };

    // Format duration
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins === 0) return `${secs}s`;
        return `${mins}m ${secs}s`;
    };

    // Get status icon and color
    const getStatusStyle = (status) => {
        switch (status) {
            case 'completed':
                return { icon: '✓', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
            case 'generating':
                return { icon: '⏳', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
            case 'failed':
                return { icon: '✕', bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' };
            default:
                return { icon: '○', bg: isDark ? 'bg-[#2a2a2a]' : 'bg-slate-100', text: isDark ? 'text-slate-500' : 'text-slate-400', border: 'border-transparent' };
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-4 mb-8">
                {['input', 'scenes', 'generating'].map((s, i) => (
                    <div key={s} className="flex items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all shadow-lg ${step === s
                            ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white'
                            : i < ['input', 'scenes', 'generating'].indexOf(step)
                                ? isDark ? 'bg-violet-500/30 text-violet-300' : 'bg-violet-100 text-violet-700'
                                : isDark ? 'bg-[#2a2a2a] text-slate-500' : 'bg-slate-100 text-slate-400'
                            }`}>
                            {i < ['input', 'scenes', 'generating'].indexOf(step) ? '✓' : i + 1}
                        </div>
                        <span className={`ml-3 text-sm font-medium hidden sm:inline ${step === s ? themeClasses.textPrimary : themeClasses.textMuted}`}>
                            {s === 'input' ? 'Nhập kịch bản' : s === 'scenes' ? 'Chỉnh sửa cảnh' : 'Đang tạo'}
                        </span>
                        {i < 2 && (
                            <div className={`w-12 h-0.5 mx-4 rounded-full ${i < ['input', 'scenes', 'generating'].indexOf(step)
                                ? 'bg-gradient-to-r from-violet-500 to-indigo-500'
                                : isDark ? 'bg-[#2a2a2a]' : 'bg-slate-200'
                                }`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step 1: Input */}
            {step === 'input' && (
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Input Panel */}
                        <div className={`lg:col-span-2 p-6 rounded-2xl ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-slate-200 shadow-sm'}`}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-violet-600/30 to-indigo-600/30' : 'bg-gradient-to-br from-violet-100 to-indigo-100'}`}>
                                    <span className="text-xl">📝</span>
                                </div>
                                <div>
                                    <h2 className={`text-lg font-bold ${themeClasses.textPrimary}`}>Nhập Kịch Bản</h2>
                                    <p className={`text-xs ${themeClasses.textMuted}`}>AI sẽ tự động chia thành các cảnh</p>
                                </div>
                            </div>

                            {/* Script Input */}
                            <textarea
                                value={script}
                                onChange={(e) => setScript(e.target.value)}
                                placeholder="Nhập kịch bản của bạn tại đây...

Ví dụ:
Cảnh 1: Một buổi sáng đẹp trời, ánh nắng chiếu qua cửa sổ phòng ngủ.
Cảnh 2: Một cô gái tỉnh dậy, vươn vai và mỉm cười.
Cảnh 3: Cô ấy đi ra ban công, ngắm nhìn thành phố từ trên cao.

💡 Mẹo: Mô tả chi tiết từng cảnh, AI sẽ tự động tạo prompt cho mỗi cảnh."
                                rows={12}
                                className={`w-full px-4 py-4 rounded-xl border text-sm resize-none transition-all focus:outline-none focus:ring-2 ${isDark
                                    ? 'bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder-slate-500 focus:border-violet-500 focus:ring-violet-500/20'
                                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-400 focus:ring-violet-400/20'
                                    }`}
                            />

                            <div className="flex items-center justify-between mt-3">
                                <p className={`text-xs ${themeClasses.textMuted}`}>
                                    {script.length}/10,000 ký tự
                                </p>
                                <p className={`text-xs ${script.length >= 10 ? 'text-emerald-500' : themeClasses.textMuted}`}>
                                    {script.length >= 10 ? '✓ Đủ độ dài' : 'Tối thiểu 10 ký tự'}
                                </p>
                            </div>
                        </div>

                        {/* Settings Panel */}
                        <div className="space-y-4">
                            {/* Output Type */}
                            <div className={`p-5 rounded-2xl ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-slate-200 shadow-sm'}`}>
                                <label className={`block text-xs font-semibold mb-3 uppercase tracking-wide ${themeClasses.textMuted}`}>
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
                            <div className={`p-5 rounded-2xl ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-slate-200 shadow-sm'}`}>
                                <label className={`block text-xs font-semibold mb-3 uppercase tracking-wide ${themeClasses.textMuted}`}>
                                    Model AI
                                </label>
                                <select
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors ${isDark
                                        ? 'bg-[#0a0a0a] border-[#2a2a2a] text-white'
                                        : 'bg-slate-50 border-slate-200 text-slate-900'
                                        }`}
                                >
                                    {models.filter(m => m.enabled && !m.coming_soon).map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} ({m.credits_cost} credits/{outputType === 'video' ? 'sec' : 'ảnh'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Audio Settings (Video only) */}
                            {outputType === 'video' && (
                                <div className={`p-5 rounded-2xl ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-slate-200 shadow-sm'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <label className={`text-xs font-semibold uppercase tracking-wide ${themeClasses.textMuted}`}>
                                            🔊 Audio Settings
                                        </label>
                                        <button
                                            onClick={() => setSettings(s => ({ ...s, generate_audio: !s.generate_audio }))}
                                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${settings.generate_audio
                                                ? 'bg-violet-600'
                                                : isDark ? 'bg-[#2a2a2a]' : 'bg-slate-300'
                                                }`}
                                        >
                                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${settings.generate_audio ? 'translate-x-5' : 'translate-x-0'
                                                }`} />
                                        </button>
                                    </div>

                                    {settings.generate_audio && (
                                        <div className="space-y-3">
                                            {/* Audio Style */}
                                            <div className="grid grid-cols-3 gap-2">
                                                {audioStyles.map((style) => (
                                                    <button
                                                        key={style.id}
                                                        onClick={() => setSettings(s => ({ ...s, audio_style: style.id }))}
                                                        className={`py-2 px-2 text-xs font-medium rounded-lg transition-all border ${settings.audio_style === style.id
                                                            ? isDark ? 'bg-violet-600/20 text-violet-300 border-violet-500/50' : 'bg-violet-100 text-violet-700 border-violet-300'
                                                            : isDark ? 'bg-[#0a0a0a] text-slate-400 border-[#2a2a2a]' : 'bg-slate-50 text-slate-600 border-slate-200'
                                                            }`}
                                                    >
                                                        {style.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Background Music Toggle */}
                                            <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${isDark ? 'bg-[#0a0a0a]' : 'bg-slate-50'}`}>
                                                <span className={`text-xs ${themeClasses.textSecondary}`}>🎵 Nhạc nền</span>
                                                <select
                                                    value={settings.music_style}
                                                    onChange={(e) => setSettings(s => ({ ...s, music_style: e.target.value }))}
                                                    className={`text-xs px-2 py-1 rounded-md border ${isDark
                                                        ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white'
                                                        : 'bg-white border-slate-200 text-slate-900'
                                                        }`}
                                                >
                                                    {musicStyles.map((m) => (
                                                        <option key={m.id} value={m.id}>{m.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Parse Button */}
                    <div className="mt-6 max-w-4xl mx-auto">
                        <button
                            onClick={handleParse}
                            disabled={parsing || script.length < 10}
                            className={`w-full py-4 rounded-xl font-semibold text-base transition-all ${!parsing && script.length >= 10
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/30 active:scale-[0.99]'
                                : isDark ? 'bg-[#2a2a2a] text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            {parsing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang phân tích với AI...
                                </span>
                            ) : (
                                <>✨ Phân tích kịch bản</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Scenes */}
            {step === 'scenes' && (
                <div className="max-w-5xl mx-auto">
                    {/* Title Input */}
                    <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-slate-200'}`}>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Tiêu đề kịch bản (tùy chọn)"
                            className={`w-full text-lg font-bold bg-transparent border-none focus:outline-none ${themeClasses.textPrimary}`}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Scenes List */}
                        <div className="lg:col-span-2 space-y-4">
                            {scenes.map((scene, index) => (
                                <div
                                    key={scene.order}
                                    className={`p-5 rounded-2xl transition-all ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a]' : 'bg-white border border-slate-200 hover:border-slate-300 shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Scene Number */}
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-gradient-to-br from-violet-600/20 to-indigo-600/20 text-violet-400' : 'bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600'
                                            }`}>
                                            <span className="text-lg font-bold">{scene.order}</span>
                                        </div>

                                        {/* Scene Content */}
                                        <div className="flex-1 min-w-0 space-y-3">
                                            {/* Description */}
                                            <p className={`text-sm ${themeClasses.textSecondary}`}>
                                                {scene.description}
                                            </p>

                                            {/* Prompt (Editable) */}
                                            <div>
                                                <label className={`text-xs font-semibold uppercase tracking-wide ${themeClasses.textMuted}`}>
                                                    Prompt (có thể chỉnh sửa)
                                                </label>
                                                <textarea
                                                    value={scene.prompt}
                                                    onChange={(e) => handleUpdateScene(index, 'prompt', e.target.value)}
                                                    rows={2}
                                                    className={`mt-1 w-full px-3 py-2.5 rounded-xl border text-sm resize-none transition-all focus:outline-none focus:ring-2 ${isDark
                                                        ? 'bg-[#0a0a0a] border-[#2a2a2a] text-white focus:border-violet-500 focus:ring-violet-500/20'
                                                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-violet-400 focus:ring-violet-400/20'
                                                        }`}
                                                />
                                            </div>

                                            {/* Duration (for video) */}
                                            {outputType === 'video' && (
                                                <div className={`flex items-center gap-4 p-3 rounded-xl ${isDark ? 'bg-[#0a0a0a]' : 'bg-slate-50'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-medium ${themeClasses.textMuted}`}>⏱️ Thời lượng:</span>
                                                        <span className={`text-sm font-bold ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                                                            {scene.duration || DEFAULT_DURATION}s
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min={MIN_DURATION}
                                                        max={MAX_DURATION}
                                                        value={scene.duration || DEFAULT_DURATION}
                                                        onChange={(e) => handleUpdateScene(index, 'duration', parseInt(e.target.value))}
                                                        className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                                                        style={{
                                                            background: `linear-gradient(to right, ${isDark ? '#8b5cf6' : '#7c3aed'} 0%, ${isDark ? '#8b5cf6' : '#7c3aed'} ${((scene.duration || DEFAULT_DURATION) - MIN_DURATION) / (MAX_DURATION - MIN_DURATION) * 100}%, ${isDark ? '#1a1a1a' : '#e2e8f0'} ${((scene.duration || DEFAULT_DURATION) - MIN_DURATION) / (MAX_DURATION - MIN_DURATION) * 100}%, ${isDark ? '#1a1a1a' : '#e2e8f0'} 100%)`
                                                        }}
                                                    />
                                                    <span className={`text-xs ${themeClasses.textMuted}`}>{MAX_DURATION}s</span>
                                                </div>
                                            )}

                                            {/* Reference Image Upload (for video) */}
                                            {outputType === 'video' && (
                                                <div className={`p-3 rounded-xl border-2 border-dashed transition-all ${scene.image
                                                    ? isDark ? 'border-violet-500/50 bg-violet-600/5' : 'border-violet-400 bg-violet-50/50'
                                                    : isDark ? 'border-[#2a2a2a] hover:border-[#3a3a3a]' : 'border-slate-200 hover:border-slate-300'
                                                    }`}>
                                                    {scene.image ? (
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={scene.imagePreview || URL.createObjectURL(scene.image)}
                                                                alt="Reference"
                                                                className="w-16 h-16 object-cover rounded-lg"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-xs font-medium ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                                                                    📸 Ảnh tham chiếu
                                                                </p>
                                                                <p className={`text-xs truncate ${themeClasses.textMuted}`}>
                                                                    {scene.image.name || 'Reference image'}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleUpdateScene(index, 'image', null)}
                                                                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-rose-500/20 text-rose-400' : 'hover:bg-rose-100 text-rose-500'}`}
                                                                title="Xóa ảnh"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className="flex items-center gap-3 cursor-pointer">
                                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-slate-100'}`}>
                                                                <span className="text-xl">🖼️</span>
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className={`text-xs font-medium ${themeClasses.textSecondary}`}>
                                                                    Thêm ảnh tham chiếu (tùy chọn)
                                                                </p>
                                                                <p className={`text-xs ${themeClasses.textMuted}`}>
                                                                    Video sẽ được tạo dựa trên ảnh này
                                                                </p>
                                                            </div>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    if (file) {
                                                                        handleUpdateScene(index, 'image', file);
                                                                        handleUpdateScene(index, 'imagePreview', URL.createObjectURL(file));
                                                                    }
                                                                }}
                                                            />
                                                            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-[#2a2a2a] text-white' : 'bg-slate-100 text-slate-700'}`}>
                                                                Chọn ảnh
                                                            </span>
                                                        </label>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary Sidebar */}
                        <div className="lg:col-span-1">
                            <div className={`sticky top-24 p-5 rounded-2xl ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-slate-200 shadow-sm'}`}>
                                <h3 className={`text-sm font-bold mb-4 ${themeClasses.textPrimary}`}>📊 Tổng quan</h3>

                                <div className="space-y-3">
                                    {/* Scenes count */}
                                    <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-[#0a0a0a]' : 'bg-slate-50'}`}>
                                        <span className={`text-xs ${themeClasses.textMuted}`}>Số cảnh</span>
                                        <span className={`text-sm font-bold ${themeClasses.textPrimary}`}>{scenes.length} cảnh</span>
                                    </div>

                                    {/* Total duration */}
                                    {outputType === 'video' && (
                                        <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-[#0a0a0a]' : 'bg-slate-50'}`}>
                                            <span className={`text-xs ${themeClasses.textMuted}`}>Tổng thời lượng</span>
                                            <span className={`text-sm font-bold ${themeClasses.textPrimary}`}>{formatDuration(getTotalDuration())}</span>
                                        </div>
                                    )}

                                    {/* Audio settings */}
                                    {outputType === 'video' && (
                                        <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-[#0a0a0a]' : 'bg-slate-50'}`}>
                                            <span className={`text-xs ${themeClasses.textMuted}`}>Audio</span>
                                            <span className={`text-sm font-medium ${settings.generate_audio ? 'text-emerald-500' : themeClasses.textMuted}`}>
                                                {settings.generate_audio ? '🔊 Bật' : '🔇 Tắt'}
                                            </span>
                                        </div>
                                    )}

                                    {/* Credits */}
                                    <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border border-violet-500/20' : 'bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200'}`}>
                                        <span className={`text-xs font-medium ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>✨ Tổng credits</span>
                                        <span className={`text-lg font-bold ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>{totalCredits.toLocaleString()}</span>
                                    </div>

                                    {/* Credit balance check */}
                                    {currentCredits < totalCredits && (
                                        <div className={`p-3 rounded-xl ${isDark ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-rose-50 border border-rose-200'}`}>
                                            <p className="text-xs text-rose-500 text-center">
                                                ⚠️ Cần thêm {(totalCredits - currentCredits).toLocaleString()} credits
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-6 space-y-3">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={currentCredits < totalCredits}
                                        className={`w-full py-3.5 rounded-xl font-semibold transition-all ${currentCredits >= totalCredits
                                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/30'
                                            : isDark ? 'bg-[#2a2a2a] text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        🚀 Tạo {scenes.length} {outputType === 'video' ? 'video' : 'ảnh'}
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className={`w-full py-3 rounded-xl font-medium transition-colors ${isDark
                                            ? 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                    >
                                        ← Quay lại
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Generating */}
            {step === 'generating' && scenario && (
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Progress Header */}
                    <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-slate-200 shadow-sm'}`}>
                        <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${scenario.status === 'completed'
                            ? 'bg-emerald-500/20'
                            : scenario.status === 'failed'
                                ? 'bg-rose-500/20'
                                : isDark ? 'bg-violet-600/20' : 'bg-violet-100'
                            }`}>
                            <span className="text-3xl">
                                {scenario.status === 'generating' ? '🎬' :
                                    scenario.status === 'completed' ? '✅' :
                                        scenario.status === 'partial' ? '⚠️' : '❌'}
                            </span>
                        </div>

                        <h2 className={`text-xl font-bold mb-2 ${themeClasses.textPrimary}`}>
                            {scenario.status === 'generating' ? 'Đang tạo video...' :
                                scenario.status === 'completed' ? 'Hoàn thành!' :
                                    scenario.status === 'partial' ? 'Hoàn thành một phần' : 'Thất bại'}
                        </h2>
                        <p className={themeClasses.textSecondary}>
                            {scenario.completed_scenes} / {scenario.total_scenes} cảnh đã hoàn thành
                        </p>

                        {/* Progress Bar */}
                        <div className={`mt-6 h-3 rounded-full overflow-hidden ${isDark ? 'bg-[#2a2a2a]' : 'bg-slate-200'}`}>
                            <div
                                className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500 rounded-full"
                                style={{ width: `${scenario.progress}%` }}
                            />
                        </div>
                        <p className={`mt-2 text-sm ${themeClasses.textMuted}`}>{scenario.progress}%</p>
                    </div>

                    {/* Scenes Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {scenes.map((scene) => {
                            const status = getStatusStyle(scene.status);
                            return (
                                <div
                                    key={scene.id}
                                    className={`p-4 rounded-xl flex items-center gap-4 border transition-all ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-slate-200'
                                        } ${status.border}`}
                                >
                                    {/* Status Icon */}
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${status.bg} ${status.text}`}>
                                        {scene.status === 'generating' ? (
                                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                            </svg>
                                        ) : (
                                            <span className="font-bold">{status.icon}</span>
                                        )}
                                    </div>

                                    {/* Scene Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium truncate ${themeClasses.textPrimary}`}>
                                            Cảnh {scene.order}
                                        </p>
                                        <p className={`text-xs truncate ${themeClasses.textMuted}`}>
                                            {scene.description}
                                        </p>
                                        {scene.error_message && (
                                            <p className="text-xs text-rose-500 mt-1">{scene.error_message}</p>
                                        )}
                                    </div>

                                    {/* Preview/Action */}
                                    {scene.status === 'completed' && scene.result_url && (
                                        <a
                                            href={scene.result_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25"
                                        >
                                            👁️ Xem
                                        </a>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Merge Video Placeholder (Future Feature) */}
                    {scenario.status === 'completed' && (
                        <div className={`p-6 rounded-2xl text-center ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-slate-200'}`}>
                            <p className={`text-sm ${themeClasses.textMuted}`}>
                                🎬 Tính năng gộp video đang được phát triển
                            </p>
                            <p className={`text-xs mt-1 ${themeClasses.textMuted}`}>
                                Hiện tại bạn có thể tải từng video riêng lẻ
                            </p>
                        </div>
                    )}

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
                                ✨ Tạo kịch bản mới
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
