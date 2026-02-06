import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/Contexts/ThemeContext';
import NavLink from './NavLink';
import UserMenu from './UserMenu';

export default function Sidebar({ user, url, sidebarOpen, setSidebarOpen, collapsed, setCollapsed }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { notifications: notificationData } = usePage().props;
    const unreadCount = notificationData?.unread_count || 0;

    // Simplified navigation - 5 main sections
    const navSections = [
        {
            title: t('navigation.main', { defaultValue: 'Chính' }),
            items: [
                { href: '/dashboard', icon: 'home', label: t('navigation.dashboard'), active: url === '/dashboard' },
                { href: '/devices', icon: 'device', label: t('navigation.devices'), active: url?.startsWith('/devices') },
            ]
        },
        {
            title: t('navigation.automation', { defaultValue: 'Tự động hóa' }),
            highlight: true,
            items: [
                { href: '/flows', icon: 'flow', label: t('navigation.workflows'), active: url?.startsWith('/flows'), highlight: true },
                { href: '/campaigns', icon: 'seed', label: t('navigation.campaigns'), active: url?.startsWith('/campaigns'), highlight: true },
                { href: '/tasks', icon: 'tasks', label: t('navigation.tasks', { defaultValue: 'Nhiệm Vụ' }), active: url?.startsWith('/tasks'), highlight: true },
                { href: '/jobs', icon: 'play', label: t('navigation.jobs'), active: url?.startsWith('/jobs') },
                { href: '/data-collections', icon: 'database', label: t('navigation.data_collections'), active: url?.startsWith('/data-collections') },
            ]
        },
    ];

    // Compact resources & finance section (bottom area)
    const compactItems = [
        { href: '/ai-studio', icon: 'ai', label: 'AI', active: url?.startsWith('/ai-studio') },
        { href: '/ai-credits', icon: 'credits', label: 'Credits', active: url?.startsWith('/ai-credits') },
        { href: '/marketplace', icon: 'shop', label: 'Market', active: url?.startsWith('/marketplace') },
        { href: '/media', icon: 'media', label: 'Media', active: url?.startsWith('/media') },
        { href: '/wallet', icon: 'wallet', label: 'Ví', active: url === '/wallet' },
        { href: '/topup', icon: 'plus', label: 'Nạp', active: url?.startsWith('/topup') },
        { href: '/withdraw', icon: 'withdraw', label: 'Rút', active: url?.startsWith('/withdraw') },
        { href: '/packages', icon: 'package', label: 'Gói', active: url?.startsWith('/packages') },
    ];

    // Quick access items for collapsed mode
    const quickAccessItems = [
        { href: '/notifications', icon: 'bell', label: t('navigation.notifications'), active: url?.startsWith('/notifications'), badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : null },
        { href: '/error-reports', icon: 'bug', label: t('navigation.error_reports', { defaultValue: 'Báo lỗi' }), active: url?.startsWith('/error-reports') },
    ];

    return (
        <aside
            className={`fixed top-0 left-0 z-50 h-full transform transition-all duration-300 lg:translate-x-0 ${collapsed ? 'w-[72px]' : 'w-60'
                } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isDark
                    ? 'bg-[#0c0c0e]/95 backdrop-blur-2xl border-r border-white/5'
                    : 'bg-white/80 backdrop-blur-2xl border-r border-gray-200/50 shadow-xl shadow-gray-200/20'
                }`}
        >
            <div className="flex flex-col h-full">
                {/* Logo Section */}
                <div className={`flex items-center justify-between h-14 px-4 ${isDark ? 'border-b border-white/5' : 'border-b border-gray-100'
                    }`}>
                    {!collapsed ? (
                        <>
                            <Link href="/" className="flex items-center gap-3 group">
                                <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-lg shadow-violet-500/30">
                                    <img src="/images/logo.png" alt="CLICKAI" className="w-full h-full object-cover" />
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border-2 border-white dark:border-[#0c0c0e]" />
                                </div>
                                <span className={`text-sm font-bold bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent`}>
                                    CLICKAI
                                </span>
                            </Link>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className={`lg:hidden p-1.5 rounded-lg transition-all ${isDark ? 'text-gray-500 hover:bg-white/5 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <div className="mx-auto w-8 h-8 rounded-xl overflow-hidden shadow-lg shadow-violet-500/30">
                            <img src="/images/logo.png" alt="CLICKAI" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-thin">
                    {navSections.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                            {!collapsed && (
                                <div className={`flex items-center gap-2 px-2 mb-2`}>
                                    {section.highlight && (
                                        <span className="text-xs">⚡</span>
                                    )}
                                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${section.highlight
                                        ? isDark ? 'text-violet-400' : 'text-violet-600'
                                        : isDark ? 'text-gray-600' : 'text-gray-400'
                                        }`}>
                                        {section.title}
                                    </p>
                                </div>
                            )}
                            <div className="space-y-0.5">
                                {section.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className="relative">
                                        <NavLink
                                            href={item.href}
                                            icon={item.icon}
                                            active={item.active}
                                            collapsed={collapsed}
                                            highlight={item.highlight}
                                        >
                                            {item.label}
                                        </NavLink>
                                        {item.badge && (
                                            <span className={`absolute ${collapsed ? 'top-0.5 right-0.5' : 'top-1.5 right-2'} inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg shadow-red-500/30`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Compact Resources & Finance Grid */}
                    {!collapsed && (
                        <div className={`pt-3 mt-2 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                            <p className={`px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                {t('navigation.resources_finance', { defaultValue: 'Tài nguyên & Tài chính' })}
                            </p>
                            <div className="grid grid-cols-4 gap-1 px-1">
                                {compactItems.map((item, index) => (
                                    <Link
                                        key={index}
                                        href={item.href}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all text-center ${item.active
                                                ? 'bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-violet-400'
                                                : isDark
                                                    ? 'hover:bg-white/5 text-gray-400 hover:text-white'
                                                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                                            }`}
                                    >
                                        <span className="text-base mb-0.5">
                                            {item.icon === 'ai' && '✨'}
                                            {item.icon === 'credits' && '⚡'}
                                            {item.icon === 'shop' && '🛒'}
                                            {item.icon === 'media' && '📷'}
                                            {item.icon === 'wallet' && '💰'}
                                            {item.icon === 'plus' && '➕'}
                                            {item.icon === 'withdraw' && '💸'}
                                            {item.icon === 'package' && '📦'}
                                        </span>
                                        <span className="text-[9px] font-medium truncate w-full">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Access */}
                    <div className={`pt-4 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                        {!collapsed && (
                            <p className={`px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                {t('navigation.quick_access', { defaultValue: 'Quick Access' })}
                            </p>
                        )}
                        <div className="space-y-0.5">
                            {quickAccessItems.map((item, index) => (
                                <div key={index} className="relative">
                                    <NavLink href={item.href} icon={item.icon} collapsed={collapsed} active={item.active}>
                                        {item.label}
                                    </NavLink>
                                    {item.badge && (
                                        <span className={`absolute ${collapsed ? 'top-0.5 right-0.5' : 'top-1.5 right-2'} inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg shadow-red-500/30`}>
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </nav>

                {/* Collapse Toggle */}
                <div className={`hidden lg:block px-3 py-2 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`w-full flex items-center justify-center p-2 rounded-xl transition-all ${isDark
                            ? 'text-gray-500 hover:text-white hover:bg-white/5'
                            : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        title={collapsed ? t('navigation.expand') : t('navigation.collapse')}
                    >
                        <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                {/* User Menu */}
                <UserMenu user={user} collapsed={collapsed} />
            </div>
        </aside>
    );
}
