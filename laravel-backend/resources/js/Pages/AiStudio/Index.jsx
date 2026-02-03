import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { aiStudioApi } from '@/services/api';
import AppLayout from '../../Layouts/AppLayout';
import { useToast } from '@/Components/Layout/ToastProvider';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { useTheme } from '@/Contexts/ThemeContext';
import FolderSelectModal from '@/Components/Media/FolderSelectModal';
import ScenarioTab from '@/Components/AiStudio/ScenarioTab';
import JobsQueuePanel from '@/Components/AiStudio/JobsQueuePanel';

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

export default function AiStudioIndex({ currentCredits = 0, imageModels = [], videoModels = [], recentGenerations = [], folders = [], activeGenerations = [], activeScenarios = [] }) {
    const { t } = useTranslation();
    const { auth } = usePage().props;
    const { addToast } = useToast();
    const { showConfirm } = useConfirm();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const textareaRef = useRef(null);
    const currentGenerationRef = useRef(null);

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
    const [previewGeneration, setPreviewGeneration] = useState(null); // For modal preview

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
                : models.find(m => m.id === 'imagen-4-standard') || models[0];
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

    // Keep ref in sync with state for WebSocket handlers
    useEffect(() => {
        currentGenerationRef.current = currentGeneration;
    }, [currentGeneration]);

    // WebSocket listeners for real-time AI generation updates
    useEffect(() => {
        if (!window.Echo || !auth?.user?.id) return;

        const channel = window.Echo.channel(`user.${auth.user.id}`);

        // Listen for generation completion
        const completedHandler = (event) => {
            console.log('AI Generation completed:', event);
            const currentGen = currentGenerationRef.current;

            // Update history
            setHistory(prev => {
                const index = prev.findIndex(g => g.id === event.generation_id);
                if (index >= 0) {
                    const updated = [...prev];
                    updated[index] = {
                        ...updated[index],
                        status: 'completed',
                        result_url: event.result_url,
                        result_path: event.result_path,
                    };
                    return updated;
                }
                return prev;
            });

            // Update current generation if it matches
            if (currentGen?.id === event.generation_id) {
                setCurrentGeneration(prev => ({
                    ...prev,
                    status: 'completed',
                    result_url: event.result_url,
                    result_path: event.result_path,
                }));
                setGenerating(false);
                addToast(t('ai_studio.generation_completed', { defaultValue: 'Generation completed successfully!' }), 'success');
            }
        };

        // Listen for generation failure
        const failedHandler = (event) => {
            console.log('AI Generation failed:', event);
            const currentGen = currentGenerationRef.current;

            // Update history
            setHistory(prev => {
                const index = prev.findIndex(g => g.id === event.generation_id);
                if (index >= 0) {
                    const updated = [...prev];
                    updated[index] = {
                        ...updated[index],
                        status: 'failed',
                        error_message: event.error_message,
                    };
                    return updated;
                }
                return prev;
            });

            // Update current generation if it matches
            if (currentGen?.id === event.generation_id) {
                setCurrentGeneration(prev => ({
                    ...prev,
                    status: 'failed',
                    error_message: event.error_message,
                }));
                setGenerating(false);
                addToast(`Generation failed: ${event.error_message}`, 'error');
            }
        };

        channel.listen('.ai-generation.completed', completedHandler);
        channel.listen('.ai-generation.failed', failedHandler);

        return () => {
            channel.stopListening('.ai-generation.completed', completedHandler);
            channel.stopListening('.ai-generation.failed', failedHandler);
        };
    }, [auth?.user?.id, addToast, t]); // Removed currentGeneration?.id - use ref instead

    // Fallback polling for status updates (in case WebSocket fails)
    useEffect(() => {
        if (!currentGeneration || !currentGeneration.id) return;
        if (currentGeneration.status === 'completed' || currentGeneration.status === 'failed') {
            setGenerating(false);
            return;
        }

        // Poll less frequently since WebSocket handles real-time updates
        const interval = setInterval(async () => {
            try {
                const result = await aiStudioApi.getGenerationStatus(currentGeneration.id);
                if (result.success) {
                    setCurrentGeneration(result.data.generation);
                    if (result.data.generation.status === 'completed' || result.data.generation.status === 'failed') {
                        setHistory(prev => [result.data.generation, ...prev.filter(g => g.id !== currentGeneration.id)]);
                        setGenerating(false);
                    }
                }
            } catch (error) {
                console.error('Failed to check status:', error);
            }
        }, 10000); // Poll every 10 seconds as fallback

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

            const result = await aiStudioApi.generate(endpoint, payload);

            if (result.success) {
                // Job queued - add to history, it will show "processing" status
                setCurrentGeneration(result.data.generation);
                setHistory(prev => [result.data.generation, ...prev]);
                router.reload({ only: ['currentCredits'] });
                addToast('Generation queued successfully!', 'success');
            } else {
                addToast(result.error || 'An error occurred', 'error');
            }
        } catch (error) {
            addToast(error.message || 'An error occurred', 'error');
        } finally {
            // Stop loading immediately after job is queued
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

    const handleRetry = async (generationId) => {
        const confirmed = await showConfirm({
            title: t('ai_studio.retry_title', { defaultValue: 'Xác nhận thử lại' }),
            message: t('ai_studio.confirm_retry', { defaultValue: 'Thử lại generation này? Credit sẽ bị trừ lại.' }),
            confirmText: t('ai_studio.retry', { defaultValue: 'Thử lại' }),
            cancelText: t('common.cancel', { defaultValue: 'Hủy' }),
            type: 'warning',
            icon: '🔄',
        });

        if (!confirmed) return;

        router.post(`/ai-studio/generations/${generationId}/retry`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                addToast(t('ai_studio.retry_started', { defaultValue: 'Generation retry started!' }), 'success');
            },
            onError: (errors) => {
                addToast(errors.message || t('common.error', { defaultValue: 'An error occurred' }), 'error');
            },
        });
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
                    {/* Header - Simplified */}
                    <div className={`sticky top-0 z-20 px-6 py-3 border-b backdrop-blur-xl transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a]/90 border-[#1a1a1a]' : 'bg-white/90 border-slate-200'
                        }`}>
                        <div className="flex items-center justify-between">
                            {/* Left: Logo + Title */}
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-violet-600 to-indigo-600' : 'bg-gradient-to-br from-violet-500 to-indigo-500'
                                    }`}>
                                    <span className="text-white text-lg">✨</span>
                                </div>
                                <h1 className={`text-xl font-bold ${themeClasses.textPrimary}`}>
                                    AI Studio
                                </h1>
                            </div>

                            {/* Right: Credits + Actions */}
                            <div className="flex items-center gap-3">
                                {/* Credits Display */}
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-slate-50 border border-slate-200'
                                    }`}>
                                    <span className="text-lg">✨</span>
                                    <span className={`font-bold ${themeClasses.textPrimary}`}>{currentCredits.toLocaleString()}</span>
                                    <span className={`text-sm ${themeClasses.textMuted}`}>credits</span>
                                </div>

                                <Link
                                    href="/ai-credits"
                                    className="px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 transition-all duration-200 shadow-lg shadow-violet-500/25"
                                >
                                    Buy Credits
                                </Link>

                                <Link
                                    href="/ai-studio/generations"
                                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${isDark
                                        ? 'text-slate-400 hover:text-white hover:bg-[#1a1a1a]'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                        }`}
                                >
                                    Gallery
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Scenario Tab with Jobs Queue on Right */}
                    {type === 'scenario' && (
                        <div className="flex">
                            <div className="flex-1">
                                <ScenarioTab
                                    isDark={isDark}
                                    themeClasses={themeClasses}
                                    videoModels={videoModels}
                                    imageModels={imageModels}
                                    currentCredits={currentCredits}
                                    onCreditsUpdate={() => router.reload({ only: ['currentCredits'] })}
                                    addToast={addToast}
                                    activeScenarios={activeScenarios}
                                />
                            </div>
                            {/* Jobs Queue Panel - Right Side */}
                            <div className={`w-[320px] flex-shrink-0 border-l transition-colors ${themeClasses.border}`}>
                                <div className="sticky top-0 h-screen overflow-y-auto p-4">
                                    <JobsQueuePanel
                                        activeGenerations={activeGenerations}
                                        activeScenarios={activeScenarios}
                                        isDark={isDark}
                                        recentGenerations={history.slice(0, 5)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Video/Image Generation */}
                    {type !== 'scenario' && (
                        <div className="flex">
                            {/* Left Panel - Input */}
                            <div className={`w-[480px] flex-shrink-0 border-r transition-colors ${themeClasses.border}`}>
                                <div className="p-6 space-y-7">
                                    {/* Type Selector */}
                                    <div>
                                        <label className={`block text-xs font-semibold mb-3 uppercase tracking-wide ${themeClasses.textMuted}`}>
                                            Generation Type
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => handleTypeChange('video')}
                                                className={`group relative p-4 rounded-xl border-2 transition-all duration-300 text-left ${type === 'video'
                                                    ? isDark
                                                        ? 'bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border-violet-500/50 shadow-lg shadow-violet-500/20'
                                                        : 'bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-400 shadow-md'
                                                    : isDark
                                                        ? 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a] hover:scale-[1.02]'
                                                        : 'bg-white border-slate-200 hover:border-slate-300 hover:scale-[1.02]'
                                                    }`}
                                            >
                                                <div className={`text-3xl mb-2 ${type === 'video' ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>
                                                    🎬
                                                </div>
                                                <div className={`text-sm font-semibold ${type === 'video' ? (isDark ? 'text-violet-300' : 'text-violet-700') : themeClasses.textPrimary}`}>
                                                    Video
                                                </div>
                                                <div className={`text-xs mt-0.5 ${themeClasses.textMuted}`}>
                                                    Generate videos
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => handleTypeChange('image')}
                                                className={`group relative p-4 rounded-xl border-2 transition-all duration-300 text-left ${type === 'image'
                                                    ? isDark
                                                        ? 'bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border-violet-500/50 shadow-lg shadow-violet-500/20'
                                                        : 'bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-400 shadow-md'
                                                    : isDark
                                                        ? 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a] hover:scale-[1.02]'
                                                        : 'bg-white border-slate-200 hover:border-slate-300 hover:scale-[1.02]'
                                                    }`}
                                            >
                                                <div className={`text-3xl mb-2 ${type === 'image' ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>
                                                    🖼️
                                                </div>
                                                <div className={`text-sm font-semibold ${type === 'image' ? (isDark ? 'text-violet-300' : 'text-violet-700') : themeClasses.textPrimary}`}>
                                                    Image
                                                </div>
                                                <div className={`text-xs mt-0.5 ${themeClasses.textMuted}`}>
                                                    Generate images
                                                </div>
                                            </button>
                                        </div>
                                    </div>
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
                                        <div className="relative group">
                                            <textarea
                                                ref={textareaRef}
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                placeholder={generationMode === 'image'
                                                    ? "Describe how the image should animate..."
                                                    : "✨ Describe what you want to create... Be specific for best results!"
                                                }
                                                disabled={generating}
                                                rows={5}
                                                className={`w-full px-4 py-4 rounded-xl resize-none text-sm transition-all duration-300 border-2 focus:outline-none ${isDark
                                                    ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-slate-500 focus:border-violet-500 focus:shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                                                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-400 focus:shadow-[0_0_20px_rgba(139,92,246,0.1)]'
                                                    }`}
                                            />
                                            {/* Character count */}
                                            <div className={`absolute bottom-3 right-3 text-xs ${prompt.length > 0 ? (isDark ? 'text-violet-400' : 'text-violet-600') : themeClasses.textMuted}`}>
                                                {prompt.length}/500
                                            </div>
                                        </div>
                                    </div>

                                    {/* Model Selection */}
                                    <div>
                                        <label className={`block text-xs font-semibold mb-3 uppercase tracking-wide ${themeClasses.textMuted}`}>
                                            AI Model
                                        </label>
                                        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                                            {models.map((m) => {
                                                const providerStyle = getProviderStyle(m.provider);
                                                const isSelected = model === m.id;
                                                const isDisabled = !m.enabled || m.coming_soon;
                                                return (
                                                    <button
                                                        key={m.id}
                                                        onClick={() => !isDisabled && setModel(m.id)}
                                                        disabled={isDisabled}
                                                        className={`w-full p-5 rounded-xl text-left transition-all duration-300 border-2 group ${isDisabled
                                                            ? isDark
                                                                ? 'bg-slate-900/50 border-slate-800 cursor-not-allowed opacity-60'
                                                                : 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-60'
                                                            : isSelected
                                                                ? isDark
                                                                    ? 'bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border-violet-500/50 shadow-lg shadow-violet-500/20'
                                                                    : 'bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-400 shadow-md'
                                                                : isDark
                                                                    ? 'bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#2a2a2a] hover:border-[#3a3a3a] hover:scale-[1.02]'
                                                                    : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:scale-[1.02]'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                {/* Model Name + Badges */}
                                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                                    <p className={`text-base font-bold truncate ${isDisabled
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

                                                                {/* Description */}
                                                                <p className={`text-sm leading-relaxed mb-3 line-clamp-2 ${themeClasses.textMuted}`}>
                                                                    {m.description}
                                                                </p>

                                                                {/* Footer: Provider + Cost */}
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${providerStyle.bg} ${providerStyle.text} ${providerStyle.border}`}>
                                                                        {providerColors[m.provider]?.label || 'AI'}
                                                                    </span>
                                                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                                                                        }`}>
                                                                        {m.credits_cost} credits/{type === 'video' ? 'sec' : 'img'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Selection Indicator */}
                                                            {isSelected && !isDisabled && (
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-violet-500' : 'bg-violet-500'
                                                                    }`}>
                                                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                                    {/* Video Settings - Always Visible */}
                                    {type === 'video' && (
                                        <>
                                            {/* Duration */}
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
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
                                                <div className={`flex items-center justify-between p-4 rounded-xl transition-colors border ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-slate-50 border-slate-200'
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

                                    {/* Image Settings - Always Visible */}
                                    {type === 'image' && (
                                        <>
                                            {/* Aspect Ratio for Images */}
                                            <div>
                                                <label className={`block text-xs font-semibold mb-3 uppercase tracking-wide ${themeClasses.textMuted}`}>
                                                    Aspect Ratio
                                                </label>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {aspectRatios.map((ar) => (
                                                        <button
                                                            key={ar.label}
                                                            onClick={() => setParams(p => ({ ...p, width: ar.w, height: ar.h, aspect_ratio: ar.label }))}
                                                            className={`py-3 text-xs font-semibold rounded-xl transition-all duration-300 border-2 ${params.width === ar.w && params.height === ar.h
                                                                ? isDark
                                                                    ? 'bg-violet-600/30 text-violet-300 border-violet-500/50 shadow-lg shadow-violet-500/20'
                                                                    : 'bg-violet-100 text-violet-700 border-violet-400 shadow-md'
                                                                : isDark
                                                                    ? 'bg-[#1a1a1a] text-slate-400 border-[#2a2a2a] hover:text-white hover:border-[#3a3a3a] hover:scale-[1.02]'
                                                                    : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300 hover:scale-[1.02]'
                                                                }`}
                                                        >
                                                            <span className="block text-lg mb-1">{ar.icon}</span>
                                                            {ar.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Negative Prompt */}
                                            <div>
                                                <label className={`block text-xs font-semibold mb-3 uppercase tracking-wide ${themeClasses.textMuted}`}>
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

                                    {/* Generate Button */}
                                    <button
                                        onClick={handleGenerate}
                                        disabled={!prompt.trim() || !model || generating}
                                        className={`group relative w-full py-4 rounded-xl font-semibold text-base transition-all duration-300 overflow-hidden ${prompt.trim() && model && !generating
                                            ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 bg-[length:200%_100%] animate-gradient-x text-white hover:shadow-xl hover:shadow-violet-500/40 active:scale-[0.98]'
                                            : isDark
                                                ? 'bg-[#1a1a1a] text-slate-500 cursor-not-allowed'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {/* Shimmer effect */}
                                        {prompt.trim() && model && !generating && (
                                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                        )}
                                        <span className="relative">
                                            {generating ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Đang tạo...
                                                </span>
                                            ) : (
                                                <>✨ Tạo ngay · {calculateEstimatedCost()} credits</>
                                            )}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Right Panel - History Grid */}
                            <div className="flex-1 p-6 overflow-y-auto">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className={`text-lg font-bold ${themeClasses.textPrimary}`}>
                                        {type === 'image' ? '🖼️ Ảnh gần đây' : '🎬 Video gần đây'}
                                    </h2>
                                    <Link
                                        href="/ai-studio/generations"
                                        className={`text-sm font-medium ${isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'}`}
                                    >
                                        Xem tất cả →
                                    </Link>
                                </div>

                                {/* History Grid - Filtered by type */}
                                {history.filter(g => g.type === type).length > 0 ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        {history.filter(g => g.type === type).map((gen) => (
                                            <div
                                                key={gen.id}
                                                onClick={() => gen.status === 'completed' && gen.result_url && setPreviewGeneration(gen)}
                                                className={`group relative rounded-xl overflow-hidden border-2 transition-all duration-200 hover:scale-[1.02] cursor-pointer ${isDark
                                                    ? 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-violet-500/50'
                                                    : 'bg-white border-slate-200 hover:border-violet-400'
                                                    }`}
                                            >
                                                {/* Thumbnail */}
                                                <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                                                    {gen.status === 'completed' && gen.result_url ? (
                                                        gen.type === 'image' ? (
                                                            <img
                                                                src={gen.result_url}
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <video
                                                                src={gen.result_url}
                                                                className="w-full h-full object-cover"
                                                                muted
                                                                onMouseEnter={(e) => e.target.play()}
                                                                onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                                                            />
                                                        )
                                                    ) : gen.status === 'processing' || gen.status === 'pending' ? (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <div className={`w-12 h-12 rounded-full border-4 border-t-transparent animate-spin ${isDark ? 'border-violet-500/30 border-t-violet-500' : 'border-violet-200 border-t-violet-500'}`} />
                                                        </div>
                                                    ) : gen.status === 'failed' ? (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <span className="text-4xl">❌</span>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <span className="text-4xl">{gen.type === 'video' ? '🎬' : '🖼️'}</span>
                                                        </div>
                                                    )}

                                                    {/* Status Badge */}
                                                    <div className="absolute top-2 left-2">
                                                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${gen.status === 'completed'
                                                            ? 'bg-emerald-500/90 text-white'
                                                            : gen.status === 'processing' || gen.status === 'pending'
                                                                ? 'bg-amber-500/90 text-white'
                                                                : 'bg-rose-500/90 text-white'
                                                            }`}>
                                                            {gen.status === 'completed' ? '✓' : gen.status === 'processing' ? '⏳' : gen.status === 'pending' ? '⏳' : '✗'}
                                                        </span>
                                                    </div>

                                                    {/* Type Badge */}
                                                    <div className="absolute top-2 right-2">
                                                        <span className={`px-2 py-1 text-[10px] font-semibold rounded-md ${isDark ? 'bg-black/50 text-white' : 'bg-white/80 text-slate-700'}`}>
                                                            {gen.type === 'video' ? '🎬' : '🖼️'}
                                                        </span>
                                                    </div>

                                                    {/* Hover Actions */}
                                                    {gen.status === 'completed' && gen.result_url && (
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                            <a
                                                                href={gen.result_url}
                                                                download
                                                                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                                                                title="Download"
                                                            >
                                                                ⬇️
                                                            </a>
                                                            <button
                                                                onClick={() => {
                                                                    setCurrentGeneration(gen);
                                                                    setShowFolderModal(true);
                                                                }}
                                                                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                                                                title="Save to Media"
                                                            >
                                                                💾
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Retry for Failed */}
                                                    {gen.status === 'failed' && (
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <button
                                                                onClick={() => handleRetry(gen.id)}
                                                                className="px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
                                                            >
                                                                🔄 Thử lại
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="p-3">
                                                    <p className={`text-xs font-medium truncate ${themeClasses.textPrimary}`}>
                                                        "{gen.prompt?.substring(0, 30)}..."
                                                    </p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className={`text-[10px] ${themeClasses.textMuted}`}>
                                                            {gen.model}
                                                        </span>
                                                        <span className={`text-[10px] font-medium ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                                                            {gen.credits_used} ✨
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed transition-all ${isDark ? 'border-[#2a2a2a] bg-gradient-to-br from-violet-500/5 to-indigo-500/5' : 'border-slate-200 bg-gradient-to-br from-violet-50/50 to-indigo-50/50'}`}>
                                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 ${isDark ? 'bg-gradient-to-br from-violet-600/20 to-indigo-600/20' : 'bg-gradient-to-br from-violet-100 to-indigo-100'}`}>
                                            <span className="text-4xl">{type === 'image' ? '🖼️' : '🎬'}</span>
                                        </div>
                                        <p className={`text-lg font-semibold ${themeClasses.textPrimary}`}>
                                            Chưa có {type === 'image' ? 'ảnh' : 'video'} nào
                                        </p>
                                        <p className={`text-sm mt-2 ${themeClasses.textMuted}`}>
                                            Nhập prompt và nhấn Generate để bắt đầu
                                        </p>
                                        <button
                                            onClick={() => textareaRef.current?.focus()}
                                            className={`mt-5 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isDark 
                                                ? 'bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 border border-violet-500/30' 
                                                : 'bg-violet-100 text-violet-700 hover:bg-violet-200 border border-violet-200'
                                            }`}
                                        >
                                            ✨ Bắt đầu tạo
                                        </button>
                                    </div>
                                )}

                                {/* Active Jobs Section */}
                                {(activeGenerations?.length > 0 || activeScenarios?.length > 0) && (
                                    <div className="mt-6">
                                        <h3 className={`text-sm font-semibold mb-3 ${themeClasses.textPrimary}`}>
                                            ⚡ Đang xử lý
                                        </h3>
                                        <div className="space-y-2">
                                            {activeGenerations?.map((gen) => (
                                                <div
                                                    key={gen.id}
                                                    className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-violet-50 border border-violet-100'}`}
                                                >
                                                    <div className={`w-8 h-8 rounded-full border-2 border-t-transparent animate-spin ${isDark ? 'border-violet-500/50 border-t-violet-400' : 'border-violet-200 border-t-violet-500'}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium truncate ${themeClasses.textPrimary}`}>
                                                            {gen.prompt?.substring(0, 40)}...
                                                        </p>
                                                        <p className={`text-xs ${themeClasses.textMuted}`}>
                                                            {gen.model} • {gen.type}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
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

            {/* Preview Modal - Use Portal for proper centering */}
            {typeof document !== 'undefined' && previewGeneration && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95"
                    style={{ top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={() => setPreviewGeneration(null)}
                >
                    {/* Close Button - Top Right */}
                    <button
                        onClick={() => setPreviewGeneration(null)}
                        className="absolute top-4 right-4 z-20 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-sm"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Media Container - Centered */}
                    <div
                        className="relative max-w-[80vw] max-h-[60vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {previewGeneration.type === 'video' ? (
                            <video
                                src={previewGeneration.result_url}
                                className="max-w-[80vw] max-h-[60vh] rounded-xl shadow-2xl"
                                controls
                                autoPlay
                            />
                        ) : (
                            <img
                                src={previewGeneration.result_url}
                                alt={previewGeneration.prompt}
                                className="max-w-[80vw] max-h-[60vh] rounded-xl shadow-2xl object-contain"
                            />
                        )}

                        {/* Floating Action Bar - Bottom of Image */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10">
                            {/* Type Badge */}
                            <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-violet-500/30 text-violet-300 border border-violet-500/30">
                                {previewGeneration.type === 'video' ? '🎬 Video' : '🖼️ Ảnh'}
                            </span>

                            {/* Model */}
                            <span className="text-xs text-white/60 hidden sm:inline">
                                {previewGeneration.model}
                            </span>

                            {/* Divider */}
                            <div className="w-px h-6 bg-white/20" />

                            {/* Download */}
                            <a
                                href={previewGeneration.result_url}
                                download
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Tải xuống
                            </a>

                            {/* Save to Media */}
                            <button
                                onClick={() => {
                                    setCurrentGeneration(previewGeneration);
                                    setShowFolderModal(true);
                                    setPreviewGeneration(null);
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Lưu Media
                            </button>
                        </div>
                    </div>

                    {/* Prompt - Bottom Left Corner */}
                    <div className="absolute bottom-4 left-4 max-w-md">
                        <p className="text-sm text-white/80 line-clamp-2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-xl">
                            "{previewGeneration.prompt}"
                        </p>
                    </div>

                    {/* Credits - Bottom Right Corner */}
                    <div className="absolute bottom-4 right-4">
                        <span className="text-sm text-white/60 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg">
                            ✨ {previewGeneration.credits_used} credits
                        </span>
                    </div>
                </div>,
                document.body
            )}

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
        </AppLayout >
    );
}
