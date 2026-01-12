import { useState } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function History({ topups = { data: [] }, stats = {} }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [filter, setFilter] = useState('all');

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);

    const getStatusStyle = (status) => {
        const styles = {
            completed: isDark ? 'text-emerald-400' : 'text-emerald-600',
            pending: isDark ? 'text-amber-400' : 'text-amber-600',
            failed: isDark ? 'text-red-400' : 'text-red-600',
            cancelled: isDark ? 'text-gray-400' : 'text-gray-500',
        };
        return styles[status] || styles.pending;
    };

    const getStatusLabel = (status) => {
        const labels = { completed: 'Completed', pending: 'Pending', failed: 'Failed', cancelled: 'Cancelled' };
        return labels[status] || status;
    };

    const filteredTopups = filter === 'all' ? topups.data : topups.data.filter(t => t.payment_status === filter);

    return (
        <AppLayout title="Top Up History">
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[900px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Transaction History
                            </h1>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                Your top-up transactions
                            </p>
                        </div>
                        <Link
                            href="/topup"
                            className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                }`}
                        >
                            + Top Up
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className={`p-4 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Current Balance</p>
                            <p className={`text-xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {formatCurrency(stats.current_balance || 0)}
                            </p>
                        </div>
                        <div className={`p-4 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Total Deposited</p>
                            <p className={`text-xl font-semibold mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                {formatCurrency(stats.total_amount || 0)}
                            </p>
                        </div>
                        <div className={`p-4 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Pending</p>
                            <p className={`text-xl font-semibold mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                {formatCurrency(stats.pending_amount || 0)}
                            </p>
                        </div>
                        <div className={`p-4 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Transactions</p>
                            <p className={`text-xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {stats.total_topups || 0}
                            </p>
                        </div>
                    </div>

                    {/* Filter */}
                    <div className="flex items-center gap-2 mb-6">
                        {['all', 'completed', 'pending', 'failed'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${filter === tab
                                        ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                                        : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Transactions */}
                    {filteredTopups.length > 0 ? (
                        <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
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
                                                <span className={`text-xs font-medium ${getStatusStyle(topup.payment_status)}`}>
                                                    {getStatusLabel(topup.payment_status)}
                                                </span>
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
                                                <Link href={topups.prev_page_url} className={`px-3 py-1 text-sm rounded ${isDark ? 'text-gray-400 hover:bg-[#2a2a2a]' : 'text-gray-500 hover:bg-gray-100'}`}>
                                                    Previous
                                                </Link>
                                            )}
                                            {topups.next_page_url && (
                                                <Link href={topups.next_page_url} className={`px-3 py-1 text-sm rounded ${isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'}`}>
                                                    Next
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={`rounded-xl p-16 text-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <div className={`w-14 h-14 mx-auto rounded-lg flex items-center justify-center mb-4 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                                <svg className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                No transactions
                            </h3>
                            <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {filter === 'all' ? "You haven't made any top-ups yet" : 'No matching transactions'}
                            </p>
                            <Link
                                href="/topup"
                                className={`inline-block px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                    }`}
                            >
                                Top Up Now
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
