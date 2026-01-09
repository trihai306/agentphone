import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import Sidebar from '../Components/Layout/Sidebar';
import Header from '../Components/Layout/Header';
import CommandPalette from '../Components/Layout/CommandPalette';
import Breadcrumbs from '../Components/Layout/Breadcrumbs';

export default function AppLayout({ children, title, breadcrumbs }) {
    const { auth, flash } = usePage().props;
    const currentUrl = usePage().url; // Lấy current URL từ Inertia page object
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
            {/* Subtle Background Pattern */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-50">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 dark:bg-blue-900/20 rounded-full filter blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-100 dark:bg-purple-900/20 rounded-full filter blur-3xl"></div>
            </div>

            {/* Command Palette (Cmd+K) */}
            <CommandPalette />

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
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
            <div className={`relative transition-all duration-300 ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
                {/* Header */}
                <Header
                    title={title}
                    userName={auth.user?.name?.split(' ')[0]}
                    setSidebarOpen={setSidebarOpen}
                />

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="mx-4 sm:mx-5 lg:mx-6 mt-4 animate-slide-down">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <p className="ml-2.5 text-sm font-medium text-green-800 dark:text-green-200">{flash.success}</p>
                            </div>
                        </div>
                    </div>
                )}

                {flash?.error && (
                    <div className="mx-4 sm:mx-5 lg:mx-6 mt-4 animate-slide-down">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <p className="ml-2.5 text-sm font-medium text-red-800 dark:text-red-200">{flash.error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Page Content */}
                <main className="p-4 sm:p-5 lg:p-6">
                    {/* Breadcrumbs */}
                    {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}

                    {/* Page Children */}
                    {children}
                </main>

                {/* Keyboard Shortcuts Hint */}
                <div className="fixed bottom-4 left-4 hidden lg:block z-10">
                    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2.5 py-2 rounded-xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm">
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-[10px] border border-gray-200 dark:border-gray-700 font-semibold">
                                ⌘K
                            </kbd>
                            <span>tìm kiếm</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
