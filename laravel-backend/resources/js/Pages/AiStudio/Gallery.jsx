import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useConfirm } from '@/Components/UI/ConfirmModal';

export default function Gallery({ generations, filters, currentCredits = 0 }) {
    const { theme } = useTheme();
    const { showConfirm } = useConfirm();
    const isDark = theme === 'dark';
    const [selectedGeneration, setSelectedGeneration] = useState(null);
    const [localFilters, setLocalFilters] = useState(filters || {});

    const applyFilters = () => {
        router.get('/ai-studio/generations', localFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setLocalFilters({});
        router.get('/ai-studio/generations', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm({
            title: 'Delete Generation',
            message: 'Are you sure you want to delete this generation?',
            type: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel',
        });

        if (confirmed) {
            router.delete(`/ai-studio/generations/${id}`, {
                onSuccess: () => setSelectedGeneration(null),
            });
        }
    };

    return (
        <AppLayout title="AI Gallery">
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1400px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                AI Gallery
                            </h1>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {generations.total} generations
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/ai-studio"
                                className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                    }`}
                            >
                                + Create New
                            </Link>
                            <Link
                                href="/ai-credits"
                                className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-[#1a1a1a] text-white hover:bg-[#222]' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                {currentCredits.toLocaleString()} Credits
                            </Link>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className={`p-5 rounded-xl mb-6 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Type
                                </label>
                                <select
                                    value={localFilters.type || ''}
                                    onChange={(e) => setLocalFilters({ ...localFilters, type: e.target.value })}
                                    className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
                                        } border focus:outline-none`}
                                >
                                    <option value="">All</option>
                                    <option value="image">Image</option>
                                    <option value="video">Video</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Status
                                </label>
                                <select
                                    value={localFilters.status || ''}
                                    onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value })}
                                    className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
                                        } border focus:outline-none`}
                                >
                                    <option value="">All</option>
                                    <option value="completed">Completed</option>
                                    <option value="processing">Processing</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Search
                                </label>
                                <input
                                    type="text"
                                    placeholder="Search prompts..."
                                    value={localFilters.search || ''}
                                    onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
                                    className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                        } border focus:outline-none`}
                                />
                            </div>

                            <div className="flex items-end gap-2">
                                <button
                                    onClick={applyFilters}
                                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                        }`}
                                >
                                    Filter
                                </button>
                                <button
                                    onClick={clearFilters}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Gallery Grid */}
                    {generations.data?.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {generations.data.map((gen) => (
                                <div
                                    key={gen.id}
                                    onClick={() => setSelectedGeneration(gen)}
                                    className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'
                                        }`}
                                >
                                    {gen.status === 'completed' && gen.output_url ? (
                                        gen.type === 'video' ? (
                                            <video
                                                src={gen.output_url}
                                                className="w-full h-full object-cover"
                                                muted
                                                loop
                                                onMouseEnter={(e) => e.target.play()}
                                                onMouseLeave={(e) => e.target.pause()}
                                            />
                                        ) : (
                                            <img
                                                src={gen.output_url}
                                                alt={gen.prompt}
                                                className="w-full h-full object-cover"
                                            />
                                        )
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            {gen.status === 'processing' ? (
                                                <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    Processing...
                                                </div>
                                            ) : (
                                                <div className={`text-sm ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                                                    Failed
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <p className="text-white text-xs line-clamp-2">{gen.prompt}</p>
                                        </div>
                                    </div>

                                    {/* Type Badge */}
                                    <div className="absolute top-2 left-2">
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${gen.type === 'video'
                                                ? 'bg-purple-500/80 text-white'
                                                : 'bg-blue-500/80 text-white'
                                            }`}>
                                            {gen.type === 'video' ? '🎬' : '🖼️'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`rounded-xl p-16 text-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <div className={`w-14 h-14 mx-auto rounded-lg flex items-center justify-center mb-4 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                                <svg className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                No generations yet
                            </h3>
                            <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Create your first AI generation
                            </p>
                            <Link
                                href="/ai-studio"
                                className={`inline-block px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                    }`}
                            >
                                Start Creating
                            </Link>
                        </div>
                    )}

                    {/* Pagination */}
                    {generations.data?.length > 0 && generations.links && (
                        <div className="mt-6 flex items-center justify-center gap-1">
                            {generations.links.map((link, i) => (
                                <button
                                    key={i}
                                    onClick={() => link.url && router.get(link.url)}
                                    disabled={!link.url}
                                    className={`px-3 py-1.5 text-sm rounded-md ${link.active
                                            ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                                            : link.url
                                                ? isDark ? 'text-gray-400 hover:bg-[#1a1a1a]' : 'text-gray-500 hover:bg-gray-100'
                                                : isDark ? 'text-gray-600' : 'text-gray-300'
                                        }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {selectedGeneration && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                    onClick={() => setSelectedGeneration(null)}
                >
                    <div
                        className={`relative max-w-4xl max-h-[90vh] rounded-xl overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {selectedGeneration.type === 'video' ? (
                            <video
                                src={selectedGeneration.output_url}
                                className="max-h-[70vh] w-auto"
                                controls
                                autoPlay
                            />
                        ) : (
                            <img
                                src={selectedGeneration.output_url}
                                alt={selectedGeneration.prompt}
                                className="max-h-[70vh] w-auto"
                            />
                        )}
                        <div className="p-4">
                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                {selectedGeneration.prompt}
                            </p>
                            <div className="flex items-center justify-between mt-3">
                                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {new Date(selectedGeneration.created_at).toLocaleDateString()}
                                </span>
                                <button
                                    onClick={() => handleDelete(selectedGeneration.id)}
                                    className={`text-sm ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
