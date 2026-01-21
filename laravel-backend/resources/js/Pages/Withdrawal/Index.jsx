import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function Index({
    bankAccounts = [],
    pendingWithdrawals = [],
    recentWithdrawals = [],
    walletBalance = 0,
    availableBalance = 0,
    lockedBalance = 0,
    minWithdrawal = 50000,
    withdrawalFee = 0,
}) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [showAddBank, setShowAddBank] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        bank_account_id: bankAccounts.find(b => b.is_default)?.id || '',
        note: '',
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/withdraw', {
            onSuccess: () => reset(),
        });
    };

    const handleCancel = (transactionId) => {
        if (confirm(t('withdraw.confirm_cancel', { defaultValue: 'Bạn có chắc muốn hủy yêu cầu này?' }))) {
            router.post(`/withdraw/${transactionId}/cancel`);
        }
    };

    const receiveAmount = Math.max(0, (parseFloat(data.amount) || 0) - withdrawalFee);
    const isValidAmount = parseFloat(data.amount) >= minWithdrawal && parseFloat(data.amount) <= availableBalance;

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

    return (
        <AppLayout title={t('withdraw.title')}>
            <Head title={t('withdraw.title')} />

            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1400px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('withdraw.title')}
                            </h1>
                            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {t('withdraw.description', { defaultValue: 'Rút tiền từ ví về tài khoản ngân hàng của bạn' })}
                            </p>
                        </div>
                        <Link
                            href="/wallet"
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isDark
                                ? 'bg-white/5 text-white hover:bg-white/10'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {t('wallet.title')}
                        </Link>
                    </div>

                    {/* Balance Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className={`p-5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('wallet.current_balance')}
                            </p>
                            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {formatCurrency(walletBalance)}
                            </p>
                        </div>
                        <div className={`p-5 rounded-xl ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
                            <p className={`text-xs font-medium mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                {t('wallet.available_balance')}
                            </p>
                            <p className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                {formatCurrency(availableBalance)}
                            </p>
                        </div>
                        <div className={`p-5 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'}`}>
                            <p className={`text-xs font-medium mb-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                {t('wallet.pending_amount')}
                            </p>
                            <p className={`text-2xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                                {formatCurrency(lockedBalance)}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Withdrawal Form */}
                        <div className={`p-6 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <h2 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('withdraw.new_request', { defaultValue: 'Tạo yêu cầu rút tiền' })}
                            </h2>

                            {bankAccounts.length === 0 ? (
                                <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    <p className="mb-4">{t('withdraw.no_bank_account')}</p>
                                    <Link
                                        href="/bank-accounts"
                                        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg ${isDark
                                            ? 'bg-violet-600 text-white hover:bg-violet-700'
                                            : 'bg-violet-600 text-white hover:bg-violet-700'
                                            }`}
                                    >
                                        {t('withdraw.add_bank_account')}
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Amount */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {t('withdraw.amount')} <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={data.amount}
                                                onChange={(e) => setData('amount', e.target.value)}
                                                placeholder={t('withdraw.min_amount')}
                                                min={minWithdrawal}
                                                max={availableBalance}
                                                className={`w-full px-4 py-3 pr-16 rounded-lg text-lg font-semibold ${isDark
                                                    ? 'bg-[#0d0d0d] border-[#2a2a2a] text-white focus:border-violet-500'
                                                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-500'
                                                    } border focus:ring-2 focus:ring-violet-500/20 transition-colors`}
                                            />
                                            <span className={`absolute right-4 top-1/2 -translate-y-1/2 font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                VND
                                            </span>
                                        </div>
                                        {errors.amount && (
                                            <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
                                        )}
                                        <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {t('withdraw.min_amount')}: {formatCurrency(minWithdrawal)}
                                        </p>
                                    </div>

                                    {/* Bank Account */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {t('withdraw.select_bank')} <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={data.bank_account_id}
                                            onChange={(e) => setData('bank_account_id', e.target.value)}
                                            className={`w-full px-4 py-3 rounded-lg ${isDark
                                                ? 'bg-[#0d0d0d] border-[#2a2a2a] text-white'
                                                : 'bg-gray-50 border-gray-200 text-gray-900'
                                                } border focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors`}
                                        >
                                            <option value="">{t('withdraw.select_bank')}</option>
                                            {bankAccounts.map((account) => (
                                                <option key={account.id} value={account.id}>
                                                    {account.bank_name} - {account.account_number} - {account.account_name}
                                                    {account.is_default ? ' ⭐' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.bank_account_id && (
                                            <p className="mt-1 text-sm text-red-500">{errors.bank_account_id}</p>
                                        )}
                                        <Link
                                            href="/bank-accounts"
                                            className={`inline-block mt-2 text-xs ${isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'}`}
                                        >
                                            + {t('bank_accounts.add')}
                                        </Link>
                                    </div>

                                    {/* Fee & Receive Amount */}
                                    {data.amount && (
                                        <div className={`p-4 rounded-lg ${isDark ? 'bg-[#0d0d0d]' : 'bg-gray-50'}`}>
                                            <div className="flex justify-between mb-2">
                                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {t('withdraw.amount')}:
                                                </span>
                                                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {formatCurrency(parseFloat(data.amount) || 0)}
                                                </span>
                                            </div>
                                            {withdrawalFee > 0 && (
                                                <div className="flex justify-between mb-2">
                                                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {t('withdraw.fee')}:
                                                    </span>
                                                    <span className={`font-medium text-red-500`}>
                                                        -{formatCurrency(withdrawalFee)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={`flex justify-between pt-2 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                                                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {t('withdraw.receive_amount')}:
                                                </span>
                                                <span className="font-bold text-emerald-500">
                                                    {formatCurrency(receiveAmount)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Note */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {t('withdraw.note', { defaultValue: 'Ghi chú' })}
                                        </label>
                                        <textarea
                                            value={data.note}
                                            onChange={(e) => setData('note', e.target.value)}
                                            rows={2}
                                            className={`w-full px-4 py-3 rounded-lg ${isDark
                                                ? 'bg-[#0d0d0d] border-[#2a2a2a] text-white'
                                                : 'bg-gray-50 border-gray-200 text-gray-900'
                                                } border focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors`}
                                            placeholder={t('withdraw.note_placeholder', { defaultValue: 'Ghi chú tùy chọn...' })}
                                        />
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={processing || !isValidAmount || !data.bank_account_id}
                                        className={`w-full py-3 text-sm font-semibold rounded-lg transition-all ${processing || !isValidAmount || !data.bank_account_id
                                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                                : isDark
                                                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25'
                                                    : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700'
                                            }`}
                                    >
                                        {processing ? t('common.processing', { defaultValue: 'Đang xử lý...' }) : t('withdraw.submit')}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Pending Withdrawals */}
                        <div className={`p-6 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <h2 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('withdraw.pending_requests')}
                            </h2>

                            {pendingWithdrawals.length === 0 ? (
                                <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <p>{t('withdraw.no_pending', { defaultValue: 'Không có yêu cầu đang chờ' })}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingWithdrawals.map((withdrawal) => (
                                        <div
                                            key={withdrawal.id}
                                            className={`p-4 rounded-lg ${isDark ? 'bg-[#0d0d0d]' : 'bg-gray-50'}`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <p className={`text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {withdrawal.transaction_code}
                                                    </p>
                                                    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {formatCurrency(withdrawal.amount)}
                                                    </p>
                                                </div>
                                                {getStatusBadge(withdrawal.status)}
                                            </div>
                                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                <p>{withdrawal.bank_name} - {withdrawal.account_number}</p>
                                                <p>{withdrawal.account_name}</p>
                                                <p className="text-xs mt-1">{withdrawal.created_at}</p>
                                            </div>
                                            {withdrawal.status === 'pending' && (
                                                <button
                                                    onClick={() => handleCancel(withdrawal.id)}
                                                    className={`mt-3 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isDark
                                                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                                                        }`}
                                                >
                                                    {t('withdraw.cancel')}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Withdrawals */}
                    {recentWithdrawals.length > 0 && (
                        <div className={`mt-8 p-6 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {t('withdraw.recent_history', { defaultValue: 'Lịch sử rút tiền gần đây' })}
                                </h2>
                                <Link
                                    href="/wallet?type=withdrawal"
                                    className={`text-sm ${isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'}`}
                                >
                                    {t('common.view_all', { defaultValue: 'Xem tất cả' })} →
                                </Link>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className={`text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            <th className="pb-3 pr-4">{t('transaction.code')}</th>
                                            <th className="pb-3 pr-4">{t('transaction.amount')}</th>
                                            <th className="pb-3 pr-4">{t('bank_accounts.bank')}</th>
                                            <th className="pb-3 pr-4">{t('transaction.status')}</th>
                                            <th className="pb-3">{t('transaction.date')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-[#2a2a2a]' : 'divide-gray-100'}`}>
                                        {recentWithdrawals.map((tx) => (
                                            <tr key={tx.id}>
                                                <td className={`py-3 pr-4 text-sm font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {tx.transaction_code}
                                                </td>
                                                <td className={`py-3 pr-4 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {formatCurrency(tx.amount)}
                                                </td>
                                                <td className={`py-3 pr-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {tx.bank_name} - {tx.account_number}
                                                </td>
                                                <td className="py-3 pr-4">
                                                    {getStatusBadge(tx.status)}
                                                </td>
                                                <td className={`py-3 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {tx.created_at}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
