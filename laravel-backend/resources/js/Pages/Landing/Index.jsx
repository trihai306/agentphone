import { Link } from '@inertiajs/react';
import { useState, useEffect, lazy, Suspense } from 'react';
import LandingLayout from '@/Layouts/LandingLayout';
import SeoHead, { schemas } from '@/Components/SeoHead';
import AnimatedSection, { StaggerChildren, AnimatedCounter } from '@/Components/Landing/AnimatedSection';

// Lazy load R3F scene for performance
const HeroScene = lazy(() => import('@/Components/Landing/HeroScene'));

// FAQ data for SEO
const faqData = [
    { question: 'CLICKAI là gì?', answer: 'CLICKAI là nền tảng No-Code tự động hoá phone farm. Bạn có thể kéo thả tạo workflow, sử dụng Vision AI nhận diện UI và thao tác như người thật 24/7 trên hàng trăm thiết bị cùng lúc.' },
    { question: 'Có cần biết lập trình không?', answer: 'Không. CLICKAI được thiết kế hoàn toàn No-Code. Bạn chỉ cần kéo thả các block để tạo workflow hoặc ghi lại thao tác thật trên điện thoại.' },
    { question: 'CLICKAI hỗ trợ bao nhiêu thiết bị?', answer: 'Không giới hạn. Bạn có thể quản lý từ 1 đến hàng nghìn thiết bị Android từ một dashboard duy nhất.' },
    { question: 'Vision AI hoạt động như thế nào?', answer: 'Vision AI sử dụng công nghệ nhận diện hình ảnh để tìm và tương tác với các phần tử UI trên màn hình thiết bị, giúp thao tác chính xác như người thật mà không cần biết cấu trúc app.' },
    { question: 'Chi phí sử dụng CLICKAI?', answer: 'CLICKAI cung cấp gói miễn phí 14 ngày đầy đủ tính năng. Sau đó bạn có thể chọn gói phù hợp với nhu cầu, bắt đầu từ các gói cơ bản với giá cạnh tranh.' },
];

// Feature data
const features = [
    {
        icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
        title: 'Quản Lý Thiết Bị',
        description: 'Điều khiển hàng trăm điện thoại từ một dashboard. Theo dõi real-time, phân nhóm thông minh, giám sát 24/7.',
        gradient: 'from-violet-500 to-purple-600',
    },
    {
        icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
        title: 'Visual Workflow',
        description: 'Kéo thả tạo kịch bản tự động. Ghi lại thao tác thật, chỉnh sửa linh hoạt, tái sử dụng workflow.',
        gradient: 'from-cyan-500 to-blue-600',
    },
    {
        icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
        title: 'Vision AI',
        description: 'AI nhận diện UI, thao tác chính xác như người thật. Template matching thông minh, không cần biết cấu trúc app.',
        gradient: 'from-amber-500 to-orange-600',
    },
    {
        icon: 'M13 10V3L4 14h7v7l9-11h-7z',
        title: 'Hiệu Năng Cao',
        description: 'Xử lý hàng triệu thao tác mỗi ngày. Tối ưu tài nguyên, chạy ổn định không gián đoạn.',
        gradient: 'from-emerald-500 to-green-600',
    },
    {
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
        title: 'Lên Lịch Thông Minh',
        description: 'Tạo chiến dịch với lịch trình linh hoạt. Phân phối tải đều, retry tự động khi thất bại.',
        gradient: 'from-pink-500 to-rose-600',
    },
    {
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        title: 'Thống Kê Chi Tiết',
        description: 'Dashboard real-time với biểu đồ trực quan. Theo dõi tỷ lệ thành công, phân tích hiệu suất.',
        gradient: 'from-indigo-500 to-violet-600',
    },
];

// Use case data
const useCases = [
    {
        id: 'nuoi-nick',
        title: 'Nuôi Nick',
        description: 'Tự động hoá toàn bộ quy trình nuôi tài khoản mạng xã hội. Tương tác tự nhiên, lên lịch linh hoạt, mô phỏng hành vi người dùng thật.',
        stats: [
            { label: 'Tài khoản/ngày', value: '500+' },
            { label: 'Tỷ lệ sống', value: '95%' },
            { label: 'Tiết kiệm', value: '90%' },
        ],
    },
    {
        id: 'test-key',
        title: 'Test Key',
        description: 'Kiểm tra hàng loạt license key, activation code trên nhiều thiết bị đồng thời. Báo cáo kết quả chi tiết, export dữ liệu dễ dàng.',
        stats: [
            { label: 'Key/giờ', value: '10K+' },
            { label: 'Độ chính xác', value: '99.9%' },
            { label: 'Thiết bị song song', value: '100+' },
        ],
    },
    {
        id: 'auto-farm',
        title: 'Auto Farm',
        description: 'Chạy farm tự động 24/7 không cần can thiệp. Vision AI xử lý popup, captcha, và các tình huống bất thường tự động.',
        stats: [
            { label: 'Uptime', value: '99.9%' },
            { label: 'Thao tác/ngày', value: '1M+' },
            { label: 'Auto-recovery', value: '100%' },
        ],
    },
];

export default function Index() {
    const [activeUseCase, setActiveUseCase] = useState(0);
    const [openFaq, setOpenFaq] = useState(null);

    const structuredData = [
        schemas.organization,
        schemas.website,
        schemas.softwareApplication,
        schemas.faqPage(faqData),
    ];

    return (
        <LandingLayout>
            <div className="overflow-x-hidden">
                <SeoHead
                    title="CLICKAI - Nền Tảng Tự Động Hoá Phone Farm #1 Việt Nam"
                    description="Nền tảng No-Code tự động hoá phone farm hàng đầu. Kéo thả workflow, Vision AI nhận diện UI, thao tác như người thật 24/7. Dùng thử miễn phí 14 ngày."
                    keywords="phone farm, tự động hoá, workflow automation, nuôi nick, test key, clickai, no-code automation, vision AI, phone farm automation"
                    url="https://clickai.vn"
                    structuredData={structuredData}
                />

                {/* ═══ SECTION 1: HERO ═══ */}
                <section className="relative min-h-screen flex items-center overflow-hidden bg-white dark:bg-[#030712]" aria-label="Hero">
                    {/* Background */}
                    <div className="absolute inset-0">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
                        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/5 dark:bg-violet-600/8 rounded-full blur-[120px]" />
                        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-400/5 dark:bg-cyan-500/8 rounded-full blur-[100px]" />
                    </div>

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            {/* Left: Content */}
                            <AnimatedSection animation="fadeUp" className="text-center lg:text-left space-y-8">
                                {/* Badge */}
                                <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full backdrop-blur-sm">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                                    </span>
                                    <span className="text-xs font-semibold text-violet-600 dark:text-violet-300 tracking-wider uppercase">No-Code Automation Platform</span>
                                </div>

                                {/* Title */}
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 dark:text-white leading-[1.1] tracking-tight">
                                    Tự Động Hoá
                                    <span className="block bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                                        Phone Farm
                                    </span>
                                    <span className="block text-2xl sm:text-3xl lg:text-4xl font-medium text-gray-500 dark:text-gray-400 mt-2">
                                        Thông Minh & Hiệu Quả
                                    </span>
                                </h1>

                                {/* Description */}
                                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
                                    Nền tảng <strong className="text-gray-900 dark:text-white">No-Code</strong> kéo thả workflow.{' '}
                                    <strong className="text-gray-900 dark:text-white">Vision AI</strong> nhận diện UI, thao tác như người thật 24/7 trên hàng trăm thiết bị.
                                </p>

                                {/* CTA */}
                                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                    <Link
                                        href="/register"
                                        className="group inline-flex items-center justify-center px-8 py-4 font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-2xl transition-all duration-300 shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02]"
                                    >
                                        Dùng Thử Miễn Phí
                                        <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Link>
                                    <Link
                                        href="/features"
                                        className="inline-flex items-center justify-center px-8 py-4 font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-2xl transition-all duration-300 backdrop-blur-sm"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                        </svg>
                                        Xem Demo
                                    </Link>
                                </div>

                                {/* Trust badges */}
                                <div className="flex flex-wrap gap-6 justify-center lg:justify-start text-sm">
                                    {['Setup 5 phút', 'Không cần code', '14 ngày miễn phí'].map((text) => (
                                        <span key={text} className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-gray-500 dark:text-gray-400">{text}</span>
                                        </span>
                                    ))}
                                </div>
                            </AnimatedSection>

                            {/* Right: 3D Scene */}
                            <AnimatedSection animation="fadeIn" delay={300} className="hidden lg:block h-[550px]">
                                <div className="w-full h-full rounded-3xl overflow-hidden bg-gray-950/80 dark:bg-transparent">
                                    <Suspense fallback={
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="w-16 h-16 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                                        </div>
                                    }>
                                        <HeroScene />
                                    </Suspense>
                                </div>
                            </AnimatedSection>

                            {/* Mobile: Simple visual fallback */}
                            <div className="lg:hidden flex justify-center">
                                <div className="relative w-64 h-64">
                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" />
                                    <div className="absolute inset-4 bg-gradient-to-br from-violet-600/10 to-cyan-500/10 rounded-full backdrop-blur-sm border border-violet-200/20 dark:border-white/5 flex items-center justify-center">
                                        <svg className="w-20 h-20 text-violet-500 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scroll indicator */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500 animate-bounce">
                        <span className="text-xs tracking-widest uppercase">Scroll</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                </section>

                {/* ═══ SECTION 2: STATS ═══ */}
                <section className="relative py-20 border-y border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-gray-900/50" aria-label="Thống kê">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/3 dark:from-violet-600/5 via-transparent to-cyan-500/3 dark:to-cyan-500/5" />
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                            {[
                                { value: '10000', suffix: '+', label: 'Thiết bị đang chạy' },
                                { value: '99.9', suffix: '%', label: 'Uptime hệ thống' },
                                { value: '1', suffix: 'M+', label: 'Thao tác/ngày' },
                                { value: '98', suffix: '%', label: 'Tỷ lệ thành công' },
                            ].map((stat, i) => (
                                <AnimatedSection key={stat.label} animation="fadeUp" delay={i * 100}>
                                    <div className="text-center group">
                                        <div className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
                                            <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-400 transition-colors">{stat.label}</div>
                                    </div>
                                </AnimatedSection>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ SECTION 3: FEATURES ═══ */}
                <section className="py-24 lg:py-32 bg-white dark:bg-[#030712]" aria-label="Tính năng" id="features">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <AnimatedSection animation="fadeUp" className="text-center mb-16 lg:mb-20">
                            <span className="inline-block text-xs font-semibold text-violet-600 dark:text-violet-400 tracking-widest uppercase mb-4">Tính Năng</span>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                                Tất Cả Những Gì Bạn Cần
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                                Nền tảng tích hợp đầy đủ để tự động hoá mọi tác vụ phone farm với công nghệ AI tiên tiến
                            </p>
                        </AnimatedSection>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {features.map((feature, i) => (
                                <AnimatedSection key={feature.title} animation="fadeUp" delay={i * 80}>
                                    <div className="group relative h-full p-6 lg:p-8 bg-gray-50 dark:bg-white/[0.03] hover:bg-gray-100 dark:hover:bg-white/[0.06] border border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/[0.12] rounded-2xl transition-all duration-500">
                                        {/* Gradient glow on hover */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.04] rounded-2xl transition-opacity duration-500`} />

                                        <div className="relative">
                                            <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                                        </div>
                                    </div>
                                </AnimatedSection>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ SECTION 4: HOW IT WORKS ═══ */}
                <section className="py-24 lg:py-32 relative bg-gray-50 dark:bg-[#030712]" aria-label="Cách hoạt động" id="how-it-works">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/[0.02] dark:via-violet-600/[0.03] to-transparent" />
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <AnimatedSection animation="fadeUp" className="text-center mb-16 lg:mb-20">
                            <span className="inline-block text-xs font-semibold text-cyan-600 dark:text-cyan-400 tracking-widest uppercase mb-4">Cách Hoạt Động</span>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                                Bắt Đầu Trong 3 Bước
                            </h2>
                        </AnimatedSection>

                        <div className="grid md:grid-cols-3 gap-8 relative">
                            {/* Connection line */}
                            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-violet-500/20 dark:from-violet-500/30 via-purple-500/20 dark:via-purple-500/30 to-cyan-500/20 dark:to-cyan-500/30" />

                            {[
                                { step: '01', title: 'Cài Agent', description: 'Tải app CLICKAI lên điện thoại Android. Kết nối tự động qua mạng trong vài giây.', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
                                { step: '02', title: 'Tạo Workflow', description: 'Ghi lại thao tác thật trên thiết bị hoặc kéo thả các block để xây dựng kịch bản tự động.', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
                                { step: '03', title: 'Chạy 24/7', description: 'Lên lịch hoặc chạy ngay. Hệ thống tự động xử lý lỗi, retry và hoạt động liên tục.', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                            ].map((item, i) => (
                                <AnimatedSection key={item.step} animation="fadeUp" delay={i * 150}>
                                    <div className="relative text-center">
                                        <div className="w-16 h-16 mx-auto mb-6 relative">
                                            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-cyan-500 rounded-2xl opacity-20 blur-lg" />
                                            <div className="relative w-full h-full bg-gradient-to-br from-violet-600 to-cyan-500 rounded-2xl flex items-center justify-center">
                                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                                                </svg>
                                            </div>
                                            <div className="absolute -top-2 -right-2 w-7 h-7 bg-white dark:bg-[#030712] border-2 border-violet-500 rounded-full flex items-center justify-center">
                                                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">{item.step}</span>
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">{item.description}</p>
                                    </div>
                                </AnimatedSection>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ SECTION 5: USE CASES ═══ */}
                <section className="py-24 lg:py-32 bg-white dark:bg-[#030712]" aria-label="Ứng dụng" id="use-cases">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <AnimatedSection animation="fadeUp" className="text-center mb-16">
                            <span className="inline-block text-xs font-semibold text-emerald-600 dark:text-emerald-400 tracking-widest uppercase mb-4">Ứng Dụng Thực Tế</span>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                                Dùng Cho Mọi Nhu Cầu
                            </h2>
                        </AnimatedSection>

                        <AnimatedSection animation="fadeUp" delay={100}>
                            {/* Tab buttons */}
                            <div className="flex justify-center gap-3 mb-12">
                                {useCases.map((uc, i) => (
                                    <button
                                        key={uc.id}
                                        onClick={() => setActiveUseCase(i)}
                                        className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${activeUseCase === i
                                                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25'
                                                : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/5'
                                            }`}
                                    >
                                        {uc.title}
                                    </button>
                                ))}
                            </div>

                            {/* Active case content */}
                            <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-3xl p-8 lg:p-12">
                                <div className="grid lg:grid-cols-2 gap-10 items-center">
                                    <div>
                                        <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                            {useCases[activeUseCase].title}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
                                            {useCases[activeUseCase].description}
                                        </p>
                                        <Link
                                            href="/register"
                                            className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all"
                                        >
                                            Bắt đầu ngay
                                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </Link>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        {useCases[activeUseCase].stats.map((stat) => (
                                            <div key={stat.label} className="text-center p-4 bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-white/[0.06] shadow-sm dark:shadow-none">
                                                <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent mb-1">
                                                    {stat.value}
                                                </div>
                                                <div className="text-xs text-gray-500">{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </section>

                {/* ═══ SECTION 6: TRUSTED BY ═══ */}
                <section className="py-16 border-y border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-gray-900/30" aria-label="Đối tác">
                    <AnimatedSection animation="fadeIn">
                        <div className="text-center mb-8">
                            <span className="text-sm text-gray-500">Được tin dùng bởi hàng nghìn doanh nghiệp</span>
                        </div>
                        <div className="relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-50 dark:from-gray-900/80 to-transparent z-10" />
                            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-50 dark:from-gray-900/80 to-transparent z-10" />
                            <div className="flex animate-[scroll_30s_linear_infinite] gap-16 items-center px-8">
                                {[...Array(2)].flatMap((_, setIdx) =>
                                    ['Phone Farm Pro', 'AutoTech', 'NickMaster', 'FarmCloud', 'DeviceHub', 'SmartBot', 'FlowAI', 'TestPilot'].map((name, i) => (
                                        <div key={`${setIdx}-${i}`} className="flex-shrink-0 text-gray-400 dark:text-gray-600 font-bold text-xl tracking-wider opacity-50 hover:opacity-80 transition-opacity select-none">
                                            {name}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </AnimatedSection>
                </section>

                {/* ═══ SECTION 7: FAQ ═══ */}
                <section className="py-24 lg:py-32 bg-white dark:bg-[#030712]" aria-label="Câu hỏi thường gặp" id="faq">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <AnimatedSection animation="fadeUp" className="text-center mb-16">
                            <span className="inline-block text-xs font-semibold text-amber-600 dark:text-amber-400 tracking-widest uppercase mb-4">FAQ</span>
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                                Câu Hỏi Thường Gặp
                            </h2>
                        </AnimatedSection>

                        <div className="space-y-3">
                            {faqData.map((faq, i) => (
                                <AnimatedSection key={i} animation="fadeUp" delay={i * 60}>
                                    <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-2xl overflow-hidden transition-colors hover:border-gray-300 dark:hover:border-white/[0.1]">
                                        <button
                                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                            className="w-full px-6 py-5 flex items-center justify-between text-left"
                                            aria-expanded={openFaq === i}
                                        >
                                            <span className="font-semibold text-gray-900 dark:text-white pr-4">{faq.question}</span>
                                            <svg
                                                className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
                                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <p className="px-6 pb-5 text-gray-600 dark:text-gray-400 leading-relaxed">{faq.answer}</p>
                                        </div>
                                    </div>
                                </AnimatedSection>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ SECTION 8: CTA ═══ */}
                <section className="py-24 lg:py-32 relative overflow-hidden bg-gray-50 dark:bg-[#030712]" aria-label="Bắt đầu ngay">
                    {/* Background effects */}
                    <div className="absolute inset-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 dark:from-violet-600/10 via-purple-500/3 dark:via-purple-600/5 to-cyan-500/5 dark:to-cyan-500/10" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/5 dark:bg-violet-600/10 rounded-full blur-[150px]" />
                    </div>

                    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <AnimatedSection animation="scaleUp">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                                Sẵn Sàng Tự Động Hoá?
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                                Tham gia cùng hàng nghìn doanh nghiệp đang sử dụng CLICKAI. Bắt đầu miễn phí, không cần thẻ tín dụng.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/register"
                                    className="group inline-flex items-center justify-center px-10 py-4 font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-2xl transition-all duration-300 shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.03]"
                                >
                                    Bắt Đầu Miễn Phí
                                    <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                                <Link
                                    href="/contact"
                                    className="inline-flex items-center justify-center px-10 py-4 font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-2xl transition-all duration-300"
                                >
                                    Liên Hệ Tư Vấn
                                </Link>
                            </div>
                        </AnimatedSection>
                    </div>
                </section>
            </div>
        </LandingLayout>
    );
}
