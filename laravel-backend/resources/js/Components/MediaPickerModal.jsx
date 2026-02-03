import { useState, useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { mediaApi } from '@/services/api';

/**
 * MediaPickerModal - Reusable modal for selecting files or folders from user's media library
 * 
 * Usage:
 * <MediaPickerModal
 *   isOpen={showPicker}
 *   onClose={() => setShowPicker(false)}
 *   onSelect={(file) => handleFileSelected(file)}
 *   onSelectFolder={(folder) => handleFolderSelected(folder)} // New: folder selection
 *   allowFolderSelection={true} // New: enable folder selection
 *   fileType="image" // 'image', 'video', or 'any'
 * />
 */
export default function MediaPickerModal({
    isOpen,
    onClose,
    onSelect,
    onSelectFolder,
    allowFolderSelection = false,
    fileType = 'any',
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [selectedFile, setSelectedFile] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [mediaFiles, setMediaFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentFolder, setCurrentFolder] = useState(null); // null = root

    // Fetch media files and folders from API
    useEffect(() => {
        if (isOpen) {
            fetchMedia();
        }
    }, [isOpen, currentFolder]);

    const fetchMedia = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (currentFolder) {
                params.append('folder', currentFolder);
            }
            if (fileType !== 'any') {
                params.append('type', fileType);
            }

            const response = await mediaApi.list(params.toString());
            // Handle paginated or direct response
            const files = response?.data || response || [];
            setMediaFiles(files);

            // Get folders - only show at root level or get subfolders
            if (!currentFolder) {
                const foldersResponse = await mediaApi.getFolders();
                setFolders(foldersResponse?.folders || foldersResponse || []);
            } else {
                setFolders([]); // No nested folders for now
            }
        } catch (error) {
            console.error('Failed to fetch media:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedFile(null);
            setCurrentFolder(null);
            setSearchTerm('');
        }
    }, [isOpen]);

    // Filter files based on search
    const filteredFiles = mediaFiles.filter(file => {
        const matchesSearch = !searchTerm ||
            file.original_name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Filter folders based on search
    const filteredFolders = folders.filter(folder => {
        const folderName = typeof folder === 'string' ? folder : folder.name;
        return !searchTerm || folderName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleSelectFile = () => {
        if (selectedFile && onSelect) {
            onSelect(selectedFile);
            onClose();
        }
    };

    const handleSelectFolder = () => {
        if (currentFolder && onSelectFolder) {
            onSelectFolder({
                name: currentFolder.split('/').pop(),
                path: currentFolder,
            });
            onClose();
        }
    };

    const navigateToFolder = (folderName) => {
        const folderPath = currentFolder
            ? `${currentFolder}/${folderName}`
            : `/${folderName}`;
        setCurrentFolder(folderPath);
        setSelectedFile(null);
    };

    const navigateBack = () => {
        if (!currentFolder) return;
        const parts = currentFolder.split('/').filter(Boolean);
        if (parts.length <= 1) {
            setCurrentFolder(null);
        } else {
            parts.pop();
            setCurrentFolder('/' + parts.join('/'));
        }
        setSelectedFile(null);
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
                                Chọn từ Thư viện
                            </h2>
                            {/* Breadcrumb */}
                            <div className="flex items-center gap-2 mt-1">
                                <button
                                    onClick={() => setCurrentFolder(null)}
                                    className={`text-sm ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}
                                >
                                    Thư viện
                                </button>
                                {currentFolder && (
                                    <>
                                        <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>/</span>
                                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {currentFolder.split('/').filter(Boolean).pop()}
                                        </span>
                                    </>
                                )}
                            </div>
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
                            placeholder="Tìm kiếm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-500 focus:border-cyan-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-cyan-500'} border-2 focus:ring-2 focus:ring-cyan-500/20`}
                        />
                        <svg className={`absolute left-3 top-3 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Content Grid */}
                <div className={`p-6 overflow-y-auto max-h-[50vh] ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4" />
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Đang tải...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {/* Back Button when in folder */}
                            {currentFolder && (
                                <div
                                    onClick={navigateBack}
                                    className={`group aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 border-2 border-dashed ${isDark ? 'border-[#2a2a2a] hover:border-cyan-500/50 bg-[#1a1a1a]' : 'border-gray-200 hover:border-cyan-500/50 bg-white'}`}
                                >
                                    <svg className={`w-10 h-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                                    </svg>
                                    <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Quay lại</span>
                                </div>
                            )}

                            {/* Folders */}
                            {filteredFolders.map((folder) => {
                                const folderName = typeof folder === 'string' ? folder : folder.name;
                                return (
                                    <div
                                        key={folderName}
                                        onClick={() => navigateToFolder(folderName)}
                                        className={`group aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525]' : 'bg-white hover:bg-gray-50'} hover:scale-105 border ${isDark ? 'border-[#2a2a2a] hover:border-amber-500/50' : 'border-gray-200 hover:border-amber-400'}`}
                                    >
                                        <div className="w-16 h-16 flex items-center justify-center">
                                            <svg className="w-12 h-12 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M10 4H2v16h20V6H12l-2-2z" />
                                            </svg>
                                        </div>
                                        <span className={`text-sm font-medium truncate max-w-[90%] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {folderName}
                                        </span>
                                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Thư mục
                                        </span>
                                    </div>
                                );
                            })}

                            {/* Files */}
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

                            {/* Empty State */}
                            {!isLoading && filteredFiles.length === 0 && filteredFolders.length === 0 && !currentFolder && (
                                <div className="col-span-full flex flex-col items-center justify-center py-12">
                                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                                        <svg className={`w-10 h-10 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Chưa có file nào
                                    </p>
                                </div>
                            )}
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
                        ) : currentFolder && allowFolderSelection ? (
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-50'}`}>
                                    <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M10 4H2v16h20V6H12l-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {currentFolder.split('/').filter(Boolean).pop()}
                                    </p>
                                    <p className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                        📂 Chọn folder → Random file khi chạy
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Chọn một file hoặc folder</p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className={`px-4 py-2.5 rounded-xl font-medium transition-all ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                        >
                            Hủy
                        </button>

                        {/* Select Folder Button */}
                        {currentFolder && allowFolderSelection && !selectedFile && (
                            <button
                                onClick={handleSelectFolder}
                                className="px-6 py-2.5 rounded-xl font-medium transition-all bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:scale-105"
                            >
                                Chọn Folder (Random)
                            </button>
                        )}

                        {/* Select File Button */}
                        <button
                            onClick={handleSelectFile}
                            disabled={!selectedFile}
                            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${selectedFile
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:scale-105'
                                : `${isDark ? 'bg-[#252525] text-gray-600' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
                                }`}
                        >
                            Chọn File
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
