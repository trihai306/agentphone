import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/Contexts/ThemeContext';
import { useWalletUpdates } from '@/hooks/useWalletUpdates';
import NavLink from './NavLink';
import UserMenu from './UserMenu';

export default function Sidebar({ user, url, sidebarOpen, setSidebarOpen, collapsed, setCollapsed }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { notifications: notificationData, auth } = usePage().props;
    const unreadCount = notificationData?.unread_count || 0;
    const wallet = auth?.wallet;
    const aiCredits = auth?.ai_credits || 0;

    // Use real-time wallet updates hook
    const { balance: realtimeBalance, lastUpdate } = useWalletUpdates();

    const navSections = [
        {
            title: t('navigation.overview', { defaultValue: 'Overview' }),
            items: [
                { href: '/dashboard', icon: 'home', label: t('navigation.dashboard'), active: url === '/dashboard' },
                { href: '/devices', icon: 'device', label: t('navigation.devices'), active: url?.startsWith('/devices') },
            ]
        },
        {
            title: t('navigation.automation', { defaultValue: 'Automation' }),
            highlight: true, // Make this section stand out
            items: [
                { href: '/flows', icon: 'flow', label: t('navigation.workflows'), active: url?.startsWith('/flows'), highlight: true, description: 'Tạo kịch bản' },
                { href: '/campaigns', icon: 'seed', label: 'Campaigns', active: url?.startsWith('/campaigns'), highlight: true, description: 'Nuôi tài khoản' },
                { href: '/jobs', icon: 'play', label: 'Jobs', active: url?.startsWith('/jobs'), description: 'Lịch sử chạy' },
                { href: '/data-collections', icon: 'database', label: t('navigation.data_collections'), active: url?.startsWith('/data-collections'), description: 'Quản lý dữ liệu' },
            ]
        },
        {
            title: t('navigation.ai_tools', { defaultValue: 'AI Studio' }),
            items: [
                { href: '/ai-studio', icon: 'ai', label: t('navigation.ai_studio', { defaultValue: 'Generate' }), active: url?.startsWith('/ai-studio') && !url?.includes('generations'), highlight: true },
                { href: '/ai-studio/generations', icon: 'gallery', label: t('navigation.ai_gallery', { defaultValue: 'Gallery' }), active: url?.includes('generations') },
                { href: '/ai-credits', icon: 'credits', label: t('navigation.ai_credits', { defaultValue: 'Credits' }), active: url?.startsWith('/ai-credits') },
            ]
        },
        {
            title: t('navigation.resources', { defaultValue: 'Resources' }),
            items: [
                { href: '/media', icon: 'media', label: t('navigation.media'), active: url?.startsWith('/media') },
                { href: '/packages', icon: 'package', label: t('navigation.packages'), active: url?.startsWith('/packages') || url?.startsWith('/my-packages') },
            ]
        },
        {
            title: t('navigation.account', { defaultValue: 'Account' }),
            items: [
                { href: '/profile', icon: 'user', label: t('navigation.profile'), active: url === '/profile' },
                {
                    href: '/notifications',
                    icon: 'bell',
                    label: t('navigation.notifications'),
                    active: url?.startsWith('/notifications'),
                    badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : null
                },
            ]
        },
    ];

    return (
        <aside
            className={`fixed top-0 left-0 z-50 h-full transform transition-all duration-300 lg:translate-x-0 ${collapsed ? 'w-[72px]' : 'w-64'
                } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isDark
                    ? 'bg-[#0c0c0e]/95 backdrop-blur-2xl border-r border-white/5'
                    : 'bg-white/80 backdrop-blur-2xl border-r border-gray-200/50 shadow-xl shadow-gray-200/20'
                }`}
        >
            <div className="flex flex-col h-full">
                {/* Logo Section */}
                <div className={`flex items-center justify-between h-16 px-4 ${isDark ? 'border-b border-white/5' : 'border-b border-gray-100'
                    }`}>
                    {!collapsed ? (
                        <>
                            <Link href="/" className="flex items-center gap-3 group">
                                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                                    <span className="text-lg font-bold text-white">C</span>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-[#0c0c0e]" />
                                </div>
                                <div>
                                    <span className={`text-base font-bold bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent`}>
                                        CLICKAI
                                    </span>
                                    <p className={`text-[10px] -mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Automation Platform
                                    </p>
                                </div>
                            </Link>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className={`lg:hidden p-2 rounded-lg transition-all ${isDark ? 'text-gray-500 hover:bg-white/5 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <div className="mx-auto w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <span className="text-lg font-bold text-white">C</span>
                        </div>
                    )}
                </div>

                {/* Credits & Balance Card */}
                {!collapsed && (
                    <div className="px-3 py-4">
                        <div className={`p-4 rounded-2xl ${isDark
                            ? 'bg-gradient-to-br from-violet-500/10 to-purple-600/10 border border-violet-500/20'
                            : 'bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100'
                            }`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t('dashboard.stats.wallet_balance')}
                                </span>
                                <Link href="/topup" className={`text-xs font-medium ${isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'}`}>
                                    + Top up
                                </Link>
                            </div>
                            <p className={`text-xl font-bold transition-all duration-300 ${lastUpdate ? 'text-emerald-500 scale-105' : ''} ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {realtimeBalance > 0
                                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(realtimeBalance)
                                    : (wallet?.formatted_balance || '0 ₫')
                                }
                            </p>
                            <div className={`flex items-center gap-2 mt-3 pt-3 border-t ${isDark ? 'border-white/10' : 'border-violet-200/50'}`}>
                                <div className="flex items-center gap-1.5">
                                    <svg className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {aiCredits.toLocaleString()}
                                    </span>
                                </div>
                                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>AI Credits</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto scrollbar-thin">
                    {navSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className={section.highlight && !collapsed ? `p-2 rounded-2xl ${isDark ? 'bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20' : 'bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200/50'}` : ''}>
                            {!collapsed && (
                                <div className={`flex items-center gap-2 px-2 mb-2 ${section.highlight ? '' : ''}`}>
                                    {section.highlight && (
                                        <span className="text-xs">🤖</span>
                                    )}
                                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${section.highlight
                                            ? isDark ? 'text-violet-400' : 'text-violet-600'
                                            : isDark ? 'text-gray-600' : 'text-gray-400'
                                        }`}>
                                        {section.title}
                                    </p>
                                </div>
                            )}
                            <div className="space-y-1">
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

                    {/* Support Links */}
                    <div className={`pt-4 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                        {!collapsed && (
                            <p className={`px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'
                                }`}>
                                {t('navigation.support', { defaultValue: 'Support' })}
                            </p>
                        )}
                        <div className="space-y-1">
                            <NavLink href="/topup" icon="wallet" collapsed={collapsed}>
                                {t('navigation.topup')}
                            </NavLink>
                            <NavLink href="/topup/history" icon="history" collapsed={collapsed} active={url === '/topup/history'}>
                                {t('topup.history')}
                            </NavLink>
                            <NavLink href="/pricing" icon="upgrade" collapsed={collapsed}>
                                {t('pricing.title')}
                            </NavLink>
                            <NavLink href="/contact" icon="support" collapsed={collapsed}>
                                {t('contact.title')}
                            </NavLink>
                        </div>
                    </div>
                </nav>

                {/* Collapse Toggle */}
                <div className={`hidden lg:block px-3 py-2 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`w-full flex items-center justify-center p-2.5 rounded-xl transition-all ${isDark
                            ? 'text-gray-500 hover:text-white hover:bg-white/5'
                            : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        title={collapsed ? 'Expand' : 'Collapse'}
                    >
                        <svg className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
