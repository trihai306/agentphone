import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from '@/Components/UI';

export default function FolderSelectModal({
    isOpen,
    onClose,
    onSelect,
    folders = [],
    isDark = false,
    title = null,
    allowCreate = true
}) {
    const { t } = useTranslation();
    const [selectedFolder, setSelectedFolder] = useState('/');
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [creating, setCreating] = useState(false);
    const [localFolders, setLocalFolders] = useState(folders);

    // Sync folders from props
    useEffect(() => {
        setLocalFolders(folders);
    }, [folders]);

    // Reset when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedFolder('/');
            setShowNewFolder(false);
            setNewFolderName('');
        }
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
            return () => window.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;

        setCreating(true);
        router.post('/media/create-folder', { name: newFolderName.trim() }, {
            onSuccess: () => {
                // Add to local folders list
                const newFolder = newFolderName.trim();
                setLocalFolders(prev => [...prev, newFolder]);
                setSelectedFolder('/' + newFolder);
                setShowNewFolder(false);
                setNewFolderName('');
            },
            onFinish: () => {
                setCreating(false);
            },
        });
    };

    const handleConfirm = () => {
        onSelect(selectedFolder);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 ${isDark ? 'bg-black/80' : 'bg-black/50'} backdrop-blur-sm`}
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white'
                }`}>
                {/* Header */}
                <div className={`px-6 py-4 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-violet-600/20' : 'bg-violet-100'
                            }`}>
                            <svg className={`w-5 h-5 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {title || t('media.select_folder', 'Chọn thư mục')}
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {t('media.select_folder_desc', 'Chọn nơi lưu file')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 max-h-[400px] overflow-y-auto">
                    <div className="space-y-1">
                        {/* Root folder */}
                        <button
                            onClick={() => setSelectedFolder('/')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${selectedFolder === '/'
                                ? isDark
                                    ? 'bg-violet-600/20 border border-violet-500/30'
                                    : 'bg-violet-50 border border-violet-200'
                                : isDark
                                    ? 'hover:bg-[#2a2a2a] border border-transparent'
                                    : 'hover:bg-gray-50 border border-transparent'
                                }`}
                        >
                            <svg className={`w-5 h-5 flex-shrink-0 ${selectedFolder === '/'
                                ? isDark ? 'text-violet-400' : 'text-violet-600'
                                : isDark ? 'text-gray-500' : 'text-gray-400'
                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <div className="flex-1 min-w-0">
                                <p className={`font-medium ${selectedFolder === '/'
                                    ? isDark ? 'text-violet-300' : 'text-violet-700'
                                    : isDark ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    {t('media.root_folder', 'Thư mục gốc')}
                                </p>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {t('media.default_location', 'Vị trí mặc định')}
                                </p>
                            </div>
                            {selectedFolder === '/' && (
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isDark ? 'bg-violet-500' : 'bg-violet-500'
                                    }`}>
                                    <Icon name="check" className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </button>

                        {/* Other folders */}
                        {localFolders.map((folder) => (
                            <button
                                key={folder}
                                onClick={() => setSelectedFolder('/' + folder)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${selectedFolder === '/' + folder
                                    ? isDark
                                        ? 'bg-violet-600/20 border border-violet-500/30'
                                        : 'bg-violet-50 border border-violet-200'
                                    : isDark
                                        ? 'hover:bg-[#2a2a2a] border border-transparent'
                                        : 'hover:bg-gray-50 border border-transparent'
                                    }`}
                            >
                                <svg className={`w-5 h-5 flex-shrink-0 ${selectedFolder === '/' + folder
                                    ? isDark ? 'text-violet-400' : 'text-violet-600'
                                    : isDark ? 'text-gray-500' : 'text-gray-400'
                                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                <span className={`flex-1 font-medium truncate ${selectedFolder === '/' + folder
                                    ? isDark ? 'text-violet-300' : 'text-violet-700'
                                    : isDark ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    {folder}
                                </span>
                                {selectedFolder === '/' + folder && (
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isDark ? 'bg-violet-500' : 'bg-violet-500'
                                        }`}>
                                        <Icon name="check" className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </button>
                        ))}

                        {/* Create new folder input */}
                        {showNewFolder && (
                            <div className={`mt-2 p-3 rounded-xl border ${isDark ? 'bg-[#0d0d0d] border-[#2a2a2a]' : 'bg-gray-50 border-gray-200'}`}>
                                <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder={t('media.new_folder_name', 'Tên thư mục mới')}
                                    autoFocus
                                    disabled={creating}
                                    className={`w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 ${isDark
                                        ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-500 focus:border-violet-500 focus:ring-violet-500/20'
                                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-400 focus:ring-violet-400/20'
                                        }`}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreateFolder();
                                        if (e.key === 'Escape') {
                                            setShowNewFolder(false);
                                            setNewFolderName('');
                                        }
                                    }}
                                />
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        onClick={() => {
                                            setShowNewFolder(false);
                                            setNewFolderName('');
                                        }}
                                        disabled={creating}
                                        className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isDark
                                            ? 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                            }`}
                                    >
                                        {t('common.cancel', 'Hủy')}
                                    </button>
                                    <button
                                        onClick={handleCreateFolder}
                                        disabled={!newFolderName.trim() || creating}
                                        className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${!newFolderName.trim() || creating
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : isDark
                                                ? 'bg-violet-600 text-white hover:bg-violet-500'
                                                : 'bg-violet-500 text-white hover:bg-violet-600'
                                            }`}
                                    >
                                        {creating ? (
                                            <span className="flex items-center justify-center gap-1">
                                                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                            </span>
                                        ) : t('common.create', 'Tạo')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Create folder button */}
                        {allowCreate && !showNewFolder && (
                            <button
                                onClick={() => setShowNewFolder(true)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all border border-dashed ${isDark
                                    ? 'border-[#2a2a2a] text-gray-500 hover:text-white hover:border-[#3a3a3a] hover:bg-[#1a1a1a]'
                                    : 'border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50'
                                    }`}
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                </svg>
                                <span className="font-medium">
                                    {t('media.create_new_folder', 'Tạo thư mục mới')}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className={`px-6 py-4 flex items-center justify-end gap-3 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                    <Button variant="secondary" onClick={onClose}>
                        {t('common.cancel', 'Hủy')}
                    </Button>
                    <Button variant="gradient" onClick={handleConfirm}>
                        💾 {t('media.save_here', 'Lưu vào đây')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
