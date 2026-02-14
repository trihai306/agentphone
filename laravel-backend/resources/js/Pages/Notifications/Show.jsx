import { Head, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import {
    PageHeader,
    GlassCard,
    Button,
    Badge,
} from '@/Components/UI';

export default function Show({ notification }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const handleDelete = () => {
        router.delete(`/notifications/${notification.id}`, {
            onSuccess: () => router.visit('/notifications'),
        });
    };

    const getTypeVariant = () => {
        const variants = {
            success: 'success',
            warning: 'warning',
            error: 'danger',
            info: 'primary',
        };
        return variants[notification.type] || 'primary';
    };

    return (
        <AppLayout title={t('notifications.detail', 'Notification')}>
            <Head title={t('notifications.detail', 'Notification')} />
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[600px] mx-auto px-6 py-6">
                    {/* Header */}
                    <PageHeader
                        title={t('notifications.detail', 'Notification')}
                        backHref="/notifications"
                    />

                    {/* Content */}
                    <GlassCard gradient="gray" hover={false}>
                        <div className="mb-4">
                            <Badge variant={getTypeVariant()} size="sm">
                                {notification.type}
                            </Badge>
                        </div>

                        <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {notification.title}
                        </h2>

                        <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {notification.message}
                        </p>

                        {notification.action_url && (
                            <div className="mt-6">
                                <Button href={notification.action_url}>
                                    {notification.action_text || t('notifications.view_details', 'View Details')} →
                                </Button>
                            </div>
                        )}

                        <div className={`flex items-center justify-between mt-6 pt-6 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                            <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                {new Date(notification.created_at).toLocaleString()}
                            </span>
                            <Button variant="danger" size="sm" onClick={handleDelete}>
                                {t('common.delete', 'Delete')}
                            </Button>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </AppLayout>
    );
}
