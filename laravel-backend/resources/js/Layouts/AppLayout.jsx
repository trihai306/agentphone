import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import Sidebar from '../Components/Layout/Sidebar';
import Header from '../Components/Layout/Header';
import CommandPalette from '../Components/Layout/CommandPalette';
import { useTheme } from '@/Contexts/ThemeContext';

export default function AppLayout({ children, title, breadcrumbs }) {
    const { auth, flash } = usePage().props;
    const currentUrl = usePage().url;
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [flashVisible, setFlashVisible] = useState({ success: false, error: false });

    // Load collapsed state from localStorage
    useEffect(() => {
        const savedCollapsed = localStorage.getItem('sidebarCollapsed');
        if (savedCollapsed !== null) {
            setCollapsed(JSON.parse(savedCollapsed));
        }
    }, []);

    // Save collapsed state to localStorage
    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
    }, [collapsed]);

    // Auto-hide flash messages
    useEffect(() => {
        if (flash?.success) {
            setFlashVisible(prev => ({ ...prev, success: true }));
            const timer = setTimeout(() => setFlashVisible(prev => ({ ...prev, success: false })), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    useEffect(() => {
        if (flash?.error) {
            setFlashVisible(prev => ({ ...prev, error: true }));
            const timer = setTimeout(() => setFlashVisible(prev => ({ ...prev, error: false })), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash?.error]);

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#fafafa]'}`}>
            {/* Command Palette (Cmd+K) */}
            <CommandPalette />

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <Sidebar
                user={auth.user}
                url={currentUrl}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
            />

            {/* Main Content */}
            <div className={`relative min-h-screen transition-all duration-300 ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
                {/* Header */}
                <Header
                    title={title}
                    userName={auth.user?.name?.split(' ')[0]}
                    setSidebarOpen={setSidebarOpen}
                />

                {/* Flash Messages - Floating */}
                <div className="fixed top-16 right-4 z-50 space-y-2 w-80">
                    {flash?.success && flashVisible.success && (
                        <div className="animate-slide-down">
                            <div className={`p-4 rounded-xl shadow-lg backdrop-blur-xl border ${isDark
                                    ? 'bg-emerald-900/90 border-emerald-700/50 text-emerald-100'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                }`}>
                                <div className="flex items-start gap-3">
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-800' : 'bg-emerald-100'
                                        }`}>
                                        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{flash.success}</p>
                                    </div>
                                    <button
                                        onClick={() => setFlashVisible(prev => ({ ...prev, success: false }))}
                                        className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {flash?.error && flashVisible.error && (
                        <div className="animate-slide-down">
                            <div className={`p-4 rounded-xl shadow-lg backdrop-blur-xl border ${isDark
                                    ? 'bg-red-900/90 border-red-700/50 text-red-100'
                                    : 'bg-red-50 border-red-200 text-red-800'
                                }`}>
                                <div className="flex items-start gap-3">
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-red-800' : 'bg-red-100'
                                        }`}>
                                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{flash.error}</p>
                                    </div>
                                    <button
                                        onClick={() => setFlashVisible(prev => ({ ...prev, error: false }))}
                                        className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Page Content */}
                <main className="min-h-[calc(100vh-3.5rem)]">
                    {children}
                </main>

                {/* Keyboard Shortcuts Hint */}
                <div className={`fixed bottom-4 right-4 hidden lg:block z-10 transition-all duration-300 ${collapsed ? 'lg:left-[88px]' : 'lg:left-[272px]'} lg:right-auto`}>
                    <div className={`px-3 py-2 rounded-xl border backdrop-blur-sm text-xs ${isDark
                            ? 'bg-[#1a1a1a]/80 border-[#2a2a2a] text-gray-500'
                            : 'bg-white/80 border-gray-200 text-gray-400'
                        }`}>
                        <div className="flex items-center gap-2">
                            <kbd className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${isDark ? 'bg-[#2a2a2a] text-gray-400' : 'bg-gray-100 text-gray-500'
                                }`}>
                                ⌘K
                            </kbd>
                            <span>Quick search</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
