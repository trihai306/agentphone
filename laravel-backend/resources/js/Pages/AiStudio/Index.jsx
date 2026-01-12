import { useState, useEffect, useRef } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AppLayout from '../../Layouts/AppLayout';
import { useToast } from '@/Components/Layout/ToastProvider';
import { useTheme } from '@/Contexts/ThemeContext';

export default function AiStudioIndex({ currentCredits = 0, imageModels = [], videoModels = [], recentGenerations = [] }) {
    const { t } = useTranslation();
    const { auth } = usePage().props;
    const { addToast } = useToast();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const textareaRef = useRef(null);

    const [type, setType] = useState('image');
    const [model, setModel] = useState('');
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [params, setParams] = useState({ width: 1024, height: 1024 });
    const [generating, setGenerating] = useState(false);
    const [currentGeneration, setCurrentGeneration] = useState(null);
    const [history, setHistory] = useState(recentGenerations);
    const [showSettings, setShowSettings] = useState(false);

    const models = type === 'image' ? imageModels : videoModels;
    const selectedModel = models.find(m => m.id === model);

    useEffect(() => {
        if (models.length > 0 && !model) {
            setModel(models[0].id);
        }
    }, [models]);

    useEffect(() => {
        if (!currentGeneration || !currentGeneration.id) return;
        if (currentGeneration.status === 'completed' || currentGeneration.status === 'failed') return;

        const interval = setInterval(async () => {
            try {
                const response = await axios.get(`/ai-studio/generations/${currentGeneration.id}/status`);
                setCurrentGeneration(response.data.generation);
                if (response.data.generation.status === 'completed' || response.data.generation.status === 'failed') {
                    setHistory(prev => [response.data.generation, ...prev.filter(g => g.id !== currentGeneration.id)]);
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

        if (currentCredits < (selectedModel?.credits_cost || 0)) {
            addToast('Insufficient credits', 'warning');
            return;
        }

        setGenerating(true);
        try {
            const endpoint = type === 'image' ? '/ai-studio/generate/image' : '/ai-studio/generate/video';
            const response = await axios.post(endpoint, {
                model,
                prompt,
                negative_prompt: negativePrompt,
                ...params,
            });

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
        setParams(newType === 'image' ? { width: 1024, height: 1024 } : { duration: 5 });
    };

    const aspectRatios = [
        { label: '1:1', w: 1024, h: 1024 },
        { label: '16:9', w: 1920, h: 1080 },
        { label: '9:16', w: 1080, h: 1920 },
        { label: '4:3', w: 1024, h: 768 },
    ];

    return (
        <AppLayout title="AI Studio">
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1600px] mx-auto">
                    {/* Clean Header */}
                    <div className={`sticky top-0 z-20 px-6 py-4 border-b ${isDark ? 'bg-[#0d0d0d]/95 border-[#1a1a1a]' : 'bg-[#fafafa]/95 border-gray-200'} backdrop-blur-sm`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    AI Studio
                                </h1>

                                {/* Type Tabs */}
                                <div className={`flex p-1 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                                    {['image', 'video'].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => handleTypeChange(t)}
                                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${type === t
                                                    ? isDark
                                                        ? 'bg-white text-black'
                                                        : 'bg-white text-gray-900 shadow-sm'
                                                    : isDark
                                                        ? 'text-gray-400 hover:text-white'
                                                        : 'text-gray-500 hover:text-gray-900'
                                                }`}
                                        >
                                            {t === 'image' ? 'Image' : 'Video'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Credits */}
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Credits:</span>
                                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{currentCredits}</span>
                                </div>

                                <Link
                                    href="/ai-credits"
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${isDark
                                            ? 'bg-white text-black hover:bg-gray-100'
                                            : 'bg-gray-900 text-white hover:bg-gray-800'
                                        }`}
                                >
                                    Buy Credits
                                </Link>

                                <Link
                                    href="/ai-studio/generations"
                                    className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark
                                            ? 'text-gray-400 hover:text-white'
                                            : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Gallery
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="flex">
                        {/* Left Panel - Input */}
                        <div className={`w-[400px] flex-shrink-0 border-r ${isDark ? 'border-[#1a1a1a]' : 'border-gray-200'}`}>
                            <div className="p-6 space-y-6">
                                {/* Prompt */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Prompt
                                    </label>
                                    <textarea
                                        ref={textareaRef}
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Describe what you want to create..."
                                        disabled={generating}
                                        rows={4}
                                        className={`w-full px-4 py-3 rounded-lg resize-none text-sm transition-colors ${isDark
                                                ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-500 focus:border-gray-600'
                                                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400'
                                            } border focus:outline-none`}
                                    />
                                </div>

                                {/* Model Selection */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Model
                                    </label>
                                    <div className="space-y-2">
                                        {models.map((m) => (
                                            <button
                                                key={m.id}
                                                onClick={() => setModel(m.id)}
                                                className={`w-full p-3 rounded-lg text-left transition-all ${model === m.id
                                                        ? isDark
                                                            ? 'bg-white/10 border-white/20'
                                                            : 'bg-gray-900 text-white'
                                                        : isDark
                                                            ? 'bg-[#1a1a1a] border-transparent hover:bg-[#222]'
                                                            : 'bg-white border-gray-200 hover:border-gray-300'
                                                    } border`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className={`text-sm font-medium ${model === m.id && !isDark ? 'text-white' : ''
                                                            }`}>
                                                            {m.name}
                                                        </p>
                                                        <p className={`text-xs mt-0.5 ${model === m.id
                                                                ? isDark ? 'text-gray-400' : 'text-gray-300'
                                                                : isDark ? 'text-gray-500' : 'text-gray-400'
                                                            }`}>
                                                            {m.credits_cost} credits / {type}
                                                        </p>
                                                    </div>
                                                    {model === m.id && (
                                                        <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-white' : 'bg-white'}`} />
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Settings Toggle */}
                                <div>
                                    <button
                                        onClick={() => setShowSettings(!showSettings)}
                                        className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        <svg className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        Advanced Settings
                                    </button>

                                    {showSettings && (
                                        <div className="mt-4 space-y-4">
                                            {type === 'image' && (
                                                <>
                                                    {/* Aspect Ratio */}
                                                    <div>
                                                        <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            Aspect Ratio
                                                        </label>
                                                        <div className="flex gap-2">
                                                            {aspectRatios.map((ar) => (
                                                                <button
                                                                    key={ar.label}
                                                                    onClick={() => setParams(p => ({ ...p, width: ar.w, height: ar.h }))}
                                                                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${params.width === ar.w && params.height === ar.h
                                                                            ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                                                                            : isDark
                                                                                ? 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                                                                                : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                                                                        }`}
                                                                >
                                                                    {ar.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Negative Prompt */}
                                                    <div>
                                                        <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            Negative Prompt
                                                        </label>
                                                        <textarea
                                                            value={negativePrompt}
                                                            onChange={(e) => setNegativePrompt(e.target.value)}
                                                            placeholder="What to avoid..."
                                                            rows={2}
                                                            className={`w-full px-3 py-2 rounded-lg resize-none text-sm ${isDark
                                                                    ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600'
                                                                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                                                                } border focus:outline-none`}
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            {type === 'video' && (
                                                <div>
                                                    <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Duration: {params.duration || 5}s
                                                    </label>
                                                    <input
                                                        type="range"
                                                        min={2}
                                                        max={10}
                                                        value={params.duration || 5}
                                                        onChange={(e) => setParams(p => ({ ...p, duration: parseInt(e.target.value) }))}
                                                        className="w-full accent-gray-900 dark:accent-white"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Generate Button */}
                                <button
                                    onClick={handleGenerate}
                                    disabled={!prompt.trim() || !model || generating}
                                    className={`w-full py-3 rounded-lg font-medium transition-all ${prompt.trim() && model && !generating
                                            ? isDark
                                                ? 'bg-white text-black hover:bg-gray-100'
                                                : 'bg-gray-900 text-white hover:bg-gray-800'
                                            : isDark
                                                ? 'bg-[#1a1a1a] text-gray-600 cursor-not-allowed'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {generating ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Generating...
                                        </span>
                                    ) : (
                                        <>Generate {selectedModel ? `· ${selectedModel.credits_cost} credits` : ''}</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Right Panel - Preview */}
                        <div className="flex-1 p-6">
                            <div className={`h-full min-h-[600px] rounded-xl overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                                {currentGeneration?.status === 'completed' && currentGeneration.result_url ? (
                                    <div className="relative h-full flex items-center justify-center">
                                        {type === 'image' ? (
                                            <img
                                                src={currentGeneration.result_url}
                                                alt=""
                                                className="max-w-full max-h-full object-contain"
                                            />
                                        ) : (
                                            <video
                                                src={currentGeneration.result_url}
                                                controls
                                                autoPlay
                                                loop
                                                className="max-w-full max-h-full"
                                            />
                                        )}

                                        {/* Actions */}
                                        <div className="absolute bottom-4 right-4 flex gap-2">
                                            <a
                                                href={currentGeneration.download_url || currentGeneration.result_url}
                                                download
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDark
                                                        ? 'bg-white text-black hover:bg-gray-100'
                                                        : 'bg-gray-900 text-white hover:bg-gray-800'
                                                    }`}
                                            >
                                                Download
                                            </a>
                                        </div>
                                    </div>
                                ) : currentGeneration?.status === 'processing' || currentGeneration?.status === 'pending' ? (
                                    <div className="h-full flex flex-col items-center justify-center">
                                        <div className={`w-12 h-12 rounded-full border-2 border-t-transparent animate-spin ${isDark ? 'border-white/20 border-t-white' : 'border-gray-300 border-t-gray-900'}`} />
                                        <p className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Generating your {type}...
                                        </p>
                                        <p className={`mt-2 text-xs max-w-md text-center ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                            {currentGeneration.prompt}
                                        </p>
                                    </div>
                                ) : currentGeneration?.status === 'failed' ? (
                                    <div className="h-full flex flex-col items-center justify-center">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                                            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        <p className={`mt-4 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            Generation failed
                                        </p>
                                        <p className={`mt-2 text-xs max-w-md text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {currentGeneration.error_message || 'Something went wrong. Please try again.'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center">
                                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#222]' : 'bg-white'}`}>
                                            <svg className={`w-8 h-8 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <p className={`mt-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Your creation will appear here
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Recent History */}
                            {history.length > 0 && (
                                <div className="mt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Recent
                                        </h3>
                                        <Link
                                            href="/ai-studio/generations"
                                            className={`text-xs ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}
                                        >
                                            View all
                                        </Link>
                                    </div>
                                    <div className="flex gap-3 overflow-x-auto pb-2">
                                        {history.slice(0, 6).map((gen) => (
                                            <button
                                                key={gen.id}
                                                onClick={() => setCurrentGeneration(gen)}
                                                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all ${currentGeneration?.id === gen.id
                                                        ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-[#0d0d0d]'
                                                        : 'hover:opacity-80'
                                                    }`}
                                            >
                                                {gen.result_url && gen.status === 'completed' ? (
                                                    <img src={gen.result_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                                                        {gen.status === 'processing' || gen.status === 'pending' ? (
                                                            <div className={`w-5 h-5 rounded-full border-2 border-t-transparent animate-spin ${isDark ? 'border-gray-600 border-t-white' : 'border-gray-300 border-t-gray-900'}`} />
                                                        ) : (
                                                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
