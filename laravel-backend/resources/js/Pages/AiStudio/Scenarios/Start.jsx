import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useToast } from '@/Components/Layout/ToastProvider';
import { aiStudioApi } from '@/services/api';

export default function Start({ currentCredits = 0, templates = [] }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { showToast } = useToast();

    const [outputType, setOutputType] = useState('video');
    const [creationMethod, setCreationMethod] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [loading, setLoading] = useState(false);

    const themeClasses = {
        textPrimary: isDark ? 'text-white' : 'text-slate-900',
        textSecondary: isDark ? 'text-slate-300' : 'text-slate-600',
        textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
        cardBg: isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200',
        inputBg: isDark ? 'bg-black/30 border-white/10' : 'bg-white border-slate-200',
    };

    const handleStart = async () => {
        if (!creationMethod) {
            showToast('Vui lòng chọn phương thức tạo', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await aiStudioApi.createDraftScenario({
                output_type: outputType,
                creation_method: creationMethod,
                template_id: selectedTemplate,
            });

            const data = response.data;
            if (data.success) {
                router.visit(data.redirect_url);
            } else {
                showToast(data.error || 'Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            showToast('Có lỗi xảy ra: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const creationMethods = [
        {
            id: 'script',
            title: 'Viết Kịch Bản',
            description: 'Nhập ý tưởng, AI tự chia thành các cảnh và tạo prompt chuyên nghiệp.',
            gradient: 'from-violet-600 to-indigo-600',
            bgGradient: isDark ? 'from-violet-600/10 to-indigo-600/10' : 'from-violet-50 to-indigo-50',
            borderActive: isDark ? 'border-violet-500/60' : 'border-violet-400',
            borderHover: isDark ? 'border-violet-500/30 hover:border-violet-500/50' : 'border-violet-200 hover:border-violet-300',
            iconPath: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
        },
        {
            id: 'images',
            title: 'Từ Ảnh Có Sẵn',
            description: 'Upload ảnh, AI phân tích và tạo video/slideshow chuyên nghiệp.',
            gradient: 'from-emerald-600 to-teal-600',
            bgGradient: isDark ? 'from-emerald-600/10 to-teal-600/10' : 'from-emerald-50 to-teal-50',
            borderActive: isDark ? 'border-emerald-500/60' : 'border-emerald-400',
            borderHover: isDark ? 'border-emerald-500/30 hover:border-emerald-500/50' : 'border-emerald-200 hover:border-emerald-300',
            iconPath: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
        },
        {
            id: 'template',
            title: 'Chọn Template',
            description: 'Mẫu có sẵn cho quảng cáo, giới thiệu sản phẩm, v.v.',
            gradient: 'from-cyan-600 to-blue-600',
            bgGradient: isDark ? 'from-cyan-600/10 to-blue-600/10' : 'from-cyan-50 to-blue-50',
            borderActive: isDark ? 'border-cyan-500/60' : 'border-cyan-400',
            borderHover: isDark ? 'border-cyan-500/30 hover:border-cyan-500/50' : 'border-cyan-200 hover:border-cyan-300',
            iconPath: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
        },
    ];

    const outputTypes = [
        { id: 'video', label: 'Video', desc: 'Tạo video từ kịch bản', iconPath: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
        { id: 'image', label: 'Hình ảnh', desc: 'Tạo series ảnh', iconPath: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    ];

    return (
        <AppLayout title="Tạo Kịch Bản Mới">
            <Head title="Tạo Kịch Bản Mới" />

            <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-slate-50'}`}>
                <div className="max-w-5xl mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/ai-studio"
                                className={`p-2 rounded-xl ${themeClasses.cardBg} border hover:border-violet-500/50 transition-all`}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </Link>
                            <div>
                                <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>
                                    Tạo Kịch Bản Mới
                                </h1>
                                <p className={`text-sm ${themeClasses.textMuted}`}>
                                    Tạo video/ảnh chuyên nghiệp theo kịch bản
                                </p>
                            </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl ${isDark ? 'bg-violet-600/20 border border-violet-500/30' : 'bg-violet-100 border border-violet-200'}`}>
                            <span className={`text-sm font-bold ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
                                {currentCredits.toLocaleString()} credits
                            </span>
                        </div>
                    </div>

                    {/* Step 1: Output Type */}
                    <div className={`p-6 rounded-2xl ${themeClasses.cardBg} border mb-6`}>
                        <label className={`block text-sm font-bold mb-4 ${themeClasses.textMuted} uppercase tracking-wide`}>
                            Bước 1: Loại Output
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            {outputTypes.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setOutputType(opt.id)}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${outputType === opt.id
                                        ? isDark
                                            ? 'bg-violet-600/20 border-violet-500/60'
                                            : 'bg-violet-50 border-violet-400'
                                        : isDark
                                            ? 'bg-white/5 border-white/10 hover:border-white/20'
                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <svg className={`w-6 h-6 ${outputType === opt.id ? (isDark ? 'text-violet-400' : 'text-violet-600') : (isDark ? 'text-slate-400' : 'text-slate-500')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={opt.iconPath} />
                                    </svg>
                                    <div className={`mt-2 font-semibold ${themeClasses.textPrimary}`}>{opt.label}</div>
                                    <div className={`text-xs ${themeClasses.textMuted}`}>{opt.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Creation Method */}
                    <div className={`p-6 rounded-2xl ${themeClasses.cardBg} border mb-6`}>
                        <label className={`block text-sm font-bold mb-4 ${themeClasses.textMuted} uppercase tracking-wide`}>
                            Bước 2: Phương Thức Tạo
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {creationMethods.map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => {
                                        setCreationMethod(method.id);
                                        if (method.id !== 'template') setSelectedTemplate(null);
                                    }}
                                    className={`group p-6 rounded-2xl border-2 transition-all text-left hover:scale-[1.02] bg-gradient-to-br ${method.bgGradient} ${creationMethod === method.id ? method.borderActive : method.borderHover}`}
                                >
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${method.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={method.iconPath} />
                                        </svg>
                                    </div>
                                    <h3 className={`text-lg font-bold mb-2 ${themeClasses.textPrimary}`}>
                                        {method.title}
                                    </h3>
                                    <p className={`text-sm ${themeClasses.textSecondary}`}>
                                        {method.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleStart}
                            disabled={!creationMethod || loading}
                            className="px-8 py-3 rounded-xl text-base font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Đang tạo...' : 'Tiếp tục'}
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
