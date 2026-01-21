import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function Index({ bankAccounts = [], banks = [] }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [showForm, setShowForm] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        bank_id: '',
        account_number: '',
        account_name: '',
        branch: '',
        is_default: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingAccount) {
            put(`/bank-accounts/${editingAccount.id}`, {
                onSuccess: () => {
                    reset();
                    setEditingAccount(null);
                    setShowForm(false);
                },
            });
        } else {
            post('/bank-accounts', {
                onSuccess: () => {
                    reset();
                    setShowForm(false);
                },
            });
        }
    };

    const handleEdit = (account) => {
        setEditingAccount(account);
        setData({
            bank_id: account.bank_id,
            account_number: account.account_number,
            account_name: account.account_name,
            branch: account.branch || '',
            is_default: account.is_default,
        });
        setShowForm(true);
    };

    const handleDelete = (accountId) => {
        if (confirm(t('bank_accounts.confirm_delete'))) {
            router.delete(`/bank-accounts/${accountId}`);
        }
    };

    const handleSetDefault = (accountId) => {
        router.post(`/bank-accounts/${accountId}/set-default`);
    };

    const cancelForm = () => {
        reset();
        setEditingAccount(null);
        setShowForm(false);
    };

    return (
        <AppLayout title={t('bank_accounts.title')}>
            <Head title={t('bank_accounts.title')} />

            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1000px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('bank_accounts.title')}
                            </h1>
                            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {t('bank_accounts.description', { defaultValue: 'Quản lý tài khoản ngân hàng để nhận tiền rút' })}
                            </p>
                        </div>
                        {!showForm && (
                            <button
                                onClick={() => setShowForm(true)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isDark
                                    ? 'bg-violet-600 text-white hover:bg-violet-700'
                                    : 'bg-violet-600 text-white hover:bg-violet-700'
                                    }`}
                            >
                                + {t('bank_accounts.add')}
                            </button>
                        )}
                    </div>

                    {/* Add/Edit Form */}
                    {showForm && (
                        <div className={`p-6 rounded-xl mb-6 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <h2 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {editingAccount ? t('bank_accounts.edit', { defaultValue: 'Sửa tài khoản' }) : t('bank_accounts.add')}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Bank */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {t('bank_accounts.bank')} <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={data.bank_id}
                                            onChange={(e) => setData('bank_id', e.target.value)}
                                            disabled={!!editingAccount}
                                            className={`w-full px-4 py-3 rounded-lg ${isDark
                                                ? 'bg-[#0d0d0d] border-[#2a2a2a] text-white'
                                                : 'bg-gray-50 border-gray-200 text-gray-900'
                                                } border focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 disabled:opacity-50`}
                                        >
                                            <option value="">{t('bank_accounts.select_bank', { defaultValue: 'Chọn ngân hàng' })}</option>
                                            {banks.map((bank) => (
                                                <option key={bank.id} value={bank.id}>
                                                    {bank.short_name} - {bank.full_name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.bank_id && (
                                            <p className="mt-1 text-sm text-red-500">{errors.bank_id}</p>
                                        )}
                                    </div>

                                    {/* Account Number */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {t('bank_accounts.account_number')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.account_number}
                                            onChange={(e) => setData('account_number', e.target.value)}
                                            disabled={!!editingAccount}
                                            placeholder="VD: 1234567890"
                                            className={`w-full px-4 py-3 rounded-lg ${isDark
                                                ? 'bg-[#0d0d0d] border-[#2a2a2a] text-white'
                                                : 'bg-gray-50 border-gray-200 text-gray-900'
                                                } border focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 disabled:opacity-50`}
                                        />
                                        {errors.account_number && (
                                            <p className="mt-1 text-sm text-red-500">{errors.account_number}</p>
                                        )}
                                    </div>

                                    {/* Account Name */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {t('bank_accounts.account_name')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.account_name}
                                            onChange={(e) => setData('account_name', e.target.value)}
                                            placeholder="VD: NGUYEN VAN A"
                                            className={`w-full px-4 py-3 rounded-lg uppercase ${isDark
                                                ? 'bg-[#0d0d0d] border-[#2a2a2a] text-white'
                                                : 'bg-gray-50 border-gray-200 text-gray-900'
                                                } border focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500`}
                                        />
                                        {errors.account_name && (
                                            <p className="mt-1 text-sm text-red-500">{errors.account_name}</p>
                                        )}
                                    </div>

                                    {/* Branch */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {t('bank_accounts.branch')}
                                        </label>
                                        <input
                                            type="text"
                                            value={data.branch}
                                            onChange={(e) => setData('branch', e.target.value)}
                                            placeholder={t('bank_accounts.branch_placeholder', { defaultValue: 'Chi nhánh (tùy chọn)' })}
                                            className={`w-full px-4 py-3 rounded-lg ${isDark
                                                ? 'bg-[#0d0d0d] border-[#2a2a2a] text-white'
                                                : 'bg-gray-50 border-gray-200 text-gray-900'
                                                } border focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500`}
                                        />
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-colors ${isDark
                                            ? 'bg-violet-600 text-white hover:bg-violet-700'
                                            : 'bg-violet-600 text-white hover:bg-violet-700'
                                            } disabled:opacity-50`}
                                    >
                                        {processing
                                            ? t('common.processing', { defaultValue: 'Đang xử lý...' })
                                            : editingAccount
                                                ? t('common.save', { defaultValue: 'Lưu' })
                                                : t('bank_accounts.add')
                                        }
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cancelForm}
                                        className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-colors ${isDark
                                            ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {t('common.cancel', { defaultValue: 'Hủy' })}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Bank Accounts List */}
                    <div className={`p-6 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                        <h2 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {t('bank_accounts.your_accounts', { defaultValue: 'Tài khoản của bạn' })}
                        </h2>

                        {bankAccounts.length === 0 ? (
                            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                <p>{t('bank_accounts.no_accounts', { defaultValue: 'Chưa có tài khoản ngân hàng nào' })}</p>
                                <button
                                    onClick={() => setShowForm(true)}
                                    className={`mt-4 px-4 py-2 text-sm font-medium rounded-lg ${isDark
                                        ? 'bg-violet-600 text-white hover:bg-violet-700'
                                        : 'bg-violet-600 text-white hover:bg-violet-700'
                                        }`}
                                >
                                    + {t('bank_accounts.add')}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {bankAccounts.map((account) => (
                                    <div
                                        key={account.id}
                                        className={`p-4 rounded-xl flex items-center justify-between ${account.is_default
                                                ? isDark
                                                    ? 'bg-violet-500/10 border border-violet-500/30'
                                                    : 'bg-violet-50 border border-violet-200'
                                                : isDark
                                                    ? 'bg-[#0d0d0d] border border-[#2a2a2a]'
                                                    : 'bg-gray-50 border border-gray-100'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Bank Logo */}
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-white'}`}>
                                                {account.bank_logo ? (
                                                    <img src={account.bank_logo} alt={account.bank_name} className="w-8 h-8 object-contain" />
                                                ) : (
                                                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-600'}`}>
                                                        {account.bank_name?.charAt(0)}
                                                    </span>
                                                )}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {account.bank_name}
                                                    </span>
                                                    {account.is_default && (
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${isDark
                                                            ? 'bg-violet-500/20 text-violet-400'
                                                            : 'bg-violet-100 text-violet-700'
                                                            }`}>
                                                            {t('bank_accounts.default')}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-sm font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {account.account_number}
                                                </p>
                                                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {account.account_name}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!account.is_default && (
                                                <button
                                                    onClick={() => handleSetDefault(account.id)}
                                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isDark
                                                        ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {t('bank_accounts.set_default')}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEdit(account)}
                                                className={`p-2 rounded-lg transition-colors ${isDark
                                                    ? 'text-gray-400 hover:bg-white/10 hover:text-white'
                                                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                                    }`}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(account.id)}
                                                className={`p-2 rounded-lg transition-colors ${isDark
                                                    ? 'text-red-400 hover:bg-red-500/20'
                                                    : 'text-red-500 hover:bg-red-100'
                                                    }`}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
