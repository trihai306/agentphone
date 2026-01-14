import { Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Show({ notification }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const handleDelete = () => {
        router.delete(`/notifications/${notification.id}`, {
            onSuccess: () => router.visit('/notifications'),
        });
    };

    const getTypeStyle = () => {
        const styles = {
            success: isDark ? 'text-emerald-400' : 'text-emerald-600',
            warning: isDark ? 'text-amber-400' : 'text-amber-600',
            error: isDark ? 'text-red-400' : 'text-red-600',
            info: isDark ? 'text-blue-400' : 'text-blue-600',
        };
        return styles[notification.type] || styles.info;
    };

    return (
        <AppLayout title="Notification">
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[600px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <Link
                            href="/notifications"
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'}`}
                        >
                            <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Notification
                        </h1>
                    </div>

                    {/* Content */}
                    <div className={`p-6 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                        <div className="mb-4">
                            <span className={`text-xs font-medium uppercase ${getTypeStyle()}`}>
                                {notification.type}
                            </span>
                        </div>

                        <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {notification.title}
                        </h2>

                        <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {notification.message}
                        </p>

                        {notification.action_url && (
                            <a
                                href={notification.action_url}
                                className={`inline-block mt-6 px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                    }`}
                            >
                                {notification.action_text || 'View Details'} →
                            </a>
                        )}

                        <div className={`flex items-center justify-between mt-6 pt-6 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                            <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                {new Date(notification.created_at).toLocaleString()}
                            </span>
                            <button
                                onClick={handleDelete}
                                className={`text-sm ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
