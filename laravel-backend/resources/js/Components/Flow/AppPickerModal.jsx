import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

/**
 * AppPickerModal - Select installed app from connected device
 * 
 * Similar to ElementPickerModal but for selecting apps to launch.
 * Requests installed apps list from APK via socket.
 */
export default function AppPickerModal({
    isOpen,
    onClose,
    onSelect,
    deviceId,
    userId,
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { t } = useTranslation();

    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Listen for apps list result from socket
    useEffect(() => {
        if (!isOpen || !userId) return;

        const handleResult = (data) => {
            console.log('📱 Received apps.result:', data);
            setLoading(false);

            if (data.success) {
                setApps(data.apps || []);
                setError(null);
            } else {
                setError(data.error || 'Failed to get apps list');
                setApps([]);
            }
        };

        if (window.Echo) {
            const channel = window.Echo.private(`user.${userId}`);
            console.log(`🔌 AppPicker: Subscribing to private-user.${userId}`);

            channel.listen('.apps.result', handleResult);

            return () => {
                console.log(`🔌 AppPicker: Unsubscribing from private-user.${userId}`);
                channel.stopListening('.apps.result');
            };
        } else {
            console.error('❌ AppPicker: window.Echo not available!');
        }
    }, [isOpen, userId]);

    // Auto-fetch on open
    useEffect(() => {
        if (isOpen && deviceId && apps.length === 0) {
            const timer = setTimeout(() => {
                requestApps();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, deviceId]);

    // Request apps list from device
    const requestApps = useCallback(async () => {
        if (!deviceId) {
            setError(t('flows.editor.config.no_device_selected', 'No device selected'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('📤 Requesting apps list from device:', deviceId);
            const response = await window.axios.post('/devices/apps', { device_id: deviceId });

            if (!response?.data?.success) {
                setError(response?.data?.message || 'Failed to request apps');
                setLoading(false);
            } else {
                console.log('📥 API response success - waiting for socket event...');
                // Safety timeout - if no response in 10s, stop loading
                setTimeout(() => {
                    setLoading(false);
                }, 10000);
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Cannot connect to server';
            setError(message);
            setLoading(false);
        }
    }, [deviceId, t]);

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setApps([]);
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
                                <button
                                    onClick={requestApps}
                                    disabled={loading}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${loading
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        : isDark
                                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                        }`}
                                >
                                    {loading ? '⏳' : '🔄'} {t('common.refresh', 'Refresh')}
                                </button>

                                <button
                                    onClick={onClose}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
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
                                <button
                                    onClick={requestApps}
                                    className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium ${isDark
                                        ? 'bg-white/10 hover:bg-white/20 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                >
                                    {t('common.try_again', 'Try Again')}
                                </button>
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
