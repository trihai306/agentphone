import { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AppLayout from '../../Layouts/AppLayout';
import { useToast } from '@/Components/Layout/ToastProvider';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * AI Scenario Page - Script to Scenes
 * 
 * Allows users to input a script/scenario, parse it into scenes using AI,
 * edit individual scene prompts, and generate all scenes as videos/images.
 */
export default function Scenario({ currentCredits = 0, videoModels = [], imageModels = [] }) {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Theme classes
    const themeClasses = {
        pageBg: isDark ? 'bg-[#0a0a0a]' : 'bg-[#fafafa]',
        cardBg: isDark ? 'bg-[#1a1a1a]' : 'bg-white',
        border: isDark ? 'border-[#2a2a2a]' : 'border-slate-200',
        textPrimary: isDark ? 'text-white' : 'text-slate-900',
        textSecondary: isDark ? 'text-slate-400' : 'text-slate-500',
        textMuted: isDark ? 'text-slate-500' : 'text-slate-400',
    };

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

        setStep('generating');

        try {
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

                const genResponse = await axios.post(`/ai-studio/scenarios/${savedScenario.id}/generate`);

                if (genResponse.data.success) {
                    setScenario(genResponse.data.scenario);
                    addToast('Đã bắt đầu tạo video cho tất cả các cảnh', 'success');
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

                    if (['completed', 'failed', 'partial'].includes(updatedScenario.status)) {
                        clearInterval(pollInterval);
                        if (updatedScenario.status === 'completed') {
                            addToast('Tất cả các cảnh đã được tạo thành công!', 'success');
                        } else if (updatedScenario.status === 'partial') {
                            addToast('Một số cảnh tạo thất bại', 'warning');
                        }
                        router.reload({ only: ['currentCredits'] });
                    }
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 3000);
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
        <AppLayout title="AI Scenario - Kịch Bản">
            <div className={`min-h-screen transition-colors duration-300 ${themeClasses.pageBg}`}>
                <div className="max-w-[1200px] mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/ai-studio"
                                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-slate-100'}`}
                            >
                                <svg className={`w-5 h-5 ${themeClasses.textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Link>
                            <div>
                                <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>
                                    📝 AI Kịch Bản
                                </h1>
                                <p className={`text-sm ${themeClasses.textMuted}`}>
                                    Nhập kịch bản, AI sẽ chia thành các cảnh và tạo video/ảnh
                                </p>
                            </div>
                        </div>

                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-slate-50 border border-slate-200'}`}>
                            <span className="text-lg">✨</span>
                            <span className={`font-bold ${themeClasses.textPrimary}`}>{currentCredits.toLocaleString()}</span>
                            <span className={themeClasses.textMuted}>credits</span>
                        </div>
                    </div>

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
                                <span className={`ml-2 text-sm font-medium ${step === s ? themeClasses.textPrimary : themeClasses.textMuted}`}>
                                    {s === 'input' ? 'Nhập kịch bản' : s === 'scenes' ? 'Xem & Chỉnh sửa' : 'Đang tạo'}
                                </span>
                                {i < 2 && (
                                    <div className={`w-16 h-0.5 mx-4 ${i < ['input', 'scenes', 'generating'].indexOf(step) ? 'bg-violet-500' : isDark ? 'bg-[#2a2a2a]' : 'bg-slate-200'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Input */}
                    {step === 'input' && (
                        <div className={`max-w-3xl mx-auto p-6 rounded-2xl ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-slate-200 shadow-sm'}`}>
                            <h2 className={`text-lg font-bold mb-4 ${themeClasses.textPrimary}`}>📝 Nhập Kịch Bản</h2>

                            {/* Output Type Toggle */}
                            <div className="mb-4">
                                <label className={`block text-sm font-semibold mb-2 ${themeClasses.textSecondary}`}>Loại Output</label>
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
                                <label className={`block text-sm font-semibold mb-2 ${themeClasses.textSecondary}`}>Model AI</label>
                                <select
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors ${isDark ? 'bg-[#0a0a0a] border-[#2a2a2a] text-white' : 'bg-white border-slate-200 text-slate-900'
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
                                <label className={`block text-sm font-semibold mb-2 ${themeClasses.textSecondary}`}>Kịch Bản</label>
                                <textarea
                                    value={script}
                                    onChange={(e) => setScript(e.target.value)}
                                    placeholder="Nhập kịch bản của bạn... AI sẽ phân tích và chia thành các cảnh riêng biệt."
                                    rows={10}
                                    className={`w-full px-4 py-3 rounded-xl border text-sm resize-none transition-colors ${isDark ? 'bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
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
                                ) : '✨ Phân tích kịch bản'}
                            </button>
                        </div>
                    )}

                    {/* Step 2: Scenes */}
                    {step === 'scenes' && (
                        <div className="max-w-4xl mx-auto space-y-4">
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
                            {scenes.map((scene, index) => (
                                <div key={scene.order} className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-slate-200'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-violet-600/20 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
                                            <span className="font-bold">{scene.order}</span>
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <p className={themeClasses.textSecondary}>{scene.description}</p>
                                            <textarea
                                                value={scene.prompt}
                                                onChange={(e) => handleUpdateScene(index, 'prompt', e.target.value)}
                                                rows={3}
                                                className={`w-full px-3 py-2 rounded-lg border text-sm resize-none ${isDark ? 'bg-[#0a0a0a] border-[#2a2a2a] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Actions */}
                            <div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-slate-200'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <p className={themeClasses.textSecondary}><span className="font-bold">{scenes.length}</span> cảnh</p>
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isDark ? 'bg-[#0a0a0a]' : 'bg-slate-50'}`}>
                                        <span>✨</span>
                                        <span className={`font-bold ${themeClasses.textPrimary}`}>{totalCredits.toLocaleString()}</span>
                                        <span className={themeClasses.textMuted}>credits</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={handleReset} className={`px-6 py-3 rounded-xl font-medium ${isDark ? 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                                        ← Quay lại
                                    </button>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={currentCredits < totalCredits}
                                        className={`flex-1 py-3 rounded-xl font-semibold ${currentCredits >= totalCredits
                                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/30'
                                                : isDark ? 'bg-[#2a2a2a] text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        🚀 Tạo {scenes.length} {outputType === 'video' ? 'video' : 'ảnh'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Generating */}
                    {step === 'generating' && scenario && (
                        <div className="max-w-4xl mx-auto space-y-4">
                            <div className={`p-6 rounded-xl text-center ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-slate-200'}`}>
                                <h2 className={`text-xl font-bold mb-2 ${themeClasses.textPrimary}`}>
                                    {scenario.status === 'generating' ? '🎬 Đang tạo...' : scenario.status === 'completed' ? '✅ Hoàn thành!' : '⚠️ Hoàn thành một phần'}
                                </h2>
                                <p className={themeClasses.textSecondary}>{scenario.completed_scenes} / {scenario.total_scenes} cảnh</p>
                                <div className={`mt-4 h-3 rounded-full overflow-hidden ${isDark ? 'bg-[#2a2a2a]' : 'bg-slate-200'}`}>
                                    <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all" style={{ width: `${scenario.progress}%` }} />
                                </div>
                            </div>

                            {scenes.map((scene) => (
                                <div key={scene.id} className={`p-4 rounded-xl flex items-center gap-4 ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-slate-200'}`}>
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${scene.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                            scene.status === 'generating' ? 'bg-amber-500/20 text-amber-400' :
                                                scene.status === 'failed' ? 'bg-rose-500/20 text-rose-400' : isDark ? 'bg-[#2a2a2a] text-slate-500' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                        {scene.status === 'completed' ? '✓' : scene.status === 'generating' ? '⏳' : scene.status === 'failed' ? '✕' : scene.order}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-medium ${themeClasses.textPrimary}`}>Cảnh {scene.order}</p>
                                    </div>
                                    {scene.result_url && (
                                        <a href={scene.result_url} target="_blank" className="px-3 py-1.5 rounded-lg text-sm font-medium bg-violet-600 text-white">Xem</a>
                                    )}
                                </div>
                            ))}

                            {scenario.status !== 'generating' && (
                                <div className="flex justify-center">
                                    <button onClick={handleReset} className={`px-8 py-3 rounded-xl font-medium ${isDark ? 'bg-[#2a2a2a] text-white' : 'bg-slate-100 text-slate-700'}`}>
                                        Tạo kịch bản mới
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
