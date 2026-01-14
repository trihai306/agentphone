import { Link } from '@inertiajs/react';
import { useTheme } from '../Contexts/ThemeContext';

export default function AuthLayout({ children }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
            {/* Header */}
            <header className="px-6 py-5">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white' : 'bg-gray-900'}`}>
                            <svg className={`w-4 h-4 ${isDark ? 'text-black' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>CLICKAI</span>
                    </Link>

                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-lg ${isDark ? 'hover:bg-[#1a1a1a] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                    >
                        {isDark ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </button>
                </div>
            </header>

            {/* Main */}
            <main className="flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-[400px]">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="pb-8 text-center">
                <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    © {new Date().getFullYear()} CLICKAI. All rights reserved.
                </p>
            </footer>
        </div>
    );
}
