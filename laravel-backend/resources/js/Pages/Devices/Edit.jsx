import { useForm, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import {
    PageHeader,
    GlassCard,
    Input,
    Select,
    Button,
    DataList,
} from '@/Components/UI';

export default function Edit({ device }) {
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
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'maintenance', label: 'Maintenance' },
    ];

    return (
        <AppLayout title="Edit Device">
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[600px] mx-auto px-6 py-6">
                    {/* Header */}
                    <PageHeader
                        title="Edit Device"
                        subtitle="Update device information"
                        backHref="/devices"
                    />

                    {/* Form */}
                    <GlassCard gradient="gray" hover={false}>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Device ID (Read-only) */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Device ID
                                </label>
                                <div className={`px-4 py-2.5 rounded-lg text-sm font-mono ${isDark ? 'bg-[#222] text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                                    {device.device_id}
                                </div>
                                <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                    Device ID cannot be changed
                                </p>
                            </div>

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

                            {/* Last Active (Read-only) */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Last Active
                                </label>
                                <div className={`px-4 py-2.5 rounded-lg text-sm ${isDark ? 'bg-[#222] text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                                    {device.last_active_at ? new Date(device.last_active_at).toLocaleString() : 'Never'}
                                </div>
                            </div>

                            <div className={`flex items-center justify-end gap-3 pt-6 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                                <Button href="/devices" variant="ghost">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </GlassCard>

                    {/* Info */}
                    <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Created: {new Date(device.created_at).toLocaleString()} • Updated: {new Date(device.updated_at).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
