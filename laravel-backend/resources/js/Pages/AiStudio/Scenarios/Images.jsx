import { useState, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useToast } from '@/Components/Layout/ToastProvider';
import { aiStudioApi } from '@/services/api';

export default function Images({ scenario, currentCredits = 0, videoModels = [], imageModels = [] }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { showToast } = useToast();
    const fileInputRef = useRef(null);

    const [title, setTitle] = useState(scenario?.title || 'Untitled Scenario');
    const [uploadedImages, setUploadedImages] = useState([]);
    const [dragOver, setDragOver] = useState(false);
    const [parsing, setParsing] = useState(false);

    const themeClasses = {
        textPrimary: isDark ? 'text-white' : 'text-slate-900',
        textSecondary: isDark ? 'text-slate-300' : 'text-slate-600',
        textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
        cardBg: isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200',
        inputBg: isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900',
    };

    const handleImageSelect = (files) => {
        const newImages = [];
        Array.from(files).forEach((file) => {
            if (uploadedImages.length + newImages.length >= 10) return;
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                newImages.push({
                    id: Date.now() + Math.random(),
                    file,
                    preview: e.target.result,
                    data: e.target.result,
                });
                if (newImages.length === Math.min(files.length, 10 - uploadedImages.length)) {
                    setUploadedImages((prev) => [...prev, ...newImages]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemoveImage = (imageId) => {
        setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));
    };

    const handleParseAndContinue = async () => {
        if (uploadedImages.length === 0) {
            showToast('Vui lòng upload ít nhất 1 ảnh', 'error');
            return;
        }

        setParsing(true);
        try {
            const parseResponse = await aiStudioApi.parseScenario(
                '',
                scenario.output_type,
                uploadedImages.map((img) => ({ data: img.data }))
            );

            if (!parseResponse.success) {
                throw new Error(parseResponse.error || 'Không thể phân tích ảnh');
            }

            const scenes = parseResponse.data.scenes || [];
            const models = scenario.output_type === 'video' ? videoModels : imageModels;
            const defaultModel = models[0]?.id || 'kling-1.5-pro';

            const saveResponse = await aiStudioApi.saveScenario({
                script: `Analyzed from ${uploadedImages.length} images`,
                title,
                output_type: scenario.output_type,
                model: defaultModel,
                scenes: scenes.map((s, i) => ({
                    order: i + 1,
                    description: s.description,
                    prompt: s.prompt,
                    duration: s.duration || 5,
                    source_image: uploadedImages[i]?.data,
                })),
            });

            const saveData = saveResponse.data;
            if (saveData.success) {
                showToast(`Đã phân tích ${scenes.length} cảnh từ ảnh`, 'success');
                router.visit(`/ai-studio/scenarios/${saveData.scenario.id}/edit`);
            } else {
                throw new Error(saveData.error || 'Không thể lưu');
            }
        } catch (error) {
            showToast('Lỗi: ' + error.message, 'error');
        } finally {
            setParsing(false);
        }
    };

    return (
        <AppLayout title="Upload Ảnh">
            <Head title="Upload Ảnh" />

            <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-slate-50'}`}>
                <div className="max-w-4xl mx-auto px-6 py-8">
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
                                <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Upload Ảnh</h1>
                                <p className={`text-sm ${themeClasses.textMuted}`}>
                                    Bước 2/4 • {scenario.output_type === 'video' ? 'Video' : 'Hình ảnh'}
                                </p>
                            </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl ${isDark ? 'bg-violet-600/20 border border-violet-500/30' : 'bg-violet-100 border border-violet-200'}`}>
                            <span className={`text-sm font-bold ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
                                {currentCredits.toLocaleString()} credits
                            </span>
                        </div>
                    </div>

                    {/* Title Input */}
                    <div className={`p-6 rounded-2xl ${themeClasses.cardBg} border mb-6`}>
                        <label className={`block text-sm font-bold mb-2 ${themeClasses.textMuted}`}>Tiêu đề</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Nhập tiêu đề cho kịch bản..."
                            className={`w-full px-4 py-3 rounded-xl border ${themeClasses.inputBg} focus:outline-none focus:ring-2 focus:ring-violet-500/50`}
                        />
                    </div>

                    {/* Upload Area */}
                    <div className={`p-6 rounded-2xl ${themeClasses.cardBg} border mb-6`}>
                        <label className={`block text-sm font-bold mb-4 ${themeClasses.textMuted}`}>
                            Upload Ảnh ({uploadedImages.length}/10)
                        </label>

                        {/* Dropzone */}
                        <label
                            className={`block p-8 border-2 border-dashed rounded-2xl cursor-pointer text-center transition-all ${dragOver
                                ? isDark ? 'border-violet-500 bg-violet-500/10' : 'border-violet-400 bg-violet-50'
                                : isDark ? 'border-white/20 hover:border-white/40' : 'border-slate-300 hover:border-slate-400'
                                }`}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleImageSelect(e.dataTransfer.files); }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleImageSelect(e.target.files)}
                                className="hidden"
                            />
                            <div className={`w-16 h-16 mx-auto rounded-2xl mb-4 flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                                <svg className={`w-8 h-8 ${isDark ? 'text-white' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                            </div>
                            <p className={`text-lg font-semibold mb-2 ${themeClasses.textPrimary}`}>
                                Kéo thả ảnh hoặc click để chọn
                            </p>
                            <p className={`text-sm ${themeClasses.textMuted}`}>PNG, JPG, WEBP (tối đa 10 ảnh)</p>
                        </label>

                        {/* Image Grid */}
                        {uploadedImages.length > 0 && (
                            <div className="grid grid-cols-5 gap-3 mt-6">
                                {uploadedImages.map((img) => (
                                    <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden group">
                                        <img src={img.preview} alt="" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => handleRemoveImage(img.id)}
                                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between">
                        <Link
                            href="/ai-studio/scenario-builder"
                            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'}`}
                        >
                            Quay lại
                        </Link>
                        <button
                            onClick={handleParseAndContinue}
                            disabled={uploadedImages.length === 0 || parsing}
                            className="px-8 py-3 rounded-xl text-base font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {parsing ? 'Đang phân tích...' : `Phân tích ${uploadedImages.length} ảnh`}
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
