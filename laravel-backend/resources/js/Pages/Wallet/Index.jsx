import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function Index({
    stats = {},
    transactions = { data: [] },
    filters = {},
    typeOptions = [],
    statusOptions = [],
}) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [localFilters, setLocalFilters] = useState({
        type: filters.type || '',
        status: filters.status || '',
        from_date: filters.from_date || '',
        to_date: filters.to_date || '',
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleFilterChange = (key, value) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        router.get('/wallet', newFilters, { preserveState: true });
    };

    const clearFilters = () => {
        setLocalFilters({ type: '', status: '', from_date: '', to_date: '' });
        router.get('/wallet');
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700',
            processing: isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700',
            completed: isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700',
            failed: isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700',
            cancelled: isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600',
        };
        const labels = {
            pending: t('transaction.statuses.pending'),
            processing: t('transaction.statuses.processing'),
            completed: t('transaction.statuses.completed'),
            failed: t('transaction.statuses.failed'),
            cancelled: t('transaction.statuses.cancelled'),
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.pending}`}>
                {labels[status] || status}
            </span>
        );
    };

    const getTypeBadge = (type) => {
        const styles = {
            deposit: isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700',
            withdrawal: isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700',
            ai_generation: isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-700',
        };
        const labels = {
            deposit: t('transaction.types.deposit'),
            withdrawal: t('transaction.types.withdrawal'),
            ai_generation: t('transaction.types.ai_generation'),
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[type] || ''}`}>
                {labels[type] || type}
            </span>
        );
    };

    const getAmountDisplay = (tx) => {
        const isIncome = tx.type === 'deposit';
        const prefix = isIncome ? '+' : '-';
        const colorClass = isIncome
            ? 'text-emerald-500'
            : tx.type === 'withdrawal' ? 'text-red-500' : 'text-violet-500';
        return (
            <span className={`font-semibold ${colorClass}`}>
                {prefix}{formatCurrency(tx.type === 'deposit' ? tx.final_amount : tx.amount)}
            </span>
        );
    };

    return (
        <AppLayout title={t('wallet.title')}>
            <Head title={t('wallet.title')} />

            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1400px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('wallet.title')}
                            </h1>
                            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {t('wallet.description', { defaultValue: 'Quản lý ví và xem lịch sử giao dịch' })}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                href="/topup"
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isDark
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    }`}
                            >
                                + {t('navigation.topup')}
                            </Link>
                            <Link
                                href="/withdraw"
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isDark
                                    ? 'bg-white/10 text-white hover:bg-white/20'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {t('navigation.withdraw')}
                            </Link>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        <div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('wallet.current_balance')}
                            </p>
                            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {formatCurrency(stats.balance || 0)}
                            </p>
                        </div>
                        <div className={`p-5 rounded-xl ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
                            <p className={`text-xs font-medium mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                {t('wallet.available_balance')}
                            </p>
                            <p className={`text-xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                {formatCurrency(stats.available_balance || 0)}
                            </p>
                        </div>
                        <div className={`p-5 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'}`}>
                            <p className={`text-xs font-medium mb-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                {t('wallet.pending_amount')}
                            </p>
                            <p className={`text-xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                                {formatCurrency(stats.locked_balance || 0)}
                            </p>
                        </div>
                        <div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('wallet.total_deposits', { defaultValue: 'Tổng nạp' })}
                            </p>
                            <p className={`text-xl font-bold text-emerald-500`}>
                                +{formatCurrency(stats.total_deposits || 0)}
                            </p>
                        </div>
                        <div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('wallet.total_withdrawals', { defaultValue: 'Tổng rút' })}
                            </p>
                            <p className={`text-xl font-bold text-red-500`}>
                                -{formatCurrency(stats.total_withdrawals || 0)}
                            </p>
                        </div>
                        <div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('wallet.pending_count', { defaultValue: 'Đang chờ' })}
                            </p>
                            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {stats.pending_count || 0}
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[150px]">
                                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t('transaction.type')}
                                </label>
                                <select
                                    value={localFilters.type}
                                    onChange={(e) => handleFilterChange('type', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg text-sm ${isDark
                                        ? 'bg-[#0d0d0d] border-[#2a2a2a] text-white'
                                        : 'bg-gray-50 border-gray-200 text-gray-900'
                                        } border focus:ring-2 focus:ring-violet-500/20`}
                                >
                                    {typeOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t('transaction.status')}
                                </label>
                                <select
                                    value={localFilters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg text-sm ${isDark
                                        ? 'bg-[#0d0d0d] border-[#2a2a2a] text-white'
                                        : 'bg-gray-50 border-gray-200 text-gray-900'
                                        } border focus:ring-2 focus:ring-violet-500/20`}
                                >
                                    {statusOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t('common.from_date', { defaultValue: 'Từ ngày' })}
                                </label>
                                <input
                                    type="date"
                                    value={localFilters.from_date}
                                    onChange={(e) => handleFilterChange('from_date', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg text-sm ${isDark
                                        ? 'bg-[#0d0d0d] border-[#2a2a2a] text-white'
                                        : 'bg-gray-50 border-gray-200 text-gray-900'
                                        } border focus:ring-2 focus:ring-violet-500/20`}
                                />
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t('common.to_date', { defaultValue: 'Đến ngày' })}
                                </label>
                                <input
                                    type="date"
                                    value={localFilters.to_date}
                                    onChange={(e) => handleFilterChange('to_date', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg text-sm ${isDark
                                        ? 'bg-[#0d0d0d] border-[#2a2a2a] text-white'
                                        : 'bg-gray-50 border-gray-200 text-gray-900'
                                        } border focus:ring-2 focus:ring-violet-500/20`}
                                />
                            </div>
                            <button
                                onClick={clearFilters}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isDark
                                    ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                                    }`}
                            >
                                {t('common.clear', { defaultValue: 'Xóa lọc' })}
                            </button>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className={`p-6 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                        <h2 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {t('wallet.transaction_history')}
                        </h2>

                        {transactions.data.length === 0 ? (
                            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <p>{t('wallet.no_transactions', { defaultValue: 'Chưa có giao dịch nào' })}</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className={`text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                <th className="pb-3 pr-4">{t('transaction.code')}</th>
                                                <th className="pb-3 pr-4">{t('transaction.type')}</th>
                                                <th className="pb-3 pr-4">{t('transaction.amount')}</th>
                                                <th className="pb-3 pr-4">{t('transaction.status')}</th>
                                                <th className="pb-3 pr-4">{t('common.details', { defaultValue: 'Chi tiết' })}</th>
                                                <th className="pb-3">{t('transaction.date')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${isDark ? 'divide-[#2a2a2a]' : 'divide-gray-100'}`}>
                                            {transactions.data.map((tx) => (
                                                <tr key={tx.id} className={`${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors`}>
                                                    <td className={`py-4 pr-4 text-sm font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {tx.transaction_code}
                                                    </td>
                                                    <td className="py-4 pr-4">
                                                        {getTypeBadge(tx.type)}
                                                    </td>
                                                    <td className="py-4 pr-4">
                                                        {getAmountDisplay(tx)}
                                                    </td>
                                                    <td className="py-4 pr-4">
                                                        {getStatusBadge(tx.status)}
                                                    </td>
                                                    <td className={`py-4 pr-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {tx.bank_name && (
                                                            <span>{tx.bank_name} - {tx.account_number}</span>
                                                        )}
                                                        {tx.ai_generation_type && (
                                                            <span className="capitalize">{tx.ai_generation_type}</span>
                                                        )}
                                                        {tx.reject_reason && (
                                                            <span className="text-red-500 text-xs block">{tx.reject_reason}</span>
                                                        )}
                                                    </td>
                                                    <td className={`py-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {tx.created_at}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {transactions.links && transactions.links.length > 3 && (
                                    <div className="flex justify-center gap-2 mt-6">
                                        {transactions.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`px-3 py-1 text-sm rounded-lg transition-colors ${link.active
                                                        ? 'bg-violet-600 text-white'
                                                        : link.url
                                                            ? isDark
                                                                ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            : isDark
                                                                ? 'text-gray-600 cursor-not-allowed'
                                                                : 'text-gray-300 cursor-not-allowed'
                                                    }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                preserveState
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
