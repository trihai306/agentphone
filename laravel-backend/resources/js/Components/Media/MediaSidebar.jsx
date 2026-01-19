import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function MediaSidebar({
    activeFilter,
    onFilterChange,
    stats = {},
    folders = [],
    storagePlan = {},
    isDark = false
}) {
    const { t } = useTranslation();

    const navItems = [
        { key: 'all', label: t('media.all_files', 'Tất cả'), icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', count: stats.total },
        { key: 'image', label: t('media.images', 'Hình ảnh'), icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', count: stats.images },
        { key: 'video', label: t('media.videos', 'Video'), icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', count: stats.videos },
        { key: 'ai', label: 'AI Generated', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', count: stats.ai_generated },
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
        <div className={`w-56 flex-shrink-0 border-r h-full flex flex-col ${isDark ? 'bg-[#0d0d0d] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
            {/* Navigation */}
            <div className="flex-1 p-4 space-y-1 overflow-y-auto">
                <p className={`text-xs font-medium uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('media.library', 'Thư viện')}
                </p>

                {navItems.map((item) => (
                    <button
                        key={item.key}
                        onClick={() => onFilterChange('type', item.key === 'all' ? null : item.key)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${(activeFilter === item.key) || (item.key === 'all' && !activeFilter)
                            ? isDark
                                ? 'bg-white text-black'
                                : 'bg-gray-900 text-white'
                            : isDark
                                ? 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                        </svg>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.count !== undefined && (
                            <span className={`text-xs ${(activeFilter === item.key) || (item.key === 'all' && !activeFilter)
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="flex-1 text-left">AI Studio</span>
                    <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </Link>

                <Link
                    href="/ai-studio/generations"
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isDark
                        ? 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="flex-1 text-left">AI Gallery</span>
                    <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
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
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            Nâng cấp ngay
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
