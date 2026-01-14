import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function UserMenu({ user, collapsed = false }) {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const isDark = theme === 'dark';
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = () => {
        router.post('/logout');
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.charAt(0).toUpperCase();
    };

    if (collapsed) {
        return (
            <div className={`relative p-3 border-t ${isDark ? 'border-[#1a1a1a]' : 'border-gray-100'}`}>
                <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-full flex items-center justify-center"
                    title={user?.name}
                >
                    <div className={`relative w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
                        }`}>
                        <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {getInitials(user?.name)}
                        </span>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white dark:border-[#0d0d0d] rounded-full" />
                    </div>
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                        <div className={`absolute bottom-full left-0 right-0 mb-2 rounded-xl shadow-xl border py-1.5 z-20 min-w-52 ${isDark ? 'bg-[#0d0d0d] border-[#1a1a1a]' : 'bg-white border-gray-200'
                            }`}>
                            <div className={`px-3.5 py-2.5 border-b ${isDark ? 'border-[#1a1a1a]' : 'border-gray-100'}`}>
                                <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {user?.name || 'User'}
                                </p>
                                <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {user?.email}
                                </p>
                            </div>
                            <Link
                                href="/profile"
                                className={`flex items-center px-3.5 py-2.5 text-sm transition-all ${isDark ? 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white' : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <svg className="w-4 h-4 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {t('navigation.profile', { defaultValue: 'Profile' })}
                            </Link>
                            <div className={`border-t my-1 ${isDark ? 'border-[#1a1a1a]' : 'border-gray-100'}`} />
                            <button
                                onClick={handleLogout}
                                className={`flex items-center w-full px-3.5 py-2.5 text-sm transition-all ${isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
                                    }`}
                            >
                                <svg className="w-4 h-4 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                {t('auth.logout', { defaultValue: 'Logout' })}
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className={`relative p-3 border-t ${isDark ? 'border-[#1a1a1a]' : 'border-gray-100'}`}>
            <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'
                    }`}
            >
                <div className={`relative w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
                    }`}>
                    <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {getInitials(user?.name)}
                    </span>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 rounded-full ${isDark ? 'border-[#0d0d0d]' : 'border-white'
                        }`} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {user?.name || 'User'}
                    </p>
                    <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {user?.email}
                    </p>
                </div>
                <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''} ${isDark ? 'text-gray-500' : 'text-gray-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className={`absolute bottom-full left-2 right-2 mb-2 rounded-xl shadow-xl border py-1.5 z-20 overflow-hidden ${isDark ? 'bg-[#0d0d0d] border-[#1a1a1a]' : 'bg-white border-gray-200'
                        }`}>
                        <Link
                            href="/profile"
                            className={`flex items-center px-3.5 py-2.5 text-sm transition-all ${isDark ? 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <svg className="w-4 h-4 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {t('navigation.profile', { defaultValue: 'Profile' })}
                        </Link>
                        <Link
                            href="/profile"
                            className={`flex items-center px-3.5 py-2.5 text-sm transition-all ${isDark ? 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <svg className="w-4 h-4 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            </svg>
                            {t('navigation.settings', { defaultValue: 'Settings' })}
                        </Link>
                        <div className={`border-t my-1 ${isDark ? 'border-[#1a1a1a]' : 'border-gray-100'}`} />
                        <button
                            onClick={handleLogout}
                            className={`flex items-center w-full px-3.5 py-2.5 text-sm transition-all ${isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
                                }`}
                        >
                            <svg className="w-4 h-4 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            {t('auth.logout', { defaultValue: 'Logout' })}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
