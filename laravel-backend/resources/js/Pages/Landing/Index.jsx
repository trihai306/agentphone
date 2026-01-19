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

            {/* Hero Section - Startup 2026 */}
            <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-900">
                {/* Animated Background Blobs */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute top-1/3 -right-32 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left: Content */}
                        <div className="text-center lg:text-left">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full px-5 py-2 mb-8 backdrop-blur-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-sm font-medium text-purple-200">Startup 2026 • Phone Farm Automation</span>
                            </div>

                            {/* Hero Title */}
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 tracking-tight">
                                Tự Động Hoá
                                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                                    Phone Farm
                                </span>
                                <span className="block text-3xl sm:text-4xl lg:text-5xl mt-2 text-gray-300 font-bold">
                                    Như Người Thật
                                </span>
                            </h1>

                            {/* Hero Description */}
                            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0">
                                Nền tảng kéo thả workflow chuyên nghiệp cho <span className="text-purple-300 font-semibold">nuôi nick</span>,
                                <span className="text-blue-300 font-semibold"> test key</span>,
                                <span className="text-cyan-300 font-semibold"> chăm sóc tài nguyên</span>.
                                Hoạt động 24/7 không cần giám sát.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link
                                    href="/register"
                                    className="group inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-2xl transition-all shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 hover:-translate-y-1"
                                >
                                    Dùng Thử Miễn Phí
                                    <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                                <Link
                                    href="/features"
                                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl border border-white/20 transition-all"
                                >
                                    <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Xem Demo
                                </Link>
                            </div>

                            {/* Trust Indicators */}
                            <div className="mt-12 flex items-center gap-8 justify-center lg:justify-start text-gray-400">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm">Không cần code</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm">Setup 5 phút</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm">Miễn phí 14 ngày</span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Phone Farm Grid Visual */}
                        <div className="hidden lg:block">
                            <PhoneFarmGrid />
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section - Investor Focused */}
            <section className="py-16 bg-gray-900 border-y border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        <StatCard
                            number={activeDevices.toLocaleString()}
                            label="Thiết bị đang chạy"
                            icon="devices"
                            color="purple"
                            live={true}
                        />
                        <StatCard
                            number="99.9%"
                            label="Độ ổn định hệ thống"
                            icon="shield"
                            color="green"
                        />
                        <StatCard
                            number={dailyActions.toLocaleString()}
                            label="Thao tác mỗi ngày"
                            icon="zap"
                            color="blue"
                            live={true}
                        />
                        <StatCard
                            number="98%"
                            label="Tỷ lệ sống nick"
                            icon="heart"
                            color="pink"
                        />
                    </div>
                </div>
            </section>

            {/* Why 2026? - Market Timing */}
            <section className="py-24 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
                {/* Animated Grid */}
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }}></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="inline-flex items-center px-5 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 mb-6">
                            🚀 Thời Điểm Vàng
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                            Tại Sao <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">2026</span> Là Năm Bùng Nổ?
                        </h2>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                            Sự hội tụ hoàn hảo của công nghệ, thị trường và nhu cầu tạo nên cơ hội chưa từng có
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <TimelineCard
                            year="2024"
                            title="Nền Tảng"
                            description="AI Generative bùng nổ. Chi phí automation giảm 70%. Nhu cầu phone farm tăng mạnh."
                            items={["ChatGPT-4 release", "Cost reduction", "Market demand surge"]}
                            color="gray"
                            past={true}
                        />
                        <TimelineCard
                            year="2025"
                            title="Xây Dựng"
                            description="CLICKAI hoàn thiện core platform. First customers. Product-market fit validation."
                            items={["Core platform done", "100+ beta users", "PMF achieved"]}
                            color="purple"
                            current={true}
                        />
                        <TimelineCard
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

            {/* Market Opportunity */}
            <section className="py-24 bg-black relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="inline-flex items-center px-5 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-300 mb-6">
                            💰 Cơ Hội Thị Trường
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                            Thị Trường <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">$2.5 Tỷ USD</span>
                        </h2>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 mb-16">
                        <MarketCard
                            title="TAM"
                            subtitle="Total Addressable Market"
                            value="$2.5B"
                            description="Thị trường Phone Farm & Mobile Automation toàn cầu"
                            color="purple"
                        />
                        <MarketCard
                            title="SAM"
                            subtitle="Serviceable Available Market"
                            value="$400M"
                            description="Đông Nam Á - Thị trường phone farm sôi động nhất"
                            color="blue"
                        />
                        <MarketCard
                            title="SOM"
                            subtitle="Serviceable Obtainable Market"
                            value="$50M"
                            description="Việt Nam - Thị trường ngách với tăng trưởng 40%/năm"
                            color="cyan"
                        />
                    </div>

                    {/* Growth Chart Visual */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border border-gray-700">
                        <div className="flex items-end justify-between h-48 gap-4">
                            {[
                                { year: '2023', height: '20%', value: '$180M' },
                                { year: '2024', height: '35%', value: '$280M' },
                                { year: '2025', height: '55%', value: '$350M' },
                                { year: '2026', height: '80%', value: '$480M', highlight: true },
                                { year: '2027', height: '100%', value: '$600M' },
                            ].map((item, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center">
                                    <span className={`text-xs font-bold mb-2 ${item.highlight ? 'text-cyan-400' : 'text-gray-400'}`}>
                                        {item.value}
                                    </span>
                                    <div
                                        className={`w-full rounded-t-lg transition-all ${item.highlight
                                            ? 'bg-gradient-to-t from-cyan-600 to-purple-500 shadow-lg shadow-cyan-500/30'
                                            : 'bg-gradient-to-t from-gray-700 to-gray-600'
                                            }`}
                                        style={{ height: item.height }}
                                    ></div>
                                    <span className={`text-sm mt-2 font-semibold ${item.highlight ? 'text-cyan-400' : 'text-gray-500'}`}>
                                        {item.year}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="text-center text-gray-400 mt-6">
                            Dự báo tăng trưởng thị trường Phone Farm Việt Nam (CAGR 35%)
                        </p>
                    </div>
                </div>
            </section>

            {/* Technology Stack */}
            <section className="py-24 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
                {/* Tech Grid Background */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="inline-flex items-center px-5 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-300 mb-6">
                            ⚡ Công Nghệ Đột Phá
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                            Tech Stack <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Thế Hệ Mới</span>
                        </h2>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                            Kiến trúc được thiết kế để scale và tích hợp AI từ ngày đầu
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <TechCard
                            icon="🤖"
                            title="AI-First"
                            description="Tích hợp GPT-4, Gemini, và các model AI mới nhất để tạo content, nhận diện UI"
                            techs={["OpenAI", "Gemini", "Vision AI"]}
                        />
                        <TechCard
                            icon="⚡"
                            title="Real-time"
                            description="WebSocket bidirectional với độ trễ < 50ms. Điều khiển hàng trăm device cùng lúc"
                            techs={["Soketi", "Laravel Echo", "React"]}
                        />
                        <TechCard
                            icon="📱"
                            title="Native Agent"
                            description="Android Agent tối ưu, hoạt động như người thật, bypass detection"
                            techs={["Kotlin", "Accessibility", "ADB"]}
                        />
                        <TechCard
                            icon="🔄"
                            title="No-Code"
                            description="Visual workflow builder với recording mode. Không cần biết code vẫn tự động hoá được"
                            techs={["ReactFlow", "Drag & Drop", "Record"]}
                        />
                    </div>
                </div>
            </section>

            {/* 5 Core Features */}
            <section className="py-24 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 mb-4">
                            5 Trụ Cột Chính
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Tất Cả Những Gì Bạn Cần
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                            Nền tảng tích hợp đầy đủ để tự động hoá mọi tác vụ trên phone farm
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<PhoneFarmIcon />}
                            title="Phone Farm Management"
                            description="Quản lý hàng trăm thiết bị từ một dashboard. Theo dõi trạng thái real-time, phân nhóm, gán tác vụ hàng loạt."
                            color="purple"
                        />
                        <FeatureCard
                            icon={<WorkflowIcon />}
                            title="Visual Workflow Builder"
                            description="Kéo thả tạo kịch bản tự động. Ghi lại thao tác thật, chỉnh sửa linh hoạt, không cần biết code."
                            color="blue"
                        />
                        <FeatureCard
                            icon={<TestKeyIcon />}
                            title="Test Key Integration"
                            description="Hỗ trợ test key cho các ứng dụng. Tự động hoá quá trình review, rating và feedback."
                            color="cyan"
                        />
                        <FeatureCard
                            icon={<ResourceIcon />}
                            title="Resource Care"
                            description="Chăm sóc tài nguyên tự động: warm-up account, nuôi nick, duy trì hoạt động tự nhiên."
                            color="green"
                        />
                        <FeatureCard
                            icon={<MultiAppIcon />}
                            title="Multi-App Testing"
                            description="Thử nghiệm đa dạng ứng dụng cùng lúc. Chạy song song nhiều workflow trên nhiều app."
                            color="orange"
                        />
                        <FeatureCard
                            icon={<AIIcon />}
                            title="AI Content Studio"
                            description="Tích hợp AI tạo nội dung. Tự động sinh text, hình ảnh, video cho các tác vụ automation."
                            color="pink"
                        />
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Bắt Đầu Trong 3 Bước
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-400">
                            Triển khai nhanh chóng, không cần cài đặt phức tạp
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connection Line */}
                        <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500"></div>

                        <StepCard
                            step="01"
                            title="Cài Đặt Agent"
                            description="Tải và cài đặt CLICKAI Agent lên điện thoại. Kết nối tự động với hệ thống trong vài giây."
                            color="purple"
                        />
                        <StepCard
                            step="02"
                            title="Tạo Workflow"
                            description="Ghi lại thao tác thật hoặc kéo thả để xây dựng kịch bản tự động theo nhu cầu."
                            color="blue"
                        />
                        <StepCard
                            step="03"
                            title="Chạy Tự Động"
                            description="Lên lịch hoặc chạy ngay. Hệ thống hoạt động 24/7, bạn chỉ cần theo dõi kết quả."
                            color="cyan"
                        />
                    </div>
                </div>
            </section>

            {/* Use Cases */}
            <section className="py-24 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Được Xây Dựng Cho
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-400">
                            Giải pháp phù hợp cho nhiều nhu cầu khác nhau
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <UseCaseCard
                            icon="📱"
                            title="Phone Farm MMO"
                            description="Quản lý dàn máy chuyên nghiệp cho các chiến dịch MMO quy mô lớn"
                            features={["Multi-device control", "Task scheduling", "Performance tracking"]}
                        />
                        <UseCaseCard
                            icon="⭐"
                            title="Test Key & Review"
                            description="Tự động hoá quá trình test key, review và rating cho ứng dụng"
                            features={["Auto rating", "Review generation", "App installation"]}
                        />
                        <UseCaseCard
                            icon="🔥"
                            title="Account Warming"
                            description="Nuôi nick tự nhiên với các hoạt động mô phỏng hành vi người thật"
                            features={["Natural behavior", "Random delays", "Activity patterns"]}
                        />
                        <UseCaseCard
                            icon="🎬"
                            title="Content Automation"
                            description="Tự động đăng bài, tương tác với nội dung được tạo bởi AI"
                            features={["AI content", "Auto posting", "Engagement automation"]}
                        />
                    </div>
                </div>
            </section>

            {/* Social Proof */}
            <section className="py-24 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Được Tin Dùng Bởi
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-400">
                            Hàng nghìn người dùng đang chạy phone farm với CLICKAI
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <TestimonialCard
                            quote="CLICKAI giúp tôi quản lý 200 máy một cách dễ dàng. Tỷ lệ sống nick tăng từ 70% lên 95% sau 2 tháng sử dụng."
                            name="Nguyễn Văn Minh"
                            role="Farm Manager, 200+ devices"
                            rating={5}
                        />
                        <TestimonialCard
                            quote="Giao diện kéo thả rất trực quan. Từ người không biết code, giờ tôi có thể tạo workflow phức tạp trong 30 phút."
                            name="Trần Thị Hương"
                            role="Freelancer MMO"
                            rating={5}
                        />
                        <TestimonialCard
                            quote="Tích hợp AI Studio là điểm nhấn. Tự động tạo content độc đáo cho từng tài khoản, không bị trùng lặp."
                            name="Lê Hoàng Nam"
                            role="Content Team Lead"
                            rating={5}
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-24 overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)`,
                    backgroundSize: '32px 32px'
                }}></div>

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                        Sẵn Sàng Tự Động Hoá<br />Phone Farm Của Bạn?
                    </h2>
                    <p className="text-xl text-white/90 mb-10">
                        Đăng ký dùng thử miễn phí 14 ngày. Không cần thẻ tín dụng.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/register"
                            className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-purple-600 bg-white hover:bg-gray-50 rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                        >
                            Bắt Đầu Miễn Phí
                            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                        <Link
                            href="/pricing"
                            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-white/20 hover:bg-white/30 backdrop-blur rounded-2xl border border-white/30 transition-all"
                        >
                            Xem Bảng Giá
                        </Link>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}

// Phone Farm Grid Visual Component
function PhoneFarmGrid() {
    const devices = [
        { status: 'running', progress: 78 },
        { status: 'online', progress: 100 },
        { status: 'running', progress: 45 },
        { status: 'idle', progress: 0 },
        { status: 'running', progress: 92 },
        { status: 'online', progress: 100 },
    ];

    const statusConfig = {
        running: { color: 'bg-green-500', pulse: true, text: 'Đang chạy' },
        online: { color: 'bg-blue-500', pulse: false, text: 'Sẵn sàng' },
        idle: { color: 'bg-gray-500', pulse: false, text: 'Đợi' },
    };

    return (
        <div className="relative">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-3xl"></div>

            <div className="relative grid grid-cols-3 gap-4 p-6">
                {devices.map((device, index) => {
                    const config = statusConfig[device.status];
                    return (
                        <div
                            key={index}
                            className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 transform hover:scale-105 transition-all"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Phone Frame */}
                            <div className="aspect-[9/16] bg-gray-900 rounded-xl relative overflow-hidden">
                                {/* Screen Content */}
                                <div className="absolute inset-2 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg flex flex-col items-center justify-center">
                                    {/* App Icon */}
                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg mb-2"></div>

                                    {/* Progress */}
                                    {device.status === 'running' && (
                                        <div className="w-full px-3 mt-2">
                                            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                                                    style={{ width: `${device.progress}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-[8px] text-gray-500 text-center mt-1">{device.progress}%</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center justify-center gap-1.5 mt-3">
                                <span className={`relative flex h-2 w-2 ${config.color} rounded-full`}>
                                    {config.pulse && (
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75`}></span>
                                    )}
                                </span>
                                <span className="text-xs text-gray-400">{config.text}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Stats Card
function StatCard({ number, label, icon, color, live }) {
    const colorClasses = {
        purple: 'from-purple-500 to-purple-600',
        green: 'from-green-500 to-green-600',
        blue: 'from-blue-500 to-blue-600',
        pink: 'from-pink-500 to-pink-600',
    };

    const icons = {
        devices: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
        shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
        zap: "M13 10V3L4 14h7v7l9-11h-7z",
        heart: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    };

    return (
        <div className="text-center group">
            <div className={`relative w-14 h-14 mx-auto bg-gradient-to-br ${colorClasses[color]} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
                </svg>
                {live && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                )}
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{number}</div>
            <div className="flex items-center justify-center gap-1.5 text-gray-400 text-sm">
                {live && (
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                )}
                {label}
            </div>
        </div>
    );
}


// Feature Card
function FeatureCard({ icon, title, description, color }) {
    const colorClasses = {
        purple: 'from-purple-500 to-purple-600 group-hover:shadow-purple-500/30',
        blue: 'from-blue-500 to-blue-600 group-hover:shadow-blue-500/30',
        cyan: 'from-cyan-500 to-cyan-600 group-hover:shadow-cyan-500/30',
        green: 'from-green-500 to-green-600 group-hover:shadow-green-500/30',
        orange: 'from-orange-500 to-orange-600 group-hover:shadow-orange-500/30',
        pink: 'from-pink-500 to-pink-600 group-hover:shadow-pink-500/30',
    };

    return (
        <div className="group relative p-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-transparent hover:bg-white dark:hover:bg-gray-800 transition-all hover:-translate-y-2 hover:shadow-2xl">
            <div className={`w-14 h-14 bg-gradient-to-br ${colorClasses[color]} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg ${colorClasses[color]}`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
        </div>
    );
}

// Step Card
function StepCard({ step, title, description, color }) {
    const colorClasses = {
        purple: 'from-purple-500 to-purple-600',
        blue: 'from-blue-500 to-blue-600',
        cyan: 'from-cyan-500 to-cyan-600',
    };

    return (
        <div className="text-center relative">
            <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${colorClasses[color]} text-white text-2xl font-bold rounded-2xl mb-6 shadow-xl relative z-10`}>
                {step}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{description}</p>
        </div>
    );
}

// Use Case Card
function UseCaseCard({ icon, title, description, features }) {
    return (
        <div className="group p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>
            <ul className="space-y-2">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                    </li>
                ))}
            </ul>
        </div>
    );
}

// Testimonial Card
function TestimonialCard({ quote, name, role, rating }) {
    return (
        <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
            {/* Stars */}
            <div className="flex gap-1 mb-4">
                {[...Array(rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6 italic">"{quote}"</p>
            <div>
                <div className="font-semibold text-gray-900 dark:text-white">{name}</div>
                <div className="text-sm text-gray-500">{role}</div>
            </div>
        </div>
    );
}

// Icon Components
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

// Timeline Card for Why 2026 section
function TimelineCard({ year, title, description, items, color, past, current, future }) {
    const colorClasses = {
        gray: 'from-gray-600 to-gray-700 border-gray-600',
        purple: 'from-purple-500 to-purple-600 border-purple-500',
        cyan: 'from-cyan-500 to-cyan-600 border-cyan-500',
    };

    return (
        <div className={`relative p-8 rounded-2xl border-2 transition-all ${current ? 'bg-purple-500/10 border-purple-500 scale-105' :
            future ? 'bg-cyan-500/5 border-cyan-500/50' :
                'bg-gray-800/50 border-gray-700'
            }`}>
            {current && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-500 rounded-full text-xs font-bold text-white">
                    ĐÂY RỒI
                </div>
            )}
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${colorClasses[color]} text-white text-2xl font-bold mb-6`}>
                {year}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-gray-400 mb-4">{description}</p>
            <ul className="space-y-2">
                {items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className={`w-4 h-4 ${current ? 'text-purple-400' : future ? 'text-cyan-400' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}

// Market Card for TAM/SAM/SOM section
function MarketCard({ title, subtitle, value, description, color }) {
    const colorClasses = {
        purple: 'from-purple-500 to-purple-600',
        blue: 'from-blue-500 to-blue-600',
        cyan: 'from-cyan-500 to-cyan-600',
    };

    return (
        <div className="group p-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 hover:border-gray-600 transition-all hover:-translate-y-2">
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
                    <span className="text-white font-bold text-sm">{title}</span>
                </div>
                <span className="text-xs text-gray-500 uppercase tracking-wider">{subtitle}</span>
            </div>
            <div className={`text-4xl font-bold bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent mb-3`}>
                {value}
            </div>
            <p className="text-gray-400 text-sm">{description}</p>
        </div>
    );
}

// Tech Card for Technology Stack section
function TechCard({ icon, title, description, techs }) {
    return (
        <div className="group p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 hover:border-purple-500/50 transition-all hover:-translate-y-1">
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400 mb-4">{description}</p>
            <div className="flex flex-wrap gap-2">
                {techs.map((tech, i) => (
                    <span key={i} className="px-3 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700">
                        {tech}
                    </span>
                ))}
            </div>
        </div>
    );
}
