import { useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function Create() {
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

    return (
        <AppLayout title="Add New Device">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Add New Device
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Register a new device to your account
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Device ID */}
                        <div>
                            <label htmlFor="device_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Device ID <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="device_id"
                                type="text"
                                value={data.device_id}
                                onChange={(e) => setData('device_id', e.target.value)}
                                className={`block w-full px-4 py-2.5 rounded-lg border ${
                                    errors.device_id
                                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                                } bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2`}
                                placeholder="e.g., ABC123XYZ456"
                                required
                            />
                            {errors.device_id && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.device_id}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Unique identifier for this device
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
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Add Device
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
