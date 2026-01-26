import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import {
    PageHeader,
    SectionHeader,
    GlassCard,
    Input,
    Select,
    Button,
    Badge,
    EmptyStateCard,
    Avatar,
} from '@/Components/UI';

export default function Index({ bankAccounts = [], banks = [] }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { showConfirm } = useConfirm();
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

    const handleDelete = async (account) => {
        const confirmed = await showConfirm({
            title: t('bank_accounts.confirm_delete'),
            message: t('bank_accounts.confirm_delete_message', { name: account.account_name }),
            type: 'danger',
            confirmText: t('common.delete'),
            cancelText: t('common.cancel'),
        });

        if (confirmed) {
            router.delete(`/bank-accounts/${account.id}`);
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

    // Transform banks for Select component
    const bankOptions = banks.map(bank => ({
        value: bank.id,
        label: `${bank.short_name} - ${bank.full_name}`,
    }));

    return (
        <AppLayout title={t('bank_accounts.title')}>
            <Head title={t('bank_accounts.title')} />

            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1000px] mx-auto px-6 py-6">
                    {/* Header */}
                    <PageHeader
                        title={t('bank_accounts.title')}
                        subtitle={t('bank_accounts.description', { defaultValue: 'Quản lý tài khoản ngân hàng để nhận tiền rút' })}
                        actions={!showForm && (
                            <Button onClick={() => setShowForm(true)}>
                                + {t('bank_accounts.add')}
                            </Button>
                        )}
                    />

                    {/* Add/Edit Form */}
                    {showForm && (
                        <GlassCard gradient="gray" className="mb-6" hover={false}>
                            <SectionHeader
                                title={editingAccount ? t('bank_accounts.edit', { defaultValue: 'Sửa tài khoản' }) : t('bank_accounts.add')}
                            />

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Select
                                        label={<>{t('bank_accounts.bank')} <span className="text-red-500">*</span></>}
                                        options={bankOptions}
                                        value={data.bank_id}
                                        onChange={(e) => setData('bank_id', e.target.value)}
                                        disabled={!!editingAccount}
                                        placeholder={t('bank_accounts.select_bank', { defaultValue: 'Chọn ngân hàng' })}
                                        error={errors.bank_id}
                                    />

                                    <Input
                                        label={<>{t('bank_accounts.account_number')} <span className="text-red-500">*</span></>}
                                        value={data.account_number}
                                        onChange={(e) => setData('account_number', e.target.value)}
                                        disabled={!!editingAccount}
                                        placeholder="VD: 1234567890"
                                        error={errors.account_number}
                                    />

                                    <Input
                                        label={<>{t('bank_accounts.account_name')} <span className="text-red-500">*</span></>}
                                        value={data.account_name}
                                        onChange={(e) => setData('account_name', e.target.value)}
                                        placeholder="VD: NGUYEN VAN A"
                                        className="uppercase"
                                        error={errors.account_name}
                                    />

                                    <Input
                                        label={t('bank_accounts.branch')}
                                        value={data.branch}
                                        onChange={(e) => setData('branch', e.target.value)}
                                        placeholder={t('bank_accounts.branch_placeholder', { defaultValue: 'Chi nhánh (tùy chọn)' })}
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button type="submit" disabled={processing}>
                                        {processing
                                            ? t('common.processing', { defaultValue: 'Đang xử lý...' })
                                            : editingAccount
                                                ? t('common.save', { defaultValue: 'Lưu' })
                                                : t('bank_accounts.add')
                                        }
                                    </Button>
                                    <Button type="button" onClick={cancelForm} variant="ghost">
                                        {t('common.cancel', { defaultValue: 'Hủy' })}
                                    </Button>
                                </div>
                            </form>
                        </GlassCard>
                    )}

                    {/* Bank Accounts List */}
                    <GlassCard gradient="gray" hover={false}>
                        <SectionHeader title={t('bank_accounts.your_accounts', { defaultValue: 'Tài khoản của bạn' })} />

                        {bankAccounts.length === 0 ? (
                            <EmptyStateCard
                                icon="💳"
                                title={t('bank_accounts.no_accounts', { defaultValue: 'Chưa có tài khoản ngân hàng nào' })}
                                actionLabel={`+ ${t('bank_accounts.add')}`}
                                onAction={() => setShowForm(true)}
                            />
                        ) : (
                            <div className="space-y-4">
                                {bankAccounts.map((account) => (
                                    <div
                                        key={account.id}
                                        className={`p-4 rounded-xl flex items-center justify-between ${account.is_default
                                            ? isDark
                                                ? 'bg-purple-500/10 border border-purple-500/30'
                                                : 'bg-purple-50 border border-purple-200'
                                            : isDark
                                                ? 'bg-[#0d0d0d] border border-[#2a2a2a]'
                                                : 'bg-gray-50 border border-gray-100'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Bank Logo */}
                                            <Avatar
                                                src={account.bank_logo}
                                                name={account.bank_name}
                                                size="lg"
                                            />

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {account.bank_name}
                                                    </span>
                                                    {account.is_default && (
                                                        <Badge variant="purple" size="sm">
                                                            {t('bank_accounts.default')}
                                                        </Badge>
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
                                                <Button
                                                    onClick={() => handleSetDefault(account.id)}
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    {t('bank_accounts.set_default')}
                                                </Button>
                                            )}
                                            <Button
                                                onClick={() => handleEdit(account)}
                                                variant="ghost"
                                                size="sm"
                                            >
                                                ✏️
                                            </Button>
                                            <Button
                                                onClick={() => handleDelete(account)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:bg-red-500/10"
                                            >
                                                🗑️
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </AppLayout>
    );
}
