import LandingLayout from '../../Layouts/LandingLayout';

export default function Index({ stats, team }) {
    return (
        <LandingLayout>
            {/* Hero */}
            <section className="relative bg-gradient-to-b from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-24 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(59, 130, 246) 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 rounded-full px-4 py-2 mb-6">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                        </svg>
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-300">About Us</span>
                    </div>

                    <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                        Empowering Teams
                        <span className="block bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                            Through Innovation
                        </span>
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                        We're on a mission to simplify device management for teams everywhere, making powerful tools accessible to organizations of all sizes.
                    </p>
                </div>
            </section>

            {/* Stats */}
            <section className="py-20 bg-white dark:bg-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <StatCard key={index} stat={stat} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Story */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Content */}
                        <div>
                            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                                Our Story
                            </h2>
                            <div className="space-y-4 text-gray-600 dark:text-gray-400">
                                <p className="text-lg">
                                    DeviceHub was founded in 2020 with a simple goal: make device management accessible to everyone.
                                    We saw teams struggling with complex tools and decided to build something better.
                                </p>
                                <p className="text-lg">
                                    Today, we serve thousands of companies worldwide, helping them manage millions of devices.
                                    Our platform combines powerful features with an intuitive interface, making it easy for teams
                                    of all sizes to get started.
                                </p>
                                <p className="text-lg">
                                    We believe that great software should be both powerful and easy to use. That's why we're
                                    constantly innovating, listening to our customers, and improving our platform to meet the
                                    evolving needs of modern teams.
                                </p>
                            </div>
                        </div>

                        {/* Visual Element */}
                        <div className="relative">
                            <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-1">
                                <div className="w-full h-full rounded-2xl bg-white dark:bg-gray-800 p-8 flex flex-col items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto animate-blob">
                                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                            Built for the Future
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Continuously evolving with cutting-edge technology
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="py-20 bg-white dark:bg-gray-800">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Our Journey
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            Key milestones in our growth and evolution
                        </p>
                    </div>

                    <div className="space-y-8">
                        <TimelineItem
                            year="2020"
                            title="Foundation"
                            description="DeviceHub was founded with a vision to revolutionize device management."
                            position="left"
                        />
                        <TimelineItem
                            year="2021"
                            title="First 1,000 Users"
                            description="Reached our first major milestone with users across 20 countries."
                            position="right"
                        />
                        <TimelineItem
                            year="2022"
                            title="Series A Funding"
                            description="Secured funding to accelerate product development and team growth."
                            position="left"
                        />
                        <TimelineItem
                            year="2023"
                            title="Enterprise Launch"
                            description="Introduced enterprise features including SSO and advanced security."
                            position="right"
                        />
                        <TimelineItem
                            year="2024"
                            title="Global Expansion"
                            description="Expanded to serve customers in over 120 countries worldwide."
                            position="left"
                        />
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Our Values
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            The principles that guide everything we do
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <ValueCard
                            icon="heart"
                            title="Customer First"
                            description="Every decision we make starts with our customers. Their success is our success."
                        />
                        <ValueCard
                            icon="innovation"
                            title="Innovation"
                            description="We continuously push boundaries to deliver cutting-edge solutions."
                        />
                        <ValueCard
                            icon="integrity"
                            title="Integrity"
                            description="We build trust through transparency, honesty, and ethical practices."
                        />
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-20 bg-white dark:bg-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Meet Our Team
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            The passionate people behind DeviceHub
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {team.map((member, index) => (
                            <TeamMemberCard key={index} member={member} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Join Us on Our Journey
                    </h2>
                    <p className="text-xl text-blue-100 mb-10">
                        Be part of the future of device management. Start your free trial today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="/register"
                            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-blue-600 bg-white hover:bg-gray-50 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                        >
                            Get Started Free
                            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </a>
                        <a
                            href="/contact"
                            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all border border-white/20"
                        >
                            Contact Us
                        </a>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}

function StatCard({ stat, index }) {
    return (
        <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                {stat.value}
            </div>
            <div className="text-gray-600 dark:text-gray-400 font-medium">
                {stat.label}
            </div>
        </div>
    );
}

function TimelineItem({ year, title, description, position }) {
    return (
        <div className={`flex items-center ${position === 'right' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex-1 ${position === 'right' ? 'text-left pl-8' : 'text-right pr-8'}`}>
                <div className="inline-block p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all group">
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">{year}</div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{description}</p>
                </div>
            </div>
            <div className="flex-shrink-0 w-4 h-4 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 border-4 border-white dark:border-gray-900 shadow-lg"></div>
            <div className="flex-1"></div>
        </div>
    );
}

function ValueCard({ icon, title, description }) {
    const icons = {
        heart: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
        innovation: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
        integrity: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    };

    return (
        <div className="group p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d={icons[icon]} />
                </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
                {description}
            </p>
        </div>
    );
}

function TeamMemberCard({ member, index }) {
    return (
        <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all hover:-translate-y-2">
            <div className="relative inline-block mb-6">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-4xl font-bold text-white">
                        {member.name.charAt(0)}
                    </span>
                </div>
                <div className="absolute bottom-0 right-0 w-10 h-10 bg-green-500 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {member.name}
            </h3>
            <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">
                {member.role}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
                {member.bio}
            </p>
        </div>
    );
}
