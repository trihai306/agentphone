import { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Edit({ user }) {
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

    return (
        <AppLayout title={t('profile.title')}>
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[900px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {t('profile.title')}
                        </h1>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {t('profile.manage_description', { defaultValue: 'Quản lý cài đặt tài khoản' })}
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

                    {/* Account Card */}
                    <div className={`p-6 rounded-xl mb-6 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-semibold ${isDark ? 'bg-[#2a2a2a] text-white' : 'bg-gray-100 text-gray-900'}`}>
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {user.name}
                                </h2>
                                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {user.email}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className={`p-3 rounded-lg ${isDark ? 'bg-[#222]' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('profile.member_since', { defaultValue: 'Thành viên từ' })}</p>
                                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                            <div className={`p-3 rounded-lg ${isDark ? 'bg-[#222]' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('common.status')}</p>
                                <p className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{t('profile.active', { defaultValue: 'Hoạt động' })}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${isDark ? 'bg-[#222]' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('navigation.devices')}</p>
                                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>0</p>
                            </div>
                        </div>
                    </div>

                    {/* Profile Form */}
                    <div className={`p-6 rounded-xl mb-6 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                        <h3 className={`text-sm font-medium uppercase tracking-wider mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t('profile.personal_info')}
                        </h3>
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {t('profile.name', { defaultValue: 'Họ tên' })}
                                </label>
                                <input
                                    type="text"
                                    value={profileForm.data.name}
                                    onChange={e => profileForm.setData('name', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
                                        } border focus:outline-none ${profileForm.errors.name ? 'border-red-500' : ''}`}
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
                                        } border focus:outline-none ${profileForm.errors.email ? 'border-red-500' : ''}`}
                                />
                                {profileForm.errors.email && (
                                    <p className="mt-1 text-sm text-red-500">{profileForm.errors.email}</p>
                                )}
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={profileForm.processing}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
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
                                            } border focus:outline-none ${passwordForm.errors.current_password ? 'border-red-500' : ''}`}
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
                                            } border focus:outline-none ${passwordForm.errors.password ? 'border-red-500' : ''}`}
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
                                            } border focus:outline-none`}
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
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                        } disabled:opacity-50`}
                                >
                                    {passwordForm.processing ? t('common.loading') : t('profile.update_password', { defaultValue: 'Cập nhật mật khẩu' })}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
