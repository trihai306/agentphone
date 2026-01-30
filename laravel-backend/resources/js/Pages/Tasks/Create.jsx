import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';

// SVG icon paths (matching sidebar style)
const ICONS = {
    campaign: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
    flow: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z",
    device: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
    data: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",
    money: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    check: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
};

export default function Create({ campaigns = [] }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [step, setStep] = useState(1);
    const totalSteps = 2; // Simplified: 1. Select Campaign, 2. Pricing & Details

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        campaign_id: '',
        tags: [],
        reward_amount: 5000,
        price_per_device: 1000,
        required_devices: 1,
        deadline_at: '',
    });

    const [tagInput, setTagInput] = useState('');

    const formatVND = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

    const selectedCampaign = campaigns.find(c => c.id === parseInt(data.campaign_id));
    const totalCost = data.price_per_device * data.required_devices;

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/tasks', {
            preserveScroll: true,
        });
    };

    const addTag = () => {
        if (tagInput.trim() && !data.tags.includes(tagInput.trim())) {
            setData('tags', [...data.tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (tag) => {
        setData('tags', data.tags.filter(t => t !== tag));
    };

    const nextStep = () => setStep(Math.min(step + 1, totalSteps));
    const prevStep = () => setStep(Math.max(step - 1, 1));

    const canProceed = {
        1: data.campaign_id,
        2: data.title && data.price_per_device >= 100 && data.required_devices >= 1,
    };

    // Icon component matching sidebar style
    const Icon = ({ path, className = "w-5 h-5" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={path} />
        </svg>
    );

    return (
        <AppLayout title={t('tasks.create', 'Tạo nhiệm vụ')}>
            <Head title={t('tasks.create', 'Tạo nhiệm vụ')} />

            <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                <div className="max-w-4xl mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <Link href="/tasks" className={`inline-flex items-center gap-2 text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors mb-4`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            {t('common.back', 'Quay lại')}
                        </Link>
                        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {t('tasks.create', 'Tạo nhiệm vụ')}
                        </h1>
                        <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t('tasks.create_subtitle', 'Thuê người khác chạy campaign của bạn')}
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-4 mb-8">
                        {[
                            { num: 1, label: t('tasks.step_campaign', 'Chọn Campaign') },
                            { num: 2, label: t('tasks.step_pricing', 'Định giá & Chi tiết') },
                        ].map((s) => (
                            <div key={s.num} className="flex items-center gap-3">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all ${step >= s.num
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                                    : isDark ? 'bg-white/5 text-gray-500' : 'bg-gray-200 text-gray-400'
                                    }`}>
                                    {step > s.num ? (
                                        <Icon path={ICONS.check} className="w-5 h-5" />
                                    ) : s.num}
                                </div>
                                <span className={`text-sm font-medium ${step >= s.num ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-600' : 'text-gray-400')}`}>
                                    {s.label}
                                </span>
                                {s.num < totalSteps && (
                                    <div className={`w-12 h-0.5 ${step > s.num ? 'bg-emerald-500' : isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Step 1: Select Campaign */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                                    <h2 className={`text-lg font-semibold mb-4 flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center">
                                            <Icon path={ICONS.campaign} className="w-5 h-5 text-white" />
                                        </div>
                                        {t('tasks.select_campaign', 'Chọn Campaign để chia sẻ')}
                                    </h2>
                                    <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {t('tasks.campaign_info', 'Campaign đã bao gồm workflow và dữ liệu cấu hình. Người nhận nhiệm vụ sẽ chạy campaign này trên thiết bị của họ.')}
                                    </p>

                                    {campaigns.length === 0 ? (
                                        <div className={`p-8 rounded-xl border-2 border-dashed text-center ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                            <Icon path={ICONS.campaign} className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                                            <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {t('tasks.no_campaigns', 'Chưa có campaign nào')}
                                            </p>
                                            <Link href="/campaigns/create" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium hover:shadow-lg transition-all">
                                                {t('tasks.create_campaign', 'Tạo campaign mới')}
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="grid gap-3">
                                            {campaigns.map((campaign) => (
                                                <button
                                                    key={campaign.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setData('campaign_id', campaign.id);
                                                        // Auto-fill title from campaign name
                                                        if (!data.title) {
                                                            setData('title', `Chạy ${campaign.name}`);
                                                        }
                                                    }}
                                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${data.campaign_id === campaign.id
                                                            ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30'
                                                            : isDark ? 'border-white/10 hover:border-white/20 hover:bg-white/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {/* Campaign Icon */}
                                                    <div
                                                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                                        style={{ backgroundColor: (campaign.color || '#8b5cf6') + '20' }}
                                                    >
                                                        <Icon path={ICONS.campaign} className="w-6 h-6" style={{ color: campaign.color || '#8b5cf6' }} />
                                                    </div>

                                                    {/* Campaign Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                            {campaign.name}
                                                        </p>
                                                        <p className={`text-sm truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                                            {campaign.description || t('common.no_description', 'Không có mô tả')}
                                                        </p>
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <span className={`inline-flex items-center gap-1.5 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                <Icon path={ICONS.flow} className="w-3.5 h-3.5" />
                                                                {campaign.workflows_count || 0} workflow
                                                            </span>
                                                            <span className={`inline-flex items-center gap-1.5 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                <Icon path={ICONS.device} className="w-3.5 h-3.5" />
                                                                {campaign.devices_count || 0} thiết bị
                                                            </span>
                                                            {campaign.data_collection && (
                                                                <span className={`inline-flex items-center gap-1.5 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                    <Icon path={ICONS.data} className="w-3.5 h-3.5" />
                                                                    {campaign.data_collection.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Status badge */}
                                                    <div className={`px-2.5 py-1 rounded-lg text-xs font-medium ${campaign.status === 'active'
                                                            ? 'bg-emerald-500/20 text-emerald-400'
                                                            : isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {campaign.status === 'active' ? 'Active' : campaign.status}
                                                    </div>

                                                    {/* Selected check */}
                                                    {data.campaign_id === campaign.id && (
                                                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {errors.campaign_id && <p className="text-red-500 text-sm mt-2">{errors.campaign_id}</p>}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Pricing & Details */}
                        {step === 2 && (
                            <div className="space-y-6">
                                {/* Pricing Card */}
                                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gradient-to-br from-emerald-900/20 to-teal-900/10 border-emerald-500/30' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'}`}>
                                    <h2 className={`text-lg font-semibold mb-4 flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                                            <Icon path={ICONS.money} className="w-5 h-5 text-white" />
                                        </div>
                                        {t('tasks.pricing', 'Định giá nhiệm vụ')}
                                    </h2>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Price per device */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {t('tasks.price_per_device', 'Đơn giá / thiết bị')} <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="100"
                                                    step="100"
                                                    value={data.price_per_device}
                                                    onChange={(e) => setData('price_per_device', parseInt(e.target.value) || 0)}
                                                    className={`w-full px-4 py-3 pr-16 rounded-xl border ${isDark
                                                        ? 'bg-black/30 border-white/20 text-white'
                                                        : 'bg-white border-gray-200 text-gray-900'
                                                        } focus:outline-none focus:ring-2 focus:ring-emerald-500/50`}
                                                    placeholder="1000"
                                                />
                                                <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    VNĐ
                                                </span>
                                            </div>
                                            {errors.price_per_device && <p className="text-red-500 text-sm mt-1">{errors.price_per_device}</p>}
                                        </div>

                                        {/* Required devices */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {t('tasks.required_devices', 'Số thiết bị cần')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={data.required_devices}
                                                onChange={(e) => setData('required_devices', parseInt(e.target.value) || 1)}
                                                className={`w-full px-4 py-3 rounded-xl border ${isDark
                                                    ? 'bg-black/30 border-white/20 text-white'
                                                    : 'bg-white border-gray-200 text-gray-900'
                                                    } focus:outline-none focus:ring-2 focus:ring-emerald-500/50`}
                                                placeholder="1"
                                            />
                                            {errors.required_devices && <p className="text-red-500 text-sm mt-1">{errors.required_devices}</p>}
                                        </div>
                                    </div>

                                    {/* Total Cost */}
                                    <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-black/30 border border-white/10' : 'bg-white border border-gray-200'}`}>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {t('tasks.total_cost', 'Tổng chi phí')}:
                                            </span>
                                            <span className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                {formatVND(totalCost)} <span className="text-sm font-normal">VNĐ</span>
                                            </span>
                                        </div>
                                        <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            = {formatVND(data.price_per_device)} × {data.required_devices} thiết bị
                                        </p>
                                    </div>
                                    {errors.reward_amount && <p className="text-red-500 text-sm mt-2">{errors.reward_amount}</p>}
                                </div>

                                {/* Task Details */}
                                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                                    <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {t('tasks.details', 'Chi tiết nhiệm vụ')}
                                    </h2>

                                    <div className="space-y-4">
                                        {/* Title */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {t('tasks.title', 'Tiêu đề')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.title}
                                                onChange={(e) => setData('title', e.target.value)}
                                                className={`w-full px-4 py-3 rounded-xl border ${isDark
                                                    ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                                                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                                                    } focus:outline-none focus:ring-2 focus:ring-emerald-500/50`}
                                                placeholder={t('tasks.title_placeholder', 'VD: Chạy campaign TikTok...')}
                                            />
                                            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {t('tasks.description', 'Mô tả')}
                                            </label>
                                            <textarea
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                rows={3}
                                                className={`w-full px-4 py-3 rounded-xl border resize-none ${isDark
                                                    ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                                                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                                                    } focus:outline-none focus:ring-2 focus:ring-emerald-500/50`}
                                                placeholder={t('tasks.description_placeholder', 'Mô tả yêu cầu cho người nhận nhiệm vụ...')}
                                            />
                                        </div>

                                        {/* Deadline */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {t('tasks.deadline', 'Hạn chót')}
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={data.deadline_at}
                                                onChange={(e) => setData('deadline_at', e.target.value)}
                                                className={`w-full px-4 py-3 rounded-xl border ${isDark
                                                    ? 'bg-white/5 border-white/10 text-white'
                                                    : 'bg-gray-50 border-gray-200 text-gray-900'
                                                    } focus:outline-none focus:ring-2 focus:ring-emerald-500/50`}
                                            />
                                        </div>

                                        {/* Tags */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {t('tasks.tags', 'Tags')}
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={tagInput}
                                                    onChange={(e) => setTagInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                                    className={`flex-1 px-4 py-2 rounded-xl border ${isDark
                                                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                                                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                                                        } focus:outline-none focus:ring-2 focus:ring-emerald-500/50`}
                                                    placeholder="Nhập tag và Enter"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addTag}
                                                    className={`px-4 py-2 rounded-xl ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            {data.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {data.tags.map((tag, i) => (
                                                        <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                                            {tag}
                                                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Selected Campaign Preview */}
                                {selectedCampaign && (
                                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-violet-500/10 border-violet-500/30' : 'bg-violet-50 border-violet-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                style={{ backgroundColor: (selectedCampaign.color || '#8b5cf6') + '20' }}
                                            >
                                                <Icon path={ICONS.campaign} className="w-5 h-5" style={{ color: selectedCampaign.color || '#8b5cf6' }} />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-medium ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
                                                    {t('tasks.selected_campaign', 'Campaign được chọn')}
                                                </p>
                                                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {selectedCampaign.name}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between mt-8">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className={`px-6 py-3 rounded-xl font-medium transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                                >
                                    {t('common.back', 'Quay lại')}
                                </button>
                            ) : <div />}

                            {step < totalSteps ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={!canProceed[step]}
                                    className={`px-8 py-3 rounded-xl font-semibold transition-all ${canProceed[step]
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50'
                                        : isDark ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {t('common.next', 'Tiếp theo')}
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={processing || !canProceed[step]}
                                    className={`px-8 py-3 rounded-xl font-semibold transition-all ${canProceed[step] && !processing
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50'
                                        : isDark ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {processing ? t('common.creating', 'Đang tạo...') : (
                                        <>
                                            {t('tasks.create_and_pay', 'Tạo & Thanh toán')} {formatVND(totalCost)} VNĐ
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
