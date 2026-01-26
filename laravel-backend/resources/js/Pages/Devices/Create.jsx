import { useForm, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import {
    PageHeader,
    GlassCard,
    Input,
    Select,
    Button,
} from '@/Components/UI';

export default function Create() {
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
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'maintenance', label: 'Maintenance' },
    ];

    return (
        <AppLayout title="Add Device">
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[600px] mx-auto px-6 py-6">
                    {/* Header */}
                    <PageHeader
                        title="Add Device"
                        subtitle="Register a new device"
                        backHref="/devices"
                    />

                    {/* Form */}
                    <GlassCard gradient="gray" hover={false}>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <Input
                                label={<>Device ID <span className="text-red-500">*</span></>}
                                value={data.device_id}
                                onChange={(e) => setData('device_id', e.target.value)}
                                placeholder="e.g., ABC123XYZ456"
                                error={errors.device_id}
                                required
                            />

                            <Input
                                label="Device Name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g., My Phone"
                                error={errors.name}
                            />

                            <Input
                                label="Model"
                                value={data.model}
                                onChange={(e) => setData('model', e.target.value)}
                                placeholder="e.g., Samsung Galaxy S21"
                                error={errors.model}
                            />

                            <Input
                                label="OS Version"
                                value={data.android_version}
                                onChange={(e) => setData('android_version', e.target.value)}
                                placeholder="e.g., 12.0"
                            />

                            <Select
                                label="Status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                options={statusOptions}
                            />

                            <div className={`flex items-center justify-end gap-3 pt-6 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                                <Button href="/devices" variant="ghost">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Adding...' : 'Add Device'}
                                </Button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            </div>
        </AppLayout>
    );
}
