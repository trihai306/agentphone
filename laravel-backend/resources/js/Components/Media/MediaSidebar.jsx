import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/Components/UI';

export default function MediaSidebar({
    activeFilter,
    activeFolder,
    onFilterChange,
    stats = {},
    folders = [],
    storagePlan = {},
    isDark = false
}) {
    const { t } = useTranslation();

    const navItems = [
        { key: 'all', label: t('media.all_files', 'Tất cả'), icon: 'grid', count: stats.total },
        { key: 'image', label: t('media.images', 'Hình ảnh'), icon: 'media', count: stats.images },
        { key: 'video', label: t('media.videos', 'Video'), icon: 'video', count: stats.videos },
        { key: 'ai', label: 'AI Generated', icon: 'ai', count: stats.ai_generated },
    ];

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
        if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
        if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return bytes + ' B';
    };

    const storageUsed = stats.storage_used || 0;
    const storageLimit = storagePlan?.max_storage_bytes || storagePlan?.storage_limit || 1073741824;
    const storagePercent = Math.min((storageUsed / storageLimit) * 100, 100);

    return (
        <div className={`w-56 flex-shrink-0 border-r h-full flex flex-col ${isDark ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-gray-200'}`}>
            {/* Navigation */}
            <div className="flex-1 p-4 space-y-1 overflow-y-auto">
                <p className={`text-xs font-medium uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('media.library', 'Thư viện')}
                </p>

                {navItems.map((item) => (
                    <button
                        key={item.key}
                        onClick={() => {
                            // Send both type and folder in single request to avoid race condition
                            onFilterChange({
                                type: item.key === 'all' ? null : item.key,
                                folder: null
                            });
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${(activeFilter === item.key && !activeFolder) || (item.key === 'all' && !activeFilter && !activeFolder)
                            ? isDark
                                ? 'bg-white text-black'
                                : 'bg-gray-900 text-white'
                            : isDark
                                ? 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <Icon name={item.icon} className="w-5 h-5 flex-shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.count !== undefined && (
                            <span className={`text-xs ${(activeFilter === item.key && !activeFolder) || (item.key === 'all' && !activeFilter && !activeFolder)
                                ? isDark ? 'text-black/60' : 'text-white/60'
                                : isDark ? 'text-gray-600' : 'text-gray-400'
                                }`}>
                                {item.count}
                            </span>
                        )}
                    </button>
                ))}

                {/* Divider */}
                <div className={`my-4 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`} />

                {/* Quick Links */}
                <p className={`text-xs font-medium uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('media.quick_links', 'Liên kết nhanh')}
                </p>

                <Link
                    href="/ai-studio"
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isDark
                        ? 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    <Icon name="ai" className="w-5 h-5 text-violet-500" />
                    <span className="flex-1 text-left">AI Studio</span>
                    <Icon name="chevronRight" className="w-4 h-4 opacity-40" />
                </Link>

                <Link
                    href="/ai-studio/generations"
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isDark
                        ? 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    <Icon name="media" className="w-5 h-5 text-emerald-500" />
                    <span className="flex-1 text-left">AI Gallery</span>
                    <Icon name="chevronRight" className="w-4 h-4 opacity-40" />
                </Link>
            </div>

            {/* Storage Stats */}
            <div className={`p-4 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('media.storage', 'Dung lượng')}
                    </span>
                    <Link
                        href="/media/storage-plans"
                        className={`text-xs font-medium transition-colors ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}
                    >
                        Chi tiết →
                    </Link>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                    <div
                        className={`h-full rounded-full transition-all ${storagePercent > 90
                            ? 'bg-red-500'
                            : storagePercent > 70
                                ? 'bg-amber-500'
                                : isDark ? 'bg-emerald-500' : 'bg-emerald-600'
                            }`}
                        style={{ width: `${storagePercent}%` }}
                    />
                </div>
                <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {formatBytes(storageUsed)} / {formatBytes(storageLimit)}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {storagePlan?.name || 'Free'}
                    </span>
                </div>

                {/* Warning & Upgrade Button */}
                {storagePercent > 70 && (
                    <div className={`mt-3 p-2.5 rounded-lg ${storagePercent > 90
                        ? isDark ? 'bg-red-900/30' : 'bg-red-50'
                        : isDark ? 'bg-amber-900/30' : 'bg-amber-50'
                        }`}>
                        <p className={`text-xs ${storagePercent > 90
                            ? isDark ? 'text-red-400' : 'text-red-600'
                            : isDark ? 'text-amber-400' : 'text-amber-600'
                            }`}>
                            {storagePercent > 90 ? '⚠️ Sắp hết dung lượng!' : '⚡ Gần đầy'}
                        </p>
                        <Link
                            href="/media/storage-plans"
                            className={`mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${isDark
                                ? 'bg-white text-black hover:bg-gray-100'
                                : 'bg-gray-900 text-white hover:bg-gray-800'
                                }`}
                        >
                            <Icon name="arrowRight" className="w-3.5 h-3.5" />
                            Nâng cấp ngay
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
