import { useState, useEffect, useRef } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AppLayout from '../../Layouts/AppLayout';
import { useToast } from '@/Components/Layout/ToastProvider';
import { useTheme } from '@/Contexts/ThemeContext';
import FolderSelectModal from '@/Components/Media/FolderSelectModal';

// Provider badge colors - professional palette
const providerColors = {
    'gemini': {
        dark: { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' },
        light: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
        label: 'Google'
    },
    'gemini-veo': {
        dark: { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' },
        light: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
        label: 'Google'
    },
    'kling': {
        dark: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
        light: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
        label: 'Kling AI'
    },
    'replicate': {
        dark: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' },
        light: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
        label: 'Replicate'
    },
};

const badgeStyles = {
    'purple': {
        dark: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
        light: 'bg-violet-100 text-violet-700 border border-violet-200',
    },
    'blue': {
        dark: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
        light: 'bg-sky-100 text-sky-700 border border-sky-200',
    },
    'green': {
        dark: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        light: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    },
    'yellow': {
        dark: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        light: 'bg-amber-100 text-amber-700 border border-amber-200',
    },
    'red': {
        dark: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
        light: 'bg-rose-100 text-rose-700 border border-rose-200',
    },
};

export default function AiStudioIndex({ currentCredits = 0, imageModels = [], videoModels = [], recentGenerations = [], folders = [] }) {
    const { t } = useTranslation();
    const { auth } = usePage().props;
    const { addToast } = useToast();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const textareaRef = useRef(null);

    const [type, setType] = useState('video');
    const [model, setModel] = useState('');
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [params, setParams] = useState({
        width: 1024,
        height: 1024,
        duration: 6,
        resolution: '1080p',
        aspect_ratio: '16:9',
        generate_audio: true,
    });
    const [generating, setGenerating] = useState(false);
    const [currentGeneration, setCurrentGeneration] = useState(null);
    const [history, setHistory] = useState(recentGenerations);
    const [showSettings, setShowSettings] = useState(true);
    const [generationMode, setGenerationMode] = useState('text');
    const [sourceImage, setSourceImage] = useState(null);
    const [sourceImagePreview, setSourceImagePreview] = useState(null);
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [showSaveDropdown, setShowSaveDropdown] = useState(false);

    const models = type === 'image' ? imageModels : videoModels;
    const selectedModel = models.find(m => m.id === model);

    // Elapsed time for current generation
    const [elapsedTime, setElapsedTime] = useState(0);

    // Theme-aware class helpers
    const themeClasses = {
        // Backgrounds - match AppLayout's bg colors
        pageBg: isDark ? 'bg-[#0a0a0a]' : 'bg-[#fafafa]',
        cardBg: isDark ? 'bg-[#1a1a1a]' : 'bg-white',
        cardBgHover: isDark ? 'hover:bg-[#2a2a2a]' : 'hover:bg-slate-50',
        cardBgActive: isDark ? 'bg-[#2a2a2a]' : 'bg-slate-100',
        inputBg: isDark ? 'bg-[#1a1a1a]' : 'bg-white',

        // Borders
        border: isDark ? 'border-[#2a2a2a]' : 'border-slate-200',
        borderHover: isDark ? 'hover:border-[#3a3a3a]' : 'hover:border-slate-300',
        borderActive: isDark ? 'border-violet-500/50' : 'border-violet-400',

        // Text
        textPrimary: isDark ? 'text-white' : 'text-slate-900',
        textSecondary: isDark ? 'text-slate-400' : 'text-slate-500',
        textMuted: isDark ? 'text-slate-500' : 'text-slate-400',
        textPlaceholder: isDark ? 'placeholder-slate-500' : 'placeholder-slate-400',

        // Interactive states
        focusRing: isDark ? 'focus:ring-violet-500/30 focus:border-violet-500' : 'focus:ring-violet-500/20 focus:border-violet-400',
    };

    useEffect(() => {
        if (models.length > 0 && !model) {
            const defaultModel = type === 'video'
                ? models.find(m => m.id === 'veo-3.1') || models[0]
                : models.find(m => m.id === 'flux-1.1-pro') || models[0];
            setModel(defaultModel.id);
        }
    }, [models, type]);

    // Restore pending generation on page load
    useEffect(() => {
        const pendingGen = recentGenerations.find(g => g.status === 'pending' || g.status === 'processing');
        if (pendingGen) {
            setCurrentGeneration(pendingGen);
            setGenerating(true);
        }
    }, []);

    // Elapsed time timer
    useEffect(() => {
        if (!currentGeneration || !currentGeneration.created_at) return;
        if (currentGeneration.status === 'completed' || currentGeneration.status === 'failed') {
            return;
        }

        // Calculate initial elapsed time
        const createdAt = new Date(currentGeneration.created_at).getTime();
        const updateElapsed = () => {
            const now = Date.now();
            setElapsedTime(Math.floor((now - createdAt) / 1000));
        };

        updateElapsed();
        const timer = setInterval(updateElapsed, 1000);
        return () => clearInterval(timer);
    }, [currentGeneration?.id, currentGeneration?.status]);

    // Poll for status updates
    useEffect(() => {
        if (!currentGeneration || !currentGeneration.id) return;
        if (currentGeneration.status === 'completed' || currentGeneration.status === 'failed') {
            setGenerating(false);
            return;
        }

        const interval = setInterval(async () => {
            try {
                const response = await axios.get(`/ai-studio/generations/${currentGeneration.id}/status`);
                setCurrentGeneration(response.data.generation);
                if (response.data.generation.status === 'completed' || response.data.generation.status === 'failed') {
                    setHistory(prev => [response.data.generation, ...prev.filter(g => g.id !== currentGeneration.id)]);
                    setGenerating(false);
                }
            } catch (error) {
                console.error('Failed to check status:', error);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [currentGeneration]);

    const handleGenerate = async () => {
        if (!prompt.trim() || !model) {
            addToast('Please enter a prompt and select a model', 'warning');
            return;
        }

        const estimatedCost = calculateEstimatedCost();
        if (currentCredits < estimatedCost) {
            addToast('Insufficient credits', 'warning');
            return;
        }

        setGenerating(true);
        try {
            let endpoint = type === 'image' ? '/ai-studio/generate/image' : '/ai-studio/generate/video';
            let payload = {
                model,
                prompt,
                negative_prompt: negativePrompt,
                ...params,
            };

            if (type === 'video' && generationMode === 'image' && sourceImage) {
                payload.source_image = sourceImage;
            }

            const response = await axios.post(endpoint, payload);

            setCurrentGeneration(response.data.generation);
            setHistory(prev => [response.data.generation, ...prev]);
            router.reload({ only: ['currentCredits'] });
        } catch (error) {
            addToast(error.response?.data?.error || 'An error occurred', 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleTypeChange = (newType) => {
        setType(newType);
        setModel('');
        setGenerationMode('text');
        setSourceImage(null);
        setSourceImagePreview(null);
        if (newType === 'image') {
            setParams({ width: 1024, height: 1024, aspect_ratio: '1:1' });
        } else {
            setParams({
                duration: 6,
                resolution: '1080p',
                aspect_ratio: '16:9',
                generate_audio: true,
            });
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSourceImage(file);
            setSourceImagePreview(URL.createObjectURL(file));
        }
    };

    const calculateEstimatedCost = () => {
        if (!selectedModel) return 0;
        if (type === 'image') {
            return selectedModel.credits_cost;
        }
        const duration = params.duration || 5;
        let cost = selectedModel.credits_cost * duration;
        if (params.resolution === '1080p') cost *= 1.5;
        if (params.resolution === '4k') cost *= 2.0;
        return Math.ceil(cost);
    };

    const aspectRatios = type === 'image'
        ? [
            { label: '1:1', w: 1024, h: 1024, icon: '⬜' },
            { label: '16:9', w: 1920, h: 1080, icon: '🖥️' },
            { label: '9:16', w: 1080, h: 1920, icon: '📱' },
            { label: '4:3', w: 1024, h: 768, icon: '📺' },
        ]
        : [
            { label: '16:9', value: '16:9', icon: '🖥️' },
            { label: '9:16', value: '9:16', icon: '📱' },
        ];

    const resolutions = selectedModel?.resolutions
        ? Object.keys(selectedModel.resolutions)
        : ['720p', '1080p'];

    const getProviderStyle = (provider) => {
        const p = providerColors[provider] || providerColors['replicate'];
        return isDark ? p.dark : p.light;
    };

    const getBadgeStyle = (color) => {
        const style = badgeStyles[color] || badgeStyles['purple'];
        return isDark ? style.dark : style.light;
    };

    // Format elapsed time as MM:SS
    const formatElapsedTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <AppLayout title="AI Studio">
            <div className={`min-h-screen transition-colors duration-300 ${themeClasses.pageBg}`}>
                <div className="max-w-[1600px] mx-auto">
                    {/* Header */}
                    <div className={`sticky top-0 z-20 px-6 py-4 border-b backdrop-blur-xl transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a]/90 border-[#1a1a1a]' : 'bg-white/90 border-slate-200'
                        }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-violet-600 to-indigo-600' : 'bg-gradient-to-br from-violet-500 to-indigo-500'
                                        }`}>
                                        <span className="text-white text-lg">✨</span>
                                    </div>
                                    <h1 className={`text-xl font-bold ${themeClasses.textPrimary}`}>
                                        AI Studio
                                    </h1>
                                </div>

                                {/* Type Tabs */}
                                <div className={`flex p-1 rounded-xl transition-colors ${isDark ? 'bg-[#1a1a1a]' : 'bg-slate-100'
                                    }`}>
                                    {['video', 'image'].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => handleTypeChange(t)}
                                            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${type === t
                                                ? isDark
                                                    ? 'bg-[#2a2a2a] text-white shadow-lg'
                                                    : 'bg-white text-slate-900 shadow-md'
                                                : isDark
                                                    ? 'text-slate-400 hover:text-white hover:bg-[#2a2a2a]/50'
                                                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                                                }`}
                                        >
                                            {t === 'image' ? '🖼️ Image' : '🎬 Video'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Credits */}
                                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-slate-50 border border-slate-200'
                                    }`}>
                                    <span className="text-lg">✨</span>
                                    <span className={`font-bold ${themeClasses.textPrimary}`}>{currentCredits.toLocaleString()}</span>
                                    <span className={`text-sm ${themeClasses.textMuted}`}>credits</span>
                                </div>

                                <Link
                                    href="/ai-credits"
                                    className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 transition-all duration-200 shadow-lg shadow-violet-500/25"
                                >
                                    Buy Credits
                                </Link>

                                <Link
                                    href="/ai-studio/generations"
                                    className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${isDark
                                        ? 'text-slate-400 hover:text-white hover:bg-[#1a1a1a]'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                        }`}
                                >
                                    Gallery
                                </Link>

                                <Link
                                    href="/ai-studio/scenarios"
                                    className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/25"
                                >
                                    📝 Kịch bản AI
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="flex">
                        {/* Left Panel - Input */}
                        <div className={`w-[420px] flex-shrink-0 border-r transition-colors ${themeClasses.border}`}>
                            <div className="p-6 space-y-6">
                                {/* Generation Mode for Video */}
                                {type === 'video' && (
                                    <div>
                                        <label className={`block text-sm font-semibold mb-3 ${themeClasses.textPrimary}`}>
                                            Generation Mode
                                        </label>
                                        <div className={`flex p-1 rounded-xl transition-colors ${isDark ? 'bg-[#1a1a1a]' : 'bg-slate-100'
                                            }`}>
                                            <button
                                                onClick={() => { setGenerationMode('text'); setSourceImage(null); setSourceImagePreview(null); }}
                                                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${generationMode === 'text'
                                                    ? isDark ? 'bg-[#2a2a2a] text-white shadow' : 'bg-white text-slate-900 shadow-md'
                                                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                                                    }`}
                                            >
                                                📝 Text to Video
                                            </button>
                                            <button
                                                onClick={() => setGenerationMode('image')}
                                                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${generationMode === 'image'
                                                    ? isDark ? 'bg-[#2a2a2a] text-white shadow' : 'bg-white text-slate-900 shadow-md'
                                                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                                                    }`}
                                            >
                                                🖼️ Image to Video
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Source Image Upload */}
                                {type === 'video' && generationMode === 'image' && (
                                    <div>
                                        <label className={`block text-sm font-semibold mb-3 ${themeClasses.textPrimary}`}>
                                            Source Image
                                        </label>
                                        <div
                                            className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200 ${sourceImagePreview
                                                ? isDark ? 'border-violet-500/50 bg-violet-500/5' : 'border-violet-400 bg-violet-50'
                                                : isDark ? 'border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-[#1a1a1a]/50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                                                }`}
                                        >
                                            {sourceImagePreview ? (
                                                <div className="relative">
                                                    <img src={sourceImagePreview} alt="Source" className="w-full h-32 object-cover rounded-lg" />
                                                    <button
                                                        onClick={() => { setSourceImage(null); setSourceImagePreview(null); }}
                                                        className="absolute top-2 right-2 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center text-sm font-medium shadow-lg hover:bg-rose-600 transition-colors"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="cursor-pointer block">
                                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                                    <div className={`py-6 ${themeClasses.textMuted}`}>
                                                        <span className="text-3xl block mb-3">📷</span>
                                                        <span className="text-sm font-medium">Click to upload or drag image</span>
                                                    </div>
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Prompt */}
                                <div>
                                    <label className={`block text-sm font-semibold mb-3 ${themeClasses.textPrimary}`}>
                                        {generationMode === 'image' ? 'Motion Description' : 'Prompt'}
                                    </label>
                                    <textarea
                                        ref={textareaRef}
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder={generationMode === 'image'
                                            ? "Describe how the image should animate..."
                                            : "Describe what you want to create..."
                                        }
                                        disabled={generating}
                                        rows={4}
                                        className={`w-full px-4 py-3 rounded-xl resize-none text-sm transition-all duration-200 border focus:outline-none focus:ring-2 ${isDark
                                            ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-slate-500 focus:border-violet-500 focus:ring-violet-500/20'
                                            : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-400 focus:ring-violet-400/20'
                                            }`}
                                    />
                                </div>

                                {/* Model Selection */}
                                <div>
                                    <label className={`block text-sm font-semibold mb-3 ${themeClasses.textPrimary}`}>
                                        Model
                                    </label>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                        {models.map((m) => {
                                            const providerStyle = getProviderStyle(m.provider);
                                            const isSelected = model === m.id;
                                            const isDisabled = !m.enabled || m.coming_soon;
                                            return (
                                                <button
                                                    key={m.id}
                                                    onClick={() => !isDisabled && setModel(m.id)}
                                                    disabled={isDisabled}
                                                    className={`w-full p-4 rounded-xl text-left transition-all duration-200 border ${isDisabled
                                                        ? isDark
                                                            ? 'bg-slate-900/50 border-slate-800 cursor-not-allowed opacity-60'
                                                            : 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-60'
                                                        : isSelected
                                                            ? isDark
                                                                ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-violet-500/50'
                                                                : 'bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-300'
                                                            : isDark
                                                                ? 'bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#2a2a2a] hover:border-[#3a3a3a]'
                                                                : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className={`text-sm font-semibold truncate ${isDisabled
                                                                    ? themeClasses.textMuted
                                                                    : isSelected
                                                                        ? isDark ? 'text-violet-300' : 'text-violet-700'
                                                                        : themeClasses.textPrimary
                                                                    }`}>
                                                                    {m.name}
                                                                </p>
                                                                {m.coming_soon && (
                                                                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${isDark
                                                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                                                                        }`}>
                                                                        Coming Soon
                                                                    </span>
                                                                )}
                                                                {m.badge && !m.coming_soon && (
                                                                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${getBadgeStyle(m.badge_color)}`}>
                                                                        {m.badge}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className={`text-xs mt-1 line-clamp-2 ${themeClasses.textMuted}`}>
                                                                {m.description}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${providerStyle.bg} ${providerStyle.text} ${providerStyle.border}`}>
                                                                    {providerColors[m.provider]?.label || 'AI'}
                                                                </span>
                                                                <span className={`text-xs font-medium ${themeClasses.textSecondary}`}>
                                                                    {m.credits_cost} credits/{type === 'video' ? 'sec' : 'image'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isSelected && !isDisabled && (
                                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${isDark ? 'bg-violet-500' : 'bg-violet-500'
                                                                }`}>
                                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Settings Toggle */}
                                <div>
                                    <button
                                        onClick={() => setShowSettings(!showSettings)}
                                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                                            }`}
                                    >
                                        <svg className={`w-4 h-4 transition-transform duration-200 ${showSettings ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        Advanced Settings
                                    </button>

                                    {showSettings && (
                                        <div className="mt-4 space-y-5">
                                            {type === 'video' && (
                                                <>
                                                    {/* NOTE: Aspect Ratio and Resolution are NOT supported by preview models */}
                                                    {/* They will be re-enabled when using stable/GA model versions */}

                                                    {/* Duration */}
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <label className={`text-xs font-semibold uppercase tracking-wide ${themeClasses.textMuted}`}>
                                                                Duration
                                                            </label>
                                                            <span className={`text-sm font-bold ${themeClasses.textPrimary}`}>
                                                                {params.duration}s
                                                            </span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min={4}
                                                            max={selectedModel?.max_duration || 8}
                                                            value={params.duration || 6}
                                                            onChange={(e) => setParams(p => ({ ...p, duration: parseInt(e.target.value) }))}
                                                            className={`w-full h-2 rounded-full appearance-none cursor-pointer ${isDark ? 'bg-[#2a2a2a]' : 'bg-slate-200'
                                                                }`}
                                                            style={{
                                                                background: `linear-gradient(to right, ${isDark ? '#8b5cf6' : '#7c3aed'} 0%, ${isDark ? '#8b5cf6' : '#7c3aed'} ${((params.duration - 4) / ((selectedModel?.max_duration || 8) - 4)) * 100}%, ${isDark ? '#334155' : '#e2e8f0'} ${((params.duration - 4) / ((selectedModel?.max_duration || 8) - 4)) * 100}%, ${isDark ? '#334155' : '#e2e8f0'} 100%)`
                                                            }}
                                                        />
                                                        <div className={`flex justify-between text-xs mt-1 ${themeClasses.textMuted}`}>
                                                            <span>4s</span>
                                                            <span>{selectedModel?.max_duration || 8}s</span>
                                                        </div>
                                                    </div>

                                                    {/* Audio Toggle */}
                                                    {selectedModel?.features?.includes('audio-generation') && (
                                                        <div className={`flex items-center justify-between p-4 rounded-xl transition-colors ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-slate-50 border border-slate-200'
                                                            }`}>
                                                            <div>
                                                                <p className={`text-sm font-semibold ${themeClasses.textPrimary}`}>
                                                                    🔊 Generate Audio
                                                                </p>
                                                                <p className={`text-xs mt-0.5 ${themeClasses.textMuted}`}>
                                                                    Include dialogue and sound effects
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => setParams(p => ({ ...p, generate_audio: !p.generate_audio }))}
                                                                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${params.generate_audio
                                                                    ? 'bg-violet-600'
                                                                    : isDark ? 'bg-[#2a2a2a]' : 'bg-slate-300'
                                                                    }`}
                                                            >
                                                                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${params.generate_audio ? 'translate-x-5' : 'translate-x-0'
                                                                    }`} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {type === 'image' && (
                                                <>
                                                    {/* Aspect Ratio for Images */}
                                                    <div>
                                                        <label className={`block text-xs font-semibold mb-2 uppercase tracking-wide ${themeClasses.textMuted}`}>
                                                            Aspect Ratio
                                                        </label>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {aspectRatios.map((ar) => (
                                                                <button
                                                                    key={ar.label}
                                                                    onClick={() => setParams(p => ({ ...p, width: ar.w, height: ar.h, aspect_ratio: ar.label }))}
                                                                    className={`py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 border ${params.width === ar.w && params.height === ar.h
                                                                        ? isDark
                                                                            ? 'bg-violet-600/30 text-violet-300 border-violet-500/50'
                                                                            : 'bg-violet-100 text-violet-700 border-violet-300'
                                                                        : isDark
                                                                            ? 'bg-[#1a1a1a] text-slate-400 border-[#2a2a2a] hover:text-white hover:border-[#3a3a3a]'
                                                                            : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
                                                                        }`}
                                                                >
                                                                    <span className="block text-base mb-0.5">{ar.icon}</span>
                                                                    {ar.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Negative Prompt */}
                                                    <div>
                                                        <label className={`block text-xs font-semibold mb-2 uppercase tracking-wide ${themeClasses.textMuted}`}>
                                                            Negative Prompt
                                                        </label>
                                                        <textarea
                                                            value={negativePrompt}
                                                            onChange={(e) => setNegativePrompt(e.target.value)}
                                                            placeholder="What to avoid..."
                                                            rows={2}
                                                            className={`w-full px-4 py-3 rounded-xl resize-none text-sm transition-all duration-200 border focus:outline-none focus:ring-2 ${isDark
                                                                ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-slate-500 focus:border-violet-500 focus:ring-violet-500/20'
                                                                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-400 focus:ring-violet-400/20'
                                                                }`}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Generate Button */}
                                <button
                                    onClick={handleGenerate}
                                    disabled={!prompt.trim() || !model || generating}
                                    className={`w-full py-4 rounded-xl font-semibold text-base transition-all duration-200 ${prompt.trim() && model && !generating
                                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/30 active:scale-[0.98]'
                                        : isDark
                                            ? 'bg-[#1a1a1a] text-slate-500 cursor-not-allowed'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    {generating ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Generating...
                                        </span>
                                    ) : (
                                        <>✨ Generate · {calculateEstimatedCost()} credits</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Right Panel - Preview */}
                        <div className="flex-1 p-6">
                            <div className={`h-full min-h-[600px] rounded-2xl overflow-hidden transition-colors ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200 shadow-sm'
                                }`}>
                                {currentGeneration?.status === 'completed' && currentGeneration.result_url ? (
                                    <div className="relative h-full flex items-center justify-center p-4">
                                        {currentGeneration.type === 'image' ? (
                                            <img
                                                src={currentGeneration.result_url}
                                                alt=""
                                                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                                            />
                                        ) : (
                                            <video
                                                src={currentGeneration.result_url}
                                                controls
                                                autoPlay
                                                loop
                                                className="max-w-full max-h-full rounded-xl shadow-2xl"
                                            />
                                        )}

                                        {/* Actions */}
                                        <div className="absolute bottom-6 right-6 flex gap-2">
                                            <a
                                                href={currentGeneration.download_url || currentGeneration.result_url}
                                                download
                                                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isDark
                                                    ? 'bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] border border-[#2a2a2a]'
                                                    : 'bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-lg'
                                                    }`}
                                            >
                                                ⬇️ Download
                                            </a>

                                            {/* Save to Media with Folder Selection */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                                                    className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-500/25 flex items-center gap-2"
                                                >
                                                    💾 Save to Media
                                                    <svg className={`w-4 h-4 transition-transform ${showSaveDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>

                                                {showSaveDropdown && (
                                                    <div className={`absolute right-0 bottom-full mb-2 w-56 rounded-xl shadow-xl border overflow-hidden ${isDark
                                                        ? 'bg-[#1a1a1a] border-[#2a2a2a]'
                                                        : 'bg-white border-slate-200'
                                                        }`}>
                                                        <Link
                                                            href={`/media/save-from-ai/${currentGeneration.id}`}
                                                            method="post"
                                                            data={{ folder: '/' }}
                                                            as="button"
                                                            onClick={() => setShowSaveDropdown(false)}
                                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${isDark
                                                                ? 'text-white hover:bg-[#2a2a2a]'
                                                                : 'text-slate-900 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                            </svg>
                                                            <span>Save to Root</span>
                                                        </Link>
                                                        <button
                                                            onClick={() => {
                                                                setShowSaveDropdown(false);
                                                                setShowFolderModal(true);
                                                            }}
                                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all border-t ${isDark
                                                                ? 'text-white hover:bg-[#2a2a2a] border-[#2a2a2a]'
                                                                : 'text-slate-900 hover:bg-slate-50 border-slate-100'
                                                                }`}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                                            </svg>
                                                            <span>Choose Folder...</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : currentGeneration?.status === 'processing' || currentGeneration?.status === 'pending' ? (
                                    <div className="h-full flex flex-col items-center justify-center">
                                        <div className="relative">
                                            <div className={`w-20 h-20 rounded-full border-4 border-t-transparent animate-spin ${isDark ? 'border-violet-500/30 border-t-violet-500' : 'border-violet-200 border-t-violet-500'
                                                }`} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-3xl">{type === 'video' ? '🎬' : '🖼️'}</span>
                                            </div>
                                        </div>
                                        <p className={`mt-6 text-base font-semibold ${themeClasses.textPrimary}`}>
                                            Creating your {type}...
                                        </p>

                                        {/* Elapsed Time Timer */}
                                        <div className={`mt-4 flex items-center gap-3 px-5 py-3 rounded-xl ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-slate-50 border border-slate-200'}`}>
                                            <div className={`text-2xl font-mono font-bold ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                                                {formatElapsedTime(elapsedTime)}
                                            </div>
                                            <div className={`text-xs ${themeClasses.textMuted}`}>
                                                elapsed
                                            </div>
                                        </div>

                                        <p className={`mt-4 text-sm max-w-md text-center ${themeClasses.textMuted}`}>
                                            {currentGeneration.prompt?.substring(0, 100)}...
                                        </p>
                                        <div className={`mt-3 px-3 py-1.5 rounded-full text-xs font-semibold ${isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-600'
                                            }`}>
                                            {providerColors[currentGeneration.provider]?.label || 'Processing'}
                                        </div>

                                        {/* Tip message */}
                                        <p className={`mt-6 text-xs ${themeClasses.textMuted}`}>
                                            💡 Video generation may take 1-3 minutes. Page refresh won't lose progress.
                                        </p>
                                    </div>
                                ) : currentGeneration?.status === 'failed' ? (
                                    <div className="h-full flex flex-col items-center justify-center">
                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isDark ? 'bg-rose-500/10' : 'bg-rose-50'
                                            }`}>
                                            <span className="text-4xl">❌</span>
                                        </div>
                                        <p className={`mt-6 text-base font-semibold ${themeClasses.textPrimary}`}>
                                            Generation failed
                                        </p>
                                        <p className={`mt-2 text-sm max-w-md text-center ${themeClasses.textMuted}`}>
                                            {currentGeneration.error_message || 'Something went wrong. Please try again.'}
                                        </p>
                                        <p className={`mt-3 text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                            ✓ Credits have been refunded
                                        </p>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center">
                                        <div className={`w-24 h-24 rounded-2xl flex items-center justify-center ${isDark
                                            ? 'bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20'
                                            : 'bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100'
                                            }`}>
                                            <span className="text-5xl">{type === 'video' ? '🎬' : '🖼️'}</span>
                                        </div>
                                        <p className={`mt-6 text-base font-semibold ${themeClasses.textPrimary}`}>
                                            Ready to create
                                        </p>
                                        <p className={`mt-2 text-sm ${themeClasses.textMuted}`}>
                                            Your {type} will appear here
                                        </p>
                                    </div>
                                )}
                            </div>


                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                /* Force dark background on body when in dark mode */
                body {
                    background-color: ${isDark ? '#0a0a0a' : '#fafafa'} !important;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: ${isDark ? '#475569' : '#cbd5e1'};
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: ${isDark ? '#64748b' : '#94a3b8'};
                }
            `}</style>

            {/* Folder Selection Modal */}
            <FolderSelectModal
                isOpen={showFolderModal}
                onClose={() => setShowFolderModal(false)}
                onSelect={(folder) => {
                    if (currentGeneration) {
                        router.post(`/media/save-from-ai/${currentGeneration.id}`, { folder });
                    }
                }}
                folders={folders}
                isDark={isDark}
                title="Save to Folder"
            />
        </AppLayout>
    );
}
