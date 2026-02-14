import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import {
    PageHeader,
    GlassCard,
    EmptyStateCard,
    Button,
    Alert,
} from '@/Components/UI';

export default function Index({ notifications, unreadCount }) {
    const { t } = useTranslation();
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

    return (
        <AppLayout title={t('notifications.title', 'Notifications')}>
            <Head title={t('notifications.title', 'Notifications')} />
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[900px] mx-auto px-6 py-6">
                    {/* Header */}
                    <PageHeader
                        title={t('notifications.title', 'Notifications')}
                        subtitle={unreadCount > 0 ? `${unreadCount} ${t('notifications.unread', 'unread')}` : t('notifications.all_caught_up', 'All caught up')}
                        actions={
                            notifications.length > 0 && (
                                <Button variant="ghost" onClick={handleMarkAllAsRead}>
                                    {t('notifications.mark_all_read', 'Mark all read')}
                                </Button>
                            )
                        }
                    />

                    {/* Flash */}
                    {flash?.success && (
                        <Alert type="success" className="mb-6">
                            {flash.success}
                        </Alert>
                    )}

                    {/* Notifications */}
                    {notifications.length === 0 ? (
                        <EmptyStateCard
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            }
                            title={t('notifications.no_notifications', 'No notifications')}
                            description={t('notifications.all_caught_up', "You're all caught up")}
                        />
                    ) : (
                        <GlassCard gradient="gray" hover={false} className="p-0">
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
                                                                    title={t('notifications.mark_as_read', 'Mark as read')}
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDelete(notification.id)}
                                                                className={`p-1.5 rounded-md ${isDark ? 'text-gray-500 hover:text-red-400 hover:bg-red-900/20' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                                                                title={t('common.delete', 'Delete')}
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
                                                            {notification.action_text || t('notifications.view_details', 'View details')} →
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </GlassCard>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
