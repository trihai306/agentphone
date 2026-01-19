import { useState, useEffect } from 'react';
import { useForm, usePage, Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/Contexts/ThemeContext';

function FloatingParticles({ isDark }) {
    return (<div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (<div key={i} className={`absolute rounded-full ${isDark ? 'bg-white/5' : 'bg-black/5'}`} style={{ width: Math.random() * 70 + 30, height: Math.random() * 70 + 30, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animation: `float ${10 + Math.random() * 15}s ease-in-out infinite`, animationDelay: `${-Math.random() * 15}s` }} />))}
        <style>{`@keyframes float { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(15px, -15px); } }`}</style>
    </div>);
}

function GradientOrbs({ isDark }) {
    return (<>
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-gradient-to-br from-cyan-600/30 to-transparent' : 'bg-gradient-to-br from-cyan-400/40 to-transparent'}`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-gradient-to-tr from-blue-600/20 to-transparent' : 'bg-gradient-to-tr from-blue-400/30 to-transparent'}`} />
    </>);
}

export default function ResetPassword({ token, email }) {
    const { t } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const { flash } = usePage().props;
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const { data, setData, post, processing, errors } = useForm({ token, email, password: '', password_confirmation: '' });
    function handleSubmit(e) { e.preventDefault(); post('/reset-password'); }

    const inputClass = (error) => `w-full pl-12 pr-4 py-3.5 rounded-xl text-sm transition-all duration-200 ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:bg-white/10 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'} border outline-none ${error ? 'border-red-500' : ''}`;
    const iconClass = isDark ? 'text-gray-500' : 'text-gray-400';

    return (<>
        <Head title="Đặt Lại Mật Khẩu - CLICKAI" />
        <div className={`min-h-screen relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#0a0a0f] via-[#0d0d15] to-[#0a0a12]' : 'bg-gradient-to-br from-slate-50 via-white to-cyan-50/30'}`}>
            <FloatingParticles isDark={isDark} />
            <GradientOrbs isDark={isDark} />
            <div className={`absolute inset-0 ${isDark ? 'opacity-[0.03]' : 'opacity-[0.02]'}`} style={{ backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />

            {/* Header */}
            <header className="relative z-10 px-6 py-5">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${isDark ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25' : 'bg-gradient-to-br from-cyan-600 to-blue-700 shadow-lg shadow-cyan-600/25'}`}>
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>CLICKAI</span>
                    </Link>
                    <button onClick={toggleTheme} className={`p-2.5 rounded-xl transition-all duration-300 ${isDark ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10' : 'bg-black/5 hover:bg-black/10 text-gray-500 hover:text-gray-900 border border-black/10'}`}>
                        {isDark ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                    </button>
                </div>
            </header>

            {/* Main */}
            <main className="relative z-10 flex items-center justify-center px-6 py-12 min-h-[calc(100vh-140px)]">
                <div className={`w-full max-w-[420px] transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    {/* Card */}
                    <div className={`relative rounded-2xl p-8 backdrop-blur-xl ${isDark ? 'bg-white/[0.03] border border-white/[0.08] shadow-2xl shadow-black/20' : 'bg-white/70 border border-white/50 shadow-2xl shadow-cyan-500/5'}`}>
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 pointer-events-none" />

                        {/* Header */}
                        <div className="relative text-center mb-8">
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 ${isDark ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30' : 'bg-gradient-to-br from-cyan-600 to-blue-700 shadow-lg shadow-cyan-600/30'}`}>
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                            </div>
                            <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Đặt lại mật khẩu</h1>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Nhập mật khẩu mới cho tài khoản của bạn</p>
                        </div>

                        {flash?.error && <div className={`relative mb-6 p-4 rounded-xl text-sm flex items-center gap-3 ${isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-200'}`}><svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{flash.error}</div>}

                        <form onSubmit={handleSubmit} className="relative space-y-5">
                            {/* Email readonly */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                                <div className="relative">
                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${iconClass}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
                                    <input type="email" value={data.email} readOnly className={`w-full pl-12 pr-4 py-3.5 rounded-xl text-sm cursor-not-allowed ${isDark ? 'bg-white/5 border-white/10 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-500'} border`} />
                                </div>
                            </div>
                            {/* Password */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Mật khẩu mới</label>
                                <div className="relative">
                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${iconClass}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
                                    <input type={showPassword ? 'text' : 'password'} value={data.password} onChange={e => setData('password', e.target.value)} className={`${inputClass(errors.password)} pr-12`} placeholder="••••••••" autoFocus />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={showPassword ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} /></svg>
                                    </button>
                                </div>
                                {errors.password && <p className="mt-2 text-xs text-red-500">{errors.password}</p>}
                            </div>
                            {/* Confirm */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Xác nhận mật khẩu</label>
                                <div className="relative">
                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${iconClass}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
                                    <input type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} className={inputClass(errors.password_confirmation)} placeholder="••••••••" />
                                </div>
                                {errors.password_confirmation && <p className="mt-2 text-xs text-red-500">{errors.password_confirmation}</p>}
                            </div>
                            <button type="submit" disabled={processing} className={`relative w-full py-3.5 text-sm font-semibold rounded-xl transition-all duration-300 overflow-hidden group bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}>
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                <span className="relative flex items-center justify-center gap-2">
                                    {processing ? <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Đang xử lý...</> : <>Đặt Lại Mật Khẩu<svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></>}
                                </span>
                            </button>
                        </form>
                    </div>
                </div>
            </main>
            <footer className="relative z-10 pb-6 text-center"><p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>© {new Date().getFullYear()} CLICKAI.</p></footer>
        </div>
    </>);
}
