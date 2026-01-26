import { useState } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import {
    PageHeader,
    GlassCard,
    GlassCardStat,
    Button,
    Badge,
    EmptyStateCard,
} from '@/Components/UI';

export default function History({ topups = { data: [] }, stats = {} }) {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const isDark = theme === 'dark';
    const [filter, setFilter] = useState('all');

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);

    const getStatusVariant = (status) => {
        const variants = {
            completed: 'success',
            pending: 'warning',
            failed: 'danger',
            cancelled: 'default',
        };
        return variants[status] || 'default';
    };

    const getStatusLabel = (status) => {
        const labels = { completed: t('topup.completed'), pending: t('topup.pending'), failed: t('topup.failed'), cancelled: t('topup.cancelled') };
        return labels[status] || status;
    };

    const filteredTopups = filter === 'all' ? topups.data : topups.data.filter(t => t.payment_status === filter);

    const statsData = [
        { label: t('topup.current_balance'), value: formatCurrency(stats.current_balance || 0) },
        { label: t('topup.total_deposited'), value: formatCurrency(stats.total_amount || 0), gradient: 'emerald' },
        { label: t('topup.pending'), value: formatCurrency(stats.pending_amount || 0), gradient: 'amber' },
        { label: t('topup.transactions'), value: stats.total_topups || 0 },
    ];

    return (
        <AppLayout title={t('topup.history_title')}>
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[900px] mx-auto px-6 py-6">
                    {/* Header */}
                    <PageHeader
                        title={t('topup.history_title')}
                        subtitle={t('topup.history_description')}
                        actions={
                            <Button href="/topup">
                                + {t('topup.title')}
                            </Button>
                        }
                    />

                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {statsData.map((stat, i) => (
                            <GlassCardStat
                                key={i}
                                label={stat.label}
                                value={stat.value}
                                gradient={stat.gradient || 'gray'}
                            />
                        ))}
                    </div>

                    {/* Filter */}
                    <div className="flex items-center gap-2 mb-6">
                        {['all', 'completed', 'pending', 'failed'].map((tab) => (
                            <Button
                                key={tab}
                                variant={filter === tab ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setFilter(tab)}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </Button>
                        ))}
                    </div>

                    {/* Transactions */}
                    {filteredTopups.length > 0 ? (
                        <GlassCard gradient="gray" hover={false} className="p-0">
                            <div className={`divide-y ${isDark ? 'divide-[#2a2a2a]' : 'divide-gray-100'}`}>
                                {filteredTopups.map((topup) => (
                                    <div key={topup.id} className={`p-4 ${isDark ? 'hover:bg-[#222]' : 'hover:bg-gray-50'}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {topup.package_name}
                                                </p>
                                                <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {topup.order_code} • {new Date(topup.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                    +{formatCurrency(topup.price || topup.amount)}
                                                </p>
                                                <Badge variant={getStatusVariant(topup.payment_status)} size="sm">
                                                    {getStatusLabel(topup.payment_status)}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {topups.last_page > 1 && (
                                <div className={`px-4 py-3 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Page {topups.current_page} of {topups.last_page}
                                        </span>
                                        <div className="flex gap-2">
                                            {topups.prev_page_url && (
                                                <Button href={topups.prev_page_url} variant="ghost" size="sm">
                                                    Previous
                                                </Button>
                                            )}
                                            {topups.next_page_url && (
                                                <Button href={topups.next_page_url} size="sm">
                                                    Next
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </GlassCard>
                    ) : (
                        <EmptyStateCard
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            }
                            title="No transactions"
                            description={filter === 'all' ? "You haven't made any top-ups yet" : 'No matching transactions'}
                            action={
                                <Button href="/topup">
                                    Top Up Now
                                </Button>
                            }
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
