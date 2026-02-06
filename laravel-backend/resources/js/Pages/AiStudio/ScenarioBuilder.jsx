import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { aiStudioApi, aiApi } from '@/services/api';
import AppLayout from '../../Layouts/AppLayout';
import { useToast } from '@/Components/Layout/ToastProvider';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * ScenarioBuilder - Professional Video/Image Scenario Builder
 * 
 * Features:
 * - Visual timeline editor
 * - Drag & drop scenes
 * - AI-powered script parsing
 * - Real-time preview
 * - Character consistency
 * - Template library
 */
export default function ScenarioBuilder({
    currentCredits = 0,
    videoModels = [],
    imageModels = [],
    templates = [],
    scenario: existingScenario = null,
}) {
    const { t } = useTranslation();
    const { auth } = usePage().props;
    const { addToast } = useToast();
    const { showConfirm } = useConfirm();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Core state
    const [step, setStep] = useState(existingScenario ? 'editor' : 'start'); // start, script, editor, preview, generating
    const [outputType, setOutputType] = useState('video');
    const [model, setModel] = useState('');
    const [title, setTitle] = useState(existingScenario?.title || '');
    const [script, setScript] = useState(existingScenario?.script || '');
    const [scenes, setScenes] = useState(existingScenario?.scenes || []);
    const [activeSceneIndex, setActiveSceneIndex] = useState(0);
    const [scenario, setScenario] = useState(existingScenario);

    // UI state
    const [parsing, setParsing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showCharacters, setShowCharacters] = useState(false);
    const [draggedScene, setDraggedScene] = useState(null);

    // Image upload state
    const [uploadedImages, setUploadedImages] = useState([]);
    const [dragOverUpload, setDragOverUpload] = useState(false);
    const imageInputRef = useRef(null);

    // Settings
    const [settings, setSettings] = useState({
        resolution: '1080p',
        aspect_ratio: '16:9',
        generate_audio: true,
        audio_style: 'natural',
        default_duration: 6,
    });

    // Characters for consistency
    const [characters, setCharacters] = useState([]);

    const models = outputType === 'video' ? videoModels : imageModels;
    const selectedModel = models.find(m => m.id === model);

    // Set default model
    useEffect(() => {
        if (models.length > 0 && !model) {
            const defaultModel = models.find(m => m.enabled && !m.coming_soon) || models[0];
            setModel(defaultModel?.id || '');
        }
    }, [models, outputType]);

    // Theme classes
    const themeClasses = {
        pageBg: isDark ? 'bg-[#0a0a0a]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100',
        cardBg: isDark ? 'bg-[#111]/80 backdrop-blur-xl border-white/[0.08]' : 'bg-white/80 backdrop-blur-xl border-slate-200/60',
        inputBg: isDark ? 'bg-black/40 border-white/10' : 'bg-white/70 border-slate-200',
        textPrimary: isDark ? 'text-white' : 'text-slate-900',
        textSecondary: isDark ? 'text-slate-300' : 'text-slate-600',
        textMuted: isDark ? 'text-slate-500' : 'text-slate-400',
    };

    // ============================================
    // HANDLERS
    // ============================================

    // Select template
    const handleSelectTemplate = (template) => {
        setScript(template.script);
        setTitle(template.name);
        setShowTemplates(false);
        addToast(`Đã chọn template "${template.name}"`, 'success');
    };

    // ============================================
    // IMAGE UPLOAD HANDLERS
    // ============================================

    // Handle image file selection
    const handleImageSelect = (files) => {
        const validFiles = Array.from(files).filter(file => {
            if (!file.type.startsWith('image/')) {
                addToast(`${file.name} không phải là ảnh`, 'warning');
                return false;
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                addToast(`${file.name} quá lớn (tối đa 10MB)`, 'warning');
                return false;
            }
            return true;
        });

        if (uploadedImages.length + validFiles.length > 10) {
            addToast('Tối đa 10 ảnh', 'warning');
            return;
        }

        // Create previews
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setUploadedImages(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    file,
                    preview: e.target.result,
                    data: e.target.result,
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    // Handle drag and drop for images
    const handleImageDrop = (e) => {
        e.preventDefault();
        setDragOverUpload(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageSelect(files);
        }
    };

    // Remove uploaded image
    const handleRemoveImage = (imageId) => {
        setUploadedImages(prev => prev.filter(img => img.id !== imageId));
    };

    // Reorder uploaded images
    const handleReorderImages = (fromIndex, toIndex) => {
        setUploadedImages(prev => {
            const newImages = [...prev];
            const [movedImage] = newImages.splice(fromIndex, 1);
            newImages.splice(toIndex, 0, movedImage);
            return newImages;
        });
    };

    // Parse images with AI
    const handleParseImages = async () => {
        if (uploadedImages.length === 0) {
            addToast('Vui lòng upload ít nhất 1 ảnh', 'warning');
            return;
        }

        setParsing(true);
        try {
            const imagesData = uploadedImages.map(img => ({
                data: img.data,
            }));

            const response = await aiStudioApi.parseScenario({
                input_mode: 'images',
                images: imagesData,
                output_type: outputType,
            });

            if (response.success && response.data) {
                const parsedScenes = response.data.scenes.map((scene, index) => ({
                    ...scene,
                    order: index + 1,
                    duration: settings.default_duration,
                    status: 'pending',
                    source_image_url: uploadedImages[index]?.preview || null,
                    source_image_preview: uploadedImages[index]?.preview || null,
                }));
                setScenes(parsedScenes);
                setTitle(response.data.title || 'Video từ ảnh');
                setScript(`Video được tạo từ ${uploadedImages.length} ảnh`);
                setStep('editor');
                addToast(`Đã phân tích ${parsedScenes.length} ảnh thành cảnh`, 'success');
            } else {
                throw new Error(response.error || 'Không thể phân tích ảnh');
            }
        } catch (error) {
            addToast(error.message || 'Không thể phân tích ảnh', 'error');
        } finally {
            setParsing(false);
        }
    };

    // ============================================
    // SCRIPT HANDLERS
    // ============================================

    // Parse script with AI
    const handleParseScript = async () => {
        if (!script.trim() || script.length < 20) {
            addToast('Vui lòng nhập kịch bản chi tiết hơn (ít nhất 20 ký tự)', 'warning');
            return;
        }

        setParsing(true);
        try {
            const response = await aiStudioApi.parseScenario({
                script,
                output_type: outputType,
            });

            // Handle nested response structure
            const responseData = response.data || response;
            const scenesData = responseData.data?.scenes || responseData.scenes;

            if (response.success && scenesData) {
                const parsedScenes = scenesData.map((scene, index) => ({
                    ...scene,
                    order: index + 1,
                    duration: settings.default_duration,
                    status: 'pending',
                }));
                setScenes(parsedScenes);
                setTitle(responseData.data?.title || responseData.title || title || 'Kịch bản mới');
                setStep('editor');
                addToast(`Đã phân tích thành ${parsedScenes.length} cảnh`, 'success');
            } else {
                throw new Error(responseData.error || 'Không thể phân tích kịch bản');
            }
        } catch (error) {
            addToast(error.response?.data?.error || 'Không thể phân tích kịch bản', 'error');
        } finally {
            setParsing(false);
        }
    };

    // Add new scene
    const handleAddScene = () => {
        const newScene = {
            order: scenes.length + 1,
            description: '',
            prompt: '',
            duration: settings.default_duration,
            status: 'pending',
        };
        setScenes([...scenes, newScene]);
        setActiveSceneIndex(scenes.length);
    };

    // Update scene
    const handleUpdateScene = (index, updates) => {
        setScenes(prev => prev.map((scene, i) =>
            i === index ? { ...scene, ...updates } : scene
        ));
    };

    // Delete scene
    const handleDeleteScene = async (index) => {
        if (scenes.length <= 1) {
            addToast('Phải có ít nhất 1 cảnh', 'warning');
            return;
        }

        const confirmed = await showConfirm({
            title: 'Xóa cảnh',
            message: `Xóa cảnh ${index + 1}?`,
            confirmText: 'Xóa',
            type: 'danger',
        });

        if (confirmed) {
            setScenes(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
            if (activeSceneIndex >= scenes.length - 1) {
                setActiveSceneIndex(Math.max(0, scenes.length - 2));
            }
        }
    };

    // Duplicate scene
    const handleDuplicateScene = (index) => {
        const newScene = {
            ...scenes[index],
            order: scenes.length + 1,
            status: 'pending',
            ai_generation_id: null,
        };
        setScenes([...scenes.slice(0, index + 1), newScene, ...scenes.slice(index + 1)]);
        setActiveSceneIndex(index + 1);
    };

    // Drag & drop reorder
    const handleDragStart = (e, index) => {
        setDraggedScene(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedScene === null || draggedScene === index) return;
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        if (draggedScene === null || draggedScene === dropIndex) return;

        const newScenes = [...scenes];
        const [draggedItem] = newScenes.splice(draggedScene, 1);
        newScenes.splice(dropIndex, 0, draggedItem);

        // Recalculate order
        setScenes(newScenes.map((s, i) => ({ ...s, order: i + 1 })));
        setActiveSceneIndex(dropIndex);
        setDraggedScene(null);
    };

    // Generate AI prompt for scene
    const handleGeneratePrompt = async (index) => {
        const scene = scenes[index];
        if (!scene.description) {
            addToast('Vui lòng nhập mô tả cảnh trước', 'warning');
            return;
        }

        try {
            const response = await aiStudioApi.generateScenePrompt({
                description: scene.description,
                output_type: outputType,
                characters: characters,
            });

            if (response.success) {
                handleUpdateScene(index, { prompt: response.prompt });
                addToast('Đã tạo prompt!', 'success');
            }
        } catch (error) {
            addToast('Không thể tạo prompt', 'error');
        }
    };

    // Upload reference image for scene
    const handleUploadImage = (index, e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const preview = URL.createObjectURL(file);
        handleUpdateScene(index, {
            source_image: file,
            source_image_preview: preview,
        });
    };

    // Calculate totals
    const totalDuration = scenes.reduce((acc, s) => acc + (s.duration || settings.default_duration), 0);
    const estimatedCredits = scenes.reduce((acc, s) => {
        const duration = s.duration || settings.default_duration;
        const creditRate = selectedModel?.credits_cost || 25;
        return acc + (outputType === 'video' ? duration * creditRate : creditRate);
    }, 0);

    // Save scenario
    const handleSave = async (asDraft = true) => {
        if (!title.trim()) {
            addToast('Vui lòng nhập tiêu đề', 'warning');
            return;
        }

        if (scenes.length === 0) {
            addToast('Chưa có cảnh nào', 'warning');
            return;
        }

        setSaving(true);
        try {
            // Convert images to base64
            const scenesWithImages = await Promise.all(scenes.map(async (scene) => {
                const sceneData = {
                    order: scene.order,
                    description: scene.description,
                    prompt: scene.prompt,
                    duration: scene.duration,
                };

                if (scene.source_image instanceof File) {
                    const reader = new FileReader();
                    sceneData.source_image = await new Promise((resolve) => {
                        reader.onload = (e) => resolve(e.target.result);
                        reader.readAsDataURL(scene.source_image);
                    });
                }

                return sceneData;
            }));

            const response = await aiStudioApi.saveScenario({
                id: scenario?.id,
                title,
                script,
                output_type: outputType,
                model,
                scenes: scenesWithImages,
                settings,
                characters,
                is_draft: asDraft,
            });

            // Handle nested response structure from API wrapper
            const responseData = response.data || response;
            if (responseData.success && responseData.scenario) {
                setScenario(responseData.scenario);
                addToast(asDraft ? 'Đã lưu bản nháp' : 'Đã lưu kịch bản', 'success');
            } else {
                throw new Error(responseData.error || 'Không thể lưu');
            }
        } catch (error) {
            addToast('Không thể lưu', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Start generation
    const handleGenerate = async () => {
        if (currentCredits < estimatedCredits) {
            addToast(`Không đủ credits. Cần ${estimatedCredits}, hiện có ${currentCredits}`, 'warning');
            return;
        }

        setGenerating(true);
        setStep('generating');

        try {
            let scenarioId = scenario?.id;

            // Save first if not saved - and get the new scenario ID
            if (!scenarioId) {
                const saveResult = await handleSaveAndGetId();
                if (!saveResult) {
                    throw new Error('Không thể lưu kịch bản');
                }
                scenarioId = saveResult;
            }

            const response = await aiStudioApi.generateScenario(scenarioId);
            const responseData = response.data || response;

            if (responseData.success && responseData.scenario) {
                setScenario(responseData.scenario);
                addToast('Đang tạo video...', 'success');
                startPolling(responseData.scenario.id);
            } else {
                throw new Error(responseData.error || 'Không thể bắt đầu tạo');
            }
        } catch (error) {
            addToast(error.message || 'Không thể bắt đầu tạo', 'error');
            setGenerating(false);
            setStep('editor');
        }
    };

    // Save and return the scenario ID (for handleGenerate)
    const handleSaveAndGetId = async () => {
        if (!title.trim()) {
            addToast('Vui lòng nhập tiêu đề', 'warning');
            return null;
        }

        if (scenes.length === 0) {
            addToast('Chưa có cảnh nào', 'warning');
            return null;
        }

        try {
            // Convert images to base64
            const scenesWithImages = await Promise.all(scenes.map(async (scene) => {
                const sceneData = {
                    order: scene.order,
                    description: scene.description,
                    prompt: scene.prompt,
                    duration: scene.duration,
                };

                if (scene.source_image instanceof File) {
                    const reader = new FileReader();
                    sceneData.source_image = await new Promise((resolve) => {
                        reader.onload = (e) => resolve(e.target.result);
                        reader.readAsDataURL(scene.source_image);
                    });
                } else if (scene.source_image_url) {
                    sceneData.source_image = scene.source_image_url;
                }

                return sceneData;
            }));

            const response = await aiStudioApi.saveScenario({
                id: scenario?.id,
                title,
                script,
                output_type: outputType,
                model,
                scenes: scenesWithImages,
                settings,
                characters,
                is_draft: false,
            });

            if (response.success && response.data?.scenario) {
                setScenario(response.data.scenario);
                return response.data.scenario.id;
            } else if (response.success && response.scenario) {
                setScenario(response.scenario);
                return response.scenario.id;
            }

            return null;
        } catch (error) {
            console.error('Save error:', error);
            return null;
        }
    };

    // Poll for status
    const startPolling = (scenarioId) => {
        const interval = setInterval(async () => {
            try {
                const response = await aiStudioApi.getScenarioStatus(scenarioId);
                const responseData = response.data || response;

                if (responseData.success && responseData.scenario) {
                    setScenario(responseData.scenario);
                    setScenes(responseData.scenario.scenes);

                    if (['completed', 'failed', 'partial'].includes(responseData.scenario.status)) {
                        clearInterval(interval);
                        setGenerating(false);

                        if (responseData.scenario.status === 'completed') {
                            addToast('🎉 Tất cả cảnh đã hoàn thành!', 'success');
                            setStep('preview');
                        } else if (responseData.scenario.status === 'partial') {
                            addToast('⚠️ Một số cảnh thất bại', 'warning');
                        } else {
                            addToast('❌ Tạo thất bại', 'error');
                            setStep('editor');
                        }
                    }
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 3000);
    };

    // Format duration
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
    };

    // ============================================
    // RENDER
    // ============================================

    return (
        <AppLayout title="Scenario Builder">
            <div className={`min-h-screen ${themeClasses.pageBg}`}>
                {/* Background decorations */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-[120px] ${isDark ? 'bg-violet-600/20' : 'bg-violet-200/50'}`} />
                    <div className={`absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full blur-[100px] ${isDark ? 'bg-indigo-600/15' : 'bg-indigo-200/40'}`} />
                    <div className={`absolute bottom-0 right-1/3 w-[400px] h-[400px] rounded-full blur-[80px] ${isDark ? 'bg-cyan-600/10' : 'bg-cyan-200/30'}`} />
                </div>

                <div className="relative max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/ai-studio"
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                            >
                                ←
                            </Link>
                            <div>
                                <h1 className={`text-xl sm:text-2xl font-bold ${themeClasses.textPrimary}`}>
                                    {step === 'start' ? 'Tạo Kịch Bản Mới' : title || 'Scenario Builder'}
                                </h1>
                                <p className={`text-sm ${themeClasses.textMuted}`}>
                                    Tạo video/ảnh chuyên nghiệp theo kịch bản
                                </p>
                            </div>
                        </div>

                        {/* Credits & Actions */}
                        <div className="flex items-center gap-3">
                            <div className={`px-4 py-2 rounded-xl ${isDark ? 'bg-violet-600/20 border border-violet-500/30' : 'bg-violet-100 border border-violet-200'}`}>
                                <span className={`text-sm font-bold ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
                                    {currentCredits.toLocaleString()} credits
                                </span>
                            </div>

                            {step !== 'start' && (
                                <>
                                    <button
                                        onClick={() => handleSave(true)}
                                        disabled={saving}
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'}`}
                                    >
                                        {saving ? '...' : 'Lưu nháp'}
                                    </button>
                                    {step === 'editor' && (
                                        <button
                                            onClick={handleGenerate}
                                            disabled={generating || scenes.length === 0}
                                            className="px-6 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all disabled:opacity-50"
                                        >
                                            Tạo ({estimatedCredits} credits)
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Step Progress */}
                    <div className={`flex items-center justify-center gap-2 p-3 mb-6 rounded-2xl ${themeClasses.cardBg} border`}>
                        {[
                            { key: 'start', label: 'Bắt đầu', num: '1' },
                            { key: 'script', label: 'Kịch bản', num: '2', alt: 'images' },
                            { key: 'editor', label: 'Chỉnh sửa', num: '3' },
                            { key: 'generating', label: 'Đang tạo', num: '4' },
                            { key: 'preview', label: 'Xem kết quả', num: '5' },
                        ].map((s, i, arr) => {
                            const currentStep = step === 'images' ? 'script' : step; // Treat 'images' as same level as 'script'
                            const currentIndex = arr.findIndex(x => x.key === currentStep);
                            const isActive = s.key === step || (s.alt === step);
                            const isCompleted = i < currentIndex;

                            return (
                                <div key={s.key} className="flex items-center">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${isActive
                                        ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg scale-110'
                                        : isCompleted
                                            ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                                            : isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                        {isCompleted ? (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : s.num}
                                    </div>
                                    <span className={`ml-2 text-xs font-medium hidden sm:inline ${isActive ? themeClasses.textPrimary : themeClasses.textMuted}`}>
                                        {s.label}
                                    </span>
                                    {i < arr.length - 1 && (
                                        <div className={`w-8 sm:w-12 h-0.5 mx-2 rounded-full ${isCompleted
                                            ? 'bg-gradient-to-r from-emerald-500 to-violet-500'
                                            : isDark ? 'bg-white/10' : 'bg-slate-200'
                                            }`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* ========================================
                        STEP: START
                    ======================================== */}
                    {step === 'start' && (
                        <div className="max-w-4xl mx-auto">
                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Option 1: New from scratch */}
                                <button
                                    onClick={() => setStep('script')}
                                    className={`group p-8 rounded-3xl border-2 transition-all text-left hover:scale-[1.02] ${isDark
                                        ? 'bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border-violet-500/30 hover:border-violet-500/60'
                                        : 'bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200 hover:border-violet-400'
                                        }`}
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                    <h3 className={`text-xl font-bold mb-2 ${themeClasses.textPrimary}`}>
                                        Viết Kịch Bản
                                    </h3>
                                    <p className={themeClasses.textSecondary}>
                                        Nhập ý tưởng, AI tự chia thành các cảnh và tạo prompt chuyên nghiệp.
                                    </p>
                                </button>

                                {/* Option 2: From images */}
                                <button
                                    onClick={() => setStep('images')}
                                    className={`group p-8 rounded-3xl border-2 transition-all text-left hover:scale-[1.02] ${isDark
                                        ? 'bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border-emerald-500/30 hover:border-emerald-500/60'
                                        : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-400'
                                        }`}
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className={`text-xl font-bold mb-2 ${themeClasses.textPrimary}`}>
                                        Từ Ảnh Có Sẵn
                                    </h3>
                                    <p className={themeClasses.textSecondary}>
                                        Upload ảnh, AI phân tích và tạo video/slideshow chuyên nghiệp.
                                    </p>
                                </button>

                                {/* Option 3: Use template */}
                                <button
                                    onClick={() => setShowTemplates(true)}
                                    className={`group p-8 rounded-3xl border-2 transition-all text-left hover:scale-[1.02] ${isDark
                                        ? 'bg-gradient-to-br from-cyan-600/10 to-blue-600/10 border-cyan-500/30 hover:border-cyan-500/60'
                                        : 'bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200 hover:border-cyan-400'
                                        }`}
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                        </svg>
                                    </div>
                                    <h3 className={`text-xl font-bold mb-2 ${themeClasses.textPrimary}`}>
                                        Chọn Template
                                    </h3>
                                    <p className={themeClasses.textSecondary}>
                                        Mẫu có sẵn cho quảng cáo, giới thiệu sản phẩm, v.v.
                                    </p>
                                </button>

                                {/* Output Type Selection */}
                                <div className={`md:col-span-3 p-6 rounded-2xl ${themeClasses.cardBg} border`}>
                                    <label className={`block text-sm font-bold mb-4 ${themeClasses.textMuted} uppercase tracking-wide`}>
                                        Loại Output
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { type: 'video', label: 'Video', desc: 'Tạo video từ kịch bản', iconPath: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
                                            { type: 'image', label: 'Hình ảnh', desc: 'Tạo series ảnh', iconPath: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
                                        ].map((opt) => (
                                            <button
                                                key={opt.type}
                                                onClick={() => setOutputType(opt.type)}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${outputType === opt.type
                                                    ? isDark
                                                        ? 'bg-violet-600/20 border-violet-500/60'
                                                        : 'bg-violet-50 border-violet-400'
                                                    : isDark
                                                        ? 'bg-white/5 border-white/10 hover:border-white/20'
                                                        : 'bg-white border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                <svg className={`w-6 h-6 ${outputType === opt.type ? (isDark ? 'text-violet-400' : 'text-violet-600') : (isDark ? 'text-slate-400' : 'text-slate-500')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={opt.iconPath} />
                                                </svg>
                                                <div className={`mt-2 font-semibold ${themeClasses.textPrimary}`}>{opt.label}</div>
                                                <div className={`text-xs ${themeClasses.textMuted}`}>{opt.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================
                        STEP: IMAGES UPLOAD
                    ======================================== */}
                    {step === 'images' && (
                        <div className="max-w-4xl mx-auto">
                            <div className={`p-6 sm:p-8 rounded-3xl ${themeClasses.cardBg} border`}>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className={`text-xl font-bold ${themeClasses.textPrimary}`}>
                                            Upload Ảnh
                                        </h2>
                                        <p className={`text-sm ${themeClasses.textMuted}`}>
                                            Upload tối đa 10 ảnh, AI sẽ phân tích và tạo kịch bản video
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {uploadedImages.length}/10 ảnh
                                    </span>
                                </div>

                                {/* Drop Zone */}
                                <div
                                    onDrop={handleImageDrop}
                                    onDragOver={(e) => { e.preventDefault(); setDragOverUpload(true); }}
                                    onDragLeave={() => setDragOverUpload(false)}
                                    onClick={() => imageInputRef.current?.click()}
                                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragOverUpload
                                        ? isDark
                                            ? 'border-emerald-500 bg-emerald-500/10'
                                            : 'border-emerald-400 bg-emerald-50'
                                        : isDark
                                            ? 'border-white/20 hover:border-white/40 bg-white/5'
                                            : 'border-slate-200 hover:border-slate-400 bg-slate-50'
                                        }`}
                                >
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => handleImageSelect(e.target.files)}
                                        className="hidden"
                                    />
                                    <div className={`w-16 h-16 mx-auto rounded-2xl mb-4 flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                                        <svg className={`w-8 h-8 ${isDark ? 'text-white' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={dragOverUpload ? 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' : 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z'} />
                                            {!dragOverUpload && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />}
                                        </svg>
                                    </div>
                                    <p className={`text-lg font-semibold mb-2 ${themeClasses.textPrimary}`}>
                                        {dragOverUpload ? 'Thả ảnh vào đây!' : 'Kéo thả ảnh hoặc click để chọn'}
                                    </p>
                                    <p className={`text-sm ${themeClasses.textMuted}`}>
                                        JPG, PNG, WEBP - Tối đa 10MB mỗi ảnh
                                    </p>
                                </div>

                                {/* Image Preview Grid */}
                                {uploadedImages.length > 0 && (
                                    <div className="mt-6">
                                        <h3 className={`text-sm font-bold mb-3 ${themeClasses.textMuted} uppercase tracking-wide`}>
                                            Ảnh đã upload (kéo để sắp xếp)
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                            {uploadedImages.map((img, index) => (
                                                <div
                                                    key={img.id}
                                                    draggable
                                                    onDragStart={(e) => e.dataTransfer.setData('text/plain', index)}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                                        handleReorderImages(fromIndex, index);
                                                    }}
                                                    className={`relative group aspect-square rounded-xl overflow-hidden cursor-move border-2 ${isDark ? 'border-white/10' : 'border-slate-200'}`}
                                                >
                                                    <img
                                                        src={img.preview}
                                                        alt={`Upload ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {/* Order badge */}
                                                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs font-bold flex items-center justify-center">
                                                        {index + 1}
                                                    </div>
                                                    {/* Remove button */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(img.id); }}
                                                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        ×
                                                    </button>
                                                    {/* Drag handle overlay */}
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                        <span className="text-white text-xs opacity-0 group-hover:opacity-70 transition-opacity font-bold">DRAG</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center justify-between mt-8">
                                    <button
                                        onClick={() => { setStep('start'); setUploadedImages([]); }}
                                        className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                                    >
                                        ← Quay lại
                                    </button>

                                    <button
                                        onClick={handleParseImages}
                                        disabled={parsing || uploadedImages.length === 0}
                                        className="px-8 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {parsing ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Đang phân tích...
                                            </span>
                                        ) : (
                                            `Phân tích ${uploadedImages.length} ảnh`
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================
                        STEP: SCRIPT INPUT
                    ======================================== */}
                    {step === 'script' && (
                        <div className="max-w-4xl mx-auto">
                            <div className={`p-6 sm:p-8 rounded-3xl ${themeClasses.cardBg} border`}>
                                {/* Title Input */}
                                <div className="mb-6">
                                    <label className={`block text-sm font-bold mb-2 ${themeClasses.textMuted} uppercase tracking-wide`}>
                                        Tiêu đề kịch bản
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="VD: Quảng cáo sản phẩm mới..."
                                        className={`w-full px-4 py-3 rounded-xl border-2 text-lg font-medium transition-all focus:outline-none focus:ring-4 ${isDark
                                            ? 'bg-black/30 border-white/10 text-white placeholder-slate-500 focus:border-violet-500/50 focus:ring-violet-500/10'
                                            : 'bg-white/70 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-400 focus:ring-violet-400/10'
                                            }`}
                                    />
                                </div>

                                {/* Script Textarea */}
                                <div className="mb-6">
                                    <label className={`block text-sm font-bold mb-2 ${themeClasses.textMuted} uppercase tracking-wide`}>
                                        Nội dung kịch bản
                                    </label>
                                    <textarea
                                        value={script}
                                        onChange={(e) => setScript(e.target.value)}
                                        placeholder={`Mô tả chi tiết kịch bản của bạn...

VD: 
Cảnh 1: Một buổi sáng đẹp trời, ánh nắng vàng chiếu qua cửa sổ phòng ngủ hiện đại.
Cảnh 2: Một cô gái trẻ tỉnh dậy, vươn vai và mỉm cười rạng rỡ.
Cảnh 3: Cô ấy cầm ly cà phê, đi ra ban công ngắm nhìn thành phố.
Cảnh 4: Close-up sản phẩm với logo thương hiệu.

Mẹo: Mô tả càng chi tiết, kết quả càng chính xác!`}
                                        rows={12}
                                        className={`w-full px-4 py-4 rounded-xl border-2 text-sm resize-none transition-all focus:outline-none focus:ring-4 ${isDark
                                            ? 'bg-black/30 border-white/10 text-white placeholder-slate-500 focus:border-violet-500/50 focus:ring-violet-500/10'
                                            : 'bg-white/70 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-400 focus:ring-violet-400/10'
                                            }`}
                                    />
                                    <div className="flex justify-between mt-2">
                                        <span className={`text-xs ${themeClasses.textMuted}`}>
                                            {script.length.toLocaleString()} ký tự
                                        </span>
                                        <span className={`text-xs font-medium ${script.length >= 20 ? 'text-emerald-500' : themeClasses.textMuted}`}>
                                            {script.length >= 20 ? 'Đủ độ dài' : 'Tối thiểu 20 ký tự'}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => setStep('start')}
                                        className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                                    >
                                        ← Quay lại
                                    </button>

                                    <button
                                        onClick={handleParseScript}
                                        disabled={parsing || script.length < 20}
                                        className="px-8 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {parsing ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Đang phân tích...
                                            </span>
                                        ) : (
                                            'Phân tích với AI'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================
                        STEP: EDITOR
                    ======================================== */}
                    {step === 'editor' && (
                        <div className="grid lg:grid-cols-12 gap-6">
                            {/* Timeline - Left Panel */}
                            <div className="lg:col-span-4 xl:col-span-3">
                                <div className={`sticky top-24 p-4 rounded-2xl ${themeClasses.cardBg} border`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className={`font-bold ${themeClasses.textPrimary}`}>
                                            Timeline ({scenes.length} cảnh)
                                        </h3>
                                        <button
                                            onClick={handleAddScene}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                                        >
                                            +
                                        </button>
                                    </div>

                                    {/* Total Duration */}
                                    <div className={`mb-4 p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                                        <div className="flex justify-between text-xs">
                                            <span className={themeClasses.textMuted}>Tổng thời lượng</span>
                                            <span className={`font-bold ${themeClasses.textPrimary}`}>{formatDuration(totalDuration)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs mt-1">
                                            <span className={themeClasses.textMuted}>Ước tính credits</span>
                                            <span className="font-bold text-violet-500">{estimatedCredits.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Scene List */}
                                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                                        {scenes.map((scene, index) => (
                                            <div
                                                key={index}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, index)}
                                                onDragOver={(e) => handleDragOver(e, index)}
                                                onDrop={(e) => handleDrop(e, index)}
                                                onClick={() => setActiveSceneIndex(index)}
                                                className={`group p-3 rounded-xl cursor-pointer transition-all ${activeSceneIndex === index
                                                    ? isDark
                                                        ? 'bg-violet-600/20 border border-violet-500/50'
                                                        : 'bg-violet-50 border border-violet-300'
                                                    : isDark
                                                        ? 'bg-white/5 hover:bg-white/10 border border-transparent'
                                                        : 'bg-white hover:bg-slate-50 border border-slate-200'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* Thumbnail or placeholder */}
                                                    <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center text-lg ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                                                        {scene.source_image_preview ? (
                                                            <img src={scene.source_image_preview} className="w-full h-full object-cover rounded-lg" />
                                                        ) : (
                                                            <span>{scene.status === 'completed' ? '✅' : scene.status === 'generating' ? '⏳' : `${index + 1}`}</span>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className={`text-sm font-semibold truncate ${themeClasses.textPrimary}`}>
                                                            Cảnh {index + 1}
                                                        </div>
                                                        <div className={`text-xs truncate ${themeClasses.textMuted}`}>
                                                            {scene.description || 'Chưa có mô tả'}
                                                        </div>
                                                        <div className={`text-xs font-medium mt-1 ${themeClasses.textMuted}`}>
                                                            {formatDuration(scene.duration || settings.default_duration)}
                                                        </div>
                                                    </div>

                                                    {/* Drag handle */}
                                                    <div className={`opacity-0 group-hover:opacity-50 ${themeClasses.textMuted}`}>
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Scene Editor - Main Panel */}
                            <div className="lg:col-span-8 xl:col-span-9">
                                {scenes[activeSceneIndex] && (
                                    <div className={`p-6 rounded-2xl ${themeClasses.cardBg} border`}>
                                        {/* Scene Header */}
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className={`text-xl font-bold ${themeClasses.textPrimary}`}>
                                                Cảnh {activeSceneIndex + 1}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleDuplicateScene(activeSceneIndex)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                                                >
                                                    📋 Nhân bản
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteScene(activeSceneIndex)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isDark ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400' : 'bg-rose-50 hover:bg-rose-100 text-rose-600'}`}
                                                >
                                                    🗑️ Xóa
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid lg:grid-cols-2 gap-6">
                                            {/* Left: Description & Prompt */}
                                            <div className="space-y-6">
                                                {/* Description */}
                                                <div>
                                                    <label className={`block text-sm font-bold mb-2 ${themeClasses.textMuted}`}>
                                                        Mô tả cảnh
                                                    </label>
                                                    <textarea
                                                        value={scenes[activeSceneIndex]?.description || ''}
                                                        onChange={(e) => handleUpdateScene(activeSceneIndex, { description: e.target.value })}
                                                        placeholder="Mô tả nội dung cảnh..."
                                                        rows={3}
                                                        className={`w-full px-4 py-3 rounded-xl border-2 text-sm resize-none transition-all focus:outline-none focus:ring-4 ${isDark
                                                            ? 'bg-black/30 border-white/10 text-white placeholder-slate-500 focus:border-violet-500/50 focus:ring-violet-500/10'
                                                            : 'bg-white/70 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-400 focus:ring-violet-400/10'
                                                            }`}
                                                    />
                                                </div>

                                                {/* AI Prompt */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className={`text-sm font-bold ${themeClasses.textMuted}`}>
                                                            Prompt cho AI
                                                        </label>
                                                        <button
                                                            onClick={() => handleGeneratePrompt(activeSceneIndex)}
                                                            className={`text-xs font-medium ${isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'}`}
                                                        >
                                                            🪄 Tự động tạo
                                                        </button>
                                                    </div>
                                                    <textarea
                                                        value={scenes[activeSceneIndex]?.prompt || ''}
                                                        onChange={(e) => handleUpdateScene(activeSceneIndex, { prompt: e.target.value })}
                                                        placeholder="Prompt chi tiết để AI tạo video/ảnh..."
                                                        rows={5}
                                                        className={`w-full px-4 py-3 rounded-xl border-2 text-sm resize-none transition-all focus:outline-none focus:ring-4 ${isDark
                                                            ? 'bg-black/30 border-white/10 text-white placeholder-slate-500 focus:border-violet-500/50 focus:ring-violet-500/10'
                                                            : 'bg-white/70 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-400 focus:ring-violet-400/10'
                                                            }`}
                                                    />
                                                </div>

                                                {/* Duration (Video only) */}
                                                {outputType === 'video' && (
                                                    <div>
                                                        <label className={`block text-sm font-bold mb-3 ${themeClasses.textMuted}`}>
                                                            ⏱️ Thời lượng: {scenes[activeSceneIndex]?.duration || settings.default_duration}s
                                                        </label>
                                                        <input
                                                            type="range"
                                                            min="4"
                                                            max="15"
                                                            value={scenes[activeSceneIndex]?.duration || settings.default_duration}
                                                            onChange={(e) => handleUpdateScene(activeSceneIndex, { duration: parseInt(e.target.value) })}
                                                            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-violet-600 to-indigo-600"
                                                        />
                                                        <div className="flex justify-between text-xs mt-1">
                                                            <span className={themeClasses.textMuted}>4s</span>
                                                            <span className={themeClasses.textMuted}>15s</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Image Upload & Preview */}
                                            <div className="space-y-6">
                                                {/* Reference Image Upload */}
                                                <div>
                                                    <label className={`block text-sm font-bold mb-2 ${themeClasses.textMuted}`}>
                                                        🖼️ Ảnh tham chiếu (tùy chọn)
                                                    </label>

                                                    {scenes[activeSceneIndex]?.source_image_preview ? (
                                                        <div className="relative group">
                                                            <img
                                                                src={scenes[activeSceneIndex].source_image_preview}
                                                                alt="Reference"
                                                                className="w-full aspect-video object-cover rounded-xl"
                                                            />
                                                            <button
                                                                onClick={() => handleUpdateScene(activeSceneIndex, { source_image: null, source_image_preview: null })}
                                                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className={`block aspect-video rounded-xl border-2 border-dashed cursor-pointer transition-all flex items-center justify-center ${isDark
                                                            ? 'border-white/20 hover:border-violet-500/50 bg-white/5'
                                                            : 'border-slate-200 hover:border-violet-400 bg-slate-50'
                                                            }`}>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => handleUploadImage(activeSceneIndex, e)}
                                                                className="hidden"
                                                            />
                                                            <div className="text-center p-6">
                                                                <div className={`w-12 h-12 mx-auto rounded-xl mb-3 flex items-center justify-center text-2xl ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    </svg>
                                                                </div>
                                                                <p className={`text-sm font-medium ${themeClasses.textPrimary}`}>
                                                                    Click để upload ảnh
                                                                </p>
                                                                <p className={`text-xs ${themeClasses.textMuted}`}>
                                                                    JPG, PNG, WEBP
                                                                </p>
                                                            </div>
                                                        </label>
                                                    )}
                                                </div>

                                                {/* Scene Preview */}
                                                {scenes[activeSceneIndex]?.generation?.output_url && (
                                                    <div>
                                                        <label className={`block text-sm font-bold mb-2 ${themeClasses.textMuted}`}>
                                                            🎥 Kết quả
                                                        </label>
                                                        {outputType === 'video' ? (
                                                            <video
                                                                src={scenes[activeSceneIndex].generation.output_url}
                                                                controls
                                                                className="w-full rounded-xl"
                                                            />
                                                        ) : (
                                                            <img
                                                                src={scenes[activeSceneIndex].generation.output_url}
                                                                alt="Generated"
                                                                className="w-full rounded-xl"
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ========================================
                        STEP: GENERATING
                    ======================================== */}
                    {step === 'generating' && (
                        <div className="max-w-3xl mx-auto text-center">
                            <div className={`p-8 rounded-3xl ${themeClasses.cardBg} border`}>
                                {/* Animated Icon */}
                                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/40 animate-pulse">
                                    <svg className="w-12 h-12 text-violet-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>

                                <h2 className={`text-2xl font-bold mb-2 ${themeClasses.textPrimary}`}>
                                    Đang tạo kịch bản...
                                </h2>
                                <p className={`mb-8 ${themeClasses.textMuted}`}>
                                    AI đang xử lý {scenes.length} cảnh. Vui lòng đợi trong giây lát.
                                </p>

                                {/* Progress */}
                                <div className="space-y-3">
                                    {scenes.map((scene, index) => {
                                        const status = scene.status || 'pending';
                                        const statusConfig = {
                                            pending: { icon: '○', color: themeClasses.textMuted, bg: isDark ? 'bg-white/5' : 'bg-slate-100' },
                                            generating: { icon: '⏳', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                                            completed: { icon: '✅', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                            failed: { icon: '❌', color: 'text-rose-500', bg: 'bg-rose-500/10' },
                                        }[status];

                                        return (
                                            <div
                                                key={index}
                                                className={`flex items-center gap-3 p-3 rounded-xl ${statusConfig.bg}`}
                                            >
                                                <span className={`text-lg ${statusConfig.color}`}>{statusConfig.icon}</span>
                                                <span className={`flex-1 text-left text-sm font-medium ${themeClasses.textPrimary}`}>
                                                    Cảnh {index + 1}
                                                </span>
                                                <span className={`text-xs ${statusConfig.color}`}>
                                                    {status === 'generating' ? 'Đang tạo...' : status === 'completed' ? 'Hoàn thành' : status === 'failed' ? 'Thất bại' : 'Đang chờ'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================
                        STEP: PREVIEW
                    ======================================== */}
                    {step === 'preview' && (
                        <div className="max-w-5xl mx-auto">
                            <div className={`p-6 rounded-3xl ${themeClasses.cardBg} border mb-6`}>
                                <h2 className={`text-2xl font-bold mb-4 ${themeClasses.textPrimary}`}>
                                    🎉 Kịch bản hoàn thành!
                                </h2>
                                <p className={themeClasses.textSecondary}>
                                    Đã tạo thành công {scenes.filter(s => s.status === 'completed').length}/{scenes.length} cảnh.
                                </p>
                            </div>

                            {/* Results Grid */}
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {scenes.map((scene, index) => (
                                    <div key={index} className={`rounded-2xl overflow-hidden ${themeClasses.cardBg} border`}>
                                        {scene.generation?.output_url ? (
                                            outputType === 'video' ? (
                                                <video
                                                    src={scene.generation.output_url}
                                                    controls
                                                    className="w-full aspect-video object-cover"
                                                />
                                            ) : (
                                                <img
                                                    src={scene.generation.output_url}
                                                    alt={`Scene ${index + 1}`}
                                                    className="w-full aspect-video object-cover"
                                                />
                                            )
                                        ) : (
                                            <div className={`w-full aspect-video flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                                <span className="text-2xl">❌</span>
                                            </div>
                                        )}
                                        <div className="p-4">
                                            <h4 className={`font-semibold ${themeClasses.textPrimary}`}>Cảnh {index + 1}</h4>
                                            <p className={`text-sm truncate ${themeClasses.textMuted}`}>{scene.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-center gap-4 mt-8">
                                <Link
                                    href="/ai-studio/gallery"
                                    className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                                >
                                    📚 Xem Gallery
                                </Link>
                                <button
                                    onClick={() => router.visit('/ai-studio/scenario-builder')}
                                    className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg"
                                >
                                    Tạo kịch bản mới
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Templates Modal */}
                {showTemplates && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className={`w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-3xl ${isDark ? 'bg-[#111]' : 'bg-white'} shadow-2xl`}>
                            <div className="p-6 border-b" style={{ borderColor: isDark ? '#222' : '#e2e8f0' }}>
                                <div className="flex items-center justify-between">
                                    <h3 className={`text-xl font-bold ${themeClasses.textPrimary}`}>Chọn Template</h3>
                                    <button onClick={() => setShowTemplates(false)} className={themeClasses.textMuted}>×</button>
                                </div>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                {templates.length === 0 ? (
                                    <p className={`text-center py-8 ${themeClasses.textMuted}`}>Chưa có template nào</p>
                                ) : (
                                    <div className="grid gap-4">
                                        {templates.map((template) => (
                                            <button
                                                key={template.id}
                                                onClick={() => handleSelectTemplate(template)}
                                                className={`p-4 rounded-xl text-left transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 border border-white/10' : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'}`}
                                            >
                                                <h4 className={`font-semibold ${themeClasses.textPrimary}`}>{template.name}</h4>
                                                <p className={`text-sm ${themeClasses.textMuted} line-clamp-2`}>{template.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
