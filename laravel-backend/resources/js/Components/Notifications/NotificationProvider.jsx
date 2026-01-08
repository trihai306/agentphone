import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { usePage, router } from '@inertiajs/react';

// Notification Context
const NotificationContext = createContext(null);

/**
 * Notification types with their styles
 */
const notificationStyles = {
    info: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'text-blue-500',
        iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    success: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        icon: 'text-green-500',
        iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    warning: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        icon: 'text-yellow-500',
        iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    },
    error: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        icon: 'text-red-500',
        iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
};

/**
 * Single Toast Notification Component
 */
function Toast({ notification, onDismiss, duration = 5000 }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const style = notificationStyles[notification.type] || notificationStyles.info;

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setIsVisible(true));

        // Auto dismiss
        if (duration > 0) {
            const timer = setTimeout(() => {
                handleDismiss();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleDismiss = useCallback(() => {
        setIsLeaving(true);
        setTimeout(() => {
            onDismiss(notification.id);
        }, 300);
    }, [notification.id, onDismiss]);

    return (
        <div
            className={`
                transform transition-all duration-300 ease-out
                ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
                max-w-sm w-full ${style.bg} border ${style.border} rounded-lg shadow-lg pointer-events-auto
            `}
        >
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg
                            className={`h-5 w-5 ${style.icon}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d={style.iconPath}
                            />
                        </svg>
                    </div>
                    <div className="ml-3 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {notification.message}
                        </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={handleDismiss}
                            className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                            <span className="sr-only">Close</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Toast Container - renders all active toasts
 */
function ToastContainer({ toasts, onDismiss }) {
    return (
        <div
            aria-live="assertive"
            className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50"
        >
            <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        notification={toast}
                        onDismiss={onDismiss}
                        duration={toast.duration || 5000}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Notification Bell with Dropdown
 */
export function NotificationBell({ onViewAll }) {
    const { notifications: serverNotifications } = usePage().props;
    const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotificationContext();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white focus:outline-none"
            >
                <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Notifications
                                </h3>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={() => markAllAsRead()}
                                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                    No notifications
                                </div>
                            ) : (
                                notifications.slice(0, 10).map((notification) => {
                                    const style =
                                        notificationStyles[notification.type] ||
                                        notificationStyles.info;
                                    return (
                                        <div
                                            key={notification.id}
                                            className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                                                !notification.read
                                                    ? 'bg-blue-50 dark:bg-blue-900/10'
                                                    : ''
                                            }`}
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            <div className="flex items-start">
                                                <svg
                                                    className={`h-5 w-5 ${style.icon} flex-shrink-0`}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d={style.iconPath}
                                                    />
                                                </svg>
                                                <div className="ml-3 flex-1">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(
                                                            notification.created_at ||
                                                                notification.timestamp ||
                                                                notification.receivedAt
                                                        ).toLocaleString()}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeNotification(notification.id);
                                                    }}
                                                    className="ml-2 text-gray-400 hover:text-gray-600"
                                                >
                                                    <svg
                                                        className="h-4 w-4"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        router.visit('/notifications');
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 py-2"
                                >
                                    View all
                                </button>
                                <button
                                    onClick={() => clearAll()}
                                    className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 py-2"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

/**
 * Notification Provider - wraps app with notification context
 * Integrates with Inertia shared data and WebSocket for real-time updates
 */
export function NotificationProvider({ children }) {
    const { auth, notifications: serverNotifications } = usePage().props;
    const userId = auth?.user?.id;
    const isAdmin = auth?.user?.is_admin;

    const [toasts, setToasts] = useState([]);
    const [localNotifications, setLocalNotifications] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    // Merge server notifications with local (realtime) notifications
    const serverItems = serverNotifications?.items || [];
    const serverUnreadCount = serverNotifications?.unread_count || 0;

    // Combined notifications: local realtime + server persisted
    const notifications = [...localNotifications, ...serverItems.map(n => ({
        ...n,
        read: n.is_read_by_current_user || false,
        receivedAt: n.created_at,
    }))];

    // Unread count includes both local and server
    const unreadCount = localNotifications.filter(n => !n.read).length + serverUnreadCount;

    // Add a toast notification
    const showToast = useCallback((notification) => {
        const id = Date.now() + Math.random();
        const toast = { ...notification, id };
        setToasts((prev) => [...prev, toast]);
        return id;
    }, []);

    // Remove a toast
    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // Add notification to local list (realtime)
    const addNotification = useCallback((notification) => {
        const newNotification = {
            ...notification,
            id: notification.id || Date.now() + Math.random(),
            read: false,
            receivedAt: new Date().toISOString(),
        };
        setLocalNotifications((prev) => [newNotification, ...prev]);
        showToast(notification);
        return newNotification;
    }, [showToast]);

    // Mark as read - uses Inertia router for server-side update
    const markAsRead = useCallback((id) => {
        // Update local state immediately
        setLocalNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );

        // If it's a server notification, update via Inertia
        const isServerNotification = serverItems.find(n => n.id === id);
        if (isServerNotification) {
            router.post(`/notifications/${id}/read`, {}, {
                preserveScroll: true,
                preserveState: true,
            });
        }
    }, [serverItems]);

    // Mark all as read - uses Inertia router
    const markAllAsRead = useCallback(() => {
        // Update local state immediately
        setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

        // Update server via Inertia
        router.post('/notifications/read-all', {}, {
            preserveScroll: true,
            preserveState: true,
        });
    }, []);

    // Remove notification
    const removeNotification = useCallback((id) => {
        // Remove from local
        setLocalNotifications((prev) => prev.filter((n) => n.id !== id));

        // If server notification, delete via Inertia
        const isServerNotification = serverItems.find(n => n.id === id);
        if (isServerNotification) {
            router.delete(`/notifications/${id}`, {
                preserveScroll: true,
                preserveState: true,
            });
        }
    }, [serverItems]);

    // Clear all local notifications
    const clearAll = useCallback(() => {
        setLocalNotifications([]);
        // Optionally mark all server notifications as read
        router.post('/notifications/read-all', {}, {
            preserveScroll: true,
            preserveState: true,
        });
    }, []);

    // Refresh notifications from server (useful after WebSocket event)
    const refreshNotifications = useCallback(() => {
        router.reload({ only: ['notifications'] });
    }, []);

    // Set up WebSocket listeners for real-time notifications
    useEffect(() => {
        if (!window.Echo) return;

        const subscriptions = [];

        try {
            // User channel
            if (userId) {
                const userChannel = window.Echo.private(`user.${userId}`);
                userChannel.listen('.notification', (data) => {
                    addNotification({ ...data, channel: 'user' });
                    // Also refresh from server to sync
                    refreshNotifications();
                });
                subscriptions.push(`private-user.${userId}`);
            }

            // Admin channel
            if (isAdmin) {
                const adminChannel = window.Echo.private('admins');
                adminChannel.listen('.admin.notification', (data) => {
                    addNotification({ ...data, channel: 'admin' });
                    refreshNotifications();
                });
                subscriptions.push('private-admins');
            }

            // Announcements channel (public)
            const announcementChannel = window.Echo.channel('announcements');
            announcementChannel.listen('.announcement', (data) => {
                addNotification({ ...data, channel: 'announcement' });
                refreshNotifications();
            });
            subscriptions.push('announcements');

            setIsConnected(true);
        } catch (error) {
            console.error('WebSocket connection error:', error);
            setIsConnected(false);
        }

        return () => {
            subscriptions.forEach((channel) => {
                window.Echo?.leaveChannel(channel);
            });
        };
    }, [userId, isAdmin, addNotification, refreshNotifications]);

    const value = {
        notifications,
        unreadCount,
        isConnected,
        showToast,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        refreshNotifications,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </NotificationContext.Provider>
    );
}

/**
 * Hook to access notification context
 */
export function useNotificationContext() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error(
            'useNotificationContext must be used within a NotificationProvider'
        );
    }
    return context;
}

export default NotificationProvider;
