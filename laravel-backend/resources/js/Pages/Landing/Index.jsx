import { Link } from '@inertiajs/react';
import { useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import LandingLayout from '@/Layouts/LandingLayout';
import SeoHead, { schemas } from '@/Components/SeoHead';
import AnimatedSection, { StaggerChildren, AnimatedCounter } from '@/Components/Landing/AnimatedSection';
import { useTheme } from '@/Contexts/ThemeContext';

const HeroScene = lazy(() => import('@/Components/Landing/HeroScene'));

export default function Index() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [activeUseCase, setActiveUseCase] = useState(0);
    const [openFaq, setOpenFaq] = useState(null);

    const faqData = [
        { question: t('landing.faq.q1'), answer: t('landing.faq.a1') },
        { question: t('landing.faq.q2'), answer: t('landing.faq.a2') },
        { question: t('landing.faq.q3'), answer: t('landing.faq.a3') },
        { question: t('landing.faq.q4'), answer: t('landing.faq.a4') },
        { question: t('landing.faq.q5'), answer: t('landing.faq.a5') },
    ];

    const features = [
        { icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z', title: t('landing.features.device_management'), description: t('landing.features.device_management_desc'), gradient: 'from-violet-500 to-purple-600', size: 'large' },
        { icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z', title: t('landing.features.visual_workflow'), description: t('landing.features.visual_workflow_desc'), gradient: 'from-cyan-500 to-blue-600', size: 'large' },
        { icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', title: t('landing.features.vision_ai'), description: t('landing.features.vision_ai_desc'), gradient: 'from-amber-500 to-orange-600', size: 'small' },
        { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: t('landing.features.high_performance'), description: t('landing.features.high_performance_desc'), gradient: 'from-emerald-500 to-green-600', size: 'small' },
        { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', title: t('landing.features.smart_scheduling'), description: t('landing.features.smart_scheduling_desc'), gradient: 'from-pink-500 to-rose-600', size: 'small' },
        { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', title: t('landing.features.detailed_analytics'), description: t('landing.features.detailed_analytics_desc'), gradient: 'from-indigo-500 to-violet-600', size: 'small' },
    ];

    const useCases = [
        { id: 'nuoi-nick', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', title: t('landing.use_cases.nuoi_nick.title'), description: t('landing.use_cases.nuoi_nick.description'), stats: [{ label: t('landing.use_cases.nuoi_nick.stat1_label'), value: '500+' }, { label: t('landing.use_cases.nuoi_nick.stat2_label'), value: '95%' }, { label: t('landing.use_cases.nuoi_nick.stat3_label'), value: '90%' }] },
        { id: 'test-key', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: t('landing.use_cases.test_key.title'), description: t('landing.use_cases.test_key.description'), stats: [{ label: t('landing.use_cases.test_key.stat1_label'), value: '10K+' }, { label: t('landing.use_cases.test_key.stat2_label'), value: '99.9%' }, { label: t('landing.use_cases.test_key.stat3_label'), value: '100+' }] },
        { id: 'auto-farm', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', title: t('landing.use_cases.auto_farm.title'), description: t('landing.use_cases.auto_farm.description'), stats: [{ label: t('landing.use_cases.auto_farm.stat1_label'), value: '99.9%' }, { label: t('landing.use_cases.auto_farm.stat2_label'), value: '1M+' }, { label: t('landing.use_cases.auto_farm.stat3_label'), value: '100%' }] },
    ];

    const structuredData = [schemas.organization, schemas.website, schemas.softwareApplication, schemas.faqPage(faqData)];

    return (
        <LandingLayout>
            <div className="overflow-x-hidden">
                <SeoHead
                    title={t('landing.seo_title')}
                    description={t('landing.seo_description')}
                    keywords="phone farm, workflow automation, nuoi nick, test key, clickai, no-code automation, vision AI"
                    url="https://clickai.vn"
                    structuredData={structuredData}
                />

                {/* ═══ HERO ═══ */}
                <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-white dark:bg-[#030712]" aria-label="Hero">
                    <div className="absolute inset-0">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
                        <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] bg-violet-500/[0.07] dark:bg-violet-500/[0.12] rounded-full blur-[150px]" />
                        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-cyan-400/[0.05] dark:bg-cyan-500/[0.08] rounded-full blur-[120px]" />
                    </div>

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <AnimatedSection animation="fadeUp" className="text-center lg:text-left space-y-8">
                                <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-full">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                    </span>
                                    <span className="text-xs font-semibold text-violet-600 dark:text-violet-300 tracking-wider uppercase">{t('landing.badge')}</span>
                                </div>

                                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-extrabold text-gray-900 dark:text-white leading-[1.08] tracking-tight">
                                    {t('landing.hero_title_1')}
                                    <span className="relative inline-block">
                                        <span className="bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-500 bg-clip-text text-transparent">Phone Farm</span>
                                        <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none"><path d="M2 8.5C50 2 100 2 150 6s100 4 148-2" stroke="url(#hero-underline)" strokeWidth="3" strokeLinecap="round"/><defs><linearGradient id="hero-underline" x1="0" y1="0" x2="300" y2="0"><stop stopColor="#8B5CF6"/><stop offset="1" stopColor="#06B6D4"/></linearGradient></defs></svg>
                                    </span>
                                </h1>

                                <p className="text-lg lg:text-xl text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed">
                                    {t('landing.hero_desc_prefix')}{' '}
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">No-Code</span>{' '}
                                    {t('landing.hero_desc_middle')}{' '}
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">Vision AI</span>{' '}
                                    {t('landing.hero_desc_suffix')}
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                    <Link href="/register" className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-2xl shadow-violet-500/25 hover:shadow-violet-500/40">
                                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 group-hover:from-violet-500 group-hover:to-purple-500 transition-all" />
                                        <span className="relative flex items-center gap-2">
                                            {t('landing.start_free_trial')}
                                            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                        </span>
                                    </Link>
                                    <Link href="/features" className="inline-flex items-center justify-center px-8 py-4 font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-2xl transition-all duration-300 backdrop-blur-sm">
                                        <svg className="w-5 h-5 mr-2 text-violet-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                        {t('landing.watch_demo')}
                                    </Link>
                                </div>

                                <div className="flex items-center gap-8 justify-center lg:justify-start pt-2">
                                    {[t('landing.trust_setup'), t('landing.trust_no_code'), t('landing.trust_free_trial')].map((text) => (
                                        <span key={text} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                            {text}
                                        </span>
                                    ))}
                                </div>
                            </AnimatedSection>

                            <AnimatedSection animation="fadeIn" delay={200} className="hidden lg:block h-[560px] relative">
                                <div className="absolute -inset-4 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-cyan-500/10 rounded-[2rem] blur-2xl" />
                                <div className="relative w-full h-full rounded-3xl overflow-hidden">
                                    <Suspense fallback={
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500/5 to-cyan-500/5 rounded-3xl">
                                            <div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                                        </div>
                                    }>
                                        <HeroScene isDark={isDark} />
                                    </Suspense>
                                </div>
                            </AnimatedSection>

                            <div className="lg:hidden flex justify-center">
                                <div className="relative w-56 h-56">
                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" />
                                    <div className="absolute inset-4 bg-gradient-to-br from-violet-600/10 to-cyan-500/10 rounded-full backdrop-blur-sm border border-violet-200/20 dark:border-white/5 flex items-center justify-center">
                                        <svg className="w-16 h-16 text-violet-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ STATS BAR ═══ */}
                <section className="relative py-16 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 overflow-hidden" aria-label={t('landing.stats_section')}>
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {[
                                { value: '10000', suffix: '+', label: t('landing.stats.devices_running') },
                                { value: '99.9', suffix: '%', label: t('landing.stats.system_uptime') },
                                { value: '1', suffix: 'M+', label: t('landing.stats.actions_per_day') },
                                { value: '98', suffix: '%', label: t('landing.stats.success_rate') },
                            ].map((stat, i) => (
                                <AnimatedSection key={stat.label} animation="fadeUp" delay={i * 80}>
                                    <div className="text-center">
                                        <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-1">
                                            <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                                        </div>
                                        <div className="text-sm text-white/60 font-medium">{stat.label}</div>
                                    </div>
                                </AnimatedSection>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ FEATURES — Bento Grid ═══ */}
                <section className="py-24 lg:py-32 bg-white dark:bg-[#030712]" aria-label={t('landing.features_label')} id="features">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <AnimatedSection animation="fadeUp" className="text-center mb-16 lg:mb-20">
                            <span className="inline-block text-xs font-bold text-violet-600 dark:text-violet-400 tracking-[0.2em] uppercase mb-4">{t('landing.features_label')}</span>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
                                {t('landing.everything_you_need')}
                            </h2>
                            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">{t('landing.features_desc')}</p>
                        </AnimatedSection>

                        {/* Bento grid: 2 large on top, 4 small on bottom */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                            {features.map((feature, i) => (
                                <AnimatedSection key={i} animation="fadeUp" delay={i * 60} className={feature.size === 'large' ? 'lg:col-span-2' : ''}>
                                    <div className="group relative h-full p-6 lg:p-8 bg-gray-50/80 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.05] border border-gray-100 dark:border-white/[0.06] hover:border-gray-200 dark:hover:border-white/[0.12] rounded-2xl lg:rounded-3xl transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] rounded-2xl lg:rounded-3xl transition-opacity duration-500`} />
                                        <div className="relative">
                                            <div className={`w-11 h-11 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} /></svg>
                                            </div>
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                                        </div>
                                    </div>
                                </AnimatedSection>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ HOW IT WORKS ═══ */}
                <section className="py-24 lg:py-32 relative bg-gray-50 dark:bg-[#060610]" aria-label={t('landing.how_it_works')} id="how-it-works">
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <AnimatedSection animation="fadeUp" className="text-center mb-16 lg:mb-20">
                            <span className="inline-block text-xs font-bold text-cyan-600 dark:text-cyan-400 tracking-[0.2em] uppercase mb-4">{t('landing.how_it_works')}</span>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                {t('landing.start_in_3_steps')}
                            </h2>
                        </AnimatedSection>

                        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
                            <div className="hidden md:block absolute top-20 left-[16%] right-[16%] h-px">
                                <div className="w-full h-full bg-gradient-to-r from-violet-500/30 via-purple-500/30 to-cyan-500/30" />
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-violet-500/30 via-purple-500/30 to-cyan-500/30 blur-sm" />
                            </div>

                            {[
                                { step: '01', title: t('landing.steps.step1_title'), description: t('landing.steps.step1_desc'), icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', color: 'from-violet-500 to-purple-600' },
                                { step: '02', title: t('landing.steps.step2_title'), description: t('landing.steps.step2_desc'), icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z', color: 'from-purple-500 to-indigo-600' },
                                { step: '03', title: t('landing.steps.step3_title'), description: t('landing.steps.step3_desc'), icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-cyan-500 to-blue-600' },
                            ].map((item, i) => (
                                <AnimatedSection key={item.step} animation="fadeUp" delay={i * 150}>
                                    <div className="relative text-center group">
                                        <div className="w-20 h-20 mx-auto mb-6 relative">
                                            <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-2xl opacity-20 blur-xl group-hover:opacity-40 transition-opacity`} />
                                            <div className={`relative w-full h-full bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-300`}>
                                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} /></svg>
                                            </div>
                                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-[#060610] border-2 border-violet-500 rounded-full flex items-center justify-center shadow-lg">
                                                <span className="text-[11px] font-extrabold text-violet-600 dark:text-violet-400">{item.step}</span>
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">{item.description}</p>
                                    </div>
                                </AnimatedSection>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ USE CASES ═══ */}
                <section className="py-24 lg:py-32 bg-white dark:bg-[#030712]" aria-label={t('landing.use_cases_label')} id="use-cases">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <AnimatedSection animation="fadeUp" className="text-center mb-16">
                            <span className="inline-block text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-[0.2em] uppercase mb-4">{t('landing.real_use_cases')}</span>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                {t('landing.use_for_every_need')}
                            </h2>
                        </AnimatedSection>

                        <AnimatedSection animation="fadeUp" delay={100}>
                            <div className="flex justify-center gap-2 sm:gap-3 mb-12 flex-wrap">
                                {useCases.map((uc, i) => (
                                    <button key={uc.id} onClick={() => setActiveUseCase(i)}
                                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${activeUseCase === i
                                            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25 scale-105'
                                            : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5'}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={uc.icon} /></svg>
                                        {uc.title}
                                    </button>
                                ))}
                            </div>

                            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-white/[0.03] dark:to-white/[0.01] border border-gray-200 dark:border-white/[0.06] rounded-3xl p-8 lg:p-12 overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-500/5 to-transparent rounded-bl-full" />
                                <div className="relative grid lg:grid-cols-2 gap-10 items-center">
                                    <div>
                                        <h3 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white mb-4">{useCases[activeUseCase].title}</h3>
                                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8">{useCases[activeUseCase].description}</p>
                                        <Link href="/register" className="inline-flex items-center px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-[1.02]">
                                            {t('landing.start_now')}
                                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                        </Link>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        {useCases[activeUseCase].stats.map((stat) => (
                                            <div key={stat.label} className="text-center p-5 bg-white dark:bg-white/[0.04] rounded-2xl border border-gray-100 dark:border-white/[0.06] shadow-sm hover:shadow-md transition-shadow">
                                                <div className="text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent mb-1">{stat.value}</div>
                                                <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </section>

                {/* ═══ TRUSTED BY ═══ */}
                <section className="py-16 border-y border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#060610]" aria-label={t('landing.partners')}>
                    <AnimatedSection animation="fadeIn">
                        <div className="text-center mb-8">
                            <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">{t('landing.trusted_by')}</span>
                        </div>
                        <div className="relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-gray-50 dark:from-[#060610] to-transparent z-10" />
                            <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-gray-50 dark:from-[#060610] to-transparent z-10" />
                            <div className="flex animate-[scroll_25s_linear_infinite] gap-20 items-center px-8">
                                {[...Array(2)].flatMap((_, setIdx) =>
                                    ['Phone Farm Pro', 'AutoTech', 'NickMaster', 'FarmCloud', 'DeviceHub', 'SmartBot', 'FlowAI', 'TestPilot'].map((name, i) => (
                                        <div key={`${setIdx}-${i}`} className="flex-shrink-0 text-gray-300 dark:text-gray-700 font-extrabold text-2xl tracking-wider hover:text-gray-500 dark:hover:text-gray-500 transition-colors select-none">{name}</div>
                                    ))
                                )}
                            </div>
                        </div>
                    </AnimatedSection>
                </section>

                {/* ═══ FAQ ═══ */}
                <section className="py-24 lg:py-32 bg-white dark:bg-[#030712]" aria-label={t('landing.faq_label')} id="faq">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <AnimatedSection animation="fadeUp" className="text-center mb-16">
                            <span className="inline-block text-xs font-bold text-amber-600 dark:text-amber-400 tracking-[0.2em] uppercase mb-4">FAQ</span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t('landing.faq_title')}</h2>
                        </AnimatedSection>

                        <div className="space-y-3">
                            {faqData.map((faq, i) => (
                                <AnimatedSection key={i} animation="fadeUp" delay={i * 50}>
                                    <div className={`bg-gray-50/80 dark:bg-white/[0.02] border rounded-2xl overflow-hidden transition-all duration-300 ${openFaq === i ? 'border-violet-200 dark:border-violet-500/20 shadow-lg shadow-violet-500/5' : 'border-gray-100 dark:border-white/[0.06] hover:border-gray-200 dark:hover:border-white/[0.1]'}`}>
                                        <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-6 py-5 flex items-center justify-between text-left" aria-expanded={openFaq === i}>
                                            <span className="font-semibold text-gray-900 dark:text-white pr-4">{faq.question}</span>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${openFaq === i ? 'bg-violet-100 dark:bg-violet-500/20 rotate-180' : 'bg-gray-100 dark:bg-white/5'}`}>
                                                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </button>
                                        <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <p className="px-6 pb-5 text-gray-500 dark:text-gray-400 leading-relaxed">{faq.answer}</p>
                                        </div>
                                    </div>
                                </AnimatedSection>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ FINAL CTA ═══ */}
                <section className="py-24 lg:py-32 relative overflow-hidden" aria-label={t('landing.start_now')}>
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[150px]" />

                    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <AnimatedSection animation="scaleUp">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-tight">{t('landing.ready_to_start')}</h2>
                            <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">{t('landing.cta_desc')}</p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/register" className="group inline-flex items-center justify-center px-10 py-4 font-bold text-violet-700 bg-white hover:bg-gray-50 rounded-2xl transition-all duration-300 shadow-2xl shadow-black/20 hover:scale-[1.03]">
                                    {t('landing.get_started')}
                                    <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </Link>
                                <Link href="/contact" className="inline-flex items-center justify-center px-10 py-4 font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-2xl transition-all duration-300 backdrop-blur-sm">
                                    {t('landing.contact_sales')}
                                </Link>
                            </div>
                        </AnimatedSection>
                    </div>
                </section>
            </div>
        </LandingLayout>
    );
}
