import { Link, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function Index({ stats, recentDevices }) {
    const { auth } = usePage().props;
    const currentHour = new Date().getHours();
    const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <AppLayout title="Dashboard">
            {/* Enhanced Welcome Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                            {greeting}, {auth.user.name?.split(' ')[0]}! 👋
                        </h1>
                        <p className="text-base text-gray-600 dark:text-gray-400">
                            Here's your device overview and system status
                        </p>
                    </div>
                    <Link
                        href="/devices/create"
                        className="hidden sm:flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Device</span>
                    </Link>
                </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="Total Devices"
                    value={stats.total}
                    icon="device"
                    gradient="from-blue-500 via-blue-600 to-indigo-600"
                    trend="+12%"
                    trendLabel="from last month"
                    trendUp={true}
                />
                <StatCard
                    title="Active Now"
                    value={stats.active}
                    icon="check"
                    gradient="from-emerald-500 via-green-600 to-teal-600"
                    trend={`${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%`}
                    trendLabel="online rate"
                    trendUp={true}
                />
                <StatCard
                    title="Offline"
                    value={stats.offline}
                    icon="offline"
                    gradient="from-rose-500 via-red-600 to-pink-600"
                    trend={`${stats.total > 0 ? Math.round((stats.offline / stats.total) * 100) : 0}%`}
                    trendLabel="offline rate"
                    trendUp={false}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Quick Actions Panel */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700/50 p-8 hover:shadow-2xl hover:shadow-gray-300/50 dark:hover:shadow-gray-900/80 transition-all duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Quick Actions</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your devices efficiently</p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/40">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <QuickActionButton
                                href="/devices/create"
                                icon="plus"
                                title="Add Device"
                                description="Register new"
                                color="blue"
                            />
                            <QuickActionButton
                                href="/devices"
                                icon="list"
                                title="All Devices"
                                description="View & manage"
                                color="purple"
                            />
                            <QuickActionButton
                                href="/profile"
                                icon="user"
                                title="Profile"
                                description="Account settings"
                                color="green"
                            />
                            <QuickActionButton
                                href="/pricing"
                                icon="upgrade"
                                title="Upgrade"
                                description="Premium features"
                                color="orange"
                            />
                        </div>
                    </div>
                </div>

                {/* System Status Panel */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700/50 p-8 hover:shadow-2xl hover:shadow-gray-300/50 dark:hover:shadow-gray-900/80 transition-all duration-500">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">System Health</h2>
                        <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Operational</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <StatusItem label="API Server" uptime="99.9%" />
                        <StatusItem label="Database" uptime="100%" />
                        <StatusItem label="Cloud Storage" uptime="99.8%" />
                        <StatusItem label="Monitoring" uptime="100%" />
                    </div>
                </div>
            </div>

            {/* Recent Devices Section */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700/50 p-8 hover:shadow-2xl hover:shadow-gray-300/50 dark:hover:shadow-gray-900/80 transition-all duration-500">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Recent Devices</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Your latest connected devices</p>
                    </div>
                    <Link
                        href="/devices"
                        className="flex items-center space-x-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-all duration-200"
                    >
                        <span>View All</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                {recentDevices.length > 0 ? (
                    <div className="space-y-3">
                        {recentDevices.map((device, index) => (
                            <DeviceCard key={device.id} device={device} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-3xl mb-6 shadow-inner">
                            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No devices yet</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                            Get started by adding your first device to monitor and manage it from anywhere.
                        </p>
                        <Link
                            href="/devices/create"
                            className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all duration-300 transform hover:-translate-y-0.5"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Add Your First Device</span>
                        </Link>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function StatCard({ title, value, icon, gradient, trend, trendLabel, trendUp }) {
    const icons = {
        device: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
        check: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
        offline: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
    };

    return (
        <div className="group relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700/50 p-6 hover:shadow-2xl hover:shadow-gray-300/50 dark:hover:shadow-gray-900/80 transition-all duration-500 overflow-hidden">
            {/* Subtle gradient background on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-500`}></div>

            <div className="relative">
                <div className="flex items-start justify-between mb-5">
                    <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
                        </svg>
                    </div>
                    <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-full ${trendUp ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
                        <svg className={`w-4 h-4 ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400 rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        <span className={`text-xs font-bold ${trendUp ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                            {trend}
                        </span>
                    </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                    {title}
                </h3>
                <div className="flex items-baseline space-x-2">
                    <p className="text-4xl font-extrabold text-gray-900 dark:text-white group-hover:scale-105 transition-transform duration-300">
                        {value}
                    </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {trendLabel}
                </p>
            </div>
        </div>
    );
}

function QuickActionButton({ href, icon, title, description, color }) {
    const colors = {
        blue: 'from-blue-500 via-blue-600 to-indigo-600',
        purple: 'from-purple-500 via-purple-600 to-fuchsia-600',
        green: 'from-emerald-500 via-green-600 to-teal-600',
        orange: 'from-orange-500 via-red-600 to-rose-600',
    };

    const icons = {
        plus: "M12 4v16m8-8H4",
        list: "M4 6h16M4 12h16M4 18h16",
        user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
        upgrade: "M13 10V3L4 14h7v7l9-11h-7z",
    };

    return (
        <Link
            href={href}
            className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl p-5 border border-gray-200 dark:border-gray-600/50 hover:border-transparent hover:shadow-lg hover:shadow-gray-300/30 dark:hover:shadow-gray-900/50 transition-all duration-300 hover:-translate-y-1"
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${colors[color]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
            <div className="relative">
                <div className={`w-12 h-12 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
                    </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-white transition-colors mb-1">
                    {title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-white/90 transition-colors">
                    {description}
                </p>
            </div>
        </Link>
    );
}

function StatusItem({ label, uptime }) {
    return (
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200">
            <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{uptime}</span>
            </div>
        </div>
    );
}

function DeviceCard({ device, index }) {
    const statusConfig = {
        online: {
            badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
            dot: 'bg-emerald-500',
        },
        offline: {
            badge: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
            dot: 'bg-gray-400',
        },
        maintenance: {
            badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
            dot: 'bg-amber-500',
        },
    };

    const config = statusConfig[device.status] || statusConfig.offline;

    return (
        <Link
            href={`/devices/${device.id}`}
            className="group flex items-center justify-between p-5 bg-gray-50/80 dark:bg-gray-700/20 hover:bg-white dark:hover:bg-gray-700/40 rounded-2xl border border-gray-200/50 dark:border-gray-600/30 hover:border-blue-200 dark:hover:border-blue-800/50 hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-900/20 transition-all duration-300 hover:-translate-y-0.5"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-blue-500/30">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div className={`absolute -top-1 -right-1 w-4 h-4 ${config.dot} border-2 border-white dark:border-gray-800 rounded-full shadow-lg`}></div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate text-base">
                        {device.name || device.device_id}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {device.model || 'Unknown Model'} • {new Date(device.last_active_at).toLocaleDateString()}
                    </p>
                </div>
            </div>
            <div className="flex items-center space-x-3">
                <span className={`px-3 py-1.5 border rounded-xl text-xs font-bold ${config.badge}`}>
                    {device.status}
                </span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </Link>
    );
}
