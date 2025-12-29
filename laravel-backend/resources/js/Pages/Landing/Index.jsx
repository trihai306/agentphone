import { Link } from '@inertiajs/react';
import LandingLayout from '../../Layouts/LandingLayout';

export default function Index() {
    return (
        <LandingLayout>
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
                {/* Animated Background Blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
                    <div className="text-center">
                        {/* Live Badge */}
                        <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 rounded-full px-4 py-2 mb-8">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                            </span>
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Now Live - Start Managing Your Devices</span>
                        </div>

                        {/* Hero Title */}
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
                            <span className="block text-gray-900 dark:text-white">Manage Your Devices</span>
                            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent animate-gradient">
                                Smarter Than Ever
                            </span>
                        </h1>

                        {/* Hero Description */}
                        <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            Take control of your device fleet with powerful monitoring, real-time analytics, and seamless management. Built for teams that demand excellence.
                        </p>

                        {/* CTA Buttons */}
                        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                            >
                                Get Started Free
                                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                            <Link
                                href="/features"
                                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all border border-gray-200 dark:border-gray-700"
                            >
                                View Features
                                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>
                        </div>

                        {/* Trust Indicators */}
                        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>No credit card required</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Free forever plan</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Cancel anytime</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        <StatCard number="50K+" label="Active Users" icon="users" />
                        <StatCard number="500K+" label="Devices Managed" icon="devices" />
                        <StatCard number="99.9%" label="Uptime SLA" icon="uptime" />
                        <StatCard number="24/7" label="Expert Support" icon="support" />
                    </div>
                </div>
            </section>

            {/* Features Preview */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Everything You Need
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Powerful features designed to help you manage, monitor, and optimize your device fleet.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon="chart"
                            title="Real-time Analytics"
                            description="Monitor device performance and usage with beautiful, actionable dashboards and insights."
                        />
                        <FeatureCard
                            icon="shield"
                            title="Enterprise Security"
                            description="Bank-level encryption and security protocols to keep your data safe and compliant."
                        />
                        <FeatureCard
                            icon="team"
                            title="Team Collaboration"
                            description="Work together seamlessly with role-based access control and shared workspaces."
                        />
                        <FeatureCard
                            icon="api"
                            title="Powerful API"
                            description="Integrate with your existing tools using our comprehensive REST API."
                        />
                        <FeatureCard
                            icon="automation"
                            title="Smart Automation"
                            description="Automate routine tasks and workflows to save time and reduce errors."
                        />
                        <FeatureCard
                            icon="support"
                            title="24/7 Support"
                            description="Get help whenever you need it from our expert support team."
                        />
                    </div>

                    <div className="text-center mt-12">
                        <Link
                            href="/features"
                            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                            View All Features
                            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 bg-white dark:bg-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Loved by Teams Worldwide
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            See what our customers have to say about DeviceHub.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <TestimonialCard
                            quote="DeviceHub transformed how we manage our device fleet. The real-time analytics are game-changing."
                            author="Sarah Johnson"
                            role="CTO, TechCorp"
                            avatar="SJ"
                        />
                        <TestimonialCard
                            quote="The best device management platform we've used. Intuitive interface and powerful features."
                            author="Michael Chen"
                            role="IT Director, GlobalTech"
                            avatar="MC"
                        />
                        <TestimonialCard
                            quote="Outstanding support and reliability. DeviceHub has become essential to our operations."
                            author="Emily Rodriguez"
                            role="VP of Operations, InnovateLabs"
                            avatar="ER"
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Ready to Get Started?
                    </h2>
                    <p className="text-xl text-blue-100 mb-10">
                        Join thousands of teams already managing their devices smarter with DeviceHub.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/register"
                            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-blue-600 bg-white hover:bg-gray-50 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                        >
                            Start Free Trial
                            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all border border-white/20"
                        >
                            Contact Sales
                        </Link>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}

function StatCard({ number, label, icon }) {
    const icons = {
        users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
        devices: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
        uptime: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
        support: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z",
    };

    return (
        <div className="text-center group cursor-pointer">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
                </svg>
            </div>
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {number}
            </div>
            <div className="text-gray-600 dark:text-gray-400 font-medium">
                {label}
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, description }) {
    const icons = {
        chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
        shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
        team: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
        api: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
        automation: "M13 10V3L4 14h7v7l9-11h-7z",
        support: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z",
    };

    return (
        <div className="group p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 mb-6 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
                </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
                {description}
            </p>
        </div>
    );
}

function TestimonialCard({ quote, author, role, avatar }) {
    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 rounded-2xl hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {avatar}
                </div>
                <div className="ml-4">
                    <div className="font-bold text-gray-900 dark:text-white">{author}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{role}</div>
                </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 italic">"{quote}"</p>
            <div className="flex mt-4 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
        </div>
    );
}
