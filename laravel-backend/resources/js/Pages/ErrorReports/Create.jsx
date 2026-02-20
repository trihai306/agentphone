import { useForm, usePage, router, Link, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/Components/UI';
import { errorReportApi } from '@/services/api';

const typeOptions = [
    { value: 'bug', label: 'Bug', icon: '🐛' },
    { value: 'ui_issue', label: 'UI Issue', icon: '🎨' },
    { value: 'performance', label: 'Performance', icon: '⚡' },
    { value: 'feature_request', label: 'Feature Request', icon: '💡' },
    { value: 'other', label: 'Other', icon: '❓' },
];

const severityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
];

export default function Create() {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const isDark = theme === 'dark';
    const fileInputRef = useRef(null);
    const [screenshots, setScreenshots] = useState([]);
    const [uploading, setUploading] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        error_type: 'bug',
        severity: 'medium',
        page_url: typeof window !== 'undefined' ? window.location.href : '',
        device_info: null,
        screenshots: [],
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setData('device_info', {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height,
            });
        }
    }, []);

    const handleFileSelect = async (e) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        const newScreenshots = [...screenshots];

        for (const file of e.target.files) {
            if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) continue;

            const formData = new FormData();
            formData.append('screenshot', file);

            try {
                const result = await errorReportApi.uploadScreenshot(formData);

                if (result.success) {
                    newScreenshots.push({ path: result.data.path, url: result.data.url, name: file.name });
                }
            } catch (error) {
                console.error('Upload failed:', error);
            }
        }

        setScreenshots(newScreenshots);
        setData('screenshots', newScreenshots.map(s => s.path));
        setUploading(false);
    };

    const removeScreenshot = (index) => {
        const newScreenshots = screenshots.filter((_, i) => i !== index);
        setScreenshots(newScreenshots);
        setData('screenshots', newScreenshots.map(s => s.path));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/error-reports');
    };

    return (
        <AppLayout title={t('error_reports.new_report_title')}>
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[700px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link
                            href="/error-reports"
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'}`}
                        >
                            <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('error_reports.new_report_title')}
                            </h1>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {t('error_reports.new_report_description')}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Type & Severity */}
                        <div className={`p-6 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {t('error_reports.type')}
                                    </label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {typeOptions.map((type) => (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => setData('error_type', type.value)}
                                                className={`p-2 rounded-lg text-center transition-all ${data.error_type === type.value
                                                    ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                                                    : isDark ? 'bg-[#222] hover:bg-[#2a2a2a]' : 'bg-gray-100 hover:bg-gray-200'
                                                    }`}
                                                title={type.label}
                                            >
                                                <span className="text-lg">{type.icon}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {t('error_reports.severity')}
                                    </label>
                                    <select
                                        value={data.severity}
                                        onChange={(e) => setData('severity', e.target.value)}
                                        className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
                                            } border focus:outline-none`}
                                    >
                                        {severityOptions.map((s) => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className={`p-6 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {t('error_reports.title_field')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        className={`w-full px-4 py-2.5 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
                                            } border focus:outline-none ${errors.title ? 'border-red-500' : ''}`}
                                        placeholder={t('error_reports.title_placeholder')}
                                    />
                                    {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {t('error_reports.description_field')} <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={5}
                                        className={`w-full px-4 py-2.5 rounded-lg text-sm resize-none ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
                                            } border focus:outline-none ${errors.description ? 'border-red-500' : ''}`}
                                        placeholder={t('error_reports.description_placeholder')}
                                    />
                                    {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {t('error_reports.page_url')}
                                    </label>
                                    <input
                                        type="text"
                                        value={data.page_url}
                                        onChange={(e) => setData('page_url', e.target.value)}
                                        className={`w-full px-4 py-2.5 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
                                            } border focus:outline-none`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Screenshots */}
                        <div className={`p-6 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {t('error_reports.screenshots')}
                            </label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${isDark ? 'border-[#2a2a2a] hover:border-gray-500' : 'border-gray-200 hover:border-gray-400'
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                {uploading ? (
                                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('error_reports.uploading')}</p>
                                ) : (
                                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                                        {t('error_reports.click_upload')}
                                    </p>
                                )}
                            </div>

                            {screenshots.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 mt-4">
                                    {screenshots.map((s, i) => (
                                        <div key={i} className="relative group">
                                            <img src={s.url} alt="" className="w-full h-20 object-cover rounded-lg" />
                                            <button
                                                type="button"
                                                onClick={() => removeScreenshot(i)}
                                                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            <Link
                                href="/error-reports"
                                className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                {t('error_reports.cancel')}
                            </Link>
                            <Button
                                type="submit"
                                disabled={processing}
                                className={`!px-6 !py-2 ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                            >
                                {processing ? t('error_reports.submitting') : t('error_reports.submit')}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
