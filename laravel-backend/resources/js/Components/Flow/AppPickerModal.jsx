import { useState, useEffect, useMemo, useRef } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/Components/UI';

/**
 * AppPickerModal - Select installed app from connected device
 * 
 * Receives apps list from parent component via props.
 * Parent component manages socket subscription using useDeviceApps hook.
 */
export default function AppPickerModal({
    isOpen,
    onClose,
    onSelect,
    deviceId,
    userId,
    apps = [],
    loading = false,
    onRequestApps,
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { t } = useTranslation();

    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Track the open state changes to know when to fetch
    const prevOpenRef = useRef(false);

    // Auto-fetch when modal opens (detect open transition: false -> true)
    useEffect(() => {
        const wasOpen = prevOpenRef.current;
        prevOpenRef.current = isOpen;

        // Only fetch when modal transitions from closed to open
        if (isOpen && !wasOpen && deviceId && onRequestApps) {
            console.log('🔌 AppPicker: Modal just opened, requesting apps...');
            setTimeout(() => {
                console.log('📤 AppPicker: Auto-fetching apps now...');
                onRequestApps(deviceId);
            }, 1000);
        }
    }, [isOpen, deviceId, onRequestApps]);

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setError(null);
        }
    }, [isOpen]);

    // Filter apps by search query
    const filteredApps = useMemo(() => {
        if (!searchQuery) return apps;
        const query = searchQuery.toLowerCase();
        return apps.filter(app =>
            app.name?.toLowerCase().includes(query) ||
            app.packageName?.toLowerCase().includes(query)
        );
    }, [apps, searchQuery]);

    // Handle app selection
    const handleSelect = (app) => {
        onSelect({
            packageName: app.packageName,
            appName: app.name,
            icon: app.icon,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[9999] bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
                <div
                    className={`w-full max-w-lg max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col pointer-events-auto ${isDark ? 'bg-[#0f0f0f]' : 'bg-white'}`}
                    style={{ boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`px-5 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-50'}`}>
                                    <span className="text-xl">📱</span>
                                </div>
                                <div>
                                    <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {t('flows.editor.config.select_app', 'Select App')}
                                    </h2>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {apps.length} {t('flows.editor.config.apps_available', 'apps available')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => onRequestApps?.(deviceId)}
                                    disabled={loading}
                                >
                                    {loading ? '⏳' : '🔄'} {t('common.refresh', 'Refresh')}
                                </Button>

                                <Button variant="ghost" size="icon-xs" onClick={onClose}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </Button>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="mt-3">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('flows.editor.config.search_apps', 'Search apps...')}
                                className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark
                                    ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-500'
                                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                                    }`}
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t('flows.editor.config.loading_apps', 'Loading apps from device...')}
                                </p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <span className="text-4xl mb-3">⚠️</span>
                                <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-500'}`}>{error}</p>
                                <Button
                                    variant="secondary"
                                    onClick={() => onRequestApps?.(deviceId)}
                                    className="mt-4"
                                >
                                    {t('common.try_again', 'Try Again')}
                                </Button>
                            </div>
                        ) : filteredApps.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <span className="text-4xl mb-3">📭</span>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {searchQuery
                                        ? t('flows.editor.config.no_apps_match', 'No apps match your search')
                                        : t('flows.editor.config.no_apps_found', 'No apps found')}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                {filteredApps.map((app, index) => (
                                    <button
                                        key={app.packageName || index}
                                        onClick={() => handleSelect(app)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${isDark
                                            ? 'hover:bg-white/5 active:bg-white/10'
                                            : 'hover:bg-gray-50 active:bg-gray-100'
                                            }`}
                                    >
                                        {/* App Icon */}
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                                            {app.icon ? (
                                                <img
                                                    src={`data:image/png;base64,${app.icon}`}
                                                    alt={app.name}
                                                    className="w-10 h-10 object-contain"
                                                />
                                            ) : (
                                                <span className="text-2xl">📱</span>
                                            )}
                                        </div>

                                        {/* App Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {app.name || 'Unknown App'}
                                            </div>
                                            <div className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {app.packageName}
                                            </div>
                                        </div>

                                        {/* Select indicator */}
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-50'}`}>
                                            <svg className={`w-3 h-3 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
