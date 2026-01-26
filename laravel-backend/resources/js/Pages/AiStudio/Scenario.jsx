import { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AppLayout from '../../Layouts/AppLayout';
import { useToast } from '@/Components/Layout/ToastProvider';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * AI Scenario Page - Professional Redesign
 * 2-Panel Layout with Glassmorphism Design
 */
export default function Scenario({ currentCredits = 0, videoModels = [], imageModels = [], activeScenarios: initialActiveScenarios = [] }) {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // States
    const [step, setStep] = useState('input');
    const [script, setScript] = useState('');
    const [outputType, setOutputType] = useState('video');
    const [model, setModel] = useState('');
    const [parsing, setParsing] = useState(false);
    const [scenes, setScenes] = useState([]);
    const [title, setTitle] = useState('');
    const [totalCredits, setTotalCredits] = useState(0);
    const [scenario, setScenario] = useState(null);
    const [style, setStyle] = useState('cinematic');
    const [platform, setPlatform] = useState('general');
    const [aiMetadata, setAiMetadata] = useState(null);
    const [chainMode, setChainMode] = useState('none');
    const [characters, setCharacters] = useState([]);
    const [activeTab, setActiveTab] = useState('script'); // script, settings, characters
    const [editingSceneIndex, setEditingSceneIndex] = useState(null);
    const [activeScenarios, setActiveScenarios] = useState(initialActiveScenarios);

    const [settings, setSettings] = useState({
        resolution: '1080p',
        aspect_ratio: '16:9',
        generate_audio: true,
    });

    // Style options
    const styleOptions = [
        { id: 'cinematic', icon: '🎬', name: 'Cinematic', desc: 'Hollywood style' },
        { id: 'documentary', icon: '📹', name: 'Documentary', desc: 'Real & authentic' },
        { id: 'commercial', icon: '💎', name: 'Commercial', desc: 'Premium ads' },
        { id: 'social_media', icon: '📱', name: 'Social', desc: 'Viral content' },
        { id: 'storytelling', icon: '💫', name: 'Story', desc: 'Emotional' },
        { id: 'minimal', icon: '◯', name: 'Minimal', desc: 'Clean & simple' },
    ];

    const platformOptions = [
        { id: 'general', name: 'Đa nền tảng', icon: '🌐' },
        { id: 'youtube', name: 'YouTube', icon: '▶️' },
        { id: 'tiktok', name: 'TikTok', icon: '🎵' },
        { id: 'instagram', name: 'Instagram', icon: '📷' },
        { id: 'ads', name: 'Quảng cáo', icon: '💼' },
    ];

    const models = outputType === 'video' ? videoModels : imageModels;

    useEffect(() => {
        if (models.length > 0 && !model) {
            const defaultModel = models.find(m => m.enabled && !m.coming_soon) || models[0];
            setModel(defaultModel?.id || '');
        }
    }, [models, outputType]);

    // Poll active scenarios status
    useEffect(() => {
        if (activeScenarios.length === 0) return;

        const pollInterval = setInterval(async () => {
            try {
                const updates = await Promise.all(
                    activeScenarios.map(s => axios.get(`/ai-studio/scenarios/${s.id}/status`))
                );
                const updated = updates.map(r => r.data.scenario);
                const stillActive = updated.filter(s => ['queued', 'generating'].includes(s.status));
                setActiveScenarios(stillActive);

                // Refresh page if all done
                if (stillActive.length === 0 && updated.length > 0) {
                    router.reload({ only: ['currentCredits', 'activeScenarios'] });
                }
            } catch (e) {
                console.error('Polling error:', e);
            }
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [activeScenarios]);

    // Handlers
    const handleParse = async () => {
        if (!script.trim() || script.length < 10) {
            addToast('Vui lòng nhập kịch bản (ít nhất 10 ký tự)', 'warning');
            return;
        }

        setParsing(true);
        try {
            const response = await axios.post('/ai-studio/scenarios/parse', {
                script, output_type: outputType, style, platform,
            });

            if (response.data.success) {
                const data = response.data.data;
                setScenes(data.scenes);
                setTitle(data.title || '');
                setAiMetadata({
                    theme: data.theme,
                    overall_mood: data.overall_mood,
                    color_palette: data.color_palette,
                    background_music_suggestion: data.background_music_suggestion,
                    director_notes: data.director_notes,
                    total_duration: data.total_duration,
                });
                setStep('scenes');
                await estimateCredits(data.scenes);
            }
        } catch (error) {
            addToast(error.response?.data?.error || 'Không thể phân tích kịch bản', 'error');
        } finally {
            setParsing(false);
        }
    };

    const estimateCredits = async (sceneList) => {
        if (!model || sceneList.length === 0) return;
        try {
            const response = await axios.post('/ai-studio/scenarios/estimate', {
                model, output_type: outputType, scenes: sceneList, settings,
            });
            if (response.data.success) setTotalCredits(response.data.total_credits);
        } catch (error) {
            console.error('Failed to estimate credits', error);
        }
    };

    const handleGenerate = async () => {
        if (scenes.length === 0) {
            addToast('Không có cảnh nào để tạo', 'warning');
            return;
        }
        if (currentCredits < totalCredits) {
            addToast(`Không đủ credits. Cần ${totalCredits}, hiện có ${currentCredits}`, 'warning');
            return;
        }

        // Show loading state but don't switch to generating view
        setParsing(true);
        try {
            const saveResponse = await axios.post('/ai-studio/scenarios', {
                script, title, output_type: outputType, model, scenes, settings,
                chain_mode: chainMode,
                characters: characters.length > 0 ? characters : null,
            });

            if (saveResponse.data.success) {
                const savedScenario = saveResponse.data.scenario;
                const genResponse = await axios.post(`/ai-studio/scenarios/${savedScenario.id}/generate`);

                if (genResponse.data.success) {
                    // Add to active scenarios list
                    const newScenario = genResponse.data.scenario;
                    setActiveScenarios(prev => [newScenario, ...prev]);

                    // Reset form for new scenario
                    setScript('');
                    setScenes([]);
                    setTitle('');
                    setTotalCredits(0);
                    setStep('input');
                    setAiMetadata(null);

                    addToast('🎬 Đã bắt đầu tạo video! Theo dõi tiến độ bên dưới.', 'success');
                }
            }
        } catch (error) {
            addToast(error.response?.data?.error || 'Không thể tạo kịch bản', 'error');
        } finally {
            setParsing(false);
        }
    };

    // Remove old startPolling - now using activeScenarios polling effect

    const handleUpdateScene = (index, field, value) => {
        const updated = [...scenes];
        updated[index] = { ...updated[index], [field]: value };
        setScenes(updated);
    };

    const handleReset = () => {
        setStep('input');
        setScenes([]);
        setScenario(null);
        setScript('');
        setTitle('');
        setTotalCredits(0);
        setAiMetadata(null);
        setChainMode('none');
        setCharacters([]);
    };

    // Glass card style
    const glassCard = isDark
        ? 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-2xl'
        : 'bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-xl';

    const glassCardHover = isDark
        ? 'hover:bg-white/[0.05] hover:border-white/[0.12]'
        : 'hover:bg-white hover:border-slate-300';

    return (
        <AppLayout title="AI Kịch Bản">
            <div className={`min-h-screen ${isDark ? 'bg-[#050505]' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
                {/* Gradient Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-violet-600/10' : 'bg-violet-200/40'}`} />
                    <div className={`absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-indigo-600/10' : 'bg-indigo-200/30'}`} />
                </div>

                <div className="relative max-w-[1600px] mx-auto px-6 py-6">
                    {/* Header */}
                    <header className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Link href="/ai-studio" className={`p-2.5 rounded-xl transition-all ${glassCard} ${glassCardHover}`}>
                                <svg className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Link>
                            <div>
                                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    AI Kịch Bản
                                </h1>
                                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Script → Scenes → Video
                                </p>
                            </div>
                        </div>

                        <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl ${glassCard}`}>
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                                <span className="text-white text-sm">✨</span>
                            </div>
                            <div>
                                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Credits</p>
                                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {currentCredits.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </header>

                    {/* Active Scenarios Section - Enhanced Table View */}
                    {activeScenarios.length > 0 && (
                        <div className={`mb-6 rounded-2xl ${glassCard} overflow-hidden`}>
                            {/* Header */}
                            <div className={`px-5 py-4 border-b ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse" />
                                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            🎬 Kịch bản đang tạo ({activeScenarios.length})
                                        </h3>
                                    </div>
                                    <span className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                                        Auto-refresh 5s
                                    </span>
                                </div>
                            </div>

                            {/* Scenarios List */}
                            <div className="divide-y divide-white/5">
                                {activeScenarios.map((s) => (
                                    <div key={s.id} className={`p-4 ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'} transition-colors`}>
                                        {/* Scenario Header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${s.status === 'queued'
                                                        ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30'
                                                        : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30'
                                                    }`}>
                                                    {s.status === 'queued' ? '🕐' : '⚡'}
                                                </div>
                                                <div>
                                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                        {s.title || 'Kịch bản mới'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-xs px-2 py-0.5 rounded ${s.status === 'queued'
                                                                ? isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                                                                : isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {s.status === 'queued' ? 'Đang chờ' : 'Đang tạo'}
                                                        </span>
                                                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                            {s.output_type === 'video' ? '🎥' : '🖼️'} {s.total_scenes} cảnh
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress */}
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                        {s.progress}%
                                                    </p>
                                                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                        {s.completed_scenes}/{s.total_scenes} xong
                                                    </p>
                                                </div>
                                                <div className={`w-32 h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                                                    <div
                                                        className={`h-full transition-all duration-700 ${s.status === 'queued'
                                                                ? 'bg-gradient-to-r from-purple-500 to-purple-400'
                                                                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400'
                                                            }`}
                                                        style={{ width: `${s.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Scenes Progress */}
                                        <div className="flex gap-1.5 flex-wrap">
                                            {s.scenes?.map((scene) => (
                                                <div
                                                    key={scene.id}
                                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs ${scene.status === 'completed'
                                                            ? isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-700'
                                                            : scene.status === 'generating'
                                                                ? isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse' : 'bg-amber-100 text-amber-700'
                                                                : scene.status === 'failed'
                                                                    ? isDark ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-red-100 text-red-700'
                                                                    : isDark ? 'bg-white/5 text-slate-500 border border-white/10' : 'bg-slate-100 text-slate-500'
                                                        }`}
                                                >
                                                    <span>
                                                        {scene.status === 'completed' ? '✓' : scene.status === 'generating' ? '⏳' : scene.status === 'failed' ? '✗' : '○'}
                                                    </span>
                                                    <span>Cảnh {scene.order}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Main Content - 2 Panel Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* LEFT PANEL - Input */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Tabs */}
                            <div className={`p-1.5 rounded-2xl ${glassCard}`}>
                                <div className="flex gap-1">
                                    {[
                                        { id: 'script', label: '📝 Kịch bản', icon: null },
                                        { id: 'settings', label: '⚙️ Cài đặt', icon: null },
                                        { id: 'characters', label: '👤 Nhân vật', icon: null },
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25'
                                                : isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                                }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Script Tab */}
                            {activeTab === 'script' && (
                                <div className={`p-5 rounded-2xl ${glassCard}`}>
                                    <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        Nhập kịch bản của bạn
                                    </label>
                                    <textarea
                                        value={script}
                                        onChange={(e) => setScript(e.target.value)}
                                        placeholder="Ví dụ: Cảnh 1: Ánh bình minh chiếu rọi thành phố. Cảnh 2: Một cô gái trẻ đang chạy bộ trong công viên..."
                                        rows={12}
                                        className={`w-full px-4 py-4 rounded-xl border text-sm resize-none transition-all focus:ring-2 focus:ring-violet-500/50 ${isDark
                                            ? 'bg-black/30 border-white/10 text-white placeholder-slate-600 focus:border-violet-500/50'
                                            : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-500'
                                            }`}
                                    />
                                    <div className="flex items-center justify-between mt-3">
                                        <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                            {script.length} ký tự
                                        </span>
                                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            💡 AI sẽ tự phân tách thành các scene
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Settings Tab */}
                            {activeTab === 'settings' && (
                                <div className={`p-5 rounded-2xl space-y-5 ${glassCard}`}>
                                    {/* Output Type */}
                                    <div>
                                        <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            Output Type
                                        </label>
                                        <div className={`flex p-1 rounded-xl ${isDark ? 'bg-black/30' : 'bg-slate-100'}`}>
                                            {['video', 'image'].map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => { setOutputType(type); setModel(''); }}
                                                    className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${outputType === type
                                                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
                                                        : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                                                        }`}
                                                >
                                                    {type === 'video' ? '🎬 Video' : '🖼️ Ảnh'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Model Selection */}
                                    <div>
                                        <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            AI Model
                                        </label>
                                        <select
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                            className={`w-full px-4 py-3 rounded-xl border text-sm transition-all ${isDark
                                                ? 'bg-black/30 border-white/10 text-white'
                                                : 'bg-white border-slate-200 text-slate-900'
                                                }`}
                                        >
                                            {models.filter(m => m.enabled && !m.coming_soon).map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name} • {m.credits_cost} credits/{outputType === 'video' ? 'sec' : 'ảnh'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Style Selection */}
                                    <div>
                                        <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            Phong cách
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {styleOptions.map((s) => (
                                                <button
                                                    key={s.id}
                                                    onClick={() => setStyle(s.id)}
                                                    className={`p-3 rounded-xl text-center transition-all ${style === s.id
                                                        ? 'bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border-2 border-violet-500'
                                                        : isDark ? 'bg-black/20 border border-white/5 hover:border-white/20' : 'bg-slate-50 border border-slate-200 hover:border-slate-300'
                                                        }`}
                                                >
                                                    <span className="text-xl">{s.icon}</span>
                                                    <p className={`text-xs font-medium mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{s.name}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Platform */}
                                    <div>
                                        <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            Nền tảng
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {platformOptions.map((p) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => setPlatform(p.id)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${platform === p.id
                                                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                                                        : isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    {p.icon} {p.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Frame Chain Mode - Video Only */}
                                    {outputType === 'video' && (
                                        <div className={`p-4 rounded-xl ${chainMode === 'frame_chain' ? 'bg-amber-500/10 border border-amber-500/30' : isDark ? 'bg-black/20 border border-white/5' : 'bg-slate-50 border border-slate-200'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">🔗</span>
                                                    <div>
                                                        <p className={`font-medium text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Frame Chain</p>
                                                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Chuyển cảnh mượt mà</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setChainMode(chainMode === 'none' ? 'frame_chain' : 'none')}
                                                    className={`relative w-12 h-6 rounded-full transition-colors ${chainMode === 'frame_chain' ? 'bg-amber-500' : isDark ? 'bg-white/10' : 'bg-slate-300'}`}
                                                >
                                                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${chainMode === 'frame_chain' ? 'translate-x-6' : ''}`} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Characters Tab */}
                            {activeTab === 'characters' && (
                                <div className={`p-5 rounded-2xl ${glassCard}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            Nhân vật xuyên suốt
                                        </label>
                                        <button
                                            onClick={() => setCharacters([...characters, { name: '', description: '' }])}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                                        >
                                            + Thêm
                                        </button>
                                    </div>

                                    {characters.length === 0 ? (
                                        <div className={`text-center py-8 rounded-xl ${isDark ? 'bg-black/20' : 'bg-slate-50'}`}>
                                            <span className="text-4xl">👥</span>
                                            <p className={`text-sm mt-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                Thêm nhân vật để AI giữ ngoại hình nhất quán
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {characters.map((char, idx) => (
                                                <div key={idx} className={`p-4 rounded-xl ${isDark ? 'bg-black/20 border border-white/5' : 'bg-slate-50 border border-slate-200'}`}>
                                                    <div className="flex gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isDark ? 'bg-violet-600/20' : 'bg-violet-100'}`}>
                                                            {idx + 1}
                                                        </div>
                                                        <div className="flex-1 space-y-2">
                                                            <input
                                                                type="text"
                                                                value={char.name}
                                                                onChange={(e) => {
                                                                    const updated = [...characters];
                                                                    updated[idx].name = e.target.value;
                                                                    setCharacters(updated);
                                                                }}
                                                                placeholder="Tên nhân vật"
                                                                className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-200'} border`}
                                                            />
                                                            <textarea
                                                                value={char.description}
                                                                onChange={(e) => {
                                                                    const updated = [...characters];
                                                                    updated[idx].description = e.target.value;
                                                                    setCharacters(updated);
                                                                }}
                                                                placeholder="Mô tả chi tiết: tuổi, tóc, trang phục, đặc điểm nổi bật..."
                                                                rows={2}
                                                                className={`w-full px-3 py-2 rounded-lg text-sm resize-none ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-200'} border`}
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => setCharacters(characters.filter((_, i) => i !== idx))}
                                                            className={`self-start p-2 rounded-lg ${isDark ? 'text-rose-400 hover:bg-rose-500/20' : 'text-rose-500 hover:bg-rose-50'}`}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Parse Button */}
                            {step === 'input' && (
                                <button
                                    onClick={handleParse}
                                    disabled={parsing || script.length < 10}
                                    className={`w-full py-4 rounded-2xl font-semibold text-base transition-all ${!parsing && script.length >= 10
                                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02]'
                                        : isDark ? 'bg-white/5 text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    {parsing ? (
                                        <span className="flex items-center justify-center gap-3">
                                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Đang phân tích...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <span>✨</span>
                                            Phân tích kịch bản
                                        </span>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* RIGHT PANEL - Scenes Preview */}
                        <div className="lg:col-span-3">
                            {/* Empty State */}
                            {step === 'input' && scenes.length === 0 && (
                                <div className={`h-full min-h-[500px] rounded-2xl flex flex-col items-center justify-center ${glassCard}`}>
                                    <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-5xl mb-6 ${isDark ? 'bg-gradient-to-br from-violet-600/20 to-indigo-600/20' : 'bg-gradient-to-br from-violet-100 to-indigo-100'}`}>
                                        🎬
                                    </div>
                                    <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        Kịch bản trống
                                    </h3>
                                    <p className={`text-sm max-w-sm text-center ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                        Nhập kịch bản ở panel bên trái và nhấn "Phân tích" để AI chia thành các scene chuyên nghiệp.
                                    </p>
                                </div>
                            )}

                            {/* Scenes List */}
                            {(step === 'scenes' || step === 'generating') && scenes.length > 0 && (
                                <div className="space-y-4">
                                    {/* Title & Metadata */}
                                    <div className={`p-5 rounded-2xl ${glassCard}`}>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Tiêu đề kịch bản..."
                                            className={`w-full text-xl font-bold bg-transparent border-none focus:outline-none ${isDark ? 'text-white placeholder-slate-600' : 'text-slate-900 placeholder-slate-400'}`}
                                        />
                                        {aiMetadata && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {aiMetadata.theme && (
                                                    <span className={`px-3 py-1 rounded-full text-xs ${isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-700'}`}>
                                                        {aiMetadata.theme}
                                                    </span>
                                                )}
                                                {aiMetadata.overall_mood && (
                                                    <span className={`px-3 py-1 rounded-full text-xs ${isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                                                        {aiMetadata.overall_mood}
                                                    </span>
                                                )}
                                                {aiMetadata.total_duration && (
                                                    <span className={`px-3 py-1 rounded-full text-xs ${isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        ~{aiMetadata.total_duration}s
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Timeline */}
                                    <div className="relative">
                                        {/* Timeline Line */}
                                        <div className={`absolute left-6 top-0 bottom-0 w-0.5 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />

                                        {/* Scene Cards */}
                                        <div className="space-y-3">
                                            {scenes.map((scene, index) => (
                                                <div key={scene.id || index} className="relative pl-14">
                                                    {/* Timeline Dot */}
                                                    <div className={`absolute left-4 top-6 w-5 h-5 rounded-full border-4 ${scene.status === 'completed' ? 'bg-emerald-500 border-emerald-500/30' :
                                                        scene.status === 'generating' ? 'bg-amber-500 border-amber-500/30 animate-pulse' :
                                                            scene.status === 'failed' ? 'bg-rose-500 border-rose-500/30' :
                                                                isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-300 border-slate-200'
                                                        }`} />

                                                    {/* Card */}
                                                    <div
                                                        className={`p-5 rounded-2xl transition-all cursor-pointer ${glassCard} ${glassCardHover} ${editingSceneIndex === index ? 'ring-2 ring-violet-500' : ''}`}
                                                        onClick={() => setEditingSceneIndex(editingSceneIndex === index ? null : index)}
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${scene.status === 'completed' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white' :
                                                                scene.status === 'generating' ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white' :
                                                                    isDark ? 'bg-gradient-to-br from-violet-600/30 to-indigo-600/30 text-violet-300' : 'bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700'
                                                                }`}>
                                                                {scene.status === 'completed' ? '✓' : scene.status === 'generating' ? '⏳' : scene.order}
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                                        Cảnh {scene.order}
                                                                    </h4>
                                                                    <span className={`text-xs px-2 py-1 rounded-lg ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                                                        {scene.duration}s
                                                                    </span>
                                                                </div>
                                                                <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                                                    {scene.description}
                                                                </p>

                                                                {/* Editable Prompt */}
                                                                {editingSceneIndex === index ? (
                                                                    <textarea
                                                                        value={scene.prompt}
                                                                        onChange={(e) => handleUpdateScene(index, 'prompt', e.target.value)}
                                                                        rows={4}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className={`w-full px-3 py-2 rounded-xl text-xs resize-none ${isDark ? 'bg-black/30 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'} border`}
                                                                    />
                                                                ) : (
                                                                    <p className={`text-xs line-clamp-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                                                        {scene.prompt}
                                                                    </p>
                                                                )}

                                                                {/* Result Video Link */}
                                                                {scene.result_url && (
                                                                    <a
                                                                        href={scene.result_url}
                                                                        target="_blank"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                                                                    >
                                                                        ▶ Xem kết quả
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    {step === 'scenes' && scenes.length > 0 && (
                        <div className={`fixed bottom-0 left-0 right-0 z-50`}>
                            <div className={`max-w-[1600px] mx-auto px-6 py-4`}>
                                <div className={`flex items-center justify-between p-4 rounded-2xl ${glassCard}`}>
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Scenes</p>
                                            <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{scenes.length}</p>
                                        </div>
                                        <div className={`w-px h-10 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                                        <div>
                                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Tổng credits</p>
                                            <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalCredits.toLocaleString()}</p>
                                        </div>
                                        {chainMode === 'frame_chain' && (
                                            <>
                                                <div className={`w-px h-10 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                                                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-400">
                                                    🔗 Frame Chain ON
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleReset}
                                            className={`px-6 py-3 rounded-xl font-medium ${isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                        >
                                            ← Quay lại
                                        </button>
                                        <button
                                            onClick={handleGenerate}
                                            disabled={currentCredits < totalCredits}
                                            className={`px-8 py-3 rounded-xl font-semibold transition-all ${currentCredits >= totalCredits
                                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02]'
                                                : isDark ? 'bg-white/5 text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            🚀 Tạo {scenes.length} Video
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Generating Progress */}
                    {step === 'generating' && scenario && (
                        <div className={`fixed bottom-0 left-0 right-0 z-50`}>
                            <div className={`max-w-[1600px] mx-auto px-6 py-4`}>
                                <div className={`p-4 rounded-2xl ${glassCard}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center animate-pulse">
                                                <span className="text-white">⏳</span>
                                            </div>
                                            <div>
                                                <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    {scenario.status === 'queued' ? '🕐 Đang chờ trong hàng đợi...' : scenario.status === 'generating' ? 'Đang tạo video...' : scenario.status === 'completed' ? '✅ Hoàn thành!' : '⚠️ Hoàn thành một phần'}
                                                </p>
                                                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                                    {scenario.status === 'queued' ? 'Các cảnh sẽ được tạo tuần tự' : `${scenario.completed_scenes} / ${scenario.total_scenes} scenes`}
                                                </p>
                                            </div>
                                        </div>
                                        {!['generating', 'queued'].includes(scenario.status) && (
                                            <button
                                                onClick={handleReset}
                                                className="px-6 py-2.5 rounded-xl font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                                            >
                                                Tạo mới
                                            </button>
                                        )}
                                    </div>
                                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                                        <div
                                            className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500"
                                            style={{ width: `${scenario.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
