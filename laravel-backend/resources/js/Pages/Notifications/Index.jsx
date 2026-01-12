import { usePage, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Index({ notifications, unreadCount }) {
    const { theme } = useTheme();
    const { flash } = usePage().props;
    const isDark = theme === 'dark';

    const handleMarkAsRead = (id) => {
        router.post(`/notifications/${id}/read`, {}, { preserveScroll: true });
    };

    const handleMarkAllAsRead = () => {
        router.post('/notifications/read-all', {}, { preserveScroll: true });
    };

    const handleDelete = (id) => {
        router.delete(`/notifications/${id}`, { preserveScroll: true });
    };

    const getTypeColor = (type) => {
        const colors = {
            success: isDark ? 'text-emerald-400' : 'text-emerald-600',
            warning: isDark ? 'text-amber-400' : 'text-amber-600',
            error: isDark ? 'text-red-400' : 'text-red-600',
            info: isDark ? 'text-blue-400' : 'text-blue-600',
        };
        return colors[type] || colors.info;
    };

    return (
        <AppLayout title="Notifications">
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[900px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Notifications
                            </h1>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                            </p>
                        </div>
                        {notifications.length > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Flash */}
                    {flash?.success && (
                        <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-emerald-900/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                            {flash.success}
                        </div>
                    )}

                    {/* Notifications */}
                    {notifications.length === 0 ? (
                        <div className={`rounded-xl p-16 text-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <div className={`w-14 h-14 mx-auto rounded-lg flex items-center justify-center mb-4 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                                <svg className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                No notifications
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                You're all caught up
                            </p>
                        </div>
                    ) : (
                        <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <div className={`divide-y ${isDark ? 'divide-[#2a2a2a]' : 'divide-gray-100'}`}>
                                {notifications.map((notification) => {
                                    const isRead = notification.is_read_by_current_user;
                                    return (
                                        <div
                                            key={notification.id}
                                            className={`p-4 ${!isRead ? (isDark ? 'bg-blue-900/10' : 'bg-blue-50/50') : ''} ${isDark ? 'hover:bg-[#222]' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${!isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <h3 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                {notification.title}
                                                            </h3>
                                                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                {notification.message}
                                                            </p>
                                                            <p className={`text-xs mt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                {new Date(notification.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {!isRead && (
                                                                <button
                                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                                    className={`p-1.5 rounded-md ${isDark ? 'text-gray-500 hover:text-white hover:bg-[#2a2a2a]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDelete(notification.id)}
                                                                className={`p-1.5 rounded-md ${isDark ? 'text-gray-500 hover:text-red-400 hover:bg-red-900/20' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {notification.action_url && (
                                                        <a
                                                            href={notification.action_url}
                                                            className={`inline-block mt-2 text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                                                        >
                                                            {notification.action_text || 'View details'} →
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
