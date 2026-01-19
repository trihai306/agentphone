import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LandingLayout from '../../Layouts/LandingLayout';
import SeoHead from '../../Components/SeoHead';

export default function Index({ stats, team }) {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState({});
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <LandingLayout>
            <SeoHead
                title="Về Chúng Tôi - CLICKAI"
                description="Tìm hiểu về CLICKAI - đội ngũ và sứ mệnh của chúng tôi. Kiến tạo tương lai số, đơn giản hoá quản lý thiết bị cho mọi doanh nghiệp từ năm 2020."
                keywords="về clickai, about us, đội ngũ, sứ mệnh, lịch sử phát triển"
                url="https://clickai.vn/about"
            />
            {/* Hero Section - Premium Glassmorphic Design */}
            <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
                {/* Animated Background Orbs */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px]" />
                </div>

                {/* Floating Particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(30)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-white/40 rounded-full animate-float"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 6}s`,
                                animationDuration: `${4 + Math.random() * 4}s`
                            }}
                        />
                    ))}
                </div>

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                     linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }} />

                {/* Hero Content */}
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 mb-8 group hover:bg-white/10 transition-all duration-300">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        <span className="text-sm font-medium text-purple-200">{t('about.about_us', { defaultValue: 'Về Chúng Tôi' })}</span>
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight">
                        <span className="block">{t('about.hero_title_1', { defaultValue: 'Kiến Tạo' })}</span>
                        <span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]">
                            {t('about.hero_title_2', { defaultValue: 'Tương Lai Số' })}
                        </span>
                    </h1>

                    <p className="text-xl sm:text-2xl text-gray-300/90 max-w-3xl mx-auto leading-relaxed mb-12">
                        {t('about.hero_desc', { defaultValue: 'Chúng tôi xây dựng nền tảng quản lý thiết bị thông minh, giúp doanh nghiệp tối ưu hóa hiệu suất và vận hành trơn tru.' })}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="/register"
                            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white overflow-hidden rounded-2xl transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 transition-all duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" />
                            <span className="relative flex items-center gap-2">
                                {t('about.get_started', { defaultValue: 'Bắt Đầu Ngay' })}
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </span>
                        </a>
                        <a
                            href="/contact"
                            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                        >
                            {t('about.contact_us', { defaultValue: 'Liên Hệ Tư Vấn' })}
                        </a>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
                        <div className="w-1.5 h-3 bg-white/50 rounded-full animate-pulse" />
                    </div>
                </div>
            </section>

            {/* Stats Section - Premium Glass Cards */}
            <section className="relative py-24 bg-white dark:bg-gray-900 overflow-hidden">
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                    backgroundSize: '32px 32px'
                }} />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-3">
                            {t('about.achievements', { defaultValue: 'Thành Tựu' })}
                        </h2>
                        <h3 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
                            {t('about.impressive_numbers', { defaultValue: 'Con Số Ấn Tượng' })}
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                        {stats.map((stat, index) => (
                            <StatCard key={index} stat={stat} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission Section - Split Design */}
            <section className="relative py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Content Side */}
                        <div className="order-2 lg:order-1">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-6">
                                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{t('about.mission', { defaultValue: 'Sứ Mệnh' })}</span>
                            </div>

                            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                                {t('about.simplify', { defaultValue: 'Đơn Giản Hóa' })}
                                <span className="text-purple-600 dark:text-purple-400"> {t('about.device_management', { defaultValue: 'Quản Lý Thiết Bị' })}</span>
                            </h2>

                            <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                                <p>
                                    DeviceHub ra đời từ năm 2020 với một tầm nhìn rõ ràng: biến quản lý thiết bị
                                    trở nên đơn giản và hiệu quả cho mọi doanh nghiệp, bất kể quy mô.
                                </p>
                                <p>
                                    Chúng tôi tin rằng công nghệ mạnh mẽ không nhất thiết phải phức tạp.
                                    Đó là lý do chúng tôi xây dựng một nền tảng kết hợp sức mạnh với sự thân thiện.
                                </p>
                            </div>

                            {/* Feature Points */}
                            <div className="mt-10 grid grid-cols-2 gap-6">
                                <FeaturePoint icon="shield" text="Bảo mật cấp doanh nghiệp" />
                                <FeaturePoint icon="clock" text="Hoạt động 24/7" />
                                <FeaturePoint icon="globe" text="Hỗ trợ toàn cầu" />
                                <FeaturePoint icon="zap" text="Công nghệ tiên tiến" />
                            </div>
                        </div>

                        {/* Visual Side - 3D Card Stack */}
                        <div className="order-1 lg:order-2 relative">
                            <div className="relative aspect-square max-w-lg mx-auto">
                                {/* Background Cards */}
                                <div className="absolute inset-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl transform rotate-6 blur-sm" />
                                <div className="absolute inset-4 bg-gradient-to-br from-blue-500/20 to-pink-500/20 rounded-3xl transform -rotate-3 blur-sm" />

                                {/* Main Card */}
                                <div className="relative h-full bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-3xl p-8 flex flex-col items-center justify-center text-white shadow-2xl">
                                    <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-8 animate-float">
                                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-3xl font-bold mb-3">DeviceHub</h3>
                                    <p className="text-white/80 text-center text-lg">
                                        Nền tảng quản lý thiết bị<br />thế hệ mới
                                    </p>

                                    {/* Decorative Elements */}
                                    <div className="absolute top-6 right-6 w-16 h-16 border border-white/20 rounded-full" />
                                    <div className="absolute bottom-6 left-6 w-12 h-12 border border-white/20 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Timeline Section - Modern Vertical Design */}
            <section className="py-24 bg-white dark:bg-gray-900 overflow-hidden">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-3">
                            Lịch Sử
                        </h2>
                        <h3 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
                            Hành Trình Phát Triển
                        </h3>
                    </div>

                    <div className="relative">
                        {/* Vertical Line */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-purple-500 via-blue-500 to-pink-500 rounded-full" />

                        <div className="space-y-16">
                            <TimelineItem
                                year="2020"
                                title="Khởi Nguồn"
                                description="DeviceHub được thành lập với tầm nhìn cách mạng hóa quản lý thiết bị di động."
                                icon="rocket"
                                position="left"
                            />
                            <TimelineItem
                                year="2021"
                                title="Cột Mốc 1.000 Người Dùng"
                                description="Đạt 1.000 người dùng đầu tiên từ 20+ quốc gia khác nhau."
                                icon="users"
                                position="right"
                            />
                            <TimelineItem
                                year="2022"
                                title="Vòng Gọi Vốn Series A"
                                description="Huy động vốn thành công để mở rộng đội ngũ và phát triển sản phẩm."
                                icon="chart"
                                position="left"
                            />
                            <TimelineItem
                                year="2023"
                                title="Ra Mắt Phiên Bản Doanh Nghiệp"
                                description="Giới thiệu các tính năng doanh nghiệp bao gồm SSO và bảo mật nâng cao."
                                icon="building"
                                position="right"
                            />
                            <TimelineItem
                                year="2024"
                                title="Mở Rộng Toàn Cầu"
                                description="Phục vụ khách hàng tại hơn 120 quốc gia trên toàn thế giới."
                                icon="globe"
                                position="left"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section - Hexagon/Card Grid */}
            <section className="py-24 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-3">
                            Giá Trị Cốt Lõi
                        </h2>
                        <h3 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Điều Chúng Tôi Tin Tưởng
                        </h3>
                        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Những nguyên tắc định hướng mọi quyết định và hành động của chúng tôi
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <ValueCard
                            icon="heart"
                            title="Khách Hàng Là Trọng Tâm"
                            description="Mọi quyết định đều bắt đầu từ khách hàng. Thành công của họ chính là thành công của chúng tôi."
                            gradient="from-rose-500 to-pink-600"
                        />
                        <ValueCard
                            icon="lightbulb"
                            title="Đổi Mới Không Ngừng"
                            description="Chúng tôi không ngừng đột phá giới hạn để mang đến những giải pháp tiên tiến nhất."
                            gradient="from-amber-500 to-orange-600"
                        />
                        <ValueCard
                            icon="shield"
                            title="Chính Trực & Minh Bạch"
                            description="Xây dựng niềm tin thông qua sự minh bạch, trung thực và đạo đức trong kinh doanh."
                            gradient="from-emerald-500 to-teal-600"
                        />
                    </div>
                </div>
            </section>

            {/* Team Section - Modern Card Design */}
            <section className="py-24 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-3">
                            Đội Ngũ
                        </h2>
                        <h3 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Những Người Đồng Hành
                        </h3>
                        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Đội ngũ tài năng và nhiệt huyết đứng sau DeviceHub
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {team.map((member, index) => (
                            <TeamMemberCard key={index} member={member} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section - Premium Gradient */}
            <section className="relative py-32 overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900" />

                {/* Animated Orbs */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
                </div>

                {/* Content */}
                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                        {t('about.ready_to_start', { defaultValue: 'Sẵn Sàng Bắt Đầu?' })}
                    </h2>
                    <p className="text-xl text-purple-200 mb-12 max-w-2xl mx-auto">
                        Tham gia cùng hàng nghìn doanh nghiệp đã tin tưởng DeviceHub
                        để quản lý hệ thống thiết bị của họ.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="/register"
                            className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-purple-900 bg-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                        >
                            {t('about.try_free', { defaultValue: 'Dùng Thử Miễn Phí' })}
                            <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </a>
                        <a
                            href="/contact"
                            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300"
                        >
                            {t('about.book_demo', { defaultValue: 'Đặt Lịch Demo' })}
                        </a>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}

// ============================================
// Sub Components
// ============================================

function StatCard({ stat, index }) {
    const gradients = [
        'from-purple-500 to-indigo-600',
        'from-blue-500 to-cyan-600',
        'from-emerald-500 to-teal-600',
        'from-orange-500 to-pink-600'
    ];

    return (
        <div className="group relative p-8 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
            {/* Hover Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index % gradients.length]} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

            {/* Counter */}
            <div className={`text-5xl lg:text-6xl font-bold bg-gradient-to-r ${gradients[index % gradients.length]} bg-clip-text text-transparent mb-3 group-hover:scale-110 transform transition-transform duration-500 origin-left`}>
                {stat.value}
            </div>

            <div className="text-gray-600 dark:text-gray-400 font-medium text-lg">
                {stat.label}
            </div>

            {/* Decorative Corner */}
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br ${gradients[index % gradients.length]} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />
        </div>
    );
}

function FeaturePoint({ icon, text }) {
    const icons = {
        shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
        clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
        globe: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
        zap: "M13 10V3L4 14h7v7l9-11h-7z"
    };

    return (
        <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
                </svg>
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">{text}</span>
        </div>
    );
}

function TimelineItem({ year, title, description, icon, position }) {
    const icons = {
        rocket: "M13 10V3L4 14h7v7l9-11h-7z",
        users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
        chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
        building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
        globe: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
    };

    return (
        <div className={`flex items-center gap-8 ${position === 'right' ? 'flex-row-reverse' : ''}`}>
            {/* Content */}
            <div className={`flex-1 ${position === 'right' ? 'text-left' : 'text-right'}`}>
                <div className={`inline-block p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 group max-w-md ${position === 'left' ? 'ml-auto' : ''}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{year}</span>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">{description}</p>
                </div>
            </div>

            {/* Center Dot */}
            <div className="relative flex-shrink-0">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 border-4 border-white dark:border-gray-900 shadow-lg z-10 relative" />
                <div className="absolute inset-0 w-5 h-5 rounded-full bg-purple-500 animate-ping opacity-20" />
            </div>

            {/* Empty Space */}
            <div className="flex-1" />
        </div>
    );
}

function ValueCard({ icon, title, description, gradient }) {
    const icons = {
        heart: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
        lightbulb: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
        shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    };

    return (
        <div className="group relative p-8 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
            {/* Background Gradient on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

            {/* Icon */}
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
                </svg>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {description}
            </p>

            {/* Decorative */}
            <div className={`absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br ${gradient} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity duration-500`} />
        </div>
    );
}

function TeamMemberCard({ member, index }) {
    const gradients = [
        'from-purple-500 to-indigo-600',
        'from-blue-500 to-cyan-600',
        'from-emerald-500 to-teal-600',
        'from-rose-500 to-pink-600',
        'from-amber-500 to-orange-600',
        'from-violet-500 to-purple-600'
    ];

    return (
        <div className="group relative p-8 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden text-center">
            {/* Avatar */}
            <div className="relative inline-block mb-6">
                <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl`}>
                    <span className="text-4xl font-bold text-white">
                        {member.name.charAt(0)}
                    </span>
                </div>

                {/* Online Status */}
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {member.name}
            </h3>
            <p className={`font-semibold bg-gradient-to-r ${gradients[index % gradients.length]} bg-clip-text text-transparent mb-4`}>
                {member.role}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {member.bio}
            </p>

            {/* Social Links */}
            <div className="flex justify-center gap-3 mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <SocialButton icon="linkedin" />
                <SocialButton icon="twitter" />
                <SocialButton icon="github" />
            </div>

            {/* Decorative Gradient */}
            <div className={`absolute -bottom-8 -right-8 w-40 h-40 bg-gradient-to-br ${gradients[index % gradients.length]} opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity duration-500`} />
        </div>
    );
}

function SocialButton({ icon }) {
    const icons = {
        linkedin: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z",
        twitter: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z",
        github: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"
    };

    return (
        <button className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
            </svg>
        </button>
    );
}
