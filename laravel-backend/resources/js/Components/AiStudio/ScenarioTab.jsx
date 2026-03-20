import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { aiStudioApi, aiApi } from '@/services/api';
import { Button } from '@/Components/UI';

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
    const [sourceImages, setSourceImages] = useState([]); // Array of {file, preview}
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
        audio_style: 'natural',
        background_music: false,
        music_style: 'none',
    });

    // Character management
    const [characters, setCharacters] = useState([]);
    const [showCharacterForm, setShowCharacterForm] = useState(false);
    const [newCharacter, setNewCharacter] = useState({
        name: '',
        description: '',
        gender: 'female',
        age: 'young',
        image: null, // { url, file, type: 'upload' | 'ai' }
    });
    const [characterImageMode, setCharacterImageMode] = useState('upload'); // 'upload' or 'ai'
    const [generatingCharacterImage, setGeneratingCharacterImage] = useState(false);

    // Frame Chain Mode - giữ nhân vật nhất quán xuyên suốt
    const [frameChainMode, setFrameChainMode] = useState(true);

    const models = outputType === 'video' ? videoModels : imageModels;
    const selectedModel = models.find(m => m.id === model);

    // Duration config (extended range)
    const MIN_DURATION = 4;
    const MAX_DURATION = 15;
    const DEFAULT_DURATION = 6;

    // Audio style options
    const audioStyles = [
        { id: 'natural', label: t('ai_studio.audio_natural'), desc: t('ai_studio.audio_natural_desc') },
        { id: 'dramatic', label: t('ai_studio.audio_dramatic'), desc: t('ai_studio.audio_dramatic_desc') },
        { id: 'upbeat', label: t('ai_studio.audio_upbeat'), desc: t('ai_studio.audio_upbeat_desc') },
    ];

    // Background music options
    const musicStyles = [
        { id: 'none', label: t('ai_studio.no_background_music') },
        { id: 'ambient', label: 'Ambient' },
        { id: 'upbeat', label: 'Upbeat' },
        { id: 'dramatic', label: 'Cinematic' },
        { id: 'lo-fi', label: 'Lo-Fi' },
    ];

    // Set default model
    useEffect(() => {
        if (models.length > 0 && !model) {
            const defaultModel = models.find(m => m.enabled && !m.coming_soon) || models[0];
            setModel(defaultModel?.id || '');
        }
    }, [models, outputType]);

    // Handle multiple images upload
    const handleImagesUpload = (e) => {
        const files = Array.from(e.target.files);
        const newImages = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setSourceImages(prev => [...prev, ...newImages].slice(0, 10)); // Max 10 images
    };

    // Remove an image
    const handleRemoveImage = (index) => {
        setSourceImages(prev => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].preview); // Cleanup
            updated.splice(index, 1);
            return updated;
        });
    };

    // Convert file to base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    // Parse script into scenes (with optional reference images)
    const handleParse = async () => {
        // Always require script text
        if (!script.trim() || script.length < 10) {
            addToast(t('ai_studio.script_min_length'), 'warning');
            return;
        }

        setParsing(true);
        try {
            let payload = {
                script,
                output_type: outputType,
            };

            // If user uploaded reference images, include them
            if (sourceImages.length > 0) {
                const imagesBase64 = await Promise.all(
                    sourceImages.map(async (img) => ({
                        data: await fileToBase64(img.file),
                        name: img.file.name,
                    }))
                );
                payload.images = imagesBase64;
            }

            const response = await aiStudioApi.parseScenario(payload);

            if (response.success) {
                const parsedScenes = response.data.scenes;

                // Attach source images to corresponding scenes for Image-to-Video
                if (sourceImages.length > 0) {
                    parsedScenes.forEach((scene, i) => {
                        if (sourceImages[i]) {
                            scene.image = sourceImages[i].file;
                            scene.imagePreview = sourceImages[i].preview;
                        }
                    });
                }

                setScenes(parsedScenes);
                setTitle(response.data.title || '');
                setStep('scenes');

                // Estimate credits
                await estimateCredits(parsedScenes);
            }
        } catch (error) {
            addToast(error.response?.data?.error || t('ai_studio.parse_failed'), 'error');
        } finally {
            setParsing(false);
        }
    };

    // Estimate total credits
    const estimateCredits = async (sceneList) => {
        if (!model || sceneList.length === 0) return;

        try {
            const response = await aiStudioApi.estimateScenario({
                model,
                output_type: outputType,
                scenes: sceneList,
                settings,
            });

            if (response.success) {
                setTotalCredits(response.total_credits);
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

    // Save and generate all scenes
    const handleGenerate = async () => {
        if (scenes.length === 0) {
            addToast(t('ai_studio.no_scenes'), 'warning');
            return;
        }

        if (currentCredits < totalCredits) {
            addToast(t('ai_studio.insufficient_credits', { required: totalCredits, current: currentCredits }), 'warning');
            return;
        }

        if (!model) {
            addToast(t('ai_studio.please_select_model'), 'warning');
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
            const saveResponse = await aiStudioApi.saveScenario({
                script,
                title,
                output_type: outputType,
                model,
                scenes: scenesWithImages,
                settings,
            });

            if (saveResponse.success) {
                const savedScenario = saveResponse.scenario;
                setScenario(savedScenario);

                // Start generation
                const genResponse = await aiStudioApi.generateScenario(savedScenario.id);

                if (genResponse.success) {
                    setScenario(genResponse.scenario);
                    addToast(t('ai_studio.generation_started'), 'success');

                    // Start polling
                    startPolling(savedScenario.id);
                }
            }
        } catch (error) {
            addToast(error.response?.data?.error || t('ai_studio.scenario_create_failed'), 'error');
            setStep('scenes');
        }
    };

    // Poll for status updates
    const startPolling = (scenarioId) => {
        const pollInterval = setInterval(async () => {
            try {
                const response = await aiStudioApi.getScenarioStatus(scenarioId);

                if (response.success) {
                    const updatedScenario = response.scenario;
                    setScenario(updatedScenario);
                    setScenes(updatedScenario.scenes);

                    // Check if completed
                    if (['completed', 'failed', 'partial'].includes(updatedScenario.status)) {
                        clearInterval(pollInterval);
                        if (updatedScenario.status === 'completed') {
                            addToast(t('ai_studio.all_scenes_completed'), 'success');
                        } else if (updatedScenario.status === 'partial') {
                            addToast(t('ai_studio.some_scenes_failed'), 'warning');
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

    // Character management functions
    const handleAddCharacter = () => {
        if (!newCharacter.name.trim()) {
            addToast(t('ai_studio.enter_character_name'), 'warning');
            return;
        }
        setCharacters([...characters, { ...newCharacter, id: Date.now() }]);
        setNewCharacter({ name: '', description: '', gender: 'female', age: 'young', image: null });
        setCharacterImageMode('upload');
        setShowCharacterForm(false);
        addToast(t('ai_studio.character_added', { name: newCharacter.name }), 'success');
    };

    const handleRemoveCharacter = (id) => {
        const char = characters.find(c => c.id === id);
        if (char?.image?.url && char.image.type === 'upload') {
            URL.revokeObjectURL(char.image.url); // Cleanup uploaded image
        }
        setCharacters(characters.filter(c => c.id !== id));
    };

    // Handle character image upload
    const handleCharacterImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            addToast(t('ai_studio.select_image_file'), 'warning');
            return;
        }

        const url = URL.createObjectURL(file);
        setNewCharacter({ ...newCharacter, image: { url, file, type: 'upload' } });
    };

    // Generate character image with AI
    const handleGenerateCharacterImage = async () => {
        if (!newCharacter.description.trim()) {
            addToast(t('ai_studio.enter_description_for_ai'), 'warning');
            return;
        }

        setGeneratingCharacterImage(true);
        try {
            const prompt = `Portrait of a ${newCharacter.gender === 'female' ? 'woman' : 'man'}, ${newCharacter.age === 'child' ? 'child' :
                newCharacter.age === 'young' ? 'young adult 25 years old' :
                    newCharacter.age === 'middle' ? 'middle-aged 45 years old' :
                        'elderly 65 years old'
                }. ${newCharacter.description}. High quality, realistic, professional portrait photography.`;

            const response = await aiApi.generatePortrait({
                prompt,
                style: 'realistic'
            });

            if (response?.image_url) {
                setNewCharacter({
                    ...newCharacter,
                    image: { url: response.image_url, file: null, type: 'ai' }
                });
                addToast(t('ai_studio.character_image_created'), 'success');
            }
        } catch (error) {
            console.error('Error generating character image:', error);
            addToast(t('ai_studio.image_generation_failed'), 'error');
        } finally {
            setGeneratingCharacterImage(false);
        }
    };

    // Remove character image
    const handleRemoveCharacterImage = () => {
        if (newCharacter.image?.url && newCharacter.image.type === 'upload') {
            URL.revokeObjectURL(newCharacter.image.url);
        }
        setNewCharacter({ ...newCharacter, image: null });
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Step Indicator - Glassmorphism */}
            <div className={`flex items-center justify-center gap-2 md:gap-4 p-4 rounded-2xl backdrop-blur-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/60 border border-white/40 shadow-lg'}`}>
                {['input', 'scenes', 'generating'].map((s, i) => (
                    <div key={s} className="flex items-center">
                        <div className={`w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${step === s
                            ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/40 scale-110'
                            : i < ['input', 'scenes', 'generating'].indexOf(step)
                                ? isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                : isDark ? 'bg-white/5 text-slate-500 border border-white/10' : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}>
                            {i < ['input', 'scenes', 'generating'].indexOf(step) ? '✓' : i + 1}
                        </div>
                        <span className={`ml-2 md:ml-3 text-xs md:text-sm font-semibold hidden sm:inline transition-colors ${step === s ? (isDark ? 'text-white' : 'text-violet-700') : themeClasses.textMuted}`}>
                            {s === 'input' ? t('ai_studio.enter_script') : s === 'scenes' ? t('ai_studio.edit_scenes') : t('ai_studio.generating')}
                        </span>
                        {i < 2 && (
                            <div className={`w-8 md:w-16 h-0.5 mx-2 md:mx-4 rounded-full transition-all duration-500 ${i < ['input', 'scenes', 'generating'].indexOf(step)
                                ? 'bg-gradient-to-r from-emerald-500 to-violet-500'
                                : isDark ? 'bg-white/10' : 'bg-slate-200'
                                }`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step 1: Input */}
            {step === 'input' && (
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                        {/* Main Input Panel - Glassmorphism */}
                        <div className={`lg:col-span-2 p-5 md:p-6 rounded-2xl backdrop-blur-xl transition-all ${isDark ? 'bg-white/5 border border-white/10 hover:border-white/20' : 'bg-white/70 border border-white/50 shadow-xl hover:shadow-2xl'}`}>
                            {/* Header with gradient icon */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30">
                                    <span className="text-2xl">✍️</span>
                                </div>
                                <div>
                                    <h2 className={`text-lg md:text-xl font-bold ${themeClasses.textPrimary}`}>{t('ai_studio.enter_script')}</h2>
                                    <p className={`text-xs md:text-sm ${themeClasses.textMuted}`}>{t('ai_studio.ai_auto_split_scenes')}</p>
                                </div>
                            </div>

                            {/* Script Textarea - Enhanced */}
                            <textarea
                                value={script}
                                onChange={(e) => setScript(e.target.value)}
                                placeholder={t('ai_studio.script_placeholder')}
                                rows={10}
                                className={`w-full px-4 py-4 rounded-xl border-2 text-sm resize-none transition-all duration-300 focus:outline-none focus:ring-4 ${isDark
                                    ? 'bg-black/30 border-white/10 text-white placeholder-slate-500 focus:border-violet-500/50 focus:ring-violet-500/10'
                                    : 'bg-white/50 border-slate-200/50 text-slate-900 placeholder-slate-400 focus:border-violet-400 focus:ring-violet-400/10'
                                    }`}
                            />
                            <div className="flex items-center justify-between mt-3">
                                <p className={`text-xs font-medium ${themeClasses.textMuted}`}>
                                    {script.length.toLocaleString()}/10,000 {t('ai_studio.characters')}
                                </p>
                                <p className={`text-xs font-semibold flex items-center gap-1 ${script.length >= 10 ? 'text-emerald-500' : themeClasses.textMuted}`}>
                                    {script.length >= 10 ? '✓' : '○'} {script.length >= 10 ? t('ai_studio.sufficient_length') : t('ai_studio.min_10_chars')}
                                </p>
                            </div>

                            {/* Reference Images Section */}
                            <div className="mt-6 pt-6 border-t border-dashed" style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-lg">🖼️</span>
                                    <div>
                                        <h3 className={`text-sm font-semibold ${themeClasses.textPrimary}`}>
                                            {t('ai_studio.reference_images')} <span className={`text-xs font-normal ${themeClasses.textMuted}`}>({t('ai_studio.optional')})</span>
                                        </h3>
                                        <p className={`text-xs ${themeClasses.textMuted}`}>
                                            {t('ai_studio.upload_reference_desc')}
                                        </p>
                                    </div>
                                </div>

                                {/* Compact Image Upload */}
                                <label className={`block relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${isDark
                                    ? 'border-[#2a2a2a] hover:border-violet-500/50 hover:bg-violet-600/5'
                                    : 'border-slate-200 hover:border-violet-400 hover:bg-violet-50/50'
                                    }`}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImagesUpload}
                                        className="hidden"
                                    />
                                    <div className="flex items-center justify-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-slate-100'}`}>
                                            <span className="text-xl">📷</span>
                                        </div>
                                        <div className="text-left">
                                            <p className={`text-sm font-medium ${themeClasses.textPrimary}`}>
                                                {t('ai_studio.click_to_select_images')}
                                            </p>
                                            <p className={`text-xs ${themeClasses.textMuted}`}>
                                                {t('ai_studio.max_10_images')}
                                            </p>
                                        </div>
                                    </div>
                                </label>

                                {/* Images Preview Grid */}
                                {sourceImages.length > 0 && (
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className={`text-xs font-medium ${themeClasses.textMuted}`}>
                                                {t('ai_studio.images_selected', { count: sourceImages.length })}
                                            </p>
                                            <button
                                                onClick={() => setSourceImages([])}
                                                className={`text-xs ${isDark ? 'text-rose-400 hover:text-rose-300' : 'text-rose-500 hover:text-rose-600'}`}
                                            >
                                                {t('ai_studio.remove_all')}
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {sourceImages.map((img, index) => (
                                                <div key={index} className="relative group w-16 h-16">
                                                    <img
                                                        src={img.preview}
                                                        alt={`Image ${index + 1}`}
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                    <button
                                                        onClick={() => handleRemoveImage(index)}
                                                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        ✕
                                                    </button>
                                                    <div className={`absolute bottom-0 left-0 right-0 text-center text-[10px] font-bold py-0.5 rounded-b-lg ${isDark ? 'bg-black/60 text-white' : 'bg-black/40 text-white'}`}>
                                                        {index + 1}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tip */}
                                <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-amber-600/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'}`}>
                                    <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                                        <strong>{t('ai_studio.tip')}:</strong> {t('ai_studio.reference_images_tip')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Settings Panel - Glassmorphism */}
                        <div className="space-y-4">
                            {/* Output Type */}
                            <div className={`p-5 rounded-2xl backdrop-blur-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/70 border border-white/50 shadow-lg'}`}>
                                <label className={`block text-xs font-bold mb-3 uppercase tracking-wider ${themeClasses.textMuted}`}>
                                    {t('ai_studio.output_type')}
                                </label>
                                <div className={`flex p-1.5 rounded-xl ${isDark ? 'bg-black/30' : 'bg-slate-100/80'}`}>
                                    {['video', 'image'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => { setOutputType(type); setModel(''); }}
                                            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${outputType === type
                                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                                                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                                                }`}
                                        >
                                            {type === 'video' ? 'Video' : t('ai_studio.image')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Model Selection */}
                            <div className={`p-5 rounded-2xl backdrop-blur-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/70 border border-white/50 shadow-lg'}`}>
                                <label className={`block text-xs font-bold mb-3 uppercase tracking-wider ${themeClasses.textMuted}`}>
                                    {t('ai_studio.ai_model')}
                                </label>
                                <select
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-300 cursor-pointer ${isDark
                                        ? 'bg-black/30 border-white/10 text-white hover:border-violet-500/50'
                                        : 'bg-white/50 border-slate-200/50 text-slate-900 hover:border-violet-400'
                                        }`}
                                >
                                    {models.filter(m => m.enabled && !m.coming_soon).map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} ({m.credits_cost} credits/{outputType === 'video' ? t('ai_studio.per_second') : t('ai_studio.per_image')})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Audio Settings (Video only) - Enhanced */}
                            {outputType === 'video' && (
                                <div className={`p-5 rounded-2xl backdrop-blur-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/70 border border-white/50 shadow-lg'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${themeClasses.textMuted}`}>
                                            <span className="text-base">🔊</span> {t('ai_studio.audio_settings')}
                                        </label>
                                        <button
                                            onClick={() => setSettings(s => ({ ...s, generate_audio: !s.generate_audio }))}
                                            className={`relative w-12 h-7 rounded-full transition-all duration-300 ${settings.generate_audio
                                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30'
                                                : isDark ? 'bg-white/10' : 'bg-slate-300'
                                                }`}
                                        >
                                            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.generate_audio ? 'translate-x-5' : 'translate-x-0'
                                                }`} />
                                        </button>
                                    </div>

                                    {settings.generate_audio && (
                                        <div className="space-y-4">
                                            {/* Audio Style - Better Buttons */}
                                            <div className="grid grid-cols-3 gap-2">
                                                {audioStyles.map((style) => (
                                                    <button
                                                        key={style.id}
                                                        onClick={() => setSettings(s => ({ ...s, audio_style: style.id }))}
                                                        className={`py-2.5 px-3 text-xs font-semibold rounded-xl transition-all duration-300 border-2 ${settings.audio_style === style.id
                                                            ? 'bg-gradient-to-br from-violet-600/20 to-indigo-600/20 text-violet-400 border-violet-500/50 shadow-lg shadow-violet-500/10'
                                                            : isDark ? 'bg-black/20 text-slate-400 border-white/10 hover:border-white/20' : 'bg-white/50 text-slate-600 border-slate-200/50 hover:border-violet-300'
                                                            }`}
                                                    >
                                                        {style.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Background Music - Improved */}
                                            <div className={`flex items-center justify-between py-3 px-4 rounded-xl border ${isDark ? 'bg-black/20 border-white/10' : 'bg-white/50 border-slate-200/50'}`}>
                                                <span className={`text-xs font-medium ${themeClasses.textSecondary}`}>{t('ai_studio.background_music')}</span>
                                                <select
                                                    value={settings.music_style}
                                                    onChange={(e) => setSettings(s => ({ ...s, music_style: e.target.value }))}
                                                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${isDark
                                                        ? 'bg-black/30 border-white/10 text-white hover:border-violet-500/50'
                                                        : 'bg-white border-slate-200 text-slate-900 hover:border-violet-400'
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

                            {/* Frame Chain Mode */}
                            <div className={`p-5 rounded-2xl backdrop-blur-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/70 border border-white/50 shadow-lg'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">🔗</span>
                                        <div>
                                            <p className={`text-sm font-bold ${themeClasses.textPrimary}`}>{t('ai_studio.frame_chain_mode')}</p>
                                            <p className={`text-xs ${themeClasses.textMuted}`}>{t('ai_studio.keep_characters_consistent')}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setFrameChainMode(!frameChainMode)}
                                        className={`relative w-12 h-7 rounded-full transition-all duration-300 ${frameChainMode
                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30'
                                            : isDark ? 'bg-white/10' : 'bg-slate-300'
                                            }`}
                                    >
                                        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${frameChainMode ? 'translate-x-5' : 'translate-x-0'
                                            }`} />
                                    </button>
                                </div>
                                {frameChainMode && (
                                    <p className={`mt-3 text-xs ${isDark ? 'text-emerald-400/70' : 'text-emerald-600/80'}`}>
                                        {t('ai_studio.frame_chain_enabled_desc')}
                                    </p>
                                )}
                            </div>

                            {/* Character Definition - Premium Design */}
                            <div className={`p-5 rounded-2xl backdrop-blur-xl ${isDark ? 'bg-gradient-to-br from-violet-900/20 to-indigo-900/20 border border-violet-500/20' : 'bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200/50 shadow-lg'}`}>
                                {/* Header */}
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-violet-600 to-indigo-600' : 'bg-gradient-to-br from-violet-500 to-indigo-500'} shadow-lg`}>
                                            <span className="text-white text-lg">�</span>
                                        </div>
                                        <div>
                                            <h3 className={`text-sm font-bold ${themeClasses.textPrimary}`}>{t('ai_studio.main_characters')}</h3>
                                            <p className={`text-xs ${themeClasses.textMuted}`}>
                                                {characters.length > 0 ? t('ai_studio.characters_defined', { count: characters.length }) : t('ai_studio.no_characters')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Character Grid - Premium Cards */}
                                {characters.length > 0 && (
                                    <div className="grid grid-cols-1 gap-3 mb-4">
                                        {characters.map((char, index) => (
                                            <div
                                                key={char.id}
                                                className={`group relative p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] ${isDark
                                                    ? 'bg-gradient-to-r from-white/5 to-white/10 border border-white/10 hover:border-violet-500/30'
                                                    : 'bg-white border border-slate-200 hover:border-violet-300 shadow-sm hover:shadow-md'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    {/* Avatar - Show image if available, otherwise emoji */}
                                                    {char.image ? (
                                                        <div className="relative w-14 h-14 flex-shrink-0">
                                                            <img
                                                                src={char.image.url}
                                                                alt={char.name}
                                                                className="w-14 h-14 rounded-2xl object-cover border-2 border-violet-500/30"
                                                            />
                                                            <span className={`absolute -bottom-1 -right-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${char.image.type === 'ai' ? 'bg-violet-600 text-white' : 'bg-emerald-600 text-white'}`}>
                                                                {char.image.type === 'ai' ? '✨' : '📤'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${char.gender === 'female'
                                                            ? isDark ? 'bg-gradient-to-br from-pink-500/30 to-rose-500/30' : 'bg-gradient-to-br from-pink-100 to-rose-100'
                                                            : isDark ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/30' : 'bg-gradient-to-br from-blue-100 to-cyan-100'
                                                            }`}>
                                                            {char.gender === 'female' ? '👩' : '👨'}
                                                            <span className={`absolute -bottom-1 -right-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${isDark ? 'bg-violet-600 text-white' : 'bg-violet-500 text-white'}`}>
                                                                #{index + 1}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className={`text-sm font-bold ${themeClasses.textPrimary}`}>{char.name}</h4>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${char.age === 'child' ? (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700') :
                                                                char.age === 'young' ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700') :
                                                                    char.age === 'middle' ? (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700') :
                                                                        (isDark ? 'bg-slate-500/20 text-slate-400' : 'bg-slate-100 text-slate-700')
                                                                }`}>
                                                                {char.age === 'child' ? t('ai_studio.age_child') : char.age === 'young' ? '18-35' : char.age === 'middle' ? t('ai_studio.age_middle') : t('ai_studio.age_old')}
                                                            </span>
                                                        </div>
                                                        <p className={`text-xs leading-relaxed line-clamp-2 ${themeClasses.textMuted}`}>
                                                            {char.description || t('ai_studio.no_appearance_desc')}
                                                        </p>
                                                    </div>

                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={() => handleRemoveCharacter(char.id)}
                                                        className={`opacity-0 group-hover:opacity-100 p-2 rounded-lg transition-all duration-200 ${isDark ? 'hover:bg-rose-500/20 text-rose-400' : 'hover:bg-rose-100 text-rose-500'}`}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add Character Form - Premium Design */}
                                {showCharacterForm ? (
                                    <div className={`p-4 rounded-xl border-2 ${isDark ? 'border-violet-500/30 bg-black/20' : 'border-violet-300 bg-white'}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className={`text-sm font-bold ${themeClasses.textPrimary}`}>{t('ai_studio.add_new_character')}</h4>
                                            <Button variant="ghost" size="icon-xs" onClick={() => setShowCharacterForm(false)}>
                                                ✕
                                            </Button>
                                        </div>

                                        <div className="space-y-3">
                                            {/* Name + Gender Row */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <input
                                                    type="text"
                                                    placeholder={t('ai_studio.character_name')}
                                                    value={newCharacter.name}
                                                    onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
                                                    className={`col-span-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${isDark
                                                        ? 'bg-black/30 border-white/10 text-white placeholder-slate-500 focus:border-violet-500/50 focus:ring-violet-500/20'
                                                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-400 focus:ring-violet-400/20'
                                                        }`}
                                                />
                                                <select
                                                    value={newCharacter.gender}
                                                    onChange={(e) => setNewCharacter({ ...newCharacter, gender: e.target.value })}
                                                    className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium cursor-pointer transition-all ${isDark
                                                        ? 'bg-black/30 border-white/10 text-white'
                                                        : 'bg-slate-50 border-slate-200 text-slate-900'
                                                        }`}
                                                >
                                                    <option value="female">{t('ai_studio.female')}</option>
                                                    <option value="male">{t('ai_studio.male')}</option>
                                                </select>
                                            </div>

                                            {/* Description */}
                                            <textarea
                                                placeholder={t('ai_studio.appearance_placeholder')}
                                                value={newCharacter.description}
                                                onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })}
                                                rows={3}
                                                className={`w-full px-4 py-3 rounded-xl border-2 text-sm resize-none transition-all focus:outline-none focus:ring-2 ${isDark
                                                    ? 'bg-black/30 border-white/10 text-white placeholder-slate-500 focus:border-violet-500/50 focus:ring-violet-500/20'
                                                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-400 focus:ring-violet-400/20'
                                                    }`}
                                            />

                                            {/* Age Selection - Visual Pills */}
                                            <div>
                                                <label className={`block text-xs font-semibold mb-2 ${themeClasses.textMuted}`}>{t('ai_studio.age')}</label>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {[
                                                        { id: 'child', label: '👶', desc: t('ai_studio.age_child') },
                                                        { id: 'young', label: '🧑', desc: '18-35' },
                                                        { id: 'middle', label: '🧔', desc: '36-55' },
                                                        { id: 'old', label: '👴', desc: '55+' },
                                                    ].map((age) => (
                                                        <button
                                                            key={age.id}
                                                            type="button"
                                                            onClick={() => setNewCharacter({ ...newCharacter, age: age.id })}
                                                            className={`py-2 rounded-xl text-center transition-all duration-200 border-2 ${newCharacter.age === age.id
                                                                ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-transparent shadow-lg shadow-violet-500/30'
                                                                : isDark ? 'bg-white/5 border-white/10 text-slate-400 hover:border-violet-500/30' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-violet-300'
                                                                }`}
                                                        >
                                                            <span className="text-lg">{age.label}</span>
                                                            <p className="text-[10px] font-medium mt-0.5">{age.desc}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Character Image - Upload or AI Generate */}
                                            <div>
                                                <label className={`block text-xs font-semibold mb-2 ${themeClasses.textMuted}`}>{t('ai_studio.character_image')} ({t('ai_studio.optional')})</label>

                                                {/* Mode Toggle */}
                                                <div className={`flex p-1 rounded-xl mb-3 ${isDark ? 'bg-black/30' : 'bg-slate-100'}`}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCharacterImageMode('upload')}
                                                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${characterImageMode === 'upload'
                                                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
                                                            : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                                                            }`}
                                                    >
                                                        {t('ai_studio.upload_image')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCharacterImageMode('ai')}
                                                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${characterImageMode === 'ai'
                                                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
                                                            : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                                                            }`}
                                                    >
                                                        {t('ai_studio.ai_generate_image')}
                                                    </button>
                                                </div>

                                                {/* Image Preview or Upload/Generate */}
                                                {newCharacter.image ? (
                                                    <div className="relative group">
                                                        <img src={newCharacter.image.url} alt="Character preview" className="w-full h-40 object-cover rounded-xl border-2 border-violet-500/30" />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                                            <button type="button" onClick={handleRemoveCharacterImage} className="px-3 py-2 bg-rose-500 text-white text-xs font-semibold rounded-lg hover:bg-rose-400">{t('ai_studio.remove_image')}</button>
                                                        </div>
                                                        <span className={`absolute top-2 right-2 px-2 py-1 text-[10px] font-bold rounded-full ${newCharacter.image.type === 'ai' ? 'bg-violet-600 text-white' : 'bg-emerald-600 text-white'}`}>
                                                            {newCharacter.image.type === 'ai' ? '✨ AI' : '📤 Upload'}
                                                        </span>
                                                    </div>
                                                ) : characterImageMode === 'upload' ? (
                                                    <label className={`block w-full p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:scale-[1.02] ${isDark ? 'border-white/20 hover:border-violet-500/50 bg-white/5' : 'border-slate-300 hover:border-violet-400 bg-slate-50'}`}>
                                                        <input type="file" accept="image/*" onChange={handleCharacterImageUpload} className="hidden" />
                                                        <div className="text-center">
                                                            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-2xl mb-2 ${isDark ? 'bg-violet-600/20' : 'bg-violet-100'}`}>📷</div>
                                                            <p className={`text-sm font-medium ${themeClasses.textSecondary}`}>{t('ai_studio.click_to_select_image')}</p>
                                                            <p className={`text-xs mt-1 ${themeClasses.textMuted}`}>{t('ai_studio.image_formats_max')}</p>
                                                        </div>
                                                    </label>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={handleGenerateCharacterImage}
                                                        disabled={generatingCharacterImage || !newCharacter.description.trim()}
                                                        className={`w-full p-6 rounded-xl border-2 transition-all ${generatingCharacterImage ? 'border-violet-500/50 bg-violet-600/10 cursor-wait' : newCharacter.description.trim() ? (isDark ? 'border-violet-500/30 bg-violet-600/10 hover:border-violet-500/60' : 'border-violet-300 bg-violet-50 hover:border-violet-400') : (isDark ? 'border-white/10 bg-white/5 cursor-not-allowed' : 'border-slate-200 bg-slate-50 cursor-not-allowed')}`}
                                                    >
                                                        {generatingCharacterImage ? (
                                                            <div className="text-center">
                                                                <div className="w-12 h-12 mx-auto rounded-full bg-violet-600/20 flex items-center justify-center mb-2">
                                                                    <svg className="animate-spin w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                </div>
                                                                <p className={`text-sm font-medium ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>{t('ai_studio.ai_generating_image')}</p>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center">
                                                                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-2xl mb-2 ${isDark ? 'bg-violet-600/20' : 'bg-violet-100'}`}>✨</div>
                                                                <p className={`text-sm font-medium ${newCharacter.description.trim() ? (isDark ? 'text-violet-400' : 'text-violet-600') : themeClasses.textMuted}`}>
                                                                    {newCharacter.description.trim() ? t('ai_studio.generate_from_desc') : t('ai_studio.enter_desc_first')}
                                                                </p>
                                                                <p className={`text-xs mt-1 ${themeClasses.textMuted}`}>{t('ai_studio.ai_will_generate_from_desc')}</p>
                                                            </div>
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Submit Button */}
                                            <Button
                                                variant="gradient"
                                                className="w-full"
                                                onClick={handleAddCharacter}
                                                disabled={!newCharacter.name.trim()}
                                            >
                                                {t('ai_studio.add_to_list')}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Add Button - Premium Dashed */
                                    <button
                                        onClick={() => setShowCharacterForm(true)}
                                        className={`w-full py-4 rounded-xl border-2 border-dashed transition-all duration-300 group ${isDark
                                            ? 'border-violet-500/30 hover:border-violet-500/60 hover:bg-violet-500/10'
                                            : 'border-violet-300 hover:border-violet-400 hover:bg-violet-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all group-hover:scale-110 ${isDark ? 'bg-violet-600/30' : 'bg-violet-100'}`}>
                                                +
                                            </span>
                                            <span className={`text-sm font-semibold ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                                                {t('ai_studio.add_character')}
                                            </span>
                                        </div>
                                        <p className={`text-xs mt-1 ${themeClasses.textMuted}`}>
                                            {t('ai_studio.character_helps_ai')}
                                        </p>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Parse Button - Enhanced */}
                    <div className="mt-8 max-w-5xl mx-auto">
                        <Button
                            variant="gradient"
                            size="lg"
                            className="w-full"
                            onClick={handleParse}
                            disabled={parsing || script.length < 10}
                        >
                            {parsing ? (
                                <span className="flex items-center justify-center gap-3">
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t('ai_studio.analyzing_with_ai')}
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    {t('ai_studio.analyze_script')}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            )
            }

            {/* Step 2: Scenes */}
            {
                step === 'scenes' && (
                    <div className="max-w-5xl mx-auto">
                        {/* Title Input */}
                        <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-slate-200'}`}>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={t('ai_studio.scenario_title_placeholder')}
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
                                                        {t('ai_studio.prompt_editable')}
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
                                                            <span className={`text-xs font-medium ${themeClasses.textMuted}`}>{t('ai_studio.duration')}:</span>
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
                                                                        {t('ai_studio.reference_image')}
                                                                    </p>
                                                                    <p className={`text-xs truncate ${themeClasses.textMuted}`}>
                                                                        {scene.image.name || 'Reference image'}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleUpdateScene(index, 'image', null)}
                                                                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-rose-500/20 text-rose-400' : 'hover:bg-rose-100 text-rose-500'}`}
                                                                    title={t('ai_studio.remove_image')}
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
                                                                        {t('ai_studio.add_reference_image')}
                                                                    </p>
                                                                    <p className={`text-xs ${themeClasses.textMuted}`}>
                                                                        {t('ai_studio.video_from_image')}
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
                                                                    {t('ai_studio.select_image')}
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
                                    <h3 className={`text-sm font-bold mb-4 ${themeClasses.textPrimary}`}>{t('ai_studio.overview')}</h3>

                                    <div className="space-y-3">
                                        {/* Scenes count */}
                                        <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-[#0a0a0a]' : 'bg-slate-50'}`}>
                                            <span className={`text-xs ${themeClasses.textMuted}`}>{t('ai_studio.scene_count')}</span>
                                            <span className={`text-sm font-bold ${themeClasses.textPrimary}`}>{scenes.length} {t('ai_studio.scenes')}</span>
                                        </div>

                                        {/* Total duration */}
                                        {outputType === 'video' && (
                                            <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-[#0a0a0a]' : 'bg-slate-50'}`}>
                                                <span className={`text-xs ${themeClasses.textMuted}`}>{t('ai_studio.total_duration')}</span>
                                                <span className={`text-sm font-bold ${themeClasses.textPrimary}`}>{formatDuration(getTotalDuration())}</span>
                                            </div>
                                        )}

                                        {/* Audio settings */}
                                        {outputType === 'video' && (
                                            <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-[#0a0a0a]' : 'bg-slate-50'}`}>
                                                <span className={`text-xs ${themeClasses.textMuted}`}>Audio</span>
                                                <span className={`text-sm font-medium ${settings.generate_audio ? 'text-emerald-500' : themeClasses.textMuted}`}>
                                                    {settings.generate_audio ? t('ai_studio.on') : t('ai_studio.off')}
                                                </span>
                                            </div>
                                        )}

                                        {/* Credits */}
                                        <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border border-violet-500/20' : 'bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200'}`}>
                                            <span className={`text-xs font-medium ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>{t('ai_studio.total_credits')}</span>
                                            <span className={`text-lg font-bold ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>{totalCredits.toLocaleString()}</span>
                                        </div>

                                        {/* Credit balance check */}
                                        {currentCredits < totalCredits && (
                                            <div className={`p-3 rounded-xl ${isDark ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-rose-50 border border-rose-200'}`}>
                                                <p className="text-xs text-rose-500 text-center">
                                                    {t('ai_studio.need_more_credits', { count: (totalCredits - currentCredits).toLocaleString() })}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-6 space-y-3">
                                        <Button
                                            variant="gradient"
                                            className="w-full"
                                            onClick={handleGenerate}
                                            disabled={currentCredits < totalCredits}
                                        >
                                            {t('ai_studio.generate_count', { count: scenes.length, type: outputType === 'video' ? 'video' : t('ai_studio.image') })}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="w-full"
                                            onClick={handleReset}
                                        >
                                            {t('common.back')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Step 3: Generating */}
            {
                step === 'generating' && scenario && (
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
                                {scenario.status === 'generating' ? t('ai_studio.generating_video') :
                                    scenario.status === 'completed' ? t('ai_studio.generation_completed') :
                                        scenario.status === 'partial' ? t('ai_studio.partially_completed') : t('ai_studio.status_failed')}
                            </h2>
                            <p className={themeClasses.textSecondary}>
                                {t('ai_studio.scenes_completed_count', { completed: scenario.completed_scenes, total: scenario.total_scenes })}
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
                                                {t('ai_studio.scene')} {scene.order}
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
                                                {t('common.view')}
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
                                    {t('ai_studio.merge_video_coming_soon')}
                                </p>
                                <p className={`text-xs mt-1 ${themeClasses.textMuted}`}>
                                    {t('ai_studio.download_individual_videos')}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        {scenario.status !== 'generating' && (
                            <div className="flex justify-center">
                                <Button variant="secondary" onClick={handleReset}>
                                    {t('ai_studio.create_new_scenario')}
                                </Button>
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    );
}
