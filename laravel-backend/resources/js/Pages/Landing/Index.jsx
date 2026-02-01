import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import LandingLayout from '../../Layouts/LandingLayout';
import SeoHead, { schemas } from '../../Components/SeoHead';

export default function Index() {
    const [activeDevices, setActiveDevices] = useState(10247);

    // Animated counter effect
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveDevices(prev => prev + Math.floor(Math.random() * 3));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const structuredData = [schemas.organization, schemas.website, schemas.softwareApplication];

    return (
        <LandingLayout>
            <SeoHead
                title="CLICKAI - Nền Tảng Tự Động Hoá Phone Farm"
                description="Nền tảng No-Code tự động hoá phone farm. Kéo thả workflow, Vision AI nhận diện UI, thao tác như người thật 24/7."
                keywords="phone farm, tự động hoá, workflow automation, nuôi nick, test key, clickai"
                url="https://clickai.vn"
                structuredData={structuredData}
            />

            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-white dark:bg-gray-950">
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{
                    backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }}></div>

                {/* Gradient Orbs */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-cyan-500/10 to-transparent rounded-full blur-[80px]"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left Content */}
                        <div className="text-center lg:text-left space-y-8">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                                </span>
                                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">NO-CODE AUTOMATION</span>
                            </div>

                            {/* Title */}
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                                Tự Động Hoá
                                <span className="block bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent">
                                    Phone Farm
                                </span>
                            </h1>

                            {/* Description */}
                            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl">
                                Nền tảng <strong>No-Code</strong> kéo thả workflow. Vision AI nhận diện UI, thao tác như người thật 24/7.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link
                                    href="/register"
                                    className="inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-lg shadow-purple-500/25"
                                >
                                    Dùng Thử Miễn Phí
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                                <Link
                                    href="/features"
                                    className="inline-flex items-center justify-center px-6 py-3 font-semibold text-gray-700 dark:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-xl transition-colors"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                    </svg>
                                    Xem Demo
                                </Link>
                            </div>

                            {/* Trust badges */}
                            <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Setup 5 phút
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Không cần code
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    14 ngày miễn phí
                                </span>
                            </div>
                        </div>

                        {/* Right: Phone Farm Preview */}
                        <div className="hidden lg:block">
                            <PhoneFarmPreview />
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <StatCard number={activeDevices.toLocaleString()} label="Thiết bị đang chạy" />
                        <StatCard number="99.9%" label="Uptime" />
                        <StatCard number="1M+" label="Thao tác/ngày" />
                        <StatCard number="98%" label="Tỷ lệ thành công" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-white dark:bg-gray-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Tất Cả Những Gì Bạn Cần
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Nền tảng tích hợp đầy đủ để tự động hoá mọi tác vụ phone farm
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<PhoneIcon />}
                            title="Quản Lý Thiết Bị"
                            description="Điều khiển hàng trăm điện thoại từ một dashboard. Theo dõi real-time, phân nhóm thông minh."
                        />
                        <FeatureCard
                            icon={<WorkflowIcon />}
                            title="Visual Workflow"
                            description="Kéo thả tạo kịch bản tự động. Ghi lại thao tác thật, chỉnh sửa linh hoạt."
                        />
                        <FeatureCard
                            icon={<AIIcon />}
                            title="Vision AI"
                            description="AI nhận diện UI, thao tác như người thật. Bypass detection hiệu quả."
                        />
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Bắt Đầu Trong 3 Bước
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <StepCard step="01" title="Cài Agent" description="Tải app lên điện thoại, kết nối tự động trong vài giây." />
                        <StepCard step="02" title="Tạo Workflow" description="Ghi lại thao tác hoặc kéo thả để xây dựng kịch bản." />
                        <StepCard step="03" title="Chạy 24/7" description="Lên lịch hoặc chạy ngay. Hệ thống hoạt động liên tục." />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gradient-to-br from-purple-600 to-indigo-700">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                        Sẵn Sàng Tự Động Hoá?
                    </h2>
                    <p className="text-lg text-purple-100 mb-8 max-w-2xl mx-auto">
                        Bắt đầu miễn phí ngay hôm nay. Không cần thẻ tín dụng.
                    </p>
                    <Link
                        href="/register"
                        className="inline-flex items-center px-8 py-4 font-bold text-purple-600 bg-white hover:bg-gray-100 rounded-xl transition-colors shadow-xl"
                    >
                        Bắt Đầu Miễn Phí
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                </div>
            </section>
        </LandingLayout>
    );
}

// Phone Farm Preview Component
function PhoneFarmPreview() {
    const devices = [
        { status: 'running', progress: 78 },
        { status: 'online', progress: 100 },
        { status: 'running', progress: 45 },
        { status: 'running', progress: 92 },
    ];

    return (
        <div className="relative">
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-3xl"></div>

            {/* Live Stats */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="font-semibold text-green-600 dark:text-green-400">3 Running</span>
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">1 Online</span>
                </div>
            </div>

            {/* Phone Grid */}
            <div className="relative grid grid-cols-2 gap-4 p-8 pt-12">
                {devices.map((device, index) => (
                    <div key={index} className="group">
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 shadow-lg group-hover:shadow-xl transition-shadow">
                            <div className="aspect-[9/16] bg-gray-100 dark:bg-gray-900 rounded-xl relative overflow-hidden">
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg mb-2"></div>
                                    {device.status === 'running' && (
                                        <div className="w-full mt-2">
                                            <div className="h-1 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all"
                                                    style={{ width: `${device.progress}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center mt-1">{device.progress}%</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-1.5 mt-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${device.status === 'running' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    {device.status === 'running' ? 'Đang chạy' : 'Sẵn sàng'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Stat Card
function StatCard({ number, label }) {
    return (
        <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1">{number}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
        </div>
    );
}

// Feature Card
function FeatureCard({ icon, title, description }) {
    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-purple-500/50 transition-colors">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{description}</p>
        </div>
    );
}

// Step Card
function StepCard({ step, title, description }) {
    return (
        <div className="text-center">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white font-bold mx-auto mb-4">
                {step}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
        </div>
    );
}

// Icons
function PhoneIcon() {
    return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    );
}

function WorkflowIcon() {
    return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
    );
}

function AIIcon() {
    return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    );
}
