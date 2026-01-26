import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import {
    PageHeader,
    SectionHeader,
    ActionCard,
    Table,
    Badge,
    EmptyStateCard,
    GlassCard,
    GlassCardStat,
    Button,
    DataList,
} from '@/Components/UI';

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
        { href: '/devices', icon: '📱', title: t('devices.title'), description: t('dashboard.quick_actions.devices.description') },
        { href: '/flows', icon: '⚡', title: t('flows.title'), description: t('dashboard.quick_actions.workflows.description') },
        { href: '/ai-studio', icon: '✨', title: t('ai_studio.title'), description: t('ai_studio.generate') },
        { href: '/media', icon: '🖼️', title: t('media.title'), description: t('media.my_media') },
    ];

    const systemServices = [
        { label: t('dashboard.system_status.api_server'), value: t('dashboard.recent_devices.status.online') },
        { label: t('dashboard.system_status.database'), value: t('dashboard.recent_devices.status.online') },
        { label: t('dashboard.system_status.websocket'), value: t('dashboard.recent_devices.status.online') },
        { label: t('dashboard.system_status.queue_worker'), value: t('dashboard.recent_devices.status.online') },
    ];

    // Table columns for recent devices
    const deviceColumns = [
        {
            header: t('devices.title'),
            accessor: 'name',
            render: (_, device) => (
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
            ),
        },
        {
            header: t('common.status'),
            accessor: 'status',
            render: (status) => (
                <Badge
                    variant={status === 'active' ? 'success' : 'default'}
                    dot
                    size="sm"
                >
                    {status === 'active' ? t('dashboard.recent_devices.status.online') : t('dashboard.recent_devices.status.offline')}
                </Badge>
            ),
        },
        {
            header: t('devices.fields.last_active'),
            accessor: 'last_active_at',
            render: (date) => (
                <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {new Date(date).toLocaleDateString()}
                </span>
            ),
        },
    ];

    return (
        <AppLayout title={t('dashboard.title')}>
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1400px] mx-auto px-6 py-6">
                    {/* Header */}
                    <PageHeader
                        title={t('dashboard.welcome', { name: auth.user?.name })}
                        subtitle={t('dashboard.quick_actions.description')}
                    />

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {statCards.map((stat, i) => (
                            <GlassCard key={i} gradient="gray" hover={false} padding="p-5">
                                <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {stat.label}
                                </p>
                                <p className={`text-3xl font-semibold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {stat.value}
                                </p>
                            </GlassCard>
                        ))}
                    </div>

                    {/* Wallet Balance Card */}
                    <GlassCard gradient="purple" className="mb-8" hover={false}>
                        <div className="flex items-center justify-between">
                            <GlassCardStat
                                value={formatCurrency(walletBalance)}
                                label={t('dashboard.stats.wallet_balance')}
                            />
                            <Button href="/topup" variant={isDark ? 'primary' : 'secondary'}>
                                {t('topup.title')}
                            </Button>
                        </div>
                    </GlassCard>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Quick Actions */}
                        <div className="lg:col-span-2">
                            <SectionHeader title={t('dashboard.quick_actions.title')} />
                            <div className="grid grid-cols-2 gap-3">
                                {quickActions.map((action, i) => (
                                    <ActionCard
                                        key={i}
                                        icon={action.icon}
                                        title={action.title}
                                        description={action.description}
                                        href={action.href}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* System Status */}
                        <div>
                            <SectionHeader title={t('dashboard.system_status.title')} />
                            <GlassCard gradient="green" hover={false}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Badge variant="success" dot size="sm">
                                        {t('dashboard.system_status.active')}
                                    </Badge>
                                </div>
                                <DataList items={systemServices} />
                            </GlassCard>
                        </div>
                    </div>

                    {/* Recent Devices */}
                    <div className="mt-8">
                        <SectionHeader
                            title={t('dashboard.recent_devices.title')}
                            action={t('common.view_all')}
                            actionHref="/devices"
                        />

                        {recentDevices?.length > 0 ? (
                            <Table
                                columns={deviceColumns}
                                data={recentDevices.slice(0, 5)}
                            />
                        ) : (
                            <EmptyStateCard
                                icon="📱"
                                title={t('dashboard.recent_devices.empty.title')}
                                description={t('dashboard.recent_devices.empty.description')}
                                actionLabel={t('devices.create')}
                                actionHref="/devices/create"
                            />
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
