import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/Components/Layout/ToastProvider';
import { Button, Icon } from '@/Components/UI';

export default function MediaDetailPanel({
    item,
    onClose,
    onDelete,
    isDark = false
}) {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [copying, setCopying] = useState(false);

    if (!item) {
        return (
            <div className={`w-80 flex-shrink-0 border-l h-full flex items-center justify-center ${isDark ? 'bg-[#0a0a0a] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                <div className="text-center p-6">
                    <div className={`w-16 h-16 mx-auto rounded-xl flex items-center justify-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                        <Icon name="media" className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    </div>
                    <p className={`mt-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {t('media.select_to_preview', 'Chọn file để xem chi tiết')}
                    </p>
                </div>
            </div>
        );
    }

    const copyUrl = async () => {
        setCopying(true);
        try {
            await navigator.clipboard.writeText(item.url);
            addToast(t('media.url_copied', 'Đã sao chép URL'), 'success');
        } catch (err) {
            addToast(t('media.copy_failed', 'Không thể sao chép'), 'error');
        } finally {
            setTimeout(() => setCopying(false), 1500);
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
        if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
        if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return bytes + ' B';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={`w-80 flex-shrink-0 border-l h-full flex flex-col ${isDark ? 'bg-[#0a0a0a] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
            {/* Header */}
            <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                <h3 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('media.details', 'Chi tiết')}
                </h3>
                <Button variant="ghost" size="icon-xs" onClick={onClose}>
                    <Icon name="close" className="w-4 h-4" />
                </Button>
            </div>

            {/* Preview */}
            <div className={`aspect-square w-full flex items-center justify-center p-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
                {item.type === 'video' ? (
                    <video
                        src={item.url}
                        controls
                        className="max-w-full max-h-full rounded-lg"
                    />
                ) : (
                    <img
                        src={item.thumbnail_url || item.url}
                        alt={item.original_name}
                        className="max-w-full max-h-full object-contain rounded-lg"
                    />
                )}
            </div>

            {/* Info */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Filename */}
                <div>
                    <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {t('media.filename', 'Tên file')}
                    </p>
                    <p className={`text-sm font-medium break-all ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item.original_name}
                    </p>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t('media.type', 'Loại')}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {item.mime_type || (item.type === 'video' ? 'Video' : 'Image')}
                        </p>
                    </div>
                    <div>
                        <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t('media.size', 'Kích thước')}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {item.formatted_size || formatBytes(item.file_size)}
                        </p>
                    </div>
                    <div className="col-span-2">
                        <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t('media.uploaded', 'Tải lên')}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {formatDate(item.created_at)}
                        </p>
                    </div>
                </div>

                {/* Source Badge */}
                {item.source === 'ai_generated' && (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
                        }`}>
                        <Icon name="ai" className="w-3.5 h-3.5" />
                        AI Generated
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className={`p-4 border-t space-y-2 ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                {/* Copy URL */}
                <button
                    onClick={copyUrl}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${copying
                        ? isDark
                            ? 'bg-emerald-900/30 text-emerald-400'
                            : 'bg-emerald-50 text-emerald-600'
                        : isDark
                            ? 'bg-white text-black hover:bg-gray-100'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                >
                    {copying ? (
                        <>
                            <Icon name="check" className="w-4 h-4" />
                            {t('media.copied', 'Đã sao chép!')}
                        </>
                    ) : (
                        <>
                            <Icon name="copy" className="w-4 h-4" />
                            {t('media.copy_url', 'Sao chép URL')}
                        </>
                    )}
                </button>

                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-2">
                    <a
                        href={item.url}
                        download={item.original_name}
                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isDark
                            ? 'bg-[#1a1a1a] text-gray-300 hover:text-white hover:bg-[#222]'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <Icon name="download" className="w-4 h-4" />
                        {t('media.download', 'Tải xuống')}
                    </a>
                    <Button
                        variant="danger-ghost"
                        className="flex-1"
                        onClick={() => onDelete(item.id)}
                    >
                        <Icon name="delete" className="w-4 h-4" />
                        {t('media.delete', 'Xóa')}
                    </Button>
                </div>

                {/* Open in new tab */}
                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${isDark
                        ? 'text-gray-500 hover:text-white'
                        : 'text-gray-400 hover:text-gray-900'
                        }`}
                >
                    <Icon name="arrowRight" className="w-4 h-4" />
                    {t('media.open_original', 'Mở file gốc')}
                </a>
            </div>
        </div>
    );
}
