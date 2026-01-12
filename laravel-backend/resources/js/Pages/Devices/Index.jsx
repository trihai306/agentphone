import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../Layouts/AppLayout';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { useTheme } from '@/Contexts/ThemeContext';

export default function Index({ devices }) {
    const { t } = useTranslation();
    const { showConfirm } = useConfirm();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [searchQuery, setSearchQuery] = useState('');

    const handleDelete = async (deviceId) => {
        const confirmed = await showConfirm({
            title: 'Delete Device',
            message: 'Are you sure you want to delete this device?',
            type: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel',
        });

        if (confirmed) {
            router.delete(`/devices/${deviceId}`);
        }
    };

    const filteredDevices = devices.data.filter(device =>
        device.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.device_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: devices.data.length,
        active: devices.data.filter(d => d.status === 'active').length,
        inactive: devices.data.filter(d => d.status === 'inactive').length,
    };

    return (
        <AppLayout title="Devices">
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[1400px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Devices
                            </h1>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                Manage your connected devices
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {[
                            { label: 'Total', value: stats.total },
                            { label: 'Active', value: stats.active },
                            { label: 'Inactive', value: stats.inactive },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className={`p-4 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}
                            >
                                <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {stat.label}
                                </p>
                                <p className={`text-2xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {stat.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="mb-6">
                        <div className="relative">
                            <svg
                                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search devices..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-sm ${isDark
                                        ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600'
                                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                    } border focus:outline-none`}
                            />
                        </div>
                    </div>

                    {/* Devices Table */}
                    {filteredDevices.length > 0 ? (
                        <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <table className="w-full">
                                <thead>
                                    <tr className={`border-b ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                                        <th className={`text-left py-3 px-4 text-xs font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Device
                                        </th>
                                        <th className={`text-left py-3 px-4 text-xs font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Model
                                        </th>
                                        <th className={`text-left py-3 px-4 text-xs font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Status
                                        </th>
                                        <th className={`text-left py-3 px-4 text-xs font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Last Active
                                        </th>
                                        <th className={`text-right py-3 px-4 text-xs font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDark ? 'divide-[#2a2a2a]' : 'divide-gray-100'}`}>
                                    {filteredDevices.map((device) => (
                                        <tr key={device.id} className={isDark ? 'hover:bg-[#222]' : 'hover:bg-gray-50'}>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                                                        <svg className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                            {device.name || 'Unnamed Device'}
                                                        </p>
                                                        <p className={`text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            {device.device_id?.slice(0, 20)}...
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`py-4 px-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {device.model || 'Unknown'}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${device.status === 'active'
                                                        ? isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                                                        : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${device.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                                    {device.status === 'active' ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className={`py-4 px-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {device.last_active_at
                                                    ? new Date(device.last_active_at).toLocaleDateString()
                                                    : 'Never'
                                                }
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={`/devices/${device.id}/edit`}
                                                        className={`px-3 py-1.5 text-sm font-medium rounded-md ${isDark
                                                                ? 'bg-white text-black hover:bg-gray-100'
                                                                : 'bg-gray-900 text-white hover:bg-gray-800'
                                                            }`}
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(device.id)}
                                                        className={`p-1.5 rounded-md ${isDark
                                                                ? 'text-gray-500 hover:text-red-400 hover:bg-red-900/20'
                                                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                                            }`}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={`rounded-lg p-16 text-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                            <div className={`w-14 h-14 mx-auto rounded-lg flex items-center justify-center mb-4 ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                                <svg className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {searchQuery ? 'No devices found' : 'No devices yet'}
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {searchQuery
                                    ? `No results for "${searchQuery}"`
                                    : 'Devices will appear when your Portal app connects'
                                }
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    {devices.last_page > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Page {devices.current_page} of {devices.last_page}
                            </p>
                            <div className="flex items-center gap-2">
                                {devices.prev_page_url && (
                                    <Link href={devices.prev_page_url} className={`px-3 py-1.5 text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                                        Previous
                                    </Link>
                                )}
                                {devices.next_page_url && (
                                    <Link href={devices.next_page_url} className={`px-3 py-1.5 text-sm font-medium rounded-md ${isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'}`}>
                                        Next
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
