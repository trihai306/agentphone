import { useState } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { usePage } from '@inertiajs/react';

/**
 * MediaPickerModal - Reusable modal for selecting files from user's media library
 * 
 * Usage:
 * <MediaPickerModal
 *   isOpen={showPicker}
 *   onClose={() => setShowPicker(false)}
 *   onSelect={(file) => handleFileSelected(file)}
 *   fileType="image" // 'image', 'video', or 'any'
 * />
 */
export default function MediaPickerModal({ isOpen, onClose, onSelect, fileType = 'any' }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [selectedFile, setSelectedFile] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // This would normally fetch from API, but for now use props data
    // In real implementation, you'd fetch via Inertia or Axios
    const [mediaFiles, setMediaFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Filter files based on type and search
    const filteredFiles = mediaFiles.filter(file => {
        const matchesType = fileType === 'any' || file.type === fileType;
        const matchesSearch = !searchTerm || file.original_name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesSearch;
    });

    const handleSelect = () => {
        if (selectedFile && onSelect) {
            onSelect(selectedFile);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn"
            onClick={onClose}
        >
            <div
                className={`relative w-full max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'} border-2`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`px-6 py-4 border-b ${isDark ? 'border-[#2a2a2a] bg-[#141414]' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Chọn file từ thư viện
                            </h2>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {fileType === 'image' ? 'Chỉ hiển thị ảnh' : fileType === 'video' ? 'Chỉ hiển thị video' : 'Tất cả file'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-[#252525] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Search */}
                    <div className="mt-4 relative">
                        <input
                            type="text"
                            placeholder="Tìm kiếm file..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-500 focus:border-cyan-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-cyan-500'} border-2 focus:ring-2 focus:ring-cyan-500/20`}
                        />
                        <svg className={`absolute left-3 top-3 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Media Grid */}
                <div className={`p-6 overflow-y-auto max-h-[50vh] ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4" />
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Đang tải...</p>
                        </div>
                    ) : filteredFiles.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredFiles.map((file) => (
                                <div
                                    key={file.id}
                                    onClick={() => setSelectedFile(file)}
                                    className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${selectedFile?.id === file.id
                                        ? 'ring-4 ring-cyan-500 scale-105 shadow-lg shadow-cyan-500/30'
                                        : `${isDark ? 'hover:ring-2 hover:ring-cyan-500/50 bg-[#1a1a1a]' : 'hover:ring-2 hover:ring-cyan-500/50 bg-white'} hover:scale-105`
                                        }`}
                                >
                                    {file.type === 'image' ? (
                                        <img
                                            src={file.thumbnail_url || file.url}
                                            alt={file.original_name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}

                                    {/* Selection Indicator */}
                                    {selectedFile?.id === file.id && (
                                        <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                                            <div className="bg-cyan-500 rounded-full p-2">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}

                                    {/* File name overlay */}
                                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white text-xs font-medium truncate">{file.original_name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                                <svg className={`w-10 h-10 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Chưa có file nào
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                                Tải lên file từ trang Media Library
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`px-6 py-4 border-t ${isDark ? 'border-[#2a2a2a] bg-[#141414]' : 'border-gray-200 bg-gray-50'} flex items-center justify-between`}>
                    <div>
                        {selectedFile ? (
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                                    {selectedFile.type === 'image' ? (
                                        <img src={selectedFile.thumbnail_url || selectedFile.url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedFile.original_name}</p>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selectedFile.formatted_size}</p>
                                </div>
                            </div>
                        ) : (
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Chọn một file</p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className={`px-4 py-2.5 rounded-xl font-medium transition-all ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSelect}
                            disabled={!selectedFile}
                            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${selectedFile
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:scale-105'
                                : `${isDark ? 'bg-[#252525] text-gray-600' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
                                }`}
                        >
                            Chọn file
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
