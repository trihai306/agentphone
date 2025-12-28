import Button from '@/Components/UI/Button';

/**
 * HowItWorksSection - Step-by-step explanation of the automation process
 * Visual guide showing users how to get started with the platform
 */

// Step data for the automation process
const steps = [
    {
        id: 'step-1',
        number: '01',
        title: 'Create Your Agent',
        description:
            'Start by defining your automation agent. Choose from pre-built templates or create a custom workflow tailored to your specific needs.',
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
                    d="M12 4.5v15m7.5-7.5h-15"
                />
            </svg>
        ),
        color: 'blue',
    },
    {
        id: 'step-2',
        number: '02',
        title: 'Configure Actions',
        description:
            'Define the actions your agent will perform. Use our visual builder to set up clicks, form fills, data extraction, and more without writing code.',
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
                    d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                />
            </svg>
        ),
        color: 'indigo',
    },
    {
        id: 'step-3',
        number: '03',
        title: 'Set Your Schedule',
        description:
            'Choose when and how often your agent runs. Schedule it to work 24/7, during specific hours, or trigger it based on events and conditions.',
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
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        ),
        color: 'purple',
    },
    {
        id: 'step-4',
        number: '04',
        title: 'Monitor & Optimize',
        description:
            'Watch your automation in action with real-time monitoring. Get detailed reports, track performance, and optimize for better results.',
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
        color: 'green',
    },
];

// Color variants for step icons
const colorVariants = {
    blue: {
        icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        number: 'text-blue-600 dark:text-blue-400',
        line: 'bg-blue-200 dark:bg-blue-800',
    },
    indigo: {
        icon: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
        number: 'text-indigo-600 dark:text-indigo-400',
        line: 'bg-indigo-200 dark:bg-indigo-800',
    },
    purple: {
        icon: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        number: 'text-purple-600 dark:text-purple-400',
        line: 'bg-purple-200 dark:bg-purple-800',
    },
    green: {
        icon: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        number: 'text-green-600 dark:text-green-400',
        line: 'bg-green-200 dark:bg-green-800',
    },
};

/**
 * StepCard - Individual step card with number, icon, title, and description
 */
function StepCard({ step, index, isLast }) {
    const { number, icon, title, description, color } = step;
    const colors = colorVariants[color] || colorVariants.blue;

    return (
        <div className="relative flex flex-col items-center text-center">
            {/* Connector line (hidden on last item and mobile) */}
            {!isLast && (
                <div
                    className={`absolute top-20 left-1/2 hidden h-0.5 w-full lg:block ${colors.line}`}
                    style={{ transform: 'translateX(50%)' }}
                    aria-hidden="true"
                />
            )}

            {/* Step number badge */}
            <div
                className={`mb-4 text-4xl font-bold ${colors.number}`}
            >
                {number}
            </div>

            {/* Icon container */}
            <div
                className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${colors.icon} shadow-lg transition-transform hover:scale-110`}
            >
                {icon}
            </div>

            {/* Content */}
            <div className="max-w-xs">
                <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                    {title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );
}

export default function HowItWorksSection() {
    const handleGetStarted = (e) => {
        e.preventDefault();
        const target = document.querySelector('#contact');
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section
            id="how-it-works"
            className="relative py-20 lg:py-28 bg-white dark:bg-gray-950"
        >
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-1/3 h-72 w-72 rounded-full bg-indigo-100/50 blur-3xl dark:bg-indigo-900/20" />
                <div className="absolute bottom-0 right-1/3 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl dark:bg-blue-900/20" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Section header */}
                <div className="text-center mb-16 lg:mb-20">
                    {/* Badge */}
                    <div className="mb-4 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 dark:border-blue-800 dark:bg-blue-900/30">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            Simple Process
                        </span>
                    </div>

                    {/* Title */}
                    <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
                        How It{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                            Works
                        </span>
                    </h2>

                    {/* Subtitle */}
                    <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
                        Get started with automation in just four simple steps.
                        No technical expertise required—our platform guides you every step of the way.
                    </p>
                </div>

                {/* Steps grid */}
                <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                    {steps.map((step, index) => (
                        <StepCard
                            key={step.id}
                            step={step}
                            index={index}
                            isLast={index === steps.length - 1}
                        />
                    ))}
                </div>

                {/* Bottom CTA section */}
                <div className="mt-20 rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900 sm:p-12">
                    <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                        Ready to Get Started?
                    </h3>
                    <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
                        Join thousands of businesses already automating their workflows.
                        Start your free trial today and see results in minutes.
                    </p>
                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleGetStarted}
                            className="shadow-lg shadow-blue-500/25 dark:shadow-blue-500/15"
                        >
                            Start Free Trial
                            <svg
                                className="ml-2 h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                                />
                            </svg>
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={(e) => {
                                e.preventDefault();
                                const target = document.querySelector('#features');
                                if (target) {
                                    target.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                        >
                            Explore Features
                        </Button>
                    </div>

                    {/* Trust indicators */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                            <svg
                                className="h-5 w-5 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            <span>No credit card required</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg
                                className="h-5 w-5 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            <span>14-day free trial</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg
                                className="h-5 w-5 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            <span>Cancel anytime</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
