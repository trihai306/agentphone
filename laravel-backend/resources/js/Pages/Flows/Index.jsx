import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../Layouts/AppLayout';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Index({ flows = { data: [] } }) {
    const { t } = useTranslation();
    const { showConfirm } = useConfirm();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFlowName, setNewFlowName] = useState('');
    const [newFlowDescription, setNewFlowDescription] = useState('');
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleCreate = (e) => {
        e.preventDefault();
        setCreating(true);
        router.post('/flows', {
            name: newFlowName,
            description: newFlowDescription,
        }, {
            onFinish: () => {
                setCreating(false);
                setShowCreateModal(false);
                setNewFlowName('');
                setNewFlowDescription('');
            }
        });
    };

    const handleDelete = async (flowId) => {
        const confirmed = await showConfirm({
            title: 'Delete Workflow',
            message: 'Are you sure you want to delete this workflow? This action cannot be undone.',
            type: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel',
        });

        if (confirmed) {
            router.delete(`/flows/${flowId}`);
        }
    };

    const handleDuplicate = (flowId) => {
        router.post(`/flows/${flowId}/duplicate`);
    };

    const filteredFlows = flows.data.filter(flow =>
        flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flow.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: flows.data.length,
        active: flows.data.filter(f => f.status === 'active').length,
        draft: flows.data.filter(f => f.status === 'draft').length,
    };

    return (
        <AppLayout title="Workflows">
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1400px] mx-auto px-6 py-6">
                    {/* Clean Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Workflows
                            </h1>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                Build and manage your automation workflows
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${isDark
                                    ? 'bg-white text-black hover:bg-gray-100'
                                    : 'bg-gray-900 text-white hover:bg-gray-800'
                                }`}
                        >
                            + New Workflow
                        </button>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {[
                            { label: 'Total', value: stats.total },
                            { label: 'Active', value: stats.active },
                            { label: 'Draft', value: stats.draft },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className={`p-4 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}
                            >
                                <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {stat.label}
                                </p>
                                <p className={`text-2xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {stat.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="mb-6">
                        <div className="relative">
                            <svg
                                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search workflows..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-colors ${isDark
                                        ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600 focus:border-gray-600'
                                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400'
                                    } border focus:outline-none`}
                            />
                        </div>
                    </div>

                    {/* Workflows List */}
                    {filteredFlows.length > 0 ? (
                        <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <table className="w-full">
                                <thead>
                                    <tr className={`border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                                        <th className={`text-left py-3 px-4 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Name
                                        </th>
                                        <th className={`text-left py-3 px-4 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Status
                                        </th>
                                        <th className={`text-center py-3 px-4 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Nodes
                                        </th>
                                        <th className={`text-left py-3 px-4 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Updated
                                        </th>
                                        <th className={`text-right py-3 px-4 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDark ? 'divide-[#2a2a2a]' : 'divide-gray-100'}`}>
                                    {filteredFlows.map((flow) => (
                                        <tr
                                            key={flow.id}
                                            className={`transition-colors ${isDark ? 'hover:bg-[#222]' : 'hover:bg-gray-50'}`}
                                        >
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                                                        <svg className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                            {flow.name}
                                                        </p>
                                                        {flow.description && (
                                                            <p className={`text-xs mt-0.5 truncate max-w-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                {flow.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${flow.status === 'active'
                                                        ? isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                                                        : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${flow.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                                    {flow.status === 'active' ? 'Active' : 'Draft'}
                                                </span>
                                            </td>
                                            <td className={`py-4 px-4 text-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {flow.nodes_count || 0}
                                            </td>
                                            <td className={`py-4 px-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {new Date(flow.updated_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={`/flows/${flow.id}/edit`}
                                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${isDark
                                                                ? 'bg-white text-black hover:bg-gray-100'
                                                                : 'bg-gray-900 text-white hover:bg-gray-800'
                                                            }`}
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDuplicate(flow.id)}
                                                        className={`p-1.5 rounded-md transition-colors ${isDark
                                                                ? 'text-gray-500 hover:text-white hover:bg-[#2a2a2a]'
                                                                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                                                            }`}
                                                        title="Duplicate"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(flow.id)}
                                                        className={`p-1.5 rounded-md transition-colors ${isDark
                                                                ? 'text-gray-500 hover:text-red-400 hover:bg-red-900/20'
                                                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                                            }`}
                                                        title="Delete"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={`rounded-lg p-16 text-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <div className={`w-14 h-14 mx-auto rounded-lg flex items-center justify-center mb-4 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                                <svg className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                </svg>
                            </div>
                            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {searchQuery ? 'No workflows found' : 'No workflows yet'}
                            </h3>
                            <p className={`text-sm mb-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {searchQuery
                                    ? `No results for "${searchQuery}"`
                                    : 'Create your first workflow to get started'
                                }
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${isDark
                                            ? 'bg-white text-black hover:bg-gray-100'
                                            : 'bg-gray-900 text-white hover:bg-gray-800'
                                        }`}
                                >
                                    + Create Workflow
                                </button>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {flows.last_page > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Page {flows.current_page} of {flows.last_page}
                            </p>
                            <div className="flex items-center gap-2">
                                {flows.prev_page_url && (
                                    <Link
                                        href={flows.prev_page_url}
                                        className={`px-3 py-1.5 text-sm rounded-md ${isDark
                                                ? 'text-gray-400 hover:text-white'
                                                : 'text-gray-500 hover:text-gray-900'
                                            }`}
                                    >
                                        Previous
                                    </Link>
                                )}
                                {flows.next_page_url && (
                                    <Link
                                        href={flows.next_page_url}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md ${isDark
                                                ? 'bg-white text-black hover:bg-gray-100'
                                                : 'bg-gray-900 text-white hover:bg-gray-800'
                                            }`}
                                    >
                                        Next
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className={`w-full max-w-md rounded-xl overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
                            <div className={`px-6 py-4 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                                <div className="flex items-center justify-between">
                                    <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        New Workflow
                                    </h2>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className={`p-1 rounded-md ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleCreate} className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            value={newFlowName}
                                            onChange={(e) => setNewFlowName(e.target.value)}
                                            required
                                            autoFocus
                                            placeholder="My Workflow"
                                            className={`w-full px-3 py-2.5 rounded-lg text-sm ${isDark
                                                    ? 'bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder-gray-600 focus:border-gray-600'
                                                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400'
                                                } border focus:outline-none`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Description
                                        </label>
                                        <textarea
                                            value={newFlowDescription}
                                            onChange={(e) => setNewFlowDescription(e.target.value)}
                                            rows={3}
                                            placeholder="Optional description..."
                                            className={`w-full px-3 py-2.5 rounded-lg text-sm resize-none ${isDark
                                                    ? 'bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder-gray-600 focus:border-gray-600'
                                                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400'
                                                } border focus:outline-none`}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                            }`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating || !newFlowName}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isDark
                                                ? 'bg-white text-black hover:bg-gray-100'
                                                : 'bg-gray-900 text-white hover:bg-gray-800'
                                            }`}
                                    >
                                        {creating ? 'Creating...' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
