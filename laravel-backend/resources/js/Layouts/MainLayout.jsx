import { ThemeProvider } from '@/Contexts/ThemeContext';

export default function MainLayout({ children }) {
    return (
        <ThemeProvider>
            <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                {/* Header placeholder - will be replaced with Navigation component */}
                <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center">
                                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                    Agent Automation
                                </span>
                            </div>
                            <nav className="hidden md:flex items-center space-x-8">
                                <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
                                    Features
                                </a>
                                <a href="#about" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
                                    About
                                </a>
                                <a href="#contact" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
                                    Contact
                                </a>
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Main content */}
                <main className="flex-1">
                    {children}
                </main>

                {/* Footer placeholder - will be replaced with Footer component */}
                <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                            <div className="flex items-center">
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Agent Automation
                                </span>
                            </div>
                            <nav className="flex flex-wrap justify-center gap-6">
                                <a href="#features" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
                                    Features
                                </a>
                                <a href="#about" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
                                    About
                                </a>
                                <a href="#contact" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
                                    Contact
                                </a>
                            </nav>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                &copy; {new Date().getFullYear()} Agent Automation. All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </ThemeProvider>
    );
}
