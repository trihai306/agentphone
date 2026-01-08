import { Link, usePage, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

const notificationStyles = {
    info: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'text-blue-500',
        iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    },
    success: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        icon: 'text-green-500',
        iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    },
    warning: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        icon: 'text-yellow-500',
        iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
        badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
    },
    error: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        icon: 'text-red-500',
        iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
        badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    },
};

export default function Show({ notification }) {
    const { flash } = usePage().props;
    const style = notificationStyles[notification.type] || notificationStyles.info;

    const handleDelete = () => {
        router.delete(`/notifications/${notification.id}`, {
            onSuccess: () => {
                router.visit('/notifications');
            }
        });
    };

    return (
        <AppLayout title="View Notification">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/notifications"
                    className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back to Notifications</span>
                </Link>
            </div>

            {/* Flash Messages */}
            {flash?.success && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <p className="text-green-700 dark:text-green-400">{flash.success}</p>
                </div>
            )}

            {/* Notification Detail */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                <div className={`p-8 ${style.bg} border-b ${style.border}`}>
                    <div className="flex items-start space-x-4">
                        <div className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 border ${style.border} flex items-center justify-center shadow-lg`}>
                            <svg
                                className={`w-8 h-8 ${style.icon}`}
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
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${style.badge}`}>
                                    {notification.type.toUpperCase()}
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {notification.title}
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="prose dark:prose-invert max-w-none">
                        <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                            {notification.message}
                        </p>
                    </div>

                    {notification.action_url && (
                        <div className="mt-6">
                            <a
                                href={notification.action_url}
                                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                            >
                                <span>{notification.action_text || 'View details'}</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                <p>Received: {new Date(notification.created_at).toLocaleString()}</p>
                            </div>
                            <button
                                onClick={handleDelete}
                                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
