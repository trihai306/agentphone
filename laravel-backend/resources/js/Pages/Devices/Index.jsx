import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { useTheme } from '@/Contexts/ThemeContext';
import LiveViewPanel from '@/Components/Devices/LiveViewPanel';
import {
    Button,
    SearchInput,
    PageHeader,
    MetricCard,
    MetricCardGrid,
    Badge,
    EmptyState,
} from '@/Components/UI';

export default function Index({ devices }) {
    const { t } = useTranslation();
    const { showConfirm } = useConfirm();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [hoveredCard, setHoveredCard] = useState(null);
    const [liveViewDevice, setLiveViewDevice] = useState(null);

    const handleDelete = async (deviceId, e) => {
        e?.preventDefault();
        e?.stopPropagation();
        const confirmed = await showConfirm({
            title: t('devices.delete_device'),
            message: t('devices.confirm_delete'),
            type: 'danger',
            confirmText: t('common.delete'),
            cancelText: t('common.cancel'),
        });

        if (confirmed) {
            router.delete(`/devices/${deviceId}`);
        }
    };

    const filteredDevices = devices.data.filter(device =>
        device.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.device_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: devices.data.length,
        active: devices.data.filter(d => d.status === 'active').length,
        inactive: devices.data.filter(d => d.status === 'inactive').length,
    };

    const getTimeAgo = (date) => {
        if (!date) return t('devices.never');
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return t('devices.just_now');
        if (seconds < 3600) return t('devices.minutes_ago', { count: Math.floor(seconds / 60) });
        if (seconds < 86400) return t('devices.hours_ago', { count: Math.floor(seconds / 3600) });
        if (seconds < 604800) return t('devices.days_ago', { count: Math.floor(seconds / 86400) });
        return new Date(date).toLocaleDateString('vi', { month: 'short', day: 'numeric' });
    };

    const deviceBrands = {
        samsung: { color: 'from-blue-500 to-indigo-600' },
        xiaomi: { color: 'from-orange-500 to-red-500' },
        oppo: { color: 'from-green-500 to-emerald-500' },
        vivo: { color: 'from-blue-400 to-cyan-500' },
        realme: { color: 'from-yellow-500 to-orange-500' },
        default: { color: 'from-violet-500 to-purple-600' },
    };

    const getDeviceBrand = (model) => {
        if (!model) return deviceBrands.default;
        const lowerModel = model.toLowerCase();
        for (const brand of Object.keys(deviceBrands)) {
            if (lowerModel.includes(brand)) return deviceBrands[brand];
        }
        return deviceBrands.default;
    };

    const deviceIcon = (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    );

    return (
        <>
            <AppLayout title={t('devices.title')}>
                <Head title={t('devices.title')} />

                <div className={`min-h-screen ${isDark ? 'bg-[#09090b]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
                    {/* Background decoration */}
                    <div className="fixed inset-0 overflow-hidden pointer-events-none">
                        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-violet-900/20' : 'bg-violet-200/50'}`} />
                        <div className={`absolute bottom-0 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-200/40'}`} />
                    </div>

                    <div className="relative max-w-[1400px] mx-auto px-6 py-8">
                        {/* Page Header */}
                        <PageHeader
                            title={t('devices.title')}
                            subtitle={t('devices.manage_description')}
                            actions={
                                <Button variant="outline" href="/download/apk">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    {t('devices.download_apk')}
                                </Button>
                            }
                        />

                        {/* Stats Cards */}
                        <MetricCardGrid className="mb-8">
                            <MetricCard title={t('dashboard.stats.total_devices')} value={stats.total} icon={deviceIcon} color="purple" />
                            <MetricCard
                                title={t('devices.status.online')}
                                value={stats.active}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                color="green"
                            />
                            <MetricCard
                                title={t('devices.status.offline')}
                                value={stats.inactive}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
                                color="orange"
                            />
                        </MetricCardGrid>

                        {/* Toolbar */}
                        <div className={`flex items-center justify-between gap-4 p-4 rounded-2xl backdrop-blur-xl border mb-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg shadow-gray-200/30'}`}>
                            <div className="flex-1 max-w-md">
                                <SearchInput placeholder={t('devices.search_placeholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                            <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                {[{ mode: 'grid', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' }, { mode: 'list', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' }].map(({ mode, icon }) => (
                                    <button key={mode} onClick={() => setViewMode(mode)} className={`p-2.5 rounded-lg transition-all ${viewMode === mode ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25' : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-white'}`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} /></svg>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Devices Grid */}
                        {filteredDevices.length > 0 ? (
                            viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {filteredDevices.map((device) => {
                                        const brand = getDeviceBrand(device.model);
                                        const isOnline = device.status === 'active';
                                        return (
                                            <div
                                                key={device.id}
                                                onMouseEnter={() => setHoveredCard(device.id)}
                                                onMouseLeave={() => setHoveredCard(null)}
                                                className={`group relative overflow-hidden rounded-2xl backdrop-blur-xl border transition-all duration-300 ${isDark
                                                    ? 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                                                    : 'bg-white/80 border-gray-200/50 hover:border-gray-300 hover:shadow-xl shadow-lg shadow-gray-200/30'
                                                    } ${hoveredCard === device.id ? 'scale-[1.02]' : ''}`}
                                            >
                                                {/* Gradient Header */}
                                                <div className={`relative h-28 bg-gradient-to-br ${brand.color} p-4`}>
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                                        <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <div className="absolute top-3 right-3">
                                                        <Badge variant={isOnline ? 'success' : 'default'} dot size="sm">
                                                            {isOnline ? t('devices.status.online') : t('devices.status.offline')}
                                                        </Badge>
                                                    </div>
                                                    <div className="absolute bottom-3 left-3">
                                                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-black/20 text-white backdrop-blur-md border border-white/10">
                                                            {device.model || 'Unknown'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="p-5">
                                                    <h3 className={`font-semibold text-lg truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {device.name || 'Unnamed Device'}
                                                    </h3>
                                                    <p className={`text-xs font-mono mt-1 truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {device.device_id?.slice(0, 24)}...
                                                    </p>

                                                    {/* Footer */}
                                                    <div className={`flex items-center justify-between mt-5 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                                                        <div className="flex items-center gap-2">
                                                            <svg className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                {getTimeAgo(device.last_active_at)}
                                                            </span>
                                                        </div>

                                                        <div className={`flex items-center gap-1 transition-opacity ${hoveredCard === device.id ? 'opacity-100' : 'opacity-0'}`}>
                                                            {/* Live View button */}
                                                            {isOnline && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setLiveViewDevice(device); }}
                                                                    className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-violet-500/20 text-gray-400 hover:text-violet-400' : 'hover:bg-violet-50 text-gray-400 hover:text-violet-600'}`}
                                                                    title={t('devices.live_view', 'Live View')}
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => handleDelete(device.id, e)}
                                                                className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                                                                title={t('common.delete')}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* List View */
                                <div className={`rounded-2xl overflow-hidden backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50 shadow-lg'}`}>
                                    {filteredDevices.map((device) => {
                                        const brand = getDeviceBrand(device.model);
                                        const isOnline = device.status === 'active';
                                        return (
                                            <div key={device.id} className={`flex items-center gap-4 p-5 border-b last:border-b-0 transition-all ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${brand.color} shadow-lg`}>
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{device.name || 'Unnamed Device'}</h3>
                                                        <Badge variant={isOnline ? 'success' : 'default'} dot size="sm">
                                                            {isOnline ? t('devices.status.online') : t('devices.status.offline')}
                                                        </Badge>
                                                    </div>
                                                    <p className={`text-sm truncate mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{device.model || 'Unknown model'}</p>
                                                </div>
                                                <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{getTimeAgo(device.last_active_at)}</div>
                                                <div className="flex items-center gap-1">
                                                    {isOnline && (
                                                        <button onClick={(e) => { e.stopPropagation(); setLiveViewDevice(device); }} className={`p-2 rounded-lg ${isDark ? 'hover:bg-violet-500/20 text-gray-500 hover:text-violet-400' : 'hover:bg-violet-50 text-gray-400 hover:text-violet-600'}`} title={t('devices.live_view', 'Live View')}>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                        </button>
                                                    )}
                                                    <button onClick={(e) => handleDelete(device.id, e)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-red-500/20 text-gray-500 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`} title={t('common.delete')}>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        ) : (
                            <EmptyState
                                icon={deviceIcon}
                                title={searchQuery ? t('devices.no_results') : t('devices.no_devices')}
                                description={searchQuery ? `No results for "${searchQuery}"` : 'Download the CLICKAI Portal app on your Android device to get started'}
                                actionLabel={!searchQuery ? t('devices.download_apk') : undefined}
                                actionHref={!searchQuery ? '/download/apk' : undefined}
                            />
                        )}

                        {/* Pagination */}
                        {devices.last_page > 1 && (
                            <div className="mt-8 flex items-center justify-center gap-2">
                                {devices.prev_page_url && (
                                    <Link href={devices.prev_page_url} className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
                                        ← {t('common.previous')}
                                    </Link>
                                )}
                                <span className={`px-4 py-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Page {devices.current_page} of {devices.last_page}
                                </span>
                                {devices.next_page_url && (
                                    <Link href={devices.next_page_url} className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
                                        {t('common.next')} →
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </AppLayout>

            {/* Live View Panel */}
            <LiveViewPanel
                device={liveViewDevice}
                isOpen={!!liveViewDevice}
                onClose={() => setLiveViewDevice(null)}
            />
        </>
    );
}
