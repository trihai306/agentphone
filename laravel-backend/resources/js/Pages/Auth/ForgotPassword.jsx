import { useState } from 'react';
import { useForm, Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../Layouts/AuthLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function ForgotPassword() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { flash } = usePage().props;
    const [emailSent, setEmailSent] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post('/forgot-password', { onSuccess: () => setEmailSent(true) });
    }

    return (
        <AuthLayout>
            <div className={`p-8 rounded-2xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                {!emailSent ? (
                    <>
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${isDark ? 'bg-white' : 'bg-gray-900'}`}>
                                <svg className={`w-6 h-6 ${isDark ? 'text-black' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                            <h1 className={`text-2xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('auth.forgot_password.title', { defaultValue: 'Forgot password?' })}
                            </h1>
                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {t('auth.forgot_password.description', { defaultValue: "Enter your email and we'll send you a reset link" })}
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
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {t('auth.forgot_password.email', { defaultValue: 'Email' })}
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                        } border focus:outline-none ${errors.email ? 'border-red-500' : ''}`}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    autoFocus
                                />
                                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className={`w-full py-2.5 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                    } disabled:opacity-50`}
                            >
                                {processing ? 'Sending...' : t('auth.forgot_password.submit', { defaultValue: 'Send Reset Link' })}
                            </button>
                        </form>

                        {/* Back */}
                        <div className="mt-6 text-center">
                            <Link href="/login" className={`text-sm ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                                ← Back to login
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Success */}
                        <div className="text-center">
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}>
                                <svg className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Check your email
                            </h2>
                            <p className={`text-sm mb-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                We've sent a reset link to <strong className={isDark ? 'text-white' : 'text-gray-900'}>{data.email}</strong>
                            </p>

                            <div className={`p-4 rounded-lg mb-6 text-left ${isDark ? 'bg-[#222]' : 'bg-gray-50'}`}>
                                <p className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Didn't receive the email?</p>
                                <ul className={`text-xs space-y-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <li>• Check your spam folder</li>
                                    <li>• Make sure you entered the correct email</li>
                                </ul>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setEmailSent(false)}
                                    className={`w-full py-2.5 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                        }`}
                                >
                                    Resend Email
                                </button>
                                <Link href="/login" className={`block text-sm ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                                    Back to login
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AuthLayout>
    );
}
