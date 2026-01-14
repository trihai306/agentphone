import { useState } from 'react';
import { usePage, router, Link } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';

const notificationStyles = {
    info: { icon: 'text-blue-500', iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    success: { icon: 'text-emerald-500', iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    warning: { icon: 'text-amber-500', iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    error: { icon: 'text-red-500', iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' },
};

export default function Header({ title, userName, setSidebarOpen }) {
    const { theme, toggleTheme } = useTheme();
    const { t } = useTranslation();
    const isDark = theme === 'dark';
    const { notifications: notificationData, auth } = usePage().props;
    const [showNotifications, setShowNotifications] = useState(false);

    const notifications = notificationData?.items || [];
    const unreadCount = notificationData?.unread_count || 0;
    const wallet = auth?.wallet;
    const aiCredits = auth?.ai_credits || 0;

    const handleMarkAsRead = (id) => {
        router.post(`/notifications/${id}/read`, {}, { preserveScroll: true, preserveState: true });
    };

    const handleMarkAllAsRead = () => {
        router.post('/notifications/read-all', {}, { preserveScroll: true, preserveState: true });
    };

    const handleRemove = (id) => {
        router.delete(`/notifications/${id}`, { preserveScroll: true, preserveState: true });
    };

    return (
        <header className={`sticky top-0 z-30 h-14 backdrop-blur-xl border-b transition-colors ${isDark
                ? 'bg-[#0a0a0a]/95 border-[#1a1a1a]'
                : 'bg-white/95 border-gray-200'
            }`}>
            <div className="flex items-center justify-between h-full px-4 sm:px-6">
                {/* Left Section */}
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className={`lg:hidden p-2 rounded-lg transition-all ${isDark ? 'text-gray-400 hover:bg-[#1a1a1a]' : 'text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Page Title */}
                    <div className="hidden lg:block">
                        <h1 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {title || 'Dashboard'}
                        </h1>
                        <p className={`text-xs -mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t('header.welcome_back', { defaultValue: 'Welcome back' })}, {userName}
                        </p>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    {/* AI Credits Badge */}
                    <Link
                        href="/ai-credits"
                        className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${isDark
                                ? 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50'
                                : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="font-medium">{aiCredits.toLocaleString()}</span>
                    </Link>

                    {/* Wallet Balance */}
                    <Link
                        href="/topup"
                        className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${isDark
                                ? 'bg-[#1a1a1a] text-white hover:bg-[#222]'
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className="font-medium">{wallet?.formatted_balance || '0 ₫'}</span>
                    </Link>

                    {/* Search Button */}
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
                        className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${isDark
                                ? 'text-gray-500 hover:bg-[#1a1a1a] hover:text-white'
                                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <kbd className={`hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-medium rounded ${isDark ? 'bg-[#2a2a2a] text-gray-500' : 'bg-gray-200 text-gray-400'
                            }`}>
                            ⌘K
                        </kbd>
                    </button>

                    {/* Divider */}
                    <div className={`hidden md:block w-px h-6 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />

                    {/* Language Switcher */}
                    <LanguageSwitcher />

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-lg transition-all ${isDark
                                ? 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                        aria-label="Toggle theme"
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

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`relative p-2 rounded-lg transition-all ${isDark
                                    ? 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                                    <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-red-500 text-white text-[9px] font-bold">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                                <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-xl border z-20 overflow-hidden ${isDark ? 'bg-[#0d0d0d] border-[#1a1a1a]' : 'bg-white border-gray-200'
                                    }`}>
                                    <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'border-[#1a1a1a]' : 'border-gray-100'
                                        }`}>
                                        <div>
                                            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {t('notifications.title', { defaultValue: 'Notifications' })}
                                            </h3>
                                            {unreadCount > 0 && (
                                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {unreadCount} {t('notifications.unread', { defaultValue: 'unread' })}
                                                </p>
                                            )}
                                        </div>
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={handleMarkAllAsRead}
                                                className={`text-xs font-medium ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                                    }`}
                                            >
                                                {t('notifications.mark_all_read', { defaultValue: 'Mark all read' })}
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="px-4 py-12 text-center">
                                                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
                                                    }`}>
                                                    <svg className={`w-6 h-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                    </svg>
                                                </div>
                                                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {t('notifications.empty', { defaultValue: 'No notifications' })}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className={`divide-y ${isDark ? 'divide-[#1a1a1a]' : 'divide-gray-100'}`}>
                                                {notifications.slice(0, 5).map((notification) => {
                                                    const style = notificationStyles[notification.type] || notificationStyles.info;
                                                    const isRead = notification.is_read_by_current_user;

                                                    return (
                                                        <div
                                                            key={notification.id}
                                                            className={`px-4 py-3 transition-colors cursor-pointer ${isDark
                                                                    ? `hover:bg-[#1a1a1a] ${!isRead ? 'bg-blue-900/10' : ''}`
                                                                    : `hover:bg-gray-50 ${!isRead ? 'bg-blue-50/50' : ''}`
                                                                }`}
                                                            onClick={() => !isRead && handleMarkAsRead(notification.id)}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.iconPath} />
                                                                </svg>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-sm font-medium ${!isRead
                                                                            ? isDark ? 'text-white' : 'text-gray-900'
                                                                            : isDark ? 'text-gray-400' : 'text-gray-600'
                                                                        }`}>
                                                                        {notification.title}
                                                                    </p>
                                                                    <p className={`text-xs mt-0.5 line-clamp-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                        {notification.message}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleRemove(notification.id); }}
                                                                    className={`p-1 rounded transition-colors ${isDark ? 'text-gray-600 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
                                                                        }`}
                                                                >
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {notifications.length > 0 && (
                                        <div className={`px-4 py-3 border-t ${isDark ? 'border-[#1a1a1a] bg-[#0a0a0a]' : 'border-gray-100 bg-gray-50'
                                            }`}>
                                            <Link
                                                href="/notifications"
                                                onClick={() => setShowNotifications(false)}
                                                className={`block w-full text-center text-xs font-medium ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                                    }`}
                                            >
                                                {t('notifications.view_all', { defaultValue: 'View all notifications' })}
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
