import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/Components/UI/Card';

/**
 * FeaturesSection - Showcases automation capabilities with feature cards
 * Features a responsive grid layout with icons, titles, and descriptions
 */

// Feature data for the automation capabilities
const features = [
    {
        id: 'smart-automation',
        icon: (
            <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                />
            </svg>
        ),
        title: 'Smart Automation',
        description:
            'Intelligent agents that learn and adapt to your workflows. Automate repetitive tasks with AI-powered decision making.',
        color: 'blue',
    },
    {
        id: 'multi-platform',
        icon: (
            <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z"
                />
            </svg>
        ),
        title: 'Multi-Platform Support',
        description:
            'Works seamlessly across web browsers, desktop applications, and cloud services. One agent, unlimited possibilities.',
        color: 'indigo',
    },
    {
        id: 'visual-workflow',
        icon: (
            <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605"
                />
            </svg>
        ),
        title: 'Visual Workflow Builder',
        description:
            'Design automation workflows with an intuitive drag-and-drop interface. No coding skills required to get started.',
        color: 'purple',
    },
    {
        id: 'secure-reliable',
        icon: (
            <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
            </svg>
        ),
        title: 'Secure & Reliable',
        description:
            'Enterprise-grade security with encrypted connections. Your data stays safe while agents work 24/7.',
        color: 'green',
    },
    {
        id: 'real-time-monitoring',
        icon: (
            <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
            </svg>
        ),
        title: 'Real-Time Monitoring',
        description:
            'Track every action with detailed logs and analytics. Get instant notifications when tasks complete or need attention.',
        color: 'orange',
    },
    {
        id: 'easy-integration',
        icon: (
            <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                />
            </svg>
        ),
        title: 'Easy Integration',
        description:
            'Connect with your favorite tools and services through APIs. Extend functionality with custom plugins and webhooks.',
        color: 'pink',
    },
];

// Color variants for feature icons
const colorVariants = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
};

/**
 * FeatureCard - Individual feature card with icon, title, and description
 */
function FeatureCard({ feature }) {
    const { icon, title, description, color } = feature;

    return (
        <Card hover className="group">
            <CardContent>
                {/* Icon container */}
                <div
                    className={`mb-5 inline-flex items-center justify-center rounded-xl p-3 ${colorVariants[color] || colorVariants.blue}`}
                >
                    {icon}
                </div>

                {/* Title */}
                <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}

export default function FeaturesSection() {
    return (
        <section
            id="features"
            className="relative py-20 lg:py-28 bg-gray-50 dark:bg-gray-900"
        >
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-1/4 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl dark:bg-blue-800/20" />
                <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-purple-200/30 blur-3xl dark:bg-purple-800/20" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Section header */}
                <div className="text-center mb-16">
                    {/* Badge */}
                    <div className="mb-4 inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 dark:border-indigo-800 dark:bg-indigo-900/30">
                        <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                            Powerful Features
                        </span>
                    </div>

                    {/* Title */}
                    <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
                        Everything You Need to{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                            Automate
                        </span>
                    </h2>

                    {/* Subtitle */}
                    <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
                        Discover the tools and capabilities that make our automation platform
                        the choice for businesses worldwide.
                    </p>
                </div>

                {/* Features grid */}
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => (
                        <FeatureCard key={feature.id} feature={feature} />
                    ))}
                </div>

                {/* Bottom stats/social proof */}
                <div className="mt-20 rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800 sm:p-10">
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                                10K+
                            </div>
                            <div className="text-gray-600 dark:text-gray-300">
                                Active Users
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                                5M+
                            </div>
                            <div className="text-gray-600 dark:text-gray-300">
                                Tasks Automated
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                                99.9%
                            </div>
                            <div className="text-gray-600 dark:text-gray-300">
                                Uptime
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                                24/7
                            </div>
                            <div className="text-gray-600 dark:text-gray-300">
                                Support Available
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
