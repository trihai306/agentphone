import { useEffect, useState, useCallback } from 'react';
import { usePage, router } from '@inertiajs/react';

/**
 * Custom hook for handling real-time notifications via WebSocket
 * Integrated with Inertia.js for server-side data sync
 *
 * @param {Object} options - Configuration options
 * @param {function} options.onNotification - Callback when notification is received
 * @param {function} options.onAnnouncement - Callback when system announcement is received
 * @param {function} options.onAdminNotification - Callback when admin notification is received
 * @returns {Object} - Notification state and methods
 */
export function useNotifications({
    onNotification = null,
    onAnnouncement = null,
    onAdminNotification = null,
} = {}) {
    // Get data from Inertia shared props
    const { auth, notifications: serverNotifications } = usePage().props;
    const userId = auth?.user?.id;
    const isAdmin = auth?.user?.is_admin;

    const [localNotifications, setLocalNotifications] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);

    // Server notifications from Inertia shared props
    const serverItems = serverNotifications?.items || [];
    const serverUnreadCount = serverNotifications?.unread_count || 0;

    // Merge local (realtime) and server notifications
    const notifications = [
        ...localNotifications,
        ...serverItems.map(n => ({
            ...n,
            read: n.is_read_by_current_user || false,
            receivedAt: n.created_at,
        }))
    ];

    // Total unread count
    const unreadCount = localNotifications.filter(n => !n.read).length + serverUnreadCount;

    // Add notification to local list
    const addNotification = useCallback((notification) => {
        const newNotification = {
            ...notification,
            id: notification.id || Date.now() + Math.random(),
            read: false,
            receivedAt: new Date().toISOString(),
        };
        setLocalNotifications((prev) => [newNotification, ...prev]);
        return newNotification;
    }, []);

    // Mark notification as read - uses Inertia for server sync
    const markAsRead = useCallback((notificationId) => {
        // Update local state immediately
        setLocalNotifications((prev) =>
            prev.map((n) =>
                n.id === notificationId ? { ...n, read: true } : n
            )
        );

        // If it's a server notification, update via Inertia
        const isServerNotification = serverItems.find(n => n.id === notificationId);
        if (isServerNotification) {
            router.post(`/notifications/${notificationId}/read`, {}, {
                preserveScroll: true,
                preserveState: true,
            });
        }
    }, [serverItems]);

    // Mark all notifications as read - uses Inertia
    const markAllAsRead = useCallback(() => {
        // Update local state
        setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

        // Update server via Inertia
        router.post('/notifications/read-all', {}, {
            preserveScroll: true,
            preserveState: true,
        });
    }, []);

    // Remove notification
    const removeNotification = useCallback((notificationId) => {
        // Remove from local
        setLocalNotifications((prev) => prev.filter((n) => n.id !== notificationId));

        // If server notification, delete via Inertia
        const isServerNotification = serverItems.find(n => n.id === notificationId);
        if (isServerNotification) {
            router.delete(`/notifications/${notificationId}`, {
                preserveScroll: true,
                preserveState: true,
            });
        }
    }, [serverItems]);

    // Clear all notifications
    const clearAll = useCallback(() => {
        setLocalNotifications([]);
        router.post('/notifications/read-all', {}, {
            preserveScroll: true,
            preserveState: true,
        });
    }, []);

    // Refresh notifications from server
    const refreshNotifications = useCallback(() => {
        router.reload({ only: ['notifications'] });
    }, []);

    // Set up WebSocket subscriptions
    useEffect(() => {
        if (!window.Echo) {
            setConnectionError('WebSocket not initialized');
            return;
        }

        const subscriptions = [];

        try {
            // Subscribe to user's private channel
            if (userId) {
                const userChannel = window.Echo.private(`user.${userId}`);
                userChannel.listen('.notification', (data) => {
                    const notification = addNotification({
                        ...data,
                        channel: 'user',
                    });
                    onNotification?.(notification, data);
                    // Sync with server
                    refreshNotifications();
                });
                subscriptions.push({ type: 'private', name: `user.${userId}` });
            }

            // Subscribe to admin channel
            if (isAdmin) {
                const adminChannel = window.Echo.private('admins');
                adminChannel.listen('.admin.notification', (data) => {
                    const notification = addNotification({
                        ...data,
                        channel: 'admin',
                    });
                    onAdminNotification?.(notification, data);
                    refreshNotifications();
                });
                subscriptions.push({ type: 'private', name: 'admins' });
            }

            // Subscribe to public announcements channel
            const announcementChannel = window.Echo.channel('announcements');
            announcementChannel.listen('.announcement', (data) => {
                const notification = addNotification({
                    ...data,
                    channel: 'announcement',
                });
                onAnnouncement?.(notification, data);
                refreshNotifications();
            });
            subscriptions.push({ type: 'public', name: 'announcements' });

            setIsConnected(true);
            setConnectionError(null);
        } catch (error) {
            setConnectionError(error.message);
            setIsConnected(false);
        }

        // Cleanup subscriptions on unmount
        return () => {
            subscriptions.forEach(({ type, name }) => {
                if (type === 'private') {
                    window.Echo?.leaveChannel(`private-${name}`);
                } else {
                    window.Echo?.leaveChannel(name);
                }
            });
        };
    }, [userId, isAdmin, onNotification, onAnnouncement, onAdminNotification, addNotification, refreshNotifications]);

    return {
        notifications,
        unreadCount,
        isConnected,
        connectionError,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        refreshNotifications,
    };
}

export default useNotifications;
