import { Link } from '@inertiajs/react';

export default function CollectionTableView({ collections, onDelete, isDark }) {
    return (
        <div className={`rounded-2xl border-2 overflow-hidden ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className={`${isDark ? 'bg-[#141414]' : 'bg-gray-50'}`}>
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Collection
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Description
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Fields
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Records
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Last Updated
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {collections.map((collection) => (
                            <tr
                                key={collection.id}
                                className={`transition-colors ${isDark ? 'hover:bg-[#252525]' : 'hover:bg-gray-50'}`}
                            >
                                {/* Collection Name */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                                            style={{ backgroundColor: collection.color + '20' }}
                                        >
                                            {collection.icon}
                                        </div>
                                        <div>
                                            <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {collection.name}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Description */}
                                <td className="px-6 py-4">
                                    <div className="max-w-xs text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                        {collection.description || (
                                            <span className="italic">No description</span>
                                        )}
                                    </div>
                                </td>

                                {/* Fields */}
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1 max-w-xs">
                                        {collection.schema && collection.schema.length > 0 ? (
                                            <>
                                                {collection.schema.slice(0, 3).map((field) => (
                                                    <span
                                                        key={field.name}
                                                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                                                    >
                                                        {field.name}
                                                    </span>
                                                ))}
                                                {collection.schema.length > 3 && (
                                                    <span className="inline-flex items-center px-2 py-0.5 text-xs text-gray-400">
                                                        +{collection.schema.length - 3}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic">No fields</span>
                                        )}
                                    </div>
                                </td>

                                {/* Records Count */}
                                <td className="px-6 py-4 text-center">
                                    <span
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold"
                                        style={{
                                            backgroundColor: collection.color + '20',
                                            color: collection.color
                                        }}
                                    >
                                        {collection.total_records}
                                    </span>
                                </td>

                                {/* Last Updated */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {collection.updated_at}
                                    </div>
                                </td>

                                {/* Actions */}
                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            href={`/data-collections/${collection.id}`}
                                            className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all text-sm"
                                        >
                                            Open
                                        </Link>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onDelete(collection.id);
                                            }}
                                            className={`p-2 rounded-lg transition-all ${isDark
                                                    ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400'
                                                    : 'hover:bg-red-50 text-gray-500 hover:text-red-500'
                                                }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Empty State */}
            {collections.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No collections found</p>
                </div>
            )}
        </div>
    );
}
