import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import CreateCollectionModal from '@/Components/DataCollections/CreateCollectionModal';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { useToast } from '@/Components/Layout/ToastProvider';

export default function Index({ collections, stats }) {
    const { theme } = useTheme();
    const { showConfirm } = useConfirm();
    const { addToast } = useToast();
    const isDark = theme === 'dark';
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'n' || e.key === 'N') {
                e.preventDefault();
                setShowCreateModal(true);
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    const filteredCollections = collections.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id) => {
        const confirmed = await showConfirm({
            title: 'Delete Collection',
            message: 'Are you sure? All data will be deleted.',
            type: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel',
        });

        if (confirmed) {
            router.delete(`/data-collections/${id}`, {
                onSuccess: () => addToast('Collection deleted', 'success'),
            });
        }
    };

    return (
        <AppLayout title="Data Collections">
            <Head title="Data Collections" />

            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1400px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Data Collections
                            </h1>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                Manage data for your workflows
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                }`}
                        >
                            + New Collection
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {[
                            { label: 'Collections', value: stats.total_collections },
                            { label: 'Records', value: stats.total_records },
                            { label: 'Workflows', value: stats.active_workflows },
                        ].map((stat, i) => (
                            <div key={i} className={`p-4 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                                <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{stat.label}</p>
                                <p className={`text-2xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Search collections..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full px-4 py-2.5 rounded-lg text-sm ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                } border focus:outline-none`}
                        />
                    </div>

                    {/* Collections Table */}
                    {filteredCollections.length > 0 ? (
                        <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <table className="w-full">
                                <thead>
                                    <tr className={`border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                                        <th className={`text-left py-3 px-4 text-xs font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Name</th>
                                        <th className={`text-center py-3 px-4 text-xs font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Fields</th>
                                        <th className={`text-center py-3 px-4 text-xs font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Records</th>
                                        <th className={`text-left py-3 px-4 text-xs font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Updated</th>
                                        <th className={`text-right py-3 px-4 text-xs font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDark ? 'divide-[#2a2a2a]' : 'divide-gray-100'}`}>
                                    {filteredCollections.map((collection) => (
                                        <tr key={collection.id} className={isDark ? 'hover:bg-[#222]' : 'hover:bg-gray-50'}>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                                                        <svg className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{collection.name}</p>
                                                        {collection.description && (
                                                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{collection.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`py-4 px-4 text-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {collection.fields_count || 0}
                                            </td>
                                            <td className={`py-4 px-4 text-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {collection.total_records || 0}
                                            </td>
                                            <td className={`py-4 px-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {new Date(collection.updated_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={`/data-collections/${collection.id}`}
                                                        className={`px-3 py-1.5 text-sm font-medium rounded-md ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                                            }`}
                                                    >
                                                        Open
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(collection.id)}
                                                        className={`p-1.5 rounded-md ${isDark ? 'text-gray-500 hover:text-red-400 hover:bg-red-900/20' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                            </div>
                            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {searchTerm ? 'No collections found' : 'No collections yet'}
                            </h3>
                            <p className={`text-sm mb-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {searchTerm ? `No results for "${searchTerm}"` : 'Create your first data collection'}
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                        }`}
                                >
                                    + Create Collection
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateCollectionModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                />
            )}
        </AppLayout>
    );
}
