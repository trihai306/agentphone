import { useState, useEffect } from 'react';
import { useForm, Link, usePage, Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/Contexts/ThemeContext';

// Reusable components
function FloatingParticles({ isDark }) {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => (
                <div key={i} className={`absolute rounded-full ${isDark ? 'bg-white/5' : 'bg-black/5'}`}
                    style={{
                        width: Math.random() * 80 + 40, height: Math.random() * 80 + 40, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                        animation: `float ${10 + Math.random() * 15}s ease-in-out infinite`, animationDelay: `${-Math.random() * 15}s`
                    }} />
            ))}
            <style>{`@keyframes float { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(20px, -20px); } }`}</style>
        </div>
    );
}

function GradientOrbs({ isDark }) {
    return (<>
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-gradient-to-br from-emerald-600/30 to-transparent' : 'bg-gradient-to-br from-emerald-400/40 to-transparent'}`} />
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-gradient-to-tr from-violet-600/20 to-transparent' : 'bg-gradient-to-tr from-violet-400/30 to-transparent'}`} />
    </>);
}

function FeatureBadge({ icon, text, isDark }) {
    return (<div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isDark ? 'bg-white/5 text-gray-400 border border-white/10' : 'bg-black/5 text-gray-600 border border-black/10'}`}>{icon}<span>{text}</span></div>);
}

export default function Register() {
    const { t } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const { flash } = usePage().props;
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const { data, setData, post, processing, errors, reset } = useForm({ name: '', email: '', password: '', password_confirmation: '', terms: false });
    function handleSubmit(e) { e.preventDefault(); post('/register', { onFinish: () => reset('password', 'password_confirmation') }); }

    const inputClass = (error) => `w-full pl-12 pr-4 py-3.5 rounded-xl text-sm transition-all duration-200 ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:bg-white/10 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'} border outline-none ${error ? 'border-red-500' : ''}`;
    const iconClass = isDark ? 'text-gray-500' : 'text-gray-400';

    return (<>
        <Head title="Đăng Ký - CLICKAI" />
        <div className={`min-h-screen relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#0a0a0f] via-[#0d0d15] to-[#0a0a12]' : 'bg-gradient-to-br from-slate-50 via-white to-emerald-50/30'}`}>
            <FloatingParticles isDark={isDark} />
            <GradientOrbs isDark={isDark} />
            <div className={`absolute inset-0 ${isDark ? 'opacity-[0.03]' : 'opacity-[0.02]'}`} style={{ backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />

            {/* Header */}
            <header className="relative z-10 px-6 py-5">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${isDark ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25' : 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-lg shadow-emerald-600/25'}`}>
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>CLICKAI</span>
                    </Link>
                    <button onClick={toggleTheme} className={`p-2.5 rounded-xl transition-all duration-300 ${isDark ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10' : 'bg-black/5 hover:bg-black/10 text-gray-500 hover:text-gray-900 border border-black/10'}`}>
                        {isDark ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                    </button>
                </div>
            </header>

            {/* Main */}
            <main className="relative z-10 flex items-center justify-center px-6 py-6 min-h-[calc(100vh-140px)]">
                <div className={`w-full max-w-[480px] transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="text-center mb-6">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-4 ${isDark ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-600 border border-emerald-500/20'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            Tạo tài khoản mới
                        </div>
                        <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Bắt đầu hành trình</h1>
                        <p className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Đăng ký miễn phí và khám phá sức mạnh tự động hóa</p>
                    </div>

                    {/* Card */}
                    <div className={`relative rounded-2xl p-8 backdrop-blur-xl ${isDark ? 'bg-white/[0.03] border border-white/[0.08] shadow-2xl shadow-black/20' : 'bg-white/70 border border-white/50 shadow-2xl shadow-emerald-500/5'}`}>
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 pointer-events-none" />

                        {flash?.error && <div className={`relative mb-6 p-4 rounded-xl text-sm flex items-center gap-3 ${isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-200'}`}><svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{flash.error}</div>}

                        <form onSubmit={handleSubmit} className="relative space-y-4">
                            {/* Name */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Họ và tên</label>
                                <div className="relative">
                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${iconClass}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                                    <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} className={inputClass(errors.name)} placeholder="Nguyễn Văn A" autoComplete="name" autoFocus />
                                </div>
                                {errors.name && <p className="mt-2 text-xs text-red-500">{errors.name}</p>}
                            </div>
                            {/* Email */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                                <div className="relative">
                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${iconClass}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
                                    <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className={inputClass(errors.email)} placeholder="you@example.com" autoComplete="email" />
                                </div>
                                {errors.email && <p className="mt-2 text-xs text-red-500">{errors.email}</p>}
                            </div>
                            {/* Password */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Mật khẩu</label>
                                <div className="relative">
                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${iconClass}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
                                    <input type={showPassword ? 'text' : 'password'} value={data.password} onChange={e => setData('password', e.target.value)} className={`${inputClass(errors.password)} pr-12`} placeholder="••••••••" autoComplete="new-password" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={showPassword ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} /></svg>
                                    </button>
                                </div>
                                {errors.password && <p className="mt-2 text-xs text-red-500">{errors.password}</p>}
                                <p className={`mt-1.5 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Tối thiểu 8 ký tự</p>
                            </div>
                            {/* Confirm */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Xác nhận mật khẩu</label>
                                <div className="relative">
                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${iconClass}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
                                    <input type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} className={inputClass(errors.password_confirmation)} placeholder="••••••••" autoComplete="new-password" />
                                </div>
                                {errors.password_confirmation && <p className="mt-2 text-xs text-red-500">{errors.password_confirmation}</p>}
                            </div>
                            {/* Terms */}
                            <div className="pt-2">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" checked={data.terms} onChange={e => setData('terms', e.target.checked)} className={`mt-0.5 w-5 h-5 rounded ${isDark ? 'bg-white/5 border-white/20 text-emerald-500' : 'border-gray-300 text-emerald-600'}`} />
                                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tôi đồng ý với <a href="/terms" className={isDark ? 'text-emerald-400 hover:underline' : 'text-emerald-600 hover:underline'}>Điều khoản</a> và <a href="/privacy" className={isDark ? 'text-emerald-400 hover:underline' : 'text-emerald-600 hover:underline'}>Chính sách bảo mật</a></span>
                                </label>
                                {errors.terms && <p className="mt-2 text-xs text-red-500">{errors.terms}</p>}
                            </div>
                            {/* Submit */}
                            <button type="submit" disabled={processing} className={`relative w-full py-3.5 text-sm font-semibold rounded-xl transition-all duration-300 overflow-hidden group mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}>
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                <span className="relative flex items-center justify-center gap-2">
                                    {processing ? <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Đang tạo...</>
                                        : <>Tạo Tài Khoản<svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>}
                                </span>
                            </button>
                        </form>

                        {/* Divider & Social */}
                        <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className={`w-full border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`} /></div><div className="relative flex justify-center"><span className={`px-4 text-xs font-medium ${isDark ? 'bg-[#0d0d15] text-gray-500' : 'bg-white text-gray-400'}`}>hoặc đăng ký với</span></div></div>
                        <div className="grid grid-cols-2 gap-3">
                            <button type="button" className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium ${isDark ? 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'}`}><svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>Google</button>
                            <button type="button" className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium ${isDark ? 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'}`}><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>GitHub</button>
                        </div>
                    </div>

                    <p className={`mt-8 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Đã có tài khoản? <Link href="/login" className={`font-semibold ${isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}>Đăng nhập</Link></p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <FeatureBadge isDark={isDark} icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>} text="Miễn phí 100%" />
                        <FeatureBadge isDark={isDark} icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>} text="Bảo mật cao" />
                    </div>
                </div>
            </main>
            <footer className="relative z-10 pb-6 text-center"><p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>© {new Date().getFullYear()} CLICKAI.</p></footer>
        </div>
    </>);
}
