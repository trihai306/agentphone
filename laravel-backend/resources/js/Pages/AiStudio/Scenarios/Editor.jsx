import { useState, useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useToast } from '@/Components/Layout/ToastProvider';
import { aiStudioApi } from '@/services/api';

export default function Editor({ scenario, currentCredits = 0, videoModels = [], imageModels = [] }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { showToast } = useToast();

    const [scenes, setScenes] = useState(scenario?.scenes || []);
    const [activeSceneIndex, setActiveSceneIndex] = useState(0);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [model, setModel] = useState(scenario?.model || 'kling-1.5-pro');

    const models = scenario?.output_type === 'video' ? videoModels : imageModels;
    const estimatedCredits = scenes.length * (scenario?.output_type === 'video' ? 10 : 2);

    const themeClasses = {
        textPrimary: isDark ? 'text-white' : 'text-slate-900',
        textSecondary: isDark ? 'text-slate-300' : 'text-slate-600',
        textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
        cardBg: isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200',
        inputBg: isDark ? 'bg-black/30 border-white/10 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400',
    };

    const handleUpdateScene = (index, updates) => {
        setScenes(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
    };

    const handleAddScene = () => {
        const newScene = {
            id: Date.now(),
            order: scenes.length + 1,
            description: '',
            prompt: '',
            duration: 5,
            status: 'pending',
        };
        setScenes(prev => [...prev, newScene]);
        setActiveSceneIndex(scenes.length);
    };

    const handleDeleteScene = (index) => {
        if (scenes.length <= 1) {
            showToast('Cần ít nhất 1 cảnh', 'error');
            return;
        }
        setScenes(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
        if (activeSceneIndex >= scenes.length - 1) {
            setActiveSceneIndex(Math.max(0, scenes.length - 2));
        }
    };

    const handleGenerate = async () => {
        if (scenes.length === 0) {
            showToast('Chưa có cảnh nào', 'error');
            return;
        }

        setGenerating(true);
        try {
            // First save final state
            const saveResponse = await fetch('/ai-studio/scenarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: JSON.stringify({
                    script: scenario.script || 'Generated from editor',
                    title: scenario.title,
                    output_type: scenario.output_type,
                    model,
                    scenes: scenes.map((s, i) => ({
                        order: i + 1,
                        description: s.description,
                        prompt: s.prompt,
                        duration: s.duration || 5,
                    })),
                }),
            });

            const saveData = await saveResponse.json();
            if (!saveData.success) {
                throw new Error(saveData.error || 'Không thể lưu');
            }

            // Start generation
            const genResponse = await fetch(`/ai-studio/scenarios/${saveData.scenario.id}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
            });

            const genData = await genResponse.json();
            if (genData.success) {
                showToast('Đã bắt đầu tạo! Đang chuyển trang...', 'success');
                router.visit(`/ai-studio/scenarios/${saveData.scenario.id}`);
            } else {
                throw new Error(genData.error || 'Không thể tạo');
            }
        } catch (error) {
            showToast('Lỗi: ' + error.message, 'error');
        } finally {
            setGenerating(false);
        }
    };

    const activeScene = scenes[activeSceneIndex] || null;

    return (
        <AppLayout title="Chỉnh Sửa Scenes">
            <Head title="Chỉnh Sửa Scenes" />

            <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-slate-50'}`}>
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/ai-studio/scenario-builder"
                                className={`p-2 rounded-xl ${themeClasses.cardBg} border hover:border-violet-500/50 transition-all`}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </Link>
                            <div>
                                <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>
                                    {scenario?.title || 'Chỉnh Sửa Scenes'}
                                </h1>
                                <p className={`text-sm ${themeClasses.textMuted}`}>
                                    Bước 3/4 • {scenes.length} cảnh • {estimatedCredits} credits
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`px-4 py-2 rounded-xl ${isDark ? 'bg-violet-600/20 border border-violet-500/30' : 'bg-violet-100 border border-violet-200'}`}>
                                <span className={`text-sm font-bold ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
                                    {currentCredits.toLocaleString()} credits
                                </span>
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={generating || scenes.length === 0}
                                className="px-6 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all disabled:opacity-50"
                            >
                                {generating ? 'Đang tạo...' : `Tạo (${estimatedCredits} credits)`}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-6">
                        {/* Sidebar - Timeline */}
                        <div className="col-span-4">
                            <div className={`sticky top-24 p-4 rounded-2xl ${themeClasses.cardBg} border`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className={`font-bold ${themeClasses.textPrimary}`}>
                                        Timeline ({scenes.length} cảnh)
                                    </h3>
                                    <button
                                        onClick={handleAddScene}
                                        className="p-2 rounded-lg bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                                    {scenes.map((scene, index) => (
                                        <div
                                            key={scene.id || index}
                                            onClick={() => setActiveSceneIndex(index)}
                                            className={`group p-3 rounded-xl cursor-pointer transition-all ${activeSceneIndex === index
                                                ? isDark ? 'bg-violet-600/20 border border-violet-500/50' : 'bg-violet-50 border border-violet-300'
                                                : isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${activeSceneIndex === index
                                                    ? 'bg-violet-600 text-white'
                                                    : isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-600'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium truncate ${themeClasses.textPrimary}`}>
                                                        {scene.description || 'Chưa có mô tả'}
                                                    </p>
                                                    <p className={`text-xs ${themeClasses.textMuted}`}>
                                                        {scene.duration || 5}s
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteScene(index); }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-rose-500 hover:bg-rose-500/10 transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Main Editor */}
                        <div className="col-span-8">
                            {activeScene ? (
                                <div className={`p-6 rounded-2xl ${themeClasses.cardBg} border`}>
                                    <h3 className={`text-xl font-bold mb-6 ${themeClasses.textPrimary}`}>
                                        Cảnh {activeSceneIndex + 1}
                                    </h3>

                                    {/* Description */}
                                    <div className="mb-6">
                                        <label className={`block text-sm font-bold mb-2 ${themeClasses.textMuted}`}>
                                            Mô tả cảnh
                                        </label>
                                        <textarea
                                            value={activeScene.description || ''}
                                            onChange={(e) => handleUpdateScene(activeSceneIndex, { description: e.target.value })}
                                            placeholder="Mô tả ngắn gọn nội dung cảnh..."
                                            rows={3}
                                            className={`w-full px-4 py-3 rounded-xl border-2 text-sm resize-none ${themeClasses.inputBg} focus:outline-none focus:ring-2 focus:ring-violet-500/50`}
                                        />
                                    </div>

                                    {/* Prompt */}
                                    <div className="mb-6">
                                        <label className={`block text-sm font-bold mb-2 ${themeClasses.textMuted}`}>
                                            Prompt cho AI
                                        </label>
                                        <textarea
                                            value={activeScene.prompt || ''}
                                            onChange={(e) => handleUpdateScene(activeSceneIndex, { prompt: e.target.value })}
                                            placeholder="Prompt chi tiết cho AI tạo ảnh/video..."
                                            rows={6}
                                            className={`w-full px-4 py-3 rounded-xl border-2 text-sm resize-none ${themeClasses.inputBg} focus:outline-none focus:ring-2 focus:ring-violet-500/50`}
                                        />
                                    </div>

                                    {/* Duration */}
                                    {scenario?.output_type === 'video' && (
                                        <div className="mb-6">
                                            <label className={`block text-sm font-bold mb-2 ${themeClasses.textMuted}`}>
                                                Thời lượng (giây)
                                            </label>
                                            <select
                                                value={activeScene.duration || 5}
                                                onChange={(e) => handleUpdateScene(activeSceneIndex, { duration: parseInt(e.target.value) })}
                                                className={`w-full px-4 py-3 rounded-xl border ${themeClasses.inputBg} focus:outline-none focus:ring-2 focus:ring-violet-500/50`}
                                            >
                                                <option value={5}>5 giây</option>
                                                <option value={10}>10 giây</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Model Selection */}
                                    <div>
                                        <label className={`block text-sm font-bold mb-2 ${themeClasses.textMuted}`}>
                                            Model AI
                                        </label>
                                        <select
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                            className={`w-full px-4 py-3 rounded-xl border ${themeClasses.inputBg} focus:outline-none focus:ring-2 focus:ring-violet-500/50`}
                                        >
                                            {models.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className={`p-12 rounded-2xl ${themeClasses.cardBg} border text-center`}>
                                    <p className={themeClasses.textMuted}>Chọn một cảnh để chỉnh sửa</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
