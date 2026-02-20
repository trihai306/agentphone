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

    // Image upload handler
    const handleImageUpload = async (index, file) => {
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            showToast('Chỉ chấp nhận file ảnh', 'error');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showToast('Ảnh phải nhỏ hơn 10MB', 'error');
            return;
        }

        // Convert to base64 for preview and upload
        const reader = new FileReader();
        reader.onload = (e) => {
            handleUpdateScene(index, {
                source_image: e.target.result,
                source_image_name: file.name
            });
            showToast('Đã thêm ảnh tham chiếu', 'success');
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = (index) => {
        handleUpdateScene(index, {
            source_image: null,
            source_image_name: null,
            source_image_path: null
        });
    };

    // AI Image Generation
    const [generatingImageIndex, setGeneratingImageIndex] = useState(null);

    const handleGenerateImage = async (index) => {
        const scene = scenes[index];
        if (!scene?.prompt) {
            showToast('Vui lòng nhập prompt trước', 'error');
            return;
        }

        setGeneratingImageIndex(index);
        try {
            // Start generation
            const genResponse = await aiStudioApi.generate('/ai-studio/generate/image', {
                model: 'gemini-imagen-3',
                prompt: scene.prompt,
                width: 1280,
                height: 720,
            });

            const genData = genResponse.data;
            if (!genData.success) {
                throw new Error(genData.error || 'Không thể tạo ảnh');
            }

            const generationId = genData.generation?.id;
            if (!generationId) throw new Error('Invalid generation response');

            showToast('Đang tạo ảnh... Vui lòng đợi', 'info');

            // Poll for completion
            let attempts = 0;
            const maxAttempts = 60; // 3 minutes max
            const pollInterval = setInterval(async () => {
                attempts++;
                try {
                    const statusRes = await aiStudioApi.getGenerationStatus(generationId);
                    const statusData = statusRes.data;

                    if (statusData.status === 'completed' && statusData.output_url) {
                        clearInterval(pollInterval);
                        handleUpdateScene(index, {
                            source_image: statusData.output_url,
                            source_image_name: 'AI Generated',
                        });
                        setGeneratingImageIndex(null);
                        showToast('Đã tạo ảnh thành công!', 'success');
                    } else if (statusData.status === 'failed') {
                        clearInterval(pollInterval);
                        setGeneratingImageIndex(null);
                        showToast('Tạo ảnh thất bại: ' + (statusData.error || 'Unknown error'), 'error');
                    } else if (attempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        setGeneratingImageIndex(null);
                        showToast('Tạo ảnh quá lâu, vui lòng thử lại', 'error');
                    }
                } catch (e) {
                    console.error('Polling error:', e);
                }
            }, 3000); // Poll every 3 seconds

        } catch (error) {
            showToast('Lỗi: ' + error.message, 'error');
            setGeneratingImageIndex(null);
        }
    };

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
            const saveResponse = await aiStudioApi.saveScenario({
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
            });

            const saveData = saveResponse.data;
            if (!saveData.success) {
                throw new Error(saveData.error || 'Không thể lưu');
            }

            // Start generation
            const genResponse = await aiStudioApi.generateScenario(saveData.scenario.id);

            const genData = genResponse.data;
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

                                    {/* Reference Image Upload */}
                                    <div className="mb-6">
                                        <label className={`block text-sm font-bold mb-2 ${themeClasses.textMuted}`}>
                                            Ảnh tham chiếu (tùy chọn)
                                        </label>
                                        <div className="flex items-center justify-between mb-3">
                                            <p className={`text-xs ${themeClasses.textMuted}`}>
                                                Thêm ảnh để AI tạo video chính xác hơn
                                            </p>
                                            <button
                                                onClick={() => handleGenerateImage(activeSceneIndex)}
                                                disabled={generatingImageIndex !== null || !activeScene?.prompt}
                                                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                                                    ${generatingImageIndex === activeSceneIndex
                                                        ? 'bg-violet-600/30 text-violet-300 cursor-wait'
                                                        : activeScene?.prompt
                                                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-violet-500/30'
                                                            : 'bg-slate-600/30 text-slate-400 cursor-not-allowed'
                                                    }
                                                `}
                                            >
                                                {generatingImageIndex === activeSceneIndex ? (
                                                    <>
                                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Đang tạo...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                        </svg>
                                                        Tạo ảnh với AI
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {(activeScene.source_image || activeScene.source_image_path) ? (
                                            <div className="relative group">
                                                <img
                                                    src={activeScene.source_image || activeScene.source_image_path}
                                                    alt="Ảnh tham chiếu"
                                                    className="w-full h-48 object-cover rounded-xl border-2 border-violet-500/30"
                                                />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-xl transition-all flex items-center justify-center gap-3">
                                                    <label className="px-4 py-2 bg-white/20 rounded-lg text-white text-sm font-medium cursor-pointer hover:bg-white/30 transition-all">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => handleImageUpload(activeSceneIndex, e.target.files[0])}
                                                        />
                                                        Đổi ảnh
                                                    </label>
                                                    <button
                                                        onClick={() => handleRemoveImage(activeSceneIndex)}
                                                        className="px-4 py-2 bg-rose-500/80 rounded-lg text-white text-sm font-medium hover:bg-rose-500 transition-all"
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                                <p className={`text-xs mt-2 ${themeClasses.textMuted}`}>
                                                    {activeScene.source_image_name || 'Ảnh tham chiếu'}
                                                </p>
                                            </div>
                                        ) : (
                                            <label
                                                className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all
                                                    ${isDark ? 'border-white/20 hover:border-violet-500/50 bg-white/5' : 'border-slate-300 hover:border-violet-400 bg-slate-50'}
                                                `}
                                            >
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleImageUpload(activeSceneIndex, e.target.files[0])}
                                                />
                                                <svg className={`w-10 h-10 mb-2 ${isDark ? 'text-violet-400' : 'text-violet-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className={`text-sm ${themeClasses.textMuted}`}>Kéo thả hoặc click để tải ảnh</p>
                                                <p className={`text-xs mt-1 ${themeClasses.textMuted}`}>PNG, JPG tối đa 10MB</p>
                                            </label>
                                        )}
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
