import { useState } from 'react';
import { Link, router } from '@inertiajs/react';

export default function UserMenu({ user, collapsed = false }) {
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = () => {
        router.post('/logout');
    };

    if (collapsed) {
        return (
            <div className="relative p-4 border-t border-gray-200/50 dark:border-gray-700/50">
                <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-full flex items-center justify-center group"
                    title={user?.name}
                >
                    <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-lg">
                        <span className="text-white font-bold text-sm">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    </div>
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)}></div>
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-20 min-w-60">
                            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                    {user?.name || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {user?.email}
                                </p>
                            </div>
                            <Link
                                href="/profile"
                                className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-700 transition-all"
                            >
                                <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Edit Profile
                            </Link>
                            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            >
                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign Out
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="relative p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-gray-800/50 dark:to-gray-900/50">
            <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all group"
            >
                <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform shadow-lg">
                    <span className="text-white font-bold text-lg">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user?.email}
                    </p>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)}></div>
                    <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-20 overflow-hidden">
                        <Link
                            href="/profile"
                            className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-700 transition-all"
                        >
                            <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Edit Profile
                        </Link>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
