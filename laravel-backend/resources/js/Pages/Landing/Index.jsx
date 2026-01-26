import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import LandingLayout from '../../Layouts/LandingLayout';
import SeoHead, { schemas } from '../../Components/SeoHead';

export default function Index() {
    const { t } = useTranslation();
    const [activeDevices, setActiveDevices] = useState(10247);
    const [dailyActions, setDailyActions] = useState(1247893);

    // Animated counter effect
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveDevices(prev => prev + Math.floor(Math.random() * 3));
            setDailyActions(prev => prev + Math.floor(Math.random() * 100));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const structuredData = [schemas.organization, schemas.website, schemas.softwareApplication];

    return (
        <LandingLayout>
            <SeoHead
                title="CLICKAI - Startup Tự Động Hoá Phone Farm 2026 | No-Code Automation"
                description="Startup 2026: Nền tảng tự động hoá phone farm hàng đầu Việt Nam. Kéo thả workflow, test key app, nuôi nick, chăm sóc tài nguyên 24/7. Thao tác như người thật."
                keywords="phone farm, tự động hoá, workflow automation, nuôi nick, test key, clickai, automation mmo, startup 2026, phone farm vietnam"
                url="https://clickai.vn"
                structuredData={structuredData}
            />

            {/* Hero Section - Enterprise AI SaaS 2026 */}
            <section className="relative min-h-[95vh] flex items-center overflow-hidden bg-white dark:bg-[#030308]">
                {/* Animated Neural Network Grid */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08]" style={{
                        backgroundImage: `
                            linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
                        `,
                        backgroundSize: '60px 60px'
                    }}></div>
                </div>

                {/* Floating Particles - AI Aesthetic */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(40)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full animate-float-slow"
                            style={{
                                width: `${2 + Math.random() * 4}px`,
                                height: `${2 + Math.random() * 4}px`,
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                background: `radial-gradient(circle, ${['#8B5CF6', '#3B82F6', '#06B6D4', '#EC4899'][Math.floor(Math.random() * 4)]}40, transparent)`,
                                animationDelay: `${Math.random() * 8}s`,
                                animationDuration: `${6 + Math.random() * 8}s`
                            }}
                        />
                    ))}
                </div>

                {/* Gradient Mesh - Premium Ambient */}
                <div className="absolute inset-0 overflow-hidden opacity-0 dark:opacity-100">
                    <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-purple-600/20 via-indigo-600/10 to-transparent rounded-full blur-[150px] animate-pulse-slow"></div>
                    <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-tl from-cyan-500/15 via-blue-500/10 to-transparent rounded-full blur-[120px] animate-pulse-slow animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-violet-500/10 to-transparent rounded-full blur-[100px]"></div>
                </div>

                {/* Light Mode Subtle Gradient */}
                <div className="absolute inset-0 overflow-hidden opacity-100 dark:opacity-0">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-indigo-100/50 via-purple-50/30 to-transparent rounded-full blur-[80px]"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-100/40 to-transparent rounded-full blur-[60px]"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        {/* Left: Enhanced Content */}
                        <div className="text-center lg:text-left space-y-8">
                            {/* AI-Powered Badge with Glow */}
                            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900/80 dark:to-gray-800/50 border border-gray-200/80 dark:border-purple-500/30 rounded-full px-5 py-2.5 shadow-lg shadow-purple-500/0 dark:shadow-purple-500/20 backdrop-blur-xl">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-purple-500 to-indigo-500"></span>
                                </span>
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 tracking-wide">AI-POWERED AUTOMATION • 2026</span>
                            </div>

                            {/* Hero Title with Gradient */}
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white leading-[1.05] tracking-tight">
                                <span className="block">Tự Động Hoá</span>
                                <span className="block mt-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 dark:from-purple-400 dark:via-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent">
                                    Phone Farm
                                </span>
                                <span className="block text-4xl sm:text-5xl lg:text-5xl mt-4 text-gray-500 dark:text-gray-400 font-bold">
                                    Thông Minh Như AI
                                </span>
                            </h1>

                            {/* Hero Description */}
                            <div className="max-w-2xl mx-auto lg:mx-0">
                                <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Nền tảng <span className="font-semibold text-gray-900 dark:text-white">No-Code</span> kéo thả workflow chuyên nghiệp.
                                    <span className="text-purple-600 dark:text-purple-400 font-medium"> Vision AI </span>
                                    nhận diện UI, thao tác như người thật 24/7.
                                </p>
                            </div>

                            {/* Premium CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link
                                    href="/register"
                                    className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-1"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-indigo-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <span className="relative flex items-center gap-2">
                                        Dùng Thử Miễn Phí
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </span>
                                </Link>
                                <Link
                                    href="/features"
                                    className="group inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-gray-900 dark:text-white bg-white/80 dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 rounded-2xl border border-gray-200 dark:border-white/10 backdrop-blur-xl transition-all duration-300"
                                >
                                    <svg className="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                    </svg>
                                    Xem Demo
                                </Link>
                            </div>

                            {/* Trust Indicators with Icons */}
                            <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start pt-4">
                                {[
                                    { icon: "⚡", text: "Setup 5 phút" },
                                    { icon: "🎯", text: "Không cần code" },
                                    { icon: "🎁", text: "Miễn phí 14 ngày" }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-full border border-gray-200/50 dark:border-white/10">
                                        <span className="text-lg">{item.icon}</span>
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Enhanced Phone Farm Grid */}
                        <div className="hidden lg:block">
                            <EnhancedPhoneFarmGrid />
                        </div>
                    </div>
                </div>

                {/* Bottom Gradient Fade */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 dark:from-gray-950 to-transparent"></div>
            </section>

            {/* Stats Section - Premium AI Dashboard */}
            <section className="py-20 relative overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#030308] dark:via-[#0a0a12] dark:to-[#030308]"></div>

                {/* Subtle Pattern */}
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                    backgroundSize: '32px 32px'
                }}></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center mb-12">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20 mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                            LIVE METRICS
                        </span>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hệ Thống Hoạt Động 24/7</h2>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <PremiumStatCard
                            number={activeDevices.toLocaleString()}
                            label="Thiết bị đang chạy"
                            icon="devices"
                            gradient="from-purple-500 to-indigo-600"
                        />
                        <PremiumStatCard
                            number="99.9%"
                            label="Độ ổn định hệ thống"
                            icon="shield"
                            gradient="from-green-500 to-emerald-600"
                        />
                        <PremiumStatCard
                            number={dailyActions.toLocaleString()}
                            label="Thao tác mỗi ngày"
                            icon="zap"
                            gradient="from-amber-500 to-orange-600"
                        />
                        <PremiumStatCard
                            number="98%"
                            label="Tỷ lệ sống nick"
                            icon="heart"
                            gradient="from-rose-500 to-pink-600"
                        />
                    </div>
                </div>
            </section>

            {/* Why 2026? - Enhanced Timeline */}
            <section className="py-28 bg-black relative overflow-hidden">
                {/* Animated Grid Background */}
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }}></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 mb-8 backdrop-blur-xl">
                            <span className="text-xl">🚀</span>
                            <span>Thời Điểm Vàng</span>
                        </div>
                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6">
                            Tại Sao <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">2026</span> Là Năm Bùng Nổ?
                        </h2>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                            Sự hội tụ hoàn hảo của công nghệ, thị trường và nhu cầu tạo nên cơ hội chưa từng có
                        </p>
                    </div>

                    {/* Enhanced Timeline */}
                    <div className="grid md:grid-cols-3 gap-8">
                        <EnhancedTimelineCard
                            year="2024"
                            title="Nền Tảng"
                            description="AI Generative bùng nổ. Chi phí automation giảm 70%. Nhu cầu phone farm tăng mạnh."
                            items={["ChatGPT-4 release", "Cost reduction", "Market demand surge"]}
                            color="gray"
                            past={true}
                        />
                        <EnhancedTimelineCard
                            year="2025"
                            title="Xây Dựng"
                            description="CLICKAI hoàn thiện core platform. First customers. Product-market fit validation."
                            items={["Core platform done", "100+ beta users", "PMF achieved"]}
                            color="purple"
                            current={true}
                        />
                        <EnhancedTimelineCard
                            year="2026"
                            title="Bùng Nổ"
                            description="Scale toàn Đông Nam Á. Enterprise có nhu cầu, thị trường sẵn sàng, công nghệ đỉnh cao."
                            items={["SEA expansion", "Enterprise deals", "Series A target"]}
                            color="cyan"
                            future={true}
                        />
                    </div>
                </div>
            </section>

            {/* Market Opportunity - Premium Presentation */}
            <section className="py-28 bg-gradient-to-b from-black to-[#0A0A0F] relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-300 mb-8 backdrop-blur-xl">
                            <span className="text-xl">💰</span>
                            <span>Cơ Hội Thị Trường</span>
                        </div>
                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6">
                            Thị Trường <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">$2.5 Tỷ USD</span>
                        </h2>
                    </div>

                    {/* Market Cards */}
                    <div className="grid lg:grid-cols-3 gap-8 mb-20">
                        <PremiumMarketCard
                            title="TAM"
                            subtitle="Total Addressable Market"
                            value="$2.5B"
                            description="Thị trường Phone Farm & Mobile Automation toàn cầu"
                            color="purple"
                            icon="🌍"
                        />
                        <PremiumMarketCard
                            title="SAM"
                            subtitle="Serviceable Available Market"
                            value="$400M"
                            description="Đông Nam Á - Thị trường phone farm sôi động nhất"
                            color="blue"
                            icon="🗺️"
                        />
                        <PremiumMarketCard
                            title="SOM"
                            subtitle="Serviceable Obtainable Market"
                            value="$50M"
                            description="Việt Nam - Thị trường ngách với tăng trưởng 40%/năm"
                            color="cyan"
                            icon="🎯"
                        />
                    </div>

                    {/* Enhanced Growth Chart */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-3xl p-10 border border-gray-800 shadow-2xl backdrop-blur-xl">
                        <h3 className="text-2xl font-bold text-white mb-8 text-center">Dự Báo Tăng Trưởng (CAGR 35%)</h3>
                        <div className="flex items-end justify-between h-64 gap-6">
                            {[
                                { year: '2023', height: '25%', value: '$180M', highlight: false },
                                { year: '2024', height: '40%', value: '$280M', highlight: false },
                                { year: '2025', height: '60%', value: '$350M', highlight: false },
                                { year: '2026', height: '85%', value: '$480M', highlight: true },
                                { year: '2027', height: '100%', value: '$600M', highlight: false },
                            ].map((item, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center group">
                                    <span className={`text-sm font-bold mb-3 transition-all ${item.highlight ? 'text-cyan-400 text-lg' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                        {item.value}
                                    </span>
                                    <div className="relative w-full">
                                        <div
                                            className={`w-full rounded-t-2xl transition-all duration-500 ${item.highlight
                                                ? 'bg-gradient-to-t from-cyan-600 via-purple-500 to-pink-500 shadow-2xl shadow-cyan-500/40 animate-glow'
                                                : 'bg-gradient-to-t from-gray-700 to-gray-600 group-hover:from-purple-600 group-hover:to-purple-500'
                                                }`}
                                            style={{ height: item.height }}
                                        ></div>
                                        {item.highlight && (
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyan-500 rounded-full text-xs font-extrabold text-white whitespace-nowrap shadow-lg">
                                                ĐÂY RỒI
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-base mt-4 font-bold transition-all ${item.highlight ? 'text-cyan-400 text-lg' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                        {item.year}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Technology Stack - Competitive Moat */}
            <section className="py-28 bg-[#0A0A0F] relative overflow-hidden">
                {/* Ambient Background */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-300 mb-8 backdrop-blur-xl">
                            <span className="text-xl">⚡</span>
                            <span>Công Nghệ Đột Phá</span>
                        </div>
                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6">
                            Tech Stack <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Thế Hệ Mới</span>
                        </h2>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                            Kiến trúc được thiết kế để scale và tích hợp AI từ ngày đầu
                        </p>
                    </div>

                    {/* Tech Cards Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <PremiumTechCard
                            icon="🤖"
                            title="AI-First"
                            description="Độc quyền tích hợp Vision AI cho UI recognition, vượt trội 95% competitors chỉ dùng automation thông thường"
                            techs={["OpenAI", "Gemini", "Vision AI"]}
                            moat="Competitive Moat"
                        />
                        <PremiumTechCard
                            icon="⚡"
                            title="Real-time"
                            description="WebSocket bidirectional với độ trễ < 50ms. Điều khiển song song hàng trăm device cùng lúc"
                            techs={["Soketi", "Laravel Echo", "React"]}
                            moat="10x Faster"
                        />
                        <PremiumTechCard
                            icon="📱"
                            title="Native Agent"
                            description="Android Agent tối ưu Kotlin, hoạt động như người thật với intelligent delays, bypass detection"
                            techs={["Kotlin", "Accessibility", "Smart AI"]}
                            moat="Human-like"
                        />
                        <PremiumTechCard
                            icon="🔄"
                            title="No-Code"
                            description="Visual workflow builder với recording mode. Dân MMO không cần code vẫn tự động hoá được"
                            techs={["ReactFlow", "Drag & Drop", "Record"]}
                            moat="Zero Skill"
                        />
                    </div>
                </div>
            </section>

            {/* Continue with other sections... */}
            {/* I'll add the remaining sections in the next part to keep it organized */}

            {/* 5 Core Features */}
            <CoreFeaturesSection />

            {/* How It Works */}
            <HowItWorksSection />

            {/* Use Cases */}
            <UseCasesSection />

            {/* Social Proof */}
            <SocialProofSection />

            {/* Final CTA */}
            <FinalCTASection />
        </LandingLayout>
    );
}

// Enhanced Phone Farm Grid with Premium Design
function EnhancedPhoneFarmGrid() {
    const devices = [
        { status: 'running', progress: 78, brand: 'Samsung' },
        { status: 'online', progress: 100, brand: 'Xiaomi' },
        { status: 'running', progress: 45, brand: 'Oppo' },
        { status: 'idle', progress: 0, brand: 'Vivo' },
        { status: 'running', progress: 92, brand: 'Samsung' },
        { status: 'online', progress: 100, brand: 'Realme' },
    ];

    const statusConfig = {
        running: { color: 'bg-green-500', pulse: true, text: 'Đang chạy', glow: 'shadow-green-500/50' },
        online: { color: 'bg-blue-500', pulse: false, text: 'Sẵn sàng', glow: 'shadow-blue-500/50' },
        idle: { color: 'bg-gray-500', pulse: false, text: 'Đợi', glow: 'shadow-gray-500/30' },
    };

    return (
        <div className="relative">
            {/* Premium Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 blur-3xl animate-pulse"></div>

            {/* Live Stats Overlay */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10 px-6 py-3 bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl">
                <div className="flex items-center gap-6 text-sm">
                    <span className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        <span className="text-green-400 font-bold">{devices.filter(d => d.status === 'running').length} Running</span>
                    </span>
                    <span className="text-gray-300 font-semibold">{devices.filter(d => d.status === 'online').length} Online</span>
                </div>
            </div>

            <div className="relative grid grid-cols-3 gap-5 p-8 pt-12">
                {devices.map((device, index) => {
                    const config = statusConfig[device.status];
                    return (
                        <div
                            key={index}
                            className="relative group transform hover:scale-110 hover:rotate-1 transition-all duration-300"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Phone Frame with Glassmorphic Design */}
                            <div className={`bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border-2 border-gray-700/50 rounded-[28px] p-4 shadow-2xl ${config.glow} group-hover:border-purple-500/50 transition-all`}>
                                {/* Screen */}
                                <div className="aspect-[9/16] bg-gradient-to-b from-gray-900 to-black rounded-[20px] relative overflow-hidden border border-gray-800">
                                    {/* Screen Content */}
                                    <div className="absolute inset-2 rounded-2xl flex flex-col items-center justify-center">
                                        {/* Brand Logo Mockup */}
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-2xl mb-3 flex items-center justify-center shadow-lg animate-float">
                                            <span className="text-white text-xs font-bold">{device.brand[0]}</span>
                                        </div>

                                        {/* Progress Bar */}
                                        {device.status === 'running' && (
                                            <div className="w-full px-4 mt-3 space-y-2">
                                                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full transition-all duration-1000 animate-shimmer bg-[length:200%_100%]"
                                                        style={{ width: `${device.progress}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-[9px] text-cyan-400 text-center font-bold tracking-wide">{device.progress}%</p>
                                            </div>
                                        )}

                                        {/* Idle State */}
                                        {device.status === 'idle' && (
                                            <div className="text-gray-600 text-xs font-semibold">Standby</div>
                                        )}
                                    </div>

                                    {/* Notch */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-b-2xl"></div>
                                </div>

                                {/* Status Badge */}
                                <div className="flex items-center justify-center gap-2 mt-3">
                                    <span className={`relative flex h-2 w-2 ${config.color} rounded-full`}>
                                        {config.pulse && (
                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75`}></span>
                                        )}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{config.text}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Premium Stat Card Component with Gradient Support
function PremiumStatCard({ number, label, icon, gradient = "from-purple-500 to-indigo-600" }) {
    const icons = {
        devices: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
        shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
        zap: "M13 10V3L4 14h7v7l9-11h-7z",
        heart: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    };

    return (
        <div className="group relative card-shine">
            {/* Glow Effect on Hover */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}></div>

            {/* Card */}
            <div className="relative text-center p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg shadow-gray-500/5 dark:shadow-black/20 group-hover:border-gray-300 dark:group-hover:border-gray-700 transition-all duration-300 group-hover:-translate-y-1">
                {/* Icon with Gradient Background */}
                <div className={`w-14 h-14 mx-auto bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
                    </svg>
                </div>

                {/* Number with Gradient Text */}
                <div className={`text-3xl sm:text-4xl font-black bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-1 tabular-nums`}>
                    {number}
                </div>

                {/* Label */}
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {label}
                </div>
            </div>
        </div>
    );
}

// Enhanced Timeline Card
function EnhancedTimelineCard({ year, title, description, items, color, past, current, future }) {
    const colorClasses = {
        gray: { gradient: 'from-gray-600 to-gray-700', border: 'border-gray-600', bg: 'bg-gray-800/50' },
        purple: { gradient: 'from-purple-500 to-purple-600', border: 'border-purple-500', bg: 'bg-purple-500/10' },
        cyan: { gradient: 'from-cyan-500 to-cyan-600', border: 'border-cyan-500/50', bg: 'bg-cyan-500/5' },
    };

    return (
        <div className={`relative p-10 rounded-3xl border-2 transition-all duration-500 ${current ? `${colorClasses[color].bg} ${colorClasses[color].border} scale-105 shadow-2xl shadow-purple-500/30` :
            future ? `${colorClasses[color].bg} ${colorClasses[color].border}` :
                `${colorClasses[color].bg} ${colorClasses[color].border}`
            } backdrop-blur-xl group hover:scale-105 hover:shadow-2xl`}>
            {/* Current Year Badge */}
            {current && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-extrabold text-white shadow-xl animate-pulse">
                    ĐÂY RỒI
                </div>
            )}

            {/* Year Badge */}
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${colorClasses[color].gradient} text-white text-3xl font-extrabold mb-8 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                {year}
            </div>

            {/* Content */}
            <h3 className="text-2xl font-extrabold text-white mb-4">{title}</h3>
            <p className="text-gray-400 mb-6 leading-relaxed">{description}</p>

            {/* Items List */}
            <ul className="space-y-3">
                {items.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                        <svg className={`w-5 h-5 flex-shrink-0 ${current ? 'text-purple-400' : future ? 'text-cyan-400' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-300 font-medium">{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// Premium Market Card
function PremiumMarketCard({ title, subtitle, value, description, color, icon }) {
    const colorClasses = {
        purple: 'from-purple-500 to-purple-600',
        blue: 'from-blue-500 to-blue-600',
        cyan: 'from-cyan-500 to-cyan-600',
    };

    return (
        <div className="group relative">
            {/* Ambient Glow */}
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-500`}></div>

            {/* Card */}
            <div className="relative p-10 bg-gradient-to-br from-gray-900 to-gray-950 rounded-3xl border border-gray-800 group-hover:border-gray-700 transition-all duration-500 shadow-2xl group-hover:-translate-y-2 backdrop-blur-xl">
                {/* Icon & Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-3xl shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all`}>
                        {icon}
                    </div>
                    <div>
                        <div className={`text-2xl font-extrabold bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent`}>
                            {title}
                        </div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{subtitle}</div>
                    </div>
                </div>

                {/* Value */}
                <div className={`text-5xl font-extrabold bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent mb-4 tabular-nums`}>
                    {value}
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

// Premium Tech Card
function PremiumTechCard({ icon, title, description, techs, moat }) {
    return (
        <div className="group relative">
            {/* Glow on Hover */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500"></div>

            {/* Card */}
            <div className="relative p-8 bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-gray-800 group-hover:border-purple-500/50 transition-all duration-500 group-hover:-translate-y-2 shadow-2xl h-full flex flex-col">
                {/* Moat Badge */}
                {moat && (
                    <div className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-extrabold text-white shadow-xl">
                        {moat}
                    </div>
                )}

                {/* Icon */}
                <div className="text-5xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">{icon}</div>

                {/* Title */}
                <h3 className="text-xl font-extrabold text-white mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-400 mb-6 leading-relaxed flex-grow">{description}</p>

                {/* Tech Badges */}
                <div className="flex flex-wrap gap-2">
                    {techs.map((tech, i) => (
                        <span key={i} className="px-4 py-1.5 text-xs font-bold bg-gray-800/80 text-gray-300 rounded-full border border-gray-700 backdrop-blur-sm group-hover:border-purple-500/50 transition-colors">
                            {tech}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Remaining sections as separate components for better organization
function CoreFeaturesSection() {
    return (
        <section className="py-28 bg-gradient-to-b from-[#0A0A0F] to-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold bg-purple-500/20 border border-purple-500/30 text-purple-300 mb-8">
                        5 Trụ Cột Chính
                    </div>
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6">
                        Tất Cả Những Gì Bạn Cần
                    </h2>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        Nền tảng tích hợp đầy đủ để tự động hoá mọi tác vụ trên phone farm
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <PremiumFeatureCard
                        icon={<PhoneFarmIcon />}
                        title="Phone Farm Management"
                        description="Quản lý hàng trăm thiết bị từ một dashboard. Theo dõi trạng thái real-time, phân nhóm, gán tác vụ hàng loạt."
                        gradient="from-purple-500 to-purple-600"
                    />
                    <PremiumFeatureCard
                        icon={<WorkflowIcon />}
                        title="Visual Workflow Builder"
                        description="Kéo thả tạo kịch bản tự động. Ghi lại thao tác thật, chỉnh sửa linh hoạt, không cần biết code."
                        gradient="from-blue-500 to-blue-600"
                    />
                    <PremiumFeatureCard
                        icon={<TestKeyIcon />}
                        title="Test Key Integration"
                        description="Hỗ trợ test key cho các ứng dụng. Tự động hoá quá trình review, rating và feedback."
                        gradient="from-cyan-500 to-cyan-600"
                    />
                    <PremiumFeatureCard
                        icon={<ResourceIcon />}
                        title="Resource Care"
                        description="Chăm sóc tài nguyên tự động: warm-up account, nuôi nick, duy trì hoạt động tự nhiên."
                        gradient="from-green-500 to-green-600"
                    />
                    <PremiumFeatureCard
                        icon={<MultiAppIcon />}
                        title="Multi-App Testing"
                        description="Thử nghiệm đa dạng ứng dụng cùng lúc. Chạy song song nhiều workflow trên nhiều app."
                        gradient="from-orange-500 to-orange-600"
                    />
                    <PremiumFeatureCard
                        icon={<AIIcon />}
                        title="AI Content Studio"
                        description="Tích hợp AI tạo nội dung. Tự động sinh text, hình ảnh, video cho các tác vụ automation."
                        gradient="from-pink-500 to-pink-600"
                    />
                </div>
            </div>
        </section>
    );
}

// How It Works Section
function HowItWorksSection() {
    return (
        <section className="py-28 bg-black relative overflow-hidden">
            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(139, 92, 246, 0.3) 1px, transparent 0)`,
                backgroundSize: '48px 48px'
            }}></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
                        Bắt Đầu Trong <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">3 Bước</span>
                    </h2>
                    <p className="text-xl text-gray-400">
                        Triển khai nhanh chóng, không cần cài đặt phức tạp
                    </p>
                </div>

                {/* Steps with connection line */}
                <div className="relative grid md:grid-cols-3 gap-8">
                    {/* Connection Line */}
                    <div className="hidden md:block absolute top-32 left-1/4 right-1/4 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full opacity-30"></div>

                    <PremiumStepCard
                        step="01"
                        title="Cài Đặt Agent"
                        description="Tải và cài đặt CLICKAI Agent lên điện thoại. Kết nối tự động với hệ thống trong vài giây."
                        gradient="from-purple-500 to-purple-600"
                    />
                    <PremiumStepCard
                        step="02"
                        title="Tạo Workflow"
                        description="Ghi lại thao tác thật hoặc kéo thả để xây dựng kịch bản tự động theo nhu cầu."
                        gradient="from-blue-500 to-blue-600"
                    />
                    <PremiumStepCard
                        step="03"
                        title="Chạy Tự Động"
                        description="Lên lịch hoặc chạy ngay. Hệ thống hoạt động 24/7, bạn chỉ cần theo dõi kết quả."
                        gradient="from-cyan-500 to-cyan-600"
                    />
                </div>
            </div>
        </section>
    );
}

// Use Cases Section
function UseCasesSection() {
    return (
        <section className="py-28 bg-gradient-to-b from-black to-[#0A0A0F]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
                        Được Xây Dựng Cho
                    </h2>
                    <p className="text-xl text-gray-400">
                        Giải pháp phù hợp cho nhiều nhu cầu khác nhau
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <PremiumUseCaseCard
                        icon="📱"
                        title="Phone Farm MMO"
                        description="Quản lý dàn máy chuyên nghiệp cho các chiến dịch MMO quy mô lớn"
                        features={["Multi-device control", "Task scheduling", "Performance tracking"]}
                    />
                    <PremiumUseCaseCard
                        icon="⭐"
                        title="Test Key & Review"
                        description="Tự động hoá quá trình test key, review và rating cho ứng dụng"
                        features={["Auto rating", "Review generation", "App installation"]}
                    />
                    <PremiumUseCaseCard
                        icon="🔥"
                        title="Account Warming"
                        description="Nuôi nick tự nhiên với các hoạt động mô phỏng hành vi người thật"
                        features={["Natural behavior", "Random delays", "Activity patterns"]}
                    />
                    <PremiumUseCaseCard
                        icon="🎬"
                        title="Content Automation"
                        description="Tự động đăng bài, tương tác với nội dung được tạo bởi AI"
                        features={["AI content", "Auto posting", "Engagement automation"]}
                    />
                </div>
            </div>
        </section>
    );
}

// Social Proof Section
function SocialProofSection() {
    return (
        <section className="py-28 bg-[#0A0A0F] relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
                        Được <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Tin Dùng</span> Bởi
                    </h2>
                    <p className="text-xl text-gray-400">
                        Hàng nghìn người dùng đang chạy phone farm với CLICKAI
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <PremiumTestimonialCard
                        quote="CLICKAI giúp tôi quản lý 200 máy một cách dễ dàng. Tỷ lệ sống nick tăng từ 70% lên 95% sau 2 tháng sử dụng."
                        name="Nguyễn Văn Minh"
                        role="Farm Manager, 200+ devices"
                        rating={5}
                    />
                    <PremiumTestimonialCard
                        quote="Giao diện kéo thả rất trực quan. Từ người không biết code, giờ tôi có thể tạo workflow phức tạp trong 30 phút."
                        name="Trần Thị Hương"
                        role="Freelancer MMO"
                        rating={5}
                    />
                    <PremiumTestimonialCard
                        quote="Tích hợp AI Studio là điểm nhấn. Tự động tạo content độc đáo cho từng tài khoản, không bị trùng lặp."
                        name="Lê Hoàng Nam"
                        role="Content Team Lead"
                        rating={5}
                    />
                </div>
            </div>
        </section>
    );
}

// Final CTA Section
function FinalCTASection() {
    return (
        <section className="relative py-32 overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30"></div>

            {/* Animated Pattern */}
            <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                backgroundSize: '40px 40px'
            }}></div>

            {/* Floating Orbs */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-400 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-8 leading-tight">
                    Sẵn Sàng Tự Động Hoá<br />
                    <span className="bg-gradient-to-r from-cyan-200 to-white bg-clip-text text-transparent">Phone Farm Của Bạn?</span>
                </h2>
                <p className="text-xl sm:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
                    Đăng ký dùng thử miễn phí 14 ngày. Không cần thẻ tín dụng.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <Link
                        href="/register"
                        className="group relative inline-flex items-center justify-center px-12 py-6 text-xl font-extrabold text-purple-600 bg-white hover:bg-gray-50 rounded-2xl overflow-hidden transition-all duration-300 shadow-2xl hover:shadow-white/20 hover:-translate-y-1"
                    >
                        <span className="relative flex items-center gap-3">
                            Bắt Đầu Miễn Phí
                            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </span>
                    </Link>
                    <Link
                        href="/pricing"
                        className="inline-flex items-center justify-center px-12 py-6 text-xl font-bold text-white bg-white/20 hover:bg-white/30 backdrop-blur-xl rounded-2xl border-2 border-white/40 hover:border-white/60 transition-all duration-300"
                    >
                        Xem Bảng Giá
                    </Link>
                </div>

                {/* Trust Badges */}
                <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-white/80">
                    <div className="flex items-center gap-2">
                        <svg className="w-6 h-6 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold">14 ngày dùng thử</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-6 h-6 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold">Không cần thẻ tín dụng</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-6 h-6 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold">Hỗ trợ 24/7</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Premium Step Card
function PremiumStepCard({ step, title, description, gradient }) {
    return (
        <div className="relative text-center group">
            {/* Glow Effect */}
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity`}></div>

            {/* Step Number */}
            <div className={`relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br ${gradient} text-white text-3xl font-extrabold rounded-2xl mb-8 shadow-2xl z-10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                {step}
            </div>

            {/* Content */}
            <h3 className="text-2xl font-extrabold text-white mb-4">{title}</h3>
            <p className="text-gray-400 leading-relaxed max-w-sm mx-auto">{description}</p>
        </div>
    );
}

// Premium Use Case Card
function PremiumUseCaseCard({ icon, title, description, features }) {
    return (
        <div className="group relative">
            {/* Glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity"></div>

            {/* Card */}
            <div className="relative p-8 bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-800 group-hover:border-purple-500/50 transition-all duration-500 group-hover:-translate-y-2 shadow-2xl h-full flex flex-col">
                {/* Icon */}
                <div className="text-5xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">{icon}</div>

                {/* Title */}
                <h3 className="text-xl font-extrabold text-white mb-3">{title}</h3>

                {/* Description */}
                <p className="text-sm text-gray-400 mb-6 leading-relaxed flex-grow">{description}</p>

                {/* Features */}
                <ul className="space-y-2">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-xs text-gray-500">
                            <svg className="w-4 h-4 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="font-medium">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

// Premium Testimonial Card
function PremiumTestimonialCard({ quote, name, role, rating }) {
    return (
        <div className="group relative">
            {/* Glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity"></div>

            {/* Card */}
            <div className="relative p-10 bg-gradient-to-br from-gray-900 to-gray-950 backdrop-blur-xl rounded-3xl border border-gray-800 group-hover:border-purple-500/50 shadow-2xl transition-all duration-500 group-hover:-translate-y-2 h-full flex flex-col">
                {/* Stars */}
                <div className="flex gap-1 mb-6">
                    {[...Array(rating)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    ))}
                </div>

                {/* Quote */}
                <p className="text-gray-300 mb-8 italic leading-relaxed flex-grow text-lg">"{quote}"</p>

                {/* Author */}
                <div className="flex items-center gap-4">
                    {/* Avatar Placeholder */}
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {name[0]}
                    </div>

                    <div>
                        <div className="font-bold text-white text-lg">{name}</div>
                        <div className="text-sm text-gray-500 font-medium">{role}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
function PhoneFarmIcon() {
    return (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    );
}

function WorkflowIcon() {
    return (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
    );
}

function TestKeyIcon() {
    return (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
    );
}

function ResourceIcon() {
    return (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
    );
}

function MultiAppIcon() {
    return (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
    );
}

function AIIcon() {
    return (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
    );
}

// Premium Feature Card
function PremiumFeatureCard({ icon, title, description, gradient }) {
    return (
        <div className="group relative">
            {/* Glow Effect */}
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500`}></div>

            {/* Card */}
            <div className="relative p-8 bg-gradient-to-br from-gray-900/90 to-gray-950/90 backdrop-blur-xl rounded-3xl border border-white/10 group-hover:border-purple-500/30 transition-all duration-500 group-hover:scale-[1.02] group-hover:-translate-y-2 shadow-2xl h-full flex flex-col">
                {/* Floating Icon */}
                <div className={`relative w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br ${gradient} shadow-xl shadow-purple-500/30 flex items-center justify-center transform group-hover:scale-110 group-hover:-translate-y-2 group-hover:rotate-3 transition-all duration-300`}>
                    {icon}
                </div>

                {/* Content */}
                <h3 className="text-2xl font-extrabold text-white mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {title}
                </h3>
                <p className="text-gray-400 leading-relaxed flex-grow">{description}</p>

                {/* Decorative corner */}
                <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-xl"></div>
            </div>
        </div>
    );
}
