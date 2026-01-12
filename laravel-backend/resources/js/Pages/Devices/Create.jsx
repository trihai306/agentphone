import { useForm, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useTheme } from '@/Contexts/ThemeContext';

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

    return (
        <AppLayout title="Add Device">
            <div className={`min-h-screen ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#fafafa]'}`}>
                <div className="max-w-[600px] mx-auto px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link
                            href="/devices"
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'}`}
                        >
                            <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Add Device
                            </h1>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                Register a new device
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className={`p-6 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-200'}`}>
                        <div className="space-y-5">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Device ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.device_id}
                                    onChange={(e) => setData('device_id', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
                                        } border focus:outline-none ${errors.device_id ? 'border-red-500' : ''}`}
                                    placeholder="e.g., ABC123XYZ456"
                                    required
                                />
                                {errors.device_id && (
                                    <p className="mt-1 text-sm text-red-500">{errors.device_id}</p>
                                )}
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Device Name
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
                                        } border focus:outline-none`}
                                    placeholder="e.g., My Phone"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Model
                                </label>
                                <input
                                    type="text"
                                    value={data.model}
                                    onChange={(e) => setData('model', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
                                        } border focus:outline-none`}
                                    placeholder="e.g., Samsung Galaxy S21"
                                />
                                {errors.model && (
                                    <p className="mt-1 text-sm text-red-500">{errors.model}</p>
                                )}
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    OS Version
                                </label>
                                <input
                                    type="text"
                                    value={data.android_version}
                                    onChange={(e) => setData('android_version', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
                                        } border focus:outline-none`}
                                    placeholder="e.g., 12.0"
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Status
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-lg text-sm ${isDark ? 'bg-[#222] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
                                        } border focus:outline-none`}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                            </div>
                        </div>

                        <div className={`flex items-center justify-end gap-3 mt-6 pt-6 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                            <Link
                                href="/devices"
                                className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                                    } disabled:opacity-50`}
                            >
                                {processing ? 'Adding...' : 'Add Device'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
