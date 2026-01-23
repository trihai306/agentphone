import { useState } from 'react';
import { useForm, usePage, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Edit({ user, stats = {}, storage = {}, activePackages = [] }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { flash } = usePage().props;
    const isDark = theme === 'dark';
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const profileForm = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
        timezone: user.timezone || 'Asia/Ho_Chi_Minh',
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    function handleProfileSubmit(e) {
        e.preventDefault();
        profileForm.put('/profile');
    }

    function handlePasswordSubmit(e) {
        e.preventDefault();
        passwordForm.put('/profile/password', {
            onSuccess: () => passwordForm.reset(),
        });
    }

    // Format bytes to human readable
    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Format number with comma
    const formatNumber = (num) => {
        return new Intl.NumberFormat('vi-VN').format(num || 0);
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    // Calculate storage percentage
    const storagePercent = storage.max > 0 ? Math.min((storage.used / storage.max) * 100, 100) : 0;

    // Stats data for grid
    const statsData = [
        { label: t('navigation.devices'), value: stats.devices || 0, icon: '📱', color: 'blue', href: '/devices' },
        { label: t('navigation.workflows'), value: stats.workflows || 0, icon: '⚡', color: 'purple', href: '/flows' },
        { label: t('navigation.campaigns'), value: stats.campaigns || 0, icon: '🚀', color: 'green', href: '/campaigns' },
        { label: t('navigation.jobs'), value: stats.jobs || 0, icon: '📋', color: 'orange', href: '/jobs' },
        { label: t('profile.media_files', { defaultValue: 'Media Files' }), value: stats.mediaFiles || 0, icon: '🖼️', color: 'pink', href: '/media' },
        { label: t('profile.data_collections', { defaultValue: 'Data Collections' }), value: stats.dataCollections || 0, icon: '📊', color: 'cyan', href: '/data-collections' },
    ];

    const getColorClasses = (color) => {
        const colors = {
            blue: isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200',
            purple: isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-600 border-purple-200',
            green: isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200',
            orange: isDark ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-600 border-orange-200',
            pink: isDark ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-pink-50 text-pink-600 border-pink-200',
            cyan: isDark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-600 border-cyan-200',
        };
        return colors[color] || colors.blue;
    };

    return (
        <AppLayout title={t('profile.title')}>
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1200px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {t('profile.title')}
                        </h1>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {t('profile.manage_description', { defaultValue: 'Quản lý tài khoản và thông tin cá nhân của bạn' })}
                        </p>
                    </div>

                    {/* Success Message */}
                    {flash?.success && (
                        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${isDark ? 'bg-emerald-900/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">{flash.success}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Profile Info & Stats */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Profile Card */}
                            <div className={`p-6 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                <div className="text-center">
                                    {/* Avatar */}
                                    <div className="relative inline-block mb-4">
                                        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-semibold ${isDark ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' : 'bg-gradient-to-br from-blue-400 to-purple-500 text-white'}`}>
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                user.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
                                    </div>

                                    <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {user.name}
                                    </h2>
                                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {user.email}
                                    </p>
                                    {user.phone && (
                                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                            📞 {user.phone}
                                        </p>
                                    )}
                                    {user.location && (
                                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                            📍 {user.location}
                                        </p>
                                    )}
                                </div>

                                <div className={`mt-6 pt-6 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div>
                                            <p className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                                {formatNumber(stats.aiCredits)}
                                            </p>
                                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {t('profile.ai_credits', { defaultValue: 'AI Credits' })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                {formatNumber(stats.walletBalance)}
                                            </p>
                                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {t('profile.wallet_balance', { defaultValue: 'Số dư ví' })} (₫)
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                                    <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                        {t('profile.member_since', { defaultValue: 'Thành viên từ' })}
                                    </p>
                                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {new Date(user.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            {/* Storage Card */}
                            <div className={`p-6 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                <h3 className={`text-sm font-medium uppercase tracking-wider mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {t('profile.storage', { defaultValue: 'Dung lượng lưu trữ' })}
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {storage.planName}
                                        </span>
                                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {formatBytes(storage.used)} / {formatBytes(storage.max)}
                                        </span>
                                    </div>
                                    <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${storagePercent > 90 ? 'bg-red-500' : storagePercent > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                            style={{ width: `${storagePercent}%` }}
                                        ></div>
                                    </div>
                                    <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                        {storagePercent.toFixed(1)}% {t('profile.used', { defaultValue: 'đã sử dụng' })}
                                    </p>
                                </div>
                            </div>

                            {/* Active Packages */}
                            {activePackages.length > 0 && (
                                <div className={`p-6 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                    <h3 className={`text-sm font-medium uppercase tracking-wider mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {t('profile.active_packages', { defaultValue: 'Gói dịch vụ đang dùng' })}
                                    </h3>
                                    <div className="space-y-3">
                                        {activePackages.map((pkg) => (
                                            <div key={pkg.id} className={`p-3 rounded-lg ${isDark ? 'bg-[#222]' : 'bg-gray-50'}`}>
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {pkg.name}
                                                    </span>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {t('profile.active', { defaultValue: 'Hoạt động' })}
                                                    </span>
                                                </div>
                                                {pkg.expires_at && (
                                                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {t('profile.expires', { defaultValue: 'Hết hạn' })}: {pkg.expires_at}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Stats & Forms */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Stats Grid */}
                            <div className={`p-6 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                <h3 className={`text-sm font-medium uppercase tracking-wider mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {t('profile.activity_overview', { defaultValue: 'Tổng quan hoạt động' })}
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {statsData.map((stat, index) => (
                                        <Link
                                            key={index}
                                            href={stat.href}
                                            className={`p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${getColorClasses(stat.color)}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{stat.icon}</span>
                                                <div>
                                                    <p className="text-2xl font-bold">{formatNumber(stat.value)}</p>
                                                    <p className={`text-xs ${isDark ? 'opacity-70' : 'opacity-80'}`}>{stat.label}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Profile Form */}
                            <div className={`p-6 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                <h3 className={`text-sm font-medium uppercase tracking-wider mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {t('profile.personal_info')}
                                </h3>
                                <form onSubmit={handleProfileSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {t('profile.name', { defaultValue: 'Họ tên' })}
                                            </label>
                                            <input
                                                type="text"
                                                value={profileForm.data.name}
                                                onChange={e => profileForm.setData('name', e.target.value)}
                                                className={`w-full px-4 py-2.5 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
                                                    } border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${profileForm.errors.name ? 'border-red-500' : ''}`}
                                            />
                                            {profileForm.errors.name && (
                                                <p className="mt-1 text-sm text-red-500">{profileForm.errors.name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {t('profile.email', { defaultValue: 'Email' })}
                                            </label>
                                            <input
                                                type="email"
                                                value={profileForm.data.email}
                                                onChange={e => profileForm.setData('email', e.target.value)}
                                                className={`w-full px-4 py-2.5 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
                                                    } border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${profileForm.errors.email ? 'border-red-500' : ''}`}
                                            />
                                            {profileForm.errors.email && (
                                                <p className="mt-1 text-sm text-red-500">{profileForm.errors.email}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {t('profile.phone', { defaultValue: 'Số điện thoại' })}
                                            </label>
                                            <input
                                                type="tel"
                                                value={profileForm.data.phone}
                                                onChange={e => profileForm.setData('phone', e.target.value)}
                                                placeholder="+84..."
                                                className={`w-full px-4 py-2.5 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                                    } border focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                                            />
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {t('profile.location', { defaultValue: 'Địa điểm' })}
                                            </label>
                                            <input
                                                type="text"
                                                value={profileForm.data.location}
                                                onChange={e => profileForm.setData('location', e.target.value)}
                                                placeholder="Hà Nội, Việt Nam"
                                                className={`w-full px-4 py-2.5 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                                    } border focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {t('profile.bio', { defaultValue: 'Giới thiệu bản thân' })}
                                        </label>
                                        <textarea
                                            value={profileForm.data.bio}
                                            onChange={e => profileForm.setData('bio', e.target.value)}
                                            rows={3}
                                            placeholder={t('profile.bio_placeholder', { defaultValue: 'Viết vài dòng về bản thân...' })}
                                            className={`w-full px-4 py-2.5 rounded-lg text-sm resize-none ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                                } border focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={profileForm.processing}
                                            className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                                } disabled:opacity-50`}
                                        >
                                            {profileForm.processing ? t('common.loading') : t('profile.save_changes', { defaultValue: 'Lưu thay đổi' })}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Password Form */}
                            <div className={`p-6 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                <h3 className={`text-sm font-medium uppercase tracking-wider mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {t('profile.security')}
                                </h3>
                                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {t('profile.current_password')}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showCurrentPassword ? 'text' : 'password'}
                                                    value={passwordForm.data.current_password}
                                                    onChange={e => passwordForm.setData('current_password', e.target.value)}
                                                    className={`w-full px-4 py-2.5 pr-10 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
                                                        } border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${passwordForm.errors.current_password ? 'border-red-500' : ''}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        {showCurrentPassword ? (
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                        ) : (
                                                            <>
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </>
                                                        )}
                                                    </svg>
                                                </button>
                                            </div>
                                            {passwordForm.errors.current_password && (
                                                <p className="mt-1 text-sm text-red-500">{passwordForm.errors.current_password}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {t('profile.new_password')}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPassword ? 'text' : 'password'}
                                                    value={passwordForm.data.password}
                                                    onChange={e => passwordForm.setData('password', e.target.value)}
                                                    className={`w-full px-4 py-2.5 pr-10 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
                                                        } border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${passwordForm.errors.password ? 'border-red-500' : ''}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        {showNewPassword ? (
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                        ) : (
                                                            <>
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </>
                                                        )}
                                                    </svg>
                                                </button>
                                            </div>
                                            {passwordForm.errors.password && (
                                                <p className="mt-1 text-sm text-red-500">{passwordForm.errors.password}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {t('profile.confirm_password')}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPasswordConfirmation ? 'text' : 'password'}
                                                    value={passwordForm.data.password_confirmation}
                                                    onChange={e => passwordForm.setData('password_confirmation', e.target.value)}
                                                    className={`w-full px-4 py-2.5 pr-10 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
                                                        } border focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        {showPasswordConfirmation ? (
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                        ) : (
                                                            <>
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </>
                                                        )}
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={passwordForm.processing}
                                            className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                                } disabled:opacity-50`}
                                        >
                                            {passwordForm.processing ? t('common.loading') : t('profile.update_password', { defaultValue: 'Cập nhật mật khẩu' })}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
