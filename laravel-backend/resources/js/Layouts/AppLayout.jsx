import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import Sidebar from '../Components/Layout/Sidebar';
import Header from '../Components/Layout/Header';
import CommandPalette from '../Components/Layout/CommandPalette';
import Breadcrumbs from '../Components/Layout/Breadcrumbs';

export default function AppLayout({ children, title, breadcrumbs }) {
    const { auth, flash, url } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 transition-colors duration-200">
            {/* Animated Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            {/* Command Palette (Cmd+K) */}
            <CommandPalette />

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <Sidebar
                user={auth.user}
                url={url}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
            />

            {/* Main Content */}
            <div className={`relative transition-all duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
                {/* Header */}
                <Header
                    title={title}
                    userName={auth.user?.name?.split(' ')[0]}
                    setSidebarOpen={setSidebarOpen}
                />

                {/* Flash Messages with Animation */}
                {flash?.success && (
                    <div className="mx-4 sm:mx-6 lg:mx-8 mt-6 animate-slide-down">
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl shadow-lg">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="w-6 h-6 text-green-500 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <p className="ml-3 text-sm font-medium text-green-800 dark:text-green-200">{flash.success}</p>
                            </div>
                        </div>
                    </div>
                )}

                {flash?.error && (
                    <div className="mx-4 sm:mx-6 lg:mx-8 mt-6 animate-slide-down">
                        <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-xl shadow-lg">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="w-6 h-6 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <p className="ml-3 text-sm font-medium text-red-800 dark:text-red-200">{flash.error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Page Content */}
                <main className="p-4 sm:p-6 lg:p-8">
                    {/* Breadcrumbs */}
                    {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}

                    {/* Page Children */}
                    {children}
                </main>

                {/* Keyboard Shortcuts Hint */}
                <div className="fixed bottom-4 left-4 hidden lg:block z-10">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl px-3 py-2 rounded-lg border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-semibold">
                                ⌘K
                            </kbd>
                            <span>for quick search</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
