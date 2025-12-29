import { Link } from '@inertiajs/react';
import NavLink from './NavLink';
import UserMenu from './UserMenu';

export default function Sidebar({ user, url, sidebarOpen, setSidebarOpen, collapsed, setCollapsed }) {
    return (
        <aside
            className={`fixed top-0 left-0 z-50 h-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl border-r border-gray-200/80 dark:border-gray-700/80 transform transition-all duration-300 lg:translate-x-0 shadow-2xl shadow-gray-900/10 dark:shadow-black/30 ${
                collapsed ? 'w-20' : 'w-72'
            } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
            <div className="flex flex-col h-full">
                {/* Logo Section */}
                <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200/80 dark:border-gray-700/80 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-900/50">
                    {!collapsed ? (
                        <>
                            <Link href="/" className="flex items-center space-x-3 group">
                                <div className="relative w-11 h-11 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center transform group-hover:scale-105 transition-all duration-300 shadow-lg shadow-blue-500/40">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity"></div>
                                </div>
                                <div>
                                    <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">DeviceHub</span>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Device Management</p>
                                </div>
                            </Link>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <div className="w-11 h-11 mx-auto bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/40">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                    {!collapsed && (
                        <div className="mb-4">
                            <p className="px-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Main Menu</p>
                        </div>
                    )}
                    <NavLink href="/dashboard" icon="home" active={url === '/dashboard'} collapsed={collapsed}>
                        Dashboard
                    </NavLink>
                    <NavLink href="/devices" icon="device" active={url?.startsWith('/devices') || false} collapsed={collapsed}>
                        My Devices
                    </NavLink>
                    <NavLink href="/profile" icon="user" active={url === '/profile'} collapsed={collapsed}>
                        Profile
                    </NavLink>

                    <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                        {!collapsed && (
                            <p className="px-4 mb-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Quick Links</p>
                        )}
                        <NavLink href="/" icon="globe" collapsed={collapsed}>
                            Landing Page
                        </NavLink>
                        <NavLink href="/pricing" icon="upgrade" collapsed={collapsed}>
                            Upgrade Plan
                        </NavLink>
                    </div>
                </nav>

                {/* Collapse Toggle Button */}
                <div className="hidden lg:block px-4 py-3 border-t border-gray-200/80 dark:border-gray-700/80 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-900/50">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full flex items-center justify-center p-2.5 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <svg className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                {/* User Info with Dropdown */}
                <UserMenu user={user} collapsed={collapsed} />
            </div>
        </aside>
    );
}
