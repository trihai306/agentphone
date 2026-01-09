import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { WelcomeBanner, GlassCard, StatCardPremium, SkeletonStats, SkeletonCard } from '../../Components/UI';

export default function Index({ stats, recentDevices, walletBalance = 0, activePackages = 0, workflowCount = 0 }) {
    const { auth } = usePage().props;
    const [loading, setLoading] = useState(false);

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <AppLayout title="Bảng Điều Khiển">
            {/* Premium Welcome Banner */}
            <WelcomeBanner
                user={auth.user}
                stats={{
                    balance: formatCurrency(walletBalance),
                    devices: stats?.total || 0,
                    workflows: workflowCount,
                }}
                className="mb-8"
            />

            {/* Stats Grid - Premium Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCardPremium
                    title="Tổng Thiết Bị"
                    value={stats?.total || 0}
                    trend={12}
                    chartData={[3, 5, 4, 6, 8, 7, 9]}
                    chartColor="blue"
                    gradient="blue"
                    icon={
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    }
                    iconGradient="from-blue-500 to-indigo-600"
                />
                <StatCardPremium
                    title="Đang Hoạt Động"
                    value={stats?.active || 0}
                    trend={stats?.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}
                    trendLabel="% online"
                    gradient="green"
                    icon={
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    iconGradient="from-emerald-500 to-teal-600"
                />
                <StatCardPremium
                    title="Gói Dịch Vụ"
                    value={activePackages}
                    subtitle="Đang sử dụng"
                    gradient="purple"
                    icon={
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    }
                    iconGradient="from-purple-500 to-pink-600"
                />
                <StatCardPremium
                    title="Số Dư Ví"
                    value={formatCurrency(walletBalance)}
                    chartData={[10, 15, 12, 18, 14, 20, 25]}
                    chartColor="orange"
                    gradient="orange"
                    icon={
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    }
                    iconGradient="from-orange-500 to-amber-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Quick Actions Panel */}
                <div className="lg:col-span-2">
                    <GlassCard gradient="purple" padding="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Thao Tác Nhanh</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Quản lý thiết bị và dịch vụ</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <QuickActionButton href="/devices" icon="📱" title="Thiết Bị" description="Quản lý devices" color="blue" />
                            <QuickActionButton href="/packages" icon="📦" title="Gói Dịch Vụ" description="Mua & quản lý" color="purple" />
                            <QuickActionButton href="/topup" icon="💳" title="Nạp Tiền" description="Top-up ví" color="green" />
                            <QuickActionButton href="/flows" icon="⚡" title="Workflows" description="Tự động hóa" color="orange" />
                        </div>
                    </GlassCard>
                </div>

                {/* System Status Panel */}
                <GlassCard gradient="green" padding="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Trạng Thái Hệ Thống</h2>
                        <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Hoạt động</span>
                        </span>
                    </div>
                    <div className="space-y-3">
                        <StatusItem label="API Server" status="online" uptime="99.9%" />
                        <StatusItem label="Database" status="online" uptime="100%" />
                        <StatusItem label="WebSocket" status="online" uptime="99.8%" />
                        <StatusItem label="Queue Worker" status="online" uptime="100%" />
                    </div>
                </GlassCard>
            </div>

            {/* Recent Devices Section */}
            <GlassCard gradient="gray" padding="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Thiết Bị Gần Đây</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Các thiết bị đã kết nối</p>
                    </div>
                    <Link
                        href="/devices"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-all"
                    >
                        <span>Xem tất cả</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                {recentDevices?.length > 0 ? (
                    <div className="space-y-3">
                        {recentDevices.map((device, index) => (
                            <DeviceCard key={device.id} device={device} index={index} />
                        ))}
                    </div>
                ) : (
                    <EmptyDevicesState />
                )}
            </GlassCard>
        </AppLayout>
    );
}

function QuickActionButton({ href, icon, title, description, color }) {
    const colors = {
        blue: 'hover:border-blue-400 hover:bg-blue-500/10',
        purple: 'hover:border-purple-400 hover:bg-purple-500/10',
        green: 'hover:border-emerald-400 hover:bg-emerald-500/10',
        orange: 'hover:border-orange-400 hover:bg-orange-500/10',
    };

    return (
        <Link
            href={href}
            className={`group flex items-center gap-4 p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50 ${colors[color]} transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}
        >
            <span className="text-3xl group-hover:scale-110 transition-transform">{icon}</span>
            <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
        </Link>
    );
}

function StatusItem({ label, status, uptime }) {
    const colors = {
        online: 'bg-emerald-500',
        offline: 'bg-gray-400',
        warning: 'bg-amber-500',
    };

    return (
        <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
            <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 ${colors[status]} rounded-full ${status === 'online' ? 'animate-pulse' : ''}`}></span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{uptime}</span>
        </div>
    );
}

function DeviceCard({ device, index }) {
    const statusColors = {
        online: 'bg-emerald-500',
        offline: 'bg-gray-400',
        maintenance: 'bg-amber-500',
    };

    return (
        <Link
            href={`/devices/${device.id}`}
            className="group flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 rounded-xl border border-transparent hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg transition-all duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 ${statusColors[device.status] || statusColors.offline} border-2 border-white dark:border-gray-800 rounded-full`}></span>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {device.name || device.device_id}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {device.model || 'Không rõ'} • {new Date(device.last_active_at).toLocaleDateString('vi-VN')}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${device.status === 'online'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                    {device.status === 'online' ? 'Trực tuyến' : 'Ngoại tuyến'}
                </span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </Link>
    );
}

function EmptyDevicesState() {
    return (
        <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Chưa có thiết bị</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Thiết bị sẽ tự động xuất hiện khi bạn kết nối ứng dụng Portal
            </p>
        </div>
    );
}
