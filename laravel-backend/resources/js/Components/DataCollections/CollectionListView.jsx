import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function CollectionListView({ collections, onDelete, isDark }) {
    return (
        <div className="space-y-3">
            {collections.map((collection, index) => (
                <motion.div
                    key={collection.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`group relative rounded-xl border-2 p-4 transition-all duration-300 hover:shadow-lg ${isDark
                            ? 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-cyan-500/50'
                            : 'bg-white border-gray-200 hover:border-cyan-500'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div
                            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md"
                            style={{ backgroundColor: collection.color + '20' }}
                        >
                            {collection.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {collection.name}
                                    </h3>
                                    {collection.description && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                                            {collection.description}
                                        </p>
                                    )}
                                </div>

                                {/* Stats Badges */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm ${isDark ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="font-semibold" style={{ color: collection.color }}>
                                            {collection.total_records}
                                        </span>
                                        <span className="text-gray-400 hidden sm:inline">records</span>
                                    </div>

                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm ${isDark ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-xs text-gray-400">{collection.updated_at}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Schema Info */}
                            {collection.schema && collection.schema.length > 0 && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {collection.schema.length} fields:
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                        {collection.schema.slice(0, 4).map((field) => (
                                            <span
                                                key={field.name}
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${isDark ? 'bg-[#252525] text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                                            >
                                                {field.name}
                                            </span>
                                        ))}
                                        {collection.schema.length > 4 && (
                                            <span className="text-xs text-gray-400">
                                                +{collection.schema.length - 4} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                                href={`/data-collections/${collection.id}`}
                                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all text-sm"
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
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
