import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function MediaContextMenu({
    position,
    item,
    onClose,
    onCopyUrl,
    onDownload,
    onDelete,
    onOpenAiStudio,
    isDark = false
}) {
    const { t } = useTranslation();

    // Close on escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (position) {
            window.addEventListener('keydown', handleEscape);
            return () => window.removeEventListener('keydown', handleEscape);
        }
    }, [position, onClose]);

    // Close on outside click
    useEffect(() => {
        const handleClick = () => onClose();
        if (position) {
            setTimeout(() => window.addEventListener('click', handleClick), 0);
            return () => window.removeEventListener('click', handleClick);
        }
    }, [position, onClose]);

    if (!position || !item) return null;

    // Adjust position to stay within viewport
    const menuWidth = 200;
    const menuHeight = 220;
    const adjustedX = Math.min(position.x, window.innerWidth - menuWidth - 20);
    const adjustedY = Math.min(position.y, window.innerHeight - menuHeight - 20);

    const menuItems = [
        {
            label: t('media.copy_url', 'Sao chép URL'),
            icon: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
            onClick: onCopyUrl
        },
        {
            label: t('media.download', 'Tải xuống'),
            icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
            onClick: onDownload
        },
        {
            label: t('media.open_original', 'Mở file gốc'),
            icon: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
            onClick: () => window.open(item.url, '_blank')
        },
        { divider: true },
        {
            label: 'Dùng cho AI Studio',
            icon: 'M13 10V3L4 14h7v7l9-11h-7z',
            onClick: onOpenAiStudio
        },
        { divider: true },
        {
            label: t('common.delete', 'Xóa'),
            icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
            onClick: onDelete,
            danger: true
        }
    ];

    return (
        <div
            className="fixed z-50"
            style={{ left: adjustedX, top: adjustedY }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className={`w-52 py-1.5 rounded-xl shadow-xl border overflow-hidden ${isDark
                    ? 'bg-[#1a1a1a] border-[#2a2a2a]'
                    : 'bg-white border-gray-200'
                }`}>
                {menuItems.map((menuItem, i) => (
                    menuItem.divider ? (
                        <div key={i} className={`my-1.5 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`} />
                    ) : (
                        <button
                            key={i}
                            onClick={() => {
                                menuItem.onClick?.();
                                onClose();
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-all ${menuItem.danger
                                    ? isDark
                                        ? 'text-red-400 hover:bg-red-900/30'
                                        : 'text-red-600 hover:bg-red-50'
                                    : isDark
                                        ? 'text-gray-300 hover:bg-[#222] hover:text-white'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={menuItem.icon} />
                            </svg>
                            <span>{menuItem.label}</span>
                        </button>
                    )
                ))}
            </div>
        </div>
    );
}
