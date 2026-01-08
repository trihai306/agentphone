import { Link, usePage } from '@inertiajs/react';
import NavLink from './NavLink';
import UserMenu from './UserMenu';

export default function Sidebar({ user, url, sidebarOpen, setSidebarOpen, collapsed, setCollapsed }) {
    const { notifications: notificationData, auth } = usePage().props;
    const unreadCount = notificationData?.unread_count || 0;
    const wallet = auth?.wallet;

    return (
        <aside
            className={`fixed top-0 left-0 z-50 h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200/60 dark:border-gray-800/60 transform transition-all duration-300 lg:translate-x-0 shadow-xl shadow-gray-900/5 dark:shadow-black/20 ${
                collapsed ? 'w-[72px]' : 'w-64'
            } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
            <div className="flex flex-col h-full">
                {/* Logo Section */}
                <div className="flex items-center justify-between h-14 px-4 border-b border-gray-100 dark:border-gray-800">
                    {!collapsed ? (
                        <>
                            <Link href="/" className="flex items-center space-x-2.5 group">
                                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/30">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">DeviceHub</span>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 -mt-0.5">Management</p>
                                </div>
                            </Link>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <div className="w-9 h-9 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/30">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Wallet Balance Card */}
                {!collapsed && (
                    <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-800">
                        <Link
                            href="/topup"
                            className="block p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-emerald-100 text-[10px] font-medium">Số dư ví</p>
                                    <p className="text-sm font-bold">{wallet?.formatted_balance || '0 ₫'}</p>
                                </div>
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
                    {/* Overview Section */}
                    {!collapsed && (
                        <div className="mb-2">
                            <p className="px-3 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Tổng quan</p>
                        </div>
                    )}
                    <NavLink href="/dashboard" icon="home" active={url === '/dashboard'} collapsed={collapsed}>
                        Dashboard
                    </NavLink>
                    <NavLink href="/devices" icon="device" active={url?.startsWith('/devices') || false} collapsed={collapsed}>
                        Thiết bị
                    </NavLink>

                    {/* Services Section */}
                    <div className="pt-3 mt-2">
                        {!collapsed && (
                            <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Dịch vụ</p>
                        )}
                        <NavLink href="/packages" icon="package" active={url?.startsWith('/packages') || url?.startsWith('/my-packages')} collapsed={collapsed}>
                            Gói dịch vụ
                        </NavLink>
                        <NavLink href="/flows" icon="flow" active={url?.startsWith('/flows')} collapsed={collapsed}>
                            Flow Builder
                        </NavLink>
                        <NavLink href="/topup" icon="wallet" active={url?.startsWith('/topup')} collapsed={collapsed}>
                            Nạp tiền
                        </NavLink>
                        <NavLink href="/topup/history" icon="history" active={url === '/topup/history'} collapsed={collapsed}>
                            Lịch sử GD
                        </NavLink>
                    </div>

                    {/* Account Section */}
                    <div className="pt-3 mt-2">
                        {!collapsed && (
                            <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Tài khoản</p>
                        )}
                        <NavLink href="/profile" icon="user" active={url === '/profile'} collapsed={collapsed}>
                            Hồ sơ
                        </NavLink>
                        <div className="relative">
                            <NavLink href="/notifications" icon="bell" active={url?.startsWith('/notifications')} collapsed={collapsed}>
                                Thông báo
                            </NavLink>
                            {unreadCount > 0 && (
                                <span className={`absolute ${collapsed ? 'top-1 right-1' : 'top-1.5 right-2'} inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold leading-none text-white bg-red-500 rounded-full min-w-[16px]`}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </div>
                        <NavLink href="/profile" icon="settings" active={url === '/settings'} collapsed={collapsed}>
                            Cài đặt
                        </NavLink>
                    </div>

                    {/* Support Section */}
                    <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-800">
                        {!collapsed && (
                            <p className="px-3 mb-2 mt-2 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Hỗ trợ</p>
                        )}
                        <NavLink href="/pricing" icon="upgrade" collapsed={collapsed}>
                            Nâng cấp
                        </NavLink>
                        <NavLink href="/contact" icon="support" collapsed={collapsed}>
                            Liên hệ
                        </NavLink>
                    </div>
                </nav>

                {/* Collapse Toggle Button */}
                <div className="hidden lg:block px-3 py-2 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                        title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
                    >
                        <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
