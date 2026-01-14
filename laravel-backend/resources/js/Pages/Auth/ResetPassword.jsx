import { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../Layouts/AuthLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function ResetPassword({ token, email }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { flash } = usePage().props;
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post('/reset-password');
    }

    return (
        <AuthLayout>
            <div className={`p-8 rounded-2xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                {/* Header */}
                <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${isDark ? 'bg-white' : 'bg-gray-900'}`}>
                        <svg className={`w-6 h-6 ${isDark ? 'text-black' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className={`text-2xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {t('auth.reset_password.title', { defaultValue: 'Reset Password' })}
                    </h1>
                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {t('auth.reset_password.description', { defaultValue: 'Enter your new password' })}
                    </p>
                </div>

                {/* Flash Messages */}
                {flash?.error && (
                    <div className={`mb-6 p-3 rounded-lg text-sm ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
                        {flash.error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email (readonly) */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={data.email}
                            readOnly
                            className={`w-full px-4 py-2.5 rounded-lg text-sm cursor-not-allowed ${isDark ? 'bg-[#222] border-[#2a2a2a] text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-500'
                                } border`}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('auth.reset_password.password', { defaultValue: 'New Password' })}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                className={`w-full px-4 py-2.5 pr-10 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                    } border focus:outline-none ${errors.password ? 'border-red-500' : ''}`}
                                placeholder="••••••••"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {showPassword ? (
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
                        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('auth.reset_password.password_confirmation', { defaultValue: 'Confirm Password' })}
                        </label>
                        <input
                            type="password"
                            value={data.password_confirmation}
                            onChange={e => setData('password_confirmation', e.target.value)}
                            className={`w-full px-4 py-2.5 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                } border focus:outline-none ${errors.password_confirmation ? 'border-red-500' : ''}`}
                            placeholder="••••••••"
                        />
                        {errors.password_confirmation && <p className="mt-1 text-xs text-red-500">{errors.password_confirmation}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className={`w-full py-2.5 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                            } disabled:opacity-50`}
                    >
                        {processing ? 'Resetting...' : t('auth.reset_password.submit', { defaultValue: 'Reset Password' })}
                    </button>
                </form>
            </div>
        </AuthLayout>
    );
}
