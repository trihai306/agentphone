import { useState } from 'react';
import { usePage, router, Link } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getPageMetadata, ICONS } from '@/Config/pageMetadata';
import LanguageSwitcher from '../LanguageSwitcher';
import { Button } from '@/Components/UI';

const notificationStyles = {
    info: { icon: 'text-blue-500', iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    success: { icon: 'text-emerald-500', iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    warning: { icon: 'text-amber-500', iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    error: { icon: 'text-red-500', iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' },
};

export default function Header({ title, userName, setSidebarOpen }) {
    const { theme, toggleTheme } = useTheme();
    const { t, i18n } = useTranslation();
    const isDark = theme === 'dark';
    const { props, url } = usePage();
    const { notifications: notificationData, auth } = props;
    const [showNotifications, setShowNotifications] = useState(false);

    const notifications = notificationData?.items || [];
    const unreadCount = notificationData?.unread_count || 0;
    const wallet = auth?.wallet;
    const aiCredits = auth?.ai_credits || 0;

    // Get page metadata
    const pageMetadata = getPageMetadata(url, i18n.language);


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
        <header className={`sticky top-0 z-30 backdrop-blur-xl border-b transition-colors ${isDark
            ? 'bg-[#0a0a0a]/95 border-[#1a1a1a]'
            : 'bg-white/95 border-gray-200'
            }`}>
            <div className="flex items-center justify-between h-14 px-4 sm:px-6">
                {/* Left Section */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </Button>

                    {/* Page Metadata */}
                    <div className="hidden lg:flex items-center gap-3 flex-1 min-w-0">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${isDark
                            ? 'bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30'
                            : 'bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200'
                            }`}>
                            <svg className={`w-5 h-5 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ICONS[pageMetadata.icon] || ICONS.default} />
                            </svg>
                        </div>

                        {/* Title & Breadcrumb */}
                        <div className="flex-1 min-w-0">
                            {/* Breadcrumb */}
                            {pageMetadata.breadcrumb && pageMetadata.breadcrumb.length > 1 && (
                                <div className="flex items-center gap-1 mb-0.5">
                                    {pageMetadata.breadcrumb.map((item, index) => (
                                        <div key={index} className="flex items-center gap-1">
                                            {index > 0 && (
                                                <svg className={`w-3 h-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            )}
                                            {index < pageMetadata.breadcrumb.length - 1 ? (
                                                <Link
                                                    href={item.url}
                                                    className={`text-xs font-medium transition-colors ${isDark
                                                        ? 'text-gray-500 hover:text-gray-300'
                                                        : 'text-gray-400 hover:text-gray-600'
                                                        }`}
                                                >
                                                    {item.label}
                                                </Link>
                                            ) : (
                                                <span className={`text-xs font-medium ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                                    {item.label}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Title & Description */}
                            <div className="flex items-center gap-2">
                                <h1 className={`text-base font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {title || pageMetadata.title}
                                </h1>
                                {pageMetadata.description && (
                                    <>
                                        <span className={`hidden xl:inline ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>•</span>
                                        <p className={`hidden xl:block text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {pageMetadata.description}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile: Simple Title */}
                    <div className="lg:hidden flex-1 min-w-0">
                        <h1 className={`text-sm font-semibold truncate flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            <svg className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ICONS[pageMetadata.icon] || ICONS.default} />
                            </svg>
                            {title || pageMetadata.title}
                        </h1>
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

                    {/* Xu (Coins) Badge - 1 Xu = 100 VNĐ */}
                    <Link
                        href="/topup"
                        className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${isDark
                            ? 'bg-amber-900/30 text-amber-400 hover:bg-amber-900/50'
                            : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                            }`}
                        title={t('header.xu_tooltip', 'Xu - Dùng cho Nhiệm Vụ')}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{Math.floor((wallet?.balance || 0) / 100).toLocaleString()}</span>
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
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
                        className="hidden md:flex"
                        icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        }
                    >
                        <kbd className={`hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-medium rounded ${isDark ? 'bg-[#2a2a2a] text-gray-500' : 'bg-gray-200 text-gray-400'
                            }`}>
                            ⌘K
                        </kbd>
                    </Button>

                    {/* Contact Support */}
                    <div className="hidden sm:flex items-center gap-1">
                        {/* Zalo */}
                        <a
                            href="https://zalo.me/0987654321"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-1.5 rounded-lg transition-all ${isDark
                                ? 'hover:bg-[#1a1a1a]'
                                : 'hover:bg-gray-100'
                                }`}
                            title={t('header.contact_zalo', { defaultValue: 'Liên hệ qua Zalo' })}
                        >
                            <img src="/images/icons/zalo.png" alt="Zalo" className="w-6 h-6 rounded" />
                        </a>
                        {/* Facebook Messenger */}
                        <a
                            href="https://m.me/clickai.support"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-1.5 rounded-lg transition-all ${isDark
                                ? 'hover:bg-[#1a1a1a]'
                                : 'hover:bg-gray-100'
                                }`}
                            title={t('header.contact_facebook', { defaultValue: 'Liên hệ qua Facebook' })}
                        >
                            <img src="/images/icons/messenger.png" alt="Messenger" className="w-6 h-6 rounded" />
                        </a>
                    </div>

                    {/* Divider */}
                    <div className={`hidden md:block w-px h-6 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />

                    {/* Language Switcher */}
                    <LanguageSwitcher />

                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={toggleTheme}
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
                    </Button>

                    {/* Notifications */}
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative"
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
                        </Button>

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
                                            <Button
                                                variant="link"
                                                size="xs"
                                                onClick={handleMarkAllAsRead}
                                                className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}
                                            >
                                                {t('notifications.mark_all_read', { defaultValue: 'Mark all read' })}
                                            </Button>
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
                                                                <Button
                                                                    variant="danger-ghost"
                                                                    size="icon-xs"
                                                                    onClick={(e) => { e.stopPropagation(); handleRemove(notification.id); }}
                                                                >
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </Button>
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
