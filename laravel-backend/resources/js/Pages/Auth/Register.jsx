import { useState } from 'react';
import { useForm, Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../Layouts/AuthLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Register() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { flash } = usePage().props;
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        terms: false,
    });

    function handleSubmit(e) {
        e.preventDefault();
        post('/register', { onFinish: () => reset('password', 'password_confirmation') });
    }

    return (
        <AuthLayout>
            <div className={`p-8 rounded-2xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className={`text-2xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {t('auth.register.title', { defaultValue: 'Create account' })}
                    </h1>
                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {t('auth.register.subtitle', { defaultValue: 'Start managing your devices today' })}
                    </p>
                </div>

                {/* Flash Messages */}
                {flash?.error && (
                    <div className={`mb-6 p-3 rounded-lg text-sm ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
                        {flash.error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('auth.register.name', { defaultValue: 'Name' })}
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            className={`w-full px-4 py-2.5 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                } border focus:outline-none ${errors.name ? 'border-red-500' : ''}`}
                            placeholder="John Doe"
                            autoComplete="name"
                            autoFocus
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('auth.register.email', { defaultValue: 'Email' })}
                        </label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            className={`w-full px-4 py-2.5 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                } border focus:outline-none ${errors.email ? 'border-red-500' : ''}`}
                            placeholder="you@example.com"
                            autoComplete="email"
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('auth.register.password', { defaultValue: 'Password' })}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                className={`w-full px-4 py-2.5 pr-10 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                    } border focus:outline-none ${errors.password ? 'border-red-500' : ''}`}
                                placeholder="••••••••"
                                autoComplete="new-password"
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
                        <p className={`mt-1 text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>At least 8 characters</p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('auth.register.password_confirmation', { defaultValue: 'Confirm Password' })}
                        </label>
                        <input
                            type="password"
                            value={data.password_confirmation}
                            onChange={e => setData('password_confirmation', e.target.value)}
                            className={`w-full px-4 py-2.5 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                } border focus:outline-none ${errors.password_confirmation ? 'border-red-500' : ''}`}
                            placeholder="••••••••"
                            autoComplete="new-password"
                        />
                        {errors.password_confirmation && <p className="mt-1 text-xs text-red-500">{errors.password_confirmation}</p>}
                    </div>

                    {/* Terms */}
                    <div>
                        <label className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                checked={data.terms}
                                onChange={e => setData('terms', e.target.checked)}
                                className="mt-1 w-4 h-4 rounded"
                            />
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                I agree to the{' '}
                                <a href="/terms" className={isDark ? 'text-white hover:underline' : 'text-gray-900 hover:underline'}>Terms</a>
                                {' '}and{' '}
                                <a href="/privacy" className={isDark ? 'text-white hover:underline' : 'text-gray-900 hover:underline'}>Privacy Policy</a>
                            </span>
                        </label>
                        {errors.terms && <p className="mt-1 text-xs text-red-500">{errors.terms}</p>}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={processing}
                        className={`w-full py-2.5 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                            } disabled:opacity-50`}
                    >
                        {processing ? 'Creating account...' : t('auth.register.submit', { defaultValue: 'Create Account' })}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className={`w-full border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`} />
                    </div>
                    <div className="relative flex justify-center">
                        <span className={`px-3 text-xs ${isDark ? 'bg-[#1a1a1a] text-gray-500' : 'bg-white text-gray-400'}`}>or</span>
                    </div>
                </div>

                {/* Social */}
                <div className="grid grid-cols-2 gap-3">
                    <button type="button" className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${isDark ? 'bg-[#222] text-gray-300 hover:bg-[#2a2a2a]' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>
                    <button type="button" className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${isDark ? 'bg-[#222] text-gray-300 hover:bg-[#2a2a2a]' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        GitHub
                    </button>
                </div>

                {/* Sign In */}
                <p className={`mt-6 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {t('auth.register.have_account', { defaultValue: 'Already have an account?' })}{' '}
                    <Link href="/login" className={isDark ? 'text-white hover:underline' : 'text-gray-900 hover:underline'}>
                        {t('auth.register.login', { defaultValue: 'Sign in' })}
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
