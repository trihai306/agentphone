import { useState, useMemo } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * CollectionPickerModal - Select a Data Collection for workflow
 */
export default function CollectionPickerModal({ isOpen, onClose, collections = [], onSelect }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState(null);

    // Filter collections by search
    const filteredCollections = useMemo(() => {
        if (!searchQuery) return collections;
        const query = searchQuery.toLowerCase();
        return collections.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.description?.toLowerCase().includes(query)
        );
    }, [collections, searchQuery]);

    const handleSelect = () => {
        const collection = collections.find(c => c.id === selectedId);
        if (collection) {
            onSelect(collection);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`relative w-full max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}
                style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
            >
                {/* Header */}
                <div className={`px-6 py-4 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Select Data Collection
                            </h2>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Choose a collection to use as data source
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Search */}
                    <div className="mt-4 relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search collections..."
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm ${isDark
                                ? 'bg-[#0f0f0f] border-[#2a2a2a] text-white placeholder-gray-500'
                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                                }`}
                        />
                        <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Collections Grid */}
                <div className={`p-4 overflow-y-auto max-h-[50vh] ${isDark ? 'bg-[#141414]' : 'bg-gray-50'}`}>
                    {filteredCollections.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-3">📊</div>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {collections.length === 0 ? 'No collections yet' : 'No matching collections'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {filteredCollections.map((collection) => (
                                <button
                                    key={collection.id}
                                    onClick={() => setSelectedId(collection.id)}
                                    className={`text-left p-4 rounded-xl transition-all border-2 ${selectedId === collection.id
                                            ? 'border-cyan-500 bg-cyan-500/10'
                                            : isDark
                                                ? 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                                            style={{ backgroundColor: `${collection.color}20` }}
                                        >
                                            {collection.icon || '📊'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {collection.name}
                                            </h3>
                                            {collection.description && (
                                                <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {collection.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-[#252525] text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                                    {collection.total_records || 0} records
                                                </span>
                                                <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                                    {collection.schema?.length || 0} fields
                                                </span>
                                            </div>
                                        </div>
                                        {selectedId === collection.id && (
                                            <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>

                                    {/* Schema Preview */}
                                    {selectedId === collection.id && collection.schema?.length > 0 && (
                                        <div className={`mt-3 pt-3 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                                            <p className={`text-[10px] uppercase font-semibold mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                Available Fields
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {collection.schema.slice(0, 5).map((field, idx) => (
                                                    <span
                                                        key={idx}
                                                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}
                                                    >
                                                        {field.name}
                                                    </span>
                                                ))}
                                                {collection.schema.length > 5 && (
                                                    <span className={`text-[10px] px-2 py-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        +{collection.schema.length - 5}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`px-6 py-4 border-t flex items-center justify-end gap-3 ${isDark ? 'border-[#2a2a2a] bg-[#1a1a1a]' : 'border-gray-200 bg-white'}`}>
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'hover:bg-[#252525] text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSelect}
                        disabled={!selectedId}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${selectedId
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white'
                                : isDark ? 'bg-[#252525] text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        Select Collection
                    </button>
                </div>
            </div>
        </div>
    );
}
