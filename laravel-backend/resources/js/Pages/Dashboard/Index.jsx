import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Index({ stats, recentDevices, walletBalance = 0, activePackages = 0, workflowCount = 0 }) {
    const { auth } = usePage().props;
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const statCards = [
        { label: t('dashboard.stats.total_devices'), value: stats?.total || 0 },
        { label: t('dashboard.stats.active'), value: stats?.active || 0 },
        { label: t('dashboard.stats.packages'), value: activePackages },
        { label: t('flows.title'), value: workflowCount },
    ];

    const quickActions = [
        { href: '/devices', icon: '📱', label: t('devices.title'), desc: t('dashboard.quick_actions.devices.description') },
        { href: '/flows', icon: '⚡', label: t('flows.title'), desc: t('dashboard.quick_actions.workflows.description') },
        { href: '/ai-studio', icon: '✨', label: t('ai_studio.title'), desc: t('ai_studio.generate') },
        { href: '/media', icon: '🖼️', label: t('media.title'), desc: t('media.my_media') },
    ];

    const systemServices = [
        { key: 'api_server', label: t('dashboard.system_status.api_server') },
        { key: 'database', label: t('dashboard.system_status.database') },
        { key: 'websocket', label: t('dashboard.system_status.websocket') },
        { key: 'queue', label: t('dashboard.system_status.queue_worker') },
    ];

    return (
        <AppLayout title={t('dashboard.title')}>
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1400px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {t('dashboard.welcome', { name: auth.user?.name })}
                        </h1>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {t('dashboard.quick_actions.description')}
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {statCards.map((stat, i) => (
                            <div
                                key={i}
                                className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}
                            >
                                <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {stat.label}
                                </p>
                                <p className={`text-3xl font-semibold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {stat.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Wallet Balance Card */}
                    <div className={`p-6 rounded-xl mb-8 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t('dashboard.stats.wallet_balance')}
                                </p>
                                <p className={`text-3xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(walletBalance)}
                                </p>
                            </div>
                            <Link
                                href="/topup"
                                className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark
                                    ? 'bg-white text-black hover:bg-gray-100'
                                    : 'bg-gray-900 text-white hover:bg-gray-800'
                                    }`}
                            >
                                {t('topup.title')}
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Quick Actions */}
                        <div className="lg:col-span-2">
                            <h2 className={`text-sm font-medium uppercase tracking-wider mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('dashboard.quick_actions.title')}
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                {quickActions.map((action, i) => (
                                    <Link
                                        key={i}
                                        href={action.href}
                                        className={`p-4 rounded-xl transition-all ${isDark
                                            ? 'bg-[#1a1a1a] hover:bg-[#222]'
                                            : 'bg-white border border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <span className="text-2xl">{action.icon}</span>
                                        <h3 className={`font-medium mt-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {action.label}
                                        </h3>
                                        <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {action.desc}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* System Status */}
                        <div>
                            <h2 className={`text-sm font-medium uppercase tracking-wider mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('dashboard.system_status.title')}
                            </h2>
                            <div className={`p-4 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                                    <span className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                        {t('dashboard.system_status.active')}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {systemServices.map((service, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {service.label}
                                            </span>
                                            <span className={`text-xs font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                {t('dashboard.recent_devices.status.online')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Devices */}
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={`text-sm font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('dashboard.recent_devices.title')}
                            </h2>
                            <Link
                                href="/devices"
                                className={`text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                {t('common.view_all')} →
                            </Link>
                        </div>

                        {recentDevices?.length > 0 ? (
                            <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                <table className="w-full">
                                    <thead>
                                        <tr className={`border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                                            <th className={`text-left py-3 px-4 text-xs font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {t('devices.title')}
                                            </th>
                                            <th className={`text-left py-3 px-4 text-xs font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {t('common.status')}
                                            </th>
                                            <th className={`text-left py-3 px-4 text-xs font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {t('devices.fields.last_active')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-[#2a2a2a]' : 'divide-gray-100'}`}>
                                        {recentDevices.slice(0, 5).map((device) => (
                                            <tr key={device.id} className={isDark ? 'hover:bg-[#222]' : 'hover:bg-gray-50'}>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                                                            <span className="text-sm">📱</span>
                                                        </div>
                                                        <div>
                                                            <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                {device.name || device.device_id}
                                                            </p>
                                                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                {device.model || t('dashboard.recent_devices.unknown')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${device.status === 'active'
                                                        ? isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                                                        : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${device.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                                        {device.status === 'active' ? t('dashboard.recent_devices.status.online') : t('dashboard.recent_devices.status.offline')}
                                                    </span>
                                                </td>
                                                <td className={`py-3 px-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {new Date(device.last_active_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className={`p-12 rounded-xl text-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                <div className={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-3 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                                    <span className="text-xl">📱</span>
                                </div>
                                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {t('dashboard.recent_devices.empty.title')}
                                </p>
                                <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {t('dashboard.recent_devices.empty.description')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
