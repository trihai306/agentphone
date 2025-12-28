import Button from '@/Components/UI/Button';

/**
 * AboutSection - Product introduction and value proposition
 * Features detailed explanation of the automation system with benefits list
 */

// Benefits data for the automation platform
const benefits = [
    {
        id: 'save-time',
        icon: (
            <svg
                className="h-6 w-6"
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
        title: 'Save Valuable Time',
        description: 'Reduce manual work by up to 80% and focus on what truly matters for your business growth.',
    },
    {
        id: 'reduce-errors',
        icon: (
            <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        ),
        title: 'Eliminate Human Errors',
        description: 'Automated agents follow precise instructions every time, ensuring consistent and accurate results.',
    },
    {
        id: 'scale-operations',
        icon: (
            <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
                />
            </svg>
        ),
        title: 'Scale Operations Effortlessly',
        description: 'Handle increased workloads without adding headcount. Your automation grows with your business.',
    },
    {
        id: 'work-247',
        icon: (
            <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                />
            </svg>
        ),
        title: 'Operate 24/7',
        description: 'Your agents never sleep. Tasks run continuously, even outside business hours and on weekends.',
    },
];

export default function AboutSection() {
    const handleGetStarted = (e) => {
        e.preventDefault();
        const target = document.querySelector('#contact');
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section
            id="about"
            className="relative py-20 lg:py-28 bg-white dark:bg-gray-950"
        >
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-100/50 blur-3xl dark:bg-blue-900/20" />
                <div className="absolute bottom-1/4 right-0 h-96 w-96 translate-x-1/2 rounded-full bg-indigo-100/50 blur-3xl dark:bg-indigo-900/20" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
                    {/* Left column - Content */}
                    <div className="mb-12 lg:mb-0">
                        {/* Badge */}
                        <div className="mb-6 inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 dark:border-purple-800 dark:bg-purple-900/30">
                            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                About Our Platform
                            </span>
                        </div>

                        {/* Title */}
                        <h2 className="mb-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
                            Revolutionize How You{' '}
                            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400">
                                Work
                            </span>
                        </h2>

                        {/* Description paragraphs */}
                        <div className="space-y-4 mb-8">
                            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                                In today's fast-paced digital world, businesses need to stay ahead of the competition.
                                Our intelligent agent automation platform empowers you to automate repetitive tasks,
                                streamline workflows, and unlock new levels of productivity.
                            </p>
                            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                                Whether you're managing data entry, web scraping, form submissions, or complex
                                multi-step processes, our platform provides the tools you need to build powerful
                                automations without writing a single line of code.
                            </p>
                        </div>

                        {/* CTA */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleGetStarted}
                                className="shadow-lg shadow-blue-500/25 dark:shadow-blue-500/15"
                            >
                                Start Automating Today
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
                        </div>
                    </div>

                    {/* Right column - Benefits grid */}
                    <div className="grid gap-6 sm:grid-cols-2">
                        {benefits.map((benefit) => (
                            <div
                                key={benefit.id}
                                className="group rounded-xl border border-gray-200 bg-gray-50 p-6 transition-all hover:border-blue-300 hover:bg-white hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700 dark:hover:bg-gray-800"
                            >
                                {/* Icon */}
                                <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                    {benefit.icon}
                                </div>

                                {/* Title */}
                                <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {benefit.title}
                                </h3>

                                {/* Description */}
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {benefit.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom section - Mission statement */}
                <div className="mt-20 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center text-white shadow-xl sm:p-12 dark:from-blue-700 dark:to-indigo-700">
                    <h3 className="mb-4 text-2xl font-bold sm:text-3xl">
                        Our Mission
                    </h3>
                    <p className="mx-auto max-w-3xl text-lg text-blue-100">
                        We believe that everyone deserves access to powerful automation tools.
                        Our mission is to democratize automation technology, making it accessible
                        to businesses of all sizes. No technical expertise required—just results.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-8">
                        <div className="text-center">
                            <div className="text-3xl font-bold">50+</div>
                            <div className="text-sm text-blue-200">Countries Served</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold">1M+</div>
                            <div className="text-sm text-blue-200">Hours Saved</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold">4.9/5</div>
                            <div className="text-sm text-blue-200">Customer Rating</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold">500+</div>
                            <div className="text-sm text-blue-200">Enterprise Clients</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
