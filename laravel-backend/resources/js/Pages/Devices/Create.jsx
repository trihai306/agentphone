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
} from '@/Components/UI';

export default function Create() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { data, setData, post, processing, errors } = useForm({
        device_id: '',
        name: '',
        model: '',
        android_version: '',
        status: 'active',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/devices');
    };

    const statusOptions = [
        { value: 'active', label: t('devices.status.online') },
        { value: 'inactive', label: t('devices.status.offline') },
        { value: 'maintenance', label: 'Maintenance' },
    ];

    return (
        <AppLayout title={t('devices.add_device')}>
            <Head title={t('devices.add_device')} />

            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[600px] mx-auto px-6 py-6">
                    {/* Breadcrumb */}
                    <Breadcrumb
                        items={[
                            { label: t('devices.title'), href: '/devices' },
                            { label: t('devices.add_device') },
                        ]}
                        className="mb-4"
                    />

                    {/* Header */}
                    <PageHeader
                        title={t('devices.add_device')}
                        subtitle={t('devices.register_description', { defaultValue: 'Register a new device' })}
                        backHref="/devices"
                    />

                    {/* Form */}
                    <GlassCard gradient="gray" hover={false}>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <Input
                                label={<>{t('devices.device_id', { defaultValue: 'Device ID' })} <span className="text-red-500">*</span></>}
                                value={data.device_id}
                                onChange={(e) => setData('device_id', e.target.value)}
                                placeholder="e.g., ABC123XYZ456"
                                error={errors.device_id}
                                required
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
                                error={errors.model}
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

                            <Divider />

                            <div className="flex items-center justify-end gap-3">
                                <Button href="/devices" variant="ghost">
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? t('common.adding', { defaultValue: 'Adding...' }) : t('devices.add_device', { defaultValue: 'Add Device' })}
                                </Button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            </div>
        </AppLayout>
    );
}
