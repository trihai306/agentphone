import { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { useTheme } from '../Contexts/ThemeContext';

export default function LandingLayout({ children }) {
    const { theme, toggleTheme } = useTheme();
    const { url, auth } = usePage().props;
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0A0A0F] transition-colors duration-300">
            {/* Premium Navigation */}
            <nav className="sticky top-0 z-50 bg-white/90 dark:bg-[#0A0A0F]/90 backdrop-blur-2xl border-b border-gray-200/50 dark:border-white/10 shadow-sm dark:shadow-purple-500/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative w-11 h-11 rounded-2xl overflow-hidden shadow-xl shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                                <img src="/images/logo.png" alt="CLICKAI Logo" className="w-full h-full object-cover" />
                                {/* Glow effect */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 opacity-0 group-hover:opacity-30 blur-xl transition-opacity"></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                    CLICKAI
                                </span>
                                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider -mt-1">
                                    Automation Platform
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-2">
                            <NavLink href="/" active={url === '/'}>Home</NavLink>
                            <NavLink href="/features" active={url === '/features'}>Features</NavLink>
                            <NavLink href="/pricing" active={url === '/pricing'}>Pricing</NavLink>
                            <NavLink href="/about" active={url === '/about'}>About</NavLink>
                            <NavLink href="/contact" active={url === '/contact'}>Contact</NavLink>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3">
                            {/* Premium Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="relative p-2.5 rounded-xl bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200/50 dark:border-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 group"
                                aria-label="Toggle theme"
                            >
                                <div className="relative w-5 h-5">
                                    {/* Sun Icon */}
                                    <svg
                                        className={`absolute inset-0 w-5 h-5 text-amber-500 transition-all duration-300 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    {/* Moon Icon */}
                                    <svg
                                        className={`absolute inset-0 w-5 h-5 text-purple-500 transition-all duration-300 ${theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                </div>

                                {/* Tooltip */}
                                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                                </div>
                            </button>

                            {/* User Menu or Login/Register */}
                            {auth.user ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200/50 dark:border-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                                    >
                                        <div className="w-9 h-9 bg-gradient-to-br from-purple-500 via-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                            {auth.user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="hidden md:block text-sm font-bold text-gray-700 dark:text-gray-200">
                                            {auth.user.name}
                                        </span>
                                        <svg className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Premium Dropdown Menu */}
                                    {showUserMenu && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setShowUserMenu(false)}
                                            ></div>
                                            <div className="absolute right-0 mt-3 w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden z-20 animate-scale-in">
                                                {/* User Info Header */}
                                                <div className="px-5 py-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 border-b border-gray-200/50 dark:border-white/10">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                        {auth.user.name}
                                                    </p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                                                        {auth.user.email}
                                                    </p>
                                                </div>

                                                {/* Menu Items */}
                                                <div className="py-2">
                                                    <DropdownLink
                                                        href="/dashboard"
                                                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                        </svg>}
                                                    >
                                                        Dashboard
                                                    </DropdownLink>
                                                    <DropdownLink
                                                        href="/devices"
                                                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>}
                                                    >
                                                        My Devices
                                                    </DropdownLink>
                                                    <DropdownLink
                                                        href="/profile"
                                                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>}
                                                    >
                                                        Profile
                                                    </DropdownLink>
                                                </div>

                                                {/* Logout */}
                                                <div className="border-t border-gray-200/50 dark:border-white/10 p-2">
                                                    <button
                                                        onClick={handleLogout}
                                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                        </svg>
                                                        Sign Out
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="hidden md:inline-flex items-center px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl border border-gray-200/50 dark:border-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="relative inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-500 hover:via-blue-500 hover:to-cyan-500 text-white font-extrabold text-sm rounded-xl shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 overflow-hidden group"
                                    >
                                        <span className="relative z-10">Get Started</span>
                                        {/* Shimmer effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main>
                {children}
            </main>

            {/* Premium Footer */}
            <footer className="relative bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#0A0A0F] dark:to-black border-t border-gray-200/50 dark:border-white/10">
                {/* Decorative background */}
                <div className="absolute inset-0 overflow-hidden opacity-30">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                        {/* Company Info */}
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-xl">
                                    <img src="/images/logo.png" alt="CLICKAI Logo" className="w-full h-full object-cover" />
                                </div>
                                <span className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                    CLICKAI
                                </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed max-w-md">
                                Nền tảng tự động hoá phone farm chuyên nghiệp. Kéo thả workflow, nuôi nick tự động, chạy 24/7.
                            </p>
                            <div className="flex gap-3">
                                <SocialLink href="#" icon="twitter" />
                                <SocialLink href="#" icon="github" />
                                <SocialLink href="#" icon="linkedin" />
                            </div>
                        </div>

                        {/* Product */}
                        <div>
                            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider mb-6">
                                Product
                            </h3>
                            <ul className="space-y-3">
                                <FooterLink href="/features">Features</FooterLink>
                                <FooterLink href="/pricing">Pricing</FooterLink>
                                <FooterLink href="/docs">Documentation</FooterLink>
                                <FooterLink href="/api">API</FooterLink>
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider mb-6">
                                Company
                            </h3>
                            <ul className="space-y-3">
                                <FooterLink href="/about">About</FooterLink>
                                <FooterLink href="/blog">Blog</FooterLink>
                                <FooterLink href="/careers">Careers</FooterLink>
                                <FooterLink href="/contact">Contact</FooterLink>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="mt-16 pt-8 border-t border-gray-200/50 dark:border-white/10">
                        <p className="text-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                            © {new Date().getFullYear()} CLICKAI. All rights reserved. Built with ❤️ in Vietnam
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// Premium Navigation Link
function NavLink({ href, children, active = false }) {
    return (
        <Link
            href={href}
            className={`relative px-4 py-2 font-bold text-sm rounded-xl transition-all duration-300 ${active
                ? 'text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg shadow-purple-500/30'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
        >
            {children}
        </Link>
    );
}

// Premium Dropdown Link
function DropdownLink({ href, icon, children }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-4 py-2.5 mx-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
        >
            <span className="text-gray-500 dark:text-gray-400">{icon}</span>
            {children}
        </Link>
    );
}

// Footer Link
function FooterLink({ href, children }) {
    return (
        <li>
            <Link
                href={href}
                className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium text-sm"
            >
                {children}
            </Link>
        </li>
    );
}

// Social Link with Premium Styling
function SocialLink({ href, icon }) {
    const icons = {
        twitter: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z",
        github: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22",
        linkedin: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z",
    };

    return (
        <a
            href={href}
            className="group relative w-11 h-11 rounded-xl bg-gray-200/80 dark:bg-white/5 hover:bg-gradient-to-br hover:from-purple-500 hover:to-blue-600 border border-gray-300/50 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
            target="_blank"
            rel="noopener noreferrer"
        >
            <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
            </svg>
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 opacity-0 group-hover:opacity-30 blur-lg transition-opacity"></div>
        </a>
    );
}
