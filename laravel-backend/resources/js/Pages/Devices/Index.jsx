import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function Index({ devices }) {
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');

    const handleDelete = (deviceId) => {
        if (confirm('Are you sure you want to delete this device?')) {
            router.delete(`/devices/${deviceId}`);
        }
    };

    const filteredDevices = devices.data.filter(device =>
        device.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.device_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AppLayout title="My Devices">
            <div className="space-y-6">
                {/* Header Section */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Device Management
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Devices are automatically added when your Portal app connects
                    </p>
                </div>

                {/* Search and View Toggle */}
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search devices..."
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-1.5 rounded ${viewMode === 'grid'
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded ${viewMode === 'list'
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Devices Display */}
                {filteredDevices.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No devices found</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {searchQuery
                                ? 'Try a different search term'
                                : 'Devices will appear here automatically when your Portal app connects'}
                        </p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <GridView devices={filteredDevices} onDelete={handleDelete} />
                ) : (
                    <ListView devices={filteredDevices} onDelete={handleDelete} />
                )}

                {/* Pagination */}
                {devices.links && devices.links.length > 3 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        {devices.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                disabled={!link.url}
                                className={`px-3 py-2 text-sm font-medium rounded-lg ${link.active
                                    ? 'bg-blue-600 text-white'
                                    : link.url
                                        ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                    }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

// Grid View Component
function GridView({ devices, onDelete }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
                <div
                    key={device.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow overflow-hidden"
                >
                    {/* Card Header */}
                    <div className="p-6 pb-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${device.status === 'active'
                                    ? 'bg-green-100 dark:bg-green-900/20'
                                    : device.status === 'inactive'
                                        ? 'bg-gray-100 dark:bg-gray-700'
                                        : 'bg-yellow-100 dark:bg-yellow-900/20'
                                    }`}>
                                    <svg className={`w-6 h-6 ${device.status === 'active'
                                        ? 'text-green-600 dark:text-green-400'
                                        : device.status === 'inactive'
                                            ? 'text-gray-500'
                                            : 'text-yellow-600 dark:text-yellow-400'
                                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {device.name || 'Unnamed Device'}
                                    </h3>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${device.status === 'active'
                                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                                        : device.status === 'inactive'
                                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                                            : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                                        }`}>
                                        {device.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card Body */}
                    <div className="px-6 pb-4 space-y-3">
                        <div className="flex items-center text-sm">
                            <span className="text-gray-500 dark:text-gray-400 w-24">Model:</span>
                            <span className="text-gray-900 dark:text-white font-medium">
                                {device.model || 'N/A'}
                            </span>
                        </div>
                        <div className="flex items-center text-sm">
                            <span className="text-gray-500 dark:text-gray-400 w-24">Android:</span>
                            <span className="text-gray-900 dark:text-white font-medium">
                                {device.android_version || 'N/A'}
                            </span>
                        </div>
                        <div className="flex items-center text-sm">
                            <span className="text-gray-500 dark:text-gray-400 w-24">Device ID:</span>
                            <span className="text-gray-900 dark:text-white font-mono text-xs truncate">
                                {device.device_id}
                            </span>
                        </div>
                        <div className="flex items-center text-sm">
                            <span className="text-gray-500 dark:text-gray-400 w-24">Last Active:</span>
                            <span className="text-gray-900 dark:text-white">
                                {device.last_active_at ? new Date(device.last_active_at).toLocaleDateString() : 'Never'}
                            </span>
                        </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-2">
                        <Link
                            href={`/devices/${device.id}/edit`}
                            className="inline-flex items-center px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </Link>
                        <button
                            onClick={() => onDelete(device.id)}
                            className="inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

// List View Component
function ListView({ devices, onDelete }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Device
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Model
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Android
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Last Active
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {devices.map((device) => (
                            <tr key={device.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${device.status === 'active'
                                            ? 'bg-green-100 dark:bg-green-900/20'
                                            : device.status === 'inactive'
                                                ? 'bg-gray-100 dark:bg-gray-700'
                                                : 'bg-yellow-100 dark:bg-yellow-900/20'
                                            }`}>
                                            <svg className={`w-5 h-5 ${device.status === 'active'
                                                ? 'text-green-600 dark:text-green-400'
                                                : device.status === 'inactive'
                                                    ? 'text-gray-500'
                                                    : 'text-yellow-600 dark:text-yellow-400'
                                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {device.name || 'Unnamed Device'}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                                                {device.device_id}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {device.model || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {device.android_version || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${device.status === 'active'
                                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                                        : device.status === 'inactive'
                                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                                            : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                                        }`}>
                                        {device.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {device.last_active_at ? new Date(device.last_active_at).toLocaleString() : 'Never'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <Link
                                        href={`/devices/${device.id}/edit`}
                                        className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => onDelete(device.id)}
                                        className="inline-flex items-center text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
