import { Head, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import {
    PageHeader,
    GlassCard,
    Input,
    Select,
    Button,
    Breadcrumb,
    Divider,
    Alert,
} from '@/Components/UI';

export default function Edit({ device }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { data, setData, put, processing, errors } = useForm({
        name: device.name || '',
        model: device.model || '',
        android_version: device.android_version || '',
        status: device.status || 'active',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/devices/${device.id}`);
    };

    const statusOptions = [
        { value: 'active', label: t('devices.status.online') },
        { value: 'inactive', label: t('devices.status.offline') },
        { value: 'maintenance', label: 'Maintenance' },
    ];

    return (
        <AppLayout title={t('devices.edit_device', { defaultValue: 'Edit Device' })}>
            <Head title={t('devices.edit_device', { defaultValue: 'Edit Device' })} />

            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[600px] mx-auto px-6 py-6">
                    {/* Breadcrumb */}
                    <Breadcrumb
                        items={[
                            { label: t('devices.title'), href: '/devices' },
                            { label: device.name || t('devices.edit_device', { defaultValue: 'Edit Device' }) },
                        ]}
                        className="mb-4"
                    />

                    {/* Header */}
                    <PageHeader
                        title={t('devices.edit_device', { defaultValue: 'Edit Device' })}
                        subtitle={t('devices.update_description', { defaultValue: 'Update device information' })}
                        backHref="/devices"
                    />

                    {/* Form */}
                    <GlassCard gradient="gray" hover={false}>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Device ID (Read-only) */}
                            <Input
                                label={t('devices.device_id', { defaultValue: 'Device ID' })}
                                value={device.device_id}
                                disabled
                                hint={t('devices.device_id_hint', { defaultValue: 'Device ID cannot be changed' })}
                            />

                            <Input
                                label={t('devices.device_name', { defaultValue: 'Device Name' })}
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g., My Phone"
                                error={errors.name}
                            />

                            <Input
                                label={t('devices.model', { defaultValue: 'Model' })}
                                value={data.model}
                                onChange={(e) => setData('model', e.target.value)}
                                placeholder="e.g., Samsung Galaxy S21"
                            />

                            <Input
                                label={t('devices.os_version', { defaultValue: 'OS Version' })}
                                value={data.android_version}
                                onChange={(e) => setData('android_version', e.target.value)}
                                placeholder="e.g., 12.0"
                            />

                            <Select
                                label={t('common.status', { defaultValue: 'Status' })}
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                options={statusOptions}
                            />

                            {/* Last Active (Read-only) */}
                            <Input
                                label={t('devices.last_active', { defaultValue: 'Last Active' })}
                                value={device.last_active_at ? new Date(device.last_active_at).toLocaleString() : 'Never'}
                                disabled
                            />

                            <Divider />

                            <div className="flex items-center justify-end gap-3">
                                <Button href="/devices" variant="ghost">
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? t('common.saving', { defaultValue: 'Saving...' }) : t('common.save_changes', { defaultValue: 'Save Changes' })}
                                </Button>
                            </div>
                        </form>
                    </GlassCard>

                    {/* Info footer */}
                    <Alert type="info" className="mt-4">
                        {t('common.created', { defaultValue: 'Created' })}: {new Date(device.created_at).toLocaleString()} • {t('common.updated', { defaultValue: 'Updated' })}: {new Date(device.updated_at).toLocaleString()}
                    </Alert>
                </div>
            </div>
        </AppLayout>
    );
}
