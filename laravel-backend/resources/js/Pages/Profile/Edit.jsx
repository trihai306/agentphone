import { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function Edit({ user }) {
    const { flash } = usePage().props;
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const profileForm = useForm({
        name: user.name,
        email: user.email,
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    function handleProfileSubmit(e) {
        e.preventDefault();
        profileForm.put('/profile');
    }

    function handlePasswordSubmit(e) {
        e.preventDefault();
        passwordForm.put('/profile/password', {
            onSuccess: () => passwordForm.reset(),
        });
    }

    return (
        <AppLayout title="Profile Settings">
            <div className="max-w-6xl">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                        Profile Settings
                    </h1>
                    <p className="text-base text-gray-600 dark:text-gray-400">
                        Manage your account information and security preferences
                    </p>
                </div>

                {/* Success Message */}
                {flash?.success && (
                    <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start space-x-3 shadow-sm animate-slide-down">
                        <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">{flash.success}</h3>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sidebar with Account Info */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700/50 p-8 sticky top-24">
                            <div className="text-center mb-6">
                                <div className="relative inline-block">
                                    <div className="w-28 h-28 mx-auto bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center text-white font-bold text-5xl shadow-xl shadow-blue-500/30 mb-4">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="absolute bottom-4 right-0 w-8 h-8 bg-emerald-500 border-4 border-white dark:border-gray-800 rounded-full shadow-lg"></div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                    {user.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 break-all px-4">
                                    {user.email}
                                </p>
                            </div>

                            <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <InfoItem
                                    icon="calendar"
                                    label="Member Since"
                                    value={new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                />
                                <InfoItem
                                    icon="shield"
                                    label="Account Status"
                                    value="Active"
                                    badge={true}
                                />
                                <InfoItem
                                    icon="devices"
                                    label="Total Devices"
                                    value="0 devices"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profile Information */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700/50 p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                        Profile Information
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Update your personal details
                                    </p>
                                </div>
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/40">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            </div>

                            <form onSubmit={handleProfileSubmit} className="space-y-6">
                                {/* Name */}
                                <FormField
                                    label="Full Name"
                                    icon="user"
                                    error={profileForm.errors.name}
                                >
                                    <input
                                        type="text"
                                        value={profileForm.data.name}
                                        onChange={e => profileForm.setData('name', e.target.value)}
                                        className={`w-full px-4 py-3.5 pl-12 border ${
                                            profileForm.errors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                                        } rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                        placeholder="John Doe"
                                    />
                                </FormField>

                                {/* Email */}
                                <FormField
                                    label="Email Address"
                                    icon="email"
                                    error={profileForm.errors.email}
                                >
                                    <input
                                        type="email"
                                        value={profileForm.data.email}
                                        onChange={e => profileForm.setData('email', e.target.value)}
                                        className={`w-full px-4 py-3.5 pl-12 border ${
                                            profileForm.errors.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                                        } rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                        placeholder="you@example.com"
                                    />
                                </FormField>

                                {/* Save Button */}
                                <div className="flex items-center justify-end space-x-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={profileForm.processing}
                                        className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
                                    >
                                        {profileForm.processing ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Save Changes</span>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Change Password */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700/50 p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                        Security Settings
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Keep your account secure with a strong password
                                    </p>
                                </div>
                                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/40">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                            </div>

                            <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                {/* Current Password */}
                                <PasswordField
                                    label="Current Password"
                                    show={showCurrentPassword}
                                    onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
                                    value={passwordForm.data.current_password}
                                    onChange={e => passwordForm.setData('current_password', e.target.value)}
                                    error={passwordForm.errors.current_password}
                                />

                                {/* New Password */}
                                <PasswordField
                                    label="New Password"
                                    show={showNewPassword}
                                    onToggle={() => setShowNewPassword(!showNewPassword)}
                                    value={passwordForm.data.password}
                                    onChange={e => passwordForm.setData('password', e.target.value)}
                                    error={passwordForm.errors.password}
                                />

                                {/* Confirm Password */}
                                <PasswordField
                                    label="Confirm New Password"
                                    show={showPasswordConfirmation}
                                    onToggle={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                    value={passwordForm.data.password_confirmation}
                                    onChange={e => passwordForm.setData('password_confirmation', e.target.value)}
                                />

                                {/* Update Button */}
                                <div className="flex items-center justify-end space-x-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={passwordForm.processing}
                                        className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-600/40 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
                                    >
                                        {passwordForm.processing ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Updating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Update Password</span>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function InfoItem({ icon, label, value, badge }) {
    const icons = {
        calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
        shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
        devices: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
    };

    return (
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
                    </svg>
                </div>
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
            </div>
            {badge && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    Active
                </span>
            )}
        </div>
    );
}

function FormField({ label, icon, error, children }) {
    const icons = {
        user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
        email: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    };

    return (
        <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                {label}
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
                    </svg>
                </div>
                {children}
            </div>
            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
            </p>}
        </div>
    );
}

function PasswordField({ label, show, onToggle, value, onChange, error }) {
    return (
        <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                {label}
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    className={`w-full px-4 py-3.5 pl-12 pr-12 border ${
                        error ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                    } rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    placeholder="••••••••"
                />
                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                    {show ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    )}
                </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
            </p>}
        </div>
    );
}
