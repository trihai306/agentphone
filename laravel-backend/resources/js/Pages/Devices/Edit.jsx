import { useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function Edit({ device }) {
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

    return (
        <AppLayout title="Edit Device">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Edit Device
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Update device information
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Device ID (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Device ID
                            </label>
                            <div className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <span className="text-gray-600 dark:text-gray-400 font-mono">{device.device_id}</span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Device ID cannot be changed
                            </p>
                        </div>

                        {/* Device Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Device Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className={`block w-full px-4 py-2.5 rounded-lg border ${
                                    errors.name
                                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                                } bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2`}
                                placeholder="e.g., My Phone"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                            )}
                        </div>

                        {/* Model */}
                        <div>
                            <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Model
                            </label>
                            <input
                                id="model"
                                type="text"
                                value={data.model}
                                onChange={(e) => setData('model', e.target.value)}
                                className={`block w-full px-4 py-2.5 rounded-lg border ${
                                    errors.model
                                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                                } bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2`}
                                placeholder="e.g., Samsung Galaxy S21"
                            />
                            {errors.model && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.model}</p>
                            )}
                        </div>

                        {/* Android Version */}
                        <div>
                            <label htmlFor="android_version" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Android Version
                            </label>
                            <input
                                id="android_version"
                                type="text"
                                value={data.android_version}
                                onChange={(e) => setData('android_version', e.target.value)}
                                className={`block w-full px-4 py-2.5 rounded-lg border ${
                                    errors.android_version
                                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                                } bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2`}
                                placeholder="e.g., 12.0"
                            />
                            {errors.android_version && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.android_version}</p>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Status
                            </label>
                            <select
                                id="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className={`block w-full px-4 py-2.5 rounded-lg border ${
                                    errors.status
                                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                                } bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2`}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                            {errors.status && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status}</p>
                            )}
                        </div>

                        {/* Last Active */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Last Active
                            </label>
                            <div className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <span className="text-gray-600 dark:text-gray-400">
                                    {device.last_active_at ? new Date(device.last_active_at).toLocaleString() : 'Never'}
                                </span>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <a
                                href="/devices"
                                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </a>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Update Device
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Device Info Card */}
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                                Device Information
                            </h4>
                            <div className="mt-2 text-sm text-blue-800 dark:text-blue-300 space-y-1">
                                <p><strong>Created:</strong> {new Date(device.created_at).toLocaleString()}</p>
                                <p><strong>Updated:</strong> {new Date(device.updated_at).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
