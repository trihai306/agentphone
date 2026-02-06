import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useToast } from '@/Components/Layout/ToastProvider';
import { aiStudioApi } from '@/services/api';

export default function Script({ scenario, currentCredits = 0, videoModels = [], imageModels = [] }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { showToast } = useToast();

    const [title, setTitle] = useState(scenario?.title || 'Untitled Scenario');
    const [script, setScript] = useState(scenario?.script || '');
    const [parsing, setParsing] = useState(false);
    const [saving, setSaving] = useState(false);

    const themeClasses = {
        textPrimary: isDark ? 'text-white' : 'text-slate-900',
        textSecondary: isDark ? 'text-slate-300' : 'text-slate-600',
        textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
        cardBg: isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200',
        inputBg: isDark ? 'bg-black/30 border-white/10 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400',
    };

    const handleParseAndContinue = async () => {
        if (script.length < 20) {
            showToast('Kịch bản phải có ít nhất 20 ký tự', 'error');
            return;
        }

        setParsing(true);
        try {
            // Parse script with AI - send as object with script and output_type
            const parseResponse = await aiStudioApi.parseScenario({
                script: script,
                output_type: scenario.output_type
            });

            if (!parseResponse.success) {
                throw new Error(parseResponse.error || 'Không thể phân tích kịch bản');
            }

            const scenes = parseResponse.data.scenes || [];
            const models = scenario.output_type === 'video' ? videoModels : imageModels;
            const defaultModel = models[0]?.id || 'kling-1.5-pro';

            // Save scenario with scenes
            const saveResponse = await fetch('/ai-studio/scenarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: JSON.stringify({
                    script,
                    title,
                    output_type: scenario.output_type,
                    model: defaultModel,
                    scenes: scenes.map((s, i) => ({
                        order: i + 1,
                        description: s.description,
                        prompt: s.prompt,
                        duration: s.duration || 5,
                    })),
                }),
            });

            const saveData = await saveResponse.json();
            if (saveData.success) {
                showToast(`Đã phân tích ${scenes.length} cảnh`, 'success');
                router.visit(`/ai-studio/scenarios/${saveData.scenario.id}/edit`);
            } else {
                throw new Error(saveData.error || 'Không thể lưu kịch bản');
            }
        } catch (error) {
            showToast('Lỗi: ' + error.message, 'error');
        } finally {
            setParsing(false);
        }
    };

    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            await fetch(`/ai-studio/scenarios/${scenario.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: JSON.stringify({ title, script }),
            });
            showToast('Đã lưu nháp', 'success');
        } catch (error) {
            showToast('Lỗi: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppLayout title="Nhập Kịch Bản">
            <Head title="Nhập Kịch Bản" />

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
                                <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>
                                    Nhập Kịch Bản
                                </h1>
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

                    {/* Content */}
                    <div className={`p-6 rounded-2xl ${themeClasses.cardBg} border mb-6`}>
                        {/* Title */}
                        <div className="mb-6">
                            <label className={`block text-sm font-bold mb-2 ${themeClasses.textMuted}`}>
                                Tiêu đề
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Nhập tiêu đề cho kịch bản..."
                                className={`w-full px-4 py-3 rounded-xl border ${themeClasses.inputBg} focus:outline-none focus:ring-2 focus:ring-violet-500/50`}
                            />
                        </div>

                        {/* Script Textarea */}
                        <div>
                            <label className={`block text-sm font-bold mb-2 ${themeClasses.textMuted}`}>
                                Nội dung kịch bản
                            </label>
                            <textarea
                                value={script}
                                onChange={(e) => setScript(e.target.value)}
                                placeholder={`Mô tả chi tiết cảnh quay của bạn...

Ví dụ:
Cảnh 1: Một cô gái trẻ đang đi bộ trong công viên lúc hoàng hôn, ánh nắng vàng chiếu qua tán lá.
Cảnh 2: Cô ấy dừng lại bên một quán cà phê nhỏ, nhìn vào menu.
Cảnh 3: Close-up ly cà phê đang được pha, hơi nóng bốc lên.

Mẹo: Mô tả càng chi tiết, kết quả càng chính xác!`}
                                rows={14}
                                className={`w-full px-4 py-4 rounded-xl border-2 text-sm resize-none transition-all focus:outline-none focus:ring-4 ${isDark
                                    ? 'bg-black/30 border-white/10 text-white placeholder-slate-500 focus:border-violet-500/50 focus:ring-violet-500/10'
                                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-400 focus:ring-violet-500/10'
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
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between">
                        <button
                            onClick={handleSaveDraft}
                            disabled={saving}
                            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'}`}
                        >
                            {saving ? 'Đang lưu...' : 'Lưu nháp'}
                        </button>
                        <button
                            onClick={handleParseAndContinue}
                            disabled={script.length < 20 || parsing}
                            className="px-8 py-3 rounded-xl text-base font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {parsing ? 'Đang phân tích...' : 'Phân tích với AI'}
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
